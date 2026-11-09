import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const nodeMajor = Number(process.versions.node.split('.')[0]);
const result = spawnSync(process.execPath, ['scripts/verify-published-entry-points.mjs'], { encoding: 'utf8', timeout: 240000 });
if (result.error) throw result.error;
if (nodeMajor < 20) {
  // The published SDK and starter now declare Node >=20. Test npm's engine check.
  assert.notEqual(result.status, 0, 'Expected the pinned packages to reject Node 18');
  assert.match(result.stderr, /EBADENGINE/);
  assert.match(result.stderr, /Not compatible with your version of node\/npm: (?:atp-sdk|create-atp-agent)@\d+\.\d+\.\d+/);
  console.log('CONFIRMED UNSUPPORTED: npm engine validation rejects Node 18. Use Node 20 or newer.');
} else {
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exitCode = result.status ?? 1;
}
