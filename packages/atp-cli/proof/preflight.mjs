import { spawnSync } from 'node:child_process';
const available = name => spawnSync('sh', ['-c', 'command -v "$1"', 'check', name], { encoding: 'utf8' }).status === 0;
let localModel = false;
try {
  const response = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(3000), redirect: 'error' });
  const body = await response.json();
  localModel = response.ok && Array.isArray(body.models) && body.models.length > 0;
} catch { /* No hosted fallback. */ }
const checks = { docker: available('docker'), postgres: available('postgres'), localModel };
console.log(JSON.stringify({ checks, status: localModel && (checks.docker || checks.postgres) ? 'PREREQUISITES_ONLY' : 'BLOCKED',
  liveProofRun: false, paidApiCalls: 0 }, null, 2));
process.exitCode = localModel && (checks.docker || checks.postgres) ? 0 : 2;
