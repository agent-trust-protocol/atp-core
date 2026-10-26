// Corpus-free tests of the mapping rules and the disagreement checker. They use synthetic inputs
// and synthetic reports; nothing here reads the lab corpus.
import test from 'node:test';
import assert from 'node:assert/strict';
import { decide } from '../fixture-policy.mjs';
import { mapRefusalReason, observationUsed } from './lab-revision3.mjs';
import { KNOWN_DISAGREEMENTS, disagreements, unchanged } from './check-known-disagreements.mjs';

const base = () => ({
  operator: { id: 'operator', issuer: 'fixture', active: true, canGrant: true },
  grant: { agentDid: 's', issuerVerified: true, proofVerified: true, issuedBy: 'operator', issuer: 'fixture',
    actions: ['read'], resource: 'grant:g1', audience: 'fixture-resource', notBefore: 0, expiresAt: 120000 },
  request: { agentDid: 's', action: 'read', resource: 'grant:g1', audience: 'fixture-resource' },
  status: { available: true, checkedAt: 30000, revokedAt: null },
  now: 30000,
});
const mapped = (input) => mapRefusalReason(decide(input), input);

test('out_of_scope splits into the two lab classes by inputs, binding first, audience unmapped', () => {
  const op = base(); op.request.action = 'write';
  assert.equal(mapped(op), 'operation_not_permitted');
  const bind = base(); bind.request.resource = 'grant:g2';
  assert.equal(mapped(bind), 'evidence_binding_mismatch');
  const both = base(); both.request.resource = 'grant:g2'; both.request.action = 'write';
  assert.equal(mapped(both), 'evidence_binding_mismatch', 'lab precedence: binding before operation');
  const aud = base(); aud.request.audience = 'other';
  assert.equal(mapped(aud), 'unmapped:out_of_scope(audience)');
});

test('precedence difference the corpus does not exercise is visible, not hidden', () => {
  // ATP refuses scope before lease and status; the lab would say evidence_expired here and
  // authority_not_determined below. Recorded as a known difference in the report, §5.
  const expiredWrite = base(); expiredWrite.request.action = 'write'; expiredWrite.now = 121000; expiredWrite.status.checkedAt = 121000;
  assert.equal(decide(expiredWrite).reason, 'out_of_scope');
  assert.equal(mapped(expiredWrite), 'operation_not_permitted');
  const downWrite = base(); downWrite.request.action = 'write'; downWrite.status.available = false;
  assert.equal(mapped(downWrite), 'operation_not_permitted');
});

test('observation instant is the status actually consulted, or null when none was', () => {
  const allow = base();
  assert.equal(observationUsed(decide(allow), allow), 30000);
  const revoked = base(); revoked.status.revokedAt = 10000;
  assert.equal(observationUsed(decide(revoked), revoked), 30000);
  const down = base(); down.status.available = false;
  assert.equal(decide(down).reason, 'status_not_current');
  assert.equal(observationUsed(decide(down), down), null);
  // Available but dated before the call: refused, and the record names the observed instant.
  const stale = base(); stale.status.checkedAt = 29000;
  assert.equal(decide(stale).reason, 'status_not_current');
  assert.equal(observationUsed(decide(stale), stale), 29000);
  for (const make of [() => { const i = base(); i.request.action = 'write'; return i; },
    () => { const i = base(); i.request.resource = 'grant:g2'; return i; },
    () => { const i = base(); i.now = 121000; i.status.checkedAt = 121000; return i; }]) {
    const input = make();
    assert.equal(observationUsed(decide(input), input), null, 'refused before status was consulted');
  }
});

test('disagreement checker rejects added, removed and altered disagreements', () => {
  const row = (id, observed, expected) => ({ id, atp_reason: 'out_of_scope', fields: ['grant_ref.observation_as_of_ms'],
    observed: { grant_ref: { observation_as_of_ms: observed } }, expected: { grant_ref: { observation_as_of_ms: expected } } });
  const known = { mismatches: [row('LRA-09-r1', null, 0), row('LRA-09-r2', null, 30000)] };
  assert.deepEqual(disagreements(known), KNOWN_DISAGREEMENTS);
  assert.ok(unchanged(known));
  assert.ok(!unchanged({ mismatches: [] }), 'removed');
  assert.ok(!unchanged({ mismatches: [...known.mismatches, row('LRA-03-r2', null, 1)] }), 'added');
  assert.ok(!unchanged({ mismatches: [row('LRA-09-r1', 5, 0), row('LRA-09-r2', null, 30000)] }), 'observed value altered');
  assert.ok(!unchanged({ mismatches: [row('LRA-09-r1', null, 1), row('LRA-09-r2', null, 30000)] }), 'expected value altered');
  assert.ok(!unchanged({ mismatches: [row('LRA-09-r2', null, 30000), row('LRA-09-r1', null, 0)] }), 'reordered');
  const otherField = { ...row('LRA-09-r1', null, 0), fields: ['refusal_reason'] };
  assert.ok(!unchanged({ mismatches: [otherField, row('LRA-09-r2', null, 30000)] }), 'field altered');
});
