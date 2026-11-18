import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAudit } from './package-audit.mjs';
const now = Date.parse('2026-11-18T00:00:00Z');
const advisory = { name: 'picomatch', source: 1247710, severity: 'high',
  url: 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf' };
const report = (via = advisory) => ({ auditReportVersion: 2, vulnerabilities: {
  picomatch: { via: [via] }, parent: { via: ['picomatch'] } } });
test('only the exact withdrawn advisory and its dependency chain are excluded temporarily', () => {
  const result = evaluateAudit(report(), 'high', now);
  assert.equal(result.blocked.length, 0);
  assert.equal(result.ignored.length, 1);
  assert.equal(evaluateAudit(report(), 'high', Date.parse('2026-11-25T00:00:00Z')).blocked.length, 1);
});
test('all other advisories keep the production/full severity thresholds', () => {
  for (const change of [{ source: 999 }, { url: 'https://github.com/advisories/other' }, { name: 'other' }])
    assert.equal(evaluateAudit(report({ ...advisory, ...change }), 'high', now).blocked.length, 1);
  const r = report({ ...advisory, source: 999, severity: 'moderate' });
  assert.equal(evaluateAudit(r, 'low', now).blocked.length, 1);
  assert.equal(evaluateAudit(r, 'high', now).blocked.length, 0);
});
test('mixed real and withdrawn findings still fail', () => {
  const r = report();
  r.vulnerabilities.picomatch.via.push({ ...advisory, source: 999, url: 'https://example.com/other' });
  assert.equal(evaluateAudit(r, 'high', now).blocked.length, 1);
});
test('invalid reports and unresolved graph references fail closed', () => {
  for (const r of [null, {}, { error: {} }, { auditReportVersion: 2, vulnerabilities: [] },
    { auditReportVersion: 2, vulnerabilities: { a: { via: ['missing'] } } },
    { auditReportVersion: 2, vulnerabilities: { a: { via: ['b'] }, b: { via: ['a'] } } },
    report({ ...advisory, severity: 'unknown' })])
    assert.throws(() => evaluateAudit(r, 'high', now));
});
