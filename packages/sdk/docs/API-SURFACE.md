# ATP SDK Public API Surface (v1.1.x)

This document lists the primary exports intended for application developers. Import from `atp-sdk`.

## Top-level Exports

- Classes
  - `Agent` (default and named): simplified quickstart agent
  - `ATPClient`: main client for Identity, Credentials, Permissions, Audit, Gateway, Payments
- Service clients
  - `IdentityClient`, `CredentialsClient`, `PermissionsClient`, `AuditClient`, `GatewayClient`, `PaymentsClient`
- Monitoring
  - `UniversalMonitor`, `SecurityEnforcer`
- Protocols
  - `Protocol`, `ProtocolDetector`, `BaseProtocolAdapter`, `MCPAdapter`
- Utilities
  - `CryptoUtils`, `DIDUtils`, `JWTUtils`
- Types (partial list)
  - `ATPConfig`, `ATPResponse`, `ATPError`, `AccessDecision`
  - Identity types: `DIDDocument`, `VerificationMethod`, `TrustLevel`, `MFAMethod`
  - Credential types: `VerifiableCredential`, `VerifiablePresentation`, `CredentialSchema`
  - Payments: `PaymentMandate`, `IntentMandate`, `CartMandate`, `PaymentTransaction`, `PaymentPolicy`
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

- Methods and types above are considered stable in v1.1.x.
- New protocol adapters may be added in minor versions; existing names will not change without deprecation.
