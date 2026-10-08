# Agent Trust Protocol™
### The Open Trust Layer for AI Agents

AI agents move between tools, organizations, and protocols. ATP is an open effort to make identity, trust evidence, and privacy controls portable across those boundaries. It complements MCP, A2A, ANP, ADK, and agent frameworks; it does not replace how agents communicate.

**Start building:** [SDK quickstart](#start-with-the-sdk) · [Scaffold an agent](#scaffold-a-project) · [Explore packages](#packages) · [Read specification drafts](https://w3c-cg.github.io/atp/specs/) · [Contribute](#help-shape-atp)

> ATP specifications are developed in the [W3C Agent Trust Protocol Community Group](https://www.w3.org/groups/cg/atp/). Community Group drafts are not endorsed by W3C and are not W3C Standards. Implementation support varies by capability; the repository and package READMEs describe what exists today.

## What is here

| Area | Purpose | Current entry point |
| --- | --- | --- |
| Identity | `did:atp` identifiers and hybrid Ed25519/ML-DSA-65 key material | [DID package](packages/did-atp/README.md) |
| Trust | Evidence, credentials, scoring, and issuer/status work | [SDK](packages/sdk/README.md) and [drafts](https://w3c-cg.github.io/atp/specs/) |
| Policy | Reusable profile schema and action evaluation | [Profiles](packages/atp-profiles/README.md) |
| Interoperability | Conformance suites and work across agent systems | [Conformance runner](scripts/conformance.mjs) |

A passing test covers the behavior exercised by that test; it is not certification of every draft feature. Zero-knowledge range claims and some cross-protocol work remain experimental or in development.

## Packages

The package READMEs are the source for APIs, limitations, and examples. Install only what your application needs.

| Package | Use it for | Install |
| --- | --- | --- |
| [`atp-sdk`](packages/sdk/README.md) | Start an agent and use identity, credential, and trust utilities | `npm install atp-sdk` |
| [`create-atp-agent`](packages/create-atp-agent/README.md) | Scaffold a JavaScript ESM starter | `npx create-atp-agent my-agent` |
| [`@atpdeveloper/did-atp`](packages/did-atp/README.md) | Build and inspect canonical `did:atp` identifier primitives | `npm install @atpdeveloper/did-atp` |
| [`atp-profiles`](packages/atp-profiles/README.md) | Define and evaluate built-in security profiles | `npm install atp-profiles` |

OpenClaw remains a legacy optional adapter example, not a required ATP dependency. Use the SDK and canonical packages as the starting point for new integrations.

## Start with the SDK

Node.js 18 or newer is supported by the published package metadata.

```bash
npm install atp-sdk
```

```ts
import { Agent } from 'atp-sdk';

const agent = await Agent.quickstart('MyBot');
console.log(agent.getDID());
```

The standalone quickstart creates local identity material. A local identifier is not automatically publicly resolvable, and this snippet does not configure an issuer, external policy enforcement, or a production key store. See the [SDK guide](packages/sdk/README.md) before connecting real services.

## Scaffold a project

```bash
npx create-atp-agent my-agent
cd my-agent
npm start
```

The CLI creates a starter and offers a local configuration UI. That UI writes metadata; it does not mint a DID, register an issuer, or enforce the selected profile. The generated agent uses the SDK when it runs. See the [CLI guide](packages/create-atp-agent/README.md) for terminal-only and existing-project flows.

## Explore and test

```bash
git clone https://github.com/agent-trust-protocol/atp-core.git
cd atp-core
npm install
npm run conformance
```

The conformance runner exercises available implementation suites. For a package-specific change, follow that package's README and tests. Do not treat a passing run as a W3C certification or a claim that every draft capability is complete.

- [Specification drafts](https://w3c-cg.github.io/atp/specs/)
- [Community Group discussion](https://github.com/w3c-cg/atp)
- [Public developer website](https://agenttrustprotocol.com/)
- [Release/versioning policy](VERSIONING.md)

## Help shape ATP

You can participate without adopting the whole stack:

1. **Try one package** and file a reproducible issue with your Node version and a small example.
2. **Review a draft** and comment on identity, issuer authority, credential status, privacy, or conformance behavior in [the Community Group repository](https://github.com/w3c-cg/atp).
3. **Add an interoperability case** for an agent system you use, including expected behavior and a test vector where possible.
4. **Contribute code or docs** through a focused pull request. Start with [CONTRIBUTING.md](CONTRIBUTING.md).

Issues and pull requests are welcome. Clearly distinguish implemented behavior from draft design and experimental work so other developers can make informed choices.

## Project boundaries

This repository is the open ATP Core implementation and developer tooling. The [website source](https://github.com/agent-trust-protocol/atp-website) is separate. [ATP Studio](https://studio.agenttrustprotocol.com/) is a separate enterprise product with its own infrastructure and data. Do not put Studio credentials, databases, or deployment configuration in ATP Core.

Agent Trust Protocol™ is a trademark of Sovr INC. See [LICENSE](LICENSE) for the repository license and the relevant package license metadata.
