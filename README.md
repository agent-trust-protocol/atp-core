# Agent Trust Protocol SDK 🛡️

[![npm version](https://badge.fury.io/js/atp-sdk.svg)](https://www.npmjs.com/package/atp-sdk)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Quantum Safe](https://img.shields.io/badge/Security-Quantum%20Safe-blueviolet)](https://github.com/agent-trust-protocol/core)

**Build secure AI agents in 3 lines of code.** The world's first quantum-safe security protocol for AI agents with zero-knowledge proof authentication.

```bash
npm install atp-sdk
```

```typescript
import { Agent } from 'atp-sdk';

// Create quantum-safe agent (works immediately!)
const agent = await Agent.create('MyBot');
console.log('DID:', agent.getDID());
console.log('Quantum-safe:', agent.isQuantumSafe()); // true

// Send secure messages
await agent.send('did:atp:other', 'Hello!');
console.log(await agent.getTrustScore('did:atp:other'));
```

**That's it!** Your AI agent now has:
- ✅ **Quantum-safe cryptography** (hybrid Ed25519 + ML-DSA)
- ✅ **Decentralized Identity** (DID)
- ✅ **Cryptographic signatures** for every action
- ✅ **Trust scoring** and verification

---

## 🚀 Quick Start (2 Minutes)

### Option 1: Works Immediately (No Setup)

Perfect for testing and development - no services required:

```typescript
import { Agent } from 'atp-sdk';

const agent = await Agent.create('MyBot');
// Ready to use! Quantum-safe by default
```

### Option 2: Full Features (With ATP Services)

For production use with identity registration and trust scoring:

```bash
# Start ATP services (one command)
docker-compose up -d

# Or run locally
git clone https://github.com/agent-trust-protocol/core.git
cd agent-trust-protocol && npm run services
```

Then use your agent with full features:

```typescript
const agent = await Agent.create('MyBot');
await agent.initialize(); // Connect to ATP network

// Now you have:
// ✅ Identity registration
// ✅ Trust scoring across agents
// ✅ Verifiable credentials
// ✅ Payment protocols
// ✅ Audit trails
```

---

## 🎯 What Makes ATP Different?

| Feature | Traditional Security | **ATP (Quantum-Safe)** |
|---------|---------------------|------------------------|
| **Setup** | Complex infrastructure | 3 lines of code |
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

### Context7 MCP Integration

ATP now includes Context7 MCP server for enhanced documentation capabilities:

```json
{
  "mcpServers": {
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

**Setup:**
1. Get your API key from [Context7](https://mcp.context7.com/)
2. Replace `YOUR_API_KEY` in the configuration
3. Restart your MCP client

---

---

## 🏗️ Architecture

ATP provides universal security across all AI agent protocols:

```
Your AI Agents (LangChain, AutoGPT, MCP, Swarm, ADK, A2A)
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

- **[Quick Start Guide](./docs/getting-started.md)** - 5-minute setup
- **[API Reference](./packages/sdk/docs/api/README.md)** - Complete API docs
- **[Examples](./packages/sdk/examples/)** - Working code examples
- **[Multi-Protocol Support](./docs/multi-protocol.md)** - MCP, Swarm, ADK, A2A
- **[Troubleshooting](./docs/troubleshooting.md)** - Common issues

---

## 🧪 Try It Now

**Interactive Playground:** [Try ATP in your browser](https://playground.atp.dev)

```typescript
// Copy this into the playground
import { Agent } from 'atp-sdk';

const agent = await Agent.create('TestBot');
console.log('Agent created:', agent.getDID());
console.log('Quantum safe:', agent.isQuantumSafe());
```

---

## 🤝 Community

- **GitHub**: [Issues & Discussions](https://github.com/agent-trust-protocol/core/discussions)
- **Discord**: [Join our community](https://discord.gg/agenttrustprotocol)
- **Twitter**: [@agenttrustproto](https://twitter.com/agenttrustproto)
- **Blog**: [ATP Developer Blog](https://blog.agenttrustprotocol.com)

---

## 📊 Stats

[![GitHub stars](https://img.shields.io/github/stars/agent-trust-protocol/core?style=social)](https://github.com/agent-trust-protocol/core)
[![npm downloads](https://img.shields.io/npm/dm/atp-sdk)](https://www.npmjs.com/package/atp-sdk)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](./LICENSE)

---

## 🚀 Ready to Build?

<table>
<tr>
<td>

### 🧑‍💻 Developers
**Start coding in 30 seconds**
```bash
npm install atp-sdk
```
[View Quick Start →](./docs/getting-started.md)

</td>
<td>

### 🏢 Enterprise
**Production-ready security**
- SOC2 compliance ready
- Enterprise support
- Custom deployment
[Contact Sales →](mailto:enterprise@agenttrustprotocol.com)

</td>
</tr>
</table>

---

## 📄 License

Licensed under [Apache 2.0](./LICENSE) - free for commercial use.

## 🛡️ Security

Found a security issue? Email security@agenttrustprotocol.com

---

**Agent Trust Protocol™** - Protecting AI agents from today's threats and tomorrow's quantum computers.

[Website](https://agenttrustprotocol.com) • [Documentation](https://docs.atp.dev) • [GitHub](https://github.com/agent-trust-protocol/core)