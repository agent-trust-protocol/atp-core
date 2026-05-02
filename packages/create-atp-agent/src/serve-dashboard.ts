import { execSync } from 'node:child_process';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import chalk from 'chalk';

const DEFAULT_PORT = 3456;
const MAX_PORT_TRIES = 10;

export type DashboardMode = 'create' | 'stamp';

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

export interface AgentContext {
  projectName: string;
  projectDir: string;
  language: 'typescript' | 'javascript';
  agentFile: string;
}

async function handleOnboardPost(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  stateDir: string,
  agentContext: AgentContext | null
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

  const name = body.name;
  const profileId = body.profileId;
  const runtime = body.runtime ?? 'custom';
  const environment = body.environment ?? 'dev';
  const capabilities = Array.isArray(body.capabilities)
    ? (body.capabilities as string[])
    : ['tools', 'messaging'];

  if (!name || !profileId) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing required fields: name, profileId' }));
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
    capabilities,
    quantumSafe: true,
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

  // If the dashboard was launched by the scaffolder, write a minimal .atp.json
  // into the project so the generated agent picks it up on start.
  if (agentContext) {
    try {
      await writeFile(
        path.join(agentContext.projectDir, '.atp.json'),
        JSON.stringify(
          {
            did,
            profile: profileId,
            quantumSafe: true,
            capabilities
          },
          null,
          2
        ),
        'utf8'
      );
    } catch {
      // non-fatal
    }
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function handleContextGet(
  res: http.ServerResponse,
  agentContext: AgentContext | null,
  mode: DashboardMode
): void {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  if (!agentContext) {
    res.end(JSON.stringify({ scaffolded: false, mode }));
    return;
  }
  res.end(
    JSON.stringify({
      scaffolded: true,
      mode,
      projectName: agentContext.projectName,
      language: agentContext.language,
      agentFile: agentContext.agentFile
    })
  );
}

export interface StartDashboardOptions {
  port?: number;
  openBrowser?: boolean;
  agentContext?: AgentContext;
  mode?: DashboardMode;
  logLines?: string[];
}

/**
 * Serves the embedded onboarding UI and a mock POST /api/agents/onboard (same shape as the Next.js route).
 * Blocks until the server is closed.
 */
export function startOnboardingDashboard(options: StartDashboardOptions = {}): Promise<void> {
  const dashboardRoot = getDashboardRoot();
  const stateDir = path.join(process.cwd(), '.create-atp-agent');
  const agentContext = options.agentContext ?? null;
  const mode: DashboardMode = options.mode ?? 'create';

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
          await handleOnboardPost(req, res, stateDir, agentContext);
          return;
        }

        if (req.method === 'GET' && url.pathname === '/api/context') {
          handleContextGet(res, agentContext, mode);
          return;
        }

        if (req.method !== 'GET' && req.method !== 'HEAD') {
          res.writeHead(405);
          res.end();
          return;
        }

        const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
        const resolved = safeResolveUnder(dashboardRoot, pathname);
        if (!resolved) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }

        const filePath = resolved;
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

    let announced = false;
    const onListening = () => {
      if (announced) return;
      announced = true;

      const address = server.address();
      const actualPort =
        typeof address === 'object' && address && 'port' in address ? address.port : DEFAULT_PORT;
      const url = `http://127.0.0.1:${actualPort}`;

      console.log(chalk.green('✓ Launching embedded onboarding dashboard'));
      console.log(chalk.green(`✓ Opening ${url}`));

      const lines = options.logLines ?? [
        '✓ Dashboard ready — complete setup in your browser',
        '✓ To skip dashboard: npm start'
      ];
      for (const line of lines) {
        console.log(chalk.green(line));
      }

      if (open) {
        openBrowser(url + '/');
      }

      server.on('close', () => resolve());
    };

    const tryListen = (port: number, triesLeft: number) => {
      const onError = (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE' && triesLeft > 0) {
          tryListen(port + 1, triesLeft - 1);
        } else {
          reject(err);
        }
      };
      server.once('error', onError);
      server.listen(port, '127.0.0.1', () => {
        server.removeListener('error', onError);
        onListening();
      });
    };

    tryListen(options.port ?? DEFAULT_PORT, MAX_PORT_TRIES - 1);
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
