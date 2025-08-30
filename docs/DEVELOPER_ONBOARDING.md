# 🚀 ATP™ Developer Onboarding Guide

Welcome to the **Agent Trust Protocol™** developer community! This guide will get you up and running with ATP™ in minutes.

## 🎯 Quick Start (5 Minutes)

### Prerequisites
- **Docker Desktop** (with Docker Compose v2)
- **Node.js 18+** 
- **Git**

### 1. Clone and Setup
```bash
git clone https://github.com/agent-trust-protocol/atp.git
cd atp
npm install
```

### 2. Start ATP™ Infrastructure
```bash
# Start core infrastructure
docker compose -f docker-compose.simple.yml up -d

# Verify services are healthy
docker compose -f docker-compose.simple.yml ps
```

### 3. Test Your Setup
```bash
# Check database
curl http://localhost:5432

# Check IPFS
curl http://localhost:5001/api/v0/version

# Check monitoring
curl http://localhost:9090/-/healthy
```

🎉 **You're ready to build with ATP™!**

---

## 🏗️ Architecture Overview

ATP™ provides a **6-component microservices architecture** for secure AI agent interactions:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Identity      │    │   Credentials   │    │   Permissions   │
│   Service       │    │   Service       │    │   Service       │
│   (Port 3001)   │    │   (Port 3002)   │    │   (Port 3003)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   RPC Gateway   │
                    │   (Port 3000)   │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Audit Logger  │    │   Protocol      │    │   Infrastructure│
│   (Port 3005)   │    │   Integrations  │    │   Services      │
│                 │    │   (Port 3006+)  │    │   (DB, IPFS)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Core Components

1. **Identity Service** - DID-based agent identity management
2. **Credentials Service** - Verifiable credential issuance/verification  
3. **Permissions Service** - Dynamic access control policies
4. **RPC Gateway** - Secure communication hub with mTLS/DID-JWT
5. **Audit Logger** - Immutable event logging with IPFS storage
6. **Protocol Integrations** - MCP, A2A, and other protocol bridges

---

## 🔐 Trust Levels System

ATP™ implements a **5-tier trust hierarchy**:

| Level | Capabilities | Use Cases |
|-------|-------------|-----------|
| **UNTRUSTED** | None | New/unverified agents |
| **BASIC** | Read public data | Basic agent interactions |
| **VERIFIED** | Read protected, write basic | Verified agent identity |
| **PREMIUM** | Advanced operations, tool execution | Business agents |
| **ENTERPRISE** | Full system access | Internal/admin agents |

### Example: Upgrading Trust Level
```bash
curl -X POST http://localhost:3001/identity/did:atp:your-agent/trust-level \
  -H "Content-Type: application/json" \
  -d '{"trustLevel": "VERIFIED", "reason": "Identity verification completed"}'
```

---

## 🛠️ Development Examples

### 1. Register a New Agent

```javascript
// Register agent identity
const response = await fetch('http://localhost:3001/identity/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    publicKey: 'your-ed25519-public-key',
    metadata: {
      name: 'My AI Assistant',
      type: 'assistant',
      capabilities: ['chat', 'analysis']
    }
  })
});

const { data } = await response.json();
console.log('Agent DID:', data.did);
// Output: did:atp:staging:agent-1234567890
```

### 2. Authenticate Agent

```javascript
// Get authentication challenge
const challengeResp = await fetch('http://localhost:3000/auth/challenge', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ did: 'did:atp:staging:agent-1234567890' })
});

const { challenge } = await challengeResp.json();

// Sign challenge with your private key
const signature = await signChallenge(challenge, privateKey);

// Submit authentication response
const authResp = await fetch('http://localhost:3000/auth/response', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    challenge,
    response: challenge,
    signature,
    did: 'did:atp:staging:agent-1234567890'
  })
});
```

### 3. Log Audit Events

```javascript
// Log important agent actions
await fetch('http://localhost:3005/audit/log', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    source: 'my-agent',
    action: 'data-access',
    resource: 'user-documents',
    actor: 'did:atp:staging:agent-1234567890',
    details: {
      operation: 'read',
      fileCount: 5,
      classification: 'public'
    }
  })
});
```

### 4. Use Protocol Integrations

```javascript
// Get available MCP tools
const toolsResp = await fetch('http://localhost:3006/mcp/tools');
const { tools } = await toolsResp.json();

// Discover other agents via A2A
const agentsResp = await fetch('http://localhost:3007/a2a/agents');
const { agents } = await agentsResp.json();
```

---

## 🧪 Testing Your Integration

### Unit Testing Template

```javascript
import { describe, test, expect } from '@jest/globals';

describe('ATP™ Integration Tests', () => {
  test('should register agent identity', async () => {
    const response = await fetch('http://localhost:3001/identity/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: 'test-public-key',
        metadata: { name: 'Test Agent' }
      })
    });
    
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.did).toMatch(/^did:atp:/);
    expect(result.data.trustLevel).toBe('BASIC');
  });

  test('should upgrade trust level', async () => {
    // Test trust level progression
    const did = 'did:atp:staging:test-agent';
    
    const response = await fetch(`http://localhost:3001/identity/${did}/trust-level`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trustLevel: 'VERIFIED',
        reason: 'Test verification'
      })
    });
    
    expect(response.ok).toBe(true);
  });
});
```

### Integration Test Script

```bash
#!/bin/bash
# test-atp-integration.sh

echo "🧪 Testing ATP™ Integration..."

# Test 1: Service Health
curl -sf http://localhost:3001/health || exit 1
curl -sf http://localhost:3000/health || exit 1
curl -sf http://localhost:3005/health || exit 1

# Test 2: Agent Registration
AGENT_RESPONSE=$(curl -sf -X POST http://localhost:3001/identity/register \
  -H "Content-Type: application/json" \
  -d '{"publicKey":"test-key","metadata":{"name":"Test Agent"}}')

AGENT_DID=$(echo $AGENT_RESPONSE | grep -o '"did":"[^"]*"' | cut -d'"' -f4)
echo "✅ Agent registered: $AGENT_DID"

# Test 3: Trust Level Update
curl -sf -X POST "http://localhost:3001/identity/$AGENT_DID/trust-level" \
  -H "Content-Type: application/json" \
  -d '{"trustLevel":"VERIFIED","reason":"Test verification"}' || exit 1

echo "✅ Trust level updated"

# Test 4: Audit Logging
curl -sf -X POST http://localhost:3005/audit/log \
  -H "Content-Type: application/json" \
  -d '{"source":"test","action":"test","resource":"test","actor":"'$AGENT_DID'"}' || exit 1

echo "✅ Audit event logged"

echo "🎉 All integration tests passed!"
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Core Service Configuration
export NODE_ENV=development
export LOG_LEVEL=info

# Database Configuration  
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_DB=atp_staging
export POSTGRES_USER=atp_user
export POSTGRES_PASSWORD=your-password

# Security Configuration
export AUDIT_ENCRYPTION_KEY=your-32-char-encryption-key
export JWT_SECRET=your-jwt-secret
export TLS_CERT_PATH=/path/to/cert.pem
export TLS_KEY_PATH=/path/to/key.pem

# Feature Flags
export ENABLE_METRICS=true
export ENABLE_AUDIT_ENCRYPTION=true
export ENABLE_IPFS_STORAGE=true
export ENABLE_MTLS=false  # Enable for production
```

### Custom Configuration File

```json
{
  "services": {
    "identity": {
      "port": 3001,
      "database": "sqlite:identity.db",
      "trustLevels": ["UNTRUSTED", "BASIC", "VERIFIED", "PREMIUM", "ENTERPRISE"]
    },
    "gateway": {
      "port": 3000,
      "httpsPort": 3443,
      "enableMTLS": false,
      "corsOrigins": ["http://localhost:3000"]
    },
    "audit": {
      "port": 3005,
      "enableEncryption": true,
      "ipfsStorage": true,
      "retentionDays": 365
    }
  },
  "protocols": {
    "mcp": {
      "enabled": true,
      "trustRequired": "BASIC"
    },
    "a2a": {
      "enabled": true,
      "discoveryEnabled": true
    }
  }
}
```

---

## 📚 SDK Usage

### Install ATP™ SDK

```bash
npm install @atp/sdk
```

### Basic SDK Usage

```javascript
import { ATPClient } from '@atp/sdk';

// Initialize client
const atp = new ATPClient({
  gatewayUrl: 'http://localhost:3000',
  identityUrl: 'http://localhost:3001',
  auditUrl: 'http://localhost:3005'
});

// Register agent
const agent = await atp.identity.register({
  publicKey: myPublicKey,
  metadata: {
    name: 'My Agent',
    type: 'assistant'
  }
});

// Authenticate
await atp.auth.authenticate(agent.did, privateKey);

// Log activities
await atp.audit.log({
  action: 'user-interaction',
  resource: 'chat-session',
  details: { messageCount: 5, duration: 120 }
});

// Use protocols
const tools = await atp.protocols.mcp.getTools();
const agents = await atp.protocols.a2a.discoverAgents();
```

---

## 🚀 Production Deployment

### Docker Production Setup

```yaml
# docker-compose.production.yml
services:
  identity-service:
    image: atp/identity-service:latest
    environment:
      - NODE_ENV=production
      - DB_URL=postgresql://user:pass@postgres:5432/atp_prod
    depends_on:
      - postgres
    restart: always

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=atp_prod
      - POSTGRES_USER=atp_user
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_prod:/var/lib/postgresql/data
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    restart: always
```

### Kubernetes Deployment

```yaml
# atp-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: atp-identity-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: atp-identity
  template:
    metadata:
      labels:
        app: atp-identity
    spec:
      containers:
      - name: identity-service
        image: atp/identity-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_URL
          valueFrom:
            secretKeyRef:
              name: atp-secrets
              key: database-url
```

---

## 🔍 Monitoring & Debugging

### Health Checks

```bash
# Check all service health
curl http://localhost:3001/health  # Identity
curl http://localhost:3002/health  # VC Service  
curl http://localhost:3003/health  # Permissions
curl http://localhost:3000/health  # Gateway
curl http://localhost:3005/health  # Audit Logger
curl http://localhost:3006/health  # Protocols
```

### View Logs

```bash
# Docker logs
docker compose -f docker-compose.simple.yml logs identity-service
docker compose -f docker-compose.simple.yml logs postgres
docker compose -f docker-compose.simple.yml logs ipfs

# Service-specific logs
tail -f logs/identity-service.log
tail -f logs/audit-events.log
```

### Prometheus Metrics

Access metrics at: `http://localhost:9090`

Key metrics to monitor:
- `atp_requests_total` - Total API requests
- `atp_auth_attempts_total` - Authentication attempts
- `atp_trust_level_changes_total` - Trust level modifications
- `atp_audit_events_total` - Audit events logged

---

## 🐛 Troubleshooting

### Common Issues

**Issue: Services not starting**
```bash
# Check Docker status
docker compose -f docker-compose.simple.yml ps

# Check logs
docker compose -f docker-compose.simple.yml logs
```

**Issue: Database connection failed**
```bash
# Test database connectivity
docker compose -f docker-compose.simple.yml exec postgres pg_isready -U atp_user

# Check database schemas
docker compose -f docker-compose.simple.yml exec postgres psql -U atp_user -d atp_staging -c "\\dt atp_*.*"
```

**Issue: IPFS storage problems**
```bash
# Check IPFS status
curl http://localhost:5001/api/v0/version

# Test IPFS storage
echo "test" | curl -F "file=@-" http://localhost:5001/api/v0/add
```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
export NODE_ENV=development

# Start services with verbose output
docker compose -f docker-compose.simple.yml up --no-daemon
```

---

## 📖 Next Steps

### 1. Build Your First Agent

Follow our [Agent Development Tutorial](./AGENT_TUTORIAL.md) to create your first ATP™-enabled agent.

### 2. Explore Advanced Features

- **[Security Guide](./SECURITY.md)** - mTLS, DID certificates, encryption
- **[Protocol Integrations](./PROTOCOLS.md)** - MCP, A2A, custom protocols  
- **[Audit & Compliance](./AUDIT.md)** - Immutable logging, compliance tracking

### 3. Join the Community

- **GitHub**: [agent-trust-protocol/atp](https://github.com/agent-trust-protocol/atp)
- **Discord**: [ATP™ Developer Community](https://discord.gg/atp)
- **Documentation**: [docs.atp.dev](https://docs.atp.dev)

---

## 💡 Example Projects

Check out these reference implementations:

- **[Basic Chat Agent](./examples/chat-agent/)** - Simple conversational agent
- **[Document Analyzer](./examples/doc-analyzer/)** - File processing with audit trails
- **[Multi-Agent System](./examples/multi-agent/)** - Coordinated agent workflows
- **[Enterprise Integration](./examples/enterprise/)** - Production-scale deployment

---

**🎉 Welcome to the ATP™ developer community! Build secure, trustworthy AI agents with confidence.**

For support, reach out on [Discord](https://discord.gg/atp) or create an issue on [GitHub](https://github.com/agent-trust-protocol/atp/issues).