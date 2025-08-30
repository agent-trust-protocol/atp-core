# ATP™ SDK Examples

This directory contains comprehensive examples demonstrating the capabilities of the Agent Trust Protocol™ SDK.

## Quick Start

Run all examples:
```bash
node examples/index.js --all
```

Run a specific example:
```bash
node examples/index.js 1  # Basic setup
node examples/index.js 2  # Identity management
# ... etc
```

## Examples Overview

### 1. Basic Setup (`01-basic-setup.js`)
**Demonstrates:** SDK initialization and connectivity testing
- Basic client configuration
- Service connectivity testing
- Error handling basics

**Key concepts:**
- `ATPClient` initialization
- `createQuickConfig()` helper
- Service health checks

### 2. Identity Management (`02-identity-management.js`) 
**Demonstrates:** DID creation, registration, and MFA setup
- Generate new DIDs and key pairs
- Register identities with the ATP network
- Set up multi-factor authentication
- Manage trust levels and verification

**Key concepts:**
- `DIDUtils.generateDID()`
- Identity registration and resolution
- MFA setup and verification
- Trust score management

### 3. Verifiable Credentials (`03-verifiable-credentials.js`)
**Demonstrates:** Credential issuance, verification, and presentations
- Create credential schemas
- Issue verifiable credentials
- Create and verify presentations
- Credential lifecycle management

**Key concepts:**
- Schema creation and management
- Credential issuance workflow
- Presentation creation and verification
- Credential revocation and status

### 4. Permissions & Access Control (`04-permissions-and-access-control.js`)
**Demonstrates:** Policy management and access control
- Create permission policies
- Grant and revoke permissions
- Evaluate access decisions
- Capability token delegation

**Key concepts:**
- Policy-based access control
- Permission grants and evaluation
- Capability tokens for delegation
- Audit trails for permissions

### 5. Audit Logging (`05-audit-logging.js`)
**Demonstrates:** Comprehensive audit trail management
- Log audit events across services
- Query and search audit trails
- Verify audit chain integrity
- Generate compliance reports

**Key concepts:**
- Structured audit event logging
- Advanced audit queries and search
- Blockchain integration for immutability
- Compliance reporting and data export

### 6. Real-time Monitoring (`06-real-time-monitoring.js`)
**Demonstrates:** WebSocket events and live monitoring
- Connect to real-time event streams
- Handle different event types
- Monitor security events and alerts
- WebSocket connection management

**Key concepts:**
- WebSocket event streaming
- Event filtering and processing
- Real-time security monitoring
- Connection management and reconnection

### 7. Advanced Use Cases (`07-advanced-use-cases.js`)
**Demonstrates:** Complex workflows and patterns
- Multi-party credential workflows
- Complex permission delegation chains
- Cross-service orchestration
- Error handling and retry patterns
- Batch operations

**Key concepts:**
- Multi-party trust relationships
- Atomic transactions across services
- Circuit breaker and retry patterns
- Batch processing and error recovery

## Prerequisites

1. **ATP™ Services Running**: Ensure all ATP services are running:
   - Identity Service (port 3001)
   - Credentials Service (port 3002)
   - Permissions Service (port 3003)
   - Audit Service (port 3004)
   - Gateway Service (port 3000)

2. **Node.js Environment**: Node.js 18+ with ES modules support

3. **Network Access**: Local network access to ATP services

## Configuration

The examples use `createQuickConfig('http://localhost')` for local development. For production environments, update the base URL and add authentication:

```javascript
const config = createQuickConfig('https://your-atp-instance.com', {
  timeout: 30000,
  auth: {
    did: 'your-did',
    privateKey: 'your-private-key'
  }
});
```

## Error Handling

The examples demonstrate various error handling patterns:

- **Basic try/catch**: Simple error handling for individual operations
- **Retry patterns**: Exponential backoff for transient failures  
- **Circuit breakers**: Fail-fast for cascading failures
- **Graceful degradation**: Continue operation when non-critical services fail

## Security Considerations

These examples are for demonstration purposes. In production:

1. **Never hardcode private keys** - use secure key management
2. **Validate all inputs** - implement proper input validation
3. **Use HTTPS/TLS** - ensure encrypted communication
4. **Implement rate limiting** - prevent abuse and DoS attacks
5. **Monitor and audit** - track all access and operations

## Extending Examples

To create custom examples:

1. Follow the existing pattern structure
2. Import required SDK components
3. Implement proper error handling
4. Add comprehensive logging
5. Clean up resources in finally blocks

```javascript
import { ATPClient, createQuickConfig } from '@atp/sdk';

async function myCustomExample() {
  const client = new ATPClient(createQuickConfig('http://localhost'));
  
  try {
    // Your example code here
  } catch (error) {
    console.error('Example failed:', error.message);
  } finally {
    client.cleanup();
  }
}
```

## Troubleshooting

**Common Issues:**

1. **Connection Refused**: Ensure ATP services are running
2. **Authentication Errors**: Check DID and private key configuration
3. **Permission Denied**: Verify proper permissions and trust levels
4. **Timeout Errors**: Increase timeout values or check network connectivity

**Debug Mode:**

Enable debug logging by setting the debug flag:

```javascript
const config = createQuickConfig('http://localhost', {
  debug: true
});
```

## Support

For questions or issues with the examples:
- Check the main SDK documentation
- Review the troubleshooting section
- Submit issues to the ATP™ repository

## License

These examples are part of the ATP™ SDK and are subject to the same license terms.