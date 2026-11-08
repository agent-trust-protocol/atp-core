# Legacy protocol monitoring security boundary

The protocol monitoring helpers are diagnostic infrastructure. Their output is not a
grant to execute a tool, a signed mandate, or proof of current authorization.

The previous implementation produced a plain SHA-256 digest in an event's `signature`
field, accepted that digest as a signature, assigned reputation from a protocol name,
and allowed required permissions without checking an authority source. A digest is
publicly reproducible; it cannot authenticate a sender.

Until trusted providers are implemented:

- `UniversalMonitor` fails an event through its error channel when signing is enabled.
  It emits no purported signed event. Its default still requires signing, so callers
  cannot silently downgrade to unsigned telemetry.
- Explicit unsigned diagnostic mode (`enableSigning: false`) assigns no trust evidence.
  Emitted events carry no `trustScore` (unscored), even when the sender self-reported a
  high score. Unscored is deliberately not reported as `0`, which would read as a score.
- `SecurityEnforcer` denies when signatures, permissions, quantum-safe verification,
  or a positive trust threshold are required. Invalid thresholds also deny.
- With every verification requirement explicitly disabled and threshold zero, its
  `ALLOW` result means only that diagnostic filtering is disabled. It never permits
  execution at a protected resource.

Compatibility: consumers depending on placeholder signing, hash verification,
protocol-based reputation, or permissive permission defaults now fail closed. Do
not turn off required security merely to restore an ALLOW result. Wire a reviewed
identity/authority decision into the actual protected operation instead.

Core PR #164 separately hardens `BaseProtocolAdapter` defaults and labels synthetic
MCP events. Both changes need review before release. Neither implements real MCP or
ANP authorization interoperability, nor changes ATP Studio behavior or infrastructure.

Regression coverage: `packages/sdk/src/__tests__/protocols/monitoring-fail-closed.test.ts`.
It exercises the former hash-forgery acceptance path, required permissions and
quantum-safe checks, self-reported trust, malformed and fractional thresholds, configuration updates,
unavailable signing, and explicit unsigned diagnostic mode.
