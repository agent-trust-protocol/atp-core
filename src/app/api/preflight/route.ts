import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as net from 'net';

const execAsync = promisify(exec);

function checkPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('listening', () => { server.close(); resolve(true); });
    server.once('error', () => resolve(false));
    server.listen(port, '127.0.0.1');
  });
}

export async function GET() {
  const nodeVersion = process.version;
  const nodeMajor = parseInt(nodeVersion.replace('v', '').split('.')[0], 10);

  const nodeCheck = {
    ok: nodeMajor >= 18,
    value: nodeVersion,
    fix: nodeMajor < 18
      ? 'Install Node.js 18 or newer from https://nodejs.org — the LTS release is recommended.'
      : undefined,
    error: nodeMajor < 18
      ? `Node.js ${nodeVersion} detected. ATP requires Node 18 or newer.`
      : undefined
  };

  let npmCheck: { ok: boolean; value?: string; error?: string; fix?: string };
  try {
    const { stdout } = await execAsync('npm --version', { timeout: 5000 });
    npmCheck = { ok: true, value: `npm ${stdout.trim()}` };
  } catch {
    npmCheck = {
      ok: false,
      error: 'npm was not found in PATH.',
      fix: 'Install Node.js from https://nodejs.org — it bundles npm automatically.'
    };
  }

  let portCheck: { ok: boolean; value?: string; error?: string; fix?: string; warning?: boolean };
  try {
    const available = await checkPortAvailable(3456);
    portCheck = available
      ? { ok: true, value: 'Port 3456 is available' }
      : {
          ok: true,
          warning: true,
          value: 'Port 3456 is in use',
          error: 'Port 3456 is already occupied on this machine.',
          fix: 'ATP will automatically pick the next available port. No action needed unless you need port 3456 specifically.'
        };
  } catch {
    portCheck = {
      ok: true,
      warning: true,
      value: 'Could not determine port status',
      fix: 'ATP will select an available port automatically.'
    };
  }

  return NextResponse.json({
    node: nodeCheck,
    npm: npmCheck,
    port: portCheck,
    allClear: nodeCheck.ok && npmCheck.ok
  });
}
