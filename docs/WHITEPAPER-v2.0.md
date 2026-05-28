# Agent Trust Protocol™ (ATP) — White Paper v2.0

**Sovr INC | April 2026**
[agenttrustprotocol.com](https://agenttrustprotocol.com) · [github.com/agent-trust-protocol/atp-core](https://github.com/agent-trust-protocol/atp-core)

---

## Investor Memo

Agent Trust Protocol™ (ATP) is an open-source security layer for AI agents that solves the core trust problem enterprises face as they move from experiments to production: *"How do we let agents act autonomously on money, contracts, and sensitive data — and still know, prove, and control what they're doing?"*

Built by Sovr INC and already running at version 1.1.0, ATP gives agents cryptographic identities, verifiable trust scores, zero-knowledge–based authentication, and quantum-safe signatures — in a framework-agnostic design that plugs into MCP, A2A, LangChain, AutoGPT, OpenClaw, and other leading runtimes. This positions ATP as a neutral, infrastructure-level primitive that can be adopted across the emerging agent ecosystem, creating defensible network effects around policy, attestations, and compliance-grade audit trails.

```bash
npm install atp-sdk
```

```typescript
import { Agent } from 'atp-sdk';
const agent = await Agent.quickstart('MyBot');
// ⚡ MyBot ready — DID + quantum-safe crypto + audit trail active
```

---

## Abstract

Autonomous AI agents are rapidly becoming the execution layer of modern enterprises. They draft and negotiate contracts, initiate and reconcile payments, query sensitive internal systems, and act on behalf of employees, customers, and counterparties across heterogeneous environments. These agents often operate with minimal human oversight, traversing internal services, third-party APIs, SaaS platforms, and partner networks.

In this environment, traditional application-centric security controls — role-based access, static API keys, perimeter firewalls, and isolated audit logs — are no longer sufficient to answer basic questions like: *"Who authorized this action?"*, *"Was the agent allowed to do this at this time, under this policy?"*, and *"Can we prove compliance to a regulator or auditor?"*

Agent Trust Protocol™ (ATP) is an open-source security framework designed to provide a consistent, verifiable trust layer for AI agents in production environments. Developed by Sovr INC, ATP gives agents cryptographic identities, policy-bound capabilities, and verifiable trust scores that can be evaluated before actions are taken and audited after the fact. It combines zero-knowledge–based authentication, quantum-safe signatures, and structured evidence of agent behavior so that every decision and downstream effect can be tied back to an explicit authorization chain and set of policies.

For security and compliance teams, this means they can define what agents are allowed to do, monitor what they actually do, and prove that the system behaved correctly — even when tasks cross multiple vendors, runtimes, and infrastructure layers.

ATP is framework-agnostic and designed to sit alongside existing investments rather than replace them. It integrates with MCP, A2A, LangChain, AutoGPT, and OpenClaw, and can be layered on top of existing identity, access management, and logging systems. This makes it possible for enterprises to introduce AI agents into regulated, high-risk workflows while maintaining strong guarantees around authorization, non-repudiation, auditability, and long-term cryptographic resilience.

---

## 1. The Problem: Trust Is the Missing Primitive

The AI agent ecosystem is growing fast — but it is growing without a shared foundation for trust.

Today, every team deploying AI agents builds its own security layer from scratch. One team hardcodes API keys. Another writes custom middleware to log agent decisions. A third builds an ad-hoc policy engine that only works for their specific runtime. These approaches are not composable, not independently verifiable, and do not scale beyond the team that built them. When an agent crosses system boundaries — touching a third-party API, calling a partner service, or orchestrating a sub-agent — trust breaks down entirely.

The result is a structural gap between what AI agents *can* do and what enterprises can safely *allow* them to do. Agents are capable of executing high-stakes actions — moving money, generating legal text, accessing sensitive records — but there is currently no standard way to:

- Verify *who* an agent is or *who* delegated its authority
- Express *what* it is allowed to do under *which* conditions
- Produce tamper-evident evidence of *what it actually did and why*
- Prove compliance to an auditor, regulator, or counterparty

This is not a model capability problem. It is an infrastructure problem — and ATP is the infrastructure.

### Why Existing Solutions Fall Short

Current approaches to agent security rely on mechanisms designed for human users and static software services. They were not designed for agents that act autonomously, spawn sub-agents, and operate across trust boundaries at machine speed.

- **API keys and OAuth tokens** establish basic identity but carry no capability constraints, no policy context, and no audit semantics. A stolen or misconfigured token gives an agent unlimited access, with no record of what it was supposed to do.
- **Centralized access control systems** require all decisions to route through a single policy engine — which becomes a bottleneck and a single point of failure in distributed agentic workflows.
- **Perimeter-based logging and SIEM tools** can record that something happened, but they cannot prove that the agent had authorization to do it, or reconstruct the chain of delegation that led to a given action.
- **Runtime-specific trust mechanisms** (such as those built into individual orchestration frameworks) are not portable. A trust decision made in LangChain cannot be verified by a downstream MCP server or an A2A peer.

ATP does not replace these systems. It provides the shared trust language and evidence layer that makes them composable across heterogeneous agent environments.

---

## 2. What ATP Does

ATP is best understood as three things working together:

1. **A shared identity and capability language** — a standard way to say who an agent is, what it is allowed to do, and on whose behalf it is acting.
2. **A policy and evidence engine** — a mechanism for evaluating whether a proposed action is permitted before it happens, and for recording cryptographically what actually happened after.
3. **A portable verification layer** — a set of structures and protocols that any system, auditor, or regulator can independently verify, without trusting the agent itself or the platform it runs on.

Together, these three components give enterprises the ability to deploy AI agents in high-stakes workflows with confidence — not by restricting what agents can do, but by making agent behavior visible, auditable, and provably compliant.

### Core Concepts

**Identities and Principals**
Every entity in ATP — whether a human user, an AI agent, a service, or an organization — has a cryptographic identity. Identities are not just names; they are verifiable, and they carry a chain of delegation that shows who authorized whom to act. When an agent takes an action, the system can trace the authority for that action back to a human principal or organizational policy.

**Capabilities and Delegations**
ATP uses a capability model rather than a permission model. Instead of granting access to a resource, a principal grants a specific, scoped capability — for example, *"read invoice data for customer X between 9am and 5pm, and only within this workflow context."* Capabilities can be delegated from one agent to another, with each delegation cryptographically signed. Sub-agents inherit only the authority they actually need, not the full scope of their parent.

**Policies and Constraints**
Trust decisions in ATP are governed by explicit policies — machine-readable rules that define what an agent can do, when, under what conditions, and with what resource limits. Policies are evaluated at runtime before any action is executed. If an agent attempts something outside its policy, the action is blocked and the attempt is logged.

**Evidence and Attestations**
When an agent executes an action, ATP generates a structured evidence record — a signed, tamper-evident log entry that captures what was done, why (the policy that authorized it), who the agent was, and what the outcome was. These records are the foundation of ATP's auditability story. They allow security teams, compliance officers, and auditors to reconstruct agent behavior at any level of granularity.

**Trust Scoring**
ATP maintains a verifiable trust score for each agent identity, derived from its behavioral history, attestation quality, and compliance record. Trust scores are updated continuously and can be used to gate access to sensitive capabilities — for example, requiring a higher trust score before an agent is allowed to initiate financial transactions above a certain threshold.

**Quantum-Safe Signatures**
All cryptographic operations in ATP use quantum-resistant algorithms. ATP implements a hybrid model combining classical Ed25519 with ML-DSA (CRYSTALS-Dilithium), per NIST FIPS 203/204/205 post-quantum standards. ATP's trust records and identity proofs will remain valid and verifiable even as quantum computing capabilities advance — a critical consideration for organizations building compliance infrastructure meant to last.

---

## 3. Architecture and Components

ATP is structured as a lightweight, composable framework. Its core components are designed to be adopted incrementally — teams can start with identity and basic capability enforcement, then add policy evaluation, trust scoring, and audit trails over time.

### ATP Core (v1.1.0)

The ATP Core library is the foundation of the framework. It provides:

- Cryptographic identity generation and management (quantum-safe by default)
- Capability token issuance, delegation, and verification
- Policy expression and runtime evaluation
- Evidence record generation and signing
- Trust score computation and attestation

ATP Core is open-source, **Apache 2.0–licensed**, and available at [github.com/agent-trust-protocol/atp-core](https://github.com/agent-trust-protocol/atp-core). Install with:

```bash
npm install atp-sdk
```

### ATP Policy Engine

The ATP Policy Engine handles the real-time evaluation of capability requests against defined policies. It is stateless and horizontally scalable, making it suitable for high-throughput agentic workloads. Policies are expressed in a human-readable DSL and can be versioned, audited, and tested independently of the agents they govern.

Built-in security profiles:

| Profile | Description | Use Case |
|---------|-------------|----------|
| `safe-default` | Read-only FS, shell blocked, full audit | Most agents |
| `dev-mode` | All tools enabled, no approval gates | Local development |
| `enterprise-locked` | Maximum security, strict controls | Production |
| `openclaw-sandbox` | OpenClaw-tuned sandbox, state-based | OpenClaw agents |

### ATP Audit Store

The ATP Audit Store is a tamper-evident log backend that persists evidence records generated by agent actions. It supports pluggable storage backends (including relational databases, object stores, and distributed ledgers) and exposes a standardized query API for compliance review, incident investigation, and regulatory reporting.

### ATP Trust Registry

The ATP Trust Registry maintains the trust score ledger for all registered agent identities. It exposes a read API that downstream systems can query before granting access to sensitive capabilities. The registry is designed to be federated — organizations can run their own registries and federate trust scores across organizational boundaries.

### System Architecture

```
Your AI Agents (LangChain, OpenClaw, AutoGPT, MCP, Swarm, ADK, A2A)
         │
         ▼
    ┌──────────────────────────────────────┐
    │         ATP Security Layer           │
    │  ┌──────────┐ ┌──────────┐ ┌───────┐ │
    │  │ Quantum  │ │   DID    │ │ Trust │ │
    │  │  Safe    │ │ Identity │ │ Score │ │
    │  │  Crypto  │ │ Service  │ │System │ │
    │  └──────────┘ └──────────┘ └───────┘ │
    │  ┌──────────┐ ┌──────────┐ ┌───────┐ │
    │  │  Policy  │ │  Audit   │ │  ZK   │ │
    │  │  Engine  │ │  Store   │ │Proofs │ │
    │  └──────────┘ └──────────┘ └───────┘ │
    └──────────────────────────────────────┘
```

---

## 4. Integration and Deployment

ATP is designed to fit into existing infrastructure, not replace it.

### Runtime Integrations

ATP v1.1.0 ships with first-party integration support for:

| Runtime / Framework | Integration Type | Status |
|---------------------|------------------|--------|
| MCP (Model Context Protocol) | Native middleware | ✅ Stable |
| A2A (Agent-to-Agent) | Protocol adapter | ✅ Stable |
| LangChain | Plugin / callback | ✅ Stable |
| AutoGPT | Plugin wrapper | ✅ Stable |
| OpenClaw | Native middleware | ✅ Stable |
| Custom runtimes | SDK (TypeScript, Python) | ✅ Stable |

### Code Examples

**One-line quickstart:**
```typescript
import { Agent } from 'atp-sdk';
const agent = await Agent.quickstart('MyBot');
// DID, quantum-safe keys, audit trail — all active immediately
```

**Zero-knowledge authentication:**
```typescript
const challenge = await alice.requestAuth(bob.getDID(), [
  { type: 'trust_level', params: { minTrustLevel: 0.7 } }
]);
const response = await bob.respondToChallenge(challenge);
const result = await alice.verifyAuthResponse(response);
console.log('Verified:', result.verified); // true
```

**OpenClaw multi-agent integration:**
```typescript
import { OpenClawATPClient } from '@atpdevelopment/openclaw-atp';
const atpClient = new OpenClawATPClient({ profile: 'enterprise-locked', enableMonitoring: true });
const researcher = await atpClient.registerAgent(researchAgent, { name: 'researcher', trustLevel: 'standard' });
const validation = await atpClient.validateCrew(crew);
// ✅ Graph validated: No cycles, trust levels satisfied, data flows secure
```

**MCP integration:**
```typescript
import { MCPServer } from 'atp-sdk/mcp';
const server = new MCPServer({ name: 'secure-mcp-server', quantum_safe: true });
```

**LangChain integration:**
```typescript
import { ATPSecurityWrapper } from 'atp-sdk/langchain';
const secureChain = new ATPSecurityWrapper(langchainAgent, { agentName: 'langchain-bot' });
```

### Enterprise Deployment Patterns

**Sidecar pattern** — Deploy ATP as a sidecar to each agent instance, intercepting all capability requests and action outputs. Minimal code changes to existing agent logic.

**Gateway pattern** — Deploy ATP as a centralized gateway that all agent-to-service and agent-to-agent communications route through. Easier to manage at scale; slightly higher latency.

**Embedded pattern** — Integrate ATP Core directly into the agent framework or runtime. Best performance; requires deeper integration effort.

---

## 5. Compliance and Assurance

For enterprise security and compliance teams, ATP addresses several critical requirements that are difficult or impossible to meet with existing tools.

### Authorization and Non-Repudiation

Every agent action in an ATP-governed environment is tied to an explicit, signed authorization. It is always possible to answer the question *"Was this agent allowed to do this?"* — not with a probabilistic guess, but with a verifiable cryptographic proof.

### Audit Trail Quality

ATP evidence records are designed to meet the audit trail standards required by major compliance frameworks. Each record includes:

- A unique, tamper-evident identifier
- The agent identity and delegation chain
- The capability token authorizing the action
- The policy version that was evaluated
- The action taken and its outcome
- A timestamp with cryptographic integrity
- A quantum-safe signature

This structure supports compliance audits under **SOC 2 Type II**, **ISO 27001**, **PCI DSS**, and **EU AI Act Article 12** (mandatory logging for high-risk AI systems).

### Policy as Code

ATP policies are machine-readable and version-controlled. Policy changes are auditable — organizations can track who changed what policy, when, and why. Policy testing tools allow teams to simulate agent behavior against proposed policy changes before deployment.

### Regulatory Readiness

| Framework | ATP Coverage |
|-----------|-------------|
| EU AI Act (Article 12) | ✅ Tamper-evident audit records, timestamped and signed |
| SOC 2 Type II | ✅ Full audit trail, policy enforcement documentation |
| ISO 27001 | ✅ Identity management, access control, audit logging |
| PCI DSS | ✅ Authorization chains, non-repudiation |
| NIST FIPS 203/204/205 | ✅ ML-KEM, ML-DSA, SPHINCS+ post-quantum standards |
| Zero Trust Architecture | ✅ DID identity, no implicit trust, continuous verification |

---

## 6. Trust Scoring in Practice

Trust scores are one of ATP's most operationally useful features for enterprise teams.

An agent's trust score reflects the cumulative quality of its behavior over time — including the consistency of its capability usage, the accuracy of its self-reported context, and its compliance with policy constraints. Scores are computed from signed attestations and are therefore resistant to manipulation by the agent itself.

Trust scores unlock new access control patterns:

- **Graduated access** — New or untested agents start with limited capabilities and earn broader access as their trust score grows.
- **Behavioral anomaly detection** — A sudden drop in an agent's trust score (caused by unexpected policy violations or anomalous action patterns) can trigger automatic capability suspension and human review.
- **Cross-organizational trust federation** — Organizations can define trust score thresholds for accepting capability delegations from external agents — enabling secure, auditable agent-to-agent interactions across organizational boundaries.

---

## 7. Open-Core Business Model

ATP is **100% open source under Apache 2.0**. The core protocol, SDK, and audit framework are free forever.

| Tier | Price | What's Included |
|------|-------|-----------------|
| **Open Source** | Free | Full SDK, DID, VCs, quantum-safe crypto, audit trail, policy engine, ZK proofs, offline mode |
| **ATP Cloud** | Subscription | Managed registry, dashboards, SSO, SOC 2, 99.9% SLA, 24/7 support |
| **Enterprise** | Custom | Dedicated deployment, PKI integration, HSM support, compliance consulting, private deployment |

The open-core model creates compounding network effects: every developer who adopts ATP free strengthens the ecosystem, drives enterprise discovery, and reinforces ATP's position as the standard.

---

## 8. Roadmap

| Milestone | Timeline | Status |
|-----------|----------|--------|
| ATP Core v1.0 — DID, VCs, hybrid crypto, audit | Q1 2026 | ✅ Released |
| ATP SDK v1.1.0 — TypeScript, Python, one-line integration | Q1 2026 | ✅ Released |
| OpenClaw integration (`@atpdevelopment/openclaw-atp`) | Q1 2026 | ✅ Released |
| Developer Portal launch | Q2 2026 | 🔄 In Progress |
| ATP Cloud (managed registry, dashboards, SSO) | Q2 2026 | 🔄 In Progress |
| NIST AI Agent Standards Initiative participation | Q2 2026 | 🔄 Active |
| W3C standardization engagement | Ongoing | 🔄 Active (since March 2025) |
| Cross-runtime policy federation | Q3 2026 | 📋 Planned |
| Regulatory reporting templates (SOC 2, ISO 27001, EU AI Act) | Q3 2026 | 📋 Planned |
| ZK proof upgrades — expanded agent context attestation | Q3 2026 | 📋 Planned |
| Verifiable agent marketplace listings | Q4 2026 | 📋 Planned |

---

## 9. Why Now

Three forces are converging simultaneously:

**1. The infrastructure is ready.** MCP, A2A, and ACP have established the agent protocol ecosystem. The data-access and transaction layers exist. The trust layer is the final missing piece — and the most critical one.

**2. The regulatory window is open.** NIST's AI Agent Standards Initiative launched February 2026, explicitly calling for open-source, community-led agent identity and security protocols. The Digital Chamber submitted formal AI agent identity standards responses to NIST in April 2026. The standard has not yet been set. ATP can be that standard.

**3. The threat is materializing now.** Agentic systems are being deployed at scale with no cryptographic trust infrastructure. ARK Invest projects AI agents will facilitate more than $8 trillion in online transactions by 2030, with $28 trillion in digital assets and $11 trillion in tokenized real-world assets operating on agent-executed workflows. Every day of deployment without ATP-class security is a day of increasing systemic risk.

The quantum timeline is a bonus, not the primary urgency. The urgency is today: agents making decisions, executing transactions, and accessing data with no verifiable identity, no authorization record, and no audit trail. ATP fixes this now, while also future-proofing against the quantum threat with NIST-standard post-quantum cryptography.

---

## 10. Get Started

```bash
# npm
npm install atp-sdk

# yarn
yarn add atp-sdk

# pnpm
pnpm add atp-sdk
```

```typescript
import { Agent } from 'atp-sdk';
const agent = await Agent.quickstart('MyBot');
// Your agent now has cryptographic identity, quantum-safe keys, and a full audit trail.
```

- **GitHub:** [github.com/agent-trust-protocol/atp-core](https://github.com/agent-trust-protocol/atp-core)
- **Website:** [agenttrustprotocol.com](https://agenttrustprotocol.com)
- **Docs:** [agenttrustprotocol.com/developers](https://agenttrustprotocol.com/developers)
- **npm:** [npmjs.com/package/atp-sdk](https://www.npmjs.com/package/atp-sdk)
- **Enterprise:** [llewis@agenttrustprotocol.com](mailto:llewis@agenttrustprotocol.com)
- **License:** Apache 2.0 — free forever
- **Version:** ATP v1.1.0

---

## About Sovr INC

Sovr INC is the company behind Agent Trust Protocol™. Sovr builds open-source infrastructure for the AI agent ecosystem, focused on security, trust, and compliance. ATP is Sovr's flagship open-source project, first released in **March 2025** and now in active production use.

**Agent Trust Protocol™ is a trademark of Sovr INC. All rights reserved.**

---

*Source: ARK Investment Management LLC, Big Ideas 2026, January 2026. For informational purposes only. Not investment advice.*

*Agent Trust Protocol™ | Sovr INC | Apache 2.0 | April 2026*
