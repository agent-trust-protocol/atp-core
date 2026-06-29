# Agent Trust Protocol™ (ATP) SDK

*The original Agent Trust Protocol™ — securing AI agents since March 2025*

[![npm version](https://badge.fury.io/js/atp-sdk.svg)](https://www.npmjs.com/package/atp-sdk)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Quantum Safe](https://img.shields.io/badge/Security-Quantum%20Safe-blueviolet)](https://github.com/agent-trust-protocol/atp-core)
[![Est. March 2025](https://img.shields.io/badge/Est.-March%202025-green)](https://github.com/agent-trust-protocol/atp-core)

**The identity and trust layer for AI agents.** ATP gives an agent a portable, cryptographically verifiable identity (`did:atp`) and a trust score that travel with it across any protocol it speaks — MCP, A2A, Swarm, ADK, and more. It doesn’t replace those protocols; it’s the layer underneath that answers “who is this agent, and can I trust it?” Identities use hybrid post-quantum signatures (Ed25519 + ML-DSA-65, FIPS 204), so verification holds even if one scheme is broken. Build it in 1 line of code.

> Image guidance: any featured screenshot or illustration should include the ATP shield logo for consistent branding.

```bash
npm install atp-sdk
```

```typescript
import { Agent } from 'atp-sdk';
const agent = await Agent.quickstart('MyBot');
console.log('Standalone:', agent.isStandalone());
//  MyBot ready!
//   DID:          did:atp:a1b2c3...
//   Quantum-safe: yes
//   Standalone:   true
```

**That’s it!** Your AI agent now has:

- **Post-quantum cryptography** (hybrid Ed25519 + ML-DSA-65, FIPS 204)
- **Decentralized Identity** (DID)
- **Cryptographic signatures** for every action
- **Trust scoring** and verification

-----

## Package Status

|Package                       |Version                                                          |Status                             |Install                                   |
|------------------------------|-----------------------------------------------------------------|-----------------------------------|------------------------------------------|
|`atp-sdk`                     |![npm](https://img.shields.io/npm/v/atp-sdk)                     |**Beta**                           |`npm install atp-sdk`                     |
|`@atpdevelopment/openclaw-atp`|![npm](https://img.shields.io/npm/v/@atpdevelopment/openclaw-atp)|**Beta**                           |`npm install @atpdevelopment/openclaw-atp`|
|`create-atp-agent`            |![npm](https://img.shields.io/npm/v/create-atp-agent)            |**Beta**                           |`npx create-atp-agent`                    |
|`atp-core`                    |v1.0.0                                                           |**Legacy**  Superseded by `atp-sdk`|                                          |
|Services (`@atp/*`)           |0.1.0                                                            |**Development**                    |Monorepo only                             |

**Use `atp-sdk`**  the recommended package for application development.  
See [VERSIONING.md](./VERSIONING.md) for full policy.

-----

## Try It Now

Follow the GitHub docs and examples below to get started with ATP, or use the hosted website and dashboard when available.

- Create quantum-safe agents
- See trust scoring in action
- Test quantum-safe signatures
- Run OpenClaw multi-agent workflows
- Explore the policy engine
- Verify blockchain audit trails

-----

## Quick Start (60 Seconds)

### New Developers: Start with Scaffolding

**Interactive CLI (ESM-first, Node 18+):**

```bash
npx create-atp-agent my-agent
```

This creates a project folder with:

- `"type": "module"` and `atp-sdk` in `package.json`
- TypeScript or JavaScript starter (`agent.ts` or `agent.mjs`) with top-level `await`
- `.atp.json` with your chosen security profile
- After install, the CLI opens the **embedded onboarding UI** at `http://127.0.0.1:3456` (next free port if busy). Use `--no-dashboard` to skip, or `--dashboard-only` for the UI without scaffolding.

Then:

```bash
cd my-agent
npm install   # skipped if you chose install during prompts
npm start
```

For the full **web** onboarding wizard (production ATP site), use [agenttrustprotocol.com](https://agenttrustprotocol.com) and `/onboard/agent` when logged into the app.

### Experienced Developers: Add to Existing Project

**If you already have a project, just install the SDK:**

```bash
npm install atp-sdk
```

Then use it:

```typescript
import { Agent } from 'atp-sdk';
const agent = await Agent.quickstart('MyBot');
```

### Zero Install (Nothing on your machine? No problem.)

**Mac / Linux:**

```bash
curl -fsSL https://agenttrustprotocol.com/install.sh | bash
```

**Windows (PowerShell as Admin):**

```powershell
irm https://agenttrustprotocol.com/install.ps1 | iex
```

-----

## What Makes ATP Different?

|Feature         |Traditional Security  |**ATP (Quantum-Safe)**                      |
|----------------|----------------------|--------------------------------------------|
|**Setup**       |Complex infrastructure|1 line of code                              |
|**Quantum Safe**|Vulnerable            |**Protected**                               |
|**Identity**    |Username/password     |Cryptographic DID                           |
|**Trust**       |Manual verification   |Dynamic scoring                             |
|**Audit**       |Basic logs            |Cryptographic proof                         |
|**Protocols**   |Single protocol       |**Protocol-agnostic** (MCP, Swarm, ADK, A2A)|

-----

## Examples

### Basic Agent Communication

```typescript
import { Agent } from 'atp-sdk';

// Create two agents
const alice = await Agent.create('Alice');
const bob = await Agent.create('Bob');

// Send cryptographically signed message
await alice.send(bob.getDID(), 'Hello from Alice!');

// Check trust score
const trustScore = await alice.getTrustScore(bob.getDID());
console.log(`Trust level: ${trustScore}`); // 0.0 to 1.0
```

### Zero-Knowledge Authentication

> ⚠️ **Experimental.** The trust-level / range “proofs” use a hash-based
> commitment (`H(value‖blinding)`), not a true Pedersen commitment, and the
> verifier checks proof *structure* rather than an arithmetic range relation —
> so it does **not** yet cryptographically prevent a prover from claiming a
> threshold it doesn’t meet. A vetted EC/Ristretto + bulletproofs
> implementation is planned. Today’s sound mechanisms are challenge-response
> authentication, selective disclosure, and Merkle membership.

```typescript
// Alice challenges Bob to prove trust level
const challenge = await alice.requestAuth(bob.getDID(), [
  { type: 'trust_level', params: { minTrustLevel: 0.7 } }
]);

// Bob generates a trust-level proof (experimental — see note above)
const response = await bob.respondToChallenge(challenge);

// Alice verifies the response (structural check today; soundness is roadmap)
const result = await alice.verifyAuthResponse(response);
console.log('Verified:', result.verified); // true
```

### Integration with Popular Frameworks

**OpenClaw (Multi-Agent Systems):**

```typescript
import { registerClawWithAtp, wrapSkillWithAtp } from '@atpdevelopment/openclaw-atp';
import { ATPClient } from 'atp-sdk';

// Initialize with a security profile
const atp = new ATPClient({ baseUrl: 'https://api.atp.dev', profileId: 'openclaw-sandbox' });

// Register agent
const { did, trustScore } = await registerClawWithAtp(atp, {
  name: 'trader-agent',
  capabilities: ['trading', 'analysis'],
  trustLevel: 'high'
});

// Secure tools with profile-based action gating
const secureTrade = wrapSkillWithAtp(tradeTool, atp, { actionType: 'network' });
const secureShell = wrapSkillWithAtp(shellTool, atp, { actionType: 'shell' });
```

**LangChain:**

```typescript
import { ATPSecurityWrapper } from 'atp-sdk/langchain';
const secureChain = new ATPSecurityWrapper(langchainAgent, {
  agentName: 'langchain-bot'
});
```

**MCP (Model Context Protocol):**

```typescript
import { MCPServer } from 'atp-sdk/mcp';
const server = new MCPServer({
  name: 'secure-mcp-server',
  quantum_safe: true
});
```

### Security Profiles

ATP includes built-in security profiles that control what agents can and cannot do:

```typescript
import { ATPClient, BUILTIN_PROFILES } from 'atp-sdk';

// Select a profile at initialization
const client = new ATPClient({ baseUrl: 'https://api.atp.dev', profileId: 'safe-default' });

// Or set/change at runtime
client.setProfile('enterprise-locked');

// Evaluate whether an action is allowed
const decision = client.evaluateActionWithProfile({
  actionType: 'shell',        // shell | filesystem | network | credentials | messaging
  state: 'executing',         // planning | executing | communicating | completed
});
console.log(decision); // "allow" | "deny" | "require_approval"
```

|Profile            |Description                            |Use Case         |
|-------------------|---------------------------------------|-----------------|
|`safe-default`     |Read-only FS, shell blocked, full audit|Most agents      |
|`dev-mode`         |All tools enabled, no approval gates   |Local development|
|`enterprise-locked`|Maximum security, strict controls      |Production       |
|`openclaw-sandbox` |OpenClaw-tuned sandbox, state-based    |OpenClaw agents  |

### Onboarding

Register agents via the embedded dashboard, CLI, or web wizard:

```bash
# Scaffold a new ESM-first agent project (interactive CLI).
# After scaffolding, the CLI starts a local onboarding UI at http://127.0.0.1:3456 by default.
npx create-atp-agent my-agent

# Embedded onboarding UI only (no new project folder)
npx create-atp-agent --dashboard-only

# Interactive CLI onboarding (for existing agents)
npx atp-onboard-agent

# Or visit the web wizard on your ATP site, for example:
# /onboard/agent
```

`create-atp-agent` ships a small static wizard plus a mock `POST /api/agents/onboard` on the same port (for local demos). The full Next.js wizard at `/onboard/agent` is separate and can be wired to real ATP services in production.

-----

## Architecture

ATP is designed to layer under any agent protocol — the same `did:atp` identity and trust score apply whether an agent speaks MCP, A2A, Swarm, or ADK:

```
Your AI Agents (LangChain, OpenClaw, AutoGPT, MCP, Swarm, ADK, A2A)
         │
         ▼
    ┌──────────────────────────────────────┐
    │        ATP Security Layer            │
    │  ┌──────────┐ ┌──────────┐ ┌────────┐ │
    │  │ Quantum  │ │   DID    │ │ Trust   │ │
    │  │  Safe    │ │ Identity │ │ Scoring │ │
    │  │  Crypto  │ │ Service  │ │ System  │ │
    │  └──────────┘ └──────────┘ └────────┘ │
    └──────────────────────────────────────┘
                    │
            ┌───────▼───────┐
            │   ATP SDK     │
            │ (3 lines to   │
            │   secure)     │
            └───────────────┘
```

-----

## Specifications & Conformance

ATP is being standardized as a set of open specifications under a dedicated W3C
Community Group. The drafts live in [`docs/specs/`](./docs/specs/index.html) as
[ReSpec](https://respec.org/) documents — start from the
[specifications landing page](./docs/specs/index.html), or open any spec’s
`index.html` in a browser to read the rendered specification. See
[`docs/COMMUNITY-RELEASE.md`](./docs/COMMUNITY-RELEASE.md) for how these are
published to the `w3c-cg/atp` Community Group repository.

|Pillar         |Specification                                                                                                |Maturity                          |
|---------------|-------------------------------------------------------------------------------------------------------------|----------------------------------|
|**Identity**   |[`did:atp` DID Method](./docs/specs/did-atp/index.html) — quantum-safe, hybrid Ed25519 + ML-DSA-65           |Draft + runnable [proof](./proof/)|
|**Trust**      |[Agent Trust Scoring & Credentials](./docs/specs/atp-trust/index.html) — backed by W3C Verifiable Credentials|Early draft                       |
|**Privacy**    |[Pairwise DIDs, Selective Disclosure & ZKP](./docs/specs/atp-privacy/index.html)                             |Early draft                       |
|**Conformance**|[Conformance & Interoperability](./docs/specs/atp-conformance/index.html)                                    |Early draft                       |


> These are **Community Group drafts** — not yet W3C standards — coordinated with
> the [W3C AI Agent Protocol CG](https://www.w3.org/community/agentprotocol/).
> `did:atp` is the most mature, with an end-to-end runnable proof; the trust,
> privacy, and conformance specs are early drafts seeking member review.
> Zero-knowledge range proofs remain experimental (see the note above).

### Conformance suite

One command runs the W3C-style conformance suites for all five core items and
doubles as a CI / release gate (exits non-zero on any failure):

```bash
npm run conformance          # did · sigs · policy · audit · privacy
npm run conformance -- 1     # a single item (here, did:atp)
```

Per-item scripts are also available: `conformance:did`, `conformance:sigs`,
`conformance:policy`, `conformance:audit`, and `conformance:privacy`.

-----

## Installation

```bash
# npm
npm install atp-sdk

# yarn
yarn add atp-sdk

# pnpm
pnpm add atp-sdk
```

-----

## Documentation

- **[ White Paper v2.1](https://github.com/agent-trust-protocol/atp-core/blob/main/docs/white-paper-v2.1.md)**  ATP architecture, trust model, compliance, and roadmap
- **[Quick Start Guide](https://github.com/agent-trust-protocol/atp-core/blob/main/docs/getting-started.md)** - 5-minute setup
- **[API Reference](https://github.com/agent-trust-protocol/atp-core/blob/main/packages/sdk/docs/api/README.md)** - Complete API docs
- **[VERSIONING.md](./VERSIONING.md)** - Package status and versioning policy
- **[OpenClaw Integration](https://github.com/agent-trust-protocol/atp-core/blob/main/docs/openclaw-integration.md)** - Secure multi-agent workflows
- **[Examples](https://github.com/agent-trust-protocol/atp-core/blob/main/packages/sdk/examples)** - Working code examples
- **[Multi-Protocol Support](https://github.com/agent-trust-protocol/atp-core/blob/main/docs/multi-protocol.md)** - MCP, Swarm, ADK, A2A
- **[Troubleshooting](https://github.com/agent-trust-protocol/atp-core/blob/main/docs/troubleshooting.md)** - Common issues
- **[Specifications (W3C CG drafts)](https://github.com/agent-trust-protocol/atp-core/tree/main/docs/specs)** - did:atp, trust, privacy & conformance ReSpec specs
- **[Conformance Suite](https://github.com/agent-trust-protocol/atp-core/blob/main/scripts/conformance.mjs)** - `npm run conformance` interoperability gate

-----

## Deployment

### Vercel (Next.js Frontend)

Deploy the ATP dashboard to Vercel with a single click:

- **[Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md)** - Full setup instructions (env vars, database, email, services)
- **Auto-deploy:** Push to `main` → production | Push to `develop` → preview
- **Quick start:**
  1. Connect this repo to [vercel.com/new](https://vercel.com/new)
  2. Set environment variables from [.env.example](.env.example)
  3. Click “Deploy”

### Backend Services (Railway, Docker, Kubernetes)

Each service in `packages/` has its own deployment guide:

- **[packages/identity-service](./packages/identity-service/README.md)** - DID + agent identity
- **[packages/permission-service](./packages/permission-service/README.md)** - RBAC + policies
- **[packages/audit-logger](./packages/audit-logger/README.md)** - Blockchain audit
- Other services: See individual `packages/*/README.md`

-----

## Multi-Agent Systems with OpenClaw

ATP now provides first-class support for [OpenClaw](https://openclaw.ai) multi-agent frameworks via the [`@atpdevelopment/openclaw-atp`](https://www.npmjs.com/package/@atpdevelopment/openclaw-atp) package. Secure entire agent crews with quantum-safe cryptography:

```typescript
import { OpenClawATPClient } from '@atpdevelopment/openclaw-atp';

// Initialize ATP client with OpenClaw
const atpClient = new OpenClawATPClient({
  profile: 'productionFinance', // Pre-configured security profiles
  enableMonitoring: true
});

// Register agents with ATP identities
const researcher = await atpClient.registerAgent(researchAgent, {
  name: 'market-researcher',
  trustLevel: 'standard'
});

const trader = await atpClient.registerAgent(tradingAgent, {
  name: 'trader',
  trustLevel: 'high',
  capabilities: ['trading', 'execute_orders']
});

// Validate agent graph before execution
const validation = await atpClient.validateCrew(crew);
//  Graph validated: No cycles, trust levels satisfied, data flows secure
```

**Features:**

- **Quantum-safe agent identities** for every OpenClaw agent
- **Tool-level security** with ATP permission checks on every call
- **Security profiles** - Built-in profiles (safe-default, dev-mode, enterprise-locked, openclaw-sandbox) with `evaluateActionWithProfile`
- **Graph validation** - Policy-based constraints on agent interactions
- **Trust-based access control** - Dynamic trust scores adjust permissions
- **Observability integration** - Monitoring feeds into ATP trust engine
- **Secret management** - Short-lived, scoped credentials for external services

[Read the full guide →](https://github.com/agent-trust-protocol/atp-core/blob/main/docs/openclaw-integration.md)

-----

## Community

- **GitHub**: [Issues & Discussions](https://github.com/agent-trust-protocol/atp-core/discussions)
- **Discord**: [Join our community](https://discord.gg/agenttrustprotocol)
- **Twitter**: [@agenttrustproto](https://twitter.com/agenttrustproto)
- **Blog**: [ATP Developer Blog](https://blog.agenttrustprotocol.com)

-----

## Project

[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](https://github.com/agent-trust-protocol/atp-core/blob/main/LICENSE)

-----

## Ready to Build?

|                                                                                                                                                                                 |                                                                                                                                                                                                                        |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|Developers<br>**Start coding in 30 seconds**<br>`npm install atp-sdk`<br>[View Quick Start →](https://github.com/agent-trust-protocol/atp-core/blob/main/docs/getting-started.md)|Enterprise<br>**Built for production**<br> Audit logging designed for SOC 2 programs (certification on roadmap)<br> Enterprise support<br> Custom deployment<br>[Contact Sales →](mailto:support@agenttrustprotocol.com)|

-----

## License

Licensed under [Apache 2.0](https://github.com/agent-trust-protocol/atp-core/blob/main/LICENSE) - free for commercial use.

## Security

Found a security issue? Email [security@agenttrustprotocol.com](mailto:security@agenttrustprotocol.com)

-----

**Agent Trust Protocol™ (ATP)** is developed and operated by **Sovr Labs** — the original Agent Trust Protocol, in development since March 2025. Several projects share the “ATP” acronym; this is the protocol-agnostic identity and trust layer (`did:atp` + post-quantum signatures), not the payments, commerce, or single-platform protocols of the same name. Not affiliated with zCloak Network or any Binance-hosted initiative.

Agent Trust Protocol™  The original agent trust protocol, securing AI agents since March 2025. Protecting AI agents from today’s threats and tomorrow’s quantum computers.

[Website](https://agenttrustprotocol.com)  [Documentation](https://agenttrustprotocol.com/docs)  [GitHub](https://github.com/agent-trust-protocol/atp-core)  [White Paper v2.1](https://github.com/agent-trust-protocol/atp-core/blob/main/docs/white-paper-v2.1.md)