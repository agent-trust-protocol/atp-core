/**
 * OpenClaw-Flavoured Convenience API
 *
 * Thin wrappers that expose the ATP adapter under the exact function names
 * prescribed by the ATP Runtime Guard public API surface.
 */

import type { ATPClient } from 'atp-sdk';
import { registerAgentWithAtp } from './agent/registration.js';
import { ATPToolWrapper } from './tools/wrapper.js';
import type { AgentMetadata, AgentRegistrationOptions, AgentContext } from './agent/types.js';
import type { ToolSecurityConfig, ToolExecutionResult } from './tools/types.js';

/** Config shape passed when registering an OpenClaw agent ("claw") */
export type ClawConfig = AgentRegistrationOptions;

/**
 * Register an OpenClaw agent ("claw") with ATP.
 *
 * Delegates to registerAgentWithAtp. Provided under the OpenClaw naming
 * convention so callers don't need to know the internal function name.
 *
 * @param atpClient  - Initialised ATP client instance
 * @param clawConfig - Agent name, role, trust level, capabilities, etc.
 * @returns AgentMetadata containing the DID, public key, trust score, and issued credentials
 */
export async function registerClawWithAtp(
  atpClient: ATPClient,
  clawConfig: ClawConfig
): Promise<AgentMetadata> {
  return registerAgentWithAtp(atpClient, clawConfig);
}

/**
 * Wrap a single OpenClaw skill (tool function) with ATP security.
 *
 * The returned function has the same argument contract as the original skill
 * but runs identity verification, policy checks, rate limiting, and audit
 * logging before (and after) each invocation.
 *
 * @param skill      - The raw skill / tool function to protect
 * @param atpClient  - Initialised ATP client instance
 * @param options    - Security config (min trust, rate limit, policy tag, etc.)
 * @returns A secured callable: (agentContext, ...skillArgs) => Promise<ToolExecutionResult>
 */
export function wrapSkillWithAtp(
  skill: (...args: unknown[]) => unknown,
  atpClient: ATPClient,
  options: ToolSecurityConfig = {}
): (agentContext: AgentContext, ...args: unknown[]) => Promise<ToolExecutionResult> {
  const wrapper = new ATPToolWrapper(skill, atpClient, options);
  return (agentContext: AgentContext, ...args: unknown[]) =>
    wrapper.execute(agentContext, ...args);
}
