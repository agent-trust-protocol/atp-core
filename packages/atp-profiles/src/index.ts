/**
 * ATP Profiles - Built-in Security Profiles for Agent Trust Protocol
 *
 * Runtime-agnostic security profiles that define what actions an agent
 * can take, under what conditions, and how those actions are logged and scored.
 *
 * Profiles are used by atp-sdk and runtime adapters (OpenClaw, MCP, LangChain, etc.)
 * to enforce consistent security policies across any agentic ecosystem.
 */

import { AtpSecurityProfile } from "./types.js";
import { SAFE_DEFAULT_PROFILE } from "./profiles/safe-default.js";
import { DEV_MODE_PROFILE } from "./profiles/dev-mode.js";
import { ENTERPRISE_LOCKED_PROFILE } from "./profiles/enterprise-locked.js";
import { OPENCLAW_SANDBOX_PROFILE } from "./profiles/openclaw-sandbox.js";

export const BUILTIN_PROFILES: Record<string, AtpSecurityProfile> = {
  "safe-default": SAFE_DEFAULT_PROFILE,
  "dev-mode": DEV_MODE_PROFILE,
  "enterprise-locked": ENTERPRISE_LOCKED_PROFILE,
  "openclaw-sandbox": OPENCLAW_SANDBOX_PROFILE,
};

export {
  SAFE_DEFAULT_PROFILE,
  DEV_MODE_PROFILE,
  ENTERPRISE_LOCKED_PROFILE,
  OPENCLAW_SANDBOX_PROFILE,
};

export * from "./types.js";
