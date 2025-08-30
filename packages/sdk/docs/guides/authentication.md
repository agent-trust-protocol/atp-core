# Authentication Guide

This guide covers all authentication methods and patterns supported by the ATP™ SDK.

## Table of Contents

1. [Authentication Overview](#authentication-overview)
2. [DID-based Authentication](#did-based-authentication)
3. [JWT Token Authentication](#jwt-token-authentication)
4. [Multi-Factor Authentication](#multi-factor-authentication)
5. [Service-to-Service Authentication](#service-to-service-authentication)
6. [Token Management](#token-management)
7. [Security Best Practices](#security-best-practices)

## Authentication Overview

The ATP™ SDK supports multiple authentication methods:

- **DID + Private Key**: Self-sovereign identity authentication
- **JWT Tokens**: Bearer token authentication
- **API Keys**: Simple API key authentication
- **Certificate-based**: X.509 client certificate authentication
- **Multi-Factor**: Additional security layers

## DID-based Authentication

### Basic DID Authentication

The primary authentication method uses Decentralized Identifiers (DIDs) with cryptographic key pairs:

```javascript
import { ATPClient, DIDUtils } from '@atp/sdk';

// Generate a new DID and key pair
const { did, keyPair } = await DIDUtils.generateDID({
  network: 'testnet',
  method: 'atp'
});

// Configure client with DID authentication
const client = new ATPClient({
  baseUrl: 'http://localhost',
  auth: {
    did: did,
    privateKey: keyPair.privateKey
  }
});
```

### Loading Existing DIDs

```javascript
// Load from environment variables
const client = new ATPClient({
  baseUrl: 'http://localhost',
  auth: {
    did: process.env.ATP_DID,
    privateKey: process.env.ATP_PRIVATE_KEY
  }
});

// Load from secure key storage
import { loadKeyFromVault } from './key-management';

const privateKey = await loadKeyFromVault(process.env.KEY_ID);
client.setAuthentication({
  did: 'did:atp:mainnet:your-identifier',
  privateKey: privateKey
});
```

### DID Document Registration

Before using a DID for authentication, it must be registered:

```javascript
// Generate DID and register with ATP network
const { did, document, keyPair } = await DIDUtils.generateDID();

// Register identity
await client.identity.register({
  did: did,
  document: document,
  metadata: {
    name: 'Your Application',
    type: 'service',
    purpose: 'API access'
  }
});

console.log(`DID registered: ${did}`);
```

### DID Key Rotation

Regularly rotate cryptographic keys for security:

```javascript
// Generate new key pair
const newKeyPair = await CryptoUtils.generateKeyPair();

// Add new verification method to DID document
const updatedDocument = DIDUtils.addVerificationMethod(
  currentDocument,
  newKeyPair.publicKey,
  ['authentication', 'assertionMethod']
);

// Update DID document
await client.identity.update(did, {
  document: updatedDocument
});

// Update client authentication
client.setAuthentication({
  did: did,
  privateKey: newKeyPair.privateKey
});

console.log('DID key rotated successfully');
```

## JWT Token Authentication

### Using Pre-issued Tokens

If you have a JWT token from another system:

```javascript
const client = new ATPClient({
  baseUrl: 'http://localhost',
  auth: {
    token: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...'
  }
});
```

### Creating JWT Tokens

Create JWT tokens programmatically:

```javascript
import { JWTUtils } from '@atp/sdk';

// Create authentication token
const token = await JWTUtils.createAuthToken(
  'did:atp:testnet:user',
  privateKey,
  {
    audience: 'atp:services',
    expiresIn: '1h',
    permissions: ['read', 'write'],
    trustLevel: 'VERIFIED'
  }
);

// Use token with client
client.setAuthentication({ token });
```

### Token Verification

Verify incoming tokens:

```javascript
// Verify token authenticity
const verification = await JWTUtils.verifyDIDJWT(
  token,
  publicKey,
  {
    audience: 'atp:services',
    issuer: 'did:atp:testnet:trusted-issuer'
  }
);

if (verification.valid) {
  console.log('Token is valid');
  console.log('Payload:', verification.payload);
} else {
  console.error('Token verification failed:', verification.error);
}
```

### Capability Tokens

Use capability tokens for delegation:

```javascript
// Create capability token
const capabilityToken = await JWTUtils.createCapabilityToken(
  'did:atp:testnet:issuer',      // Issuer
  'did:atp:testnet:delegate',    // Subject/delegate
  ['document:read', 'report:generate'], // Capabilities
  issuerPrivateKey,
  {
    expiresIn: '24h',
    audience: 'atp:services',
    restrictions: {
      ipRange: '192.168.1.0/24',
      timeWindow: {
        start: '09:00',
        end: '17:00'
      }
    }
  }
);

// Use capability token
client.setAuthentication({ token: capabilityToken });
```

## Multi-Factor Authentication

### Setting Up MFA

Enable MFA for enhanced security:

```javascript
// Set up TOTP (Time-based One-Time Password)
const mfaSetup = await client.identity.setupMFA({
  method: 'totp',
  label: 'MyApp Production'
});

console.log('MFA Secret:', mfaSetup.data.secret);
console.log('QR Code:', mfaSetup.data.qrCodeUrl);

// Set up SMS MFA
const smsMfa = await client.identity.setupMFA({
  method: 'sms',
  phoneNumber: '+1234567890'
});

// Set up Email MFA
const emailMfa = await client.identity.setupMFA({
  method: 'email',
  emailAddress: 'user@example.com'
});
```

### MFA Authentication Flow

```javascript
// Step 1: Initial authentication with DID
client.setAuthentication({
  did: 'did:atp:testnet:user',
  privateKey: userPrivateKey
});

// Step 2: Check if MFA is required
try {
  await client.identity.resolve('did:atp:testnet:user');
} catch (error) {
  if (error instanceof ATPAuthenticationError && error.code === 'MFA_REQUIRED') {
    // MFA verification needed
    const mfaCode = await promptUserForMFACode();
    
    // Verify MFA
    const mfaResult = await client.identity.verifyMFA({
      method: 'totp',
      code: mfaCode
    });
    
    if (mfaResult.data.verified) {
      console.log('MFA verification successful');
      // Client is now fully authenticated
    }
  }
}
```

### MFA Recovery

Handle MFA recovery scenarios:

```javascript
// Generate recovery codes during MFA setup
const recoverySetup = await client.identity.setupMFARecovery({
  codeCount: 10  // Generate 10 recovery codes
});

console.log('Recovery codes:', recoverySetup.data.recoveryCodes);

// Use recovery code when primary MFA is unavailable
const recoveryResult = await client.identity.verifyMFARecovery({
  recoveryCode: 'RECOVERY-CODE-123'
});

if (recoveryResult.data.verified) {
  // Disable compromised recovery code
  await client.identity.revokeRecoveryCode('RECOVERY-CODE-123');
}
```

## Service-to-Service Authentication

### Machine-to-Machine Authentication

For automated services:

```javascript
// Service identity with long-lived credentials
const serviceConfig = {
  baseUrl: 'https://api.atp.example.com',
  auth: {
    did: 'did:atp:mainnet:service-abc123',
    privateKey: await loadServiceKey(),
    
    // Service-specific options
    serviceType: 'automated',
    scope: ['audit:write', 'events:publish']
  }
};

const serviceClient = new ATPClient(serviceConfig);
```

### Cross-Service Communication

Authenticate between ATP services:

```javascript
// Create service-to-service token
const serviceToken = await JWTUtils.createDIDJWT(
  {
    service: 'audit-service',
    operation: 'log_event',
    requestId: generateRequestId()
  },
  servicePrivateKey,
  'did:atp:mainnet:audit-service',
  {
    audience: 'did:atp:mainnet:identity-service',
    expiresIn: '5m'  // Short-lived for service calls
  }
);

// Use for inter-service communication
const response = await fetch('https://identity-service/api/validate', {
  headers: {
    'Authorization': `Bearer ${serviceToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestData)
});
```

### Service Mesh Authentication

For microservices architectures:

```javascript
// Load service mesh certificates
const serviceConfig = {
  baseUrl: 'https://atp-mesh.internal',
  tls: {
    cert: fs.readFileSync('/etc/certs/service.crt'),
    key: fs.readFileSync('/etc/certs/service.key'),
    ca: fs.readFileSync('/etc/certs/ca.crt')
  },
  auth: {
    method: 'mutual-tls',
    serviceId: process.env.SERVICE_ID
  }
};
```

## Token Management

### Token Lifecycle

Manage token lifecycle automatically:

```javascript
class TokenManager {
  constructor(client, did, privateKey) {
    this.client = client;
    this.did = did;
    this.privateKey = privateKey;
    this.currentToken = null;
    this.refreshToken = null;
  }

  async ensureValidToken() {
    // Check if current token is expired
    if (!this.currentToken || JWTUtils.isExpired(this.currentToken)) {
      await this.refreshAuthToken();
    }
    return this.currentToken;
  }

  async refreshAuthToken() {
    if (this.refreshToken && !JWTUtils.isExpired(this.refreshToken)) {
      // Use refresh token
      this.currentToken = await this.exchangeRefreshToken();
    } else {
      // Create new token with DID
      this.currentToken = await JWTUtils.createAuthToken(
        this.did,
        this.privateKey,
        { expiresIn: '1h' }
      );
      
      this.refreshToken = await JWTUtils.createRefreshToken(
        this.did,
        this.privateKey,
        generateTokenId(),
        { expiresIn: '30d' }
      );
    }

    // Update client authentication
    this.client.setAuthentication({ token: this.currentToken });
  }

  async exchangeRefreshToken() {
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.refreshToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data.accessToken;
  }
}

// Usage
const tokenManager = new TokenManager(client, did, privateKey);
await tokenManager.ensureValidToken();
```

### Token Caching

Cache tokens to improve performance:

```javascript
class CachedAuthClient {
  constructor(config) {
    this.client = new ATPClient(config);
    this.tokenCache = new Map();
    this.did = config.auth.did;
    this.privateKey = config.auth.privateKey;
  }

  async authenticatedRequest(operation, ...args) {
    const cacheKey = `token:${this.did}`;
    let token = this.tokenCache.get(cacheKey);

    // Check if token is expired or near expiry
    if (!token || this.isTokenNearExpiry(token)) {
      token = await this.generateFreshToken();
      this.tokenCache.set(cacheKey, token);
      this.client.setAuthentication({ token });
    }

    return await operation.apply(this.client, args);
  }

  isTokenNearExpiry(token) {
    const timeToExpiry = JWTUtils.getTimeToExpiration(token);
    return timeToExpiry < 300; // Refresh if less than 5 minutes remaining
  }

  async generateFreshToken() {
    return await JWTUtils.createAuthToken(
      this.did,
      this.privateKey,
      { expiresIn: '1h' }
    );
  }
}
```

### Token Revocation

Revoke compromised tokens:

```javascript
// Revoke specific token
await client.identity.revokeToken({
  tokenId: 'token-abc123',
  reason: 'Security incident'
});

// Revoke all tokens for a DID
await client.identity.revokeAllTokens({
  did: 'did:atp:testnet:user',
  reason: 'Account compromise'
});

// Check token revocation status
const tokenStatus = await client.identity.checkTokenStatus('token-abc123');
if (tokenStatus.data.revoked) {
  console.log('Token has been revoked');
}
```

## Security Best Practices

### Key Management

1. **Secure Storage**: Store private keys in secure vaults (HSMs, AWS KMS, etc.)
2. **Key Rotation**: Rotate keys regularly
3. **Separation**: Use different keys for different environments
4. **Backup**: Securely backup recovery keys

```javascript
// Example: AWS KMS integration
import { KMSClient, DecryptCommand } from '@aws-sdk/client-kms';

async function loadPrivateKeyFromKMS(keyId) {
  const kmsClient = new KMSClient({ region: 'us-east-1' });
  
  const command = new DecryptCommand({
    CiphertextBlob: Buffer.from(process.env.ENCRYPTED_PRIVATE_KEY, 'base64')
  });
  
  const response = await kmsClient.send(command);
  return Buffer.from(response.Plaintext).toString('hex');
}

// Use with client
const privateKey = await loadPrivateKeyFromKMS(process.env.KMS_KEY_ID);
client.setAuthentication({
  did: process.env.ATP_DID,
  privateKey: privateKey
});
```

### Token Security

1. **Short Expiry**: Use short token lifetimes
2. **Refresh Tokens**: Implement token refresh
3. **Secure Transmission**: Always use HTTPS
4. **Token Validation**: Validate tokens on every request

```javascript
// Secure token configuration
const tokenConfig = {
  accessTokenExpiry: '15m',    // Short-lived access tokens
  refreshTokenExpiry: '7d',    // Longer-lived refresh tokens
  audience: 'specific-service', // Limit token scope
  issuer: 'trusted-issuer',
  
  // Security headers
  headers: {
    'Strict-Transport-Security': 'max-age=31536000',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  }
};
```

### Environment Separation

Separate credentials by environment:

```javascript
// Environment-specific authentication
const authConfig = {
  development: {
    did: 'did:atp:testnet:dev-service',
    privateKey: process.env.DEV_PRIVATE_KEY,
    trustedIssuers: ['did:atp:testnet:dev-issuer']
  },
  
  staging: {
    did: 'did:atp:testnet:staging-service',
    privateKey: process.env.STAGING_PRIVATE_KEY,
    trustedIssuers: ['did:atp:testnet:staging-issuer']
  },
  
  production: {
    did: 'did:atp:mainnet:prod-service',
    privateKey: await loadFromSecureVault(),
    trustedIssuers: ['did:atp:mainnet:prod-issuer'],
    mfaRequired: true
  }
};

const config = authConfig[process.env.NODE_ENV || 'development'];
```

### Monitoring and Auditing

Monitor authentication events:

```javascript
// Authentication event logging
client.on('auth:success', (event) => {
  console.log(`Authentication successful: ${event.did}`);
  
  // Log to audit service
  client.audit.logEvent({
    source: 'sdk-client',
    action: 'authentication_success',
    resource: 'auth:login',
    actor: event.did,
    details: {
      method: event.method,
      timestamp: new Date().toISOString(),
      userAgent: process.env.USER_AGENT
    }
  });
});

client.on('auth:failure', (event) => {
  console.error(`Authentication failed: ${event.error}`);
  
  // Log security event
  client.audit.logEvent({
    source: 'sdk-client',
    action: 'authentication_failure',
    resource: 'auth:login',
    details: {
      error: event.error,
      did: event.did,
      timestamp: new Date().toISOString(),
      severity: 'high'
    }
  });
});
```

### Error Handling

Handle authentication errors gracefully:

```javascript
async function safeAuthentication(client, credentials) {
  try {
    client.setAuthentication(credentials);
    
    // Test authentication
    await client.identity.resolve(credentials.did);
    
    return { success: true };
    
  } catch (error) {
    if (error instanceof ATPAuthenticationError) {
      switch (error.code) {
        case 'INVALID_DID':
          return { success: false, error: 'Invalid DID format' };
        
        case 'INVALID_SIGNATURE':
          return { success: false, error: 'Invalid private key' };
        
        case 'MFA_REQUIRED':
          return { success: false, error: 'MFA verification required', requiresMFA: true };
        
        case 'TOKEN_EXPIRED':
          return { success: false, error: 'Token has expired', requiresRefresh: true };
        
        default:
          return { success: false, error: 'Authentication failed' };
      }
    }
    
    throw error; // Re-throw non-auth errors
  }
}
```

This authentication guide covers all aspects of securing your ATP™ SDK integration. Always follow security best practices and regularly review your authentication implementation.