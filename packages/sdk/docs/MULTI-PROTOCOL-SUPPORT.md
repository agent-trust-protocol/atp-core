# Multi-Protocol Support for ATP SDK

## Overview

ATP SDK now supports multiple AI agent protocols with unified security, monitoring, and audit capabilities. This enables ATP to act as the universal security layer for all major AI agent frameworks.

## Supported Protocols

### 1. **MCP** (Model Context Protocol)
- **Vendor**: Anthropic
- **Purpose**: Programmable context management for AI agents
- **Key Features**:
  - Context management
  - Tool protocols
  - Retrieval patterns
  - App integrations

### 2. **Swarm** (OpenAI Swarm) - Coming Soon
- **Vendor**: OpenAI
- **Purpose**: Multi-agent orchestration
- **Key Features**:
  - Agent handoffs
  - Routine management
  - Context preservation
  - Stateful conversations

### 3. **ADK** (Agent Development Kit) - Coming Soon
- **Vendor**: Google
- **Purpose**: Enterprise agent development
- **Key Features**:
  - Role-based access control
  - Built-in evaluation
  - Deployment management
  - Agent collaboration

### 4. **A2A** (Agent2Agent Protocol) - Coming Soon
- **Vendor**: Community/Open Standard
- **Purpose**: Vendor-neutral agent communication
- **Key Features**:
  - Agent discovery
  - Standardized messaging
  - Capability advertisement
  - Cross-platform bridges

## Architecture

### Protocol Abstraction Layer

All protocol adapters implement a common `ProtocolAdapter` interface:

```typescript
interface ProtocolAdapter {
  // Identify protocol capabilities
  identify(): ProtocolInfo;

  // Initialize adapter
  initialize(config: ProtocolAdapterConfig): Promise<void>;

  // Monitor agent events
  monitor(agent: Agent): Observable<AgentEvent>;

  // Apply ATP security
  secure(message: Message): Promise<SecuredMessage>;

  // Verify secured messages
  verify(message: SecuredMessage): Promise<VerificationResult>;

  // Create audit trail
  audit(event: AgentEvent): Promise<ProtocolAuditEntry>;

  // Cleanup resources
  cleanup(): Promise<void>;
}
```

### Universal Monitoring System

The `UniversalMonitor` class provides unified monitoring across all protocols:

- **Automatic Protocol Detection**: Detects which protocol an agent uses
- **Security Layer**: Adds quantum-safe signatures and encryption
- **Trust Scoring**: Calculates and tracks agent trust levels
- **Event Filtering**: Filters events based on custom criteria
- **Audit Trail**: Records all events in tamper-proof audit log

## Quick Start

### 1. Basic Protocol Detection

```typescript
import { ProtocolDetector } from '@atp/sdk';

const agent = {
  did: 'did:atp:my-agent',
  context: {},
  tools: {},
  metadata: { protocol: 'mcp' }
};

const detection = await ProtocolDetector.detect(agent);
console.log(`Protocol: ${detection.protocol}`);
console.log(`Confidence: ${detection.confidence * 100}%`);
```

### 2. Monitor an MCP Agent

```typescript
import {
  ATPClient,
  createQuickConfig,
  MCPAdapter,
  UniversalMonitor,
  Protocol
} from '@atp/sdk';

// Initialize ATP client
const config = createQuickConfig('http://localhost:3000', {
  auth: {
    did: 'did:atp:developer',
    privateKey: process.env.ATP_PRIVATE_KEY
  }
});

// Create and initialize MCP adapter
const mcpAdapter = new MCPAdapter();
await mcpAdapter.initialize({
  protocol: Protocol.MCP,
  atpConfig: config,
  enableMonitoring: true,
  enableAudit: true,
  securityLevel: 'quantum-safe'
});

// Create universal monitor
const monitor = new UniversalMonitor({
  minTrustLevel: 50,
  enableSigning: true,
  enableAudit: true
});

// Register adapter
monitor.registerAdapter(Protocol.MCP, mcpAdapter);

// Monitor agent
const agent = {
  did: 'did:atp:mcp-assistant',
  protocol: Protocol.MCP,
  name: 'MCP Assistant',
  capabilities: ['context', 'tools', 'retrieval']
};

const stream = await monitor.monitor(agent);

// Subscribe to events
stream.subscribe({
  next: (event) => {
    console.log('Event:', event.type);
    console.log('Trust Score:', event.trustScore);
  },
  error: (error) => console.error('Error:', error),
  complete: () => console.log('Complete')
});
```

### 3. Secure Message Exchange

```typescript
import { MCPAdapter, Protocol } from '@atp/sdk';

const adapter = new MCPAdapter();
await adapter.initialize({
  protocol: Protocol.MCP,
  atpConfig: { baseUrl: 'http://localhost:3000' },
  securityLevel: 'quantum-safe'
});

// Create message
const message = {
  id: 'msg_123',
  protocol: Protocol.MCP,
  sender: 'did:atp:agent-1',
  recipient: 'did:atp:agent-2',
  payload: { action: 'update-context' }
};

// Apply ATP security layer
const secured = await adapter.secure(message);
console.log('Signature:', secured.signature);
console.log('Trust Level:', secured.trustLevel);

// Verify message
const verification = await adapter.verify(secured);
console.log('Verified:', verification.verified);
console.log('Trust Score:', verification.trustScore);
```

### 4. Event Filtering

```typescript
import { UniversalMonitor } from '@atp/sdk';

const monitor = new UniversalMonitor({
  minTrustLevel: 70,
  filters: [
    {
      field: 'type',
      operator: 'eq',
      value: 'mcp.context.update'
    },
    {
      field: 'trustScore',
      operator: 'gt',
      value: 80
    }
  ]
});

// Only events matching ALL filters will be emitted
```

## Protocol Detection

The SDK automatically detects which protocol an agent uses based on:

1. **Explicit Metadata**: `agent.metadata.protocol`, `agent.type`, etc.
2. **Structural Signatures**: Presence of protocol-specific methods/properties
3. **Behavioral Patterns**: How the agent behaves and what capabilities it exposes

Detection confidence ranges from 0-100%:
- **90-100%**: Explicit protocol markers found
- **70-89%**: Strong structural match
- **50-69%**: Moderate match with some protocol features
- **<50%**: Weak or uncertain match

## Security Features

### Quantum-Safe Security

All protocols support quantum-safe security measures:
- **Post-quantum signatures**: Resistant to quantum attacks
- **Lattice-based cryptography**: Future-proof encryption
- **Quantum key distribution**: Secure key exchange

### Trust Scoring

Each event and message receives a trust score (0-100) based on:
- Agent reputation
- Historical behavior
- Credential verification
- Network consensus

### Audit Trail

All events are recorded in an immutable audit trail with:
- **Cryptographic hashing**: Chain of events
- **Blockchain anchoring**: Optional verification
- **IPFS storage**: Distributed permanence
- **Tamper detection**: Automatic integrity checks

## API Reference

### ProtocolDetector

```typescript
class ProtocolDetector {
  // Detect protocol from agent
  static detect(agent: any): Promise<DetectionResult>

  // Batch detect multiple agents
  static detectBatch(agents: any[]): Promise<Map<any, DetectionResult>>

  // List supported protocols
  static getSupportedProtocols(): Protocol[]

  // Check protocol support
  static isProtocolSupported(protocol: Protocol): boolean
}
```

### UniversalMonitor

```typescript
class UniversalMonitor {
  constructor(config: UniversalMonitorConfig)

  // Register protocol adapter
  registerAdapter(protocol: Protocol, adapter: ProtocolAdapter): void

  // Monitor agent
  monitor(agent: Agent): Promise<MonitoringStream>

  // Stop monitoring
  stopMonitoring(agentDid: string): void

  // Get active monitors
  getActiveMonitors(): Map<string, MonitoringStream>

  // Cleanup
  cleanup(): Promise<void>
}
```

### SecurityEnforcer

```typescript
class SecurityEnforcer {
  constructor(config: SecurityConfig)

  // Enforce policy on event
  enforcePolicy(event: AgentEvent): PolicyResult

  // Update configuration
  updateConfig(updates: Partial<SecurityConfig>): void
}
```

## Examples

See `examples/09-multi-protocol-support.js` for comprehensive examples including:

1. Protocol detection
2. Agent monitoring
3. Secure message exchange
4. Multi-protocol detection
5. Protocol information
6. Event filtering

Run examples:
```bash
# Run specific example
EXAMPLE=1 node examples/09-multi-protocol-support.js

# Run all examples
EXAMPLE=all node examples/09-multi-protocol-support.js
```

## Testing

Run protocol tests:
```bash
npm test -- protocols
```

Test coverage includes:
- Protocol detection accuracy
- Adapter initialization
- Event monitoring
- Message security
- Audit trail creation
- Universal monitoring
- Event filtering

## Roadmap

### Phase 1: Foundation ✅
- [x] Protocol abstraction layer
- [x] Universal monitoring interface
- [x] Protocol detection system
- [x] MCP adapter implementation
- [x] Testing framework

### Phase 2: OpenAI Swarm (Weeks 3-4)
- [ ] Swarm adapter implementation
- [ ] Handoff monitoring
- [ ] Context tracking
- [ ] Routine security

### Phase 3: Google ADK (Weeks 5-6)
- [ ] ADK adapter implementation
- [ ] Role enforcement
- [ ] Evaluation security
- [ ] Deployment verification

### Phase 4: A2A Protocol (Weeks 7-8)
- [ ] A2A adapter implementation
- [ ] Discovery security
- [ ] Message bridging
- [ ] Capability validation

### Phase 5: Enhanced Features (Weeks 9-10)
- [ ] Cross-protocol bridging
- [ ] Advanced trust algorithms
- [ ] Performance optimization
- [ ] Enterprise features

## Contributing

To add support for a new protocol:

1. **Create adapter directory**: `src/protocols/<protocol-name>/`
2. **Implement adapter**: Extend `BaseProtocolAdapter`
3. **Add detection logic**: Update `ProtocolDetector`
4. **Write tests**: Add to `__tests__/protocols/`
5. **Document**: Update this file and add examples
6. **Export**: Add to `src/protocols/index.ts`

Example:
```typescript
import { BaseProtocolAdapter } from '../base/adapter.js';
import { Protocol, ProtocolInfo, Agent, Observable, AgentEvent } from '../base/types.js';

export class MyProtocolAdapter extends BaseProtocolAdapter {
  identify(): ProtocolInfo {
    return {
      protocol: Protocol.MY_PROTOCOL,
      version: '1.0.0',
      name: 'My Protocol',
      description: 'Description of my protocol',
      capabilities: ['capability1', 'capability2']
    };
  }

  monitor(agent: Agent): Observable<AgentEvent> {
    // Implementation
  }

  // Override other methods as needed
}
```

## Support

- **Documentation**: https://docs.atp.protocol/multi-protocol
- **Examples**: `/packages/sdk/examples/09-multi-protocol-support.js`
- **Issues**: https://github.com/atp/sdk/issues
- **Discussions**: https://github.com/atp/sdk/discussions

## License

MIT - See LICENSE file for details
