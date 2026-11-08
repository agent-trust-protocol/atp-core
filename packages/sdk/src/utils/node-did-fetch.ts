/** Node-only DID transport. Never re-export from the browser-facing SDK root. */
import { lookup as dnsLookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request } from 'node:https';
import { checkServerIdentity, type SecureContextOptions } from 'node:tls';
import { Readable } from 'node:stream';
import { DidResolutionError } from './resolver.js';

export interface DidAddress { address: string; family: 4 | 6 }
export interface NodeDidFetchOptions {
  /** Trusted DNS provider override. Answers are still validated and pinned. */
  resolveAddresses?: (hostname: string) => Promise<readonly DidAddress[]>;
  /** Optional trust roots (replace Node defaults when supplied); TLS verification stays on. */
  ca?: SecureContextOptions['ca'];
  /** Explicit exceptions scoped to exact HTTPS origin AND IP address. Empty by default. */
  privateAddressAllowlist?: readonly { origin: string; addresses: readonly string[] }[];
}

interface ParsedAddress { address: string; family: 4 | 6; value: bigint }
function parseAddress(address: string): ParsedAddress | undefined {
  if (typeof address !== 'string' || address.includes('%')) return undefined;
  const family = isIP(address);
  if (family === 4) {
    return { address, family, value: address.split('.').reduce((n, part) => (n << 8n) | BigInt(part), 0n) };
  }
  if (family !== 6) return undefined;
  // Node's URL parser canonicalizes IPv4 tails and compressed IPv6 after isIP validation.
  const canonical = new URL(`https://[${address}]/`).hostname.slice(1, -1);
  const [left, right] = canonical.split('::');
  const first = left ? left.split(':') : [];
  const last = right ? right.split(':') : [];
  const groups = right === undefined ? first : [...first, ...Array(8 - first.length - last.length).fill('0'), ...last];
  return { address: canonical, family, value: groups.reduce((n, part) => (n << 16n) | BigInt(`0x${part}`), 0n) };
}
function inRange(value: bigint, network: string, bits: number): boolean {
  const base = parseAddress(network)!;
  const shift = BigInt((base.family === 4 ? 32 : 128) - bits);
  return (value >> shift) === (base.value >> shift);
}

// Conservative policy: deny special-purpose IPv4 blocks (including globally
// reachable special-purpose exceptions), multicast and reserved space. IPv6
// permits only 2000::/3 minus special-purpose blocks. This is a reviewed static
// policy, not a guarantee of routability. Sources and limitations are in README.
const DENIED_V4: readonly [string, number][] = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.31.196.0', 24], ['192.52.193.0', 24], ['192.88.99.0', 24], ['192.168.0.0', 16],
  ['192.175.48.0', 24], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
  ['224.0.0.0', 4], ['240.0.0.0', 4],
  // Azure platform virtual IP: public-shaped but not an Internet destination.
  ['168.63.129.16', 32]
];
const DENIED_V6: readonly [string, number][] = [
  ['2001::', 23], ['2001:db8::', 32], ['2002::', 16],
  ['2620:4f:8000::', 48], ['3fff::', 20]
];
/** @internal Conservative address classification; not an Internet reachability test. */
export function isPublicDidAddress(address: string): boolean {
  const parsed = parseAddress(address);
  if (!parsed) return false;
  if (parsed.family === 4) return !DENIED_V4.some(([base, bits]) => inRange(parsed.value, base, bits));
  return inRange(parsed.value, '2000::', 3) && !DENIED_V6.some(([base, bits]) => inRange(parsed.value, base, bits));
}

function abortable<T>(promise: Promise<T>, signal?: AbortSignal | null): Promise<T> {
  if (!signal) return promise;
  return new Promise<T>((resolve, reject) => {
    const abort = () => {
      signal.removeEventListener('abort', abort);
      reject(new DidResolutionError('aborted', 'Node DID transport aborted'));
    };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    promise.then(value => { signal.removeEventListener('abort', abort); resolve(value); },
      error => { signal.removeEventListener('abort', abort); reject(error); });
  });
}

/** GET-only fetch adapter for DidAtpResolver. The resolver owns redirects/deadlines/body caps. */
export function createNodeDidFetch(options: NodeDidFetchOptions = {}): typeof fetch {
  const resolveAddresses = options.resolveAddresses ?? (async hostname => {
    const records = await dnsLookup(hostname, { all: true, verbatim: true });
    return records.map(record => ({ address: record.address, family: record.family as 4 | 6 }));
  });
  const ca = options.ca;
  const exceptions = new Map<string, Set<string>>();
  const configured = options.privateAddressAllowlist ?? [];
  if (!Array.isArray(configured)) throw new RangeError('privateAddressAllowlist must be an array');
  for (const entry of configured) {
    let origin: URL;
    try {
      if (typeof entry.origin !== 'string' || !/^https:\/\/[^/?#\\]+\/?$/i.test(entry.origin)) throw new Error();
      origin = new URL(entry.origin);
      if (origin.username || origin.password || origin.pathname !== '/' || origin.hostname.includes('*')) throw new Error();
    } catch { throw new RangeError('Private-address exceptions require an exact HTTPS origin'); }
    if (!Array.isArray(entry.addresses) || entry.addresses.length === 0) {
      throw new RangeError('Private-address exceptions require explicit IP addresses');
    }
    const addresses = exceptions.get(origin.origin) ?? new Set<string>();
    for (const address of entry.addresses) {
      const parsed = parseAddress(address);
      if (!parsed) throw new RangeError('Invalid IP address in private-address exception');
      addresses.add(parsed.address);
    }
    exceptions.set(origin.origin, addresses);
  }
  return (async (input, init = {}) => {
    if ((typeof input !== 'string' && !(input instanceof URL)) ||
        (init.method && init.method !== 'GET') || init.body != null || init.redirect !== 'manual') {
      throw new TypeError('Node DID fetch supports only URL GET requests with manual redirects');
    }
    const url = new URL(String(input));
    if (url.protocol !== 'https:' || url.username || url.password) {
      throw new DidResolutionError('insecureUrl', 'Node DID transport requires HTTPS without credentials');
    }
    if (init.signal?.aborted) throw new DidResolutionError('aborted', 'Node DID transport aborted');
    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    const literal = parseAddress(hostname);
    const answers = literal ? [literal] : await abortable(resolveAddresses(hostname), init.signal);
    if (init.signal?.aborted) throw new DidResolutionError('aborted', 'Node DID transport aborted');
    if (!Array.isArray(answers) || answers.length === 0) {
      throw new DidResolutionError('destinationNotAllowed', 'DNS returned no approved destination');
    }
    const approved: ParsedAddress[] = [];
    for (const answer of answers) {
      const parsed = answer && parseAddress(answer.address);
      if (!parsed || parsed.family !== answer.family ||
          (!isPublicDidAddress(parsed.address) && !exceptions.get(url.origin)?.has(parsed.address))) {
        throw new DidResolutionError('destinationNotAllowed', 'Destination address is not allowed');
      }
      approved.push(parsed);
    }
    // Snapshot one validated address. No second hostname lookup, fallback, pool,
    // or proxy is used. TLS identity and HTTP Host still use the requested host.
    const pinned = approved[0];
    const headers = new Headers(init.headers);
    headers.set('host', url.host);
    headers.set('accept-encoding', 'identity');
    const outgoing: Record<string, string> = {};
    headers.forEach((value, name) => { outgoing[name] = value; });
    return new Promise<Response>((resolve, reject) => {
      const req = request({
        protocol: 'https:', hostname: pinned.address, family: pinned.family,
        port: url.port || 443, path: url.pathname + url.search, method: 'GET',
        headers: outgoing, agent: false, ca, rejectUnauthorized: true,
        servername: isIP(hostname) ? undefined : hostname,
        checkServerIdentity: (_name, certificate) => checkServerIdentity(hostname, certificate),
        signal: init.signal ?? undefined, maxHeaderSize: 16 * 1024
      }, incoming => {
        const encoding = incoming.headers['content-encoding'];
        if (encoding && encoding !== 'identity') {
          incoming.destroy();
          reject(new DidResolutionError('invalidDidDocument', 'Node DID transport requires an uncompressed response'));
          return;
        }
        try {
          const status = incoming.statusCode ?? 500;
          const responseHeaders = new Headers();
          for (const [name, value] of Object.entries(incoming.headers)) {
            if (value !== undefined) responseHeaders.set(name, Array.isArray(value) ? value.join(', ') : value);
          }
          const noBody = [204, 205, 304].includes(status);
          const body = noBody ? null : Readable.toWeb(incoming) as ReadableStream<Uint8Array>;
          if (noBody) incoming.destroy();
          const response = new Response(body, { status, headers: responseHeaders });
          Object.defineProperty(response, 'url', { value: url.href });
          resolve(response);
        } catch (error) { incoming.destroy(); reject(error); }
      });
      req.once('error', reject);
      req.end();
    });
  }) as typeof fetch;
}
