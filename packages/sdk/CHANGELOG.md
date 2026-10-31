# Changelog

All notable changes to the ATP™ SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0] - 2026-10-31

Requires `atp-profiles@^3.0.0`.

### Added

- `evaluateActionWithProfile` is exported from `atp-sdk`, so the documented
  profile evaluator no longer needs a separate `atp-profiles` import.

### Changed (BREAKING)

- **`dev-mode` no longer allows unrecognized actions.** They return
  `require_approval` (reason `unknown_action_type`) instead of `allow`. No
  built-in profile now allows an unrecognized action. To keep the old
  behaviour locally, use `{ ...DEV_MODE_PROFILE, unknown_action: 'allow' }`.
- **Node.js 20 or newer is required** (`engines` was `>=18.0.0`). On Node.js 18,
  `Agent.quickstart()` and `DidAtp.generate()` fail with
  `Cannot read properties of undefined (reading 'getRandomValues')` because
  `globalThis.crypto` is not available there.

### Changed

- `@atpdeveloper/did-atp` is pinned to `0.1.1` (was `0.1.0`). 0.1.1 changes only
  its README and raises the `@noble/hashes` floor to `^1.8.0`.

### Fixed

- `evaluateActionWithProfile` denies a missing, unknown or malformed profile
  (reason `unknown_profile`). It threw a `TypeError` before, for example for
  `evaluateActionWithProfile(BUILTIN_PROFILES['typo'], context)`.

## [3.0.0] - 2026-10-26

### Changed (BREAKING)

- **Security profiles fail closed** (requires `atp-profiles@^2.0.0`). An
  `actionType` that is not a control category or named by the active state's
  policy now returns `deny` with reason `unknown_action_type`, instead of
  `allow`. Typos such as `Shell` or raw tool names no longer bypass controls.
  Profiles can opt out with `unknown_action`; only `dev-mode` does.
- **`Agent.mutualAuth()` no longer reports unverified success.** It previously
  returned `theyVerified: { verified: true, trustEstablished: true }` without
  verifying anything. Both results are now unverified, and the method returns
  the `challenge` and `response` it created. It is deprecated; run two explicit
  `requestAuth` / `respondToChallenge` / `verifyAuthResponse` exchanges instead.
- **`ATPClient.evaluateActionWithProfile()` denies when no profile is set.** It
  previously returned `allow` when neither `config.profileId`, `setProfile()`
  nor a `profileId` argument supplied a profile.

### Fixed

- `Protocol` is exported as a runtime enum. It was type-only, so
  `import { Protocol } from 'atp-sdk'` failed.
- `VERSION` and `SDK_INFO.version` report the package version (were `2.0.0`).
- Removed the unused `zod` dependency, which carried GHSA-mrhx-c7xc-m3w5.
- Offline examples (00, 09, 11, 12) run against the v2+ API and are checked
  before publish by `npm run examples`. Service-backed v1 examples moved to
  `examples-legacy-v1/` and are no longer published.
- Docs use the `atp-sdk` package name and current `DidAtp` / `CryptoUtils` APIs.

## [2.0.0] - 2026-06-11

### Changed (BREAKING)

- **did:atp v2 identifier format**: `did:atp:<host>[:<path>…]:e1_…:pq1_…`
  replaces v1 `did:atp:<network>:<fingerprint>`, aligning with the did:atp
  Community Group draft. No conversion from v1 exists — see
  [MIGRATION.md](./MIGRATION.md).
- **Split hybrid key pairs**: `HybridKeyPair` is now `{ ed25519, mlDsa65 }`
  (independent key pairs) instead of a composite blob.
- **ML-DSA-65 (FIPS 204)** replaces draft Dilithium naming throughout;
  signatures are 3309 bytes.
- **Fingerprints are RFC 7638 JWK SHA-256 thumbprints** (`e1_`/`pq1_` +
  43 base64url chars), replacing the v1 truncated fingerprint.
- **Key rotation changes the DID** (the DID binds the key thumbprints);
  deactivation is supported via DID document metadata.

### Added

- `DidAtp`, `DidAtpDocument`, `DidAtpResolver` utilities; JCS canonicalization
  (`jcsCanonicalize`); Data Integrity proofs with PQ proof support.
- `MIGRATION.md` documenting the v1 → v2 break.

## [1.0.0] - 2024-06-28

### Added

#### Core Features
- **ATPClient**: Main SDK client providing unified access to all ATP services
- **Service Clients**: Dedicated clients for Identity, Credentials, Permissions, Audit, and Gateway services
- **Authentication**: Multiple authentication methods including DID-based auth, JWT tokens, and MFA
- **TypeScript Support**: Complete TypeScript definitions and type safety

#### Identity Management
- DID generation, registration, and resolution
- Multi-factor authentication (TOTP, SMS, Email)
- Trust level management and verification
- Cryptographic key rotation and recovery
- Identity metadata and status management

#### Verifiable Credentials
- Credential schema creation and management
- Verifiable credential issuance and verification
- Verifiable presentation creation and validation
- Credential lifecycle management (suspend, revoke, reactivate)
- Credential status checking and revocation lists

#### Permissions & Access Control
- Policy-based access control (PBAC)
- Fine-grained permission management
- Capability token delegation
- Real-time access decision evaluation
- Permission analytics and audit trails

#### Audit & Compliance
- Comprehensive audit event logging
- Blockchain anchoring for immutable audit trails
- Advanced audit query and search capabilities
- Compliance reporting and data export
- Audit chain integrity verification

#### Real-time Features
- WebSocket event streaming with auto-reconnection
- Real-time security monitoring and alerts
- Service health monitoring and status checking
- Event filtering and processing
- Circuit breaker patterns for resilience

#### Developer Experience
- **Examples**: 7 comprehensive examples covering all major features
- **Documentation**: Complete API reference and implementation guides
- **Error Handling**: Structured error types with detailed error information
- **Testing**: Comprehensive test utilities and mocking support
- **Performance**: Connection pooling, caching, and batch operations

#### Utility Classes
- **CryptoUtils**: Ed25519 cryptographic operations, hashing, and key management
- **DIDUtils**: DID generation, parsing, validation, and document management
- **JWTUtils**: JWT creation, verification, and token lifecycle management

#### Configuration & Setup
- Environment-based configuration management
- Quick configuration helpers for development
- Production-ready security configurations
- Service discovery and load balancing support

### Technical Specifications
- **Node.js**: Requires Node.js 18+ with ES modules support
- **TypeScript**: Built with TypeScript 5.0+ for type safety
- **Dependencies**: Minimal dependencies with security-focused choices
- **Bundle Size**: Optimized for both browser and Node.js environments
- **Performance**: Designed for high-throughput production environments

### Security Features
- **End-to-End Encryption**: All communications use TLS/SSL
- **Signature Verification**: Cryptographic verification of all operations
- **Rate Limiting**: Built-in rate limiting and circuit breaker patterns
- **Input Validation**: Comprehensive input validation and sanitization
- **Secret Management**: Secure handling of private keys and tokens

### Standards Compliance
- **W3C DID Core**: Full compliance with W3C DID specification
- **W3C Verifiable Credentials**: Complete VC data model implementation
- **RFC 7519**: JWT token handling according to RFC standards
- **Security Best Practices**: Following OWASP and industry security guidelines

---

## [1.1.0] - 2024-12-20

### 🎉 Major Release: Quantum-Safe by Default

This release makes ATP the first SDK to enable quantum-safe cryptography by default, protecting AI agents from both current threats and future quantum computing attacks.

### Added

#### Quantum-Safe Cryptography (Default)
- **Hybrid ML-DSA + Ed25519**: All new agents automatically use hybrid quantum-safe cryptography
- **ML-DSA (Dilithium Successor)**: NIST-standardized post-quantum signatures enabled by default
- **Backward Compatible**: Existing Ed25519-only keys continue to work
- **Zero Configuration**: Quantum-safe keys generated automatically with `Agent.create()`

#### Enhanced Agent Class
- **Simplified API**: `Agent.create()` method for instant agent creation
- **Quantum-Safe Detection**: `isQuantumSafe()` method to check agent crypto status
- **Default Security**: All new agents use quantum-safe crypto without extra setup

#### Developer Experience
- **Quick Start Options**: Works immediately without services (basic mode) or with full ATP services
- **Better Error Messages**: Clear guidance when services aren't running
- **Local Testing**: `00-quickstart-local.js` for testing without network

#### Examples & Documentation
- **Quantum-Safe Demo**: `examples/11-quantum-safe-demo.js` showcases hybrid crypto
- **Integration Tests**: `test-integration-quantum-safe.js` for end-to-end validation
- **Quick Start Guide**: New `/docs/QUICK-START.md` for 30-second onboarding
- **API Surface Documentation**: Stable API documentation for developers

### Changed

#### Breaking Changes
- **None**: This release is fully backward compatible

#### Default Behavior
- **Quantum-Safe Default**: New agents use hybrid ML-DSA + Ed25519 by default
- **Key Generation**: `CryptoUtils.generateKeyPair()` now generates hybrid keys by default
- **Package Name**: Consistent `atp-sdk` naming across all documentation

### Security

- **NIST PQC Standard**: ML-DSA (CRYSTALS-Dilithium successor) implementation
- **Hybrid Mode**: Combines classical Ed25519 with post-quantum ML-DSA
- **Future-Proof**: Protection against both current and future quantum attacks
- **Cryptographic Signatures**: All operations use quantum-safe signatures when available

### Performance

- **Minimal Overhead**: ~44% overhead compared to Ed25519-only (15ms vs 10ms verification)
- **Optimized Hybrid Mode**: Efficient combination of classical and post-quantum algorithms
- **Backward Compatible**: Ed25519-only mode still available for performance-critical use cases

### Documentation

- **Developer-First**: Restructured README with "Get Started in 30 Seconds"
- **Quick Start Guide**: Dedicated guide for immediate onboarding
- **API Reference**: Complete API surface documentation
- **Migration Guide**: Clear upgrade path from v1.0.0

### Fixed

- **Audit Service Port**: Corrected default port to 3005 across all documentation
- **Package Naming**: Unified to `atp-sdk` (unscoped) across all docs
- **Documentation Links**: Fixed broken links in README and docs
- **SDK Metadata**: Updated internal package references

### Migration from v1.0.0

**No changes required!** This release is fully backward compatible. Existing code continues to work.

**To enable quantum-safe for new agents:**
```typescript
// Old way (still works)
const agent = new Agent('name');
await agent.initialize();

// New way (quantum-safe by default)
const agent = await Agent.create('name'); // Quantum-safe automatically!
```

**To check quantum-safe status:**
```typescript
const agent = await Agent.create('name');
console.log(agent.isQuantumSafe()); // true
```

---

## [1.2.0] - 2024-12-23

### 🔐 Zero-Knowledge Proof Agent Authentication

This release introduces Zero-Knowledge Proof (ZKP) based agent-to-agent authentication, enabling agents to prove their identity and capabilities without revealing sensitive information.

### Added

#### Zero-Knowledge Proof System
- **ZKP Authentication**: `ZKPUtils` class for creating and verifying zero-knowledge proofs
- **Agent-to-Agent Auth**: Prove identity without revealing private keys
- **Challenge-Response Protocol**: Secure interactive authentication
- **Selective Disclosure**: Prove specific attributes without revealing full credentials
- **Trust Level Verification**: Prove minimum trust levels without exposing exact scores

#### New API Methods
- `ZKPUtils.generateChallenge()`: Create cryptographic challenges
- `ZKPUtils.createProof()`: Generate ZKP proofs
- `ZKPUtils.verifyProof()`: Verify ZKP proofs
- `ZKPUtils.createIdentityProof()`: Agent identity proofs
- `ZKPUtils.createCapabilityProof()`: Capability possession proofs
- `ZKPUtils.createTrustLevelProof()`: Trust level range proofs

#### Examples & Documentation
- **Example 12**: `12-zkp-agent-authentication.js` - Complete ZKP authentication workflow
- **Test Suite**: Comprehensive ZKP authentication tests
- **Integration Tests**: Agent-to-agent authentication scenarios

### Security

- **Zero-Knowledge**: Proofs reveal nothing beyond the statement being proved
- **Non-Interactive Option**: NIZK proofs for async authentication
- **Replay Protection**: Challenge-based protocol prevents replay attacks
- **Quantum-Safe Compatible**: Works with existing hybrid crypto system

### Use Cases

```typescript
// Agent A wants to prove it has 'data:read' capability to Agent B
// WITHOUT revealing its full credential set

const challenge = ZKPUtils.generateChallenge();
const proof = await ZKPUtils.createCapabilityProof(
  agentA.did,
  'data:read',
  agentA.privateKey,
  challenge
);

// Agent B verifies without learning what other capabilities A has
const isValid = await ZKPUtils.verifyProof(proof, challenge, agentA.publicKey);
```

---

## [Unreleased]

### Planned Features
- **v1.3.0**: WebAssembly support for browser environments
- **v1.3.0**: GraphQL API support and enhanced querying
- **v1.4.0**: Advanced zero-knowledge proof features
- **v2.0.0**: ATP Protocol v2 compatibility and new features

---

## Development Notes

This initial release represents a complete implementation of the ATP™ SDK with all major features and comprehensive documentation. The SDK has been designed with production environments in mind, featuring robust error handling, performance optimizations, and security best practices.

For migration guides and upgrade instructions, see the [Migration Guide](./docs/guides/migration.md).

For detailed API documentation, see the [API Reference](./docs/api/README.md).

For implementation examples, see the [Examples](./examples/README.md) directory.