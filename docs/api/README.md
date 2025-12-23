# Agent Trust Protocol - API Reference

This document provides a comprehensive reference for all ATP services and their APIs.

## Service Overview

ATP consists of four core services:

- **Identity Service** (Port 3001): DID generation, resolution, and key management
- **Verifiable Credential Service** (Port 3002): VC issuance, verification, and revocation
- **Permission Service** (Port 3003): Capability-based access control and policy management
- **RPC Gateway** (Port 3000/8080): WebSocket JSON-RPC 2.0 gateway and service orchestration

## Authentication

All services support DID-based authentication. For WebSocket connections, authenticate using:

```javascript
{
  "type": "auth",
  "payload": {
    "did": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
    "proof": "signature_hex",
    "timestamp": 1640995200000
  }
}
```

## Common Response Format

All HTTP APIs return responses in this format:

```json
{
  "success": true,
  "data": {...},
  "error": "Error message if success is false",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

---

## Identity Service API

### POST /identity/register

Register a new DID and generate cryptographic keys.

**Request:**
```json
{
  "publicKey": "optional_hex_encoded_public_key",
  "services": [
    {
      "id": "service-1",
      "type": "LinkedDomains",
      "serviceEndpoint": "https://example.com"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "did": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
    "document": {
      "@context": ["https://www.w3.org/ns/did/v1"],
      "id": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
      "verificationMethod": [...],
      "authentication": [...],
      "created": "2023-01-01T00:00:00.000Z",
      "updated": "2023-01-01T00:00:00.000Z"
    },
    "privateKey": "hex_encoded_private_key"
  }
}
```

### GET /identity/:did

Resolve a DID to its DID Document.

**Response:**
```json
{
  "success": true,
  "data": {
    "@context": ["https://www.w3.org/ns/did/v1"],
    "id": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
    "verificationMethod": [...],
    "authentication": [...],
    "service": [...]
  }
}
```

### POST /identity/:did/rotate-keys

Rotate cryptographic keys for a DID.

**Response:**
```json
{
  "success": true,
  "data": {
    "@context": ["https://www.w3.org/ns/did/v1"],
    "id": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
    "verificationMethod": [...],
    "updated": "2023-01-01T00:00:00.000Z"
  }
}
```

### GET /identity

List all registered DIDs.

**Response:**
```json
{
  "success": true,
  "data": [
    "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
    "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH"
  ]
}
```

---

## Verifiable Credential Service API

### POST /vc/issue

Issue a new verifiable credential.

**Request:**
```json
{
  "schemaId": "weather-data-v1",
  "subject": "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
  "claims": {
    "city": "London",
    "temperature": 15,
    "humidity": 80,
    "conditions": "cloudy"
  },
  "expirationDate": "2023-12-31T23:59:59.000Z",
  "issuerDid": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
  "issuerPrivateKey": "hex_encoded_private_key"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1"
    ],
    "id": "urn:uuid:12345678-1234-5678-9012-123456789012",
    "type": ["VerifiableCredential", "WeatherData"],
    "issuer": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
    "issuanceDate": "2023-01-01T00:00:00.000Z",
    "expirationDate": "2023-12-31T23:59:59.000Z",
    "credentialSubject": {
      "id": "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
      "city": "London",
      "temperature": 15,
      "humidity": 80,
      "conditions": "cloudy"
    },
    "proof": {
      "type": "Ed25519Signature2020",
      "created": "2023-01-01T00:00:00.000Z",
      "verificationMethod": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#key-1",
      "proofPurpose": "assertionMethod",
      "proofValue": "hex_encoded_signature"
    }
  }
}
```

### POST /vc/verify

Verify a verifiable credential.

**Request:**
```json
{
  "credential": {
    "@context": [...],
    "id": "urn:uuid:12345678-1234-5678-9012-123456789012",
    "type": ["VerifiableCredential", "WeatherData"],
    "issuer": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
    "credentialSubject": {...},
    "proof": {...}
  },
  "challenge": "optional_challenge_string",
  "domain": "optional_domain"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "checks": {
      "signature": true,
      "expiration": true,
      "revocation": true,
      "schema": true
    }
  }
}
```

### POST /vc/revoke/:credentialId

Revoke a verifiable credential.

**Request:**
```json
{
  "issuerDid": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Credential revoked successfully"
}
```

### POST /vc/schemas

Register a new credential schema.

**Request:**
```json
{
  "id": "weather-data-v1",
  "name": "WeatherData",
  "description": "Weather information for a specific location",
  "version": "1.0.0",
  "properties": {
    "city": {
      "type": "string",
      "description": "City name",
      "required": true
    },
    "temperature": {
      "type": "number",
      "description": "Temperature in Celsius"
    }
  },
  "required": ["city", "temperature"]
}
```

### GET /vc/schemas/:schemaId

Get a credential schema by ID.

### GET /vc/schemas

List all credential schemas.

---

## Permission Service API

### POST /perm/grant

Grant permissions to an agent.

**Request:**
```json
{
  "grantor": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
  "grantee": "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
  "scopes": ["read", "write"],
  "resource": "weather:london",
  "conditions": {
    "maxRequests": 100,
    "allowedHours": [9, 10, 11, 12, 13, 14, 15, 16, 17]
  },
  "expiresAt": 1640995200000,
  "justification": "Weather data access for analysis"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "allowed": true,
    "token": "jwt_capability_token",
    "expiresAt": 1640995200000
  }
}
```

### POST /perm/check

Check if an agent has permission for an action.

**Request:**
```json
{
  "subject": "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
  "action": "read",
  "resource": "weather:london",
  "context": {
    "timestamp": 1640995200000,
    "requestCount": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "allowed": true,
    "reason": "Permission granted via grant abc123"
  }
}
```

### POST /perm/validate

Validate a capability token.

**Request:**
```json
{
  "token": "jwt_capability_token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "payload": {
      "id": "token-id",
      "issuer": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
      "subject": "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH",
      "scopes": ["read", "write"],
      "expiresAt": 1640995200000
    }
  }
}
```

### DELETE /perm/revoke/:grantId

Revoke a permission grant.

**Request:**
```json
{
  "revoker": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
}
```

### GET /perm/list/:did

List all permissions for a DID.

---

## RPC Gateway API

### WebSocket JSON-RPC 2.0

Connect to `ws://localhost:8080/rpc` for real-time agent communication.

#### Authentication

```json
{
  "type": "auth",
  "payload": {
    "did": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
    "proof": "signature_hex",
    "timestamp": 1640995200000
  }
}
```

#### RPC Method Invocation

```json
{
  "type": "rpc",
  "payload": {
    "jsonrpc": "2.0",
    "method": "identity.register",
    "params": {},
    "id": "req-123"
  }
}
```

#### Subscriptions

```json
{
  "type": "subscribe",
  "payload": {
    "id": "sub-123",
    "event": "credential-issued",
    "filter": {
      "issuer": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
    }
  }
}
```

### Available RPC Methods

- `identity.register`
- `identity.resolve` 
- `identity.rotateKeys`
- `vc.issue`
- `vc.verify`
- `vc.revoke`
- `permission.grant`
- `permission.check`
- `permission.revoke`

### HTTP Endpoints

#### GET /health

System health check.

#### GET /services

Service status overview.

#### POST /broadcast

Broadcast events to subscribed clients.

---

## Error Codes

ATP uses standard HTTP status codes and JSON-RPC 2.0 error codes:

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid request format |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Permission denied |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error |
| -32600 | Invalid Request | Invalid JSON-RPC request |
| -32601 | Method not found | RPC method not found |
| -32602 | Invalid params | Invalid method parameters |
| -32603 | Internal error | Internal JSON-RPC error |

---

## Rate Limits

- **API Endpoints**: 10 requests/second per IP
- **WebSocket**: 5 connections/second per IP
- **RPC Methods**: 100 calls/minute per authenticated DID

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { ATPClient } from '@atp/client';

const client = new ATPClient('ws://localhost:8080/rpc');

// Register identity
const identity = await client.identity.register();

// Issue credential
const credential = await client.vc.issue({
  schemaId: 'weather-data-v1',
  subject: targetDid,
  claims: { temperature: 20 }
});

// Grant permission
await client.permission.grant({
  grantee: targetDid,
  scopes: ['read'],
  resource: 'weather:london'
});
```

### Python

```python
import asyncio
from atp_client import ATPClient

async def main():
    client = ATPClient('ws://localhost:8080/rpc')
    await client.connect()
    
    # Register identity
    identity = await client.identity.register()
    
    # Issue credential
    credential = await client.vc.issue(
        schema_id='weather-data-v1',
        subject=target_did,
        claims={'temperature': 20}
    )

asyncio.run(main())
```