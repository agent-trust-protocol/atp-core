# ATP Core  LEGACY

> ** DEPRECATED:** This package is superseded by `atp-sdk`. Please use [`atp-sdk`](https://www.npmjs.com/package/atp-sdk) for all new development.
>
> **Migration:** See [Migration Guide](../packages/sdk/docs/MIGRATION.md)

---

A minimal implementation of the Agent Trust Protocol with quantum-safe cryptography and MCP security wrapper.

**Status:**  Legacy (superseded by `atp-sdk`)

## Features

 **Quantum-Safe Security**
- Hybrid Ed25519 + Dilithium3 signatures
- Post-quantum cryptographic resistance
- Backward compatibility with classical signatures

 **MCP Security Layer**
- First security wrapper for Model Context Protocol
- Signature verification for all MCP tool requests
- Trust scoring and audit logging
- Enhanced responses with ATP metadata

 **Decentralized Identity**
- Self-sovereign DIDs with quantum-safe keys
- Verifiable messaging between agents
- SQLite storage for development

## Quick Start

```bash
npm install
npm run build
npm start
```

##  Live Demo

Experience the world's first quantum-safe agent protocol:

```bash
npm run demo
```

**Demo showcases:**
-  Quantum-safe agent creation (Alice & Bob)
-  Hybrid Ed25519 + Dilithium3 signatures
-  Dynamic trust scoring system
-  MCP security wrapper in action
-  Performance comparison (Classical vs Quantum)
-  Complete audit trail

## API Endpoints

### Agent Management
- `POST /agent/register` - Register quantum-safe agent
- `GET /agent/:did/messages` - Get agent messages

### Secure Messaging
- `POST /message/send` - Send signed messages

### MCP Security Wrapper
- `POST /mcp/tool/:toolname` - Secured MCP tool access
- `GET /mcp/audit/:did?` - View audit logs

### Example MCP Request

```bash
curl -X POST http://localhost:3000/mcp/tool/search \
  -H "Content-Type: application/json" \
  -H "X-ATP-DID: did:atp:qs:..." \
  -H "X-ATP-Signature: {...}" \
  -d '{"payload": {"query": "quantum computing"}}'
```

### Response Format

```json
{
  "success": true,
  "data": { /* MCP tool response */ },
  "atp": {
    "callerDid": "did:atp:qs:...",
    "trustScore": 85,
    "quantumSafe": true,
    "verificationMethod": "hybrid"
  }
}
```

## Configuration

Edit `mcp-config.json` to add MCP tools:

```json
{
  "mcpTools": {
    "search": "http://localhost:8080/mcp/search",
    "calculator": "http://localhost:8081/mcp/calc"
  }
}
```

## Security Features

- **Trust Scoring**: Dynamic reputation based on message history
- **Signature Verification**: Both Ed25519 and Dilithium3 must validate
- **Audit Logging**: All MCP requests logged with metadata
- **Rate Limiting**: Configurable per-agent limits

**Total Code**: ~400 lines | **Status**:  Legacy (use `atp-sdk`) | **Quantum-Safe**: 