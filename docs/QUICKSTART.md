# ATP Quick Start Guide

Get your AI agents secured with quantum-safe cryptography in under 5 minutes.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Basic JavaScript/TypeScript knowledge

## 1. Installation (30 seconds)

```bash
# Using npm
npm install atp-sdk

# Using yarn  
yarn add atp-sdk

# For TypeScript projects, types are included!
```

## 2. Your First Secure Agent (2 minutes)

### Basic Setup

```javascript
const { Agent } = require('atp-sdk');

async function main() {
  // Create an AI agent with quantum-safe identity (private constructor + init in one call)
  const myAgent = await Agent.create('my-first-agent');

  // Your agent now has:
  console.log('Agent DID:', myAgent.getDID());        // e.g. did:atp:abc123...
  console.log('Quantum-Safe:', myAgent.isQuantumSafe()); // true
}

main().catch(console.error);
```

## 3. Agent-to-Agent Communication (3 minutes)

### Secure Message Exchange

```javascript
const { Agent } = require('atp-sdk');

async function secureMessaging() {
  // Create two agents
  const alice = await Agent.create('alice');
  const bob = await Agent.create('bob');

  // Alice establishes trust with Bob
  const trust = await alice.establishTrust(bob.getDID());
  console.log('Trust established:', trust.established, 'level:', trust.level);

  // Alice sends a signed message to Bob (optionally encrypted)
  const result = await alice.send(bob.getDID(), {
    type: 'greeting',
    content: 'Hello Bob, this is a secure message!'
  }, {
    recipientEncryptionKey: bob.getEncryptionPublicKey(),
  });

  console.log('Message ID:', result.messageId);
  console.log('Encrypted:', result.encrypted);
}

secureMessaging().catch(console.error);
```

## 4. Connecting to ATP Services (4 minutes)

### Using the ATPClient directly

```javascript
const { ATPClient } = require('atp-sdk');

async function connectToATP() {
  // Connect to ATP services
  const client = new ATPClient({
    baseUrl: process.env.ATP_SERVER_URL || 'http://localhost',
    services: {
      identity:    process.env.ATP_IDENTITY_URL    || 'http://localhost:3001',
      credentials: process.env.ATP_CREDENTIALS_URL || 'http://localhost:3002',
      permissions: process.env.ATP_PERMISSIONS_URL || 'http://localhost:3003',
      audit:       process.env.ATP_AUDIT_URL       || 'http://localhost:3005',
      gateway:     process.env.ATP_GATEWAY_URL     || 'http://localhost:3000',
    }
  });

  // Issue a verifiable credential
  const credential = await client.credentials.issueCredential({
    subjectDID: 'did:atp:agent-123',
    credentialType: 'AIAgentCredential',
    claims: {
      model: 'gpt-4',
      capabilities: ['text-generation', 'code-analysis'],
      owner: 'ACME Corp'
    },
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  });

  console.log('Credential issued:', credential.data?.id);

  // Set access policy
  const policy = await client.permissions.grantPermission({
    subject: 'did:atp:agent-123',
    resource: 'production-database',
    action: 'read',
    conditions: {},
    expiresAt: new Date(Date.now() + 86400000).toISOString()
  });

  console.log('Permission granted');
}

connectToATP().catch(console.error);
```

## 5. Integration Examples

### With OpenClaw

```javascript
const { ATPClient } = require('atp-sdk');
const { registerAgentWithAtp, secureTools } = require('@atpdevelopment/openclaw-atp');

async function secureOpenClaw() {
  const atp = new ATPClient({
    baseUrl: 'http://localhost',
    services: {
      identity: 'http://localhost:3001',
      credentials: 'http://localhost:3002',
      permissions: 'http://localhost:3003',
      audit: 'http://localhost:3005',
      gateway: 'http://localhost:3000',
    }
  });

  // Register agent with ATP identity
  const registration = await registerAgentWithAtp(atp, {
    name: 'my-claw-agent',
    capabilities: ['analysis', 'reporting'],
    trustLevel: 'high'
  });

  console.log('Agent DID:', registration.did);
  console.log('Trust score:', registration.trustScore);

  // Wrap tools with ATP security (auth + policy + audit per call)
  const rawTools = [myTool1, myTool2];
  const secured = secureTools(rawTools, atp);
}

secureOpenClaw().catch(console.error);
```

### With LangChain

See `packages/protocol-integrations/` for full LangChain adapter usage.

## 6. Environment Configuration

### Development (.env)

```bash
# ATP Configuration
ATP_SERVER_URL=http://localhost
ATP_IDENTITY_URL=http://localhost:3001
ATP_CREDENTIALS_URL=http://localhost:3002
ATP_PERMISSIONS_URL=http://localhost:3003
ATP_AUDIT_URL=http://localhost:3005
ATP_GATEWAY_URL=http://localhost:3000
```

### Production (.env.production)

```bash
# ATP Configuration
ATP_SERVER_URL=https://atp.your-domain.com
ATP_IDENTITY_URL=https://identity.atp.your-domain.com
ATP_CREDENTIALS_URL=https://credentials.atp.your-domain.com
ATP_PERMISSIONS_URL=https://permissions.atp.your-domain.com
ATP_AUDIT_URL=https://audit.atp.your-domain.com
ATP_GATEWAY_URL=https://gateway.atp.your-domain.com
```

## 7. Testing Your Integration

### Basic Test

```javascript
const { Agent } = require('atp-sdk');
const assert = require('assert');

async function testATP() {
  const agent = await Agent.create('test-agent');

  // Test 1: Agent has DID
  assert(agent.getDID().startsWith('did:atp:'));
  console.log('Agent has valid DID');

  // Test 2: Quantum-safe crypto is enabled
  assert(agent.isQuantumSafe() === true);
  console.log('Agent uses quantum-safe cryptography');

  // Test 3: Can assess trust
  const trust = await agent.assessTrust(agent.getDID());
  assert(typeof trust.score === 'number');
  console.log('Trust assessment works, score:', trust.score);

  // Test 4: Can send messages
  const result = await agent.send(agent.getDID(), { test: 'self-message' });
  assert(result.messageId);
  console.log('Message sending works');

  console.log('\nAll tests passed!');
}

testATP().catch(console.error);
```

## 8. Common Patterns

### Pattern 1: Agent Registry

```javascript
const { Agent } = require('atp-sdk');

class AgentRegistry {
  constructor() {
    this.agents = new Map();
  }

  async registerAgent(name, options = {}) {
    const agent = await Agent.create(name, options);
    this.agents.set(name, agent);
    return agent;
  }

  getAgent(name) {
    return this.agents.get(name);
  }

  async trustNetwork(minLevel = 0.5) {
    const agentList = Array.from(this.agents.values());
    for (const a of agentList) {
      for (const b of agentList) {
        if (a !== b) {
          await a.establishTrust(b.getDID(), minLevel);
        }
      }
    }
  }
}

// Usage
const registry = new AgentRegistry();
await registry.registerAgent('coordinator');
await registry.registerAgent('worker-1');
await registry.registerAgent('worker-2');
await registry.trustNetwork(0.7);
```

### Pattern 2: Audit Trail with ATPClient

```javascript
const { ATPClient } = require('atp-sdk');

async function auditExample() {
  const client = new ATPClient({
    baseUrl: 'http://localhost',
    services: {
      audit: 'http://localhost:3005',
      identity: 'http://localhost:3001',
      credentials: 'http://localhost:3002',
      permissions: 'http://localhost:3003',
      gateway: 'http://localhost:3000',
    }
  });

  // Log an event
  await client.audit.logEvent({
    source: 'my-service',
    action: 'action_attempted',
    resource: 'resource-id',
    actor: 'did:atp:agent-123',
    details: {
      operation: 'data-processing',
      timestamp: new Date().toISOString()
    }
  });

  // Query events
  const events = await client.audit.queryEvents({
    actor: 'did:atp:agent-123',
    limit: 10
  });

  console.log('Audit events:', events.data?.events?.length);
}

auditExample().catch(console.error);
```

## 9. Troubleshooting

### Issue: "Network error: connect ECONNREFUSED ..."

This means ATP services are not running at the configured URL. The error message
includes the exact URL that was unreachable.

```javascript
// Solution 1: Check services are running
const { ATPClient } = require('atp-sdk');

const client = new ATPClient({
  baseUrl: 'http://localhost',
  services: { identity: 'http://localhost:3001' }
});

// This will show the full URL in the error if it fails
try {
  await client.identity.getHealth();
  console.log('Identity service is reachable');
} catch (error) {
  console.error('Service unreachable:', error.message);
  // e.g. "Network error: connect ECONNREFUSED 127.0.0.1:3001 (url: http://localhost:3001/health)"
}
```

### Issue: "Agent initialization fails"

```javascript
// Solution: Add error handling — the error now includes the URL that failed
const { Agent } = require('atp-sdk');

async function initializeWithRetry(agentName, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await Agent.create(agentName);
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error.message);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

const agent = await initializeWithRetry('my-agent');
```

## 10. Next Steps

### Learn More
- [Full API Documentation](./api/)
- [Architecture Guide](./architecture.md)
- [Security Best Practices](./security.md)

### Get Help
- [GitHub Discussions](https://github.com/agent-trust-protocol/core/discussions)
- [Report Issues](https://github.com/agent-trust-protocol/core/issues)
- [Email Support](mailto:dev@agenttrustprotocol.com)

### Deploy to Production
- [Production Deployment Guide](./deployment/)
- [Cloud Services Setup](./cloud/)
- [Enterprise Configuration](./enterprise/)

---

## Complete Example: Secure Agent Service

Here's a complete example that ties everything together:

```javascript
const express = require('express');
const { Agent, ATPClient } = require('atp-sdk');

class SecureAgentService {
  constructor() {
    this.app = express();
    this.agents = new Map();
    this.client = null;
  }

  async initialize() {
    // Set up ATP client
    this.client = new ATPClient({
      baseUrl: process.env.ATP_SERVER_URL || 'http://localhost',
      services: {
        identity:    process.env.ATP_IDENTITY_URL    || 'http://localhost:3001',
        credentials: process.env.ATP_CREDENTIALS_URL || 'http://localhost:3002',
        permissions: process.env.ATP_PERMISSIONS_URL || 'http://localhost:3003',
        audit:       process.env.ATP_AUDIT_URL       || 'http://localhost:3005',
        gateway:     process.env.ATP_GATEWAY_URL     || 'http://localhost:3000',
      }
    });

    // Create service agent
    const serviceAgent = await Agent.create('chat-service');
    this.agents.set('service', serviceAgent);

    // Setup Express
    this.app.use(express.json());
    this.setupRoutes();

    // Start server
    const port = process.env.PORT || 3002;
    this.app.listen(port, () => {
      console.log(`Secure Agent Service running on port ${port}`);
      console.log(`Service DID: ${serviceAgent.getDID()}`);
    });
  }

  setupRoutes() {
    // Register a new AI agent
    this.app.post('/agents/register', async (req, res) => {
      const { name } = req.body;

      const agent = await Agent.create(name);
      this.agents.set(name, agent);

      // Issue credential
      const credential = await this.client.credentials.issueCredential({
        subjectDID: agent.getDID(),
        credentialType: 'ServiceAgentCredential',
        claims: {
          name,
          registered: new Date().toISOString()
        },
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      });

      res.json({
        did: agent.getDID(),
        credential: credential.data?.id,
        status: 'registered'
      });
    });

    // Send a message between agents
    this.app.post('/chat/send', async (req, res) => {
      const { from, to, message } = req.body;

      const fromAgent = this.agents.get(from);
      const toAgent = this.agents.get(to);

      if (!fromAgent || !toAgent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Send signed + encrypted message
      const result = await fromAgent.send(toAgent.getDID(), {
        content: message,
        timestamp: new Date().toISOString()
      }, {
        recipientEncryptionKey: toAgent.getEncryptionPublicKey(),
      });

      res.json({
        messageId: result.messageId,
        encrypted: result.encrypted,
        from: fromAgent.getDID(),
        to: toAgent.getDID()
      });
    });

    // Get agent trust assessment
    this.app.get('/agents/:name/trust', async (req, res) => {
      const agent = this.agents.get(req.params.name);

      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const trust = await agent.assessTrust(agent.getDID());

      res.json({
        agent: agent.getDID(),
        score: trust.score,
        level: trust.level,
        confidence: trust.confidence
      });
    });
  }
}

// Start the service
const service = new SecureAgentService();
service.initialize().catch(console.error);
```

---

You now have quantum-safe security for your AI agents.
Every AI agent interaction is cryptographically signed, verified, and auditable.

Happy coding!
