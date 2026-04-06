/**
 * ATP Security Profiles - Type Definitions
 *
 * Runtime-agnostic security profile schema for Agent Trust Protocol.
 * Profiles define what actions an agent can take, under what conditions,
 * and how those actions are logged and scored.
 */

export type RuntimeTarget = "openclaw" | "mcp" | "langchain" | "custom";

export interface AtpSecurityProfile {
  id: string;
  name: string;
  description: string;
  version: string;
  runtime_targets: RuntimeTarget[];
  environment_defaults?: {
    dev?: string;
    staging?: string;
    prod?: string;
  };
  controls: {
    shell?: {
      allowed: boolean;
      require_approval?: boolean;
      allowed_commands?: string[];
    };
    filesystem?: {
      allowed: boolean;
      modes: ("read" | "write")[];
      allowed_paths?: string[];
      blocked_paths?: string[];
    };
    network?: {
      allowed: boolean;
      allowed_domains?: string[];
      blocked_domains?: string[];
      require_approval_for_external?: boolean;
    };
    credentials?: {
      allowed: boolean;
      require_approval?: boolean;
    };
    messaging?: {
      allowed: boolean;
      require_approval_for_external?: boolean;
    };
  };
  state_policies?: {
    [state: string]: {
      allowed_tools?: string[];
      restricted_tools?: string[];
      require_approval_for?: string[];
    };
  };
  logging?: {
    log_all_actions: boolean;
    log_sensitive_inputs?: boolean;
    redact_fields?: string[];
  };
  trust_scoring?: {
    start_score: number;
    max_score: number;
    min_score: number;
    increase_on?: string[];
    decrease_on?: string[];
  };
}
