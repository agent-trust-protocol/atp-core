# ATP OpenClaw adapter (legacy example)

This package explores how an OpenClaw runtime can call ATP identity, policy, and audit utilities. It is an **optional legacy adapter**, not an architectural dependency of ATP Core. Start new integrations with [`atp-sdk`](https://github.com/agent-trust-protocol/atp-core/tree/main/packages/sdk), [`@atpdeveloper/did-atp`](https://github.com/agent-trust-protocol/atp-core/tree/main/packages/did-atp), and [`atp-profiles`](https://github.com/agent-trust-protocol/atp-core/tree/main/packages/atp-profiles).

## Scope

The source exports agent registration helpers, tool wrappers, session policy evaluation, graph validation, and connector examples. Review each module and its tests before using it. A wrapper only protects calls routed through it; the host must enforce returned policy decisions and preserve audit evidence. This repository does not claim that installing the adapter secures every OpenClaw tool, stores production secrets, or provides a hosted trust service.

The package manifest currently includes a local `file:../sdk` dependency. Verify packaging and installation in your environment before relying on a registry release. No Python package is supplied by this directory.

## Explore the implementation

- [Exports](https://github.com/agent-trust-protocol/atp-core/blob/main/packages/openclaw-atp/src/index.ts)
- [Session policy adapter](https://github.com/agent-trust-protocol/atp-core/tree/main/packages/openclaw-atp/src/session)
- [ATP Core contribution guide](https://github.com/agent-trust-protocol/atp-core/blob/main/CONTRIBUTING.md)

If you maintain an OpenClaw integration, contribute a reproducible tool or session case and document the enforcement boundary. ATP complements OpenClaw, MCP, A2A, ANP, ADK, and other agent systems.

ATP specifications are W3C Community Group drafts, not W3C Standards. Agent Trust Protocol™ is a trademark of Sovr INC.
