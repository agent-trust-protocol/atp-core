# 🛡️ Agent Trust Protocol™ - API Reference

## Overview

The Agent Trust Protocol™ API provides quantum-safe security for AI agent interactions through a WebSocket-based MCP (Model Context Protocol) implementation. This reference documents all available endpoints, methods, and integration patterns for enterprise developers.

**Base URL:** `ws://localhost:3008` (Development) | `wss://api.atp.dev` (Production)  
**Protocol:** WebSocket with JSON-RPC 2.0  
**Authentication:** DID-based quantum-safe signatures  
**API Version:** 1.0.0

---

## Table of Contents

1. [Authentication](#authentication)
2. [Connection Management](#connection-management)
3. [Core API Methods](#core-api-methods)
4. [Tool Management](#tool-management)
5. [Trust Level Operations](#trust-level-operations)
6. [Security Features](#security-features)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [SDK Integration](#sdk-integration)
10. [Code Examples](#code-examples)

---

## Authentication

### DID-Based Authentication

All connections require DID (Decentralized Identifier) based authentication with quantum-safe signatures.

**Required Headers:**
```javascript
{
  "x-atp-did": "did:atp:your-agent-identifier",
  "x-atp-trust-level": "basic|verified|enterprise",
  "x-atp-auth-method": "hybrid-signature",
  "x-atp-quantum-signature": "enabled",
  "x-atp-timestamp": "2025-07-05T15:48:34.516Z",
  "x-atp-signature": "base64-encoded-hybrid-signature"
}
```

**Signature Generation:**
```javascript
// Generate hybrid signature (Ed25519 + Dilithium)
const message = `${method}:${timestamp}:${body}`;
const ed25519Signature = await signEd25519(message, privateKey);
const dilithiumSignature = await signDilithium(message, dilithiumKey);
const hybridSignature = combineSignatures(ed25519Signature, dilithiumSignature);
```

### Trust Levels

| Level | Rate Limit | Tool Access | Description |
|-------|------------|-------------|-------------|
| `basic` | 60/min | Basic tools | Standard AI agents |
| `verified` | 120/min | Business tools | Authenticated enterprise agents |
| `enterprise` | 300/min | All tools | Mission-critical agents |

---

## Connection Management

### WebSocket Connection

**Connection URL:**
```
ws://localhost:3008
```

**Connection Example:**
```javascript
const ws = new WebSocket('ws://localhost:3008', {
  headers: {
    'x-atp-did': 'did:atp:claude-client',
    'x-atp-trust-level': 'verified',
    'x-atp-auth-method': 'hybrid-signature',
    'x-atp-quantum-signature': 'enabled'
  }
});
```

### Health Check

**HTTP Endpoint:**
```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "ATP Quantum-Safe MCP Server",
  "version": "1.0.0",
  "timestamp": "2025-07-05T15:48:34.516Z",
  "connections": 42,
  "quantumSafe": true
}
```

---

## Core API Methods

### Initialize Session

Establish an MCP session with the quantum-safe server.

**Method:** `initialize`

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": "init-001",
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": { "listChanged": true },
      "resources": { "subscribe": false },
      "prompts": { "listChanged": false }
    },
    "clientInfo": {
      "name": "Claude Enterprise Agent",
      "version": "1.0.0"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": "init-001",
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": { "listChanged": true },
      "resources": { "subscribe": false },
      "prompts": { "listChanged": false },
      "logging": { "level": "info" }
    },
    "serverInfo": {
      "name": "ATP Quantum-Safe MCP Server",
      "version": "1.0.0",
      "protocol": "quantum-safe-mcp"
    },
    "atpInfo": {
      "serverDID": "did:atp:quantum-safe-server-uuid",
      "quantumSafe": true,
      "cryptography": "Ed25519 + Dilithium",
      "trustLevels": ["basic", "verified", "enterprise"]
    }
  }
}
```

---

## Tool Management

### List Available Tools

Get all tools available for the current trust level.

**Method:** `tools/list`

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": "tools-001",
  "method": "tools/list"
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": "tools-001",
  "result": {
    "tools": [
      {
        "name": "weather_info",
        "description": "Get current weather information",
        "atpConfig": {
          "trustLevelRequired": "basic",
          "capabilities": ["weather-current"],
          "rateLimits": { "requestsPerMinute": 60 },
          "quantumSafeVerified": true
        }
      },
      {
        "name": "atp_identity_lookup",
        "description": "Look up ATP identity information",
        "atpConfig": {
          "trustLevelRequired": "verified",
          "capabilities": ["identity-lookup"],
          "rateLimits": { "requestsPerMinute": 30 },
          "quantumSafeVerified": true
        }
      }
    ]
  }
}
```

### Call Tool

Execute a tool with quantum-safe verification.

**Method:** `tools/call`

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": "call-001",
  "method": "tools/call",
  "params": {
    "name": "weather_info",
    "arguments": {
      "location": "San Francisco",
      "units": "celsius"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": "call-001",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"location\": \"San Francisco\",\n  \"temperature\": 18,\n  \"units\": \"celsius\",\n  \"condition\": \"Partly Cloudy\",\n  \"quantumSafeVerified\": true\n}"
      }
    ],
    "atpMetadata": {
      "quantumSafeVerified": true,
      "trustLevel": "verified",
      "executedAt": "2025-07-05T15:48:34.516Z",
      "signatureValid": true,
      "performanceMs": 2
    }
  }
}
```

---

## Trust Level Operations

### Get Current Trust Level

**Method:** `atp/trust/current`

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": "trust-001",
  "method": "atp/trust/current"
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": "trust-001",
  "result": {
    "trustLevel": "verified",
    "trustScore": 850,
    "rateLimits": {
      "requestsPerMinute": 120,
      "currentUsage": 15,
      "resetTime": "2025-07-05T16:00:00.000Z"
    },
    "capabilities": [
      "weather-current",
      "identity-lookup",
      "basic-search"
    ],
    "quantumSafeStatus": {
      "enabled": true,
      "signatureVerified": true,
      "lastVerification": "2025-07-05T15:48:34.516Z"
    }
  }
}
```

### Request Trust Level Upgrade

**Method:** `atp/trust/upgrade`

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": "upgrade-001",
  "method": "atp/trust/upgrade",
  "params": {
    "requestedLevel": "enterprise",
    "justification": "Mission-critical financial analysis agent",
    "credentials": {
      "certificate": "base64-encoded-cert",
      "attestation": "base64-encoded-attestation"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": "upgrade-001",
  "result": {
    "status": "pending",
    "requestId": "req_upgrade_123456",
    "estimatedProcessingTime": "24 hours",
    "requirements": [
      "Enterprise certificate validation",
      "Security team approval",
      "Compliance verification"
    ]
  }
}
```

---

## Security Features

### Quantum-Safe Signature Verification

**Method:** `atp/security/verify`

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": "verify-001",
  "method": "atp/security/verify",
  "params": {
    "message": "data-to-verify",
    "signature": "base64-hybrid-signature",
    "publicKey": {
      "ed25519": "base64-ed25519-pubkey",
      "dilithium": "base64-dilithium-pubkey"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": "verify-001",
  "result": {
    "verified": true,
    "algorithms": {
      "ed25519": {
        "verified": true,
        "strength": "128-bit"
      },
      "dilithium": {
        "verified": true,
        "strength": "192-bit",
        "quantumSafe": true
      }
    },
    "overallSecurity": "quantum-safe",
    "verificationTime": "1.2ms"
  }
}
```

### Security Status

**Method:** `atp/security/status`

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": "status-001",
  "method": "atp/security/status"
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": "status-001",
  "result": {
    "quantumSafe": true,
    "cryptography": {
      "classical": "Ed25519",
      "postQuantum": "Dilithium",
      "mode": "hybrid"
    },
    "securityLevel": "enterprise",
    "threatLevel": "low",
    "lastSecurityScan": "2025-07-05T15:00:00.000Z",
    "vulnerabilities": [],
    "recommendations": []
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "jsonrpc": "2.0",
  "id": "request-id",
  "error": {
    "code": -32000,
    "message": "Human readable error message",
    "data": {
      "code": "ATP_ERROR_CODE",
      "details": "Additional error details",
      "timestamp": "2025-07-05T15:48:34.516Z",
      "requestId": "req_123456"
    }
  }
}
```

### Common Error Codes

| Code | ATP Code | Description |
|------|----------|-------------|
| -32700 | PARSE_ERROR | Invalid JSON |
| -32600 | INVALID_REQUEST | Invalid request format |
| -32601 | METHOD_NOT_FOUND | Method not supported |
| -32602 | INVALID_PARAMS | Invalid parameters |
| -32603 | INTERNAL_ERROR | Server internal error |
| -32000 | INSUFFICIENT_TRUST | Trust level too low |
| -32001 | SIGNATURE_INVALID | Quantum-safe signature verification failed |
| -32002 | RATE_LIMIT_EXCEEDED | Rate limit exceeded |
| -32003 | TOOL_NOT_FOUND | Requested tool not available |
| -32004 | QUANTUM_THREAT_DETECTED | Potential quantum attack detected |

### Error Handling Example

```javascript
ws.on('message', (data) => {
  const response = JSON.parse(data);
  
  if (response.error) {
    switch (response.error.data?.code) {
      case 'INSUFFICIENT_TRUST':
        console.log('Need higher trust level for this operation');
        // Request trust level upgrade
        break;
      
      case 'SIGNATURE_INVALID':
        console.log('Quantum-safe signature verification failed');
        // Regenerate and retry
        break;
      
      case 'RATE_LIMIT_EXCEEDED':
        console.log('Rate limit exceeded, waiting...');
        // Implement backoff strategy
        break;
      
      default:
        console.error('Unexpected error:', response.error);
    }
  }
});
```

---

## Rate Limiting

### Rate Limit Headers

Rate limiting information is included in response metadata:

```json
{
  "atpMetadata": {
    "rateLimits": {
      "limit": 120,
      "remaining": 105,
      "resetTime": "2025-07-05T16:00:00.000Z",
      "retryAfter": null
    }
  }
}
```

### Rate Limit Strategies

**Trust Level Based:**
- Basic: 60 requests/minute
- Verified: 120 requests/minute  
- Enterprise: 300 requests/minute

**Tool Specific:**
- Weather: 60 requests/minute
- Identity Lookup: 30 requests/minute
- File Operations: 10 requests/minute

**Burst Handling:**
- Allow burst up to 2x rate limit
- Gradual recovery over time
- Exponential backoff for violations

---

## SDK Integration

### JavaScript/TypeScript SDK

**Installation:**
```bash
npm install @atp/sdk
```

**Basic Usage:**
```typescript
import { ATPClient } from '@atp/sdk';

const client = new ATPClient({
  serverUrl: 'ws://localhost:3008',
  did: 'did:atp:my-agent',
  trustLevel: 'verified',
  quantumSafe: true
});

// Connect and initialize
await client.connect();
await client.initialize();

// List available tools
const tools = await client.listTools();

// Call a tool
const result = await client.callTool('weather_info', {
  location: 'San Francisco',
  units: 'celsius'
});

console.log(result);
```

### Python SDK

**Installation:**
```bash
pip install atp-sdk
```

**Basic Usage:**
```python
from atp_sdk import ATPClient

client = ATPClient(
    server_url='ws://localhost:3008',
    did='did:atp:my-agent',
    trust_level='verified',
    quantum_safe=True
)

# Connect and initialize
await client.connect()
await client.initialize()

# Call a tool
result = await client.call_tool('weather_info', {
    'location': 'San Francisco',
    'units': 'celsius'
})

print(result)
```

---

## Code Examples

### Complete Integration Example

```javascript
const WebSocket = require('ws');
const crypto = require('crypto');

class ATPQuantumSafeClient {
  constructor(options) {
    this.serverUrl = options.serverUrl;
    this.did = options.did;
    this.trustLevel = options.trustLevel;
    this.privateKeys = options.privateKeys;
    this.ws = null;
    this.requestId = 0;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.serverUrl, {
        headers: this.generateAuthHeaders()
      });

      this.ws.on('open', () => {
        console.log('Connected to ATP Quantum-Safe Server');
        resolve();
      });

      this.ws.on('error', reject);
      this.ws.on('message', this.handleMessage.bind(this));
    });
  }

  generateAuthHeaders() {
    const timestamp = new Date().toISOString();
    const message = `connect:${timestamp}`;
    const signature = this.generateHybridSignature(message);

    return {
      'x-atp-did': this.did,
      'x-atp-trust-level': this.trustLevel,
      'x-atp-auth-method': 'hybrid-signature',
      'x-atp-quantum-signature': 'enabled',
      'x-atp-timestamp': timestamp,
      'x-atp-signature': signature
    };
  }

  generateHybridSignature(message) {
    // Simulate hybrid signature generation
    const ed25519Sig = crypto.sign('sha256', Buffer.from(message), this.privateKeys.ed25519);
    const dilithiumSig = this.signDilithium(message); // Custom implementation
    return Buffer.concat([ed25519Sig, dilithiumSig]).toString('base64');
  }

  async initialize() {
    const request = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: { listChanged: true }
        },
        clientInfo: {
          name: 'ATP Enterprise Client',
          version: '1.0.0'
        }
      }
    };

    return this.sendRequest(request);
  }

  async listTools() {
    const request = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/list'
    };

    return this.sendRequest(request);
  }

  async callTool(name, args) {
    const request = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'tools/call',
      params: {
        name: name,
        arguments: args
      }
    };

    return this.sendRequest(request);
  }

  sendRequest(request) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 30000);

      this.pendingRequests = this.pendingRequests || new Map();
      this.pendingRequests.set(request.id, { resolve, reject, timeout });

      this.ws.send(JSON.stringify(request));
    });
  }

  handleMessage(data) {
    try {
      const response = JSON.parse(data.toString());
      
      if (response.id && this.pendingRequests?.has(response.id)) {
        const { resolve, reject, timeout } = this.pendingRequests.get(response.id);
        clearTimeout(timeout);
        this.pendingRequests.delete(response.id);

        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.result);
        }
      }
    } catch (error) {
      console.error('Error parsing response:', error);
    }
  }
}

// Usage example
async function main() {
  const client = new ATPQuantumSafeClient({
    serverUrl: 'ws://localhost:3008',
    did: 'did:atp:enterprise-client',
    trustLevel: 'verified',
    privateKeys: {
      ed25519: loadPrivateKey('ed25519.pem'),
      dilithium: loadPrivateKey('dilithium.pem')
    }
  });

  try {
    // Connect and initialize
    await client.connect();
    const initResult = await client.initialize();
    console.log('Initialized:', initResult);

    // List available tools
    const tools = await client.listTools();
    console.log('Available tools:', tools);

    // Call weather tool
    const weather = await client.callTool('weather_info', {
      location: 'San Francisco',
      units: 'celsius'
    });
    console.log('Weather result:', weather);

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

### Enterprise Integration Pattern

```typescript
// Enterprise-grade ATP integration with error handling and monitoring
import { ATPClient, TrustLevel, QuantumSafeConfig } from '@atp/sdk';
import { Logger } from 'winston';
import { Metrics } from 'prom-client';

export class EnterpriseATPIntegration {
  private client: ATPClient;
  private logger: Logger;
  private metrics: Metrics;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(config: EnterpriseATPConfig) {
    this.client = new ATPClient({
      serverUrl: config.serverUrl,
      did: config.agentDID,
      trustLevel: TrustLevel.ENTERPRISE,
      quantumSafe: true,
      timeout: 30000,
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000
      }
    });

    this.setupEventHandlers();
    this.setupMetrics();
  }

  private setupEventHandlers() {
    this.client.on('connected', () => {
      this.logger.info('ATP connection established');
      this.reconnectAttempts = 0;
      this.metrics.connectionStatus.set(1);
    });

    this.client.on('disconnected', () => {
      this.logger.warn('ATP connection lost');
      this.metrics.connectionStatus.set(0);
      this.handleReconnection();
    });

    this.client.on('error', (error) => {
      this.logger.error('ATP error:', error);
      this.metrics.errorCount.inc({ type: error.code });
    });

    this.client.on('quantumThreatDetected', (threat) => {
      this.logger.critical('Quantum threat detected:', threat);
      this.handleQuantumThreat(threat);
    });
  }

  private async handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      
      this.logger.info(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
      
      setTimeout(async () => {
        try {
          await this.client.connect();
        } catch (error) {
          this.logger.error('Reconnection failed:', error);
        }
      }, delay);
    } else {
      this.logger.error('Max reconnection attempts reached');
      this.metrics.connectionFailures.inc();
    }
  }

  private handleQuantumThreat(threat: QuantumThreat) {
    // Immediate security response
    this.client.enableQuantumSafeOnlyMode();
    
    // Alert security team
    this.alertSecurityTeam({
      severity: 'CRITICAL',
      type: 'QUANTUM_THREAT',
      details: threat,
      timestamp: new Date().toISOString()
    });
    
    // Audit all recent activities
    this.auditRecentActivities();
  }

  async executeSecureToolCall(toolName: string, args: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Pre-execution security checks
      await this.validateToolAccess(toolName);
      await this.checkRateLimits();
      
      // Execute with quantum-safe verification
      const result = await this.client.callTool(toolName, args, {
        requireQuantumSafe: true,
        auditLevel: 'FULL'
      });
      
      // Post-execution validation
      await this.validateResult(result);
      
      // Record metrics
      const duration = Date.now() - startTime;
      this.metrics.toolCallDuration.observe({ tool: toolName }, duration);
      this.metrics.toolCallSuccess.inc({ tool: toolName });
      
      return result;
      
    } catch (error) {
      this.metrics.toolCallErrors.inc({ tool: toolName, error: error.code });
      this.logger.error(`Tool call failed: ${toolName}`, error);
      throw error;
    }
  }

  private async validateToolAccess(toolName: string): Promise<void> {
    const trustStatus = await this.client.getTrustStatus();
    const toolInfo = await this.client.getToolInfo(toolName);
    
    if (trustStatus.level < toolInfo.requiredTrustLevel) {
      throw new Error(`Insufficient trust level for tool: ${toolName}`);
    }
  }

  private async validateResult(result: any): Promise<void> {
    if (!result.atpMetadata?.quantumSafeVerified) {
      throw new Error('Result not quantum-safe verified');
    }
    
    if (!result.atpMetadata?.signatureValid) {
      throw new Error('Invalid signature on result');
    }
  }
}
```

---

## Conclusion

The Agent Trust Protocol™ API provides comprehensive quantum-safe security for AI agent interactions. This reference guide enables enterprise developers to integrate ATP into their applications with confidence, knowing they're implementing the world's first quantum-safe AI agent protocol.

**Key Integration Benefits:**
- **Quantum-Safe Security**: Future-proof cryptographic protection
- **Enterprise-Grade**: Comprehensive error handling and monitoring
- **High Performance**: Minimal overhead with maximum security
- **Developer-Friendly**: Clear APIs and comprehensive SDKs

**Next Steps:**
1. Review the authentication requirements
2. Choose your preferred SDK (JavaScript/TypeScript or Python)
3. Implement basic connection and tool calling
4. Add enterprise-grade error handling and monitoring
5. Test with your specific use cases

**🛡️ Protecting AI Agents from Tomorrow's Threats, Today**

---

**Document Version:** 1.0.0  
**Last Updated:** July 5, 2025  
**API Version:** 1.0.0  
**Contact:** developers@atp.dev