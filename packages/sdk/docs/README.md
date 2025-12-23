# ATP™ SDK Documentation

Official TypeScript SDK for the Agent Trust Protocol™

## Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [API Reference](./api/README.md)
4. [Examples](../examples/README.md)
5. [Configuration](./guides/configuration.md)
6. [Authentication](./guides/authentication.md)
7. [Error Handling](./guides/error-handling.md)
8. [Best Practices](./guides/best-practices.md)
9. [Troubleshooting](./guides/troubleshooting.md)

## Quick Start

```bash
npm install @atp/sdk
```

```javascript
import { ATPClient, createQuickConfig } from '@atp/sdk';

// Initialize client
const config = createQuickConfig('http://localhost');
const client = new ATPClient(config);

// Test connectivity
const status = await client.testConnectivity();
console.log('Services available:', status);

// Use individual services
const identity = await client.identity.resolve('did:atp:testnet:example');
const credentials = await client.credentials.query({ issuer: 'did:atp:testnet:issuer' });

// Cleanup when done
client.cleanup();
```

## Installation

### NPM
```bash
npm install @atp/sdk
```

### Yarn
```bash
yarn add @atp/sdk
```

### PNPM
```bash
pnpm add @atp/sdk
```

## Basic Usage

### Initialize Client

```javascript
import { ATPClient, createQuickConfig } from '@atp/sdk';

// Quick configuration for local development
const config = createQuickConfig('http://localhost');

// Or custom configuration
const config = {
  baseUrl: 'https://your-atp-instance.com',
  timeout: 30000,
  retries: 3,
  auth: {
    did: 'your-did',
    privateKey: 'your-private-key'
  },
  services: {
    identity: 'https://identity.your-domain.com',
    credentials: 'https://credentials.your-domain.com',
    permissions: 'https://permissions.your-domain.com',
    audit: 'https://audit.your-domain.com',
    gateway: 'https://gateway.your-domain.com'
  }
};

const client = new ATPClient(config);
```

### Authentication

```javascript
// Using DID and private key
client.setAuthentication({
  did: 'did:atp:testnet:your-identifier',
  privateKey: 'your-private-key-hex'
});

// Using JWT token
client.setAuthentication({
  token: 'your-jwt-token'
});
```

### Service Clients

The ATP SDK provides dedicated clients for each service:

- **Identity Service**: `client.identity` - DID management, trust levels, MFA
- **Credentials Service**: `client.credentials` - Verifiable credentials and presentations
- **Permissions Service**: `client.permissions` - Access control and policy management
- **Audit Service**: `client.audit` - Audit logging and compliance reporting
- **Gateway Service**: `client.gateway` - Real-time events and service coordination

## Core Concepts

### Decentralized Identifiers (DIDs)

DIDs are globally unique identifiers that enable verifiable, self-sovereign digital identity.

```javascript
import { DIDUtils } from '@atp/sdk';

// Generate a new DID
const { did, document, keyPair } = await DIDUtils.generateDID({
  network: 'testnet',
  method: 'atp'
});

// Parse DID components
const parsed = DIDUtils.parseDID(did);
console.log(parsed); // { method: 'atp', network: 'testnet', identifier: '...' }
```

### Verifiable Credentials

Cryptographically secure, privacy-respecting credentials that can be verified independently.

```javascript
// Create credential schema
const schema = await client.credentials.createSchema({
  name: 'University Degree',
  schema: {
    type: 'object',
    properties: {
      degree: { type: 'string' },
      university: { type: 'string' },
      graduationDate: { type: 'string', format: 'date' }
    }
  }
});

// Issue credential
const credential = await client.credentials.issue({
  schemaId: schema.data.id,
  holder: 'did:atp:testnet:holder',
  claims: {
    degree: 'Bachelor of Science',
    university: 'ATP University',
    graduationDate: '2024-05-15'
  }
});
```

### Permissions and Access Control

Fine-grained access control with policy-based evaluation.

```javascript
// Create access policy
const policy = await client.permissions.createPolicy({
  name: 'Document Access Policy',
  rules: [{
    action: 'read',
    resource: 'document:*',
    effect: 'allow',
    conditions: [{
      attribute: 'user.department',
      operator: 'equals',
      value: 'engineering'
    }]
  }]
});

// Grant permission
const grant = await client.permissions.grant({
  grantee: 'did:atp:testnet:user',
  resource: 'document:quarterly-report',
  actions: ['read'],
  policyId: policy.data.id
});

// Evaluate access
const decision = await client.permissions.evaluate({
  subject: 'did:atp:testnet:user',
  action: 'read',
  resource: 'document:quarterly-report',
  context: { 'user.department': 'engineering' }
});
```

### Audit Logging

Immutable audit trails with blockchain anchoring for compliance.

```javascript
// Log audit event
const event = await client.audit.logEvent({
  source: 'my-application',
  action: 'document_accessed',
  resource: 'document:quarterly-report',
  actor: 'did:atp:testnet:user',
  details: {
    ipAddress: '192.168.1.100',
    userAgent: 'Browser/1.0'
  }
});

// Query audit trail
const events = await client.audit.queryEvents({
  actor: 'did:atp:testnet:user',
  startTime: '2024-06-01T00:00:00Z',
  endTime: '2024-06-30T23:59:59Z'
});
```

## Real-time Events

Subscribe to real-time events across the ATP network.

```javascript
// Connect to event stream
await client.gateway.connectEventStream({
  filters: {
    eventTypes: ['identity.login', 'permission.granted'],
    severities: ['medium', 'high', 'critical']
  },
  autoReconnect: true
});

// Handle events
client.gateway.on('identity.login', (event) => {
  console.log('User logged in:', event.data.actor);
});

client.gateway.on('permission.granted', (event) => {
  console.log('Permission granted:', event.data);
});
```

## Utilities

The SDK includes utility classes for common operations:

### Cryptographic Operations

```javascript
import { CryptoUtils } from '@atp/sdk';

// Generate key pair
const keyPair = await CryptoUtils.generateKeyPair();

// Sign data
const signature = await CryptoUtils.signData('message', privateKey);

// Verify signature
const isValid = await CryptoUtils.verifySignature('message', signature, publicKey);
```

### JWT Operations

```javascript
import { JWTUtils } from '@atp/sdk';

// Create DID-JWT
const token = await JWTUtils.createDIDJWT(
  { custom: 'claims' },
  privateKey,
  did,
  { expiresIn: '1h' }
);

// Verify JWT
const result = await JWTUtils.verifyDIDJWT(token, publicKey);
```

## Error Handling

The SDK provides structured error handling with specific error types:

```javascript
import { 
  ATPError, 
  ATPNetworkError, 
  ATPAuthenticationError,
  ATPAuthorizationError,
  ATPValidationError 
} from '@atp/sdk';

try {
  await client.identity.resolve('invalid-did');
} catch (error) {
  if (error instanceof ATPValidationError) {
    console.log('Invalid DID format:', error.message);
  } else if (error instanceof ATPNetworkError) {
    console.log('Network issue:', error.message);
  } else if (error instanceof ATPAuthenticationError) {
    console.log('Authentication failed:', error.message);
  }
}
```

## TypeScript Support

The SDK is written in TypeScript and provides comprehensive type definitions:

```typescript
import { ATPClient, ATPConfig, DIDDocument, VerifiableCredential } from '@atp/sdk';

const config: ATPConfig = {
  baseUrl: 'http://localhost',
  auth: {
    did: 'did:atp:testnet:example',
    privateKey: 'hex-private-key'
  }
};

const client = new ATPClient(config);

// Types are automatically inferred
const credential: VerifiableCredential = await client.credentials.issue({
  schemaId: 'schema-id',
  holder: 'holder-did',
  claims: { name: 'John Doe' }
});
```

## Environment Configuration

Configure the SDK using environment variables:

```bash
ATP_BASE_URL=https://atp.example.com
ATP_TIMEOUT=30000
ATP_RETRIES=3
ATP_DEBUG=true
```

## Next Steps

- [API Reference](./api/README.md) - Detailed API documentation
- [Examples](../examples/README.md) - Comprehensive examples
- [Configuration Guide](./guides/configuration.md) - Advanced configuration
- [Best Practices](./guides/best-practices.md) - Production guidelines
- [Troubleshooting](./guides/troubleshooting.md) - Common issues and solutions

## Support

- 📚 Documentation: [https://docs.atp.protocol](https://docs.atp.protocol)
- 🐛 Issues: [GitHub Issues](https://github.com/atp/sdk/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/atp/sdk/discussions)
- 📧 Email: support@atp.protocol