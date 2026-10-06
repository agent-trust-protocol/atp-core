import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_PROFILES, evaluateActionWithProfile } from '../dist/index.js';

function legacy(profile, { actionType, state }) {
  const control = profile.controls[actionType];
  if (control?.allowed === false) return control.require_approval ? 'require_approval' : 'deny';
  const policy = profile.state_policies?.[state];
  if (policy?.restricted_tools?.includes(actionType)) return 'deny';
  if (policy?.require_approval_for?.includes(actionType)) return 'require_approval';
  return 'allow';
}
test('all four built-ins preserve SDK 2.1 decisions', () => {
  assert.deepEqual(Object.keys(BUILTIN_PROFILES), ['safe-default', 'dev-mode', 'enterprise-locked', 'openclaw-sandbox']);
  for (const profile of Object.values(BUILTIN_PROFILES))
    for (const state of [undefined, 'planning', 'executing', 'communicating', 'completed', 'unknown'])
      for (const actionType of ['shell', 'filesystem', 'network', 'credentials', 'messaging', 'logs-read', 'unknown']) {
        const context = { state, actionType };
        const actual = evaluateActionWithProfile(profile, context);
        assert.equal(actual.decision, legacy(profile, context));
        assert.equal(actual.allowed, actual.decision === 'allow');
        assert.equal(evaluateActionWithProfile(profile, { sessionState: state, actionType }).decision, actual.decision);
      }
});
test('trust requirements fail closed without computing scores', () => {
  const profile = { ...BUILTIN_PROFILES['dev-mode'], trust_requirements: { min_score: 0.7 } };
  for (const trustScore of [undefined, NaN, Infinity, -1, 0.6, 1.1])
    assert.equal(evaluateActionWithProfile(profile, { actionType: 'network', trustScore }).decision, 'deny');
  for (const trustScore of [0.7, 1])
    assert.equal(evaluateActionWithProfile(profile, { actionType: 'network', trustScore }).decision, 'allow');
  for (const min_score of [NaN, Infinity, -1, 2])
    assert.equal(evaluateActionWithProfile({ ...profile, trust_requirements: { min_score } }, { actionType: 'network', trustScore: 1 }).decision, 'deny');
});
test('authority must be externally verified and cannot bypass controls', () => {
  const profile = { ...BUILTIN_PROFILES['enterprise-locked'], authority_requirements: { require_mandate: true } };
  for (const mandateVerified of [undefined, false])
    assert.equal(evaluateActionWithProfile(profile, { actionType: 'network', mandateVerified }).reason, 'authority_requirement_unmet');
  assert.equal(evaluateActionWithProfile(profile, { actionType: 'shell', mandateVerified: true }).decision, 'deny');
  assert.equal(evaluateActionWithProfile(profile, { actionType: 'network', mandateVerified: true }).decision, 'allow');
});
