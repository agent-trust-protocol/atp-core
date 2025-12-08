# Changelog

All notable changes to the ATP™ SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

## [Unreleased]

### Planned Features
- **v1.2.0**: WebAssembly support for browser environments
- **v1.3.0**: GraphQL API support and enhanced querying
- **v1.4.0**: Advanced zero-knowledge proof features
- **v2.0.0**: ATP Protocol v2 compatibility and new features

---

## Development Notes

This initial release represents a complete implementation of the ATP™ SDK with all major features and comprehensive documentation. The SDK has been designed with production environments in mind, featuring robust error handling, performance optimizations, and security best practices.

For migration guides and upgrade instructions, see the [Migration Guide](./docs/guides/migration.md).

For detailed API documentation, see the [API Reference](./docs/api/README.md).

For implementation examples, see the [Examples](./examples/README.md) directory.