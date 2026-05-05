#  ATP OpenClaw Integration

[![npm version](https://badge.fury.io/js/%40atpdevelopment%2Fopenclaw-atp.svg)](https://www.npmjs.com/package/@atpdevelopment/openclaw-atp)
[![Publish to npm](https://github.com/agent-trust-protocol/atp-core/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/agent-trust-protocol/atp-core/actions/workflows/npm-publish.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

**Quantum-safe security layer for OpenClaw AI agents**

This package provides seamless integration between the Agent Trust Protocol™ (ATP) and OpenClaw, enabling enterprise-grade security, trust scoring, and policy enforcement for multi-agent AI systems.

##  Features

- ** Agent Identity Management** - Quantum-safe DIDs for every OpenClaw agent
- ** Tool Security Wrapper** - ATP security checks on all tool calls
- ** Trust-Based Access Control** - Dynamic trust scoring and policy enforcement
- ** Task-Level Security** - Attach security metadata to tasks and knowledge graphs
- ** Graph Validation** - Policy-based validation of agent interaction graphs
- ** Observability Integration** - Lunary metrics → ATP trust engine
- ** Secrets Management** - ATP-managed credentials for external services
- ** Zero Configuration** - Works out of the box with OpenClaw

##  Quick Start

### Installation

**TypeScript / Node.js (this package):**
```bash
npm install @atpdevelopment/openclaw-atp atp-sdk
# or
yarn add @atpdevelopment/openclaw-atp atp-sdk
```

**Python:**
```bash
pip install openclaw-atp
```

### Basic Usage (TypeScript)

```typescript
import { registerClawWithAtp, wrapSkillWithAtp, enforceAtpPoliciesForClawSession } from '@atpdevelopment/openclaw-atp';
import { ATPClient } from 'atp-sdk';

// Initialize with a security profile
const atp = new ATPClient({ baseUrl: 'https://api.atp.dev', profileId: 'openclaw-sandbox' });

// Register an OpenClaw agent with ATP identity
const { did, trustScore } = await registerClawWithAtp(atp, {
  name: 'trader-agent',
  capabilities: ['trading', 'analysis'],
  trustLevel: 'high'
});

// Secure tools with profile-based action gating
const secureTrade = wrapSkillWithAtp(tradeTool, atp, { actionType: 'network' });
const secureShell = wrapSkillWithAtp(shellTool, atp, { actionType: 'shell' });
const secureFs    = wrapSkillWithAtp(fileTool, atp, { actionType: 'filesystem' });

// Enforce session-state policies with profile
await enforceAtpPoliciesForClawSession(
  { state: 'executing', agentDid: did },
  atp,
  { profileId: 'openclaw-sandbox' }
);
```

### Basic Usage (Python)

```python
from openclaw.agents.langchain import ReActToolCallingOpenClawAgent
from openclaw_atp import (
    register_agent_with_atp,
    secure_tools,
    atp_protected_task,
    ATPClient
)

# Initialize ATP client
atp = ATPClient(base_url="https://atp.protocol")

# 1. Register agent with ATP identity
agent_meta = register_agent_with_atp(
    atp_client=atp,
    name="writer",
    role="content_writer",
    trust_level="verified"
)

# 2. Wrap tools with ATP security
raw_tools = [search_tool, write_tool, file_tool]
secure_tools_list = secure_tools(raw_tools, atp)

# 3. Create OpenClaw agent with ATP
writer = ReActToolCallingOpenClawAgent(
    name="writer",
    tools=secure_tools_list,
    metadata={"atp": agent_meta}
)

# 4. Create ATP-protected tasks
@atp_protected_task(
    required_trust=0.8,
    policy="finance_high_risk",
    data_classification="sensitive"
)
async def execute_trade():
    # Task implementation
    pass
```

### Advanced Usage

```python
from openclaw import OpenClaw
from openclaw.tasks import SimpleTask
from openclaw_atp import (
    validate_crew_with_atp,
    ATPPolicyProfile,
    ATPGraphValidator
)

# Create crew with multiple agents
crew = OpenClaw()
crew.add_agent(writer, [search_tool, write_tool])
crew.add_agent(trader, [market_tool, trade_tool])
crew.add_agent(reviewer, [read_tool, approve_tool])

# Define ATP policies
policy = ATPPolicyProfile(
    name="finance_workflow",
    inter_agent_rules={
        ("writer", "trader"): {"allowed": False},
        ("trader", "reviewer"): {"allowed": True, "data_types": ["trade_request"]}
    },
    workflow_constraints={
        "max_chain_depth": 5,
        "allow_cycles": False,
        "trust_threshold": 0.85
    }
)

# Validate crew graph with ATP before running
validator = ATPGraphValidator(atp, policy)
validation_result = validator.validate_crew(crew)

if not validation_result.is_valid:
    raise SecurityError(f"ATP validation failed: {validation_result.errors}")

# Run crew with ATP protection
crew.run()
```

##  Security Profiles

ATP includes built-in security profiles that control what agents can do. Profiles are enforced per-tool-call via `evaluateActionWithProfile`.

### Built-in Profiles

| Profile | Shell | Filesystem | Network | Best For |
| --- | --- | --- | --- | --- |
| `safe-default` | Blocked | Read-only | Internal only | Most agents |
| `dev-mode` | Allowed | Read + Write | All domains | Local dev |
| `enterprise-locked` | Blocked | Approved paths | Internal corp | Production |
| `openclaw-sandbox` | Blocked (allowlist: ls, cat, echo) | Sandbox paths | Internal + partners | OpenClaw agents |

### Profile-Based Tool Wrapping (TypeScript)

Every tool call goes through the profile before executing:

```typescript
import { wrapSkillWithAtp, enforceAtpPoliciesForClawSession } from '@atpdevelopment/openclaw-atp';
import { ATPClient } from 'atp-sdk';

const atp = new ATPClient({ baseUrl: 'https://api.atp.dev', profileId: 'openclaw-sandbox' });

// Map each tool to an ATP action type
const secureShell = wrapSkillWithAtp(rawShellTool, atp, { actionType: 'shell' });
const secureFs    = wrapSkillWithAtp(rawFsTool,    atp, { actionType: 'filesystem' });
const secureHttp  = wrapSkillWithAtp(rawHttpTool,  atp, { actionType: 'network' });
const secureCreds = wrapSkillWithAtp(rawCredsTool, atp, { actionType: 'credentials' });
const secureMsg   = wrapSkillWithAtp(rawMsgTool,   atp, { actionType: 'messaging' });

// Register secure tools instead of raw tools in your OpenClaw config
// ATP now decides per call: allow / deny / require_approval
```

### Session Enforcement with Profiles

```typescript
// Evaluate session-level policies with a profile
const result = await enforceAtpPoliciesForClawSession(
  { state: 'executing', agentDid: agent.did },
  atp,
  { profileId: 'openclaw-sandbox' }
);

console.log(result.allowedTools);     // ["filesystem", "network"] (if profile allows)
console.log(result.forbiddenTools);   // ["shell", ...]
console.log(result.requiresApproval); // ["credentials", "messaging"]
```

### OpenClaw Sandbox State Behavior

| State | Behavior |
| --- | --- |
| **planning** | No shell, no file writes, no outbound network. Analysis and reading only. |
| **executing** | Filesystem and network allowed. Shell only via allowlisted commands with approval. Credentials gated. |
| **communicating** | Internal messaging allowed. External send requires approval. |
| **completed** | Read-only: inspect logs/results, no further writes or network calls. |

### Configuration Profiles (Python)

```python
from openclaw_atp import ATPConfigProfile

# Strict development profile (safe defaults)
dev_profile = ATPConfigProfile.strict_dev()

# Production finance profile
finance_profile = ATPConfigProfile.production_finance(
    min_trust=0.95,
    require_mfa=True,
    audit_level="full"
)

# PII-heavy workflow profile
pii_profile = ATPConfigProfile.pii_workflow(
    data_encryption=True,
    retention_days=90,
    compliance=["GDPR", "CCPA"]
)
```

##  Integration Points

### 1. Agent Registration

Every OpenClaw agent gets:
- Quantum-safe DID (Decentralized Identifier)
- Ed25519 + Dilithium key pair
- Initial trust score (0.0 - 1.0)
- Policy profile assignment

### 2. Tool Call Interception

ATP intercepts all tool calls to:
- **Evaluate security profile** (`evaluateActionWithProfile`) for the action type and session state
- Verify agent authentication
- Check policy permissions
- Log actions for audit
- Update trust scores
- Block unauthorized access (deny) or require human approval (require_approval)

### 3. Task Security Metadata

Attach to any `SimpleTask`:
- `required_trust`: Minimum trust score
- `policy`: Required policy set
- `data_classification`: PII, financial, public
- `sensitivity_level`: low, medium, high, critical

### 4. Graph Validation

Before `crew.run()`:
- Validate agent-to-agent connections
- Check data flow permissions
- Enforce depth/fan-out limits
- Detect policy violations

### 5. Observability → Trust Engine

Stream from Lunary:
- Error rates per agent
- Tool misuse patterns
- Latency anomalies
- Call volume spikes

ATP automatically:
- Adjusts trust scores
- Triggers workflows (alerts, blocks)
- Updates access policies

### 6. External Service Protection

ATP-managed connectors for:
- **HTTP APIs**: Allow-lists, DLP checks
- **Databases**: Query validation, row-level security
- **File Systems**: Path restrictions, content scanning
- **Secrets**: Short-lived, scoped credentials

##  Monitoring & Metrics

```python
from openclaw_atp import ATPMonitor

monitor = ATPMonitor(atp)

# Real-time trust scores
trust_scores = monitor.get_agent_trust_scores()

# Policy violations
violations = monitor.get_policy_violations(since="24h")

# Tool usage stats
stats = monitor.get_tool_usage_stats(agent_name="trader")

# Security events
events = monitor.get_security_events(severity="high")
```

##  Testing

```python
# Test ATP integration
python -m openclaw_atp.test

# Validate specific crew
from openclaw_atp import test_crew_security
test_crew_security(crew, atp_client)
```

##  API Reference

### Core Functions

- `registerClawWithAtp(atpClient, config)` - Register an OpenClaw agent; returns DID, keys, and trust score
- `wrapSkillWithAtp(skill, atpClient, options)` - Secure a skill with auth, profile evaluation, rate-limit, and audit. Pass `actionType` to enable profile-based gating.
- `enforceAtpPoliciesForClawSession(ctx, atpClient, options)` - Evaluate tool permissions for a session state. Pass `profileId` to use profile-based enforcement.
- `secureTools(tools, atpClient, config)` - Batch-wrap multiple tools at once
- `register_agent_with_atp(client, name, role, trust_level)` - Register agent identity (Python)
- `secure_tools(tools, client)` - Wrap tools with ATP security (Python)
- `atp_protected_task(required_trust, policy, data_classification)` - Decorator for tasks (Python)
- `validate_crew_with_atp(crew, client, policy)` - Validate agent graph

### Classes

- `ATPOpenClawAgent` - Base agent class with ATP identity
- `ATPToolWrapper` - Security wrapper for tools
- `ATPGraphValidator` - Graph validation engine
- `ATPPolicyProfile` - Policy configuration
- `ATPMonitor` - Monitoring and metrics
- `ATPLunaryExporter` - Lunary → ATP bridge

##  Quick Agent Setup

The fastest way to get started with an OpenClaw agent is:

```bash
npx create-atp-agent my-openclaw-agent
cd my-openclaw-agent
npm install
npm start
```

The CLI scaffolds an **ESM** project (Node 18+), then opens an embedded onboarding UI at **`http://127.0.0.1:3456`** by default (`--no-dashboard` to skip). In the wizard, choose **OpenClaw** as the runtime and **`openclaw-sandbox`** (or your profile) for security. Agents run in **standalone mode** without backend services until you connect ATP services.

##  Security Best Practices

1. **Always validate crew graphs** before production runs
2. **Use strict profiles** for development and testing
3. **Set appropriate trust thresholds** per task sensitivity
4. **Enable full audit logging** for compliance requirements
5. **Rotate credentials** via ATP secret management
6. **Monitor trust score changes** and investigate drops
7. **Test policy violations** before deploying workflows

##  Support

- **Documentation**: https://github.com/agent-trust-protocol/atp-core/tree/main/docs/openclaw
- **Issues**: https://github.com/agent-trust-protocol/core/issues
- **Discord**: https://discord.gg/atp
- **Email**: support@atp.protocol

##  Releasing

Publishing is automated via the [npm-publish workflow](https://github.com/agent-trust-protocol/atp-core/actions/workflows/npm-publish.yml). Both `atp-sdk` and `@atpdevelopment/openclaw-atp` are published together on every version tag.

```bash
# Bump version in package.json, then:
git tag v1.0.1
git push origin v1.0.1
```

The workflow builds, tests, and publishes automatically. For a dry run (no actual publish), use **Actions → Publish to npm → Run workflow** with `dry_run` enabled.

##  License

Apache-2.0 - see [LICENSE](./LICENSE)

##  Credits

Built on top of:
- [OpenClaw](https://github.com/ShoggothAI/openclaw) - Multi-agent orchestration
- [ATP SDK](https://github.com/agent-trust-protocol/sdk) - Agent Trust Protocol
- [LangChain](https://github.com/langchain-ai/langchain) - LLM framework

---

**Made with  by the Agent Trust Protocol™ Team**
