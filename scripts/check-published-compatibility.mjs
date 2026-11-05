import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const result = spawnSync(process.execPath, ['scripts/verify-published-entry-points.mjs'], { encoding: 'utf8', timeout: 240000 });
if (result.error) throw result.error;
if (Number(process.versions.node.split('.')[0]) < 20) {
  // A negative compatibility probe, never a claim that Node 18 is supported.
  assert.notEqual(result.status, 0, 'Reassess the published Node 18 compatibility finding: the flow now succeeds');
  assert.match(result.stderr, /Failed to initialize agent: Cannot read properties of undefined \(reading 'getRandomValues'\)/);
  console.log('CONFIRMED UNSUPPORTED: pinned published SDK first run fails on Node 18 (missing Web Crypto). Use Node 20/24.');
} else {
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exitCode = result.status ?? 1;
}
