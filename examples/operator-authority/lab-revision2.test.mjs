import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runRevision2 } from './lab-revision2.mjs';

const path = process.env.ATP_LAB_REVISION2_VECTORS;
test('revision-2 mapping, tamper gate, positive control and dispatch falsification', { skip: !path && 'Set ATP_LAB_REVISION2_VECTORS to pinned lab corpus' }, () => {
  const bytes = readFileSync(path);
  const result = runRevision2(bytes);
  assert.equal(result.cases, 12);
  assert.equal(result.calls, 44);
  assert.equal(result.matched, 44);
  assert.throws(() => runRevision2(Buffer.concat([bytes, Buffer.from('\n')])), /digest mismatch/);
  assert.ok(runRevision2(bytes, 'deny-everything').matched < 44);
  assert.ok(runRevision2(bytes, 'deny-but-dispatch').matched < 44);
  assert.ok(result.records.some(r => r.refusal_reason === 'mandate_revoked'));
  assert.ok(result.records.some(r => r.refusal_reason === 'status_not_current'));
});
