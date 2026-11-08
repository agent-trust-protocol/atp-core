/** Production Node transport over controlled verified TLS; no global TLS bypass. */
import { createServer, type Server } from 'node:https';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createNodeDidFetch, resolveDidWithNodeEgress, type NodeDidFetchOptions } from '../../node';
import { DidAtpResolver } from '../../utils/resolver';
import { DidAtpDocument } from '../../utils/did-document';
import { CryptoUtils } from '../../utils/crypto';

const settle = async (condition: () => boolean) => {
  for (let i = 0; i < 50 && !condition(); i++) await new Promise(resolve => setTimeout(resolve, 5));
  expect(condition()).toBe(true);
};

describe('NET-06: Node address checks and connection pinning', () => {
  let directory: string;
  let server: Server;
  let origin: string;
  let originOther: string;
  let originIp: string;
  let ca: Buffer;
  let requests = 0;
  let connections = 0;
  let host: string | undefined;
  let servername: string | undefined;
  let document: any;
  let did: string;
  const sockets = new Set<import('node:stream').Duplex>();
  const lookup = async () => [{ address: '127.0.0.1', family: 4 as const }];
  const config = (): NodeDidFetchOptions => ({
    ca, resolveAddresses: lookup,
    privateAddressAllowlist: [{ origin, addresses: ['127.0.0.1'] }]
  });

  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), 'atp-node-egress-'));
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes',
      '-keyout', join(directory, 'key.pem'), '-out', join(directory, 'cert.pem'),
      '-days', '1', '-subj', '/CN=resolver.test', '-addext', 'subjectAltName=DNS:resolver.test'], { stdio: 'ignore' });
    ca = readFileSync(join(directory, 'cert.pem'));
    server = createServer({ key: readFileSync(join(directory, 'key.pem')), cert: ca }, (req, res) => {
      requests++; host = req.headers.host; servername = (req.socket as import('node:tls').TLSSocket & { servername?: string | false }).servername || undefined;
      if (req.url === '/redirect') { res.writeHead(302, { location: '/final' }); res.end(); }
      else if (req.url === '/cross-origin') { res.writeHead(302, { location: `${originOther}/final` }); res.end(); }
      else if (req.url === '/stall') { /* deadline must close the socket */ }
      else if (req.url === '/stall-body') { res.writeHead(200); res.flushHeaders(); res.write(' '); }
      else if (req.url === '/large') {
        res.writeHead(200);
        const interval = setInterval(() => res.write(Buffer.alloc(16 * 1024, 32)), 2);
        res.on('close', () => clearInterval(interval));
      } else if (req.url === '/compressed') { res.writeHead(200, { 'content-encoding': 'gzip' }); res.end('{}'); }
      else res.end(JSON.stringify(document));
    });
    server.on('connection', socket => {
      connections++; sockets.add(socket); socket.once('close', () => sockets.delete(socket));
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as { port: number }).port;
    origin = `https://resolver.test:${port}`;
    originOther = `https://other.test:${port}`;
    originIp = `https://127.0.0.1:${port}`;
    const created = await DidAtpDocument.create(`resolver.test%3A${port}`, ['agent'], await CryptoUtils.generateHybridKeyPair());
    document = created.document; did = created.did;
  });

  beforeEach(async () => { await settle(() => sockets.size === 0); requests = 0; connections = 0; });
  afterAll(async () => {
    for (const socket of sockets) socket.destroy();
    if (server) await new Promise<void>(resolve => { server.close(() => resolve()); server.closeAllConnections(); });
    if (directory) rmSync(directory, { recursive: true, force: true });
  });

  it('blocks a literal private address before opening a socket', async () => {
    await expect(DidAtpResolver.fetchDidJson(`${originIp}/final`, { fetch: createNodeDidFetch() }))
      .rejects.toMatchObject({ code: 'destinationNotAllowed' });
    expect(connections).toBe(0); expect(requests).toBe(0);
  });

  it('blocks a hostname resolving to loopback before opening a socket', async () => {
    await expect(DidAtpResolver.fetchDidJson(`${origin}/final`, { fetch: createNodeDidFetch({ resolveAddresses: lookup }) }))
      .rejects.toMatchObject({ code: 'destinationNotAllowed' });
    expect(connections).toBe(0);
  });

  it('rejects all answers if public and private DNS records are mixed', async () => {
    const fetch = createNodeDidFetch({ resolveAddresses: async () => [
      { address: '8.8.8.8', family: 4 }, { address: '127.0.0.1', family: 4 }
    ] });
    await expect(DidAtpResolver.fetchDidJson(`${origin}/final`, { fetch }))
      .rejects.toMatchObject({ code: 'destinationNotAllowed' });
    expect(connections).toBe(0);
  });

  it('pins one DNS snapshot while preserving original TLS hostname and HTTP Host', async () => {
    const resolveAddresses = jest.fn().mockResolvedValueOnce(await lookup())
      .mockResolvedValue([{ address: '127.0.0.2', family: 4 }]);
    const result = await resolveDidWithNodeEgress(did, { egress: { ...config(), resolveAddresses } });
    expect(result.did).toBe(did);
    expect(resolveAddresses).toHaveBeenCalledTimes(1);
    expect(host).toBe(new URL(origin).host); expect(servername).toBe('resolver.test');
    expect(requests).toBe(1); expect(connections).toBe(1);
  });

  it('revalidates DNS at each hop and blocks a changed address before reconnecting', async () => {
    const resolveAddresses = jest.fn().mockResolvedValueOnce(await lookup())
      .mockResolvedValueOnce([{ address: '127.0.0.2', family: 4 }]);
    await expect(DidAtpResolver.fetchDidJson(`${origin}/redirect`, {
      fetch: createNodeDidFetch({ ...config(), resolveAddresses })
    })).rejects.toMatchObject({ code: 'destinationNotAllowed' });
    expect(resolveAddresses).toHaveBeenCalledTimes(2);
    expect(connections).toBe(1); expect(requests).toBe(1);
  });

  it('does not treat redirect-origin approval as permission to use a private address', async () => {
    await expect(DidAtpResolver.fetchDidJson(`${origin}/cross-origin`, {
      allowedRedirectOrigins: [originOther], fetch: createNodeDidFetch(config())
    })).rejects.toMatchObject({ code: 'destinationNotAllowed' });
    expect(requests).toBe(1); expect(connections).toBe(1);
  });

  it('checks the original hostname certificate even after an explicit private exception', async () => {
    const fetch = createNodeDidFetch({ ...config(), privateAddressAllowlist: [{ origin: originOther, addresses: ['127.0.0.1'] }] });
    await expect(fetch(`${originOther}/final`, { redirect: 'manual' }))
      .rejects.toMatchObject({ code: 'ERR_TLS_CERT_ALTNAME_INVALID' });
    expect(requests).toBe(0);
  });

  it('does not trust the fixture certificate without the configured CA', async () => {
    const { ca: _ca, ...withoutCa } = config();
    await expect(createNodeDidFetch(withoutCa)(`${origin}/final`, { redirect: 'manual' }))
      .rejects.toHaveProperty('code', 'DEPTH_ZERO_SELF_SIGNED_CERT');
    expect(requests).toBe(0);
  });

  it('cancels a stalled DNS provider without issuing a request', async () => {
    await expect(DidAtpResolver.fetchDidJson(`${origin}/final`, {
      timeoutMs: 20, fetch: createNodeDidFetch({ resolveAddresses: () => new Promise(() => {}) })
    })).rejects.toMatchObject({ code: 'timeout' });
    expect(connections).toBe(0);
  });

  it('does not dispatch a late approved DNS answer after the deadline', async () => {
    let deliver!: (answers: Awaited<ReturnType<typeof lookup>>) => void;
    const resolveAddresses = () => new Promise<Awaited<ReturnType<typeof lookup>>>(resolve => { deliver = resolve; });
    await expect(DidAtpResolver.fetchDidJson(`${origin}/final`, {
      timeoutMs: 20, fetch: createNodeDidFetch({ ...config(), resolveAddresses })
    })).rejects.toMatchObject({ code: 'timeout' });
    deliver(await lookup());
    await new Promise(resolve => setImmediate(resolve));
    expect(connections).toBe(0); expect(requests).toBe(0);
  });

  it('does not accept an injected fetch override through the protected entry point', async () => {
    const fetch = jest.fn();
    const fp = 'A'.repeat(43);
    const privateDid = `did:atp:127.0.0.1:agent:e1_${fp}:pq1_${fp}`;
    await expect(resolveDidWithNodeEgress(privateDid, { fetch } as any))
      .rejects.toMatchObject({ code: 'destinationNotAllowed' });
    expect(fetch).not.toHaveBeenCalled(); expect(connections).toBe(0);
  });

  it.each(['/stall', '/stall-body'])('aborts %s and releases its socket', async path => {
    await expect(DidAtpResolver.fetchDidJson(`${origin}${path}`, {
      timeoutMs: 100, fetch: createNodeDidFetch(config())
    })).rejects.toMatchObject({ code: 'timeout' });
    await settle(() => sockets.size === 0);
  });

  it('propagates oversized-stream cancellation to the production transport socket', async () => {
    await expect(DidAtpResolver.fetchDidJson(`${origin}/large`, { fetch: createNodeDidFetch(config()) }))
      .rejects.toMatchObject({ code: 'invalidDidDocument' });
    await settle(() => sockets.size === 0);
  });

  it('rejects compressed responses rather than bypassing the decoded-byte cap', async () => {
    await expect(DidAtpResolver.fetchDidJson(`${origin}/compressed`, { fetch: createNodeDidFetch(config()) }))
      .rejects.toMatchObject({ code: 'invalidDidDocument' });
  });

  it('snapshots private exceptions and does not mutate default policy', async () => {
    const addresses = ['127.0.0.1'];
    const fetch = createNodeDidFetch({ ...config(), privateAddressAllowlist: [{ origin, addresses }] });
    addresses.length = 0;
    await expect(DidAtpResolver.fetchDidJson(`${origin}/final`, { fetch })).resolves.toHaveProperty('id');
    await expect(DidAtpResolver.fetchDidJson(`${origin}/final`, {
      fetch: createNodeDidFetch({ resolveAddresses: lookup })
    })).rejects.toMatchObject({ code: 'destinationNotAllowed' });
    expect(requests).toBe(1);
  });
});
