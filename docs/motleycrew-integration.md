# 🤖 Motleycrew + ATP Integration Guide

Comprehensive guide for securing [Motleycrew](https://github.com/ShoggothAI/motleycrew) multi-agent systems with Agent Trust Protocol™.

## Overview

The ATP Motleycrew integration provides quantum-safe security for multi-agent workflows by:
- **Agent Identity**: Each Motleycrew agent gets a quantum-safe DID (Decentralized Identifier)
- **Tool Security**: ATP intercepts and validates every tool call
- **Graph Validation**: Policy-based constraints on agent interactions and data flows
- **Trust Scoring**: Dynamic trust levels adjust based on agent behavior
- **Observability**: Integration with Lunary for metrics and anomaly detection

## Installation

### Prerequisites
- Node.js 18+
- Motleycrew installed (`npm install motleycrew`)
- ATP services running (see [Getting Started](./getting-started.md))

### Install ATP Motleycrew Package

```bash
npm install @atp/motleycrew-atp atp-sdk
```

Or with yarn:
```bash
yarn add @atp/motleycrew-atp atp-sdk
```

## Quick Start (5 Minutes)

### 1. Initialize ATP Client

```typescript
import { MotleycrewATPClient } from '@atp/motleycrew-atp';

const atpClient = new MotleycrewATPClient({
  atpServiceUrl: 'http://localhost:3000',
  profile: 'strictDev', // or 'productionFinance', 'piiWorkflow', 'researchWorkflow'
  enableMonitoring: true
});

await atpClient.initialize();
```

### 2. Register Your Agents

```typescript
import { ReActToolCallingMotleyAgent } from 'motleycrew/agents/langchain';

// Create Motleycrew agent
const researchAgent = new ReActToolCallingMotleyAgent({
  name: 'Researcher',
  description: 'Analyzes market data',
  tools: researchTools
});

// Register with ATP
const { agent, registration } = await atpClient.registerAgent(researchAgent, {
  name: 'market-researcher',
  capabilities: ['research', 'data_analysis'],
  trustLevel: 'standard' // 'low', 'standard', 'high', 'critical'
});

console.log(`✅ Agent registered with DID: ${registration.did}`);
console.log(`🔐 Trust score: ${registration.trustScore}`);
```

### 3. Secure Agent Tools

```typescript
import { secureTools } from '@atp/motleycrew-atp';

// Wrap tools with ATP security
const securedTools = secureTools(registration.did, researchTools, atpClient.atpClient, {
  requiredTrustLevel: 0.5,
  requiresAuth: true,
  rateLimit: {
    maxCallsPerMinute: 60
  }
});

// Update agent with secured tools
researchAgent.tools = securedTools;
```

### 4. Validate Agent Graph

Before running your crew, validate the agent interaction graph:

```typescript
import { MotleyCrew } from 'motleycrew';

const crew = new MotleyCrew();
crew.add_agent(researchAgent);
crew.add_agent(tradingAgent);

// Validate with ATP
const validation = await atpClient.validateCrew(crew);

if (!validation.isValid) {
  console.error('❌ Graph validation failed:', validation.errors);
  process.exit(1);
}

console.log('✅ Graph validated successfully');
console.log(`📊 Max chain depth: ${validation.metrics.maxChainDepth}`);
console.log(`🔗 Total connections: ${validation.metrics.totalConnections}`);
```

### 5. Run Your Crew

```typescript
// Run the crew - ATP security is now active
const result = await crew.run();
```

That's it! Your multi-agent system now has:
✅ Quantum-safe cryptographic identities  
✅ Per-tool security validation  
✅ Graph-level policy enforcement  
✅ Dynamic trust scoring  
✅ Complete audit trail  

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 Motleycrew Agent Crew                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Agent A │──│  Agent B │──│  Agent C │             │
│  │ (DID:..1)│  │ (DID:..2)│  │ (DID:..3)│             │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘             │
└────────┼─────────────┼─────────────┼───────────────────┘
         │             │             │
         ▼             ▼             ▼
┌─────────────────────────────────────────────────────────┐
│             ATP Motleycrew Security Layer               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Agent   │  │   Tool   │  │  Graph   │             │
│  │  Wrapper │  │  Wrapper │  │ Validator│             │
│  └──────────┘  └──────────┘  └──────────┘             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Policy  │  │ Monitor  │  │ Secrets  │             │
│  │  Engine  │  │  +Lunary │  │  Manager │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │     ATP Core SDK      │
         │  - Identity Service   │
         │  - Trust Scoring      │
         │  - Audit Logging      │
         └───────────────────────┘
```

## Core Components

### Agent Registration

Every Motleycrew agent gets a quantum-safe identity:

```typescript
const { agent, registration } = await registerAgentWithAtp(atpClient, motleyAgent, {
  name: 'agent-name',
  description: 'Agent purpose',
  capabilities: ['capability1', 'capability2'],
  trustLevel: 'high', // 'low', 'standard', 'high', 'critical'
  maxTrustLevel: 1.0,
  metadata: {
    team: 'trading',
    environment: 'production'
  }
});
```

**What happens:**
- Generates hybrid Ed25519 + Dilithium3 key pair (quantum-safe)
- Creates DID (Decentralized Identifier): `did:atp:agent-${nanoid()}`
- Registers with ATP Identity Service
- Assigns initial trust score (0.0 - 1.0)
- Grants default permissions based on trust level

### Tool Security Wrapper

ATP intercepts every tool call with 5-step validation:

```typescript
import { ATPToolWrapper } from '@atp/motleycrew-atp';

const wrapper = new ATPToolWrapper(
  agentDid,
  originalTool,
  atpClient,
  {
    requiredTrustLevel: 0.7,
    requiresAuth: true,
    requiredPermissions: ['tools:execute'],
    rateLimit: {
      maxCallsPerMinute: 100,
      maxCallsPerHour: 1000
    },
    customValidator: async (context) => {
      // Custom security logic
      if (context.input.contains('sensitive')) {
        return { allowed: false, reason: 'PII detected' };
      }
      return { allowed: true };
    }
  }
);

// Use the wrapper
const result = await wrapper.execute({ input: 'analyze data' });
```

**Security checks (in order):**
1. **Authentication**: Verify agent DID exists and is active
2. **Trust Level**: Check agent's trust score meets threshold
3. **Permissions**: Validate required permissions are granted
4. **Rate Limiting**: Enforce calls-per-minute/hour limits
5. **Custom Validation**: Optional application-specific logic
6. **DLP Scanning**: Check for PII, secrets, sensitive data

### Task Protection

Add security metadata to Motleycrew tasks:

```typescript
import { atpProtectedTask, createTaskMetadata } from '@atp/motleycrew-atp';

// Option 1: Use decorator
@atpProtectedTask({
  requiredTrust: 0.8,
  dataClassification: 'financial',
  sensitivityLevel: 'high',
  maxExecutionTime: 60000 // ms
})
class TradingTask extends SimpleTask {
  async execute() {
    // Task logic
  }
}

// Option 2: Manual metadata
const metadata = createTaskMetadata({
  requiredTrust: 0.8,
  policy: 'financial-trading',
  dataClassification: 'financial',
  sensitivityLevel: 'high'
});

const task = new SimpleTask({
  name: 'Execute trade',
  agent: traderAgent,
  metadata: metadata // ATP validates before execution
});
```

**Data Classifications:**
- `public`: No restrictions
- `internal`: Internal use only
- `confidential`: Restricted access
- `pii`: Personal information (GDPR/CCPA)
- `financial`: Financial data (PCI-DSS)

### Graph Validation

Validate agent interaction graphs before execution:

```typescript
import { ATPGraphValidator, ATPPolicyProfile } from '@atp/motleycrew-atp';

const validator = new ATPGraphValidator(atpClient);
const policy = ATPPolicyProfile.productionFinance();

const result = await validator.validateGraph(
  agents,        // Array of registered agents
  connections,   // Inter-agent connections
  policy        // Security policy
);

if (!result.isValid) {
  console.error('Graph validation failed:');
  result.errors.forEach(err => console.error(`  - ${err}`));
  result.warnings.forEach(warn => console.warn(`  - ${warn}`));
  process.exit(1);
}

console.log('Metrics:', result.metrics);
// {
//   maxChainDepth: 5,
//   maxFanOut: 3,
//   totalConnections: 12,
//   cyclesDetected: []
// }
```

**Policy Constraints:**
- `allowCycles`: Whether agent cycles are permitted
- `maxChainDepth`: Maximum depth of agent call chains
- `maxFanOut`: Maximum number of outgoing connections per agent
- `interAgentPolicies`: Trust requirements for connections
- `dataFlowPolicies`: Data classification constraints

### Policy Profiles

ATP provides pre-configured security profiles:

```typescript
import { ATPPolicyProfile } from '@atp/motleycrew-atp';

// Development (relaxed security, fast iteration)
const devProfile = ATPPolicyProfile.strictDev();
// - minTrustLevel: 0.6
// - allowCycles: true
// - maxChainDepth: 10
// - developmentMode: true

// Production Finance (strict security)
const financeProfile = ATPPolicyProfile.productionFinance();
// - minTrustLevel: 0.95
// - requireMFA: true
// - allowCycles: false
// - maxChainDepth: 5
// - auditLevel: 'verbose'

// PII Workflow (GDPR/CCPA compliant)
const piiProfile = ATPPolicyProfile.piiWorkflow();
// - minTrustLevel: 0.9
// - requireConsent: true
// - requireDataMinimization: true
// - allowDataSharing: false

// Research (balanced, allows exploration)
const researchProfile = ATPPolicyProfile.researchWorkflow();
// - minTrustLevel: 0.7
// - allowCycles: true
// - maxChainDepth: 8

// Custom profile
const customProfile = new ATPPolicyProfile({
  minTrustLevel: 0.85,
  allowCycles: false,
  maxChainDepth: 6,
  customRules: [
    {
      condition: (agent) => agent.capabilities.includes('trading'),
      constraint: { requiredTrust: 0.95, requireMFA: true }
    }
  ]
});
```

### Observability & Monitoring

Integration with Lunary for metrics and anomaly detection:

```typescript
import { ATPMonitor, ATPLunaryExporter } from '@atp/motleycrew-atp';

// Create monitor
const monitor = new ATPMonitor(atpClient);

// Track agent behavior
monitor.recordToolCall(agentDid, {
  tool: 'execute_trade',
  success: true,
  latency: 250
});

monitor.recordSecurityViolation(agentDid, {
  type: 'trust_level_insufficient',
  severity: 'high'
});

// Get metrics
const metrics = monitor.getBehaviorMetrics(agentDid);
console.log(`Success rate: ${metrics.successRate}%`);
console.log(`Avg latency: ${metrics.avgLatency}ms`);

// Detect anomalies
const anomalies = monitor.detectAnomalies(agentDid);
if (anomalies.hasAnomalies) {
  console.warn(`⚠️ Anomalies detected (score: ${anomalies.score})`);
  anomalies.indicators.forEach(i => console.warn(`  - ${i}`));
}

// Export to Lunary (periodic)
const exporter = new ATPLunaryExporter(atpClient, {
  apiKey: process.env.LUNARY_API_KEY,
  exportInterval: 60000 // 1 minute
});

await exporter.start();
// Metrics automatically flow: Lunary → ATP Trust Engine → Agent trust scores
```

### External Service Security

Manage credentials and service access:

```typescript
import { ATPSecretManager, ATPServiceConnector } from '@atp/motleycrew-atp';

// Secret management (short-lived, scoped tokens)
const secretManager = new ATPSecretManager(atpClient);

const token = await secretManager.getSecret('trading-api-key', {
  agentDid: traderAgent.did,
  scope: 'trading:execute',
  ttl: 3600 // 1 hour
});

// Service connector (with allow-lists and DLP)
const connector = new ATPServiceConnector(atpClient, {
  service: 'trading-api',
  baseUrl: 'https://api.trading.example.com',
  allowedEndpoints: ['/orders', '/quotes'],
  dlpEnabled: true
});

await connector.register(traderAgent.did, {
  allowedMethods: ['POST', 'GET'],
  maxRequestsPerMinute: 10
});

// Make secure request
const response = await connector.request(traderAgent.did, {
  method: 'POST',
  endpoint: '/orders',
  data: orderData // DLP scans for PII before sending
});
```

## Complete Example: Finance Trading Workflow

```typescript
import { MotleycrewATPClient, ATPPolicyProfile } from '@atp/motleycrew-atp';
import { MotleyCrew } from 'motleycrew';
import { ReActToolCallingMotleyAgent } from 'motleycrew/agents/langchain';

async function main() {
  // 1. Initialize ATP
  const atpClient = new MotleycrewATPClient({
    atpServiceUrl: 'http://localhost:3000',
    profile: 'productionFinance',
    enableMonitoring: true
  });
  await atpClient.initialize();

  // 2. Create and register agents
  const researcher = await atpClient.registerAgent(
    new ReActToolCallingMotleyAgent({
      name: 'Researcher',
      description: 'Market data analyst',
      tools: researchTools
    }),
    {
      name: 'market-researcher',
      capabilities: ['research', 'analysis'],
      trustLevel: 'standard'
    }
  );

  const trader = await atpClient.registerAgent(
    new ReActToolCallingMotleyAgent({
      name: 'Trader',
      description: 'Executes trades',
      tools: tradingTools
    }),
    {
      name: 'trader',
      capabilities: ['trading', 'execute_orders'],
      trustLevel: 'high'
    }
  );

  const reviewer = await atpClient.registerAgent(
    new ReActToolCallingMotleyAgent({
      name: 'Reviewer',
      description: 'Reviews trades for compliance',
      tools: reviewTools
    }),
    {
      name: 'compliance-reviewer',
      capabilities: ['review', 'compliance'],
      trustLevel: 'high'
    }
  );

  // 3. Create crew
  const crew = new MotleyCrew();
  crew.add_agent(researcher.agent);
  crew.add_agent(trader.agent);
  crew.add_agent(reviewer.agent);

  // 4. Validate graph
  const validation = await atpClient.validateCrew(crew);
  if (!validation.isValid) {
    throw new Error(`Graph validation failed: ${validation.errors.join(', ')}`);
  }

  // 5. Set up monitoring
  const monitor = atpClient.monitor;
  setInterval(() => {
    const researcherMetrics = monitor.getBehaviorMetrics(researcher.registration.did);
    console.log(`Researcher success rate: ${researcherMetrics.successRate}%`);
  }, 30000);

  // 6. Run workflow
  console.log('🚀 Starting finance trading workflow...');
  const result = await crew.run('Analyze AAPL stock and execute trade if profitable');

  console.log('✅ Workflow completed');
  console.log('Result:', result);
}

main().catch(console.error);
```

## Security Best Practices

### 1. Use Appropriate Trust Levels

```typescript
// Low-risk agents (read-only, public data)
trustLevel: 'standard' // 0.5 initial trust

// Medium-risk agents (data processing, internal tools)
trustLevel: 'high' // 0.8 initial trust

// High-risk agents (trading, payments, PII)
trustLevel: 'critical' // 0.95 initial trust + MFA
```

### 2. Validate Graphs in CI/CD

```typescript
// In your test suite
describe('Agent Graph Security', () => {
  it('should validate production graph', async () => {
    const validation = await atpClient.validateCrew(productionCrew);
    expect(validation.isValid).toBe(true);
    expect(validation.metrics.maxChainDepth).toBeLessThan(6);
  });
});
```

### 3. Monitor Trust Scores

```typescript
// Alert if trust drops below threshold
const checkTrust = async (agentDid: string) => {
  const trustScore = await atpClient.atpClient.identity.getTrustScore(agentDid);
  
  if (trustScore < 0.7) {
    await alertSecurityTeam(`Agent ${agentDid} trust dropped to ${trustScore}`);
    await atpClient.atpClient.permissions.revokeAll(agentDid);
  }
};
```

### 4. Rotate Credentials Regularly

```typescript
const secretManager = new ATPSecretManager(atpClient.atpClient);

// Use short TTLs
const token = await secretManager.getSecret('api-key', {
  ttl: 3600, // 1 hour max
  scope: 'narrow:permissions'
});

// Rotate on schedule
setInterval(async () => {
  await secretManager.rotateSecret('api-key');
}, 24 * 60 * 60 * 1000); // Daily
```

### 5. Use Least Privilege

```typescript
// Only grant required permissions
await atpClient.atpClient.permissions.grant({
  grantor: 'admin-did',
  grantee: agent.did,
  scopes: ['tools:execute'], // Specific, not 'admin:*'
  resource: 'market-data-api',
  expiresAt: Date.now() + 86400000 // 24 hours
});
```

## Troubleshooting

### Trust Level Too Low

```
Error: Trust level 0.5 below required 0.8
```

**Solution:**
```typescript
// Grant temporary trust boost
await updateAgentTrust(atpClient, agentDid, {
  increment: 0.3,
  reason: 'Successful execution streak',
  expiresAt: Date.now() + 3600000 // 1 hour
});
```

### Graph Validation Fails

```
Error: Cycle detected: agent-1 → agent-2 → agent-1
```

**Solution:**
```typescript
// Use permissive policy for development
const policy = ATPPolicyProfile.strictDev();
policy.allowCycles = true;

// Or redesign graph to remove cycle
```

### Rate Limit Exceeded

```
Error: Rate limit exceeded: 61 calls in last minute (max: 60)
```

**Solution:**
```typescript
// Increase limit
const securedTools = secureTools(agentDid, tools, atpClient, {
  rateLimit: {
    maxCallsPerMinute: 120, // Increased
    maxCallsPerHour: 5000
  }
});
```

## API Reference

Full API documentation:
- [`MotleycrewATPClient`](../packages/motleycrew-atp/README.md#motleycrew-atp-client)
- [`registerAgentWithAtp()`](../packages/motleycrew-atp/README.md#register-agent)
- [`secureTools()`](../packages/motleycrew-atp/README.md#secure-tools)
- [`ATPGraphValidator`](../packages/motleycrew-atp/README.md#graph-validator)
- [`ATPPolicyProfile`](../packages/motleycrew-atp/README.md#policy-profiles)
- [`ATPMonitor`](../packages/motleycrew-atp/README.md#monitoring)

## Examples

Explore complete working examples:
- [Finance Trading Workflow](../packages/motleycrew-atp/examples/finance-workflow.ts)
- [Research Crew](../packages/motleycrew-atp/examples/research-crew.ts) (coming soon)
- [Customer Service](../packages/motleycrew-atp/examples/customer-service.ts) (coming soon)

## Migration Guide

### From Unprotected Motleycrew

```diff
  import { MotleyCrew } from 'motleycrew';
+ import { MotleycrewATPClient } from '@atp/motleycrew-atp';

+ const atpClient = new MotleycrewATPClient({ profile: 'strictDev' });
+ await atpClient.initialize();

  const crew = new MotleyCrew();
  
- crew.add_agent(agent1);
+ const { agent: securedAgent1 } = await atpClient.registerAgent(agent1, {
+   name: 'agent-1',
+   trustLevel: 'standard'
+ });
+ crew.add_agent(securedAgent1);

+ const validation = await atpClient.validateCrew(crew);
+ if (!validation.isValid) throw new Error('Validation failed');

  const result = await crew.run();
```

## Python Support

Python bindings coming soon:

```python
from motleycrew_atp import MotleycrewATPClient

client = MotleycrewATPClient(profile='production_finance')
await client.initialize()

agent = await client.register_agent(motley_agent, 
    name='trader',
    trust_level='high'
)
```

## Resources

- **Documentation**: [https://docs.atp.dev/motleycrew](https://docs.atp.dev/motleycrew)
- **Examples**: [/packages/motleycrew-atp/examples](../packages/motleycrew-atp/examples/)
- **GitHub**: [https://github.com/agent-trust-protocol/atp](https://github.com/agent-trust-protocol/atp)
- **Discord**: [https://discord.gg/atp-dev](https://discord.gg/atp-dev)
- **Motleycrew Docs**: [https://motleycrew.ai](https://motleycrew.ai)

## License

Apache 2.0 - See [LICENSE](../LICENSE)

---

**Next Steps:**
1. [Install the package](#installation)
2. [Try the quick start](#quick-start-5-minutes)
3. [Explore the finance example](../packages/motleycrew-atp/examples/finance-workflow.ts)
4. [Read security best practices](#security-best-practices)
5. [Join our Discord](https://discord.gg/atp-dev) for support
