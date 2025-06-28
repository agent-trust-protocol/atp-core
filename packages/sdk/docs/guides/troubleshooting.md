# Troubleshooting Guide

This guide helps you diagnose and resolve common issues when using the ATP™ SDK.

## Table of Contents

1. [Common Issues](#common-issues)
2. [Connection Problems](#connection-problems)
3. [Authentication Issues](#authentication-issues)
4. [Performance Problems](#performance-problems)
5. [Error Messages](#error-messages)
6. [Debugging Tools](#debugging-tools)
7. [Getting Help](#getting-help)

## Common Issues

### SDK Installation Problems

**Issue: Package not found**
```bash
npm ERR! 404 Not Found - GET https://registry.npmjs.org/@atp%2fsdk
```

**Solution:**
```bash
# Check if you have access to the ATP registry
npm config get registry

# If using private registry, ensure authentication
npm login --registry=https://npm.atp.example.com

# Verify package name and version
npm search @atp/sdk
```

**Issue: Version conflicts**
```bash
npm ERR! peer dep missing: @atp/sdk@^1.0.0
```

**Solution:**
```bash
# Check installed versions
npm ls @atp/sdk

# Update to compatible version
npm install @atp/sdk@^1.0.0

# Clear npm cache if needed
npm cache clean --force
```

### Import/Module Issues

**Issue: ES module import errors**
```javascript
SyntaxError: Cannot use import statement outside a module
```

**Solution:**
```javascript
// Option 1: Use ES modules in package.json
{
  "type": "module"
}

// Option 2: Use CommonJS require
const { ATPClient } = require('@atp/sdk');

// Option 3: Use .mjs extension
// file: app.mjs
import { ATPClient } from '@atp/sdk';
```

**Issue: TypeScript compilation errors**
```typescript
TS2307: Cannot find module '@atp/sdk' or its corresponding type declarations
```

**Solution:**
```bash
# Install TypeScript types
npm install --save-dev @types/atp__sdk

# Or ensure TypeScript version compatibility
npm install typescript@^4.5.0
```

## Connection Problems

### Service Unavailable

**Issue: Cannot connect to ATP services**
```
ATPNetworkError: Connection refused (ECONNREFUSED)
```

**Diagnostic Steps:**
```javascript
// 1. Test basic connectivity
const client = new ATPClient(config);
const health = await client.testConnectivity();
console.log('Service status:', health);

// 2. Check individual services
try {
  await client.identity.getHealth();
  console.log('Identity service: OK');
} catch (error) {
  console.error('Identity service error:', error.message);
}

// 3. Verify configuration
console.log('Config:', {
  baseUrl: config.baseUrl,
  services: config.services,
  timeout: config.timeout
});
```

**Common Solutions:**
```javascript
// Check if services are running
const config = {
  baseUrl: 'http://localhost',
  services: {
    identity: 'http://localhost:3001',    // ✓ Correct port
    credentials: 'http://localhost:3002', // ✓ Correct port
    permissions: 'http://localhost:3003', // ✓ Correct port
    audit: 'http://localhost:3004',       // ✓ Correct port
    gateway: 'http://localhost:3000'      // ✓ Correct port
  }
};

// Increase timeout for slow networks
const config = {
  baseUrl: 'https://api.atp.example.com',
  timeout: 60000, // 60 seconds
  retries: 5,
  retryDelay: 2000
};
```

### Network Timeouts

**Issue: Requests timing out**
```
ATPNetworkError: Request timeout (ETIMEDOUT)
```

**Diagnostic Script:**
```javascript
async function diagnoseNetwork() {
  const startTime = Date.now();
  
  try {
    const response = await fetch(config.baseUrl + '/health', {
      signal: AbortSignal.timeout(5000)
    });
    
    const duration = Date.now() - startTime;
    console.log(`Network latency: ${duration}ms`);
    
    if (duration > 10000) {
      console.warn('High latency detected');
    }
    
  } catch (error) {
    console.error('Network diagnostic failed:', error.message);
  }
}

await diagnoseNetwork();
```

**Solutions:**
```javascript
// 1. Increase timeouts
const config = {
  timeout: 30000,        // 30 seconds
  retries: 3,
  retryDelay: 2000
};

// 2. Use different service endpoints
const config = {
  services: {
    identity: 'https://identity-backup.atp.example.com',
    // ... other services
  }
};

// 3. Implement circuit breaker
const circuitBreaker = new CircuitBreaker({
  timeout: 10000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});
```

### DNS Resolution Issues

**Issue: Cannot resolve hostname**
```
ATPNetworkError: getaddrinfo ENOTFOUND api.atp.example.com
```

**Diagnostic:**
```bash
# Test DNS resolution
nslookup api.atp.example.com
dig api.atp.example.com

# Check /etc/hosts file
cat /etc/hosts | grep atp

# Test with IP address
ping 192.168.1.100
```

**Solutions:**
```javascript
// 1. Use IP address directly
const config = {
  baseUrl: 'https://192.168.1.100:3000'
};

// 2. Configure custom DNS
const config = {
  dns: {
    servers: ['8.8.8.8', '8.8.4.4']
  }
};

// 3. Add to hosts file (temporary)
// echo "192.168.1.100 api.atp.example.com" >> /etc/hosts
```

## Authentication Issues

### Invalid DID Format

**Issue: DID validation fails**
```
ATPValidationError: Invalid DID format
```

**Diagnostic:**
```javascript
import { DIDUtils } from '@atp/sdk';

function validateDID(did) {
  const parsed = DIDUtils.parseDID(did);
  
  if (!parsed) {
    console.error('Invalid DID format:', did);
    console.log('Expected format: did:method:network:identifier');
    return false;
  }
  
  console.log('DID components:', parsed);
  return true;
}

// Test your DID
validateDID('did:atp:testnet:abc123');
```

**Common DID Issues:**
```javascript
// ❌ Wrong format
'atp:testnet:abc123'           // Missing 'did:' prefix
'did:atp:abc123'              // Missing network
'did:atp:testnet:'            // Missing identifier
'did:atp:testnet:ABC-123'     // Invalid characters

// ✓ Correct format
'did:atp:testnet:abc123'      // Valid
'did:atp:mainnet:def456'      // Valid
'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK' // Valid
```

### Private Key Issues

**Issue: Signature verification fails**
```
ATPAuthenticationError: Invalid signature
```

**Diagnostic:**
```javascript
import { CryptoUtils } from '@atp/sdk';

async function testKeyPair(publicKey, privateKey) {
  try {
    // Test data
    const testData = 'Hello, ATP!';
    
    // Sign with private key
    const signature = await CryptoUtils.signData(testData, privateKey);
    console.log('Signature created:', signature.substring(0, 20) + '...');
    
    // Verify with public key
    const isValid = await CryptoUtils.verifySignature(testData, signature, publicKey);
    console.log('Signature valid:', isValid);
    
    if (!isValid) {
      console.error('Key pair mismatch!');
    }
    
  } catch (error) {
    console.error('Key test failed:', error.message);
    
    if (error.message.includes('Invalid key')) {
      console.log('Check key format (should be hex)');
    }
  }
}

// Test your keys
await testKeyPair(yourPublicKey, yourPrivateKey);
```

**Common Key Issues:**
```javascript
// ❌ Wrong format
const privateKey = 'BEGIN PRIVATE KEY...'; // PEM format
const privateKey = 'abc123';               // Too short
const privateKey = 'gggg...';              // Invalid hex

// ✓ Correct format (64 character hex string)
const privateKey = 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';

// Check key length
if (privateKey.length !== 64) {
  console.error('Private key should be 64 hex characters');
}

// Check hex format
if (!/^[0-9a-fA-F]+$/.test(privateKey)) {
  console.error('Private key should contain only hex characters');
}
```

### Token Issues

**Issue: JWT token expired or invalid**
```
ATPAuthenticationError: Token expired
```

**Diagnostic:**
```javascript
import { JWTUtils } from '@atp/sdk';

function debugToken(token) {
  try {
    const decoded = JWTUtils.decodeJWT(token);
    
    if (!decoded) {
      console.error('Invalid token format');
      return;
    }
    
    console.log('Token header:', decoded.header);
    console.log('Token payload:', decoded.payload);
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    const exp = decoded.payload.exp;
    
    if (exp && exp < now) {
      console.error('Token expired:', new Date(exp * 1000));
    } else {
      console.log('Token expires:', new Date(exp * 1000));
    }
    
    // Check required fields
    const requiredFields = ['iss', 'sub', 'aud'];
    requiredFields.forEach(field => {
      if (!decoded.payload[field]) {
        console.warn(`Missing required field: ${field}`);
      }
    });
    
  } catch (error) {
    console.error('Token debug failed:', error.message);
  }
}

// Debug your token
debugToken(yourToken);
```

### MFA Issues

**Issue: MFA verification fails**
```
ATPAuthenticationError: MFA verification failed
```

**Diagnostic:**
```javascript
// Check MFA status
try {
  const mfaStatus = await client.identity.getMFAStatus(did);
  console.log('MFA enabled:', mfaStatus.data.enabled);
  console.log('MFA methods:', mfaStatus.data.methods);
  
  if (mfaStatus.data.enabled && mfaStatus.data.methods.length === 0) {
    console.error('MFA enabled but no methods configured');
  }
  
} catch (error) {
  console.error('Cannot check MFA status:', error.message);
}

// Test TOTP generation (for debugging)
function generateTOTP(secret, window = 0) {
  const time = Math.floor(Date.now() / 1000 / 30) + window;
  // TOTP generation logic...
  return totp;
}

// Try different time windows
for (let window = -2; window <= 2; window++) {
  const code = generateTOTP(secret, window);
  console.log(`Window ${window}: ${code}`);
}
```

## Performance Problems

### Slow Response Times

**Issue: API calls taking too long**

**Diagnostic:**
```javascript
// Measure operation timing
async function measurePerformance(operation, ...args) {
  const startTime = performance.now();
  
  try {
    const result = await operation(...args);
    const duration = performance.now() - startTime;
    
    console.log(`Operation completed in ${duration.toFixed(2)}ms`);
    
    if (duration > 5000) {
      console.warn('Slow operation detected');
    }
    
    return result;
    
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`Operation failed after ${duration.toFixed(2)}ms:`, error.message);
    throw error;
  }
}

// Test different operations
await measurePerformance(client.identity.resolve, 'did:atp:testnet:test');
await measurePerformance(client.credentials.verify, credentialId);
```

**Solutions:**
```javascript
// 1. Implement caching
const cache = new Map();
async function cachedResolve(did) {
  if (cache.has(did)) {
    return cache.get(did);
  }
  
  const result = await client.identity.resolve(did);
  cache.set(did, result);
  
  // Set TTL
  setTimeout(() => cache.delete(did), 300000); // 5 minutes
  
  return result;
}

// 2. Use parallel operations
const [identity, credentials] = await Promise.all([
  client.identity.resolve(did),
  client.credentials.query({ holder: did })
]);

// 3. Optimize batch operations
async function batchResolve(dids) {
  const batchSize = 10;
  const results = [];
  
  for (let i = 0; i < dids.length; i += batchSize) {
    const batch = dids.slice(i, i + batchSize);
    const batchPromises = batch.map(did => 
      client.identity.resolve(did).catch(error => ({ error, did }))
    );
    
    const batchResults = await Promise.allSettled(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
}
```

### Memory Issues

**Issue: Memory usage growing over time**

**Diagnostic:**
```javascript
// Monitor memory usage
function monitorMemory() {
  const usage = process.memoryUsage();
  
  console.log({
    rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
    external: Math.round(usage.external / 1024 / 1024) + 'MB'
  });
}

// Check memory every 30 seconds
setInterval(monitorMemory, 30000);

// Force garbage collection (development only)
if (global.gc) {
  global.gc();
  console.log('Garbage collection triggered');
}
```

**Solutions:**
```javascript
// 1. Implement proper cleanup
class ATPService {
  constructor() {
    this.client = new ATPClient(config);
    this.cache = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 300000);
  }
  
  cleanup() {
    // Clear expired cache entries
    this.cache.clear();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
  
  destroy() {
    clearInterval(this.cleanupInterval);
    this.client.cleanup();
    this.cache.clear();
  }
}

// 2. Use weak references for caches
const cache = new WeakMap();

// 3. Limit cache size
class LimitedCache {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }
  
  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

## Error Messages

### Common Error Codes and Solutions

| Error Code | Description | Solution |
|------------|-------------|----------|
| `ECONNREFUSED` | Connection refused | Check if services are running, verify ports |
| `ETIMEDOUT` | Request timeout | Increase timeout, check network connectivity |
| `ENOTFOUND` | DNS resolution failed | Check hostname, use IP address, verify DNS |
| `INVALID_DID` | Malformed DID | Verify DID format: `did:method:network:id` |
| `TOKEN_EXPIRED` | JWT token expired | Refresh token or create new one |
| `INVALID_SIGNATURE` | Crypto signature invalid | Check private key format and pairing |
| `MFA_REQUIRED` | Multi-factor auth needed | Complete MFA verification flow |
| `ACCESS_DENIED` | Insufficient permissions | Check user permissions and trust level |
| `QUOTA_EXCEEDED` | Rate limit hit | Implement backoff, check rate limits |
| `SCHEMA_INVALID` | Invalid data schema | Validate input against schema |

### Detailed Error Handling

```javascript
function handleATPError(error) {
  console.error('ATP Error Details:');
  console.error('- Type:', error.constructor.name);
  console.error('- Code:', error.code);
  console.error('- Message:', error.message);
  console.error('- Request ID:', error.requestId);
  console.error('- Timestamp:', error.timestamp);
  
  if (error.details) {
    console.error('- Details:', JSON.stringify(error.details, null, 2));
  }
  
  // Specific handling
  switch (error.code) {
    case 'ECONNREFUSED':
      console.log('\n🔧 Troubleshooting steps:');
      console.log('1. Check if ATP services are running');
      console.log('2. Verify service ports (3000-3004)');
      console.log('3. Check firewall settings');
      break;
      
    case 'INVALID_DID':
      console.log('\n🔧 DID Format Help:');
      console.log('Expected: did:method:network:identifier');
      console.log('Example: did:atp:testnet:abc123');
      break;
      
    case 'TOKEN_EXPIRED':
      console.log('\n🔧 Token Solutions:');
      console.log('1. Refresh the token');
      console.log('2. Generate a new token with longer expiry');
      console.log('3. Implement automatic token refresh');
      break;
  }
}

// Usage in catch blocks
try {
  await client.identity.resolve(did);
} catch (error) {
  handleATPError(error);
}
```

## Debugging Tools

### Enable Debug Mode

```javascript
// Enable SDK debug mode
const config = {
  baseUrl: 'http://localhost',
  debug: true,
  logging: {
    level: 'debug',
    requests: true,
    responses: true
  }
};

// Environment variable
process.env.ATP_DEBUG = 'true';
process.env.DEBUG = 'atp:*';
```

### Request/Response Logging

```javascript
// Custom request interceptor
import axios from 'axios';

axios.interceptors.request.use(request => {
  console.log('🔄 ATP Request:', {
    method: request.method?.toUpperCase(),
    url: request.url,
    headers: request.headers,
    data: request.data
  });
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log('✅ ATP Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('❌ ATP Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);
```

### Network Diagnostics

```javascript
// Comprehensive network test
async function runNetworkDiagnostics(config) {
  console.log('🔍 Running ATP Network Diagnostics...\n');
  
  const services = {
    identity: config.services?.identity || `${config.baseUrl}:3001`,
    credentials: config.services?.credentials || `${config.baseUrl}:3002`,
    permissions: config.services?.permissions || `${config.baseUrl}:3003`,
    audit: config.services?.audit || `${config.baseUrl}:3004`,
    gateway: config.services?.gateway || `${config.baseUrl}:3000`
  };
  
  for (const [service, url] of Object.entries(services)) {
    console.log(`Testing ${service} service...`);
    
    try {
      const startTime = Date.now();
      const response = await fetch(`${url}/health`, {
        signal: AbortSignal.timeout(10000)
      });
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        console.log(`✅ ${service}: OK (${duration}ms)`);
      } else {
        console.log(`⚠️  ${service}: HTTP ${response.status} (${duration}ms)`);
      }
      
    } catch (error) {
      console.log(`❌ ${service}: ${error.message}`);
    }
  }
  
  console.log('\n📊 Diagnostic complete');
}

// Run diagnostics
await runNetworkDiagnostics(config);
```

### Performance Profiling

```javascript
// Performance profiler
class ATPProfiler {
  constructor() {
    this.operations = new Map();
  }
  
  start(operation) {
    this.operations.set(operation, {
      startTime: performance.now(),
      startMemory: process.memoryUsage()
    });
  }
  
  end(operation) {
    const start = this.operations.get(operation);
    if (!start) return;
    
    const endTime = performance.now();
    const endMemory = process.memoryUsage();
    
    const stats = {
      duration: endTime - start.startTime,
      memoryDelta: endMemory.heapUsed - start.startMemory.heapUsed
    };
    
    console.log(`📈 ${operation}:`, {
      duration: `${stats.duration.toFixed(2)}ms`,
      memory: `${Math.round(stats.memoryDelta / 1024)}KB`
    });
    
    this.operations.delete(operation);
    return stats;
  }
}

// Usage
const profiler = new ATPProfiler();

profiler.start('identity.resolve');
const result = await client.identity.resolve(did);
profiler.end('identity.resolve');
```

## Getting Help

### Community Resources

- **Documentation**: [https://docs.atp.protocol](https://docs.atp.protocol)
- **GitHub Issues**: [https://github.com/atp/sdk/issues](https://github.com/atp/sdk/issues)
- **Discord Community**: [https://discord.gg/atp](https://discord.gg/atp)
- **Stack Overflow**: Tag your questions with `atp-protocol`

### Reporting Issues

When reporting issues, include:

```javascript
// System information
console.log('System Info:', {
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  atpSdkVersion: require('@atp/sdk/package.json').version
});

// Configuration (sanitized)
console.log('Config:', {
  baseUrl: config.baseUrl,
  timeout: config.timeout,
  retries: config.retries,
  // Don't include sensitive data like private keys
});

// Error details
console.log('Error:', {
  type: error.constructor.name,
  code: error.code,
  message: error.message,
  stack: error.stack.split('\n').slice(0, 10).join('\n')
});
```

### Professional Support

For enterprise support:
- **Email**: enterprise@atp.protocol
- **Support Portal**: [https://support.atp.protocol](https://support.atp.protocol)
- **SLA**: 24/7 support available for enterprise customers

### Emergency Contacts

For critical production issues:
- **Emergency Hotline**: +1-800-ATP-HELP
- **Incident Slack**: #atp-incidents
- **On-call Engineer**: Available 24/7 for Tier 1 customers

Remember to check the [FAQ](./faq.md) and [Known Issues](./known-issues.md) sections before reporting new issues.