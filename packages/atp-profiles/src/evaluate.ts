import type { AtpSecurityProfile } from './types.js';

export type ProfileDecision = 'allow' | 'deny' | 'require_approval';

/** Values must come from trusted verifiers, never untrusted action metadata. */
export interface ProfileEvaluationContext {
  actionType: string;
  state?: string;
  sessionState?: string;
  agentDid?: string;
  trustScore?: number;
  mandateVerified?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ProfileEvaluationResult {
  allowed: boolean;
  decision: ProfileDecision;
  reason?: string;
}

/** Category/state gate shared by SDK and adapters; not a runtime sandbox. */
export function evaluateActionWithProfile(
  profile: AtpSecurityProfile,
  context: ProfileEvaluationContext,
): ProfileEvaluationResult {
  const result = (decision: ProfileDecision, reason?: string): ProfileEvaluationResult =>
    ({ allowed: decision === 'allow', decision, ...(reason ? { reason } : {}) });
  const minimum = profile.trust_requirements?.min_score;
  if (minimum !== undefined && (
    !Number.isFinite(minimum) || minimum < 0 || minimum > 1 ||
    !Number.isFinite(context.trustScore) || context.trustScore! < minimum || context.trustScore! > 1
  )) return result('deny', 'trust_requirement_unmet');
  if (profile.authority_requirements?.require_mandate && context.mandateVerified !== true)
    return result('deny', 'authority_requirement_unmet');

  if (typeof context.actionType !== 'string' || context.actionType === '')
    return result('deny', 'unknown_action_type');

  // Preserve the SDK 2.1 category/state decision ordering for recognized actions.
  const control = Object.prototype.hasOwnProperty.call(profile.controls, context.actionType)
    ? profile.controls[context.actionType as keyof AtpSecurityProfile['controls']]
    : undefined;
  const state = context.state ?? context.sessionState;
  const policy = state && Object.prototype.hasOwnProperty.call(profile.state_policies ?? {}, state)
    ? profile.state_policies?.[state] : undefined;
  // An action is recognized only if it is a control category or is named by the
  // active state's policy. Anything else (typos, raw tool names) fails closed.
  const recognized = control !== undefined ||
    [policy?.allowed_tools, policy?.restricted_tools, policy?.require_approval_for]
      .some(names => names?.includes(context.actionType));
  if (!recognized) {
    const fallback = profile.unknown_action;
    return result(fallback === 'allow' || fallback === 'require_approval' ? fallback : 'deny', 'unknown_action_type');
  }
  if (control?.allowed === false) {
    const approval = 'require_approval' in control && control.require_approval;
    return result(approval ? 'require_approval' : 'deny', 'control_blocked');
  }
  if (policy?.restricted_tools?.includes(context.actionType))
    return result('deny', 'state_restricted');
  if (policy?.require_approval_for?.includes(context.actionType))
    return result('require_approval', 'state_approval_required');
  return result('allow');
}
