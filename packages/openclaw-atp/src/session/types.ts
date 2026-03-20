/**
 * Session Enforcement Types
 */

export type SessionState = 'planning' | 'executing' | 'communicating' | 'completed';

export interface ClawStatePermissions {
  /** Tools this state is allowed to use */
  allowedTools: string[];
  /** Tools explicitly blocked in this state */
  restrictedTools?: string[];
  /** Tools that need explicit human approval before use */
  requireApproval?: string[];
}

export type ClawStatePolicy = Record<SessionState, ClawStatePermissions>;

export interface ClawSessionContext {
  /** DID of the agent whose session is being evaluated */
  agentDid: string;
  /** Current lifecycle state of the agent session */
  state: SessionState;
  /** Optional environment tags (e.g. 'production', 'sandbox') */
  environmentTags?: string[];
  /** Optional session ID for correlation */
  sessionId?: string;
}

export interface SessionPolicyResult {
  /** Tools the agent is allowed to call in this state */
  allowedTools: string[];
  /** Tools explicitly forbidden in this state */
  forbiddenTools: string[];
  /** Tools that require human approval before execution */
  requiresApproval: string[];
  /** The state that was evaluated */
  state: SessionState;
  /** The agent this result applies to */
  agentDid: string;
  /** When this result was computed */
  evaluatedAt: Date;
}

export interface EnforceSessionOptions {
  /** Override the default state policy for specific states */
  policyOverride?: Partial<ClawStatePolicy>;
  /**
   * Skip ATP permission evaluation and use local policy only.
   * Useful for offline or low-latency scenarios.
   */
  localOnly?: boolean;
}
