# 🔐 ATP OpenClaw Integration Guide

Complete guide for integrating Agent Trust Protocol™ with OpenClaw agents.

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Core Concepts](#core-concepts)
4. [Integration Patterns](#integration-patterns)
5. [Security Configurations](#security-configurations)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Installation

### TypeScript/JavaScript

```bash
npm install @atpdevelopment/openclaw-atp atp-sdk
```

### Python (Coming Soon)

```bash
pip install atpdevelopment-openclaw-atp atp-sdk
```

## Quick Start

### 1. Initialize ATP Client

```typescript
import { ATPClient } from 'atp-sdk';
import { ATPConfigProfile } from '@atpdevelopment/openclaw-atp';

// For development
const atpConfig = ATPConfigProfile.strictDev('http://localhost:3000');

// For production
// const atpConfig = ATPConfigProfile.productionFinance('https://atp.company.com');

const atp = new ATPClient(atpConfig);
```

### 2. Register Agents

```typescript
import { registerAgentWithAtp } from '@atpdevelopment/openclaw-atp';

const writerMeta = await registerAgentWithAtp(atp, {
  name: 'content-writer',
  role: 'writer',
  trustLevel: 'verified',
  capabilities: ['content-creation', 'research']
});

console.log('Agent DID:', writerMeta.did);
console.log('Trust Score:', writerMeta.trustScore);
```

### 3. Secure Tools

```typescript
import { secureTools } from '@atpdevelopment/openclaw-atp';

// Original tools
const rawTools = [searchTool, writeTool, publishTool];

// Wrap with ATP security
const securedTools = secureTools(rawTools, atp, {
  minTrustScore: 0.7,
  auditRequired: true,
  rateLimit: 60 // calls per minute
});

// Use secured tools with OpenClaw agent
const writer = new ReActToolCallingClawAgent({
  name: 'writer',
  tools: securedTools,
  metadata: { atp: writerMeta }
});
```

### 4. Protect Tasks

```typescript
import { createTaskMetadata } from '@atpdevelopment/openclaw-atp';

const writeTask = new SimpleTask({
  crew,
  agent: writer,
  description: 'Write article about quantum computing',
  metadata: createTaskMetadata({
    requiredTrust: 0.8,
    policy: 'content_creation',
    dataClassification: 'internal',
    sensitivityLevel: 'medium'
  })
});
```

### 5. Validate Agent Graph

```typescript
import { ATPGraphValidator, ATPPolicyProfile } from '@atpdevelopment/openclaw-atp';

// Get policy profile
const policy = ATPPolicyProfile.researchWorkflow();

// Create validator
const validator = new ATPGraphValidator(
  atp,
  policy.interAgentRules,
  policy.workflowConstraints
);

// Validate before running crew
const validation = await validator.validateGraph(nodes, edges);

if (!validation.isValid) {
  console.error('Graph validation failed:', validation.errors);
  throw new Error('Security validation failed');
}

// Proceed with crew execution
await crew.run();
```

## Core Concepts

### 1. Agent Identity

Every OpenClaw agent gets:
- **Quantum-safe DID** (Decentralized Identifier)
- **Hybrid cryptographic keys** (Ed25519 + Dilithium)
- **Trust score** (0.0 - 1.0)
- **Policy profile** assignment

### 2. Tool Security

ATP wraps tools to provide:
- **Authentication** - Verify agent identity
- **Authorization** - Check permissions and policies
- **Audit logging** - Track all tool calls
- **Rate limiting** - Prevent abuse
- **DLP checks** - Scan for PII/sensitive data

### 3. Task Protection

Tasks can specify:
- **Minimum trust** required
- **Policy sets** to enforce
- **Data classification** (public, internal, confidential, PII, financial)
- **Execution constraints** (timeout, allowed roles)

### 4. Graph Validation

Before execution, validate:
- **Agent connections** - Which agents can call which other agents
- **Data flow** - What data types can flow across edges
- **Workflow structure** - Depth, fan-out, cycle constraints
- **Trust requirements** - Minimum trust scores

## Integration Patterns

### Pattern 1: Simple Agent Protection

```typescript
// 1. Register agent
const agentMeta = await registerAgentWithAtp(atp, {
  name: 'simple-agent',
  role: 'assistant',
  trustLevel: 'verified'
});

// 2. Secure tools
const securedTools = secureTools(rawTools, atp);

// 3. Create agent with ATP metadata
const agent = new ReActToolCallingClawAgent({
  name: 'simple-agent',
  tools: securedTools,
  metadata: { atp: agentMeta }
});

// Agent is now ATP-protected!
```

### Pattern 2: Multi-Agent Workflow

```typescript
import { OpenClawATPClient, ATPPolicyProfile } from '@atpdevelopment/openclaw-atp';

// Create integrated client
const client = new OpenClawATPClient({
  atpClient: atp,
  interAgentPolicies: ATPPolicyProfile.researchWorkflow().interAgentRules,
  workflowConstraints: {
    maxChainDepth: 5,
    allowCycles: false,
    minWorkflowTrust: 0.7
  },
  enableMonitoring: true
});

// Register agents
const researcher = await client.registerAgent({ name: 'researcher', role: 'researcher' });
const analyzer = await client.registerAgent({ name: 'analyzer', role: 'analyzer' });
const writer = await client.registerAgent({ name: 'writer', role: 'writer' });

// Secure tools for each agent
const researcherTools = client.secureTools(researchTools);
const analyzerTools = client.secureTools(analysisTools);
const writerTools = client.secureTools(writingTools);

// Validate graph
const validation = await client.validateGraph(
  [
    { name: 'researcher', role: 'researcher', did: researcher.did, trustScore: researcher.trustScore },
    { name: 'analyzer', role: 'analyzer', did: analyzer.did, trustScore: analyzer.trustScore },
    { name: 'writer', role: 'writer', did: writer.did, trustScore: writer.trustScore }
  ],
  [
    { from: 'researcher', to: 'analyzer', dataType: 'research-data' },
    { from: 'analyzer', to: 'writer', dataType: 'analysis-results' }
  ]
);

if (validation.isValid) {
  // Safe to run workflow
  await crew.run();
}
```

### Pattern 3: Financial Trading System

See [examples/finance-workflow.ts](./examples/finance-workflow.ts) for complete implementation.

## Security Configurations

### Development (Low Security)

```typescript
const config = ATPConfigProfile.strictDev();
const policy = ATPPolicyProfile.strictDev();

// Features:
// - Min trust: 0.6
// - Standard audit logging
// - Permissive agent connections
// - No MFA required
```

### Production Finance (High Security)

```typescript
const config = ATPConfigProfile.productionFinance('https://atp.company.com', {
  minTrust: 0.95,
  requireMFA: true,
  auditLevel: 'full'
});

const policy = ATPPolicyProfile.productionFinance();

// Features:
// - Min trust: 0.95
// - MFA required for sensitive operations
// - Full audit trail with blockchain anchoring
// - Strict agent interaction policies
// - Rate limiting on financial tools
// - Real-time anomaly detection
```

### PII Handling (Compliance)

```typescript
const config = ATPConfigProfile.piiWorkflow('https://atp.company.com', {
  dataEncryption: true,
  retentionDays: 90,
  compliance: ['GDPR', 'CCPA']
});

const policy = ATPPolicyProfile.piiWorkflow();

// Features:
// - DLP enabled on all tools
// - Encrypted audit logs
// - Strict data retention policies
// - No PII to external services
// - Compliance reporting
```

## Best Practices

### 1. Always Validate Graphs

```typescript
// ❌ DON'T: Run crew without validation
await crew.run();

// ✅ DO: Validate first
const validation = await validator.validateGraph(nodes, edges);
if (!validation.isValid) {
  throw new Error(`Security validation failed: ${validation.errors.join(', ')}`);
}
await crew.run();
```

### 2. Use Appropriate Trust Levels

```typescript
// ❌ DON'T: Use same trust level for everything
const lowRiskAgent = await registerAgent({ trustLevel: 'privileged' });
const highRiskAgent = await registerAgent({ trustLevel: 'privileged' });

// ✅ DO: Match trust to risk
const lowRiskAgent = await registerAgent({ trustLevel: 'verified' }); // 0.75
const highRiskAgent = await registerAgent({ trustLevel: 'privileged' }); // 0.95
```

### 3. Implement Proper Tool Security

```typescript
// ❌ DON'T: Use default security for all tools
const tools = secureTools(allTools, atp);

// ✅ DO: Customize per tool
const readTools = secureTools(readOnlyTools, atp, { minTrustScore: 0.5, rateLimit: 100 });
const writeTools = secureTools(writeTools, atp, { minTrustScore: 0. 8, rateLimit: 30 });
const adminTools = secureTools(adminTools, atp, { minTrustScore: 0.95, rateLimit: 5 });
```

### 4. Monitor Trust Scores

```typescript
import { ATPMonitor } from '@atpdevelopment/openclaw-atp';

const monitor = new ATPMonitor(atp);

// Check trust scores periodically
setInterval(async () => {
  const scores = await monitor.getAgentTrustScores();
  
  for (const [agentDid, score] of Object.entries(scores)) {
    if (score < 0.6) {
      console.warn(`⚠️ Low trust: ${agentDid} = ${score}`);
      
      // Investigate
      const metrics = await monitor.getBehaviorMetrics(agentDid);
      const anomaly = await monitor.detectAnomalies(agentDid);
      
      if (anomaly.detected) {
        // Take action
        console.error(`🚨 Anomaly detected: ${anomaly.description}`);
      }
    }
  }
}, 60000); // Every minute
```

### 5. Handle Failures Gracefully

```typescript
try {
  const result = await secureTool.execute(agentContext, ...args);
  
  if (!result.success) {
    // Log and handle
    console.error('Tool execution failed:', result.error);
    
    // Update trust if needed
    await agent.recordFailure('toolType', result.error);
  }
} catch (error) {
  // ATP blocked the call
  console.error('ATP security blocked:', error.message);
  
  // Audit log is automatic - no manual logging needed
}
```

## Troubleshooting

### Agent Registration Fails

**Problem**: `Agent registration failed: DID already exists`

**Solution**:
```typescript
// Check if agent already exists
try {
  const existing = await atp.identity.getDID(expectedDID);
  // Use existing agent
  agentMeta = existing;
} catch {
  // Create new agent
  agentMeta = await registerAgentWithAtp(atp, options);
}
```

### Tool Execution Blocked

**Problem**: `Action blocked by ATP security: Insufficient trust level`

**Solutions**:
1. Check current trust: `agent.getTrustScore()`
2. Review recent failures that lowered trust
3. Increase trust through successful actions
4. Adjust `minTrustScore` in tool config if appropriate

### Graph Validation Fails

**Problem**: `Graph validation failed: Edge not allowed`

**Solutions**:
1. Review inter-agent policies
2. Add missing policy rules
3. Check forbidden pairs
4. Verify agent roles match policy patterns

### High Latency

**Problem**: ATP security checks slow down operations

**Solutions**:
1. Reduce audit logging frequency for low-risk operations
2. Implement caching for permission checks
3. Use async validation where possible
4. Optimize policy rule evaluation order

## Support

- **Documentation**: https://github.com/agent-trust-protocol/atp-core/tree/main/docs/openclaw
- **Examples**: [./examples](./examples)
- **Issues**: https://github.com/agent-trust-protocol/core/issues
- **Discord**: https://discord.gg/atp
- **Email**: support@atp.protocol

---

**Next Steps**:
- Review [examples/finance-workflow.ts](./examples/finance-workflow.ts)
- Read the [API Reference](./API.md)
- Join our [Discord community](https://discord.gg/atp)
