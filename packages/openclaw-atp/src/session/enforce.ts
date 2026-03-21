/**
 * Session Policy Enforcement
 *
 * Maps OpenClaw agent lifecycle states to ATP-enforced tool permissions.
 */

import type { ATPClient } from 'atp-sdk';
import type {
  ClawSessionContext,
  ClawStatePolicy,
  SessionPolicyResult,
  EnforceSessionOptions,
  SessionState
} from './types.js';

/**
 * Default state-to-permissions map for OpenClaw agent sessions.
 * Can be overridden per-call via EnforceSessionOptions.policyOverride.
 */
export const defaultClawStatePolicy: ClawStatePolicy = {
  planning: {
    allowedTools: [],
    restrictedTools: ['shell', 'http', 'fs']
  },
  executing: {
    allowedTools: ['http', 'fs'],
    restrictedTools: ['shell-dangerous']
  },
  communicating: {
    allowedTools: ['messaging'],
    requireApproval: ['external-send']
  },
  completed: {
    allowedTools: ['read-only-logs'],
    restrictedTools: ['shell', 'fs', 'http']
  }
};

/**
 * Enforce ATP policies for an OpenClaw agent session.
 *
 * Maps the agent's current state → permissions, optionally validates each
 * allowed tool against ATP's permission service, logs the decision, and
 * returns a structured result — no exceptions thrown on policy denials.
 *
 * @param sessionContext - Agent DID, current state, and optional tags
 * @param atpClient      - Initialised ATP client instance
 * @param options        - Optional policy overrides or local-only mode
 * @returns Allowed tools, forbidden tools, and tools requiring approval
 */
export async function enforceAtpPoliciesForClawSession(
  sessionContext: ClawSessionContext,
  atpClient: ATPClient,
  options: EnforceSessionOptions = {}
): Promise<SessionPolicyResult> {
  const { agentDid, state, environmentTags, sessionId } = sessionContext;
  const { policyOverride, localOnly = false } = options;

  // Build effective policy: start from defaults, deep-merge overrides per state
  const effectivePolicy: ClawStatePolicy = Object.fromEntries(
    (Object.keys(defaultClawStatePolicy) as SessionState[]).map((s) => {
      const base = defaultClawStatePolicy[s];
      const override = policyOverride?.[s];
      return [s, override ? { ...base, ...override } : base];
    })
  ) as ClawStatePolicy;

  const statePermissions = effectivePolicy[state];
  const allowedTools: string[] = [...statePermissions.allowedTools];
  const forbiddenTools: string[] = [...(statePermissions.restrictedTools ?? [])];
  const requiresApproval: string[] = [...(statePermissions.requireApproval ?? [])];

  // Optionally gate each allowed tool through ATP's permission service
  if (!localOnly && allowedTools.length > 0) {
    const atpAllowed: string[] = [];
    await Promise.all(
      allowedTools.map(async (tool) => {
        try {
          const result = await atpClient.permissions.checkAccess({
            subject: agentDid,
            action: 'execute',
            resource: `tool:${tool}`,
            context: { state, environmentTags }
          });
          if (result.allowed) {
            atpAllowed.push(tool);
          } else {
            forbiddenTools.push(tool);
          }
        } catch {
          // Fail closed: if the check errors, treat tool as forbidden
          forbiddenTools.push(tool);
        }
      })
    );
    allowedTools.length = 0;
    allowedTools.push(...atpAllowed);
  }

  // Audit-log the enforcement decision
  await atpClient.audit.log({
    eventType: 'session-policy-enforced',
    agentDid,
    severity: 'info',
    metadata: {
      state,
      allowedTools,
      forbiddenTools,
      requiresApproval,
      sessionId,
      environmentTags,
      localOnly
    }
  });

  return {
    allowedTools,
    forbiddenTools,
    requiresApproval,
    state,
    agentDid,
    evaluatedAt: new Date()
  };
}
