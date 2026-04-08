# Agent Trust Protocol™ (ATP) SDK 🛡️

*The original Agent Trust Protocol — securing AI agents since March 2025*

[![npm version](https://badge.fury.io/js/atp-sdk.svg)](https://www.npmjs.com/package/atp-sdk)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Quantum Safe](https://img.shields.io/badge/Security-Quantum%20Safe-blueviolet)](https://github.com/agent-trust-protocol/atp-core)
[![Est. March 2025](https://img.shields.io/badge/Est.-March%202025-green)](https://github.com/agent-trust-protocol/atp-core)

**Build secure AI agents in 1 line of code.** The world's first quantum-safe security protocol for AI agents with zero-knowledge proof authentication.

> 📌 Image guidance: any featured screenshot or illustration should include the ATP shield logo for consistent branding.

```bash
npm install atp-sdk
```

```typescript
import { Agent } from 'atp-sdk';
const agent = await Agent.quickstart('MyBot');
console.log('Standalone:', agent.isStandalone());
// ⚡ MyBot ready!
//   DID:          did:atp:a1b2c3...
//   Quantum-safe: yes
//   Standalone:   true
```

**That's it!** Your AI agent now has:

- ✅ **Quantum-safe cryptography** (hybrid Ed25519 + ML-DSA)
- ✅ **Decentralized Identity** (DID)
- ✅ **Cryptographic signatures** for every action
- ✅ **Trust scoring** and verification

---

## 🎮 Try It Now

Follow the GitHub docs and examples below to get started with ATP, or use the hosted website and dashboard when available.

- 🤖 Create quantum-safe agents
- 📊 See trust scoring in action
- 🔐 Test quantum-safe signatures
- 🚀 Run OpenClaw multi-agent workflows
- 📜 Explore the policy engine
- 🔗 Verify blockchain audit trails

---

## 🚀 Quick Start (60 Seconds)

### Zero Install (Nothing on your machine? No problem.)

**Mac / Linux:**
```bash
curl -fsSL https://agenttrustprotocol.com/install.sh | bash
```

**Windows (PowerShell as Admin):**
```powershell
irm https://agenttrustprotocol.com/install.ps1 | iex
```

This auto-installs Node.js if needed, then scaffolds your agent with an onboarding dashboard.

### Already Have Node.js? One Command:

```bash
npx create-atp-agent
```

This scaffolds your agent project **and** launches an embedded onboarding dashboard in your browser at `http://localhost:3456` - a step-by-step wizard to configure your runtime, security profile, and agent identity. No separate server needed.

Your agent works immediately in **standalone mode** - no backend services, no timeouts, no configuration. Quantum-safe DID is generated locally.

### Or Install the SDK Directly

```bash
npm install atp-sdk
```

```typescript
import { Agent } from 'atp-sdk';
await Agent.quickstart('MyBot');
// Auto-prints DID, quantum-safe status, and connection mode
```

### Full Features (With ATP Services)

When you're ready for identity registration, trust scoring, and verifiable credentials:

```bash
# Start ATP services
docker-compose up -d
```

```typescript
const agent = await Agent.create('MyBot');
// Automatically connects to ATP services when available
// isStandalone() returns false when connected

await agent.send('did:atp:other', 'Hello!');
console.log(await agent.getTrustScore('did:atp:other'));
```

---

## 🎯 What Makes ATP Different?

| Feature | Traditional Security | **ATP (Quantum-Safe)** |
| --- | --- | --- |
| **Setup** | Complex infrastructure | 1 line of code |
| **Quantum Safe** | ❌ Vulnerable | ✅ **Protected** |
| **Identity** | Username/password | Cryptographic DID |
| **Trust** | Manual verification | Dynamic scoring |
| **Audit** | Basic logs | Cryptographic proof |
| **Protocols** | Single protocol | **Universal** (MCP, Swarm, ADK, A2A) |

---

## 📚 Examples

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

```typescript
// Alice challenges Bob to prove trust level
const challenge = await alice.requestAuth(bob.getDID(), [
  { type: 'trust_level', params: { minTrustLevel: 0.7 } }
]);

// Bob generates ZK proof (proves trust >= 0.7 without revealing exact score)
const response = await bob.respondToChallenge(challenge);

// Alice verifies - cryptographically guaranteed
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

| Profile | Description | Use Case |
| --- | --- | --- |
| `safe-default` | Read-only FS, shell blocked, full audit | Most agents |
| `dev-mode` | All tools enabled, no approval gates | Local development |
| `enterprise-locked` | Maximum security, strict controls | Production |
| `openclaw-sandbox` | OpenClaw-tuned sandbox, state-based | OpenClaw agents |

### Onboarding

Register agents via the embedded dashboard, CLI, or web wizard:

```bash
# Scaffold + auto-launch onboarding dashboard in browser
npx create-atp-agent

# Interactive CLI onboarding (for existing agents)
npx atp-onboard-agent

# Or visit the web wizard
# https://your-atp-instance.com/onboard/agent
```

`npx create-atp-agent` launches a self-contained onboarding dashboard at `http://localhost:3456` - no separate server needed. The 4-step wizard guides you through runtime selection, agent naming, security profile, and confirmation.

---

## 🏗️ Architecture

ATP provides universal security across all AI agent protocols:

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

---

## 🔧 Installation

```bash
# npm
npm install atp-sdk

# yarn
yarn add atp-sdk

# pnpm
pnpm add atp-sdk
```

---

## 📖 Documentation

- **[Quick Start Guide](https://github.com/agent-trust-protocol/atp-core/blob/main/docs/getting-started.md)** - 5-minute setup
- **[API Reference](https://github.com/agent-trust-protocol/atp-core/blob/main/packages/sdk/docs/api/README.md)** - Complete API docs
- **[OpenClaw Integration](https://github.com/agent-trust-protocol/atp-core/blob/main/docs/openclaw-integration.md)** - Secure multi-agent workflows
- **[Examples](https://github.com/agent-trust-protocol/atp-core/blob/main/packages/sdk/examples)** - Working code examples
- **[Multi-Protocol Support](https://github.com/agent-trust-protocol/atp-core/blob/main/docs/multi-protocol.md)** - MCP, Swarm, ADK, A2A
- **[Troubleshooting](https://github.com/agent-trust-protocol/atp-core/blob/main/docs/troubleshooting.md)** - Common issues

---

## 🤖 Multi-Agent Systems with OpenClaw

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
// ✅ Graph validated: No cycles, trust levels satisfied, data flows secure
```

**Features:**

- 🔐 **Quantum-safe agent identities** for every OpenClaw agent
- 🛡️ **Tool-level security** with ATP permission checks on every call
- 🎛️ **Security profiles** - Built-in profiles (safe-default, dev-mode, enterprise-locked, openclaw-sandbox) with `evaluateActionWithProfile`
- 📊 **Graph validation** - Policy-based constraints on agent interactions
- 🎯 **Trust-based access control** - Dynamic trust scores adjust permissions
- 📈 **Observability integration** - Monitoring feeds into ATP trust engine
- 🔑 **Secret management** - Short-lived, scoped credentials for external services

[Read the full guide →](https://github.com/agent-trust-protocol/atp-core/blob/main/docs/openclaw-integration.md)

---

## Community

- **GitHub**: [Issues & Discussions](https://github.com/agent-trust-protocol/atp-core/discussions)
- **Discord**: [Join our community](https://discord.gg/agenttrustprotocol)
- **Twitter**: [@agenttrustproto](https://twitter.com/agenttrustproto)
- **Blog**: [ATP Developer Blog](https://blog.agenttrustprotocol.com)

---

## 📊 Stats

[![GitHub stars](https://img.shields.io/github/stars/agent-trust-protocol/atp-core?style=social)](https://github.com/agent-trust-protocol/atp-core)
[![npm downloads](https://img.shields.io/npm/dm/atp-sdk)](https://www.npmjs.com/package/atp-sdk)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](https://github.com/agent-trust-protocol/atp-core/blob/main/LICENSE)

---

## 🚀 Ready to Build?

| | |
| --- | --- |
| 🧑‍💻 Developers<br>**Start coding in 30 seconds**<br>`npm install atp-sdk`<br>[View Quick Start →](https://github.com/agent-trust-protocol/atp-core/blob/main/docs/getting-started.md) | 🏢 Enterprise<br>**Production-ready security**<br>• SOC2 compliance ready<br>• Enterprise support<br>• Custom deployment<br>[Contact Sales →](mailto:llewis@agenttrustprotocol.com) |

---

## 📄 License

Licensed under [Apache 2.0](https://github.com/agent-trust-protocol/atp-core/blob/main/LICENSE) - free for commercial use.

## 🛡️ Security

Found a security issue? Email [llewis@agenttrustprotocol.com](mailto:llewis@agenttrustprotocol.com)

---

**Agent Trust Protocol™ (ATP)** is developed and operated by **Sovr INC**. It is not affiliated with zCloak Network's similarly named protocol or any Binance-hosted initiatives.

Agent Trust Protocol™ — The original agent trust protocol, securing AI agents since March 2025. Protecting AI agents from today's threats and tomorrow's quantum computers.

[Website](https://agenttrustprotocol.com) • [Documentation](https://agenttrustprotocol.com/docs) • [GitHub](https://github.com/agent-trust-protocol/atp-core)
