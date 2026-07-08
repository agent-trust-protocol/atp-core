# Changelog

All notable changes to Agent Trust Protocol (ATP) are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Changed
- **BREAKING (audit-logger): audit integrity hash redefined.** The per-event
  SHA-256 integrity hash and HMAC signature are now computed over a stable,
  storage-independent field set (`id`, `timestamp`, `source`, `action`,
  `resource`, `actor`, `details`, `previousHash`) and no longer include the
  storage-managed `nonce` and `blockNumber` fields. This makes
  `AuditService.verifyIntegrity()` recompute hashes consistently across all
  backends (previously the Postgres backend stored `nonce` as NULL and assigned
  `block_number` via a stored procedure, so recomputation diverged from the
  stored hash). Event ordering remains bound cryptographically by `previousHash`.

  **Migration:** audit events written before this change will be reported as
  tampered the first time `verifyIntegrity()` runs after upgrade (this affects
  in-memory and SQLite deployments that persisted real `nonce` values; existing
  Postgres chains were already inconsistent). Treat the upgrade as a hash-chain
  boundary: archive/seal the pre-upgrade chain and start a fresh chain, or
  re-anchor as appropriate for your deployment. No automatic re-hash is performed.

### Fixed
- `AuditService.verifyIntegrity()` now performs full content + linkage
  verification instead of delegating to `storage.verifyChain()` (which only
  checked `previousHash` linkage), so content tampering of an entry that still
  links correctly is now detected.
- **atp-sdk: standalone-mode crash on `send()`, `establishTrust()`, and the ZKP
  auth methods (`requestAuth`, `respondToChallenge`, `verifyAuthResponse`).**
  `Agent.quickstart()` correctly falls back to standalone mode when no ATP
  services are reachable, but these methods still made unguarded audit-log
  calls that threw `ATPNetworkError` (`ECONNREFUSED`) the moment they ran,
  crashing the README quick-start example on first use. Added a
  `recordAudit()` helper that writes to a local in-memory audit trail instead
  of throwing when standalone (or when the audit service is otherwise
  unreachable); `getTrustScore()` now scores from that local trail in
  standalone mode. This fix is currently only on the unpublished SDK version
  in this repo — the published `atp-sdk@1.2.5` on npm still has the bug and
  should get this fix backported as a `1.2.6` patch release.
- Fixed 5 broken documentation links in `README.md`: Multi-Protocol Support
  and Troubleshooting now point at the docs that actually exist
  (`packages/sdk/docs/MULTI-PROTOCOL-SUPPORT.md`,
  `docs/TROUBLESHOOTING-GUIDE.md`); the `identity-service`,
  `permission-service`, and `audit-logger` deployment links now point at the
  package directories since those packages have no README yet.

## [1.1.0] - 2026-03-27

### Added
- ATP by Sovr INC trademark branding across all user-visible surfaces
- Interactive demos embedded on homepage (QuantumSafeSignatureDemo,
  TrustLevelManagementDemo, PerformanceMetricsPreview)
- Invite-only access wall with waitlist and invite code system
- npm publish CI/CD workflows for atp-sdk and openclaw-atp packages
- CODE_OF_CONDUCT.md (Contributor Covenant)
- GitHub PR template (.github/pull_request_template.md)
- OpenClaw adapter v1.1.0 (Motleycrew to OpenClaw rebrand)
- Magic link authentication with proper error handling
- Next.js 16 compatibility (Turbopack, removed deprecated config options)
- ML-DSA (Dilithium) + Ed25519 hybrid quantum-safe cryptography by default
- Simplified `Agent.create()` one-liner for quantum-safe agent creation
- `isQuantumSafe()` method for checking agent crypto capabilities

### Changed
- CLAUDE.md restructured with project architecture and monorepo package map
- Demo components wired up replacing all "coming soon" placeholders
- Access-approved email updated to passwordless magic link flow
- Copyright updated to 2026 Sovr INC
- Root directory reorganized: 50+ loose files moved to proper directories

### Fixed
- Audit Service default port (3005) across all documentation
- Package naming inconsistencies
- Broken documentation links (docs.atp.dev replaced with GitHub docs path)
- Error messages for missing services improved

### Security
- Removed exposed API keys from config files and documentation
- .npmrc added to .gitignore to prevent accidental token commits
- IDE config directories (.cursor, .giga, .vscode) untracked from git
- All key rotation defaults to every 24h

## [1.0.0] - 2025-06-12

### Added
- Initial release of Agent Trust Protocol by Sovr INC
- Decentralized Identity (DID) registration and resolution
  using `did:atp:<hash>` format (W3C compliant)
- Verifiable Credentials (VC) issuance and verification
- Ed25519 cryptographic signatures on all agent actions
- Trust scoring system: multi-factor weighted (0.0-1.0 scale)
- SQLite-backed append-only audit logging
- JSON-RPC over WebSocket with mTLS authentication
- Docker Compose service orchestration
- LangChain security wrapper (atp-sdk/langchain)
- MCP server integration (atp-sdk/mcp)
- Apache 2.0 open-source license

[1.1.0]: https://github.com/agent-trust-protocol/atp-core/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/agent-trust-protocol/atp-core/releases/tag/v1.0.0
