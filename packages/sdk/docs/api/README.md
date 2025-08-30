# ATP™ SDK API Reference

Complete API reference for the Agent Trust Protocol™ SDK.

## Table of Contents

1. [Core Classes](#core-classes)
   - [ATPClient](#atpclient)
   - [BaseClient](#baseclient)
2. [Service Clients](#service-clients)
   - [IdentityClient](#identityclient)
   - [CredentialsClient](#credentialsclient)
   - [PermissionsClient](#permissionsclient)
   - [AuditClient](#auditclient)
   - [GatewayClient](#gatewayclient)
3. [Utility Classes](#utility-classes)
   - [CryptoUtils](#cryptoutils)
   - [DIDUtils](#didutils)
   - [JWTUtils](#jwtutils)
4. [Types and Interfaces](#types-and-interfaces)
5. [Error Classes](#error-classes)

## Core Classes

### ATPClient

Main SDK client providing unified access to all ATP services.

#### Constructor

```typescript
constructor(config: ATPConfig)
```

Creates a new ATP client with the specified configuration.

**Parameters:**
- `config: ATPConfig` - Client configuration object

**Example:**
```javascript
const client = new ATPClient({
  baseUrl: 'http://localhost',
  auth: {
    did: 'did:atp:testnet:example',
    privateKey: 'hex-private-key'
  }
});
```

#### Properties

- `identity: IdentityClient` - Identity service client
- `credentials: CredentialsClient` - Credentials service client  
- `permissions: PermissionsClient` - Permissions service client
- `audit: AuditClient` - Audit service client
- `gateway: GatewayClient` - Gateway service client

#### Methods

##### `setAuthentication(auth)`

Updates authentication for all service clients.

**Parameters:**
- `auth: object` - Authentication configuration
  - `did?: string` - DID for authentication
  - `privateKey?: string` - Private key in hex format
  - `token?: string` - JWT token

**Example:**
```javascript
client.setAuthentication({
  did: 'did:atp:testnet:example',
  privateKey: 'private-key-hex'
});
```

##### `getConfig()`

Returns the current client configuration.

**Returns:** `ATPConfig` - Current configuration

##### `updateConfig(updates)`

Updates the client configuration.

**Parameters:**
- `updates: Partial<ATPConfig>` - Configuration updates

##### `isAuthenticated()`

Checks if the client is properly authenticated.

**Returns:** `boolean` - True if authenticated

##### `testConnectivity()`

Tests connectivity to all ATP services.

**Returns:** `Promise<ConnectivityStatus>` - Status of each service

**Example:**
```javascript
const status = await client.testConnectivity();
console.log('Identity service:', status.identity ? 'Available' : 'Unavailable');
```

##### `cleanup()`

Cleans up resources and closes connections.

---

### BaseClient

Abstract base class for all service clients.

#### Methods

##### `updateAuth(auth)`

Updates authentication configuration.

**Parameters:**
- `auth: object` - Authentication updates

##### `isAuthenticated()`

Checks authentication status.

**Returns:** `boolean` - Authentication status

##### `getConfig()`

Gets current configuration.

**Returns:** `Readonly<ATPConfig>` - Configuration

---

## Service Clients

### IdentityClient

Manages decentralized identities, trust levels, and multi-factor authentication.

#### Methods

##### `register(request)`

Registers a new identity with the ATP network.

**Parameters:**
- `request: IdentityRegistrationRequest`
  - `did: string` - DID to register
  - `document: DIDDocument` - DID document
  - `metadata?: object` - Additional metadata

**Returns:** `Promise<ATPResponse<Identity>>` - Registration result

**Example:**
```javascript
const result = await client.identity.register({
  did: 'did:atp:testnet:example',
  document: didDocument,
  metadata: {
    name: 'John Doe',
    organization: 'Example Corp'
  }
});
```

##### `resolve(did)`

Resolves a DID to its current document and metadata.

**Parameters:**
- `did: string` - DID to resolve

**Returns:** `Promise<ATPResponse<IdentityResolution>>` - Resolution result

##### `update(did, updates)`

Updates an identity's metadata or document.

**Parameters:**
- `did: string` - DID to update
- `updates: IdentityUpdate` - Updates to apply

**Returns:** `Promise<ATPResponse<Identity>>` - Updated identity

##### `setupMFA(request)`

Sets up multi-factor authentication for an identity.

**Parameters:**
- `request: MFASetupRequest`
  - `method: 'totp' | 'sms' | 'email'` - MFA method
  - `label?: string` - Label for the MFA device

**Returns:** `Promise<ATPResponse<MFASetup>>` - MFA setup result

##### `verifyMFA(request)`

Verifies an MFA code.

**Parameters:**
- `request: MFAVerificationRequest`
  - `method: string` - MFA method
  - `code: string` - Verification code

**Returns:** `Promise<ATPResponse<MFAVerification>>` - Verification result

##### `updateTrustLevel(did, update)`

Updates the trust level for an identity.

**Parameters:**
- `did: string` - Target DID
- `update: TrustLevelUpdate`
  - `level: TrustLevel` - New trust level
  - `evidence: string[]` - Supporting evidence
  - `verifiedBy: string` - Verifier DID

**Returns:** `Promise<ATPResponse<TrustUpdate>>` - Trust update result

##### `getTrustScore(did, params?)`

Gets the trust score for an identity.

**Parameters:**
- `did: string` - Target DID
- `params?: TrustScoreParams` - Query parameters

**Returns:** `Promise<ATPResponse<TrustScore>>` - Trust score details

##### `search(query)`

Searches for identities based on criteria.

**Parameters:**
- `query: IdentitySearchQuery` - Search parameters

**Returns:** `Promise<ATPResponse<IdentitySearchResult>>` - Search results

##### `getHealth()`

Gets identity service health status.

**Returns:** `Promise<ATPResponse<HealthStatus>>` - Health status

---

### CredentialsClient

Manages verifiable credentials, schemas, and presentations.

#### Methods

##### `createSchema(request)`

Creates a new credential schema.

**Parameters:**
- `request: SchemaCreationRequest`
  - `name: string` - Schema name
  - `description?: string` - Schema description
  - `version: string` - Schema version
  - `schema: object` - JSON schema definition

**Returns:** `Promise<ATPResponse<CredentialSchema>>` - Created schema

##### `getSchema(schemaId)`

Retrieves a credential schema by ID.

**Parameters:**
- `schemaId: string` - Schema identifier

**Returns:** `Promise<ATPResponse<CredentialSchema>>` - Schema details

##### `issue(request)`

Issues a new verifiable credential.

**Parameters:**
- `request: CredentialIssuanceRequest`
  - `schemaId: string` - Schema ID
  - `holder: string` - Holder DID
  - `claims: object` - Credential claims
  - `metadata?: object` - Additional metadata

**Returns:** `Promise<ATPResponse<VerifiableCredential>>` - Issued credential

##### `verify(request)`

Verifies a credential's authenticity and validity.

**Parameters:**
- `request: CredentialVerificationRequest`
  - `credentialId: string` - Credential ID
  - `checkRevocation?: boolean` - Check revocation status
  - `checkExpiry?: boolean` - Check expiration

**Returns:** `Promise<ATPResponse<CredentialVerification>>` - Verification result

##### `createPresentation(request)`

Creates a verifiable presentation.

**Parameters:**
- `request: PresentationRequest`
  - `credentialIds: string[]` - Credentials to include
  - `audience: string` - Intended audience
  - `challenge?: string` - Cryptographic challenge
  - `purpose?: string` - Presentation purpose

**Returns:** `Promise<ATPResponse<VerifiablePresentation>>` - Created presentation

##### `verifyPresentation(request)`

Verifies a verifiable presentation.

**Parameters:**
- `request: PresentationVerificationRequest`
  - `presentationId: string` - Presentation ID
  - `expectedChallenge?: string` - Expected challenge
  - `expectedAudience?: string` - Expected audience

**Returns:** `Promise<ATPResponse<PresentationVerification>>` - Verification result

##### `revoke(request)`

Revokes a verifiable credential.

**Parameters:**
- `request: RevocationRequest`
  - `credentialId: string` - Credential to revoke
  - `reason: string` - Revocation reason

**Returns:** `Promise<ATPResponse<RevocationResult>>` - Revocation result

##### `getStatus(credentialId)`

Gets the current status of a credential.

**Parameters:**
- `credentialId: string` - Credential ID

**Returns:** `Promise<ATPResponse<CredentialStatus>>` - Current status

##### `query(params)`

Queries credentials based on criteria.

**Parameters:**
- `params: CredentialQuery` - Query parameters

**Returns:** `Promise<ATPResponse<CredentialQueryResult>>` - Query results

##### `getAnalytics(params)`

Gets credential issuance and verification analytics.

**Parameters:**
- `params: AnalyticsQuery` - Analytics parameters

**Returns:** `Promise<ATPResponse<CredentialAnalytics>>` - Analytics data

---

### PermissionsClient

Manages access control policies, permissions, and capability tokens.

#### Methods

##### `createPolicy(request)`

Creates a new access control policy.

**Parameters:**
- `request: PolicyCreationRequest`
  - `name: string` - Policy name
  - `description?: string` - Policy description
  - `version: string` - Policy version
  - `rules: PolicyRule[]` - Policy rules

**Returns:** `Promise<ATPResponse<PermissionPolicy>>` - Created policy

##### `grant(request)`

Grants permissions to a subject.

**Parameters:**
- `request: PermissionGrantRequest`
  - `grantee: string` - Subject DID
  - `resource: string` - Resource identifier
  - `actions: string[]` - Allowed actions
  - `policyId?: string` - Associated policy ID
  - `conditions?: object` - Grant conditions

**Returns:** `Promise<ATPResponse<PermissionGrant>>` - Grant result

##### `revoke(request)`

Revokes a permission grant.

**Parameters:**
- `request: RevocationRequest`
  - `grantId: string` - Grant to revoke
  - `reason: string` - Revocation reason

**Returns:** `Promise<ATPResponse<RevocationResult>>` - Revocation result

##### `evaluate(request)`

Evaluates an access control decision.

**Parameters:**
- `request: AccessControlRequest`
  - `subject: string` - Subject DID
  - `action: string` - Requested action
  - `resource: string` - Target resource
  - `context?: object` - Request context

**Returns:** `Promise<ATPResponse<AccessDecision>>` - Access decision

##### `createCapabilityToken(request)`

Creates a capability token for delegation.

**Parameters:**
- `request: CapabilityTokenRequest`
  - `grantee: string` - Token recipient
  - `capabilities: string[]` - Granted capabilities
  - `resource: string` - Target resource
  - `restrictions?: object` - Token restrictions

**Returns:** `Promise<ATPResponse<CapabilityToken>>` - Created token

##### `verifyCapabilityToken(request)`

Verifies a capability token.

**Parameters:**
- `request: TokenVerificationRequest`
  - `token: string` - Token to verify
  - `requiredCapability?: string` - Required capability
  - `resource?: string` - Target resource

**Returns:** `Promise<ATPResponse<TokenVerification>>` - Verification result

##### `listGrants(params)`

Lists permission grants.

**Parameters:**
- `params: GrantQuery` - Query parameters

**Returns:** `Promise<ATPResponse<GrantQueryResult>>` - Grant list

##### `getAnalytics(params)`

Gets permission analytics.

**Parameters:**
- `params: AnalyticsQuery` - Analytics parameters

**Returns:** `Promise<ATPResponse<PermissionAnalytics>>` - Analytics data

---

### AuditClient

Manages audit logging, compliance reporting, and integrity verification.

#### Methods

##### `logEvent(request)`

Logs an audit event.

**Parameters:**
- `request: AuditLogRequest`
  - `source: string` - Event source
  - `action: string` - Action performed
  - `resource: string` - Target resource
  - `actor?: string` - Actor DID
  - `details?: object` - Event details

**Returns:** `Promise<ATPResponse<AuditEvent>>` - Logged event

##### `getEvent(eventId)`

Retrieves an audit event by ID.

**Parameters:**
- `eventId: string` - Event identifier

**Returns:** `Promise<ATPResponse<AuditEvent>>` - Event details

##### `queryEvents(query)`

Queries audit events with filters.

**Parameters:**
- `query: AuditQuery` - Query parameters

**Returns:** `Promise<ATPResponse<AuditQueryResult>>` - Query results

##### `verifyIntegrity()`

Verifies audit chain integrity.

**Returns:** `Promise<ATPResponse<IntegrityVerification>>` - Integrity status

##### `getStats(params?)`

Gets audit statistics.

**Parameters:**
- `params?: StatsQuery` - Statistics parameters

**Returns:** `Promise<ATPResponse<AuditStats>>` - Statistics data

##### `generateComplianceReport(params)`

Generates a compliance report.

**Parameters:**
- `params: ComplianceReportRequest`
  - `startDate: string` - Report start date
  - `endDate: string` - Report end date
  - `reportType: string` - Type of report
  - `format?: string` - Output format

**Returns:** `Promise<ATPResponse<ComplianceReport>>` - Generated report

##### `exportAuditData(params)`

Exports audit data.

**Parameters:**
- `params: ExportRequest`
  - `startDate: string` - Export start date
  - `endDate: string` - Export end date
  - `format: string` - Export format

**Returns:** `Promise<ATPResponse<ExportResult>>` - Export details

##### `getBlockchainAnchor(eventId)`

Gets blockchain anchor for an event.

**Parameters:**
- `eventId: string` - Event ID

**Returns:** `Promise<ATPResponse<BlockchainAnchor>>` - Anchor details

---

### GatewayClient

Manages API gateway, real-time events, and service coordination.

#### Methods

##### `getStatus()`

Gets gateway status and health.

**Returns:** `Promise<ATPResponse<GatewayStatus>>` - Gateway status

##### `getHealth()`

Gets detailed health check.

**Returns:** `Promise<ATPResponse<HealthCheck>>` - Health details

##### `connectEventStream(options?)`

Connects to real-time event stream.

**Parameters:**
- `options?: EventStreamOptions`
  - `filters?: object` - Event filters
  - `autoReconnect?: boolean` - Auto-reconnection

**Returns:** `Promise<void>` - Connection promise

##### `disconnectEventStream()`

Disconnects from event stream.

##### `on(event, handler)`

Subscribes to events.

**Parameters:**
- `event: string` - Event name
- `handler: Function` - Event handler

##### `off(event, handler?)`

Unsubscribes from events.

**Parameters:**
- `event: string` - Event name
- `handler?: Function` - Specific handler (optional)

##### `sendCommand(command)`

Sends command through WebSocket.

**Parameters:**
- `command: object` - Command to send

**Returns:** `Promise<void>` - Send promise

##### `getSecurityEvents(params?)`

Gets security events.

**Parameters:**
- `params?: SecurityEventQuery` - Query parameters

**Returns:** `Promise<ATPResponse<SecurityEventResult>>` - Security events

##### `getConnectionStats()`

Gets connection statistics.

**Returns:** `Promise<ATPResponse<ConnectionStats>>` - Connection stats

---

## Utility Classes

### CryptoUtils

Cryptographic utilities for Ed25519 operations.

#### Static Methods

##### `generateKeyPair()`

Generates a new Ed25519 key pair.

**Returns:** `Promise<KeyPair>` - Generated key pair

##### `signData(data, privateKey)`

Signs data with a private key.

**Parameters:**
- `data: string | Buffer` - Data to sign
- `privateKey: string` - Private key in hex

**Returns:** `Promise<string>` - Signature in hex

##### `verifySignature(data, signature, publicKey)`

Verifies a signature.

**Parameters:**
- `data: string | Buffer` - Original data
- `signature: string` - Signature in hex  
- `publicKey: string` - Public key in hex

**Returns:** `Promise<boolean>` - Verification result

##### `hash(data)`

Hashes data using SHA-256.

**Parameters:**
- `data: string | Buffer` - Data to hash

**Returns:** `string` - Hash in hex

##### `randomBytes(length)`

Generates cryptographically secure random bytes.

**Parameters:**
- `length: number` - Number of bytes

**Returns:** `Buffer` - Random bytes

##### `randomString(length?)`

Generates a random hex string.

**Parameters:**
- `length?: number` - String length (default: 32)

**Returns:** `string` - Random hex string

---

### DIDUtils

Utilities for DID generation, parsing, and manipulation.

#### Static Methods

##### `generateDID(options?)`

Generates a new DID with document and key pair.

**Parameters:**
- `options?: object`
  - `network?: string` - Network identifier
  - `method?: string` - DID method

**Returns:** `Promise<DIDGeneration>` - Generated DID data

##### `parseDID(did)`

Parses a DID string into components.

**Parameters:**
- `did: string` - DID to parse

**Returns:** `DIDComponents | null` - Parsed components

##### `isValidDID(did)`

Validates DID format.

**Parameters:**
- `did: string` - DID to validate

**Returns:** `boolean` - Validation result

##### `extractPublicKey(document, keyId?)`

Extracts public key from DID document.

**Parameters:**
- `document: DIDDocument` - DID document
- `keyId?: string` - Specific key ID

**Returns:** `string | null` - Public key in hex

##### `signDIDDocument(document, privateKey, keyId?)`

Signs a DID document.

**Parameters:**
- `document: DIDDocument` - Document to sign
- `privateKey: string` - Private key in hex
- `keyId?: string` - Key ID for signing

**Returns:** `Promise<DIDDocument>` - Signed document

##### `verifyDIDDocument(document)`

Verifies DID document signature.

**Parameters:**
- `document: DIDDocument` - Document to verify

**Returns:** `Promise<boolean>` - Verification result

---

### JWTUtils

Utilities for JWT creation and verification with DID support.

#### Static Methods

##### `createDIDJWT(payload, privateKey, did, options?)`

Creates a DID-JWT token.

**Parameters:**
- `payload: object` - JWT payload
- `privateKey: string` - Private key in hex
- `did: string` - Issuer DID
- `options?: object` - JWT options

**Returns:** `Promise<string>` - JWT token

##### `verifyDIDJWT(token, publicKey, options?)`

Verifies a DID-JWT token.

**Parameters:**
- `token: string` - JWT to verify
- `publicKey: string` - Public key in hex
- `options?: object` - Verification options

**Returns:** `Promise<JWTVerification>` - Verification result

##### `decodeJWT(token)`

Decodes JWT without verification.

**Parameters:**
- `token: string` - JWT to decode

**Returns:** `JWTDecoded | null` - Decoded JWT

##### `isExpired(token)`

Checks if JWT is expired.

**Parameters:**
- `token: string` - JWT to check

**Returns:** `boolean` - Expiration status

##### `createAuthToken(did, privateKey, options?)`

Creates authentication token for ATP services.

**Parameters:**
- `did: string` - User DID
- `privateKey: string` - Private key
- `options?: object` - Token options

**Returns:** `Promise<string>` - Auth token

##### `createCapabilityToken(issuer, subject, capabilities, privateKey, options?)`

Creates capability token.

**Parameters:**
- `issuer: string` - Issuer DID
- `subject: string` - Subject DID  
- `capabilities: string[]` - Granted capabilities
- `privateKey: string` - Private key
- `options?: object` - Token options

**Returns:** `Promise<string>` - Capability token

---

## Types and Interfaces

### Core Types

#### `ATPConfig`

```typescript
interface ATPConfig {
  baseUrl: string;
  services?: {
    identity?: string;
    credentials?: string;
    permissions?: string;
    audit?: string;
    gateway?: string;
  };
  auth?: {
    did?: string;
    privateKey?: string;
    token?: string;
  };
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  debug?: boolean;
  headers?: Record<string, string>;
}
```

#### `ATPResponse<T>`

```typescript
interface ATPResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  requestId: string;
}
```

### Identity Types

#### `DIDDocument`

```typescript
interface DIDDocument {
  id: string;
  '@context': string[];
  verificationMethod: VerificationMethod[];
  authentication?: string[];
  assertionMethod?: string[];
  keyAgreement?: string[];
  service?: Service[];
  proof?: Proof;
}
```

#### `VerificationMethod`

```typescript
interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase?: string;
  publicKeyJwk?: object;
}
```

### Credential Types

#### `VerifiableCredential`

```typescript
interface VerifiableCredential {
  '@context': string[];
  type: string[];
  id: string;
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: object;
  proof: Proof;
  credentialStatus?: CredentialStatus;
}
```

#### `VerifiablePresentation`

```typescript
interface VerifiablePresentation {
  '@context': string[];
  type: string[];
  id: string;
  holder: string;
  verifiableCredential: VerifiableCredential[];
  proof: Proof;
}
```

### Permission Types

#### `PermissionPolicy`

```typescript
interface PermissionPolicy {
  id: string;
  name: string;
  description?: string;
  version: string;
  rules: PolicyRule[];
  createdAt: string;
  updatedAt: string;
}
```

#### `PolicyRule`

```typescript
interface PolicyRule {
  action: string;
  resource: string;
  effect: 'allow' | 'deny';
  conditions?: PolicyCondition[];
}
```

### Audit Types

#### `AuditEvent`

```typescript
interface AuditEvent {
  id: string;
  source: string;
  action: string;
  resource: string;
  actor?: string;
  timestamp: string;
  details?: object;
  signature?: string;
  ipfsHash?: string;
  blockchainAnchor?: string;
}
```

---

## Error Classes

### `ATPError`

Base error class for all ATP SDK errors.

```typescript
class ATPError extends Error {
  code: string;
  details?: object;
  
  constructor(message: string, code?: string, details?: object)
}
```

### `ATPNetworkError`

Network-related errors.

```typescript
class ATPNetworkError extends ATPError {
  statusCode?: number;
  response?: object;
}
```

### `ATPAuthenticationError`

Authentication failures.

```typescript
class ATPAuthenticationError extends ATPError {
  authMethod?: string;
}
```

### `ATPAuthorizationError`

Authorization failures.

```typescript
class ATPAuthorizationError extends ATPError {
  requiredPermissions?: string[];
}
```

### `ATPValidationError`

Input validation errors.

```typescript
class ATPValidationError extends ATPError {
  field?: string;
  value?: any;
}
```

### `ATPServiceError`

Service-specific errors.

```typescript
class ATPServiceError extends ATPError {
  service: string;
  operation?: string;
}
```

---

## Helper Functions

### `createQuickConfig(baseUrl, options?)`

Creates a quick configuration for local development.

**Parameters:**
- `baseUrl: string` - Base URL for ATP services
- `options?: object` - Additional options

**Returns:** `ATPConfig` - Generated configuration

---

This API reference provides comprehensive documentation for all classes, methods, and types in the ATP™ SDK. For more detailed examples and usage patterns, see the [Examples](../examples/README.md) section.