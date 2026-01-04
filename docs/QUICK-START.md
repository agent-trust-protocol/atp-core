# ATP Quick Start Guide
## Get Started in 3 Lines of Code

This guide gets you up and running with ATP in under 2 minutes.

## ⚡ Instant Start (No Setup Required)

The simplest way to try ATP - works immediately:

```bash
npm install atp-sdk
```

```javascript
import { Agent } from 'atp-sdk';

// Create a quantum-safe agent (works offline!)
const agent = await Agent.create('MyBot');
console.log('Agent DID:', agent.getDID());
console.log('Quantum-safe:', agent.isQuantumSafe()); // true
```

**That's it!** You now have a quantum-safe AI agent with:
- ✅ Decentralized Identity (DID)
- ✅ Quantum-safe cryptography (hybrid Ed25519 + ML-DSA)
- ✅ Cryptographic key pair
- ✅ Trust scoring capability

## 🚀 Full Setup (With ATP Services)

For complete functionality including identity registration, credential issuance, and permissions:

### Step 1: Start ATP Services

**Option A: Docker Compose (Recommended)**
```bash
docker-compose up -d
```

**Option B: Clone and Start**
```bash
git clone https://github.com/agent-trust-protocol/core.git
cd agent-trust-protocol
./start-services.sh
```

### Step 2: Verify Services

```bash
# Check health
curl http://localhost:3000/health

# Should return: {"status":"healthy",...}
```

### Step 3: Use Your Agent

```javascript
import { Agent } from 'atp-sdk';

const agent = await Agent.create('my-ai-assistant');
await agent.initialize(); // Connects to ATP services

// Now you can:
// - Register identity on ATP network
// - Issue verifiable credentials
// - Manage permissions
// - Create audit trails
```

## 📚 Next Steps

- **[SDK Examples](./packages/sdk/examples/)** - 11+ working examples
- **[API Reference](./packages/sdk/docs/API-SURFACE.md)** - Complete API docs
- **[Full Documentation](./docs/getting-started.md)** - Comprehensive guide

## ❓ Troubleshooting

### "Cannot connect to ATP services"

**Solution:**
```bash
# Start services
docker-compose up -d

# Verify they're running
docker-compose ps

# Check health
curl http://localhost:3000/health
```

### "Module not found" or Import Errors

**Solution:**
```bash
# Ensure you're using ES modules
# Add to package.json:
{
  "type": "module"
}

# Or use .mjs extension
# file: app.mjs
import { Agent } from 'atp-sdk';
```

### Agent creation works but initialize() fails

**Solution:**
- Verify ATP services are running: `curl http://localhost:3000/health`
- Check service ports aren't already in use
- Review error message for specific service issue

## 🆘 Need Help?

- **GitHub Issues**: [Report bugs](https://github.com/agent-trust-protocol/core/issues)
- **Documentation**: [Full docs](./docs/getting-started.md)
- **Examples**: [11+ examples](./packages/sdk/examples/)

## 🎯 Common Use Cases

### 1. Create Secure Agent Identity
```javascript
const agent = await Agent.create('customer-service-bot');
console.log('DID:', agent.getDID());
```

### 2. Send Secure Message
```javascript
await agent.send('did:atp:other-agent', {
  action: 'process_order',
  orderId: '12345'
});
```

### 3. Check Trust Score
```javascript
const trust = await agent.getTrustScore('did:atp:other-agent');
console.log('Trust level:', trust);
```

### 4. Issue Credential
```javascript
await agent.issueCredential('did:atp:user', 'payment_authorized', {
  maxAmount: 1000,
  currency: 'USD'
});
```

---

**Ready to build?** Check out the [full examples](./packages/sdk/examples/) or [API reference](./packages/sdk/docs/API-SURFACE.md).

