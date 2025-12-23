# 📡 ATP™ API Reference

Complete API documentation for the Agent Trust Protocol™.

## 🔗 Base URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Identity Service** | `http://localhost:3001` | DID management |
| **VC Service** | `http://localhost:3002` | Verifiable credentials |
| **Permission Service** | `http://localhost:3003` | Access control |
| **RPC Gateway** | `http://localhost:3000` | Main API gateway |
| **Audit Logger** | `http://localhost:3005` | Event logging |
| **Protocol Integrations** | `http://localhost:3006` | MCP, A2A bridges |

---

## 🆔 Identity Service API

### Register Agent Identity

**POST** `/identity/register`

Creates a new agent identity with DID.

```json
{
  "publicKey": "ed25519-public-key-hex",
  "metadata": {
    "name": "Agent Name",
    "type": "assistant|analyzer|coordinator",
    "capabilities": ["chat", "analysis"],
    "description": "Agent description"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "did": "did:atp:staging:agent-1234567890",
    "publicKey": "ed25519-public-key-hex",
    "trustLevel": "BASIC",
    "metadata": { ... },
    "createdAt": "2025-06-25T21:30:00.000Z"
  }
}
```

### Get Agent Identity

**GET** `/identity/:did`

Retrieves agent identity information.

**Response:**
```json
{
  "success": true,
  "data": {
    "did": "did:atp:staging:agent-1234567890",
    "publicKey": "ed25519-public-key-hex",
    "trustLevel": "VERIFIED",
    "metadata": { ... },
    "createdAt": "2025-06-25T21:30:00.000Z",
    "updatedAt": "2025-06-25T21:35:00.000Z"
  }
}
```

### List All Identities

**GET** `/identity`

Returns paginated list of all agent identities.

**Query Parameters:**
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `trustLevel` (optional): Filter by trust level

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "did": "did:atp:staging:agent-1234567890",
      "trustLevel": "VERIFIED",
      "metadata": { "name": "Agent Name" },
      "createdAt": "2025-06-25T21:30:00.000Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### Update Trust Level

**POST** `/identity/:did/trust-level`

Updates an agent's trust level.

```json
{
  "trustLevel": "VERIFIED|PREMIUM|ENTERPRISE",
  "reason": "Verification completed",
  "evidence": {
    "verificationMethod": "manual",
    "verifiedBy": "did:atp:admin:verifier",
    "documents": ["verification-cert-hash"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "did": "did:atp:staging:agent-1234567890",
    "previousTrustLevel": "BASIC",
    "newTrustLevel": "VERIFIED",
    "updatedAt": "2025-06-25T21:35:00.000Z"
  }
}
```

### Get Trust Level Info

**GET** `/identity/:did/trust-info`

Returns detailed trust level information and capabilities.

**Response:**
```json
{
  "success": true,
  "data": {
    "did": "did:atp:staging:agent-1234567890",
    "trustLevel": "VERIFIED",
    "capabilities": [
      "read-public",
      "read-protected", 
      "write-basic"
    ],
    "restrictions": [],
    "levelDescription": "Verified agent with identity confirmation",
    "upgradeRequirements": ["manual-verification", "compliance-check"]
  }
}
```

### Rotate Keys

**POST** `/identity/:did/rotate-keys`

Rotates agent's cryptographic keys.

```json
{
  "newPublicKey": "new-ed25519-public-key-hex",
  "signature": "signature-of-rotation-request",
  "reason": "Key rotation for security"
}
```

---

## 🛡️ RPC Gateway API

### Health Check

**GET** `/health`

Returns gateway health status.

**Response:**
```json
{
  "status": "healthy",
  "service": "rpc-gateway",
  "version": "0.1.0",
  "protocol": "Agent Trust Protocol™",
  "services": {
    "identity": "healthy",
    "vc": "healthy",
    "permission": "healthy",
    "audit": "healthy"
  },
  "mtlsEnabled": false,
  "timestamp": 1750886400000
}
```

### Get Service Status

**GET** `/services`

Returns status of all ATP™ services.

**Response:**
```json
{
  "success": true,
  "data": {
    "identity": {
      "status": "healthy",
      "url": "http://localhost:3001",
      "version": "0.1.0"
    },
    "vc": {
      "status": "healthy", 
      "url": "http://localhost:3002",
      "version": "0.1.0"
    },
    "permission": {
      "status": "healthy",
      "url": "http://localhost:3003", 
      "version": "0.1.0"
    },
    "audit": {
      "status": "healthy",
      "url": "http://localhost:3005",
      "version": "0.1.0"
    }
  }
}
```

### Create Authentication Challenge

**POST** `/auth/challenge`

Creates authentication challenge for agent.

```json
{
  "did": "did:atp:staging:agent-1234567890",
  "nonce": "optional-nonce"
}
```

**Response:**
```json
{
  "success": true,
  "challenge": "atp-challenge-1234567890-abc123",
  "expiresAt": "2025-06-25T21:45:00.000Z",
  "algorithm": "ed25519"
}
```

### Submit Authentication Response

**POST** `/auth/response`

Submits signed authentication response.

```json
{
  "challenge": "atp-challenge-1234567890-abc123",
  "response": "challenge-response-data",
  "signature": "ed25519-signature-hex",
  "did": "did:atp:staging:agent-1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "token": "jwt-token-for-session",
  "expiresAt": "2025-06-25T22:30:00.000Z"
}
```

### Get CA Certificate

**GET** `/certificates/ca`

Returns the Certificate Authority's public certificate.

**Response:**
```json
{
  "success": true,
  "certificate": {
    "issuer": "did:atp:ca:gateway",
    "publicKey": "ca-public-key",
    "trustLevel": "ENTERPRISE",
    "validFrom": "2025-06-25T21:00:00.000Z",
    "validUntil": "2030-06-25T21:00:00.000Z",
    "fingerprint": "sha256-hash",
    "signature": "ca-self-signature"
  }
}
```

### Get Certificate Revocation List

**GET** `/certificates/crl`

Returns current certificate revocation list.

**Response:**
```json
{
  "success": true,
  "revocationList": {
    "issuer": "did:atp:ca:gateway",
    "revokedCertificates": [
      {
        "certificateId": "cert-id-123",
        "revocationDate": "2025-06-25T21:20:00.000Z",
        "reason": "Key compromise"
      }
    ],
    "lastUpdate": "2025-06-25T21:30:00.000Z",
    "nextUpdate": "2025-07-02T21:30:00.000Z"
  }
}
```

---

## 📋 Audit Logger API

### Log Event

**POST** `/audit/log`

Creates an audit log entry.

```json
{
  "source": "my-service",
  "action": "data-access",
  "resource": "user-documents",
  "actor": "did:atp:staging:agent-1234567890",
  "details": {
    "operation": "read",
    "fileCount": 5,
    "classification": "public",
    "requestId": "req-123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "event": {
    "id": "evt-1234567890",
    "timestamp": "2025-06-25T21:30:00.000Z",
    "source": "my-service",
    "action": "data-access",
    "resource": "user-documents",
    "actor": "did:atp:staging:agent-1234567890",
    "details": { ... },
    "hash": "sha256-event-hash",
    "signature": "ed25519-signature",
    "blockNumber": 42,
    "ipfsHash": "QmHash123..."
  }
}
```

### Query Events

**GET** `/audit/events`

Queries audit log events.

**Query Parameters:**
- `source` (optional): Filter by event source
- `action` (optional): Filter by action type
- `resource` (optional): Filter by resource
- `actor` (optional): Filter by actor DID
- `startTime` (optional): ISO 8601 timestamp
- `endTime` (optional): ISO 8601 timestamp
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "id": "evt-1234567890",
      "timestamp": "2025-06-25T21:30:00.000Z",
      "source": "my-service",
      "action": "data-access",
      "resource": "user-documents",
      "actor": "did:atp:staging:agent-1234567890",
      "hash": "sha256-event-hash",
      "blockNumber": 42
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### Get Event by ID

**GET** `/audit/events/:id`

Retrieves specific audit event.

**Response:**
```json
{
  "success": true,
  "event": {
    "id": "evt-1234567890",
    "timestamp": "2025-06-25T21:30:00.000Z",
    "source": "my-service",
    "action": "data-access",
    "resource": "user-documents",
    "actor": "did:atp:staging:agent-1234567890",
    "details": { ... },
    "hash": "sha256-event-hash",
    "signature": "ed25519-signature",
    "blockNumber": 42,
    "ipfsHash": "QmHash123...",
    "encrypted": false
  }
}
```

### Verify Chain Integrity

**GET** `/audit/integrity`

Verifies audit chain integrity.

**Response:**
```json
{
  "success": true,
  "integrity": {
    "valid": true,
    "totalEvents": 1234,
    "lastBlockNumber": 42,
    "lastVerification": "2025-06-25T21:30:00.000Z",
    "chainLength": 1234,
    "hashAlgorithm": "sha256"
  }
}
```

---

## 🔗 Protocol Integrations API

### MCP (Model Context Protocol)

#### Get Available Tools

**GET** `/mcp/tools`

Returns available MCP tools.

**Response:**
```json
{
  "success": true,
  "tools": [
    {
      "name": "file-reader",
      "description": "Read file contents",
      "trustLevel": "BASIC",
      "inputSchema": {
        "type": "object",
        "properties": {
          "path": { "type": "string" }
        }
      }
    },
    {
      "name": "web-search",
      "description": "Search the web",
      "trustLevel": "VERIFIED", 
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": { "type": "string" }
        }
      }
    }
  ]
}
```

#### Execute Tool

**POST** `/mcp/tools/:toolName/execute`

Executes an MCP tool.

```json
{
  "input": {
    "path": "/path/to/file.txt"
  },
  "actor": "did:atp:staging:agent-1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "content": "File contents here...",
    "metadata": {
      "size": 1024,
      "lastModified": "2025-06-25T21:00:00.000Z"
    }
  },
  "executionTime": 150,
  "trustLevel": "BASIC"
}
```

### A2A (Agent-to-Agent)

#### Discover Agents

**GET** `/a2a/agents`

Discovers available agents.

**Query Parameters:**
- `type` (optional): Filter by agent type
- `trustLevel` (optional): Minimum trust level
- `capabilities` (optional): Required capabilities

**Response:**
```json
{
  "success": true,
  "agents": [
    {
      "did": "did:atp:staging:agent-1234567890",
      "name": "Assistant Agent",
      "type": "assistant",
      "trustLevel": "VERIFIED",
      "capabilities": ["chat", "analysis"],
      "endpoint": "http://localhost:3001",
      "lastSeen": "2025-06-25T21:30:00.000Z"
    }
  ],
  "total": 1
}
```

#### Send Message to Agent

**POST** `/a2a/agents/:did/message`

Sends message to another agent.

```json
{
  "from": "did:atp:staging:agent-sender",
  "message": {
    "type": "request",
    "action": "analyze-document",
    "payload": {
      "documentHash": "QmHash123...",
      "analysisType": "sentiment"
    }
  },
  "signature": "ed25519-signature"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg-1234567890",
  "status": "delivered",
  "timestamp": "2025-06-25T21:30:00.000Z"
}
```

---

## 🔐 Authentication Headers

All secured endpoints require authentication via one of these methods:

### JWT Bearer Token
```
Authorization: Bearer <jwt-token>
```

### DID-JWT
```
Authorization: DID-JWT <did-jwt-token>
```

### mTLS Certificate
Use client certificate for mutual TLS authentication.

---

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-06-25T21:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "INVALID_DID",
    "message": "Invalid DID format",
    "details": "DID must start with 'did:atp:'"
  },
  "timestamp": "2025-06-25T21:30:00.000Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## 🚫 Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_DID` | Invalid DID format | 400 |
| `AGENT_NOT_FOUND` | Agent identity not found | 404 |
| `INSUFFICIENT_TRUST` | Trust level too low | 403 |
| `AUTHENTICATION_REQUIRED` | Missing authentication | 401 |
| `INVALID_SIGNATURE` | Signature verification failed | 401 |
| `RATE_LIMITED` | Too many requests | 429 |
| `SERVICE_UNAVAILABLE` | Service temporarily down | 503 |
| `INTERNAL_ERROR` | Server error | 500 |

---

## 🔧 Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | 1 minute |
| Identity operations | 10 requests | 1 minute |
| Audit logging | 100 requests | 1 minute |
| Protocol integrations | 50 requests | 1 minute |
| General API | 1000 requests | 1 hour |

---

## 📱 SDK Usage

For easier integration, use the ATP™ SDK:

```javascript
import { ATPClient } from '@atp/sdk';

const atp = new ATPClient({
  gatewayUrl: 'http://localhost:3000',
  identityUrl: 'http://localhost:3001'
});

// Register agent
const agent = await atp.identity.register({
  publicKey: myPublicKey,
  metadata: { name: 'My Agent' }
});

// Authenticate
await atp.auth.authenticate(agent.did, privateKey);

// Use APIs
const events = await atp.audit.queryEvents({ actor: agent.did });
```

---

**📚 For more examples and tutorials, see the [Developer Onboarding Guide](./DEVELOPER_ONBOARDING.md).**