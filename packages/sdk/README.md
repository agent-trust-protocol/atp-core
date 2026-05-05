# atp-sdk - Agent Trust Protocol SDK

> **The First Quantum-Safe AI Agent SDK with Zero-Knowledge Proof Authentication**

ATP provides universal quantum-safe security for all AI agent protocols (MCP, Swarm, ADK, A2A, and more). Build secure, verifiable, and trustworthy AI agents in 1 line of code!

**One unified SDK** - Quantum-safe cryptography + ZKP authentication + Identity + Credentials + Payments - all included.

[![npm version](https://badge.fury.io/js/atp-sdk.svg)](https://www.npmjs.com/package/atp-sdk)
[![Publish to npm](https://github.com/agent-trust-protocol/atp-core/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/agent-trust-protocol/atp-core/actions/workflows/npm-publish.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Quantum Safe](https://img.shields.io/badge/Security-Quantum%20Safe-blueviolet)](https://github.com/agent-trust-protocol/core)

##  Get Started in 30 Seconds

### Option 1: Scaffold with Onboarding Dashboard

Use the [`create-atp-agent`](https://www.npmjs.com/package/create-atp-agent) CLI (ESM-first template, Node 18+):

```bash
npx create-atp-agent my-agent
```

This creates `my-agent/` with `atp-sdk`, starter agent code, and `.atp.json` for the profile you pick. After scaffolding, the CLI starts an embedded onboarding UI at **`http://127.0.0.1:3456`** (or the next free port) and opens your browser. Flags: `--no-dashboard`, `--dashboard-only`, `--no-open` (or `CREATE_ATP_AGENT_NO_OPEN=1`). The local UI uses a **mock** onboard API for demos; wire real ATP services in your own app.

For the hosted marketing site and full product UI, see **[agenttrustprotocol.com](https://agenttrustprotocol.com)** (including the web wizard at `/onboard/agent` in this repos Next.js app).

### Option 2: Install the SDK Directly

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

One line. Auto-prints DID, quantum-safe status, and connection mode. Need the agent reference? Use `const agent = await Agent.quickstart('MyBot')`. Need silent creation for library use? Use `Agent.create('MyBot')` instead.

**That's it!** Your agent now has:

>  Image guidance: any screenshots, badges, or marketing assets should feature the ATP shield logo for consistent branding.

-  Quantum-safe cryptography (hybrid Ed25519 + ML-DSA)
-  Decentralized Identity (DID)
-  Cryptographic signatures
-  Trust scoring

##  Standalone Mode (Offline-First)

`Agent.create()` works immediately without any backend services. When ATP services are unavailable, the agent automatically falls back to **standalone mode**:

- DID is generated locally from the quantum-safe keypair
- No 30-second timeout or crash
- All crypto operations work offline
- `agent.isStandalone()` returns `true`

When ATP services are running, the agent connects automatically and `isStandalone()` returns `false`, enabling full features like trust scoring, verifiable credentials, and identity registration.

```typescript
const agent = await Agent.create('MyBot');

if (agent.isStandalone()) {
  console.log('Running offline - DID generated locally');
} else {
  console.log('Connected to ATP network');
  await agent.send('did:atp:other', 'Hello!');
  console.log(await agent.getTrustScore('did:atp:other'));
}
```

### Full Setup (With ATP Services)

```bash
docker-compose up -d
```

Then agents will automatically connect on creation - no code changes needed.

##  Full SDK Documentation

For advanced usage, see the complete API documentation below...

##  Documentation

- **[Complete Documentation](./docs/README.md)** - Comprehensive guides and API reference
- **[API Reference](./docs/api/README.md)** - Detailed API documentation
- **[Public API Surface](./docs/API-SURFACE.md)** - Stable exports for developers
- **[Migration Guide](./docs/MIGRATION.md)** - Upgrade notes and defaults
- **[Examples](./examples/README.md)** - Practical examples and use cases
- **[Configuration Guide](./docs/guides/configuration.md)** - Advanced configuration options
- **[Authentication Guide](./docs/guides/authentication.md)** - Security and authentication patterns
- **[Best Practices](./docs/guides/best-practices.md)** - Production-ready guidelines
- **[Troubleshooting](./docs/guides/troubleshooting.md)** - Common issues and solutions

##  ATP: The Ecosystem Security Layer

**Agent Trust Protocol (ATP) is the universal security layer for the AI agent ecosystem.** 

Unlike protocol-specific security solutions, ATP works across all agent protocols:
- **MCP** (Model Context Protocol) - Anthropic
- **Swarm** - OpenAI multi-agent orchestration  
- **ADK** (Agent Development Kit) - Google
- **A2A** (Agent2Agent) - Vendor-neutral protocol
- **Any custom protocol** - ATP adapts to your needs

ATP provides:
-  **Universal Security**: One security layer for all protocols
-  **Quantum-Safe**: Future-proof cryptography (ML-DSA + Ed25519)
-  **Trust Management**: Dynamic trust scoring across protocols
-  **Audit Trail**: Immutable logging for compliance
-  **Identity**: Decentralized identity (DID) for all agents

##  Features

###  **Multi-Protocol Support** (NEW in v1.1!)
- **Universal Security Layer** - Works with MCP, Swarm, ADK, and A2A protocols
- **Automatic Protocol Detection** - Identifies agent protocol automatically
- **Unified Monitoring** - Monitor all agents through single interface
- **Quantum-Safe Security** - Post-quantum cryptography across all protocols
- **Trust Scoring** - Consistent trust metrics regardless of protocol
- **Audit Trail** - Immutable logging for all protocol events

[Learn more about multi-protocol support →](./docs/MULTI-PROTOCOL-SUPPORT.md)

###  **Zero-Knowledge Proof Authentication** (NEW in v1.2!)
- **Agent-to-Agent Authentication** - Cryptographic proofs without revealing secrets
- **Behavior-Based Proofs** - Prove compliance history without exposing interaction details
- **Trust Level Verification** - Prove minimum trust score without revealing exact value
- **Credential Proofs** - Selective disclosure of verifiable credentials
- **Identity Proofs** - DID ownership verification
- **Mutual Authentication** - Both agents verify each other simultaneously

```typescript
import { Agent } from 'atp-sdk';

// Create two agents
const alice = await Agent.create('Alice');
const bob = await Agent.create('Bob');

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

**Behavior-Based Proofs** - ATP's unique differentiator:

```typescript
// Record agent interactions over time
bob.recordInteraction('task-1', 'success');
bob.recordInteraction('task-2', 'success');
bob.recordInteraction('task-3', 'success');

// Prove 100% success rate without revealing individual interactions
const behaviorProof = await bob.proveBehavior({
  type: 'success_rate',
  threshold: 95
});

// Verify the proof
const valid = await alice.verifyBehaviorProof(behaviorProof, {
  type: 'success_rate',
  threshold: 95
});
```

###  **Payment Protocols**
- **Google AP2 Integration** - Agent Payments Protocol with mandate-based authorization
- **OpenAI ACP Support** - Agentic Commerce Protocol for ChatGPT commerce
- Intent & Cart Mandates with cryptographic signatures
- Multi-payment support (cards, crypto, stablecoins, bank transfers)
- Payment policy enforcement and spending limits
- Complete audit trail for all transactions
- Verifiable credentials for payment authorization

###  **Identity Management**
- Generate and manage Decentralized Identifiers (DIDs)
- Register and resolve identities on the ATP network
- Multi-factor authentication (TOTP, SMS, Email)
- Trust level management and verification
- Cryptographic key rotation and recovery

###  **Verifiable Credentials**
- Create and manage credential schemas
- Issue tamper-proof verifiable credentials
- Generate and verify presentations
- Credential lifecycle management (suspend, revoke, reactivate)
- Zero-knowledge proof support

###  **Permissions & Access Control**
- Policy-based access control (PBAC)
- Fine-grained permission management
- Capability token delegation
- Real-time access decision evaluation
- Comprehensive audit trails

###  **Audit & Compliance**
- Immutable audit logging
- Blockchain anchoring for integrity
- Advanced query and search capabilities
- Compliance reporting and data export
- Real-time monitoring and alerts

###  **Real-time Features**
- WebSocket event streaming
- Live security monitoring
- Service health monitoring
- Connection management with auto-reconnection
- Event filtering and processing

##  Architecture

The ATP™ SDK provides a unified interface to multiple microservices:

```
┌─────────────────┐    ┌──────────────────────────────────────┐
│   Your App      │    │            ATP™ SDK                  │
│                 │    │                                      │
│  ┌───────────┐  │    │  ┌─────────────────────────────────┐ │
│  │  Business │  │◄──►│  │        ATPClient                │ │
│  │   Logic   │  │    │  │                                 │ │
│  └───────────┘  │    │  │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │ │
└─────────────────┘    │  │ │ ID  │ │Creds│ │Perms│ │Audit│ │ │
                       │  │ └─────┘ └─────┘ └─────┘ └─────┘ │ │
                       │  └─────────────────────────────────┘ │
                       └──────────────────────────────────────┘
                                           │
                       ┌───────────────────┼───────────────────┐
                       │                   │                   │
               ┌───────▼────────┐ ┌────────▼────────┐ ┌───────▼────────┐
               │ Identity Service│ │Credentials Service│ │  Audit Service │
               │    (Port 3001)  │ │   (Port 3002)   │ │   (Port 3005)  │
               └─────────────────┘ └─────────────────┘ └────────────────┘
                       │                   │                   │
               ┌───────▼────────┐ ┌────────▼────────┐ ┌───────▼────────┐
               │Permissions Svc  │ │  Gateway Service│ │   Your Data    │
               │   (Port 3003)   │ │   (Port 3000)   │ │     Store      │
               └─────────────────┘ └─────────────────┘ └────────────────┘
```

##  Security Profiles

ATP includes built-in security profiles that define what agents can and cannot do. Profiles are **runtime-agnostic** and work across OpenClaw, MCP, LangChain, and custom runtimes.

### Built-in Profiles

| Profile | Description | Shell | Filesystem | Network | Credentials |
| --- | --- | --- | --- | --- | --- |
| `safe-default` | Conservative defaults | Blocked | Read-only | Internal only | Blocked |
| `dev-mode` | Permissive for development | Allowed | Read + Write | All domains | Allowed |
| `enterprise-locked` | Maximum production security | Blocked | Read, approved paths | Internal corp | Blocked |
| `openclaw-sandbox` | OpenClaw-tuned sandbox | Blocked (allowlist) | Sandbox paths | Internal + partners | Approval required |

### Using Profiles

```typescript
import { ATPClient, BUILTIN_PROFILES } from 'atp-sdk';

// Set profile at initialization
const client = new ATPClient({
  baseUrl: 'https://api.atp.dev',
  profileId: 'safe-default'
});

// Or change at runtime
client.setProfile('enterprise-locked');

// Get the current profile
const profile = client.getProfile();
console.log(profile?.name); // "Enterprise Locked"

// Evaluate an action against the profile
const decision = client.evaluateActionWithProfile({
  actionType: 'shell',     // "shell" | "filesystem" | "network" | "credentials" | "messaging"
  state: 'executing',      // "planning" | "executing" | "communicating" | "completed"
});
// Returns: "allow" | "deny" | "require_approval"

// List all built-in profiles
console.log(Object.keys(BUILTIN_PROFILES));
// ["safe-default", "dev-mode", "enterprise-locked", "openclaw-sandbox"]
```

### State-Based Policies

Each profile defines per-state rules. For example, `openclaw-sandbox`:

| State | Allowed | Restricted | Requires Approval |
| --- | --- | --- | --- |
| `planning` | (none) | shell, filesystem, network, credentials | - |
| `executing` | filesystem, network | shell | credentials, messaging |
| `communicating` | messaging | shell, filesystem | external-messaging |
| `completed` | logs-read | shell, filesystem, network, credentials, messaging | - |

### Agent Onboarding

Register agents with a profile via the CLI or web wizard:

```bash
# Interactive CLI
npx atp-onboard-agent
# → Select runtime (OpenClaw, MCP, LangChain, custom)
# → Name your agent
# → Choose security profile
# → Done! Agent registered with DID + profile
```

Or use the web wizard at `/onboard/agent`.

---

##  Installation & Setup

### Prerequisites

- Node.js 18+ with ES modules support
- TypeScript 4.5+ (for TypeScript projects)
- Access to ATP™ services (local or hosted)

### Installation

```bash
# Using npm
npm install atp-sdk

# Using yarn
yarn add atp-sdk

# Using pnpm
pnpm add atp-sdk
```

### Basic Configuration

```javascript
import { ATPClient, createQuickConfig } from 'atp-sdk';

// Development (local services)
const config = createQuickConfig('http://localhost');

// Production (hosted services) with security profile
const config = {
  baseUrl: 'https://api.atp.example.com',
  timeout: 30000,
  retries: 3,
  profileId: 'safe-default', // Built-in security profile
  auth: {
    did: process.env.ATP_DID,
    privateKey: process.env.ATP_PRIVATE_KEY
  },
  services: {
    identity: 'https://identity.atp.example.com',
    credentials: 'https://credentials.atp.example.com',
    permissions: 'https://permissions.atp.example.com',
    audit: 'https://audit.atp.example.com',
    gateway: 'https://gateway.atp.example.com'
  }
};

const client = new ATPClient(config);
```

##  Usage Examples

### Identity Management

```javascript
import { DIDUtils, CryptoUtils } from 'atp-sdk';

// Generate new identity
const { did, document, keyPair } = await DIDUtils.generateDID({
  network: 'testnet',
  method: 'atp'
});

// Authenticate client
client.setAuthentication({
  did: did,
  privateKey: keyPair.privateKey
});

// Register identity
const registration = await client.identity.register({
  did: did,
  document: document,
  metadata: {
    name: 'Alice Smith',
    organization: 'ACME Corp'
  }
});

// Set up multi-factor authentication
const mfaSetup = await client.identity.setupMFA({
  method: 'totp',
  label: 'My ATP Account'
});

console.log('MFA QR Code:', mfaSetup.data.qrCodeUrl);
```

### Verifiable Credentials

```javascript
// Create credential schema
const schema = await client.credentials.createSchema({
  name: 'University Degree',
  description: 'Academic degree certificate',
  version: '1.0.0',
  schema: {
    type: 'object',
    properties: {
      degree: { type: 'string' },
      university: { type: 'string' },
      graduationDate: { type: 'string', format: 'date' },
      gpa: { type: 'number', minimum: 0, maximum: 4.0 }
    },
    required: ['degree', 'university', 'graduationDate']
  }
});

// Issue credential
const credential = await client.credentials.issue({
  schemaId: schema.data.id,
  holder: 'did:atp:testnet:student123',
  claims: {
    degree: 'Bachelor of Science',
    university: 'ATP University',
    graduationDate: '2024-05-15',
    gpa: 3.75
  }
});

// Create presentation
const presentation = await client.credentials.createPresentation({
  credentialIds: [credential.data.id],
  audience: 'did:atp:testnet:employer456',
  challenge: 'job-application-2024',
  purpose: 'Employment verification'
});

// Verify presentation
const verification = await client.credentials.verifyPresentation({
  presentationId: presentation.data.id,
  expectedChallenge: 'job-application-2024',
  expectedAudience: 'did:atp:testnet:employer456'
});

console.log('Presentation valid:', verification.data.valid);
```

### Access Control

```javascript
// Create access policy
const policy = await client.permissions.createPolicy({
  name: 'Document Access Policy',
  description: 'Controls access to sensitive documents',
  version: '1.0.0',
  rules: [{
    action: 'read',
    resource: 'document:*',
    effect: 'allow',
    conditions: [{
      attribute: 'user.department',
      operator: 'equals',
      value: 'engineering'
    }]
  }]
});

// Grant permission
const grant = await client.permissions.grant({
  grantee: 'did:atp:testnet:user123',
  resource: 'document:quarterly-report',
  actions: ['read'],
  policyId: policy.data.id,
  conditions: {
    'user.department': 'engineering',
    'user.clearanceLevel': 'confidential'
  }
});

// Evaluate access
const decision = await client.permissions.evaluate({
  subject: 'did:atp:testnet:user123',
  action: 'read',
  resource: 'document:quarterly-report',
  context: {
    'user.department': 'engineering',
    'user.clearanceLevel': 'confidential',
    'request.time': new Date().toISOString()
  }
});

console.log('Access granted:', decision.data.decision === 'allow');
```

### Audit Logging

```javascript
// Log audit event
const auditEvent = await client.audit.logEvent({
  source: 'document-service',
  action: 'document_accessed',
  resource: 'document:quarterly-report',
  actor: 'did:atp:testnet:user123',
  details: {
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
    accessMethod: 'web_interface'
  }
});

// Query audit trail
const auditTrail = await client.audit.queryEvents({
  resource: 'document:quarterly-report',
  startTime: '2024-06-01T00:00:00Z',
  endTime: '2024-06-30T23:59:59Z'
});

// Generate compliance report
const report = await client.audit.generateComplianceReport({
  startDate: '2024-06-01',
  endDate: '2024-06-30',
  reportType: 'access_control',
  format: 'pdf'
});

console.log('Report URL:', report.data.downloadUrl);
```

### Real-time Monitoring

```javascript
// Connect to event stream
await client.gateway.connectEventStream({
  filters: {
    eventTypes: ['identity.login', 'permission.granted'],
    severities: ['medium', 'high', 'critical']
  },
  autoReconnect: true
});

// Handle events
client.gateway.on('identity.login', (event) => {
  console.log('User logged in:', event.data.actor);
});

client.gateway.on('permission.granted', (event) => {
  console.log('Permission granted:', {
    grantee: event.data.grantee,
    resource: event.data.resource
  });
});

client.gateway.on('error', (error) => {
  console.error('Stream error:', error.message);
});

// Monitor service health
const health = await client.gateway.getStatus();
console.log('Gateway status:', health.data.status);
```

### Zero-Knowledge Proof Authentication

```typescript
import { Agent, ZKProofType } from 'atp-sdk';

// === Basic Agent-to-Agent Authentication ===

// Create two agents that need to authenticate each other
const serviceAgent = await Agent.create('DataService');
const clientAgent = await Agent.create('ClientBot');

// Service agent requires proof of trust level and identity
const challenge = await serviceAgent.requestAuth(clientAgent.getDID(), [
  { type: ZKProofType.TRUST_LEVEL, params: { minTrustLevel: 0.6 } },
  { type: ZKProofType.IDENTITY, params: {} }
]);

// Client generates zero-knowledge proofs (proves claims without revealing values)
const response = await clientAgent.respondToChallenge(challenge);

// Service verifies proofs cryptographically
const authResult = await serviceAgent.verifyAuthResponse(response);

if (authResult.verified) {
  console.log('Client authenticated successfully');
  console.log('Trust level: >= 0.6 (exact value hidden)');
}

// === Mutual Authentication ===
// Both agents authenticate each other simultaneously

const { myResult, theirResult } = await serviceAgent.mutualAuth(
  clientAgent.getDID(),
  // What we require from them
  [{ type: ZKProofType.TRUST_LEVEL, params: { minTrustLevel: 0.5 } }],
  // What they require from us
  [{ type: ZKProofType.CREDENTIAL, params: { credentialType: 'ServiceProvider' } }]
);

console.log('Both agents verified:', myResult.verified && theirResult.verified);

// === Behavior-Based Proofs (ATP Differentiator) ===
// Prove compliance history without revealing individual interactions

// Record interactions over time (in production, called by your business logic)
for (let i = 0; i < 100; i++) {
  clientAgent.recordInteraction(`task-${i}`, 'success');
}

// Check current behavior stats
const stats = clientAgent.getBehaviorStats();
console.log(`Success: ${stats.successCount}, Violations: ${stats.violationCount}`);

// Prove "no violations" - service can verify without seeing interaction history
const noViolationsProof = await clientAgent.proveBehavior({
  type: 'no_violations'
});

const isCompliant = await serviceAgent.verifyBehaviorProof(
  noViolationsProof,
  { type: 'no_violations' }
);
console.log('Agent has clean record:', isCompliant);

// Prove success rate meets threshold
const successProof = await clientAgent.proveBehavior({
  type: 'success_rate',
  threshold: 95 // Proves >= 95% success without revealing exact rate
});

// Prove compliance with specific policy
const policyProof = await clientAgent.proveBehavior({
  type: 'policy_compliance',
  policyId: 'rate-limit-policy'
});

// === Using Low-Level ZKP Utilities ===
import {
  createChallenge,
  createTrustLevelProof,
  verifyTrustLevelProof,
  generateAuthResponse,
  verifyAuthResponse
} from 'atp-sdk';

// Create a custom challenge
const customChallenge = createChallenge(
  'did:atp:verifier',
  'did:atp:prover',
  [{ type: ZKProofType.TRUST_LEVEL, params: { minTrustLevel: 0.8 } }],
  5 // expires in 5 minutes
);

// Generate proof manually
const trustProof = createTrustLevelProof(
  0.85,  // actual trust score
  0.8,   // threshold to prove
  privateKey
);

// Verify proof
const isValid = verifyTrustLevelProof(trustProof, {
  type: ZKProofType.TRUST_LEVEL,
  params: { minTrustLevel: 0.8 }
});
```

### Payment Protocols (AP2 & ACP)

```javascript
// Google AP2 (Agent Payments Protocol) Integration

// 1. Create Intent Mandate (User Authorization)
const intentMandate = await client.payments.createIntentMandate({
  userDid: 'did:atp:user123',
  agentDid: 'did:atp:shopping-agent',
  purpose: 'Holiday shopping assistant',
  maxAmount: 500.00,
  currency: 'USD',
  expiresAt: new Date('2025-12-31'),
  restrictions: {
    merchants: ['amazon.com', 'etsy.com'],
    categories: ['gifts', 'electronics'],
    dailyLimit: 200.00
  }
});

// 2. Create Cart Mandate (Specific Transaction)
const cartMandate = await client.payments.createCartMandate({
  intentMandateId: intentMandate.data.id,
  merchant: 'etsy.com',
  items: [
    { id: 'item-1', name: 'Handmade Mug', quantity: 2, price: 24.99, currency: 'USD' },
    { id: 'item-2', name: 'Coffee Beans', quantity: 1, price: 18.50, currency: 'USD' }
  ],
  total: 68.48,
  currency: 'USD',
  paymentMethod: paymentMethodObject
});

// 3. Execute Payment
const payment = await client.payments.executeAP2Payment({
  cartMandateId: cartMandate.data.id,
  paymentMethod: paymentMethodObject,
  billingAddress: {
    line1: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94102',
    country: 'US'
  }
});

console.log('Payment completed:', payment.data.id);
console.log('Audit trail events:', payment.data.auditTrail.length);

// OpenAI ACP (Agentic Commerce Protocol) Integration

// 1. Create Checkout Session
const checkout = await client.payments.createACPCheckout({
  merchantId: 'merchant-123',
  agentDid: 'did:atp:shopping-agent',
  items: [
    { productId: 'prod-vintage-lamp', quantity: 1 },
    { productId: 'prod-art-print', quantity: 2 }
  ],
  shippingAddress: {
    line1: '456 Oak Ave',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US'
  },
  customerEmail: 'customer@example.com'
});

// 2. Complete Checkout
const result = await client.payments.completeACPCheckout({
  sessionId: checkout.data.id,
  paymentMethodId: 'pm-card-123',
  sharedPaymentToken: 'spt-stripe-abc123'
});

console.log('Transaction ID:', result.data.transactionId);
console.log('Receipt URL:', result.data.receipt?.url);

// Payment Policy Management
const policy = await client.payments.createPaymentPolicy({
  name: 'Shopping Assistant Limits',
  agentDid: 'did:atp:shopping-agent',
  maxTransactionAmount: 100.00,
  dailyLimit: 250.00,
  monthlyLimit: 1000.00,
  allowedMerchants: ['etsy.com', 'amazon.com'],
  requiresApproval: true,
  notificationThreshold: 50.00
});

// Add Payment Methods
const cardMethod = await client.payments.addPaymentMethod({
  userDid: 'did:atp:user123',
  type: 'card',
  details: {
    last4: '4242',
    brand: 'Visa',
    expiryMonth: 12,
    expiryYear: 2026
  },
  isDefault: true
});

// Crypto/Stablecoin Support
const cryptoMethod = await client.payments.addPaymentMethod({
  userDid: 'did:atp:user123',
  type: 'stablecoin',
  details: {
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    blockchain: 'ethereum',
    tokenSymbol: 'USDC'
  }
});

// Query Transaction History
const transactions = await client.payments.queryTransactions({
  userDid: 'did:atp:user123',
  startDate: new Date('2025-01-01'),
  endDate: new Date(),
  status: 'completed'
});

console.log('Total transactions:', transactions.data.length);
```

##  Development

### Environment Setup

```bash
# Clone the repository
git clone https://github.com/atp/sdk.git
cd sdk

# Install dependencies
npm install

# Run tests
npm test

# Build the SDK
npm run build

# Run examples
npm run examples
```

### Running Examples

```bash
# Run all examples
node examples/index.js --all

# Run specific example
node examples/index.js 1  # Basic setup
node examples/index.js 2  # Identity management
node examples/index.js 3  # Verifiable credentials
```

### TypeScript Support

The SDK is written in TypeScript and provides comprehensive type definitions:

```typescript
import { ATPClient, ATPConfig, VerifiableCredential } from 'atp-sdk';

const config: ATPConfig = {
  baseUrl: 'http://localhost',
  auth: {
    did: 'did:atp:testnet:example',
    privateKey: 'hex-private-key'
  }
};

const client = new ATPClient(config);

// Types are automatically inferred
const credential: VerifiableCredential = await client.credentials.issue({
  schemaId: 'schema-id',
  holder: 'holder-did',
  claims: { name: 'John Doe' }
});
```

##  Testing

The SDK includes comprehensive tests and testing utilities:

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm run test -- --grep "Identity"
```

### Testing Your Application

```javascript
import { ATPClient } from 'atp-sdk';
import { jest } from '@jest/globals';

// Mock the SDK for testing
jest.mock('atp-sdk');

describe('My Application', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      identity: {
        resolve: jest.fn(),
        register: jest.fn()
      }
    };
    
    ATPClient.mockImplementation(() => mockClient);
  });

  test('should handle identity resolution', async () => {
    mockClient.identity.resolve.mockResolvedValue({
      data: { did: 'did:atp:test:123', status: 'active' }
    });

    // Test your application logic
  });
});
```

##  Production Deployment

### Security Checklist

- [ ] Use HTTPS/TLS for all communications
- [ ] Store private keys securely (HSM, KMS, etc.)
- [ ] Implement proper key rotation
- [ ] Enable audit logging
- [ ] Set up monitoring and alerts
- [ ] Configure rate limiting
- [ ] Use environment-specific configurations
- [ ] Implement circuit breakers and retries
- [ ] Test disaster recovery procedures

### Performance Optimization

```javascript
// Connection pooling
const config = {
  connectionPool: {
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 60000
  }
};

// Caching
const cache = new LRUCache({ max: 1000, ttl: 300000 });

async function cachedResolve(did) {
  const cached = cache.get(did);
  if (cached) return cached;

  const result = await client.identity.resolve(did);
  cache.set(did, result);
  return result;
}

// Batch operations
const results = await Promise.allSettled(
  dids.map(did => client.identity.resolve(did))
);
```

##  Monitoring

### Health Checks

**Quick Start Example**: See [`examples/10-monitoring-health.js`](./examples/10-monitoring-health.js) for a complete monitoring example.

```javascript
// Implement health check endpoint
import { ATPClient, createQuickConfig } from 'atp-sdk';

app.get('/health', async (req, res) => {
  const client = new ATPClient(createQuickConfig('http://localhost'));
  
  try {
    const health = await client.testConnectivity();
    
    res.status(health.overall ? 200 : 503).json({
      status: health.overall ? 'healthy' : 'degraded',
      services: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

### Gateway Health & Status

```javascript
// Get detailed gateway health
const health = await client.gateway.getHealth();

// Get gateway status with load metrics
const status = await client.gateway.getStatus();

// Get connection statistics
const stats = await client.gateway.getConnectionStats();
```

### Metrics

```javascript
// Collect SDK metrics
const metrics = {
  operations: {
    total: 0,
    successful: 0,
    failed: 0
  },
  performance: {
    averageLatency: 0,
    p95Latency: 0
  }
};

// Instrument operations
async function instrumentedOperation(operation) {
  const start = Date.now();
  metrics.operations.total++;
  
  try {
    const result = await operation();
    metrics.operations.successful++;
    return result;
  } catch (error) {
    metrics.operations.failed++;
    throw error;
  } finally {
    const latency = Date.now() - start;
    updateLatencyMetrics(latency);
  }
}
```

##  Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Releasing a New Version

Publishing is fully automated via the [npm-publish workflow](https://github.com/agent-trust-protocol/atp-core/actions/workflows/npm-publish.yml).

1. Bump the version in `package.json`
2. Push a version tag to trigger automatic publishing:
   ```bash
   git tag v1.2.2
   git push origin v1.2.2
   ```
3. The workflow will build, test, and publish both `atp-sdk` and `@atpdevelopment/openclaw-atp` to npm in parallel.

To do a dry run without publishing (builds and packs only), use **Actions → Publish to npm → Run workflow** and enable the `dry_run` option.

### Code Standards

- Follow TypeScript best practices
- Maintain 100% test coverage for new code
- Use conventional commit messages
- Update documentation for API changes

##  License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

##  Support

- **Documentation**: [https://docs.atp.protocol](https://docs.atp.protocol)
- **GitHub Issues**: [Report bugs and request features](https://github.com/atp/sdk/issues)
- **Discord**: [Join our community](https://discord.gg/atp)
- **Email**: support@atp.protocol
- **Enterprise Support**: enterprise@atp.protocol

##  Related Projects

- **[ATP™ Core Services](https://github.com/atp/core)** - Core ATP protocol implementation
- **[ATP™ CLI](https://github.com/atp/cli)** - Command-line interface
- **[ATP™ Examples](https://github.com/atp/examples)** - Real-world examples and demos
- **[ATP™ Specification](https://github.com/atp/spec)** - Protocol specification

##  Roadmap

- [x] **v1.1.0** - Payment Protocols (AP2 & ACP) Integration
- [x] **v1.2.0** - Zero-Knowledge Proof Authentication (Agent-to-Agent)
- [x] **v1.2.1** - Security Profiles & Onboarding (profile-based action gating, CLI/web onboarding wizard)
- [x] **v1.2.2** - Standalone Mode & Embedded Dashboard (offline-first agents, `npx create-atp-agent <project>` with browser-based local onboarding UI)
- [x] **v1.2.4** - Documentation: npm README aligned with `create-atp-agent` (ESM, flags, mock onboard UI vs [agenttrustprotocol.com](https://agenttrustprotocol.com) web wizard)
- [ ] **v1.3.0** - WebAssembly support for browser environments
- [ ] **v1.4.0** - GraphQL API support
- [ ] **v2.0.0** - ATP Protocol v2 compatibility

##  Payment Protocol Partners

The ATP SDK integrates with industry-leading payment platforms:

**AP2 (Agent Payments Protocol) Partners:**
- Adyen, American Express, Ant International
- Coinbase, Ethereum Foundation, MetaMask
- Etsy, Mastercard, PayPal, Revolut
- Salesforce, ServiceNow, Stripe, Worldpay
- 60+ additional partners

**ACP (Agentic Commerce Protocol):**
- OpenAI ChatGPT Commerce
- Stripe Shared Payment Tokens
- Etsy Instant Checkout

---

**Agent Trust Protocol™** - The security layer for AI agents.

Built and maintained by [Sovr Labs](https://sovrlabs.com) | [Enterprise](https://sovrlabs.com/enterprise)

© 2026 Sovr Labs. Apache-2.0 License.
