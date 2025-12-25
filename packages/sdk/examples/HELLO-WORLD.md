# Hello World Example
## The Simplest ATP Agent

This is the absolute minimum code to create a quantum-safe AI agent.

## Code

```javascript
import { Agent } from 'atp-sdk';

const agent = await Agent.create('HelloWorld');
console.log('Agent DID:', agent.getDID());
console.log('Quantum-safe:', agent.isQuantumSafe());
```

## Run It

```bash
# From packages/sdk directory
npm run build
node examples/00-quickstart-local.js
```

## What Happens

1. Creates a new agent with quantum-safe cryptography
2. Generates a decentralized identity (DID)
3. Sets up hybrid Ed25519 + ML-DSA key pair
4. Prints the agent's DID and quantum-safe status

## Next Steps

- **[Full Quickstart](../README.md#developer-quickstart)** - More examples
- **[API Reference](../docs/API-SURFACE.md)** - Complete API docs
- **[All Examples](./README.md)** - 11+ working examples

