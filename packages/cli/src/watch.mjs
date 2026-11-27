import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/watch.css', ['watch.css', 'text/css; charset=utf-8']],
  ['/watch.js', ['watch.js', 'text/javascript; charset=utf-8']],
]);

export async function watchDemo({ open = true } = {}) {
  const content = new Map(await Promise.all([...assets].map(async ([route, [file, type]]) => [
    route, { type, body: await readFile(new URL(`./watch/${file}`, import.meta.url)) },
  ])));
  const server = createServer((req, res) => {
    const address = server.address();
    if (req.headers.host !== `127.0.0.1:${address.port}`) {
      res.writeHead(403).end();
      return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    const file = content.get(req.url);
    if (!file) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      'Content-Type': file.type,
      'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    }).end(req.method === 'HEAD' ? undefined : file.body);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const url = `http://127.0.0.1:${server.address().port}/`;
  process.stdout.write(`ATP Agent Watch simulation: ${url}\nPress Ctrl+C to stop.\n`);
  if (open) {
    const launcher = { darwin: 'open', win32: 'explorer.exe' }[process.platform] ?? 'xdg-open';
    const child = spawn(launcher, [url], { detached: true, stdio: 'ignore' });
    child.on('error', () => process.stderr.write('Open the printed URL in your browser.\n'));
    child.unref();
  }
}
