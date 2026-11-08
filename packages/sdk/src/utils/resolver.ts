import { DidAtp, ParsedAtpDid } from './did.js';
import { DidAtpDocument } from './did-document.js';
import { AtpDidDocument } from '../types.js';

/**
 * did:atp v2 resolution (spec "Method Operations / Resolve").
 *
 * Resolution is did:web/did:wba-style did.json retrieval: the DID's domain
 * and path segments map to an HTTPS URL hosting the DID Document, which is
 * then validated with the mandatory dual-binding verification from Phase 3
 * (both path fingerprints AND both proofs — eddsa-jcs-2022 and the
 * RFC 9964 ML-DSA-65 JWS). Resolution MUST fail if any single check fails;
 * a valid classical proof is never sufficient on its own.
 *
 * URL transformation (did:wba rules):
 *   did:atp:<domain>                          → https://<domain>/.well-known/did.json
 *   did:atp:<domain>:<p1>:…:<pN>:e1_…:pq1_…   → https://<domain>/<p1>/…/<pN>/did.json
 *
 * A did:web-style "%3A<port>" suffix on the domain becomes ":<port>" in the
 * URL authority. The fingerprint segments are binding material, not path —
 * they never appear in the URL.
 *
 * Deactivate (did:wba/did:web convention): the controller deactivates a DID
 * by simply ceasing to serve its did.json — there is no tombstone document.
 * A deactivated DID is therefore indistinguishable from one that never
 * existed: resolution fails with DidResolutionError('notFound'). Update is
 * similarly out-of-band: rotating either binding key changes the DID (see
 * DidAtpDocument.rotate()), so the old DID's did.json is replaced or
 * removed, after which resolving the old DID fails with 'didMismatch' (new
 * document served at the same path) or 'notFound' (removed).
 */

export type DidResolutionErrorCode =
  | 'invalidDid'
  | 'insecureUrl'
  | 'notFound'
  | 'invalidDidDocument'
  | 'didMismatch'
  | 'verificationFailed'
  | 'redirectLimit'
  | 'timeout'
  | 'aborted';

export class DidResolutionError extends Error {
  constructor(
    public readonly code: DidResolutionErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'DidResolutionError';
  }
}

export interface ResolveOptions {
  /** Fetch implementation override (e.g. for tests). Defaults to global fetch. */
  fetch?: typeof fetch;
  /** Total transport deadline including redirects and body reads (default 10s). */
  timeoutMs?: number;
  /** Maximum redirects followed after the initial request (default 5). */
  maxRedirects?: number;
  /** Optional caller cancellation, combined with the transport deadline. */
  signal?: AbortSignal;
}

export interface DidResolutionResult {
  did: string;
  /** The HTTPS URL the document was retrieved from. */
  documentUrl: string;
  document: AtpDidDocument;
}

/**
 * Maximum accepted size of a fetched did.json. A conformant DID document with
 * two verification methods and dual proofs is a few KB; 256 KiB is a generous
 * ceiling on retained response bytes (transport buffers and the current chunk
 * are allocated by the fetch implementation).
 */
const MAX_DID_JSON_BYTES = 256 * 1024;

export class DidAtpResolver {
  /**
   * Map a did:atp identifier to the HTTPS URL of its did.json document.
   * Throws DidResolutionError('invalidDid') if the DID does not parse.
   */
  static didToUrl(did: string): string {
    const parsed = DidAtp.parse(did);
    if (!parsed) {
      throw new DidResolutionError('invalidDid', `Not a valid did:atp identifier: "${did}"`);
    }
    return this.parsedToUrl(parsed);
  }

  private static parsedToUrl(parsed: ParsedAtpDid): string {
    // did:web rule: a percent-encoded "%3A<port>" in the domain becomes the
    // URL authority's ":<port>".
    const authority = parsed.domain.replace(/%3[aA]/, ':');
    if (parsed.type === 'root') {
      return `https://${authority}/.well-known/did.json`;
    }
    return `https://${authority}/${parsed.path.join('/')}/did.json`;
  }

  /**
   * Resolve a did:atp identifier: fetch its did.json over HTTPS and run the
   * mandatory dual-binding verification. Throws DidResolutionError on any
   * failure — there is no partially-valid result.
   *
   * Root DIDs (no fingerprint segments) carry no binding material and cannot
   * satisfy dual-binding verification, so only path-type DIDs resolve.
   */
  static async resolve(did: string, options: ResolveOptions = {}): Promise<DidResolutionResult> {
    const parsed = DidAtp.parse(did);
    if (!parsed) {
      throw new DidResolutionError('invalidDid', `Not a valid did:atp identifier: "${did}"`);
    }
    if (parsed.type !== 'path') {
      throw new DidResolutionError(
        'invalidDid',
        'Only path-type did:atp identifiers (with e1_/pq1_ binding fingerprints) are resolvable'
      );
    }

    const documentUrl = this.parsedToUrl(parsed);
    const document = await this.fetchDidJson(documentUrl, options);

    if (document.id !== parsed.did) {
      throw new DidResolutionError(
        'didMismatch',
        `Retrieved document id "${document.id}" does not match requested DID "${parsed.did}"`
      );
    }

    const { valid, errors } = await DidAtpDocument.verify(document);
    if (!valid) {
      throw new DidResolutionError(
        'verificationFailed',
        `Dual-binding verification failed: ${errors.join('; ')}`
      );
    }

    return { did: parsed.did, documentUrl, document };
  }

  /**
   * Fetch a did.json using manual HTTPS redirects, a total deadline and a
   * streaming 256 KiB body cap. Deployment egress policy remains the caller's
   * responsibility; HTTPS alone does not prevent private-network access.
   * Fetch overrides must honor manual redirects and should honor AbortSignal.
   */
  static async fetchDidJson(url: string, options: ResolveOptions = {}): Promise<AtpDidDocument> {
    const timeoutMs = options.timeoutMs ?? 10_000;
    const maxRedirects = options.maxRedirects ?? 5;
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2_147_483_647 ||
        !Number.isSafeInteger(maxRedirects) || maxRedirects < 0 || maxRedirects > 20) {
      throw new RangeError('timeoutMs must be a positive timer-safe integer and maxRedirects must be 0..20');
    }
    const checkedUrl = (input: string, base?: URL): URL => {
      let target: URL;
      try { target = new URL(input, base); } catch {
        throw new DidResolutionError('insecureUrl', 'Invalid did.json URL');
      }
      if (target.protocol !== 'https:' || target.username || target.password) {
        throw new DidResolutionError('insecureUrl', 'did:atp resolution requires HTTPS without URL credentials');
      }
      return target;
    };
    let current = checkedUrl(url);
    const controller = new AbortController();
    let timedOut = false;
    let response: Response | undefined;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    const cancelBody = (): void => {
      // Never let a misbehaving transport's cancellation block the deadline.
      const cancellation = reader ? reader.cancel() : response?.body?.cancel();
      void cancellation?.catch(() => {});
    };
    const abortError = () => new DidResolutionError(
      timedOut ? 'timeout' : 'aborted',
      timedOut ? 'did.json transport deadline exceeded' : 'did.json request aborted'
    );
    const checkAbort = () => {
      if (controller.signal.aborted) throw abortError();
    };
    let onAbort: () => void;
    const aborted = new Promise<never>((_resolve, reject) => {
      onAbort = () => { cancelBody(); reject(abortError()); };
      controller.signal.addEventListener('abort', onAbort, { once: true });
    });
    const forwardAbort = () => controller.abort();
    options.signal?.addEventListener('abort', forwardAbort, { once: true });
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    if (options.signal?.aborted) controller.abort();

    const run = async (): Promise<AtpDidDocument> => {
      const fetchImpl = options.fetch ?? fetch;
      for (let hops = 0; ; hops++) {
        checkAbort();
        response = await fetchImpl(current.toString(), {
          headers: { accept: 'application/did+json, application/json' },
          redirect: 'manual', signal: controller.signal
        });
        // A late response from an override that ignored abort must be closed.
        if (controller.signal.aborted) { cancelBody(); checkAbort(); }
        if (response.url) {
          const actual = checkedUrl(response.url);
          if (actual.href !== current.href) {
            throw new DidResolutionError('insecureUrl', 'Fetch override followed a redirect despite manual mode');
          }
        }
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          const location = response.headers.get('location');
          if (!location) throw new DidResolutionError('notFound', 'Redirect has no Location header');
          const target = checkedUrl(location, current);
          if (hops >= maxRedirects) {
            throw new DidResolutionError('redirectLimit', 'did.json redirect limit exceeded');
          }
          await response.body?.cancel();
          current = target;
          continue;
        }
        if (!response.ok) {
          throw new DidResolutionError('notFound', `did.json fetch returned HTTP ${response.status}`);
        }
        const advertised = Number(response.headers.get('content-length'));
        if (Number.isFinite(advertised) && advertised > MAX_DID_JSON_BYTES) {
          throw new DidResolutionError('invalidDidDocument', `did.json exceeds the ${MAX_DID_JSON_BYTES}-byte limit`);
        }
        if (!response.body) {
          throw new DidResolutionError('invalidDidDocument', 'did.json has no response body');
        }
        reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let size = 0;
        try {
          while (true) {
            const { value, done } = await reader.read();
            checkAbort();
            if (done) break;
            size += value.byteLength;
            if (size > MAX_DID_JSON_BYTES) {
              throw new DidResolutionError('invalidDidDocument', `did.json exceeds the ${MAX_DID_JSON_BYTES}-byte limit`);
            }
            chunks.push(value.slice());
          }
        } finally {
          // Cancel before releasing the reader on incomplete or failed reads.
          if (size > MAX_DID_JSON_BYTES || controller.signal.aborted) cancelBody();
          reader.releaseLock();
          reader = undefined;
        }
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
        let document: unknown;
        try { document = JSON.parse(new TextDecoder().decode(bytes)); } catch {
          throw new DidResolutionError('invalidDidDocument', 'did.json is not valid JSON');
        }
        if (typeof document !== 'object' || document === null ||
            typeof (document as { id?: unknown }).id !== 'string') {
          throw new DidResolutionError('invalidDidDocument', 'Response is not a DID Document');
        }
        return document as AtpDidDocument;
      }
    };
    try {
      return await Promise.race([run(), aborted]);
    } catch (error) {
      if (controller.signal.aborted) throw abortError();
      if (error instanceof DidResolutionError) throw error;
      throw new DidResolutionError('notFound', `Failed to fetch/read did.json: ${(error as Error).message}`);
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', forwardAbort);
      controller.signal.removeEventListener('abort', onAbort!);
      cancelBody();
    }
  }
}
