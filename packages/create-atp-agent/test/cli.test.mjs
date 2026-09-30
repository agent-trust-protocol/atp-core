import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function tempDir() { return mkdtemp(path.join(tmpdir(), 'atp-cli-test-')); }

test('terminal-only scaffold creates a runnable ESM starter without an invented identity', async () => {
  const cwd = await tempDir();
  try {
    const run = spawnSync(process.execPath, [path.join(packageRoot, 'dist/index.js'), 'test-agent', '--no-dashboard', '--skip-install'], { cwd, encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /npm install && npm start/);
    const agent = await readFile(path.join(cwd, 'test-agent/agent.mjs'), 'utf8');
    assert.match(agent, /Agent.quickstart\('test-agent'\)/);
    assert.doesNotMatch(agent, /getTrustScore/);
    const pkg = JSON.parse(await readFile(path.join(cwd, 'test-agent/package.json'), 'utf8'));
    assert.equal(pkg.dependencies['atp-sdk'], '^2.1.0');
    assert.deepEqual((await readdir(path.join(cwd, 'test-agent'))).filter(n => n === '.atp.json'), []);
  } finally { await rm(cwd, { recursive: true, force: true }); }
});

test('local configuration endpoint never claims to have issued a DID or keys', async () => {
  const cwd = await tempDir();
  const child = spawn(process.execPath, [path.join(packageRoot, 'dist/stamp.js'), '--no-open', '--port', '0'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    await writeFile(path.join(cwd, 'package.json'), '{"name":"existing-agent"}');
    const url = await new Promise((resolve, reject) => {
      let output = '';
      const timeout = setTimeout(() => reject(new Error('server did not start')), 5000);
      child.stdout.on('data', chunk => {
        output += chunk;
        const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
        if (match) { clearTimeout(timeout); resolve(match[0]); }
      });
      child.on('exit', code => { clearTimeout(timeout); reject(new Error(`server exited ${code}`)); });
    });
    const response = await fetch(url + '/api/agents/onboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test', profileId: 'safe-default' }) });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.identityStatus, 'not-created');
    assert.equal(body.did, undefined);
    assert.equal(body.quantumSafe, undefined);
    const config = JSON.parse(await readFile(path.join(cwd, '.atp.json'), 'utf8'));
    assert.equal(config.profile, 'safe-default');
    assert.equal(config.did, undefined);
    assert.equal((await fetch(url + '/api/agents/onboard', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Bad', profileId: 'unrecognized' }) })).status, 400);
  } finally {
    child.kill();
    await rm(cwd, { recursive: true, force: true });
  }
});
