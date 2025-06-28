# Best Practices Guide

This guide outlines best practices for building secure, reliable, and performant applications with the ATP™ SDK.

## Table of Contents

1. [Security Best Practices](#security-best-practices)
2. [Performance Optimization](#performance-optimization)
3. [Error Handling](#error-handling)
4. [Configuration Management](#configuration-management)
5. [Testing Strategies](#testing-strategies)
6. [Monitoring and Observability](#monitoring-and-observability)
7. [Development Workflow](#development-workflow)
8. [Production Deployment](#production-deployment)

## Security Best Practices

### Key Management

**DO:**
```javascript
// Use secure key storage (AWS KMS, Azure Key Vault, etc.)
const privateKey = await loadFromSecureVault(process.env.KEY_ID);

// Rotate keys regularly
const keyRotationSchedule = {
  development: '90 days',
  staging: '60 days', 
  production: '30 days'
};

// Use different keys for different environments
const environmentKeys = {
  dev: process.env.DEV_PRIVATE_KEY,
  staging: process.env.STAGING_PRIVATE_KEY,
  prod: await loadFromKMS(process.env.PROD_KEY_ID)
};
```

**DON'T:**
```javascript
// Never hardcode private keys
const client = new ATPClient({
  auth: {
    privateKey: 'hardcoded-private-key-hex' // ❌ NEVER DO THIS
  }
});

// Don't store keys in version control
const config = {
  privateKey: 'abc123...' // ❌ This will be in git history
};

// Don't use the same key across environments
const universalKey = process.env.PRIVATE_KEY; // ❌ Security risk
```

### Authentication

**DO:**
```javascript
// Use short-lived tokens
const token = await JWTUtils.createAuthToken(did, privateKey, {
  expiresIn: '15m',  // Short expiry
  audience: 'specific-service'
});

// Implement token refresh
class TokenManager {
  async ensureValidToken() {
    if (this.isTokenExpiringSoon()) {
      await this.refreshToken();
    }
    return this.currentToken;
  }
}

// Use MFA for sensitive operations
if (operation.requiresMFA) {
  await client.identity.verifyMFA({
    method: 'totp',
    code: await promptForMFACode()
  });
}
```

**DON'T:**
```javascript
// Don't use long-lived tokens
const token = await JWTUtils.createAuthToken(did, privateKey, {
  expiresIn: '30d' // ❌ Too long
});

// Don't skip token validation
client.setAuthentication({ token: userProvidedToken }); // ❌ Validate first

// Don't bypass MFA
if (process.env.NODE_ENV === 'development') {
  // Skip MFA // ❌ Even in dev, test MFA flows
}
```

### Input Validation

**DO:**
```javascript
import { z } from 'zod';

// Validate all inputs
const didSchema = z.string().regex(/^did:[a-z]+:[a-z]+:[a-zA-Z0-9]+$/);
const credentialSchema = z.object({
  schemaId: z.string().uuid(),
  holder: didSchema,
  claims: z.object({}).passthrough()
});

function validateCredentialRequest(request) {
  try {
    return credentialSchema.parse(request);
  } catch (error) {
    throw new ATPValidationError('Invalid credential request', 'VALIDATION_FAILED', {
      errors: error.issues
    });
  }
}

// Sanitize outputs
function sanitizeResponse(response) {
  const { privateKey, internalId, ...publicData } = response;
  return publicData;
}
```

**DON'T:**
```javascript
// Don't trust user input
async function issueCredential(request) {
  // ❌ No validation
  return await client.credentials.issue(request);
}

// Don't expose sensitive data
function getUserProfile(user) {
  return {
    ...user, // ❌ Might include private keys, secrets
    lastLogin: user.lastLogin
  };
}
```

### Network Security

**DO:**
```javascript
// Always use HTTPS in production
const config = {
  baseUrl: 'https://api.atp.example.com',
  tls: {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2'
  }
};

// Implement certificate pinning
const config = {
  tls: {
    ca: fs.readFileSync('./trusted-ca.pem'),
    cert: fs.readFileSync('./client-cert.pem'),
    key: fs.readFileSync('./client-key.pem')
  }
};

// Use request signing
const signature = await CryptoUtils.signData(
  JSON.stringify(requestBody),
  privateKey
);
```

**DON'T:**
```javascript
// Don't disable TLS verification
const config = {
  tls: {
    rejectUnauthorized: false // ❌ Security vulnerability
  }
};

// Don't use HTTP in production
const config = {
  baseUrl: 'http://api.atp.example.com' // ❌ Unencrypted
};
```

## Performance Optimization

### Connection Management

**DO:**
```javascript
// Use connection pooling
const config = {
  connectionPool: {
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 60000,
    keepAlive: true
  }
};

// Reuse client instances
class ServiceLayer {
  constructor() {
    this.atpClient = new ATPClient(config); // Single instance
  }
  
  async resolveIdentity(did) {
    return await this.atpClient.identity.resolve(did);
  }
}

// Implement connection health checks
setInterval(async () => {
  const health = await client.testConnectivity();
  if (!health.overall) {
    logger.warn('ATP services unhealthy', health);
  }
}, 30000);
```

**DON'T:**
```javascript
// Don't create new clients for each request
async function handleRequest(req, res) {
  const client = new ATPClient(config); // ❌ Inefficient
  const result = await client.identity.resolve(req.params.did);
  res.json(result);
}

// Don't ignore connection errors
try {
  await client.identity.resolve(did);
} catch (error) {
  // ❌ Silent failure
}
```

### Caching

**DO:**
```javascript
// Cache frequently accessed data
class CachedIdentityService {
  constructor(client) {
    this.client = client;
    this.cache = new LRUCache({ max: 1000, ttl: 300000 }); // 5 min TTL
  }

  async resolve(did) {
    const cached = this.cache.get(did);
    if (cached) return cached;

    const result = await this.client.identity.resolve(did);
    this.cache.set(did, result);
    return result;
  }
}

// Cache configuration and schemas
const schemaCache = new Map();
async function getSchema(schemaId) {
  if (!schemaCache.has(schemaId)) {
    const schema = await client.credentials.getSchema(schemaId);
    schemaCache.set(schemaId, schema);
  }
  return schemaCache.get(schemaId);
}

// Implement cache invalidation
eventEmitter.on('schema:updated', (schemaId) => {
  schemaCache.delete(schemaId);
});
```

**DON'T:**
```javascript
// Don't cache everything
const cache = new Map();
async function resolve(did) {
  if (!cache.has(did)) {
    const result = await client.identity.resolve(did);
    cache.set(did, result); // ❌ No TTL, grows indefinitely
  }
  return cache.get(did);
}

// Don't cache sensitive data
const tokenCache = new Map();
function cacheToken(user, token) {
  tokenCache.set(user, token); // ❌ Security risk
}
```

### Batch Operations

**DO:**
```javascript
// Batch multiple operations
class BatchProcessor {
  constructor(client, batchSize = 10) {
    this.client = client;
    this.batchSize = batchSize;
  }

  async processBatch(operations) {
    const chunks = this.chunk(operations, this.batchSize);
    const results = [];

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(op => this.executeOperation(op));
      const chunkResults = await Promise.allSettled(chunkPromises);
      results.push(...chunkResults);
    }

    return results;
  }

  chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Use Promise.allSettled for parallel operations
const identityPromises = dids.map(did => 
  client.identity.resolve(did).catch(error => ({ error, did }))
);
const results = await Promise.allSettled(identityPromises);
```

**DON'T:**
```javascript
// Don't process items sequentially when parallel is possible
async function resolveIdentities(dids) {
  const results = [];
  for (const did of dids) {
    const result = await client.identity.resolve(did); // ❌ Sequential
    results.push(result);
  }
  return results;
}

// Don't ignore batch failures
const promises = operations.map(op => performOperation(op));
const results = await Promise.all(promises); // ❌ Fails on first error
```

## Error Handling

### Structured Error Handling

**DO:**
```javascript
// Use specific error types
try {
  await client.identity.resolve(did);
} catch (error) {
  if (error instanceof ATPValidationError) {
    return { error: 'Invalid DID format', code: 'INVALID_INPUT' };
  } else if (error instanceof ATPNetworkError) {
    logger.error('Network error', { error, did });
    return { error: 'Service temporarily unavailable', code: 'SERVICE_UNAVAILABLE' };
  } else if (error instanceof ATPAuthenticationError) {
    return { error: 'Authentication required', code: 'AUTH_REQUIRED' };
  }
  throw error; // Re-throw unexpected errors
}

// Implement circuit breakers
const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30000
});

async function resolveWithCircuitBreaker(did) {
  return await circuitBreaker.execute(() => client.identity.resolve(did));
}
```

**DON'T:**
```javascript
// Don't catch and ignore errors
try {
  await client.identity.resolve(did);
} catch (error) {
  // ❌ Silent failure
}

// Don't use generic error handling
try {
  await client.identity.resolve(did);
} catch (error) {
  throw new Error('Something went wrong'); // ❌ Lost context
}
```

### Retry Logic

**DO:**
```javascript
// Implement exponential backoff
class RetryHandler {
  async executeWithRetry(operation, maxAttempts = 3) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxAttempts - 1 || !this.shouldRetry(error)) {
          throw error;
        }
        
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        await this.sleep(delay);
      }
    }
  }

  shouldRetry(error) {
    return error instanceof ATPNetworkError && error.statusCode >= 500;
  }
}

// Use jitter to prevent thundering herd
const jitter = Math.random() * 1000;
await this.sleep(baseDelay + jitter);
```

**DON'T:**
```javascript
// Don't retry indefinitely
while (true) {
  try {
    return await client.identity.resolve(did);
  } catch (error) {
    await sleep(1000); // ❌ Infinite loop
  }
}

// Don't retry all errors
try {
  return await client.identity.resolve(did);
} catch (error) {
  await sleep(1000);
  return await client.identity.resolve(did); // ❌ May retry auth errors
}
```

## Configuration Management

### Environment-based Configuration

**DO:**
```javascript
// Use environment-specific configurations
const environments = {
  development: {
    baseUrl: 'http://localhost',
    debug: true,
    timeout: 60000
  },
  staging: {
    baseUrl: 'https://staging-api.atp.example.com',
    debug: false,
    timeout: 30000
  },
  production: {
    baseUrl: 'https://api.atp.example.com',
    debug: false,
    timeout: 15000,
    tls: { rejectUnauthorized: true }
  }
};

const config = environments[process.env.NODE_ENV || 'development'];

// Validate configuration
function validateConfig(config) {
  const required = ['baseUrl', 'auth'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required config: ${missing.join(', ')}`);
  }
}
```

**DON'T:**
```javascript
// Don't use the same config for all environments
const config = {
  baseUrl: 'http://localhost', // ❌ Wrong for production
  debug: true // ❌ Not appropriate for production
};

// Don't hardcode environment-specific values
const config = {
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://api.atp.example.com' 
    : 'http://localhost' // ❌ Hard to maintain
};
```

### Secret Management

**DO:**
```javascript
// Use proper secret management
class SecretManager {
  constructor() {
    this.vault = new VaultClient({
      endpoint: process.env.VAULT_ENDPOINT,
      token: process.env.VAULT_TOKEN
    });
  }

  async getSecret(path) {
    const secret = await this.vault.read(path);
    return secret.data;
  }
}

// Load secrets at startup
async function loadConfiguration() {
  const secretManager = new SecretManager();
  
  const config = {
    baseUrl: process.env.ATP_BASE_URL,
    auth: {
      did: process.env.ATP_DID,
      privateKey: await secretManager.getSecret('atp/private-key')
    }
  };
  
  return config;
}
```

**DON'T:**
```javascript
// Don't store secrets in environment variables in production
const config = {
  auth: {
    privateKey: process.env.PRIVATE_KEY // ❌ Can be exposed in logs
  }
};

// Don't commit secrets to version control
const config = {
  apiKey: 'secret-api-key-123' // ❌ Visible in git history
};
```

## Testing Strategies

### Unit Testing

**DO:**
```javascript
// Mock ATP client for unit tests
jest.mock('@atp/sdk');

describe('UserService', () => {
  let userService, mockClient;

  beforeEach(() => {
    mockClient = {
      identity: {
        resolve: jest.fn(),
        register: jest.fn()
      }
    };
    userService = new UserService(mockClient);
  });

  test('should resolve user identity', async () => {
    const mockIdentity = { did: 'did:atp:test:123', status: 'active' };
    mockClient.identity.resolve.mockResolvedValue({ data: mockIdentity });

    const result = await userService.getUser('did:atp:test:123');

    expect(result).toEqual(mockIdentity);
    expect(mockClient.identity.resolve).toHaveBeenCalledWith('did:atp:test:123');
  });

  test('should handle resolution errors', async () => {
    mockClient.identity.resolve.mockRejectedValue(
      new ATPValidationError('Invalid DID')
    );

    await expect(userService.getUser('invalid-did'))
      .rejects.toThrow('Invalid DID');
  });
});
```

**DON'T:**
```javascript
// Don't test against real services in unit tests
describe('UserService', () => {
  test('should resolve user identity', async () => {
    const client = new ATPClient(productionConfig); // ❌ Real service call
    const result = await client.identity.resolve('did:atp:test:123');
    expect(result).toBeDefined();
  });
});
```

### Integration Testing

**DO:**
```javascript
// Use test fixtures and setup
describe('ATP Integration Tests', () => {
  let client, testDID, testPrivateKey;

  beforeAll(async () => {
    client = new ATPClient(testConfig);
    
    // Generate test identity
    const { did, keyPair } = await DIDUtils.generateDID({ network: 'testnet' });
    testDID = did;
    testPrivateKey = keyPair.privateKey;
    
    client.setAuthentication({ did: testDID, privateKey: testPrivateKey });
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData(testDID);
    client.cleanup();
  });

  test('complete credential workflow', async () => {
    // Create schema
    const schema = await client.credentials.createSchema({
      name: 'Test Certificate',
      schema: testSchema
    });

    // Issue credential
    const credential = await client.credentials.issue({
      schemaId: schema.data.id,
      holder: testDID,
      claims: testClaims
    });

    // Verify credential
    const verification = await client.credentials.verify({
      credentialId: credential.data.id
    });

    expect(verification.data.valid).toBe(true);
  });
});
```

**DON'T:**
```javascript
// Don't leave test data behind
test('should create credential', async () => {
  const credential = await client.credentials.issue(testRequest);
  expect(credential).toBeDefined();
  // ❌ No cleanup
});

// Don't use production data in tests
test('should process user data', async () => {
  const users = await loadProductionUsers(); // ❌ Using real data
  // Process users...
});
```

## Monitoring and Observability

### Metrics Collection

**DO:**
```javascript
// Implement comprehensive metrics
class ATPMetrics {
  constructor(metricsClient) {
    this.metrics = metricsClient;
  }

  recordOperation(service, operation, duration, success) {
    const tags = { service, operation, success: success.toString() };
    
    this.metrics.increment('atp.operations.total', 1, tags);
    this.metrics.timing('atp.operations.duration', duration, tags);
    
    if (!success) {
      this.metrics.increment('atp.operations.errors', 1, tags);
    }
  }

  recordTokenRefresh(success) {
    this.metrics.increment('atp.auth.token_refresh', 1, { 
      success: success.toString() 
    });
  }
}

// Wrap client operations with metrics
class InstrumentedClient {
  constructor(client, metrics) {
    this.client = client;
    this.metrics = metrics;
  }

  async resolveIdentity(did) {
    const startTime = Date.now();
    let success = false;
    
    try {
      const result = await this.client.identity.resolve(did);
      success = true;
      return result;
    } finally {
      const duration = Date.now() - startTime;
      this.metrics.recordOperation('identity', 'resolve', duration, success);
    }
  }
}
```

**DON'T:**
```javascript
// Don't ignore performance metrics
async function resolveIdentity(did) {
  return await client.identity.resolve(did); // ❌ No metrics
}

// Don't log everything as errors
try {
  await client.identity.resolve(did);
} catch (error) {
  logger.error('Error occurred', error); // ❌ All errors treated equally
}
```

### Health Checks

**DO:**
```javascript
// Implement health checks
class HealthChecker {
  constructor(client) {
    this.client = client;
  }

  async checkHealth() {
    const checks = await Promise.allSettled([
      this.checkIdentityService(),
      this.checkCredentialsService(),
      this.checkAuditService()
    ]);

    const results = {
      status: 'healthy',
      services: {},
      timestamp: new Date().toISOString()
    };

    checks.forEach((check, index) => {
      const service = ['identity', 'credentials', 'audit'][index];
      
      if (check.status === 'fulfilled') {
        results.services[service] = check.value;
      } else {
        results.services[service] = {
          status: 'unhealthy',
          error: check.reason.message
        };
        results.status = 'degraded';
      }
    });

    return results;
  }

  async checkIdentityService() {
    const start = Date.now();
    try {
      await this.client.identity.getHealth();
      return {
        status: 'healthy',
        responseTime: Date.now() - start
      };
    } catch (error) {
      throw new Error(`Identity service unhealthy: ${error.message}`);
    }
  }
}

// Expose health endpoint
app.get('/health', async (req, res) => {
  try {
    const health = await healthChecker.checkHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

## Development Workflow

### Code Organization

**DO:**
```javascript
// Organize code by feature
src/
  services/
    identity/
      IdentityService.js
      IdentityRepository.js
      identity.test.js
    credentials/
      CredentialService.js
      CredentialValidator.js
      credentials.test.js
  utils/
    atpClient.js
    errorHandler.js
  config/
    environments/
      development.js
      staging.js
      production.js

// Use dependency injection
class UserController {
  constructor(identityService, credentialService) {
    this.identityService = identityService;
    this.credentialService = credentialService;
  }

  async getUser(req, res) {
    try {
      const identity = await this.identityService.resolve(req.params.did);
      res.json(identity);
    } catch (error) {
      this.handleError(error, res);
    }
  }
}
```

**DON'T:**
```javascript
// Don't create monolithic files
// ❌ everything-service.js with 2000+ lines

// Don't use global state
global.atpClient = new ATPClient(config); // ❌ Global state

function someFunction() {
  return global.atpClient.identity.resolve(did); // ❌ Hidden dependency
}
```

### Version Control

**DO:**
```javascript
// Use semantic versioning
{
  "name": "my-atp-app",
  "version": "1.2.3",
  "dependencies": {
    "@atp/sdk": "^1.0.0" // Pin major version
  }
}

// Document breaking changes
// CHANGELOG.md
## [2.0.0] - 2024-06-28
### Breaking Changes
- Updated ATP SDK to v2.0.0
- Changed authentication method
### Migration Guide
- Update authentication config...
```

**DON'T:**
```javascript
// Don't use loose version constraints
{
  "dependencies": {
    "@atp/sdk": "*" // ❌ Too loose
  }
}

// Don't commit sensitive files
// ❌ .env files, private keys, etc.
```

## Production Deployment

### Deployment Checklist

**DO:**
```markdown
## Pre-deployment Checklist

- [ ] Environment variables configured
- [ ] Secrets properly managed
- [ ] Health checks implemented
- [ ] Monitoring configured
- [ ] Error reporting setup
- [ ] Load testing completed
- [ ] Security scan passed
- [ ] Backup procedures tested
- [ ] Rollback plan documented
- [ ] Team notified of deployment
```

### Monitoring Setup

**DO:**
```javascript
// Set up comprehensive monitoring
const monitoring = {
  metrics: {
    provider: 'datadog',
    namespace: 'atp.myapp',
    tags: {
      environment: process.env.NODE_ENV,
      version: process.env.APP_VERSION
    }
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    structured: true,
    correlation: true
  },
  
  tracing: {
    enabled: true,
    sampleRate: 0.1
  },
  
  alerts: {
    errorRate: { threshold: 0.05, window: '5m' },
    latency: { threshold: 1000, percentile: 95 },
    availability: { threshold: 0.99 }
  }
};
```

### Security Hardening

**DO:**
```javascript
// Implement security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
}));

// Input sanitization
app.use(express.json({ limit: '10mb' }));
app.use(mongoSanitize());
```

Following these best practices will help you build secure, reliable, and maintainable applications with the ATP™ SDK. Regularly review and update your practices as the ecosystem evolves.