# OpenClaw Integration Guide

*Secure your OpenClaw multi-agent workflows with ATP's quantum-safe security layer*

---

## Overview

The [`@atpdevelopment/openclaw-atp`](https://www.npmjs.com/package/@atpdevelopment/openclaw-atp) package provides first-class integration between Agent Trust Protocol™ and [OpenClaw](https://openclaw.ai), enabling quantum-safe identity, trust scoring, and audit trails for your OpenClaw agents.

---

## Installation

```bash
npm install @atpdevelopment/openclaw-atp atp-sdk
```

---

## Quick Start

### 1. Initialize the ATP Client

```typescript
import { OpenClawATPClient } from '@atpdevelopment/openclaw-atp';

const atpClient = new OpenClawATPClient({
  profile: 'productionFinance', // Pre-configured security profiles
  enableMonitoring: true
});
```

### 2. Register Agents with ATP Identities

Every OpenClaw agent gets a quantum-safe DID (Decentralized Identifier):

```typescript
const researcher = await atpClient.registerAgent(researchAgent, {
  name: 'market-researcher',
  trustLevel: 'standard'
});

const trader = await atpClient.registerAgent(tradingAgent, {
  name: 'trader',
  trustLevel: 'high',
  capabilities: ['trading', 'execute_orders']
});
```

### 3. Secure Tools

Wrap all tools with ATP permission checks:

```typescript
import { registerAgentWithAtp, secureTools } from '@atpdevelopment/openclaw-atp';
import { ATPClient } from 'atp-sdk';

const atp = new ATPClient();
const { agent } = await registerAgentWithAtp(atp, openclawAgent, {
  name: 'trader-agent',
  capabilities: ['trading', 'analysis'],
  trustLevel: 'high'
});

const securedTools = secureTools(agent.did, tools, atp);
```

### 4. Validate Agent Graphs

Before execution, validate that trust levels and data flows meet policy requirements:

```typescript
const validation = await atpClient.validateCrew(crew);
// ✅ Graph validated: No cycles, trust levels satisfied, data flows secure
```

---

## Features

### Quantum-Safe Agent Identities

Every registered agent receives a hybrid Ed25519 + ML-DSA keypair, providing protection against both classical and quantum attacks.

### Tool-Level Security

ATP intercepts every tool call and validates:
- The calling agent has the required trust level
- The agent holds valid credentials for the requested capability
- The permission has not expired

### Graph Validation

Policy-based constraints on agent interaction graphs prevent:
- Circular trust dependencies
- Unauthorized data flows between agents
- Privilege escalation through agent chaining

### Trust-Based Access Control

Dynamic trust scores adjust permissions in real-time based on agent behavior, credential validity, and peer endorsements.

### Observability Integration

Monitoring data feeds directly into ATP's trust engine, correlating agent performance with trust score adjustments.

### Secret Management

Short-lived, scoped credentials for external services with automatic rotation and revocation support.

---

## Security Profiles

Pre-configured profiles for common use cases:

| Profile | Trust Level | Use Case |
| --- | --- | --- |
| `development` | Low | Local testing and development |
| `productionGeneral` | Standard | General production workloads |
| `productionFinance` | High | Financial services and trading |
| `productionHealthcare` | High | HIPAA-compliant healthcare workflows |
| `custom` | Configurable | Custom policy definitions |

---

## API Reference

See the [full API documentation](https://github.com/agent-trust-protocol/atp-core/blob/main/packages/sdk/docs/api/README.md) for complete type definitions and method signatures.

---

## Troubleshooting

For common issues, see the [Troubleshooting Guide](https://github.com/agent-trust-protocol/atp-core/blob/main/docs/troubleshooting.md).

---

## Support

- **GitHub Issues**: [agent-trust-protocol/atp-core](https://github.com/agent-trust-protocol/atp-core/issues)
- **Discord**: [Join our community](https://discord.gg/agenttrustprotocol)
- **Email**: [llewis@agenttrustprotocol.com](mailto:llewis@agenttrustprotocol.com)

---

**Agent Trust Protocol™** — The original agent trust protocol, securing AI agents since March 2025.
