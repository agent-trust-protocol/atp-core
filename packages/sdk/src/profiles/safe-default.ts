import { AtpSecurityProfile } from "./types.js";

export const SAFE_DEFAULT_PROFILE: AtpSecurityProfile = {
  id: "safe-default",
  name: "Safe Default",
  description: "Conservative profile for most agents: limited tools, strong auditing.",
  version: "1.0.0",
  runtime_targets: ["openclaw", "mcp", "langchain", "custom"],
  environment_defaults: {
    dev: "dev-mode",
    staging: "safe-default",
    prod: "enterprise-locked",
  },
  controls: {
    shell: { allowed: false, require_approval: true, allowed_commands: [] },
    filesystem: {
      allowed: true,
      modes: ["read"],
      allowed_paths: ["/workspace/read-only"],
      blocked_paths: ["/", "/etc", "/home"],
    },
    network: {
      allowed: true,
      allowed_domains: ["internal.api.local"],
      blocked_domains: ["*"],
      require_approval_for_external: true,
    },
    credentials: { allowed: false, require_approval: true },
    messaging: { allowed: true, require_approval_for_external: true },
  },
  state_policies: {
    planning: {
      allowed_tools: [],
      restricted_tools: ["shell", "filesystem", "network"],
    },
    executing: {
      allowed_tools: ["filesystem", "network"],
      restricted_tools: ["shell"],
      require_approval_for: ["credentials", "messaging"],
    },
    communicating: {
      allowed_tools: ["messaging"],
      require_approval_for: ["external-messaging"],
    },
    completed: {
      allowed_tools: ["logs-read"],
      restricted_tools: ["shell", "filesystem", "network", "credentials", "messaging"],
    },
  },
  logging: {
    log_all_actions: true,
    log_sensitive_inputs: true,
    redact_fields: ["password", "ssn", "card_number"],
  },
  trust_scoring: {
    start_score: 0.5,
    max_score: 1.0,
    min_score: 0.0,
    increase_on: ["successful_safe_actions"],
    decrease_on: ["policy_violations", "denied_actions"],
  },
};
