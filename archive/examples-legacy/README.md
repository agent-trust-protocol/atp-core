# Legacy examples (archived)

These examples target the older ATP service-client API. Most of them need the local ATP microservices running, and none is maintained, built or tested in CI. Their lockfiles were removed when they were archived, so installing them resolves current dependency versions and may not work as originally written.

| Directory | What it was |
| --- | --- |
| `advanced-agents/` | Multi-agent communication examples on the service-client API |
| `simple-agent/` | Weather and calculator agents |
| `demo-workflow/` | Interactive demo built on `simple-agent` |
| `atp-case-study/` | Case-study test harness built on `advanced-agents` and `simple-agent` |

For current, maintained starting points, use:

- [`examples/action-boundary`](../../examples/action-boundary): a local, no-API-key demo of allow, approval and deny at a tool boundary.
- [`atp-hermes-hook`](../../packages/hermes-hook): a fail-closed Hermes Agent `pre_tool_call` hook, published on npm.
- [`create-atp-agent`](../../packages/create-atp-agent): scaffold a starter project on `atp-sdk` 4.
