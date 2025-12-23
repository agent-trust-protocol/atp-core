# Getting Started with Agent Trust Protocol

This guide will help you get ATP up and running in just a few minutes.

## Prerequisites

- Node.js 18+ 
- Docker & Docker Compose (recommended)
- Git

## Installation

### Option 1: Docker Compose (Recommended)

This is the fastest way to get all ATP services running:

```bash
# Clone the repository
git clone https://github.com/agent-trust-protocol/atp.git
cd agent-trust-protocol

# Start all services
docker-compose up -d

# Check that services are healthy
docker-compose ps
```

You should see all services running:
- `identity-service` on port 3001
- `vc-service` on port 3002  
- `permission-service` on port 3003
- `rpc-gateway` on ports 3000 (HTTP) and 8080 (WebSocket)
- `nginx` on port 80 (load balancer)

### Option 2: Local Development

If you want to run services locally for development:

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Start services (each in a separate terminal)
npm run dev --workspace=@atp/identity-service
npm run dev --workspace=@atp/vc-service  
npm run dev --workspace=@atp/permission-service
npm run dev --workspace=@atp/rpc-gateway
```

## Verify Installation

Test that ATP is working correctly:

```bash
# Health check
curl http://localhost:3000/health

# Should return:
# {"status":"healthy","service":"rpc-gateway","services":{...}}

# Register a test DID
curl -X POST http://localhost:3001/identity/register

# Should return a new DID and private key
```

## Your First Agent

Let's create a simple agent that registers with ATP:

### 1. Create Agent Project

```bash
mkdir my-first-agent
cd my-first-agent
npm init -y
npm install ws @noble/ed25519
```

### 2. Create Agent Code

Create `agent.js`:

```javascript
const WebSocket = require('ws');
const ed25519 = require('@noble/ed25519');

class MyAgent {
  constructor() {
    this.did = null;
    this.privateKey = null;
    this.ws = null;
  }

  async start() {
    // 1. Register identity
    await this.registerIdentity();
    
    // 2. Connect to ATP Gateway
    await this.connect();
    
    // 3. Authenticate
    await this.authenticate();
    
    console.log('🎉 Agent is ready!');
  }

  async registerIdentity() {
    const response = await fetch('http://localhost:3001/identity/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    const result = await response.json();
    this.did = result.data.did;
    this.privateKey = result.data.privateKey;
    
    console.log(`🆔 Registered DID: ${this.did}`);
  }

  async connect() {
    return new Promise((resolve) => {
      this.ws = new WebSocket('ws://localhost:8080/rpc');
      
      this.ws.on('open', () => {
        console.log('🔌 Connected to ATP Gateway');
        resolve();
      });
      
      this.ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        console.log('📨 Received:', message);
      });
    });
  }

  async authenticate() {
    const timestamp = Date.now();
    const challenge = `${this.did}:${timestamp}`;
    
    // Sign the challenge
    const messageBytes = Buffer.from(challenge, 'utf8');
    const privateKeyBytes = Buffer.from(this.privateKey, 'hex');
    const signature = await ed25519.sign(messageBytes, privateKeyBytes);
    const proof = Buffer.from(signature).toString('hex');

    // Send auth message
    this.ws.send(JSON.stringify({
      type: 'auth',
      payload: { did: this.did, proof, timestamp }
    }));
  }

  async invoke(method, params) {
    const request = {
      type: 'rpc',
      payload: {
        jsonrpc: '2.0',
        method,
        params,
        id: Math.random().toString(36)
      }
    };
    
    this.ws.send(JSON.stringify(request));
  }
}

// Start the agent
new MyAgent().start().catch(console.error);
```

### 3. Run Your Agent

```bash
node agent.js

# Output:
# 🆔 Registered DID: did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK
# 🔌 Connected to ATP Gateway  
# 📨 Received: {"type":"notification","payload":{"event":"connected"}}
# 📨 Received: {"type":"notification","payload":{"event":"authenticated","success":true}}
# 🎉 Agent is ready!
```

Congratulations! You've created your first ATP agent.

## Example Use Cases

### 1. Weather Data Provider

Create an agent that provides weather data with verifiable credentials:

```javascript
// Register a weather data schema
await agent.invoke('vc.schemas', {
  id: 'weather-v1',
  name: 'WeatherData',
  properties: {
    city: { type: 'string', required: true },
    temperature: { type: 'number' },
    timestamp: { type: 'string' }
  }
});

// Issue weather credential
await agent.invoke('vc.issue', {
  schemaId: 'weather-v1', 
  subject: 'did:key:consumer-did',
  claims: {
    city: 'London',
    temperature: 18,
    timestamp: new Date().toISOString()
  },
  issuerDid: agent.did,
  issuerPrivateKey: agent.privateKey
});
```

### 2. Permission-Based Data Sharing

Grant temporary access to resources:

```javascript
// Grant read permission for 1 hour
await agent.invoke('permission.grant', {
  grantor: agent.did,
  grantee: 'did:key:consumer-did',
  scopes: ['read'],
  resource: 'weather:london',
  expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
});

// Check permission before sharing data
const permCheck = await agent.invoke('permission.check', {
  subject: 'did:key:consumer-did',
  action: 'read', 
  resource: 'weather:london'
});

if (permCheck.result.data.allowed) {
  // Share the data
}
```

## Running Examples

ATP includes ready-to-run example agents:

```bash
# Start weather agent
cd examples/simple-agent
npm run dev weather

# Start calculator agent (in another terminal)
npm run dev calculator

# Run interactive demo
cd ../demo-workflow
npm run demo
```

## Next Steps

- **Explore the API**: Read the [API Reference](api/README.md)
- **Build Multi-Agent Workflows**: See [Integration Guide](integration.md)
- **Understand Security**: Review [Security Model](security.md)
- **Deploy to Production**: Check [Deployment Guide](deployment.md)
- **Join the Community**: [Discord](https://discord.gg/atp-dev) | [GitHub](https://github.com/agent-trust-protocol/atp)

## Troubleshooting

### Services won't start

```bash
# Check if ports are in use
lsof -i :3000-3003,8080

# View service logs
docker-compose logs identity-service
```

### Connection refused

```bash
# Verify services are running
curl http://localhost:3000/health

# Check network connectivity
docker network ls
docker network inspect atp-network
```

### Authentication fails

- Ensure your DID is properly registered
- Check that the timestamp is within 5 minutes
- Verify signature generation code

### Need Help?

- 📖 [Documentation](https://docs.atp.dev)
- 💬 [Discord Community](https://discord.gg/atp-dev)  
- 🐛 [Report Issues](https://github.com/agent-trust-protocol/atp/issues)
- 📧 [Email Support](mailto:support@atp.dev)