# @atp/sdk - Agent Trust Protocol SDK

> Official TypeScript SDK for Agent Trust Protocol™ - Build quantum-safe AI agents in 3 lines of code!

[![npm version](https://badge.fury.io/js/@atp%2Fsdk.svg)](https://badge.fury.io/js/@atp%2Fsdk)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## 🚀 Quick Start (3 Lines!)

```bash
npm install @atp/sdk
```

```typescript
import { Agent } from '@atp/sdk';

const agent = await Agent.create('MyBot');                            // Line 1: Create quantum-safe agent
await agent.send('did:atp:other-agent', 'Hello, quantum world!');    // Line 2: Send secure message
console.log(`Trust: ${await agent.getTrustScore('did:atp:other')}`); // Line 3: Check trust score
```

That's it! You now have a quantum-safe AI agent with decentralized identity, secure messaging, and trust scoring.

## 🛠️ Prerequisites

Currently, ATP services need to be running locally. Hosted services coming soon!

```bash
# Clone and start ATP services
git clone https://github.com/agent-trust-protocol/core.git
cd agent-trust-protocol
./start-services.sh
```

## 📖 Full SDK Documentation

For advanced usage, see the complete API documentation below...

## 📖 Documentation

- **[Complete Documentation](./docs/README.md)** - Comprehensive guides and API reference
- **[API Reference](./docs/api/README.md)** - Detailed API documentation
- **[Examples](./examples/README.md)** - Practical examples and use cases
- **[Configuration Guide](./docs/guides/configuration.md)** - Advanced configuration options
- **[Authentication Guide](./docs/guides/authentication.md)** - Security and authentication patterns
- **[Best Practices](./docs/guides/best-practices.md)** - Production-ready guidelines
- **[Troubleshooting](./docs/guides/troubleshooting.md)** - Common issues and solutions

## ✨ Features

### 🔐 **Identity Management**
- Generate and manage Decentralized Identifiers (DIDs)
- Register and resolve identities on the ATP network
- Multi-factor authentication (TOTP, SMS, Email)
- Trust level management and verification
- Cryptographic key rotation and recovery

### 📜 **Verifiable Credentials**
- Create and manage credential schemas
- Issue tamper-proof verifiable credentials
- Generate and verify presentations
- Credential lifecycle management (suspend, revoke, reactivate)
- Zero-knowledge proof support

### 🛡️ **Permissions & Access Control**
- Policy-based access control (PBAC)
- Fine-grained permission management
- Capability token delegation
- Real-time access decision evaluation
- Comprehensive audit trails

### 📋 **Audit & Compliance**
- Immutable audit logging
- Blockchain anchoring for integrity
- Advanced query and search capabilities
- Compliance reporting and data export
- Real-time monitoring and alerts

### ⚡ **Real-time Features**
- WebSocket event streaming
- Live security monitoring
- Service health monitoring
- Connection management with auto-reconnection
- Event filtering and processing

## 🏗️ Architecture

The ATP™ SDK provides a unified interface to multiple microservices:

```
┌─────────────────┐    ┌──────────────────────────────────────┐
│   Your App      │    │            ATP™ SDK                  │
│                 │    │                                      │
│  ┌───────────┐  │    │  ┌─────────────────────────────────┐ │
│  │  Business │  │◄──►│  │        ATPClient                │ │
│  │   Logic   │  │    │  │                                 │ │
│  └───────────┘  │    │  │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │ │
└─────────────────┘    │  │ │ ID  │ │Creds│ │Perms│ │Audit│ │ │
                       │  │ └─────┘ └─────┘ └─────┘ └─────┘ │ │
                       │  └─────────────────────────────────┘ │
                       └──────────────────────────────────────┘
                                           │
                       ┌───────────────────┼───────────────────┐
                       │                   │                   │
               ┌───────▼────────┐ ┌────────▼────────┐ ┌───────▼────────┐
               │ Identity Service│ │Credentials Service│ │  Audit Service │
               │    (Port 3001)  │ │   (Port 3002)   │ │   (Port 3004)  │
               └─────────────────┘ └─────────────────┘ └────────────────┘
                       │                   │                   │
               ┌───────▼────────┐ ┌────────▼────────┐ ┌───────▼────────┐
               │Permissions Svc  │ │  Gateway Service│ │   Your Data    │
               │   (Port 3003)   │ │   (Port 3000)   │ │     Store      │
               └─────────────────┘ └─────────────────┘ └────────────────┘
```

## 🔧 Installation & Setup

### Prerequisites

- Node.js 18+ with ES modules support
- TypeScript 4.5+ (for TypeScript projects)
- Access to ATP™ services (local or hosted)

### Installation

```bash
# Using npm
npm install @atp/sdk

# Using yarn
yarn add @atp/sdk

# Using pnpm
pnpm add @atp/sdk
```

### Basic Configuration

```javascript
import { ATPClient, createQuickConfig } from '@atp/sdk';

// Development (local services)
const config = createQuickConfig('http://localhost');

// Production (hosted services)
const config = {
  baseUrl: 'https://api.atp.example.com',
  timeout: 30000,
  retries: 3,
  auth: {
    did: process.env.ATP_DID,
    privateKey: process.env.ATP_PRIVATE_KEY
  },
  services: {
    identity: 'https://identity.atp.example.com',
    credentials: 'https://credentials.atp.example.com',
    permissions: 'https://permissions.atp.example.com',
    audit: 'https://audit.atp.example.com',
    gateway: 'https://gateway.atp.example.com'
  }
};

const client = new ATPClient(config);
```

## 📚 Usage Examples

### Identity Management

```javascript
import { DIDUtils, CryptoUtils } from '@atp/sdk';

// Generate new identity
const { did, document, keyPair } = await DIDUtils.generateDID({
  network: 'testnet',
  method: 'atp'
});

// Authenticate client
client.setAuthentication({
  did: did,
  privateKey: keyPair.privateKey
});

// Register identity
const registration = await client.identity.register({
  did: did,
  document: document,
  metadata: {
    name: 'Alice Smith',
    organization: 'ACME Corp'
  }
});

// Set up multi-factor authentication
const mfaSetup = await client.identity.setupMFA({
  method: 'totp',
  label: 'My ATP Account'
});

console.log('MFA QR Code:', mfaSetup.data.qrCodeUrl);
```

### Verifiable Credentials

```javascript
// Create credential schema
const schema = await client.credentials.createSchema({
  name: 'University Degree',
  description: 'Academic degree certificate',
  version: '1.0.0',
  schema: {
    type: 'object',
    properties: {
      degree: { type: 'string' },
      university: { type: 'string' },
      graduationDate: { type: 'string', format: 'date' },
      gpa: { type: 'number', minimum: 0, maximum: 4.0 }
    },
    required: ['degree', 'university', 'graduationDate']
  }
});

// Issue credential
const credential = await client.credentials.issue({
  schemaId: schema.data.id,
  holder: 'did:atp:testnet:student123',
  claims: {
    degree: 'Bachelor of Science',
    university: 'ATP University',
    graduationDate: '2024-05-15',
    gpa: 3.75
  }
});

// Create presentation
const presentation = await client.credentials.createPresentation({
  credentialIds: [credential.data.id],
  audience: 'did:atp:testnet:employer456',
  challenge: 'job-application-2024',
  purpose: 'Employment verification'
});

// Verify presentation
const verification = await client.credentials.verifyPresentation({
  presentationId: presentation.data.id,
  expectedChallenge: 'job-application-2024',
  expectedAudience: 'did:atp:testnet:employer456'
});

console.log('Presentation valid:', verification.data.valid);
```

### Access Control

```javascript
// Create access policy
const policy = await client.permissions.createPolicy({
  name: 'Document Access Policy',
  description: 'Controls access to sensitive documents',
  version: '1.0.0',
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
  grantee: 'did:atp:testnet:user123',
  resource: 'document:quarterly-report',
  actions: ['read'],
  policyId: policy.data.id,
  conditions: {
    'user.department': 'engineering',
    'user.clearanceLevel': 'confidential'
  }
});

// Evaluate access
const decision = await client.permissions.evaluate({
  subject: 'did:atp:testnet:user123',
  action: 'read',
  resource: 'document:quarterly-report',
  context: {
    'user.department': 'engineering',
    'user.clearanceLevel': 'confidential',
    'request.time': new Date().toISOString()
  }
});

console.log('Access granted:', decision.data.decision === 'allow');
```

### Audit Logging

```javascript
// Log audit event
const auditEvent = await client.audit.logEvent({
  source: 'document-service',
  action: 'document_accessed',
  resource: 'document:quarterly-report',
  actor: 'did:atp:testnet:user123',
  details: {
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
    accessMethod: 'web_interface'
  }
});

// Query audit trail
const auditTrail = await client.audit.queryEvents({
  resource: 'document:quarterly-report',
  startTime: '2024-06-01T00:00:00Z',
  endTime: '2024-06-30T23:59:59Z'
});

// Generate compliance report
const report = await client.audit.generateComplianceReport({
  startDate: '2024-06-01',
  endDate: '2024-06-30',
  reportType: 'access_control',
  format: 'pdf'
});

console.log('Report URL:', report.data.downloadUrl);
```

### Real-time Monitoring

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
  console.log('Permission granted:', {
    grantee: event.data.grantee,
    resource: event.data.resource
  });
});

client.gateway.on('error', (error) => {
  console.error('Stream error:', error.message);
});

// Monitor service health
const health = await client.gateway.getStatus();
console.log('Gateway status:', health.data.status);
```

## 🛠️ Development

### Environment Setup

```bash
# Clone the repository
git clone https://github.com/atp/sdk.git
cd sdk

# Install dependencies
npm install

# Run tests
npm test

# Build the SDK
npm run build

# Run examples
npm run examples
```

### Running Examples

```bash
# Run all examples
node examples/index.js --all

# Run specific example
node examples/index.js 1  # Basic setup
node examples/index.js 2  # Identity management
node examples/index.js 3  # Verifiable credentials
```

### TypeScript Support

The SDK is written in TypeScript and provides comprehensive type definitions:

```typescript
import { ATPClient, ATPConfig, VerifiableCredential } from '@atp/sdk';

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

## 🧪 Testing

The SDK includes comprehensive tests and testing utilities:

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm run test -- --grep "Identity"
```

### Testing Your Application

```javascript
import { ATPClient } from '@atp/sdk';
import { jest } from '@jest/globals';

// Mock the SDK for testing
jest.mock('@atp/sdk');

describe('My Application', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      identity: {
        resolve: jest.fn(),
        register: jest.fn()
      }
    };
    
    ATPClient.mockImplementation(() => mockClient);
  });

  test('should handle identity resolution', async () => {
    mockClient.identity.resolve.mockResolvedValue({
      data: { did: 'did:atp:test:123', status: 'active' }
    });

    // Test your application logic
  });
});
```

## 🚀 Production Deployment

### Security Checklist

- [ ] Use HTTPS/TLS for all communications
- [ ] Store private keys securely (HSM, KMS, etc.)
- [ ] Implement proper key rotation
- [ ] Enable audit logging
- [ ] Set up monitoring and alerts
- [ ] Configure rate limiting
- [ ] Use environment-specific configurations
- [ ] Implement circuit breakers and retries
- [ ] Test disaster recovery procedures

### Performance Optimization

```javascript
// Connection pooling
const config = {
  connectionPool: {
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 60000
  }
};

// Caching
const cache = new LRUCache({ max: 1000, ttl: 300000 });

async function cachedResolve(did) {
  const cached = cache.get(did);
  if (cached) return cached;

  const result = await client.identity.resolve(did);
  cache.set(did, result);
  return result;
}

// Batch operations
const results = await Promise.allSettled(
  dids.map(did => client.identity.resolve(did))
);
```

## 📊 Monitoring

### Health Checks

```javascript
// Implement health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = await client.testConnectivity();
    
    res.status(health.overall ? 200 : 503).json({
      status: health.overall ? 'healthy' : 'degraded',
      services: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

### Metrics

```javascript
// Collect SDK metrics
const metrics = {
  operations: {
    total: 0,
    successful: 0,
    failed: 0
  },
  performance: {
    averageLatency: 0,
    p95Latency: 0
  }
};

// Instrument operations
async function instrumentedOperation(operation) {
  const start = Date.now();
  metrics.operations.total++;
  
  try {
    const result = await operation();
    metrics.operations.successful++;
    return result;
  } catch (error) {
    metrics.operations.failed++;
    throw error;
  } finally {
    const latency = Date.now() - start;
    updateLatencyMetrics(latency);
  }
}
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards

- Follow TypeScript best practices
- Maintain 100% test coverage for new code
- Use conventional commit messages
- Update documentation for API changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [https://docs.atp.protocol](https://docs.atp.protocol)
- **GitHub Issues**: [Report bugs and request features](https://github.com/atp/sdk/issues)
- **Discord**: [Join our community](https://discord.gg/atp)
- **Email**: support@atp.protocol
- **Enterprise Support**: enterprise@atp.protocol

## 🔗 Related Projects

- **[ATP™ Core Services](https://github.com/atp/core)** - Core ATP protocol implementation
- **[ATP™ CLI](https://github.com/atp/cli)** - Command-line interface
- **[ATP™ Examples](https://github.com/atp/examples)** - Real-world examples and demos
- **[ATP™ Specification](https://github.com/atp/spec)** - Protocol specification

## 📈 Roadmap

- [ ] **v1.1.0** - WebAssembly support for browser environments
- [ ] **v1.2.0** - GraphQL API support
- [ ] **v1.3.0** - Advanced zero-knowledge proof features
- [ ] **v2.0.0** - ATP Protocol v2 compatibility

---

**Agent Trust Protocol™** - Building the foundation for trustworthy AI and secure digital interactions.

© 2024 ATP Foundation. All rights reserved.