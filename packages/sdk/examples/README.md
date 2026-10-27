# atp-sdk examples

Build the SDK first (`npm run build` in `packages/sdk`), then run any example with `node`.

## Run without ATP services

| Example | Shows |
| --- | --- |
| `00-quickstart.js` | Create a standalone agent and print its `did:atp` identifier |
| `00-quickstart-local.js` | Generate a did:atp v2 and hybrid key pair with `DidAtp.generate` |
| `11-quantum-safe-demo.js` | Hybrid Ed25519 + ML-DSA-65 signing and verification, including tamper rejection |
| `12-zkp-agent-authentication.js` | Challenge/response identity and behavior proofs, and mutual authentication (experimental) |
| `09-multi-protocol-support.js` | Protocol detection for MCP, Swarm, ADK and A2A agents (`EXAMPLE=all`) |
| `simple-3-line.ts` | The three-line agent API (`npx tsx simple-3-line.ts`) |

`npm run examples` runs every example in this table except `simple-3-line.ts` and fails if any of them fails. It runs before each publish.

## Need ATP services

These call the identity, credentials, permissions, audit and gateway services. Without services they report the unavailable ones and exit.

| Example | Shows |
| --- | --- |
| `01-basic-setup.js` | `ATPClient` configuration and service connectivity checks |
| `10-monitoring-health.js` | Gateway health and connection statistics |

Point them at your services with `ATP_GATEWAY_URL`, `ATP_IDENTITY_URL`, `ATP_CREDENTIALS_URL`, `ATP_PERMISSIONS_URL` and `ATP_AUDIT_URL`.

## Security profiles

For enforcing `atp-profiles` decisions around real tool calls, see the repository's
[`examples/action-boundary`](../../../examples/action-boundary) and
[`examples/hermes-hook`](../../../examples/hermes-hook).
