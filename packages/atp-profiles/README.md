# atp-profiles

### Fail-closed security profiles for AI agent actions

[![npm](https://img.shields.io/npm/v/atp-profiles)](https://www.npmjs.com/package/atp-profiles) [![license](https://img.shields.io/npm/l/atp-profiles)](https://github.com/agent-trust-protocol/atp-core/blob/main/LICENSE)

An agent that can run shell commands, read files, call APIs and send messages needs a clear answer, before each action, to one question: **should this run?**

`atp-profiles` provides the security profiles for **Agent Trust Protocol™ (ATP)**. A profile describes which action categories an agent may use, in which session states, and which actions need a human in the loop. One function, `evaluateActionWithProfile`, turns a profile and an action into a decision: `allow`, `require_approval` or `deny`.

- **Runtime-agnostic.** The same profile works with MCP servers, LangChain, OpenClaw or your own runtime. Adapters map tool names to categories; policy stays in the profile.
- **Fail-closed.** Unknown actions, missing actions and missing profiles never quietly pass.
- **Small and dependency-free.** One evaluator and four built-in profiles. `atp-sdk` uses the same evaluator.

## Install

```bash
npm install atp-profiles
```

The package is ESM-only. CommonJS applications can use `await import('atp-profiles')`.

## Quick start

```js
import { BUILTIN_PROFILES, evaluateActionWithProfile } from 'atp-profiles';

const result = evaluateActionWithProfile(BUILTIN_PROFILES['safe-default'], {
  actionType: 'filesystem',  // a category, not a raw tool name
  state: 'executing',        // optional session state
});

switch (result.decision) {
  case 'allow':            /* run the action */ break;
  case 'require_approval': /* pause for your approval flow */ break;
  default:                 /* deny: do not run it */ console.log('Denied:', result.reason);
}
```

The result is `{ allowed, decision, reason? }`. `allowed` is `true` only for `allow`, so a `require_approval` result is not permission to run.

To see a host enforce all three outcomes end to end, run the [action-boundary demo](https://github.com/agent-trust-protocol/atp-core/tree/main/examples/action-boundary). It needs no service account or model key.

## How a decision is made

The checks run in this order, and the first one that matches decides:

1. **Profile**: a missing or malformed profile is a `deny` (`unknown_profile`).
2. **Trust and authority requirements**, if the profile sets them: unmet or invalid evidence is a `deny`.
3. **Action**: a missing, empty or non-string `actionType` is a `deny` (`unknown_action_type`).
4. **Recognition**: an action is recognized if it is a control category (`shell`, `filesystem`, `network`, `credentials`, `messaging`) or is named by the active state's policy. Anything else gets the profile's `unknown_action` fallback, which is `deny` unless the profile says otherwise.
5. **Controls and state policy**: blocked controls, state restrictions and approval lists apply.
6. Otherwise the result is `allow`.

Map host tools to categories before evaluating, for example `{ terminal: 'shell', read_file: 'filesystem' }`. Passing raw tool names through means they will be treated as unrecognized.

## Built-in profiles

| Profile | Use it for | Unrecognized actions |
| --- | --- | --- |
| `safe-default` | A conservative baseline for most agents | `deny` |
| `dev-mode` | Local development only, never production | `require_approval` |
| `enterprise-locked` | Regulated environments such as finance and healthcare | `deny` |
| `openclaw-sandbox` | OpenClaw/NemoClaw multi-agent workflows | `deny` |

### `safe-default`

- **Shell**: requires approval
- **Filesystem**: read-only from `/workspace/read-only`
- **Network**: internal domains only; external requires approval
- **Credentials**: requires approval
- **Messaging**: allowed; external requires approval

### `dev-mode`

Broad access for local development. **Do not use in production.**

- **Shell, filesystem, network, credentials, messaging**: allowed without approval
- **Unrecognized actions**: require approval, so a typo or raw tool name never runs silently

### `enterprise-locked`

- **Shell**: blocked, no exceptions
- **Filesystem**: read-only, explicit allow-list only
- **Network**: explicit domain allow-list; all external requests require approval
- **Credentials**: blocked, no exceptions
- **Messaging**: all external messaging requires approval

### `openclaw-sandbox`

- Mirrors `safe-default` controls
- State policies follow the `planning → executing → communicating → completed` lifecycle

## Custom profiles

Start from a built-in profile:

```js
import { SAFE_DEFAULT_PROFILE } from 'atp-profiles';

const myProfile = {
  ...SAFE_DEFAULT_PROFILE,
  id: 'my-profile',
  name: 'My Profile',
  unknown_action: 'require_approval', // 'deny' (default), 'require_approval' or 'allow'
};
```

Or define one from scratch with the `AtpSecurityProfile` type:

```ts
import type { AtpSecurityProfile } from 'atp-profiles';

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
  logging: { log_all_actions: true, log_sensitive_inputs: false, redact_fields: ['password', 'token'] },
  trust_scoring: { start_score: 0.5, max_score: 1.0, min_score: 0.0, increase_on: [], decrease_on: [] },
};
```

Keep your profiles next to the built-ins: `{ ...BUILTIN_PROFILES, 'my-custom-profile': myProfile }`.

### Trust and authority requirements

Custom profiles may add `trust_requirements: { min_score: 0.7 }` (normalized 0 to 1) and `authority_requirements: { require_mandate: true }`. Missing or invalid evidence denies. Supply `trustScore` and `mandateVerified` only from trusted, current verification results for this agent and action, never from untrusted request metadata. The evaluator does not verify signatures, status, revocation, scope or mandate expiry. Mandates remain separate authority objects, not embedded profiles.

`trust_scoring` is deprecated compatibility metadata. The evaluator does not read it.

## What this is not

This is a category and state gate, not a sandbox. The evaluator returns a decision; your runtime must enforce it, keep its own audit log and run its own approval flow. Fields such as `allowed_commands`, filesystem modes and paths, network domains, external-action approval flags and `allowed_tools` describe intent, and runtime adapters must enforce them. A `require_approval` result is not authorization to run.

## Migration

### 2.x → 3.0

- A missing or malformed profile (`undefined`, `null`, or an object without `controls`, such as the result of `BUILTIN_PROFILES['typo']`) returns `{ allowed: false, decision: 'deny', reason: 'unknown_profile' }`. In 2.x it threw a `TypeError`, which failed closed only if the caller treated errors as denial.
- **Breaking:** `dev-mode` sets `unknown_action: 'require_approval'` (it was `'allow'`), so no built-in profile now allows an unrecognized action. To keep the old behaviour in a local profile, use `{ ...DEV_MODE_PROFILE, unknown_action: 'allow' }`.
- The `profile` parameter type accepts `null | undefined`.

### 1.x → 2.0

In 1.x, an `actionType` the profile did not recognize returned `allow`, so a typo (`Shell`, `exec`, `credential`) or a raw tool name bypassed every control. From 2.0, unrecognized actions get the profile's `unknown_action` fallback, which defaults to `deny`; any value other than `'allow'` or `'require_approval'` also denies. Recognized actions keep their 1.x decisions.

### 1.1

The SDK's `ATPClient.evaluateActionWithProfile` delegates to this package and keeps its string decision API. An unknown SDK profile ID denies instead of silently allowing.

## Participate

Try a built-in profile with your agent framework, and contribute a focused test case for an action or session state we have missed. See the [contribution guide](https://github.com/agent-trust-protocol/atp-core/blob/main/CONTRIBUTING.md), the [ATP Core repository](https://github.com/agent-trust-protocol/atp-core) and the [W3C ATP Community Group drafts](https://w3c-cg.github.io/atp/specs/). The drafts are Community Group work, not W3C Standards.

- [Agent Trust Protocol™](https://agenttrustprotocol.com)
- [`atp-sdk` on npm](https://www.npmjs.com/package/atp-sdk)
- [Source](https://github.com/agent-trust-protocol/atp-core/tree/main/packages/atp-profiles)

Agent Trust Protocol™ is a trademark of Sovr Inc. Licensed under Apache-2.0.
