# 🚀 ATP Quick Start Guide

Get your AI agents secured with quantum-safe cryptography in under 5 minutes!

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
  // Create an AI agent with a unique name
  const myAgent = new Agent('my-first-agent');
  
  // Initialize with quantum-safe security
  await myAgent.initialize();
  
  // Your agent now has:
  console.log('Agent DID:', myAgent.did);
  console.log('Public Key:', myAgent.publicKey);
  console.log('Quantum-Safe:', myAgent.isQuantumSafe); // true
}

main().catch(console.error);
```

## 3. Agent-to-Agent Communication (3 minutes)

### Secure Message Exchange

```javascript
const { Agent } = require('atp-sdk');

async function secureMessaging() {
  // Create two agents
  const alice = new Agent('alice');
  const bob = new Agent('bob');
  
  // Initialize both agents
  await Promise.all([
    alice.initialize(),
    bob.initialize()
  ]);
  
  // Alice trusts Bob
  await alice.trust(bob.did, { level: 0.8 });
  
  // Alice sends a signed message to Bob
  const message = await alice.send(bob.did, {
    type: 'greeting',
    content: 'Hello Bob, this is a secure message!'
  });
  
  console.log('Message sent with signature:', message.signature);
  
  // Bob verifies the message is from Alice
  const verified = await bob.verify(message);
  console.log('Message verified:', verified); // true
}

secureMessaging().catch(console.error);
```

## 4. Connecting to ATP Services (4 minutes)

### Using the RPC Gateway

```javascript
const { ATPClient } = require('atp-sdk');

async function connectToATP() {
  // Connect to ATP services
  const client = new ATPClient({
    gateway: process.env.ATP_GATEWAY || 'ws://localhost:3000',
    agent: 'my-app-agent'
  });
  
  await client.connect();
  
  // Create a verifiable credential
  const credential = await client.credentials.create({
    type: 'AIAgentCredential',
    claims: {
      model: 'gpt-4',
      capabilities: ['text-generation', 'code-analysis'],
      owner: 'ACME Corp'
    }
  });
  
  console.log('Credential issued:', credential.id);
  
  // Set access policy
  const policy = await client.permissions.createPolicy({
    resource: 'production-database',
    rules: [{
      actions: ['read'],
      conditions: {
        trustLevel: { min: 0.7 },
        credentials: ['AIAgentCredential']
      }
    }]
  });
  
  console.log('Policy created:', policy.id);
}

connectToATP().catch(console.error);
```

## 5. Integration Examples

### With Express.js API

```javascript
const express = require('express');
const { atpMiddleware } = require('atp-sdk/middleware');

const app = express();

// Protect your API with ATP
app.use(atpMiddleware({
  minTrustLevel: 0.6,
  requireSignature: true,
  quantum_safe: true
}));

app.post('/api/ai-action', async (req, res) => {
  // Only verified AI agents can access this
  const agent = req.agent;
  
  console.log('Request from verified agent:', agent.did);
  console.log('Trust level:', agent.trustScore);
  
  // Process the AI action
  res.json({ 
    status: 'authorized',
    agent: agent.did 
  });
});

app.listen(3001, () => {
  console.log('Secure API running on port 3001');
});
```

### With LangChain

```javascript
const { ATPSecurityWrapper } = require('atp-sdk');
const { OpenAI } = require('langchain/llms/openai');
const { ConversationChain } = require('langchain/chains');

async function secureLangChain() {
  // Create LangChain LLM
  const llm = new OpenAI({ 
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY 
  });
  
  // Wrap with ATP security
  const secureLLM = new ATPSecurityWrapper(llm, {
    agentName: 'langchain-bot',
    signAllRequests: true,
    auditLog: true
  });
  
  // Use in a conversation chain
  const chain = new ConversationChain({ 
    llm: secureLLM 
  });
  
  // All LLM calls are now cryptographically signed
  const response = await chain.call({ 
    input: "What's the weather like?" 
  });
  
  console.log('Signed response:', response);
}

secureLangChain().catch(console.error);
```

## 6. Environment Configuration

### Development (.env)

```bash
# ATP Configuration
ATP_GATEWAY=ws://localhost:3000
ATP_AGENT_NAME=dev-agent
ATP_LOG_LEVEL=debug

# Optional: Use mock services for testing
ATP_USE_MOCK=true
```

### Production (.env.production)

```bash
# ATP Configuration
ATP_GATEWAY=wss://atp.your-domain.com
ATP_AGENT_NAME=prod-agent
ATP_LOG_LEVEL=info
ATP_QUANTUM_SAFE=true
ATP_AUDIT_LEVEL=full

# Database for audit logs
DATABASE_URL=postgresql://user:pass@localhost:5432/atp_production
```

## 7. Testing Your Integration

### Basic Test

```javascript
const { Agent } = require('atp-sdk');
const assert = require('assert');

async function testATP() {
  const agent = new Agent('test-agent');
  await agent.initialize();
  
  // Test 1: Agent has DID
  assert(agent.did.startsWith('did:atp:'));
  console.log('✅ Agent has valid DID');
  
  // Test 2: Can create signatures
  const signature = await agent.sign({ test: 'data' });
  assert(signature.length > 0);
  console.log('✅ Agent can create signatures');
  
  // Test 3: Can verify signatures
  const verified = await agent.verifySignature(
    { test: 'data' }, 
    signature,
    agent.publicKey
  );
  assert(verified === true);
  console.log('✅ Agent can verify signatures');
  
  console.log('\n🎉 All tests passed!');
}

testATP().catch(console.error);
```

## 8. Common Patterns

### Pattern 1: Agent Registry

```javascript
class AgentRegistry {
  constructor() {
    this.agents = new Map();
  }
  
  async registerAgent(name, config = {}) {
    const agent = new Agent(name, config);
    await agent.initialize();
    this.agents.set(name, agent);
    return agent;
  }
  
  getAgent(name) {
    return this.agents.get(name);
  }
  
  async trustNetwork(trustLevel = 0.5) {
    // Create trust relationships between all agents
    const agentList = Array.from(this.agents.values());
    
    for (const agent1 of agentList) {
      for (const agent2 of agentList) {
        if (agent1 !== agent2) {
          await agent1.trust(agent2.did, { level: trustLevel });
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

### Pattern 2: Audit Logger

```javascript
const { AuditLogger } = require('atp-sdk');

class SecureAIOperations {
  constructor() {
    this.audit = new AuditLogger({
      service: 'ai-operations',
      output: './audit.log'
    });
  }
  
  async executeAction(agent, action, params) {
    // Log the attempt
    await this.audit.log({
      event: 'action_attempted',
      agent: agent.did,
      action: action,
      params: params,
      timestamp: new Date().toISOString()
    });
    
    try {
      // Execute the action
      const result = await this.performAction(action, params);
      
      // Log success
      await this.audit.log({
        event: 'action_completed',
        agent: agent.did,
        action: action,
        result: 'success',
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      // Log failure
      await this.audit.log({
        event: 'action_failed',
        agent: agent.did,
        action: action,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }
  
  async performAction(action, params) {
    // Your actual AI operation logic here
    console.log(`Performing ${action} with`, params);
    return { status: 'completed' };
  }
}
```

## 9. Troubleshooting

### Issue: "Cannot connect to ATP gateway"

```javascript
// Solution 1: Check if services are running
const { healthCheck } = require('atp-sdk/utils');

const health = await healthCheck('http://localhost:3000/health');
console.log('Gateway health:', health);

// Solution 2: Use mock services for development
const client = new ATPClient({
  gateway: 'ws://localhost:3000',
  useMock: true  // Use mock services
});
```

### Issue: "Agent initialization fails"

```javascript
// Solution: Add error handling and retry logic
async function initializeWithRetry(agentName, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const agent = new Agent(agentName);
      await agent.initialize();
      return agent;
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error.message);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

const agent = await initializeWithRetry('my-agent');
```

## 10. Next Steps

### Learn More
- 📖 [Full API Documentation](./api/)
- 🏗️ [Architecture Guide](./architecture.md)
- 🔒 [Security Best Practices](./security.md)
- 📊 [Performance Optimization](./performance.md)

### Get Help
- 💬 [GitHub Discussions](https://github.com/agent-trust-protocol/core/discussions)
- 🐛 [Report Issues](https://github.com/agent-trust-protocol/core/issues)
- 📧 [Email Support](mailto:support@agenttrustprotocol.com)

### Deploy to Production
- 🚀 [Production Deployment Guide](./deployment/)
- ☁️ [Cloud Services Setup](./cloud/)
- 🏢 [Enterprise Configuration](./enterprise/)

---

## Complete Example: Secure AI Chat Service

Here's a complete example that ties everything together:

```javascript
const express = require('express');
const { Agent, ATPClient, atpMiddleware } = require('atp-sdk');

class SecureAIChatService {
  constructor() {
    this.app = express();
    this.agents = new Map();
    this.client = null;
  }
  
  async initialize() {
    // Connect to ATP
    this.client = new ATPClient({
      gateway: process.env.ATP_GATEWAY || 'ws://localhost:3000'
    });
    await this.client.connect();
    
    // Create service agent
    const serviceAgent = new Agent('chat-service');
    await serviceAgent.initialize();
    this.agents.set('service', serviceAgent);
    
    // Setup Express with ATP middleware
    this.app.use(express.json());
    this.app.use(atpMiddleware({
      agent: serviceAgent,
      minTrustLevel: 0.5
    }));
    
    // Define routes
    this.setupRoutes();
    
    // Start server
    const port = process.env.PORT || 3002;
    this.app.listen(port, () => {
      console.log(`Secure AI Chat Service running on port ${port}`);
      console.log(`Service DID: ${serviceAgent.did}`);
    });
  }
  
  setupRoutes() {
    // Register a new AI agent
    this.app.post('/agents/register', async (req, res) => {
      const { name } = req.body;
      
      const agent = new Agent(name);
      await agent.initialize();
      this.agents.set(name, agent);
      
      // Issue credential
      const credential = await this.client.credentials.create({
        type: 'ChatAgentCredential',
        subject: agent.did,
        claims: {
          name: name,
          registered: new Date().toISOString()
        }
      });
      
      res.json({
        did: agent.did,
        credential: credential.id,
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
      
      // Send signed message
      const signedMessage = await fromAgent.send(toAgent.did, {
        content: message,
        timestamp: new Date().toISOString()
      });
      
      // Verify and deliver
      const verified = await toAgent.verify(signedMessage);
      
      res.json({
        delivered: verified,
        signature: signedMessage.signature,
        from: fromAgent.did,
        to: toAgent.did
      });
    });
    
    // Get agent trust level
    this.app.get('/agents/:name/trust', async (req, res) => {
      const agent = this.agents.get(req.params.name);
      
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      
      const trustScore = await this.client.trust.getScore(agent.did);
      
      res.json({
        agent: agent.did,
        trustScore: trustScore,
        level: trustScore > 0.7 ? 'high' : trustScore > 0.4 ? 'medium' : 'low'
      });
    });
  }
}

// Start the service
const service = new SecureAIChatService();
service.initialize().catch(console.error);
```

---

**🎉 Congratulations!** You now have quantum-safe security for your AI agents. 

Remember: Every AI agent interaction is now cryptographically signed, verified, and auditable. You're protected against both today's threats and tomorrow's quantum computers.

Happy coding! 🚀

