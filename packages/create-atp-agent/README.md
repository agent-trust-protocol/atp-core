# create-atp-agent

**Bootstrap a quantum-safe AI agent in under 60 seconds** with an embedded onboarding dashboard.

[![npm version](https://badge.fury.io/js/create-atp-agent.svg)](https://www.npmjs.com/package/create-atp-agent)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## One Command Setup

```bash
npx create-atp-agent
```

That's it. This will:

1. Ask for your agent name
2. Scaffold a ready-to-run project (`agent.ts`, `package.json`, `README.md`)
3. Launch an **embedded onboarding dashboard** in your browser at `http://localhost:3456`
4. Generate a quantum-safe DID locally (no backend services required)

## Embedded Onboarding Dashboard

After scaffolding, a local web server starts automatically and opens a step-by-step onboarding wizard in your browser:

- **Step 1: Runtime** - Select your agent runtime (OpenClaw, MCP, LangChain, ADK, or custom)
- **Step 2: Agent Name** - Pre-filled from your CLI input
- **Step 3: Security Profile** - Choose from 4 built-in profiles (`safe-default`, `dev-mode`, `enterprise-locked`, `openclaw-sandbox`)
- **Step 4: Confirm** - Review your configuration and complete registration

The dashboard uses a dark-mode UI matching the ATP web application design. No external dependencies needed - runs entirely on Node.js built-ins.

## What Gets Created

```
my-agent/
  |-- agent.ts         <- your agent (runs offline!)
  |-- package.json
  |-- README.md
```

## Standalone Mode (Offline-First)

The generated agent works immediately without any backend services:

```typescript
import { Agent } from 'atp-sdk';

// One line — creates agent and prints status automatically
await Agent.quickstart('MyAgent');
// ⚡ MyAgent ready!
//   DID:          did:atp:a1b2c3...
//   Quantum-safe: yes
//   Mode:         standalone (local)
```

When ATP services aren't running, `Agent.create()` automatically falls back to **standalone mode**:
- DID is generated locally from the cryptographic keypair
- All quantum-safe crypto works offline
- No 30-second timeout, no crash, no errors

When you're ready for full features (trust scoring, verifiable credentials, identity registration), start the ATP services with `docker-compose up -d`.

## Security Profiles

Each profile defines what your agent can and cannot do:

| Profile | Shell | Filesystem | Network | Best For |
| --- | --- | --- | --- | --- |
| `safe-default` | Blocked | Read-only | Internal only | Most agents |
| `dev-mode` | Allowed | Read + Write | All domains | Local development |
| `enterprise-locked` | Blocked | Approved paths | Internal corp | Production |
| `openclaw-sandbox` | Allowlist only | Sandbox paths | Internal + partners | OpenClaw agents |

## CLI Commands

```bash
# Scaffold a new agent (interactive)
npx create-atp-agent

# Alternative alias
npx atp-init

# Onboard an existing agent via CLI wizard
npx atp-onboard-agent
```

## Requirements

- Node.js 18+
- npm 7+

## Next Steps After Setup

```bash
cd my-agent
npm install
npm start
```

Then:
- Visit the onboarding dashboard at `http://localhost:3456` to configure your security profile
- Run `docker-compose up -d` from the atp-core repo for full network features
- Read the [ATP SDK docs](https://github.com/agent-trust-protocol/atp-core/tree/main/docs)

## License

Apache-2.0

---

**Agent Trust Protocol** - The security layer for AI agents. Built by [Sovr INC](https://agenttrustprotocol.com).
