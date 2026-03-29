# ATP Adapter Specification

An ATP adapter bridges a third-party agent framework to the ATP security layer,
adding quantum-safe identity, trust scoring, and audit trails without changing
the underlying framework's code.

## Directory Structure

```
adapters/your-framework/
├── ADAPTER.md    ← what this adapter does (copy this template)
├── index.ts      ← exports atpWrap(agent, options): Promise<ATPAgent>
├── README.md     ← install instructions + usage example
└── tests/
    └── index.test.ts
```

## Required Export

Every adapter must export an `atpWrap` function:

```typescript
export async function atpWrap(
  agent: any,
  options: ATPAdapterOptions
): Promise<ATPAgent>
```

## ATPAdapterOptions

```typescript
interface ATPAdapterOptions {
  name: string;                                // Agent display name
  trustLevel?: 'low' | 'standard' | 'high';   // Default: 'standard'
  capabilities?: string[];                     // e.g. ['read', 'write', 'execute']
  enableAudit?: boolean;                       // Default: true
}
```

## ATPAgent (Returned Interface)

```typescript
interface ATPAgent {
  getDID(): string;                            // Agent's decentralized identifier
  isQuantumSafe(): boolean;                    // Whether quantum-safe crypto is active
  getTrustScore(did: string): Promise<number>; // 0.0 to 1.0
  send(to: string, message: string): Promise<void>;
}
```

## Available Adapters

| Framework | Package | Status |
|-----------|---------|--------|
| OpenClaw | `packages/openclaw-atp` | Stable (v1.1.0) |
| LangChain | `packages/sdk/langchain` | Stable |
| MCP | `packages/sdk/mcp` | Stable |
| A2A | `adapters/a2a` | Planned |
| AutoGPT | `adapters/autogpt` | Planned |
| CrewAI | `adapters/crewai` | Planned |
| ADK (Google) | `adapters/adk` | Planned |

## Implementation Guide

1. Use the existing SDK methods from `atp-sdk` — do not duplicate trust or crypto logic
2. Follow the pattern in `packages/openclaw-atp/src/claw-api.ts`
3. Your adapter must:
   - Check agent identity via the SDK
   - Evaluate the relevant policy before executing sensitive actions
   - Log decisions to the audit service

### Minimal Example

```typescript
import { ATPClient } from 'atp-sdk';

export async function atpWrap(agent: any, options: ATPAdapterOptions) {
  const client = new ATPClient();
  const identity = await client.registerAgent({
    name: options.name,
    capabilities: options.capabilities ?? ['read']
  });

  return {
    getDID: () => identity.did,
    isQuantumSafe: () => identity.quantumSafe,
    getTrustScore: (did: string) => client.getTrustScore(did),
    send: (to: string, msg: string) => client.sendMessage(identity.did, to, msg),
    // Expose the original agent for framework-specific operations
    unwrap: () => agent
  };
}
```

## Contributing a New Adapter

1. Fork the repo
2. Copy this template to `adapters/your-framework/`
3. Implement `atpWrap()` following the pattern in `packages/openclaw-atp/`
4. Add tests in `adapters/your-framework/tests/`
5. Open a PR using the template in `.github/pull_request_template.md`

## Resources

- [OpenClaw adapter source](../packages/openclaw-atp/)
- [SDK API reference](../packages/sdk/README.md)
- [Quick Start](../QUICK_START.md)
- [Discord](https://discord.gg/agenttrustprotocol)
