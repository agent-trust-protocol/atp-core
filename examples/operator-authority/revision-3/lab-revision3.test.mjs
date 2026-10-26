import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runRevision3, CORPUS_SHA256 } from './lab-revision3.mjs';
import { runRevision2, CORPUS_SHA256 as REVISION2_SHA256 } from '../lab-revision2.mjs';
import { disagreements, unchanged } from './check-known-disagreements.mjs';

const path3 = process.env.ATP_LAB_REVISION3_VECTORS;
const path2 = process.env.ATP_LAB_REVISION2_VECTORS;
const required = process.env.ATP_REQUIRE_LAB_CORPUS === '1';
const skipUnless = (path, name) => (!path && !required) && `Set ${name} to the pinned lab corpus`;

test('corpus variables are present when the lab corpus is required', { skip: !required && 'ATP_REQUIRE_LAB_CORPUS not set' }, () => {
  assert.ok(path3, 'ATP_LAB_REVISION3_VECTORS must be set when ATP_REQUIRE_LAB_CORPUS=1');
  assert.ok(path2, 'ATP_LAB_REVISION2_VECTORS must be set when ATP_REQUIRE_LAB_CORPUS=1');
});

// This is a regression test on the comparison's output. It passes while the comparison still
// disagrees with the lab on two grant references; it is not a revision-3 conformance pass.
test('revision-3 comparison regression: 44/44 actions, 44/44 reasons, 42/44 grant_ref with LRA-09-r1/-r2 disclosed, tamper gate, falsification', { skip: skipUnless(path3, 'ATP_LAB_REVISION3_VECTORS') }, () => {
  const bytes = readFileSync(path3);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), CORPUS_SHA256);
  const result = runRevision3(bytes);
  assert.equal(result.cases, 12);
  assert.equal(result.calls, 44);
  assert.equal(result.action_matched, 44, 'every action decision and callback outcome must match');
  assert.equal(result.reason_matched, 44, 'every declared refusal reason must match');
  // The known, disclosed disagreement: on the two write calls the lab model has consulted status
  // before refusing the operation; ATP's evaluator refuses scope first and used no observation.
  assert.equal(result.grant_ref_matched, 42);
  assert.deepEqual(result.mismatches.map(m => [m.id, m.fields.join()]),
    [['LRA-09-r1', 'grant_ref.observation_as_of_ms'], ['LRA-09-r2', 'grant_ref.observation_as_of_ms']]);
  for (const m of result.mismatches) {
    assert.equal(m.observed.grant_ref.observation_as_of_ms, null);
    assert.equal(m.observed.refusal_reason, 'operation_not_permitted');
    assert.ok(m.note);
  }
  // Every revision-3 reason value occurs at least once in the profile and is produced by the mapping.
  for (const reason of ['evidence_binding_mismatch', 'evidence_expired', 'authority_not_determined', 'authority_revoked', 'operation_not_permitted']) {
    assert.ok(result.records.some(r => r.reason_match && r.observed.refusal_reason === reason), reason);
  }
  assert.ok(!result.records.some(r => String(r.observed.refusal_reason).startsWith('unmapped:')));
  // grant_ref names the evidence presented, not the requested grant, on the binding mismatch.
  const mismatchRow = result.records.find(r => r.id === 'LRA-12-r2');
  assert.deepEqual(mismatchRow.observed.grant_ref, { grant: 'g1', evidence_id: 'e1', issued_at_ms: 0, expires_at_ms: 120000, observation_as_of_ms: null });
  assert.ok(mismatchRow.grant_ref_match);

  assert.throws(() => runRevision3(Buffer.concat([bytes, Buffer.from('\n')])), /digest mismatch/);
  assert.ok(runRevision3(bytes, 'deny-everything').action_matched < 44);
  assert.ok(runRevision3(bytes, 'deny-but-dispatch').action_matched < 44);
  const folded = runRevision3(bytes, 'fold-undetermined-into-revoked');
  assert.ok(folded.reason_matched < 44);
  assert.ok(folded.records.filter(r => !r.reason_match).every(r => r.atp_reason === 'status_not_current'));
  const renamed = runRevision3(bytes, 'name-requested-grant');
  assert.ok(renamed.grant_ref_matched < 42);
  assert.ok(!renamed.records.find(r => r.id === 'LRA-12-r2').grant_ref_match);
});

test('action and callback mismatches are reported as separate fields with their real values', { skip: skipUnless(path3, 'ATP_LAB_REVISION3_VECTORS') }, () => {
  const bytes = readFileSync(path3);
  // A deny that still reaches the callback: only downstream_reached differs.
  const dispatched = disagreements(runRevision3(bytes, 'deny-but-dispatch'));
  const reached = dispatched.filter(d => d.field === 'downstream_reached');
  assert.ok(reached.length > 0);
  assert.ok(reached.every(d => d.observed === true && d.expected === false));
  assert.ok(!dispatched.some(d => d.field.includes('/')));
  // Every permit turned into a deny: action_decision differs with its real values.
  const denied = disagreements(runRevision3(bytes, 'deny-everything'));
  const decisions = denied.filter(d => d.field === 'action_decision');
  assert.equal(decisions.length, 20);
  assert.ok(decisions.every(d => d.observed === 'deny' && d.expected === 'permit'));
  assert.ok(denied.filter(d => d.field === 'downstream_reached').every(d => d.observed === false && d.expected === true));
  // Both change the disagreement set, so the checker would exit 1.
  assert.ok(!unchanged(runRevision3(bytes, 'deny-but-dispatch')));
  assert.ok(!unchanged(runRevision3(bytes, 'deny-everything')));
  assert.ok(unchanged(runRevision3(bytes)));
});

test('revision-2 mapping and its report are unchanged', { skip: skipUnless(path2, 'ATP_LAB_REVISION2_VECTORS') }, () => {
  const bytes = readFileSync(path2);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), REVISION2_SHA256);
  const report = runRevision2(bytes);
  assert.equal(report.matched, 44);
  // The frozen revision-2 report digest, as the CLI prints it (JSON, two-space indent, newline).
  const printed = `${JSON.stringify(report, null, 2)}\n`;
  assert.equal(createHash('sha256').update(printed).digest('hex'),
    'f6110feb3a48d3734e554ee25182ada7bbf6c50af6696000e507931062b3d342');
});
