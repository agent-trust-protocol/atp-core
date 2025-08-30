# Configuration Guide

This guide covers advanced configuration options for the ATP™ SDK.

## Table of Contents

1. [Basic Configuration](#basic-configuration)
2. [Environment-based Configuration](#environment-based-configuration)
3. [Service-specific Configuration](#service-specific-configuration)
4. [Network Configuration](#network-configuration)
5. [Security Configuration](#security-configuration)
6. [Performance Configuration](#performance-configuration)
7. [Development vs Production](#development-vs-production)

## Basic Configuration

### Quick Configuration

For local development, use the `createQuickConfig` helper:

```javascript
import { createQuickConfig } from '@atp/sdk';

const config = createQuickConfig('http://localhost', {
  timeout: 30000,
  retries: 3,
  auth: {
    did: 'did:atp:testnet:example',
    privateKey: 'your-private-key'
  }
});
```

### Full Configuration

For production environments, provide a complete configuration:

```javascript
const config = {
  baseUrl: 'https://api.atp.example.com',
  
  // Service endpoints (optional - will use baseUrl + default ports if not specified)
  services: {
    identity: 'https://identity.atp.example.com',
    credentials: 'https://credentials.atp.example.com',
    permissions: 'https://permissions.atp.example.com',
    audit: 'https://audit.atp.example.com',
    gateway: 'https://gateway.atp.example.com'
  },
  
  // Authentication
  auth: {
    did: 'did:atp:mainnet:your-identifier',
    privateKey: process.env.ATP_PRIVATE_KEY,
    // OR use token-based auth
    // token: process.env.ATP_AUTH_TOKEN
  },
  
  // Network configuration
  timeout: 30000,         // 30 seconds
  retries: 3,             // Retry failed requests 3 times
  retryDelay: 1000,       // Wait 1 second between retries
  
  // Debugging
  debug: process.env.NODE_ENV === 'development',
  
  // Custom headers
  headers: {
    'User-Agent': 'MyApp/1.0.0',
    'X-API-Version': '1.0'
  }
};
```

## Environment-based Configuration

### Environment Variables

The SDK recognizes these environment variables:

```bash
# Base configuration
ATP_BASE_URL=https://api.atp.example.com
ATP_TIMEOUT=30000
ATP_RETRIES=3
ATP_RETRY_DELAY=1000
ATP_DEBUG=true

# Authentication
ATP_DID=did:atp:mainnet:your-identifier
ATP_PRIVATE_KEY=your-private-key-hex
ATP_AUTH_TOKEN=your-jwt-token

# Service endpoints
ATP_IDENTITY_URL=https://identity.atp.example.com
ATP_CREDENTIALS_URL=https://credentials.atp.example.com
ATP_PERMISSIONS_URL=https://permissions.atp.example.com
ATP_AUDIT_URL=https://audit.atp.example.com
ATP_GATEWAY_URL=https://gateway.atp.example.com

# TLS Configuration
ATP_TLS_CERT_PATH=/path/to/client.crt
ATP_TLS_KEY_PATH=/path/to/client.key
ATP_TLS_CA_PATH=/path/to/ca.crt
ATP_TLS_VERIFY=true
```

### Loading from Environment

```javascript
import { createConfigFromEnv } from '@atp/sdk';

// Loads configuration from environment variables
const config = createConfigFromEnv();

// Or with overrides
const config = createConfigFromEnv({
  timeout: 60000,  // Override default timeout
  debug: true      // Force debug mode
});
```

### Configuration Files

Load configuration from JSON files:

```javascript
import fs from 'fs';

// Load from JSON file
const configFile = process.env.ATP_CONFIG_FILE || './atp-config.json';
const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));

// Merge with environment overrides
config.auth.privateKey = process.env.ATP_PRIVATE_KEY || config.auth.privateKey;
```

Example `atp-config.json`:

```json
{
  "baseUrl": "https://api.atp.example.com",
  "services": {
    "identity": "https://identity.atp.example.com:443",
    "credentials": "https://credentials.atp.example.com:443",
    "permissions": "https://permissions.atp.example.com:443",
    "audit": "https://audit.atp.example.com:443",
    "gateway": "https://gateway.atp.example.com:443"
  },
  "timeout": 30000,
  "retries": 3,
  "retryDelay": 1000,
  "debug": false,
  "headers": {
    "User-Agent": "MyApp/1.0.0"
  }
}
```

## Service-specific Configuration

### Custom Service URLs

Override specific service endpoints:

```javascript
const config = {
  baseUrl: 'https://api.atp.example.com',
  services: {
    // Use custom identity service
    identity: 'https://custom-identity.example.com',
    
    // Use internal audit service
    audit: 'http://internal-audit.local:3004',
    
    // Other services use baseUrl + default ports
    credentials: undefined,  // Will use baseUrl:3002
    permissions: undefined,  // Will use baseUrl:3003
    gateway: undefined       // Will use baseUrl:3000
  }
};
```

### Load Balancing Configuration

For high availability deployments:

```javascript
const config = {
  services: {
    identity: [
      'https://identity-1.atp.example.com',
      'https://identity-2.atp.example.com',
      'https://identity-3.atp.example.com'
    ],
    credentials: [
      'https://creds-1.atp.example.com',
      'https://creds-2.atp.example.com'
    ]
  },
  loadBalancing: {
    strategy: 'round-robin', // 'round-robin', 'random', 'least-connections'
    healthCheck: true,
    healthCheckInterval: 30000
  }
};
```

## Network Configuration

### Timeout Configuration

Configure different timeouts for different operations:

```javascript
const config = {
  timeout: 30000,  // Default timeout
  
  // Per-service timeouts
  serviceTimeouts: {
    identity: 10000,      // Identity operations: 10s
    credentials: 20000,   // Credential operations: 20s
    permissions: 5000,    // Permission checks: 5s
    audit: 60000,         // Audit queries: 60s
    gateway: 120000       // Real-time connections: 2min
  },
  
  // Per-operation timeouts
  operationTimeouts: {
    'identity.resolve': 5000,
    'credentials.verify': 15000,
    'audit.generateReport': 300000  // 5 minutes for reports
  }
};
```

### Retry Configuration

Advanced retry strategies:

```javascript
const config = {
  retries: 3,
  retryDelay: 1000,
  
  // Exponential backoff
  retryStrategy: 'exponential',
  maxRetryDelay: 30000,
  
  // Retry conditions
  retryCondition: (error) => {
    // Retry on network errors and 5xx responses
    return error.code === 'ECONNRESET' || 
           error.code === 'ETIMEDOUT' ||
           (error.status >= 500 && error.status < 600);
  },
  
  // Per-service retry configuration
  serviceRetries: {
    audit: {
      retries: 5,           // More retries for audit service
      retryDelay: 2000
    },
    permissions: {
      retries: 1,           // Fewer retries for real-time decisions
      retryDelay: 500
    }
  }
};
```

### Proxy Configuration

Configure HTTP/HTTPS proxies:

```javascript
const config = {
  proxy: {
    host: 'proxy.company.com',
    port: 8080,
    auth: {
      username: 'proxy-user',
      password: 'proxy-pass'
    }
  },
  
  // SOCKS proxy
  socksProxy: {
    host: 'socks-proxy.company.com',
    port: 1080,
    type: 5  // SOCKS5
  }
};
```

## Security Configuration

### TLS Configuration

Configure TLS/SSL settings:

```javascript
const config = {
  tls: {
    // Client certificate authentication
    cert: fs.readFileSync('./client.crt'),
    key: fs.readFileSync('./client.key'),
    ca: fs.readFileSync('./ca.crt'),
    
    // Certificate verification
    rejectUnauthorized: true,
    checkServerIdentity: true,
    
    // TLS version
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.3',
    
    // Cipher suites
    ciphers: 'ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM',
    
    // OCSP stapling
    requestOCSP: true
  }
};
```

### API Key Configuration

For API key-based authentication:

```javascript
const config = {
  auth: {
    apiKey: process.env.ATP_API_KEY,
    apiKeyHeader: 'X-ATP-API-Key',  // Custom header name
    
    // API key rotation
    rotateApiKey: true,
    rotationInterval: 24 * 60 * 60 * 1000  // 24 hours
  }
};
```

### Rate Limiting

Configure client-side rate limiting:

```javascript
const config = {
  rateLimit: {
    enabled: true,
    requests: 100,        // Max requests
    window: 60000,        // Per 60 seconds
    burst: 10,            // Burst capacity
    
    // Per-service limits
    serviceLimits: {
      audit: { requests: 50, window: 60000 },
      permissions: { requests: 200, window: 60000 }
    }
  }
};
```

## Performance Configuration

### Connection Pooling

Configure HTTP connection pooling:

```javascript
const config = {
  connectionPool: {
    maxSockets: 50,           // Max concurrent connections
    maxFreeSockets: 10,       // Keep-alive connections
    timeout: 60000,           // Connection timeout
    freeSocketTimeout: 15000, // Keep-alive timeout
    
    // Per-host limits
    maxSocketsPerHost: 10
  }
};
```

### Caching

Configure response caching:

```javascript
const config = {
  cache: {
    enabled: true,
    ttl: 300000,  // 5 minutes default TTL
    
    // Per-operation caching
    operationCache: {
      'identity.resolve': { ttl: 600000 },      // 10 minutes
      'credentials.getSchema': { ttl: 3600000 }, // 1 hour
      'permissions.getPolicy': { ttl: 1800000 }  // 30 minutes
    },
    
    // Cache storage
    storage: 'memory',  // 'memory', 'redis', 'file'
    
    // Redis configuration (if using Redis)
    redis: {
      host: 'redis.example.com',
      port: 6379,
      password: process.env.REDIS_PASSWORD
    }
  }
};
```

### Compression

Enable response compression:

```javascript
const config = {
  compression: {
    enabled: true,
    algorithms: ['gzip', 'deflate', 'br'],  // Supported algorithms
    threshold: 1024  // Minimum size to compress (bytes)
  }
};
```

## Development vs Production

### Development Configuration

```javascript
// development.config.js
export const developmentConfig = {
  baseUrl: 'http://localhost',
  
  // Relaxed timeouts for debugging
  timeout: 60000,
  retries: 1,
  
  // Enable debugging
  debug: true,
  
  // Mock authentication for testing
  auth: {
    mock: true,
    mockUser: 'did:atp:testnet:developer'
  },
  
  // Disable TLS verification for local testing
  tls: {
    rejectUnauthorized: false
  },
  
  // Enable request logging
  logging: {
    requests: true,
    responses: true,
    level: 'debug'
  }
};
```

### Production Configuration

```javascript
// production.config.js
export const productionConfig = {
  baseUrl: 'https://api.atp.example.com',
  
  // Production timeouts
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  
  // Strict security
  tls: {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2'
  },
  
  // Production authentication
  auth: {
    did: process.env.ATP_DID,
    privateKey: process.env.ATP_PRIVATE_KEY
  },
  
  // Error reporting
  errorReporting: {
    enabled: true,
    endpoint: 'https://errors.example.com/api/errors',
    apiKey: process.env.ERROR_REPORTING_KEY
  },
  
  // Monitoring
  monitoring: {
    enabled: true,
    metricsEndpoint: 'https://metrics.example.com',
    healthCheckInterval: 30000
  }
};
```

### Configuration Validation

Validate configuration before using:

```javascript
import { validateConfig } from '@atp/sdk';

const config = loadConfiguration();

// Validate configuration
const validation = validateConfig(config);
if (!validation.valid) {
  console.error('Configuration validation failed:');
  validation.errors.forEach(error => {
    console.error(`- ${error.field}: ${error.message}`);
  });
  process.exit(1);
}

// Configuration is valid, create client
const client = new ATPClient(config);
```

### Environment-specific Loading

```javascript
// config/index.js
const environment = process.env.NODE_ENV || 'development';

let config;
switch (environment) {
  case 'development':
    config = await import('./development.config.js');
    break;
  case 'staging':
    config = await import('./staging.config.js');
    break;
  case 'production':
    config = await import('./production.config.js');
    break;
  default:
    throw new Error(`Unknown environment: ${environment}`);
}

export default config.default;
```

## Configuration Best Practices

1. **Environment Variables**: Use environment variables for sensitive data
2. **Validation**: Always validate configuration before use
3. **Defaults**: Provide sensible defaults for optional settings
4. **Documentation**: Document all configuration options
5. **Encryption**: Encrypt configuration files containing secrets
6. **Rotation**: Implement credential rotation for production
7. **Monitoring**: Monitor configuration changes
8. **Testing**: Test configuration in staging environments first

## Troubleshooting Configuration

### Common Issues

1. **Connection Refused**: Check baseUrl and service endpoints
2. **Timeout Errors**: Increase timeout values
3. **Authentication Failures**: Verify DID and private key
4. **Certificate Errors**: Check TLS configuration
5. **Rate Limiting**: Adjust rate limit settings

### Debug Configuration

Enable debug mode to troubleshoot:

```javascript
const config = {
  debug: true,
  logging: {
    level: 'debug',
    requests: true,
    responses: true
  }
};
```

This will log all HTTP requests and responses to help identify configuration issues.