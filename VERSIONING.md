# ATP Versioning Policy

This document defines the versioning strategy and package status for the Agent Trust Protocol ecosystem.

## Package Status Overview

| Status | Badge | Description |
|--------|-------|-------------|
| **Production** | ![Stable](https://img.shields.io/badge/status-stable-green) | Ready for production use. Follows semver. API stability guaranteed. |
| **Legacy** | ![Legacy](https://img.shields.io/badge/status-legacy-orange) | Superseded by newer packages. Maintenance mode only. Migration recommended. |
| **Development** | ![Development](https://img.shields.io/badge/status-development-yellow) | Actively developed. APIs may change. Not recommended for production. |
| **Experimental** | ![Experimental](https://img.shields.io/badge/status-experimental-red) | Early stage. Unstable. For testing only. |

---

## Production Packages

### `atp-sdk` (v1.2.1) - PRIMARY SDK

**Status:** ![Stable](https://img.shields.io/badge/status-stable-green)

The official ATP SDK for TypeScript/JavaScript. This is the **only recommended package** for building ATP-enabled applications.

```bash
npm install atp-sdk
```

**Features:**
- Quantum-safe cryptography (ML-DSA + Ed25519)
- Decentralized Identity (DID)
- Trust scoring
- Verifiable credentials
- Payment protocols (AP2/ACP)
- Zero-knowledge authentication

**Semver Policy:**
- MAJOR: Breaking API changes
- MINOR: New features, backward compatible
- PATCH: Bug fixes, security patches

---

### `@atpdevelopment/openclaw-atp` (v1.0.1)

**Status:** ![Stable](https://img.shields.io/badge/status-stable-green)

Official OpenClaw integration for multi-agent systems.

```bash
npm install @atpdevelopment/openclaw-atp atp-sdk
```

---

## Legacy Packages

### `atp-core` (v1.0.0)

**Status:** ![Legacy](https://img.shields.io/badge/status-legacy-orange) - **Superseded by `atp-sdk`**

**⚠️ DEPRECATED:** This package is no longer maintained. Use `atp-sdk` instead.

`atp-core` was the initial minimal implementation. All functionality has been migrated to the more complete `atp-sdk`.

**Migration:**
```diff
- import { Agent } from 'atp-core';
+ import { Agent } from 'atp-sdk';
```

---

## Development Packages (0.x)

All packages at version `0.x` are in active development. APIs may change without notice.

| Package | Version | Description |
|---------|---------|-------------|
| `@atp/identity-service` | 0.1.0 | DID-based identity service |
| `@atp/audit-logger` | 0.1.0 | Audit logging service |
| `@atp/monitoring-service` | 0.1.0 | Metrics and monitoring |
| `@atp/payment-service` | 0.1.0 | Payment protocol service |
| `@atp/permission-service` | 0.1.0 | Access control service |
| `@atp/rpc-gateway` | 0.1.0 | RPC gateway |
| `@atp/vc-service` | 0.1.0 | Verifiable credentials |
| `@atp/session-sync-mcp` | 0.1.0 | MCP session synchronization |
| `@atp/shared` | 0.1.0 | Shared utilities |
| `atp-ui-modern` | 0.1.0 | Next.js UI (monorepo root) |

**These packages:**
- Are **not** published to npm (private)
- Are intended for ATP infrastructure development
- May have breaking changes
- Should only be used if you're contributing to ATP core infrastructure

---

## Version Guidelines

### Choosing the Right Package

**For Application Developers:**
```bash
# Use this - the only production SDK
npm install atp-sdk
```

**For OpenClaw Multi-Agent Systems:**
```bash
npm install atp-sdk @atpdevelopment/openclaw-atp
```

**For ATP Infrastructure Development:**
- Clone the monorepo
- Use workspace commands
- Expect breaking changes

### Semantic Versioning

We follow [Semantic Versioning 2.0.0](https://semver.org/):

- **MAJOR (X.y.z):** Incompatible API changes
- **MINOR (x.Y.z):** New functionality, backward compatible
- **PATCH (x.y.Z):** Bug fixes, backward compatible

**Pre-1.0 packages (0.x):** Minor versions may include breaking changes.

### Release Channels

| Channel | Version Format | Use Case |
|---------|---------------|----------|
| Latest | `X.Y.Z` | Production use |
| Beta | `X.Y.Z-beta.N` | Pre-release testing |
| Alpha | `X.Y.Z-alpha.N` | Early access, experimental |

---

## Deprecation Policy

1. **Legacy packages** receive security patches only
2. **Deprecation notices** are posted 6 months before removal
3. **Migration guides** are provided for all breaking changes
4. **Old packages** remain on npm but are marked deprecated

---

## Questions?

- [GitHub Discussions](https://github.com/agent-trust-protocol/core/discussions)
- [Issues](https://github.com/agent-trust-protocol/core/issues)
- Email: dev@agenttrustprotocol.com
