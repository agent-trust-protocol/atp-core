# atp-sdk

### Identity, policy decisions and trust evidence for AI agents

[![npm](https://img.shields.io/npm/v/atp-sdk)](https://www.npmjs.com/package/atp-sdk) [![license](https://img.shields.io/npm/l/atp-sdk)](https://github.com/agent-trust-protocol/atp-core/blob/main/LICENSE) ![node](https://img.shields.io/node/v/atp-sdk)

AI agents now call tools, move data and act for people. Before an agent acts, the system around it should be able to answer three questions: **who is this agent, is this action allowed, and what evidence supports that?**

`atp-sdk` is the TypeScript/JavaScript SDK for **Agent Trust Protocol™ (ATP)**, an open trust layer that helps you answer them:

- **Identity:** `did:atp` agent identifiers backed by a hybrid **Ed25519 + ML-DSA-65** (post-quantum) key pair.
- **Policy decisions:** built-in security profiles return `allow`, `require_approval` or `deny` for each action. Unknown actions and missing profiles never quietly pass.
- **Trust evidence:** utilities for credentials, signed challenges and verification results that your application can check.

ATP is designed to work alongside MCP, A2A, ANP, ADK and agent frameworks rather than replace them.

## Quickstart

Requires Node.js 18 or newer. The package is ESM-only.

```bash
npm install atp-sdk
```

```js
import { Agent } from 'atp-sdk';

const agent = await Agent.quickstart('my-agent');
console.log(agent.getDID());       // did:atp:...
console.log(agent.isStandalone()); // true: no hosted service needed
```

This runs without a hosted ATP service. Standalone identity material is local and ephemeral by default, and the identifier is not publicly resolvable. Persist keys securely and connect the services and policies your application needs before relying on it for consequential actions.

Prefer a scaffold? Run `npx create-atp-agent my-agent` (see the [CLI guide](https://github.com/agent-trust-protocol/atp-core/blob/main/packages/create-atp-agent/README.md)).

## Decide before an agent acts

Map each host tool to an action category, ask a profile for a decision, and enforce the decision in your runtime:

```js
import { BUILTIN_PROFILES, evaluateActionWithProfile } from 'atp-sdk';

const toolCategory = { read_file: 'filesystem', terminal: 'shell', http_get: 'network' };
const profile = BUILTIN_PROFILES['safe-default'];

const { decision, reason } = evaluateActionWithProfile(profile, {
  actionType: toolCategory['terminal'],
  state: 'executing',
});

if (decision === 'allow') {
  // run the tool
} else if (decision === 'require_approval') {
  // pause and route to your approval flow; this result does not grant approval
} else {
  // deny: do not run the tool
}
console.log(decision, reason); // require_approval control_blocked
```

The evaluator fails closed:

| Input | Result |
| --- | --- |
| Unrecognized action, such as a typo like `Shell` or a raw tool name | `deny` (`unknown_action_type`). `dev-mode` returns `require_approval` instead. |
| Missing, empty or non-string action | `deny` in every profile |
| Missing or unknown profile, such as `BUILTIN_PROFILES['typo']` | `deny` (`unknown_profile`) |
| `ATPClient` with no profile configured | `deny` |

Built-in profiles: `safe-default`, `dev-mode`, `enterprise-locked` and `openclaw-sandbox`. See [`atp-profiles`](https://www.npmjs.com/package/atp-profiles) for what each one allows and how to write your own.

A decision is not enforcement. Your application or runtime must act on it, keep its own audit log and run its own approval flow. A trust score is evidence to evaluate, not a grant of authority by itself.

## Post-quantum identity primitives

```js
import { DidAtp } from 'atp-sdk';

const { did, keyPair } = await DidAtp.generate('example.com', ['agents', 'billing']);
console.log(did);                              // did:atp:example.com:agents:billing:...
console.log(keyPair.mlDsa65.publicKey.length); // 1952 (ML-DSA-65 public key bytes)
console.log(DidAtp.isValid(did));              // true
```

`CryptoUtils` provides `generateHybridKeyPair`, `signEd25519` / `verifyEd25519` and `signMlDsa65` / `verifyMlDsa65`. The canonical identifier format lives in [`@atpdeveloper/did-atp`](https://www.npmjs.com/package/@atpdeveloper/did-atp).

## Runnable examples

The package ships examples that need no ATP services:

```bash
cd node_modules/atp-sdk && npm run examples
```

They cover the standalone quickstart, local DID generation, multi-protocol detection, the hybrid signature demo and zero-knowledge challenge flows.

## Where to go next

| Goal | Start here |
| --- | --- |
| Profile schema, built-ins and custom profiles | [`atp-profiles`](https://www.npmjs.com/package/atp-profiles) |
| Canonical `did:atp` identifier primitives | [`@atpdeveloper/did-atp`](https://www.npmjs.com/package/@atpdeveloper/did-atp) |
| A host that enforces allow / approval / deny end to end | [Action-boundary demo](https://github.com/agent-trust-protocol/atp-core/tree/main/examples/action-boundary) |
| Upgrading from 3.x or earlier | [Migration guide](https://github.com/agent-trust-protocol/atp-core/blob/main/packages/sdk/docs/MIGRATION.md) and [CHANGELOG](https://github.com/agent-trust-protocol/atp-core/blob/main/packages/sdk/CHANGELOG.md) |
| Specification design and feedback | [W3C ATP Community Group drafts](https://w3c-cg.github.io/atp/specs/) |

## What's new in 4.0

- `evaluateActionWithProfile` is exported from `atp-sdk` directly.
- A missing or unknown profile returns `deny` instead of throwing.
- **Breaking:** `dev-mode` returns `require_approval` for unrecognized actions instead of `allow`, so no built-in profile now lets an unrecognized action through. To restore the old behaviour in local development, use `{ ...DEV_MODE_PROFILE, unknown_action: 'allow' }`.
- `@atpdeveloper/did-atp` is pinned to `0.1.1`.

## Status and limits

- Security depends on more than the SDK: key storage, the verifier, issuer authority, status checks and the deployment around them.
- Some privacy and zero-knowledge examples are experimental. Do not treat structural proof checks as cryptographic range-proof verification.
- An adapter example does not make ATP dependent on that framework. OpenClaw is a legacy optional adapter.
- Package releases and Community Group drafts have separate lifecycles. The drafts are Community Group work, not W3C Standards, and are not endorsed by W3C. Passing the available conformance suites is not certification of every draft capability.

## Contribute

Try the quickstart, report a reproducible issue, improve an example or propose a conformance vector. See the [contribution guide](https://github.com/agent-trust-protocol/atp-core/blob/main/CONTRIBUTING.md) and the [ATP Core repository](https://github.com/agent-trust-protocol/atp-core). Implementation changes should include tests for the behaviour they add.

Agent Trust Protocol™ is a trademark of Sovr Inc. Licensed under Apache-2.0.
