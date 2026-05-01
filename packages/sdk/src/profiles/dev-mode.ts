import { AtpSecurityProfile } from './types.js';

export const DEV_MODE_PROFILE: AtpSecurityProfile = {
  id: 'dev-mode',
  name: 'Dev Mode',
  description: 'Permissive profile for local development: most tools allowed, minimal restrictions.',
  version: '1.0.0',
  runtime_targets: ['openclaw', 'mcp', 'langchain', 'custom'],
  environment_defaults: {
    dev: 'dev-mode',
    staging: 'safe-default',
    prod: 'enterprise-locked'
  },
  controls: {
    shell: { allowed: true, require_approval: false, allowed_commands: ['*'] },
    filesystem: {
      allowed: true,
      modes: ['read', 'write'],
      allowed_paths: ['*'],
      blocked_paths: []
    },
    network: {
      allowed: true,
      allowed_domains: ['*'],
      blocked_domains: [],
      require_approval_for_external: false
    },
    credentials: { allowed: true, require_approval: false },
    messaging: { allowed: true, require_approval_for_external: false }
  },
  state_policies: {
    planning: {
      allowed_tools: ['filesystem', 'network'],
      restricted_tools: []
    },
    executing: {
      allowed_tools: ['shell', 'filesystem', 'network', 'credentials', 'messaging'],
      restricted_tools: []
    },
    communicating: {
      allowed_tools: ['messaging', 'network'],
      restricted_tools: []
    },
    completed: {
      allowed_tools: ['logs-read', 'filesystem'],
      restricted_tools: []
    }
  },
  logging: {
    log_all_actions: true,
    log_sensitive_inputs: false,
    redact_fields: []
  },
  trust_scoring: {
    start_score: 0.7,
    max_score: 1.0,
    min_score: 0.0,
    increase_on: ['successful_safe_actions'],
    decrease_on: ['policy_violations']
  }
};
