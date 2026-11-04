# ATP ecosystem security: scope and integration requirements

ATP is designed to provide identity, trust evidence and authorization across heterogeneous
agent systems. Coverage depends on the exact adapter and enforced action boundary.

The previous universal-support examples overstated implementation coverage. Use the
[protocol support matrix and ANP roadmap](PROTOCOL-SUPPORT.md) for current evidence.

Protocol discovery and message translation do not prove identity, confer authority, persist
audit evidence or secure actions outside an adapter. An integration must verify current
identity and authority, enforce the decision before execution, preserve native permissions,
and test bypass, replay, revocation and failure behavior.

The SDK protocol base intentionally fails closed when signing, verification or persistent
audit implementations are absent. Its MCP monitor is synthetic experimental infrastructure.
Do not use it as live production telemetry or as an authorization gate.

ATP Core and ATP Studio have separate release and deployment lifecycles. Studio support
requires its own server-owned adapter, enforcement tests and deployment evidence.
