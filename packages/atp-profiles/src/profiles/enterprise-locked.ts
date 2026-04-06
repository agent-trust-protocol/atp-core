import { AtpSecurityProfile } from "../types.js";

export const ENTERPRISE_LOCKED_PROFILE: AtpSecurityProfile = {
  id: "enterprise-locked",
  name: "Enterprise Locked",
  description: "Maximum security for production environments: strict controls, full audit trail, approval required for sensitive actions.",
  version: "1.0.0",
  runtime_targets: ["openclaw", "mcp", "langchain", "custom"],
  environment_defaults: {
    dev: "safe-default",
    staging: "enterprise-locked",
    prod: "enterprise-locked",
  },
  controls: {
    shell: { allowed: false, require_approval: false, allowed_commands: [] },
    filesystem: {
      allowed: true,
      modes: ["read"],
      allowed_paths: ["/workspace/approved"],
      blocked_paths: ["/", "/etc", "/home", "/tmp", "/var"],
    },
    network: {
      allowed: true,
      allowed_domains: ["*.internal.corp"],
      blocked_domains: ["*"],
      require_approval_for_external: true,
    },
    credentials: { allowed: false, require_approval: false },
    messaging: { allowed: true, require_approval_for_external: true },
  },
  state_policies: {
    planning: {
      allowed_tools: [],
      restricted_tools: ["shell", "filesystem", "network", "credentials", "messaging"],
    },
    executing: {
      allowed_tools: ["filesystem", "network"],
      restricted_tools: ["shell", "credentials"],
      require_approval_for: ["messaging"],
    },
    communicating: {
      allowed_tools: ["messaging"],
      restricted_tools: ["shell", "filesystem", "credentials"],
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
    redact_fields: ["password", "ssn", "card_number", "api_key", "secret", "token"],
  },
  trust_scoring: {
    start_score: 0.3,
    max_score: 1.0,
    min_score: 0.0,
    increase_on: ["successful_safe_actions", "approved_actions"],
    decrease_on: ["policy_violations", "denied_actions", "unapproved_attempts"],
  },
};
