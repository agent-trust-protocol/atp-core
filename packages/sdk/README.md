# atp-sdk
### Start building with the open trust layer

`atp-sdk` is the TypeScript/JavaScript SDK for Agent Trust Protocol™. It provides a starting point for agent identity and utilities for credentials and trust evidence. ATP is designed to work alongside MCP, A2A, ANP, ADK, and agent frameworks.

[![npm](https://img.shields.io/npm/v/atp-sdk)](https://www.npmjs.com/package/atp-sdk) [![license](https://img.shields.io/npm/l/atp-sdk)](https://github.com/agent-trust-protocol/atp-core/blob/main/LICENSE)

## Quickstart

Node.js 18 or newer.

```bash
npm install atp-sdk
```

```ts
import { Agent } from 'atp-sdk';

const agent = await Agent.quickstart('MyBot');
console.log(agent.getDID());
console.log(agent.isStandalone());
```

This quickstart runs without a hosted ATP service. Standalone identity material is local and ephemeral by default; the identifier is not automatically publicly resolvable. Persist keys securely and connect the services and policies your application requires before relying on it for consequential actions.

Prefer a scaffold? Run `npx create-atp-agent my-agent` and follow the [CLI guide](../create-atp-agent/README.md). The CLI's local onboarding screen saves configuration metadata; it does not mint keys or enforce a policy for you.

## Choose the capability you need

| Goal | Where to start |
| --- | --- |
| Agent quickstart and SDK API | [SDK source and examples](./src/) |
| Canonical `did:atp` identifier primitives | [`@atpdeveloper/did-atp`](../did-atp/README.md) |
| Built-in security profile schema and evaluation | [`atp-profiles`](../atp-profiles/README.md) |
| Available conformance suites | [Runner](../../scripts/conformance.mjs) |
| Specification design and feedback | [Community Group drafts](https://w3c-cg.github.io/atp/specs/) |

The profile evaluator returns a decision; your application or runtime must enforce that decision. A trust score is evidence to evaluate, not a grant of authority by itself. Check issuer authorization and credential status where those capabilities are relevant.

## Status and limits

- The SDK includes hybrid Ed25519 and ML-DSA-65 identity work, but security depends on key storage, the verifier, issuer authority, status checks, and the deployment around it.
- Some privacy and zero-knowledge examples remain experimental. Do not treat structural proof checks as cryptographic range proof verification.
- An adapter example does not make ATP dependent on that framework. OpenClaw is a legacy optional adapter.
- Package releases and Community Group drafts have separate lifecycles. Drafts are not endorsed by W3C and are not W3C Standards. Passing the available conformance suites is not certification of every draft capability.

For a new integration, start with the standalone quickstart, add only the ATP capabilities you need, and open an [issue](https://github.com/agent-trust-protocol/atp-core/issues) when a protocol boundary needs a test case.

## Contribute

Try the quickstart, share a reproducible issue, improve an example, or propose a conformance vector. See the [repository contribution guide](../../CONTRIBUTING.md) and [ATP Core README](../../README.md). Implementation changes should include tests for the behavior they add.

Agent Trust Protocol™ is a trademark of Sovr INC. License: Apache-2.0.
