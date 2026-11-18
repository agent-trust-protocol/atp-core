// npm may retain withdrawn advisories. Only the named, time-bounded exception
// below is recognized; malformed reports and all other findings fail closed.
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const WITHDRAWN_URL = 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf';
const EXPIRES = Date.parse('2026-11-25T00:00:00Z');
const LEVELS = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };

export function evaluateAudit(report, threshold, now = Date.now()) {
  if (!(threshold in LEVELS) || !report || report.error || report.auditReportVersion !== 2 ||
      !report.vulnerabilities || typeof report.vulnerabilities !== 'object' ||
      Array.isArray(report.vulnerabilities)) throw new Error('Invalid audit report or threshold');
  const findings = new Map();
  const ignored = new Set();
  const walk = (name, trail = new Set()) => {
    if (trail.has(name)) return;
    const item = report.vulnerabilities[name];
    if (!item || !Array.isArray(item.via) || !item.via.length) throw new Error('Incomplete audit dependency');
    for (const via of item.via) {
      if (typeof via === 'string') {
        walk(via, new Set([...trail, name]));
      } else {
        if (!via || !(via.severity in LEVELS) || typeof via.url !== 'string' ||
            !Number.isInteger(via.source)) throw new Error('Invalid audit advisory');
        if (name === 'picomatch' && via.name === 'picomatch' && via.source === 1247710 &&
            via.url === WITHDRAWN_URL && now < EXPIRES) {
          ignored.add(via.url);
        } else {
          findings.set(via.source, via);
        }
      }
    }
  };
  for (const name of Object.keys(report.vulnerabilities)) walk(name);
  if (Object.keys(report.vulnerabilities).length && !findings.size && !ignored.size)
    throw new Error('Audit graph has no identifiable advisory');
  return { blocked: [...findings.values()].filter(v => LEVELS[v.severity] >= LEVELS[threshold]),
    findings: [...findings.values()], ignored: [...ignored] };
}

export function main(args) {
  const [pkg, scope] = args;
  if (args.length !== 2 || !/^[a-z][a-z0-9-]*$/.test(pkg || '') || !['production', 'full'].includes(scope))
    throw new Error('Usage: package-audit.mjs <package> <production|full>');
  const threshold = scope === 'production' ? 'low' : 'high';
  const audit = spawnSync('npm', ['audit', '--prefix', `packages/${pkg}`, '--json',
    ...(scope === 'production' ? ['--omit=dev'] : [])],
    { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 120000 });
  if (audit.error || ![0, 1].includes(audit.status)) throw new Error('npm audit did not produce a successful report');
  const result = evaluateAudit(JSON.parse(audit.stdout), threshold);
  for (const url of result.ignored)
    console.log(`Withdrawn advisory exception until 2026-11-25 UTC: ${url}`);
  for (const finding of result.findings) console.log(`${finding.severity}: ${finding.url}`);
  console.log(`${pkg} ${scope}: ${result.blocked.length} blocking advisory/advisories (threshold ${threshold})`);
  return result.blocked.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.exitCode = main(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
