/** Controlled TLS fixtures for NET-01/02/03/04. TLS verification stays enabled.
 * A test-only HTTPS fetch adapter trusts only the generated fixture certificate.
 * This exercises real socket I/O, not native browser/Undici interoperability.
 */
import * as https from 'node:https';
import * as http from 'node:http';
import { Readable } from 'node:stream';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { DidAtpResolver } from '../../utils/resolver';

const listen = (server: http.Server) => new Promise<number>(resolve => {
  server.listen(0, '127.0.0.1', () => resolve((server.address() as { port: number }).port));
});
const close = (server: http.Server) => new Promise<void>(resolve => {
  server.close(() => resolve()); server.closeAllConnections();
});

describe('DID resolver controlled HTTPS transport', () => {
  let directory: string;
  let server: https.Server;
  let target: http.Server;
  let origin: string;
  let fetch: typeof globalThis.fetch;
  let insecureRequests = 0;
  let receivedBytes = 0;
  let sockets: Set<import('node:stream').Duplex>;

  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), 'atp-resolver-tls-'));
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes',
      '-keyout', join(directory, 'key.pem'), '-out', join(directory, 'cert.pem'),
      '-days', '1', '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1'],
      { stdio: 'ignore' });
    const cert = readFileSync(join(directory, 'cert.pem'));
    target = http.createServer((_req, res) => { insecureRequests++; res.end('{}'); });
    const targetPort = await listen(target);
    sockets = new Set();
    server = https.createServer({ key: readFileSync(join(directory, 'key.pem')), cert }, (req, res) => {
      if (req.url === '/downgrade') {
        res.writeHead(302, { location: `http://127.0.0.1:${targetPort}/did.json` }); res.end();
      } else if (req.url === '/loop') {
        res.writeHead(302, { location: '/loop' }); res.end();
      } else if (req.url === '/stall-headers') {
        // Deliberately leave the request open until the client deadline aborts.
      } else if (req.url === '/stall-body') {
        res.writeHead(200); res.flushHeaders(); res.write(' ');
      } else if (req.url === '/large') {
        res.writeHead(200); // chunked; no Content-Length
        const interval = setInterval(() => res.write(Buffer.alloc(16 * 1024, 32)), 2);
        res.on('close', () => clearInterval(interval));
      } else {
        res.end('{"id":"did:atp:example.com"}');
      }
    });
    server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
    origin = `https://127.0.0.1:${await listen(server)}`;
    fetch = ((input: string, init: RequestInit) => new Promise<Response>((resolve, reject) => {
      if (init.redirect !== 'manual') { reject(new Error('Fixture requires manual redirect mode')); return; }
      const request = https.request(String(input), {
        ca: cert, signal: init.signal ?? undefined, headers: init.headers as Record<string, string>, agent: false
      }, response => {
        response.on('data', chunk => { receivedBytes += chunk.length; });
        const body = Readable.toWeb(response) as ReadableStream<Uint8Array>;
        const headers = new Headers();
        for (const [name, value] of Object.entries(response.headers)) {
          if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
        }
        const result = new Response(body, { status: response.statusCode, headers });
        Object.defineProperty(result, 'url', { value: String(input) });
        resolve(result);
      });
      request.on('error', reject); request.end();
    })) as typeof globalThis.fetch;
  });

  afterAll(async () => {
    if (sockets) for (const socket of sockets) socket.destroy();
    if (server) await close(server);
    if (target) await close(target);
    if (directory) rmSync(directory, { recursive: true, force: true });
  });

  it('fetches a document over verified local TLS', async () => {
    await expect(DidAtpResolver.fetchDidJson(`${origin}/ok`, { fetch }))
      .resolves.toEqual({ id: 'did:atp:example.com' });
  });

  it('NET-01: never contacts the HTTP redirect target', async () => {
    await expect(DidAtpResolver.fetchDidJson(`${origin}/downgrade`, { fetch }))
      .rejects.toMatchObject({ code: 'insecureUrl' });
    expect(insecureRequests).toBe(0);
  });

  it('NET-02: bounds a real redirect loop', async () => {
    await expect(DidAtpResolver.fetchDidJson(`${origin}/loop`, { fetch, maxRedirects: 2 }))
      .rejects.toMatchObject({ code: 'redirectLimit' });
  });

  it('NET-03: cancels a real oversized chunked response', async () => {
    receivedBytes = 0;
    await expect(DidAtpResolver.fetchDidJson(`${origin}/large`, { fetch }))
      .rejects.toMatchObject({ code: 'invalidDidDocument' });
    expect(receivedBytes).toBeGreaterThan(256 * 1024);
    expect(receivedBytes).toBeLessThan(512 * 1024);
  });

  it.each(['/stall-headers', '/stall-body'])('NET-04: aborts %s over TLS', async path => {
    await expect(DidAtpResolver.fetchDidJson(`${origin}${path}`, { fetch, timeoutMs: 150 }))
      .rejects.toMatchObject({ code: 'timeout' });
  });
});
