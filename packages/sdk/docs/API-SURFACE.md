# ATP SDK Public API Surface (v3.x)

This document lists the primary exports intended for application developers. Import from `atp-sdk`.

## Top-level Exports

- Classes
  - `Agent` (default and named): simplified quickstart agent
  - `ATPClient`: main client for Identity, Credentials, Permissions, Audit, Gateway
- Service clients
  - `IdentityClient`, `CredentialsClient`, `PermissionsClient`, `AuditClient`, `GatewayClient`
- Monitoring
  - `UniversalMonitor`, `SecurityEnforcer`
- Protocols
  - `Protocol`, `ProtocolDetector`, `BaseProtocolAdapter`, `MCPAdapter`
- Utilities
  - `CryptoUtils` (hybrid Ed25519 + ML-DSA-65 keys and signatures), `JWTUtils`
  - `DidAtp` (generate, parse, validate did:atp v2), `DidAtpDocument`, `DidAtpResolver`, `jcsCanonicalize`
- Security profiles
  - `BUILTIN_PROFILES` and the four built-in profile constants (from `atp-profiles`)
- Types (partial list)
  - `ATPConfig`, `ATPResponse`, `ATPError`, `AccessDecision`
  - Identity types: `DIDDocument`, `VerificationMethod`, `TrustLevel`, `MFAMethod`
  - Credential types: `VerifiableCredential`, `VerifiablePresentation`, `CredentialSchema`
  - Payments (types only; there is no payments client): `PaymentMandate`, `IntentMandate`, `CartMandate`, `PaymentTransaction`, `PaymentPolicy`
  - Protocol types: `ProtocolInfo`, `ProtocolAdapter`, `AgentEvent`, `SecuredMessage`, `VerificationResult`

## Helper Functions

- `createATPClient(config: ATPConfig): ATPClient`
- `createQuickConfig(baseUrl: string, options?): ATPConfig`

## Defaults and Environment

- Default service URLs (overridable via env):
  - `ATP_GATEWAY_URL`: `${baseUrl}:3000`
  - `ATP_IDENTITY_URL`: `${baseUrl}:3001`
  - `ATP_CREDENTIALS_URL`: `${baseUrl}:3002`
  - `ATP_PERMISSIONS_URL`: `${baseUrl}:3003`
  - `ATP_AUDIT_URL`: `${baseUrl}:3005`

## Semantic Stability

- Methods and types above are considered stable in v3.x.
- New protocol adapters may be added in minor versions; existing names will not change without deprecation.
