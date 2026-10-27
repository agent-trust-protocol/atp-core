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
function recognized(profile, { actionType, state }) {
  const policy = Object.hasOwn(profile.state_policies ?? {}, state ?? '') ? profile.state_policies[state] : undefined;
  return Object.hasOwn(profile.controls, actionType) ||
    [policy?.allowed_tools, policy?.restricted_tools, policy?.require_approval_for].some(n => n?.includes(actionType));
}
test('built-ins keep SDK 2.1 decisions for recognized actions and fail closed otherwise', () => {
  assert.deepEqual(Object.keys(BUILTIN_PROFILES), ['safe-default', 'dev-mode', 'enterprise-locked', 'openclaw-sandbox']);
  for (const profile of Object.values(BUILTIN_PROFILES))
    for (const state of [undefined, 'planning', 'executing', 'communicating', 'completed', 'unknown'])
      for (const actionType of ['shell', 'filesystem', 'network', 'credentials', 'messaging', 'logs-read', 'external-messaging', 'unknown']) {
        const context = { state, actionType };
        const actual = evaluateActionWithProfile(profile, context);
        const expected = recognized(profile, context) ? legacy(profile, context) : (profile.unknown_action ?? 'deny');
        assert.equal(actual.decision, expected, `${profile.id}/${state}/${actionType}`);
        assert.equal(actual.allowed, actual.decision === 'allow');
        assert.equal(evaluateActionWithProfile(profile, { sessionState: state, actionType }).decision, actual.decision);
      }
});
test('unrecognized action types fail closed in restrictive profiles', () => {
  for (const id of ['safe-default', 'enterprise-locked', 'openclaw-sandbox'])
    for (const actionType of ['Shell', 'shell_exec', 'exec', 'credential', 'constructor', '__proto__', 'toString'])
      assert.deepEqual(evaluateActionWithProfile(BUILTIN_PROFILES[id], { actionType, state: 'executing' }),
        { allowed: false, decision: 'deny', reason: 'unknown_action_type' }, `${id}/${actionType}`);
});
test('recognition is scoped to the active state policy', () => {
  const sandbox = BUILTIN_PROFILES['openclaw-sandbox'];
  assert.equal(evaluateActionWithProfile(sandbox, { actionType: 'logs-read', state: 'completed' }).decision, 'allow');
  assert.equal(evaluateActionWithProfile(sandbox, { actionType: 'logs-read', state: 'executing' }).decision, 'deny');
  assert.equal(evaluateActionWithProfile(sandbox, { actionType: 'external-messaging', state: 'communicating' }).decision, 'require_approval');
  assert.equal(evaluateActionWithProfile(sandbox, { actionType: 'external-messaging', state: 'executing' }).decision, 'deny');
});
test('missing or non-string action types deny even when unknown actions are allowed', () => {
  for (const actionType of [undefined, null, '', 0, ['shell'], { toString: () => 'shell' }])
    assert.equal(evaluateActionWithProfile(BUILTIN_PROFILES['dev-mode'], { actionType }).decision, 'deny');
});
test('unknown_action opts a profile into a different fallback; invalid values deny', () => {
  const base = BUILTIN_PROFILES['safe-default'];
  assert.equal(evaluateActionWithProfile({ ...base, unknown_action: 'require_approval' }, { actionType: 'exec' }).decision, 'require_approval');
  assert.equal(evaluateActionWithProfile({ ...base, unknown_action: 'allow' }, { actionType: 'exec' }).decision, 'allow');
  for (const unknown_action of ['ALLOW', true, 1, null])
    assert.equal(evaluateActionWithProfile({ ...base, unknown_action }, { actionType: 'exec' }).decision, 'deny');
  assert.equal(evaluateActionWithProfile(BUILTIN_PROFILES['dev-mode'], { actionType: 'exec' }).decision, 'allow');
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
