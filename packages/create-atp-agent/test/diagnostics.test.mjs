import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { recordDiagnostic } from '../template/diagnostics.mjs';

test('consent, schema, retention and disable path', () => {
  const dir = mkdtempSync(join(tmpdir(), 'atp-diagnostics-'));
  const file = join(dir, 'diagnostics/events.jsonl');
  const env = { ATP_DIAGNOSTICS_DIR: dir };
  try {
    assert.equal(recordDiagnostic('install', env), false);
    assert.equal(existsSync(file), false);
    env.ATP_DIAGNOSTICS = '1';
    const now = new Date('2026-10-21T12:00:00Z');
    assert.equal(recordDiagnostic('install', env, now), true);
    assert.equal(recordDiagnostic('secret-payload', env, now), false);
    writeFileSync(file, JSON.stringify({ day: '2020-01-01', event: 'error' }) + '\n' + JSON.stringify({ day: '2026-10-21', event: 'install', secret: 'remove' }) + '\n');
    recordDiagnostic('first_run', env, now);
    assert.deepEqual(readFileSync(file, 'utf8').trim().split('\n').map(JSON.parse), [{ day: '2026-10-21', event: 'install' }, { day: '2026-10-21', event: 'first_run' }, { day: '2026-10-21', event: 'run_success' }]);
    recordDiagnostic('first_run', env, now);
    const events = readFileSync(file, 'utf8').trim().split('\n').map(JSON.parse);
    assert.equal(events.filter(r => r.event === 'first_run').length, 1);
    assert.equal(events.filter(r => r.event === 'run_success').length, 2);
    const before = readFileSync(file, 'utf8');
    env.ATP_DIAGNOSTICS = '0';
    assert.equal(recordDiagnostic('error', env), false);
    assert.equal(readFileSync(file, 'utf8'), before);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
