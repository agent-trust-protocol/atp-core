import { AtpSecurityProfile } from './types.js';

export const OPENCLAW_SANDBOX_PROFILE: AtpSecurityProfile = {
  id: 'openclaw-sandbox',
  name: 'OpenClaw Sandbox',
  description: 'Sandbox profile tuned for OpenClaw/NemoClaw agents: controlled tool access with state-based enforcement.',
  version: '1.0.0',
  runtime_targets: ['openclaw'],
  environment_defaults: {
    dev: 'dev-mode',
    staging: 'openclaw-sandbox',
    prod: 'enterprise-locked'
  },
  controls: {
    shell: { allowed: false, require_approval: true, allowed_commands: ['ls', 'cat', 'echo'] },
    filesystem: {
      allowed: true,
      modes: ['read', 'write'],
      allowed_paths: ['/workspace', '/workspace/sandbox'],
      blocked_paths: ['/', '/etc', '/home', '/var']
    },
    network: {
      allowed: true,
      allowed_domains: ['internal.api.local', 'company.com'],
      blocked_domains: ['*'],
      require_approval_for_external: true
    },
    credentials: { allowed: false, require_approval: true },
    messaging: { allowed: true, require_approval_for_external: true }
  },
  state_policies: {
    planning: {
      allowed_tools: [],
      restricted_tools: ['shell', 'filesystem', 'network', 'credentials']
    },
    executing: {
      allowed_tools: ['filesystem', 'network'],
      restricted_tools: ['shell'],
      require_approval_for: ['credentials', 'messaging']
    },
    communicating: {
      allowed_tools: ['messaging'],
      restricted_tools: ['shell', 'filesystem'],
      require_approval_for: ['external-messaging']
    },
    completed: {
      allowed_tools: ['logs-read'],
      restricted_tools: ['shell', 'filesystem', 'network', 'credentials', 'messaging']
    }
  },
  logging: {
    log_all_actions: true,
    log_sensitive_inputs: true,
    redact_fields: ['password', 'api_key', 'secret', 'apiKey']
  },
  trust_scoring: {
    start_score: 0.5,
    max_score: 1.0,
    min_score: 0.0,
    increase_on: ['successful_safe_actions', 'approved_actions'],
    decrease_on: ['policy_violations', 'denied_actions']
  }
};
