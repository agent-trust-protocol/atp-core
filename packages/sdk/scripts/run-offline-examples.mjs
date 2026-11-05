// Runs every example that needs no ATP services and fails if any exits non-zero.
// Requires a built dist/ (run `npm run build` first).
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../examples/', import.meta.url));
const examples = [
  ['00-quickstart.js'],
  ['00-quickstart-local.js'],
  ['09-multi-protocol-support.js', { EXAMPLE: 'all' }],
  ['11-quantum-safe-demo.js'],
  ['12-zkp-agent-authentication.js'],
];

let failed = 0;
for (const [file, env = {}] of examples) {
  const run = spawnSync(process.execPath, [file], { cwd: dir, env: { ...process.env, ...env }, encoding: 'utf8', timeout: 60_000 });
  const ok = run.status === 0;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${file}`);
  if (!ok) console.log(run.stdout.slice(-2000), run.stderr.slice(-2000));
}
process.exitCode = failed ? 1 : 0;
