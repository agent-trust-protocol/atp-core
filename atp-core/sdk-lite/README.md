# @atp/sdk-lite

**Ultra-lightweight SDK for the world's first quantum-safe AI agent protocol**

##  3-Line Quick Start

```typescript
import { Agent } from '@atp/sdk-lite';

const alice = await Agent.create('Alice');
const bob = await Agent.create('Bob');
await alice.send(bob, 'Hello from the quantum future!');
console.log('Trust Score:', await alice.getTrustScore(bob));
```

##  Features

-  **Quantum-Safe**: Ed25519 + Dilithium3 hybrid signatures
-  **Ultra-Light**: < 10KB total size
-  **Zero Dependencies**: Pure TypeScript/JavaScript
-  **3-Line Integration**: Get started instantly
-  **MCP Security**: Built-in Model Context Protocol wrapper
-  **Universal**: Works in Node.js and browsers

##  Installation

```bash
npm install @atp/sdk-lite
```

##  Examples

### Basic Agent Creation
```typescript
import { Agent } from '@atp/sdk-lite';

// Create quantum-safe agents
const alice = await Agent.create('Alice');
const bob = await Agent.create('Bob');

console.log('Alice DID:', alice.did);
console.log('Quantum-safe:', alice.isQuantumSafe); // true
```

### Secure Messaging
```typescript
// Send quantum-safe messages
await alice.send(bob, 'Hello from the quantum future!');
await bob.send(alice, 'Quantum greetings received!');

// Check trust relationship
const trustScore = await alice.getTrustScore(bob);
console.log(`Trust score: ${trustScore}/100`);
```

### MCP Tool Access
```typescript
// Secure MCP tool requests
const result = await alice.mcpRequest('search', {
  query: 'quantum computing',
  limit: 10
});

console.log('Search results:', result.data);
console.log('ATP security:', result.atp);
```

### Configuration
```typescript
import { Agent } from '@atp/sdk-lite';

// Configure ATP server
Agent.configure({
  atpServerUrl: 'https://atp.example.com',
  timeout: 10000,
  debug: true
});
```

##  API Reference

### `Agent.create(name: string): Promise<Agent>`
Creates a new quantum-safe agent with DID and hybrid keys.

### `agent.send(to: Agent | string, message: string): Promise<void>`
Sends a quantum-safe signed message to another agent.

### `agent.getTrustScore(withAgent: Agent | string): Promise<number>`
Calculates trust score (0-100) with another agent.

### `agent.mcpRequest(toolName: string, payload: any): Promise<any>`
Makes secure MCP tool request through ATP wrapper.

### Properties
- `agent.did: string` - Agent's decentralized identifier
- `agent.isQuantumSafe: boolean` - Quantum resistance status
- `agent.name: string` - Agent's friendly name
- `agent.publicKeys` - Ed25519 and Dilithium public keys

##  Environment Support

- **Node.js**: ≥18.0.0
- **Browsers**: Modern browsers with fetch support
- **TypeScript**: Full type definitions included
- **ES Modules**: Pure ESM package

##  Security Features

- **Hybrid Signatures**: Ed25519 (classical) + Dilithium3 (post-quantum)
- **Trust Scoring**: Dynamic reputation system
- **MCP Security**: First security layer for Model Context Protocol
- **Audit Trail**: Complete interaction logging
- **Future-Proof**: Ready for quantum computers

##  Bundle Size

- **Minified**: ~8KB
- **Gzipped**: ~3KB
- **Dependencies**: 0
- **Tree-shakeable**: Yes

##  Quick Examples

```typescript
// One-liner agent creation and messaging
const [alice, bob] = await Promise.all([
  Agent.create('Alice'),
  Agent.create('Bob')
]);

await alice.send(bob, 'Quantum-safe hello!');
```

##  Related Packages

- `@atp/core` - Full ATP server implementation
- `@atp/crypto` - Quantum-safe cryptography utilities
- `@atp/mcp` - MCP security wrapper

##  License

MIT License - see [LICENSE](LICENSE) file for details.

---

** World's First Quantum-Safe AI Agent Protocol**  
Ready for quantum computers. Available today.