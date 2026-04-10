import { execSync } from 'node:child_process';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_PORT = 3456;
const MAX_PORT_TRIES = 20;

export function getDashboardRoot(): string {
  return path.join(__dirname, '../dashboard');
}

function contentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.ico') return 'image/x-icon';
  return 'application/octet-stream';
}

function safeResolveUnder(root: string, requestPath: string): string | null {
  const relative = requestPath.replace(/^\/+/, '');
  const candidate = path.normalize(path.join(root, relative));
  if (!candidate.startsWith(path.normalize(root + path.sep))) {
    return null;
  }
  return candidate;
}

function openBrowser(url: string): void {
  const platform = process.platform;
  try {
    if (platform === 'darwin') {
      execSync(`open "${url}"`, { stdio: 'ignore' });
    } else if (platform === 'win32') {
      execSync(`start "" "${url}"`, { shell: 'cmd.exe', stdio: 'ignore' });
    } else {
      execSync(`xdg-open "${url}"`, { stdio: 'ignore' });
    }
  } catch {
    // Non-fatal: user can open URL manually
  }
}

async function handleOnboardPost(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  stateDir: string
): Promise<void> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    return;
  }

  const runtime = body.runtime;
  const name = body.name;
  const profileId = body.profileId;
  const environment = body.environment ?? 'dev';

  if (!runtime || !name || !profileId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing required fields: runtime, name, profileId' }));
    return;
  }

  const agentId = `agent-${String(name).toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
  const did = `did:atp:${agentId}`;
  const payload = {
    id: agentId,
    agentId,
    did,
    name,
    runtime,
    environment,
    profileId,
    createdAt: new Date().toISOString()
  };

  try {
    await mkdir(stateDir, { recursive: true });
    await writeFile(
      path.join(stateDir, 'last-onboard.json'),
      JSON.stringify(payload, null, 2),
      'utf8'
    );
  } catch {
    // optional persistence
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

export interface StartDashboardOptions {
  port?: number;
  openBrowser?: boolean;
}

/**
 * Serves the embedded onboarding UI and a mock POST /api/agents/onboard (same shape as the Next.js route).
 * Blocks until the server is closed.
 */
export function startOnboardingDashboard(options: StartDashboardOptions = {}): Promise<void> {
  const dashboardRoot = getDashboardRoot();
  const stateDir = path.join(process.cwd(), '.create-atp-agent');

  if (!existsSync(dashboardRoot)) {
    console.error(chalk.red(`Dashboard assets missing at ${dashboardRoot}`));
    process.exit(1);
  }

  const open = options.openBrowser !== false;

  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

        if (req.method === 'POST' && url.pathname === '/api/agents/onboard') {
          await handleOnboardPost(req, res, stateDir);
          return;
        }

        if (req.method !== 'GET' && req.method !== 'HEAD') {
          res.writeHead(405);
          res.end();
          return;
        }

        let pathname = url.pathname === '/' ? '/index.html' : url.pathname;
        const resolved = safeResolveUnder(dashboardRoot, pathname);
        if (!resolved) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }

        let filePath = resolved;
        if (!existsSync(filePath)) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }

        res.setHeader('Content-Type', contentType(filePath));
        if (req.method === 'HEAD') {
          res.writeHead(200);
          res.end();
          return;
        }

        createReadStream(filePath).pipe(res);
      } catch (err) {
        console.error(err);
        if (!res.headersSent) {
          res.writeHead(500);
        }
        res.end('Internal Server Error');
      }
    });

    const tryListen = (port: number, triesLeft: number) => {
      server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE' && triesLeft > 0) {
          tryListen(port + 1, triesLeft - 1);
        } else {
          reject(err);
        }
      });

      server.listen(port, '127.0.0.1', () => {
        const address = server.address();
        const actualPort =
          typeof address === 'object' && address && 'port' in address ? address.port : port;
        const url = `http://127.0.0.1:${actualPort}/`;

        console.log(chalk.green(`\n✓ Onboarding dashboard: ${url}`));
        console.log(chalk.gray('  Press Ctrl+C to stop the server.\n'));

        if (open) {
          openBrowser(url);
        }

        server.on('close', () => resolve());
      });
    };

    tryListen(options.port ?? DEFAULT_PORT, MAX_PORT_TRIES);
  });
}

/** For tests: read persisted last onboard payload if present (written under cwd). */
export async function readLastOnboardState(cwd = process.cwd()): Promise<unknown | null> {
  const p = path.join(cwd, '.create-atp-agent', 'last-onboard.json');
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(await readFile(p, 'utf8')) as unknown;
  } catch {
    return null;
  }
}
