# Changelog

All notable changes to Agent Trust Protocol (ATP) are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
