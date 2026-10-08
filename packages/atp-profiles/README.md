# atp-profiles

Built-in **Agent Trust Protocol™** security profiles and a runtime-agnostic profile schema. Profiles describe action gates and conditions. The evaluator returns a decision; the host runtime must enforce it and handle its own audit logging. This package is the canonical schema and built-in source consumed by the SDK. Use with [`atp-sdk`](https://www.npmjs.com/package/atp-sdk) and runtime adapters (OpenClaw, MCP, LangChain, etc.) so tool and session actions are evaluated through `evaluateActionWithProfile` rather than hardcoded policies.

## Install

```bash
npm install atp-profiles
```

## Built-in Profiles

| Profile ID | Name | Use Case |
|---|---|---|
| `safe-default` | Safe Default | Conservative baseline for most agents — limited tools, strong auditing |
| `dev-mode` | Dev Mode | Permissive settings for local development; never use in production |
| `enterprise-locked` | Enterprise Locked | Maximally restrictive for regulated industries (finance, healthcare) |
| `openclaw-sandbox` | OpenClaw Sandbox | Sandboxed profile for OpenClaw/NemoClaw multi-agent workflows |

## Quick Start

```typescript
import { BUILTIN_PROFILES, evaluateActionWithProfile } from 'atp-profiles';

const profile = BUILTIN_PROFILES['safe-default'];

const result = evaluateActionWithProfile(profile, {
  actionType: 'filesystem',
  agentDid: 'did:atp:abc123',
  trustScore: 0.8,
  sessionState: 'executing',
});

if (result.allowed) {
  // proceed with action
} else {
  console.log('Blocked:', result.reason);
}
```

## Profile Reference

### `safe-default`

Conservative profile for most agents.

- **Shell**: blocked (requires explicit approval)
- **Filesystem**: read-only from `/workspace/read-only`
- **Network**: internal domains only; external requires approval
- **Credentials**: blocked (requires approval)
- **Messaging**: allowed; external requires approval
- Legacy scoring metadata is retained for compatibility; no score is computed.

### `dev-mode`

Permissive for local development. **Do not use in production.**

- **Shell**: allowed with no approval
- **Filesystem**: read/write anywhere in the project
- **Network**: all domains allowed
- **Credentials**: allowed
- **Messaging**: allowed without approval

### `enterprise-locked`

Maximum restriction for regulated environments.

- **Shell**: blocked, no exceptions
- **Filesystem**: read-only, explicit allow-list only
- **Network**: explicit domain allow-list; all external requires approval
- **Credentials**: blocked; requires approval plus audit log
- **Messaging**: all external messaging requires approval
- Legacy scoring metadata is retained for compatibility; no score is computed.

### `openclaw-sandbox`

Sandboxed execution for OpenClaw/NemoClaw crews.

- Mirrors `safe-default` controls with OpenClaw session-state mapping
- State policies enforce `planning → executing → communicating → completed` lifecycle

## Custom Profiles

Extend a built-in profile or define one from scratch:

```typescript
import { AtpSecurityProfile } from 'atp-profiles';

const myProfile: AtpSecurityProfile = {
  id: 'my-custom-profile',
  name: 'My Custom Profile',
  description: 'Tailored for my use case.',
  version: '1.0.0',
  runtime_targets: ['mcp', 'custom'],
  controls: {
    shell: { allowed: false, require_approval: true, allowed_commands: [] },
    filesystem: { allowed: true, modes: ['read', 'write'], allowed_paths: ['/workspace'] },
    network: { allowed: true, allowed_domains: ['api.myservice.com'] },
    credentials: { allowed: false, require_approval: true },
    messaging: { allowed: true, require_approval_for_external: false },
  },
  state_policies: {
    planning:      { allowed_tools: [], restricted_tools: ['shell', 'network'] },
    executing:     { allowed_tools: ['filesystem', 'network'], restricted_tools: ['shell'] },
    communicating: { allowed_tools: ['messaging'] },
    completed:     { allowed_tools: ['logs-read'], restricted_tools: ['shell', 'filesystem', 'network'] },
  },
  logging: {
    log_all_actions: true,
    log_sensitive_inputs: false,
    redact_fields: ['password', 'token'],
  },
  trust_scoring: {
    start_score: 0.5,
    max_score: 1.0,
    min_score: 0.0,
    increase_on: ['successful_safe_actions'],
    decrease_on: ['policy_violations'],
  },
};
```

Register it in your app alongside the built-ins:

```typescript
import { BUILTIN_PROFILES } from 'atp-profiles';

const allProfiles = { ...BUILTIN_PROFILES, 'my-custom-profile': myProfile };
```

## Documentation

- [Agent Trust Protocol™](https://agenttrustprotocol.com)
- [atp-sdk on npm](https://www.npmjs.com/package/atp-sdk)
- [Adding a new security profile](https://github.com/agent-trust-protocol/atp-core/blob/main/CLAUDE.md#adding-a-new-security-profile)
- Source in this monorepo: `packages/atp-profiles/src/`

## License

Apache-2.0 © 2026 Sovr Labs

## Evaluation boundary and migration (1.1)

`evaluateActionWithProfile(profile, context)` returns `{ allowed, decision, reason? }`.
The SDK method delegates to this function and retains its string decision API.
The four built-ins and their category/state decisions are preserved. An explicit
unknown SDK profile ID now denies instead of silently allowing.

This is a category/state gate, not a sandbox. Runtime adapters must enforce
`allowed_commands`, filesystem modes and paths, network domains, external-action
approval flags, and `allowed_tools`. These fields are not enforced by this helper.
Approval results are not authorization to execute; a separate approval flow is required.

Custom profiles may add `trust_requirements: { min_score: 0.7 }` (normalized 0..1)
and `authority_requirements: { require_mandate: true }`. Missing or invalid evidence
denies. Supply `trustScore` and `mandateVerified` only from trusted, current verification
results for the agent and action. Never copy them from untrusted request metadata.
The helper does not verify signatures, status, revocation, scope, or mandate expiry.
Mandates remain separate authority objects, not embedded profiles.

`trust_scoring` is deprecated compatibility metadata; it is not read by the evaluator.
Migrate scoring configuration to your trust evaluator. Built-ins do not gain new
trust thresholds or mandate requirements in this compatible release.
OpenClaw remains an optional runtime target with no adapter dependency.

## Participate

Try a built-in profile with your agent framework and contribute a focused test case for an action or session state we have missed. The profile package is runtime-agnostic; adapters must enforce its decisions. See [CONTRIBUTING.md](../../CONTRIBUTING.md), the [ATP Core README](../../README.md), and [Community Group drafts](https://w3c-cg.github.io/atp/specs/). Drafts are not W3C Standards.

This package is ESM-only. CommonJS applications can use dynamic `import('atp-profiles')`.
