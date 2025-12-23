# Error Handling Guide

This guide covers comprehensive error handling patterns and best practices for the ATP™ SDK.

## Table of Contents

1. [Error Types](#error-types)
2. [Basic Error Handling](#basic-error-handling)
3. [Advanced Error Patterns](#advanced-error-patterns)
4. [Retry Strategies](#retry-strategies)
5. [Circuit Breakers](#circuit-breakers)
6. [Error Recovery](#error-recovery)
7. [Logging and Monitoring](#logging-and-monitoring)
8. [Testing Error Scenarios](#testing-error-scenarios)

## Error Types

The ATP™ SDK provides a structured error hierarchy for different types of failures:

### Base Error Classes

```javascript
import {
  ATPError,              // Base error class
  ATPNetworkError,       // Network-related errors
  ATPAuthenticationError, // Authentication failures
  ATPAuthorizationError,  // Permission/access errors
  ATPValidationError,     // Input validation errors
  ATPServiceError        // Service-specific errors
} from '@atp/sdk';
```

### Error Properties

All ATP errors include these properties:

```javascript
try {
  await client.identity.resolve('invalid-did');
} catch (error) {
  console.log('Error type:', error.constructor.name);
  console.log('Message:', error.message);
  console.log('Error code:', error.code);
  console.log('Details:', error.details);
  console.log('Timestamp:', error.timestamp);
  console.log('Request ID:', error.requestId);
  
  // Network errors also include:
  if (error instanceof ATPNetworkError) {
    console.log('Status code:', error.statusCode);
    console.log('Response data:', error.response);
  }
}
```

### Common Error Codes

#### Authentication Errors
- `INVALID_DID` - Malformed DID
- `INVALID_SIGNATURE` - Cryptographic signature verification failed
- `TOKEN_EXPIRED` - JWT token has expired
- `TOKEN_INVALID` - JWT token is malformed or invalid
- `MFA_REQUIRED` - Multi-factor authentication required
- `INSUFFICIENT_TRUST` - Trust level too low for operation

#### Authorization Errors
- `ACCESS_DENIED` - Insufficient permissions
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `OPERATION_NOT_ALLOWED` - Operation not permitted
- `QUOTA_EXCEEDED` - Rate limit or quota exceeded

#### Network Errors
- `CONNECTION_TIMEOUT` - Request timed out
- `CONNECTION_REFUSED` - Cannot connect to service
- `DNS_RESOLUTION_FAILED` - Cannot resolve hostname
- `SSL_ERROR` - TLS/SSL certificate issue

#### Validation Errors
- `INVALID_INPUT` - Input validation failed
- `MISSING_REQUIRED_FIELD` - Required field not provided
- `INVALID_FORMAT` - Data format is incorrect
- `SCHEMA_VALIDATION_FAILED` - JSON schema validation failed

## Basic Error Handling

### Try-Catch Pattern

```javascript
async function basicErrorHandling() {
  try {
    const result = await client.identity.resolve('did:atp:testnet:example');
    console.log('Identity resolved:', result.data);
    
  } catch (error) {
    if (error instanceof ATPValidationError) {
      console.error('Invalid DID format:', error.message);
      
    } else if (error instanceof ATPNetworkError) {
      console.error('Network error:', error.message);
      console.error('Status:', error.statusCode);
      
    } else if (error instanceof ATPAuthenticationError) {
      console.error('Authentication failed:', error.message);
      
    } else {
      console.error('Unexpected error:', error.message);
    }
  }
}
```

### Error Type Checking

```javascript
function handleSpecificErrors(error) {
  switch (error.constructor.name) {
    case 'ATPAuthenticationError':
      if (error.code === 'MFA_REQUIRED') {
        return handleMFARequired(error);
      } else if (error.code === 'TOKEN_EXPIRED') {
        return handleTokenExpired(error);
      }
      break;
      
    case 'ATPAuthorizationError':
      if (error.code === 'ACCESS_DENIED') {
        return handleAccessDenied(error);
      }
      break;
      
    case 'ATPNetworkError':
      if (error.statusCode >= 500) {
        return handleServerError(error);
      } else if (error.statusCode === 429) {
        return handleRateLimit(error);
      }
      break;
      
    default:
      return handleGenericError(error);
  }
}
```

### Error Context

Extract useful context from errors:

```javascript
function extractErrorContext(error) {
  const context = {
    errorType: error.constructor.name,
    message: error.message,
    code: error.code,
    timestamp: error.timestamp || new Date().toISOString(),
    requestId: error.requestId
  };

  // Add service-specific context
  if (error instanceof ATPServiceError) {
    context.service = error.service;
    context.operation = error.operation;
  }

  // Add network context
  if (error instanceof ATPNetworkError) {
    context.statusCode = error.statusCode;
    context.url = error.config?.url;
    context.method = error.config?.method;
  }

  // Add validation context
  if (error instanceof ATPValidationError) {
    context.field = error.field;
    context.value = error.value;
    context.constraint = error.constraint;
  }

  return context;
}
```

## Advanced Error Patterns

### Error Wrapper Class

Create a unified error handling wrapper:

```javascript
class ATPErrorHandler {
  constructor(options = {}) {
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.logger = options.logger || console;
    this.metrics = options.metrics;
  }

  async execute(operation, context = {}) {
    const startTime = Date.now();
    
    try {
      const result = await this.executeWithRetry(operation, context);
      
      // Record success metrics
      if (this.metrics) {
        this.metrics.recordSuccess(context.operation, Date.now() - startTime);
      }
      
      return result;
      
    } catch (error) {
      // Record failure metrics
      if (this.metrics) {
        this.metrics.recordFailure(
          context.operation, 
          error.constructor.name,
          Date.now() - startTime
        );
      }
      
      // Log error with context
      this.logError(error, context);
      
      // Transform error if needed
      throw this.transformError(error, context);
    }
  }

  async executeWithRetry(operation, context) {
    let lastError;
    
    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        return await operation();
        
      } catch (error) {
        lastError = error;
        
        // Don't retry certain error types
        if (!this.shouldRetry(error, attempt)) {
          throw error;
        }
        
        // Wait before retry
        if (attempt < this.retryAttempts - 1) {
          await this.delay(this.calculateRetryDelay(attempt));
        }
      }
    }
    
    throw lastError;
  }

  shouldRetry(error, attempt) {
    // Don't retry validation or authentication errors
    if (error instanceof ATPValidationError || 
        error instanceof ATPAuthenticationError) {
      return false;
    }

    // Retry network errors and server errors
    if (error instanceof ATPNetworkError) {
      return error.statusCode >= 500 || error.statusCode === 429;
    }

    return true;
  }

  calculateRetryDelay(attempt) {
    // Exponential backoff with jitter
    const baseDelay = this.retryDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * baseDelay;
    return baseDelay + jitter;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  logError(error, context) {
    const errorContext = {
      ...extractErrorContext(error),
      ...context,
      stack: error.stack
    };

    this.logger.error('ATP SDK Error:', errorContext);
  }

  transformError(error, context) {
    // Transform errors for specific business logic
    if (error instanceof ATPAuthorizationError && 
        error.code === 'ACCESS_DENIED' && 
        context.operation === 'sensitive_operation') {
      
      return new Error('Access to sensitive operation requires additional permissions');
    }

    return error;
  }
}

// Usage
const errorHandler = new ATPErrorHandler({
  retryAttempts: 3,
  retryDelay: 1000,
  logger: winston.createLogger({...}),
  metrics: new MetricsCollector()
});

const result = await errorHandler.execute(
  () => client.identity.resolve(did),
  { operation: 'identity.resolve', did }
);
```

### Async Error Boundaries

Implement error boundaries for async operations:

```javascript
class AsyncErrorBoundary {
  constructor(options = {}) {
    this.fallbackHandlers = new Map();
    this.errorReporters = [];
    this.circuitBreakers = new Map();
  }

  addFallbackHandler(errorType, handler) {
    this.fallbackHandlers.set(errorType, handler);
  }

  addErrorReporter(reporter) {
    this.errorReporters.push(reporter);
  }

  async protect(operation, context = {}) {
    try {
      return await operation();
      
    } catch (error) {
      // Report error to external systems
      await this.reportError(error, context);
      
      // Try fallback handlers
      const fallback = this.findFallbackHandler(error);
      if (fallback) {
        try {
          return await fallback(error, context);
        } catch (fallbackError) {
          // Fallback failed, continue with original error
        }
      }
      
      throw error;
    }
  }

  findFallbackHandler(error) {
    // Check for specific error type handlers
    for (const [errorType, handler] of this.fallbackHandlers) {
      if (error instanceof errorType) {
        return handler;
      }
    }
    
    // Check for error code handlers
    return this.fallbackHandlers.get(error.code);
  }

  async reportError(error, context) {
    const errorReport = {
      error: extractErrorContext(error),
      context,
      timestamp: new Date().toISOString(),
      stack: error.stack
    };

    // Send to all error reporters
    await Promise.allSettled(
      this.errorReporters.map(reporter => reporter.report(errorReport))
    );
  }
}

// Setup error boundary
const errorBoundary = new AsyncErrorBoundary();

// Add fallback for network errors
errorBoundary.addFallbackHandler(ATPNetworkError, async (error, context) => {
  if (context.operation === 'identity.resolve') {
    // Return cached identity if available
    return await getCachedIdentity(context.did);
  }
  throw error;
});

// Add fallback for authentication errors
errorBoundary.addFallbackHandler(ATPAuthenticationError, async (error, context) => {
  if (error.code === 'TOKEN_EXPIRED') {
    // Attempt token refresh
    await refreshAuthToken();
    return await context.retry();
  }
  throw error;
});

// Usage
const identity = await errorBoundary.protect(
  () => client.identity.resolve(did),
  { operation: 'identity.resolve', did, retry: () => client.identity.resolve(did) }
);
```

## Retry Strategies

### Exponential Backoff

```javascript
class ExponentialBackoff {
  constructor(options = {}) {
    this.initialDelay = options.initialDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.multiplier = options.multiplier || 2;
    this.jitter = options.jitter || 0.1;
  }

  async execute(operation, maxAttempts = 3) {
    let attempt = 0;
    
    while (attempt < maxAttempts) {
      try {
        return await operation();
        
      } catch (error) {
        attempt++;
        
        if (attempt >= maxAttempts || !this.shouldRetry(error)) {
          throw error;
        }
        
        const delay = this.calculateDelay(attempt - 1);
        await this.sleep(delay);
      }
    }
  }

  calculateDelay(attempt) {
    let delay = this.initialDelay * Math.pow(this.multiplier, attempt);
    delay = Math.min(delay, this.maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitterAmount = delay * this.jitter;
    const jitter = (Math.random() - 0.5) * 2 * jitterAmount;
    
    return Math.max(0, delay + jitter);
  }

  shouldRetry(error) {
    // Retry on network errors and server errors
    return error instanceof ATPNetworkError && 
           (error.statusCode >= 500 || error.statusCode === 429);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Retry with Decorators

```javascript
function retry(attempts = 3, delay = 1000) {
  return function(target, propertyName, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      let lastError;
      
      for (let attempt = 0; attempt < attempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
          
        } catch (error) {
          lastError = error;
          
          if (attempt < attempts - 1 && shouldRetryError(error)) {
            await sleep(delay * Math.pow(2, attempt));
          } else {
            break;
          }
        }
      }
      
      throw lastError;
    };
    
    return descriptor;
  };
}

// Usage
class IdentityService {
  constructor(client) {
    this.client = client;
  }

  @retry(3, 1000)
  async resolveIdentity(did) {
    return await this.client.identity.resolve(did);
  }

  @retry(5, 2000)
  async createCredential(request) {
    return await this.client.credentials.issue(request);
  }
}
```

## Circuit Breakers

### Basic Circuit Breaker

```javascript
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000;
    this.monitoringPeriod = options.monitoringPeriod || 10000;
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
      
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = 'CLOSED';
      }
    } else {
      this.state = 'CLOSED';
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  shouldAttemptReset() {
    return Date.now() - this.lastFailureTime > this.resetTimeout;
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

// Service-specific circuit breakers
class ServiceClient {
  constructor(atpClient) {
    this.client = atpClient;
    this.circuitBreakers = {
      identity: new CircuitBreaker({ failureThreshold: 3, resetTimeout: 15000 }),
      credentials: new CircuitBreaker({ failureThreshold: 5, resetTimeout: 30000 }),
      audit: new CircuitBreaker({ failureThreshold: 10, resetTimeout: 60000 })
    };
  }

  async resolveIdentity(did) {
    return await this.circuitBreakers.identity.execute(
      () => this.client.identity.resolve(did)
    );
  }

  async issueCredential(request) {
    return await this.circuitBreakers.credentials.execute(
      () => this.client.credentials.issue(request)
    );
  }
}
```

## Error Recovery

### Graceful Degradation

```javascript
class GracefulDegradationHandler {
  constructor(client, fallbackStrategies = {}) {
    this.client = client;
    this.fallbackStrategies = fallbackStrategies;
    this.cache = new Map();
  }

  async resolveIdentityWithFallback(did) {
    try {
      // Try primary service
      const result = await this.client.identity.resolve(did);
      
      // Cache successful result
      this.cache.set(`identity:${did}`, {
        data: result,
        timestamp: Date.now(),
        ttl: 300000 // 5 minutes
      });
      
      return result;
      
    } catch (error) {
      console.warn('Primary identity service failed:', error.message);
      
      // Try fallback strategies
      return await this.tryFallbackStrategies('identity.resolve', did, error);
    }
  }

  async tryFallbackStrategies(operation, ...args) {
    const strategies = this.fallbackStrategies[operation] || [];
    
    for (const strategy of strategies) {
      try {
        return await strategy.apply(this, args);
      } catch (fallbackError) {
        console.warn('Fallback strategy failed:', fallbackError.message);
      }
    }
    
    throw new Error(`All fallback strategies exhausted for ${operation}`);
  }

  // Fallback strategy: use cached data
  async getCachedIdentity(did) {
    const cached = this.cache.get(`identity:${did}`);
    
    if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
      console.info('Using cached identity data');
      return cached.data;
    }
    
    throw new Error('No valid cached data available');
  }

  // Fallback strategy: use alternative service
  async getIdentityFromAlternativeService(did) {
    const alternativeUrl = process.env.ALTERNATIVE_IDENTITY_SERVICE;
    if (!alternativeUrl) {
      throw new Error('No alternative service configured');
    }
    
    const response = await fetch(`${alternativeUrl}/identity/${did}`);
    if (!response.ok) {
      throw new Error('Alternative service request failed');
    }
    
    return await response.json();
  }

  // Fallback strategy: return partial data
  async getPartialIdentityData(did) {
    console.info('Returning partial identity data');
    
    return {
      success: true,
      data: {
        did: did,
        status: 'unknown',
        partial: true,
        message: 'Limited data due to service unavailability'
      }
    };
  }
}

// Setup fallback strategies
const degradationHandler = new GracefulDegradationHandler(client, {
  'identity.resolve': [
    handler.getCachedIdentity.bind(handler),
    handler.getIdentityFromAlternativeService.bind(handler),
    handler.getPartialIdentityData.bind(handler)
  ]
});
```

### Recovery Workflows

```javascript
class RecoveryWorkflow {
  constructor(client) {
    this.client = client;
    this.recoveryAttempts = new Map();
  }

  async executeWithRecovery(operation, context) {
    const recoveryKey = context.recoveryKey || 'default';
    
    try {
      return await operation();
      
    } catch (error) {
      return await this.attemptRecovery(error, operation, context, recoveryKey);
    }
  }

  async attemptRecovery(error, operation, context, recoveryKey) {
    const attempts = this.recoveryAttempts.get(recoveryKey) || 0;
    const maxAttempts = context.maxRecoveryAttempts || 3;
    
    if (attempts >= maxAttempts) {
      throw new Error(`Recovery failed after ${attempts} attempts: ${error.message}`);
    }
    
    this.recoveryAttempts.set(recoveryKey, attempts + 1);
    
    try {
      // Execute recovery strategy based on error type
      await this.executeRecoveryStrategy(error, context);
      
      // Retry original operation
      const result = await operation();
      
      // Reset recovery counter on success
      this.recoveryAttempts.delete(recoveryKey);
      
      return result;
      
    } catch (recoveryError) {
      // Recovery failed, wait and try again
      await this.delay(1000 * Math.pow(2, attempts));
      return await this.attemptRecovery(error, operation, context, recoveryKey);
    }
  }

  async executeRecoveryStrategy(error, context) {
    if (error instanceof ATPAuthenticationError) {
      await this.recoverAuthentication(error, context);
      
    } else if (error instanceof ATPNetworkError) {
      await this.recoverNetworkError(error, context);
      
    } else if (error instanceof ATPServiceError) {
      await this.recoverServiceError(error, context);
    }
  }

  async recoverAuthentication(error, context) {
    if (error.code === 'TOKEN_EXPIRED') {
      console.info('Attempting token refresh');
      await this.refreshToken(context);
      
    } else if (error.code === 'MFA_REQUIRED') {
      console.info('Attempting MFA recovery');
      await this.handleMFARecovery(context);
    }
  }

  async recoverNetworkError(error, context) {
    if (error.statusCode >= 500) {
      console.info('Server error detected, checking service health');
      await this.waitForServiceHealth(context.service);
    }
  }

  async recoverServiceError(error, context) {
    console.info(`Attempting service-specific recovery for ${error.service}`);
    // Implement service-specific recovery logic
  }

  async refreshToken(context) {
    // Implement token refresh logic
    const newToken = await this.generateNewToken(context);
    this.client.setAuthentication({ token: newToken });
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Logging and Monitoring

### Error Logging

```javascript
class ErrorLogger {
  constructor(options = {}) {
    this.logLevel = options.logLevel || 'info';
    this.destinations = options.destinations || [console];
    this.sensitiveFields = options.sensitiveFields || ['privateKey', 'password', 'token'];
  }

  logError(error, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message,
      errorType: error.constructor.name,
      code: error.code,
      requestId: error.requestId,
      context: this.sanitizeContext(context),
      stack: error.stack
    };

    // Add service-specific information
    if (error instanceof ATPServiceError) {
      logEntry.service = error.service;
      logEntry.operation = error.operation;
    }

    // Add network information
    if (error instanceof ATPNetworkError) {
      logEntry.statusCode = error.statusCode;
      logEntry.url = error.config?.url;
      logEntry.method = error.config?.method;
    }

    this.writeToDestinations(logEntry);
  }

  sanitizeContext(context) {
    const sanitized = { ...context };
    
    this.sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  writeToDestinations(logEntry) {
    this.destinations.forEach(destination => {
      if (typeof destination.error === 'function') {
        destination.error(logEntry);
      } else {
        destination.log(JSON.stringify(logEntry));
      }
    });
  }
}

// Setup with Winston
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console()
  ]
});

const errorLogger = new ErrorLogger({
  destinations: [logger],
  sensitiveFields: ['privateKey', 'token', 'password', 'secret']
});
```

### Error Metrics

```javascript
class ErrorMetrics {
  constructor(metricsClient) {
    this.metrics = metricsClient;
  }

  recordError(error, context = {}) {
    const tags = {
      errorType: error.constructor.name,
      errorCode: error.code || 'unknown',
      service: context.service || 'unknown',
      operation: context.operation || 'unknown'
    };

    // Increment error counter
    this.metrics.increment('atp.sdk.errors.total', 1, tags);

    // Record error by type
    this.metrics.increment(`atp.sdk.errors.${error.constructor.name.toLowerCase()}`, 1, tags);

    // Record response time if available
    if (context.duration) {
      this.metrics.timing('atp.sdk.errors.duration', context.duration, tags);
    }

    // Record service-specific metrics
    if (error instanceof ATPNetworkError) {
      this.metrics.increment(`atp.sdk.network_errors.status_${error.statusCode}`, 1, tags);
    }
  }

  recordRecovery(error, recoveryMethod, success) {
    const tags = {
      errorType: error.constructor.name,
      recoveryMethod: recoveryMethod,
      success: success.toString()
    };

    this.metrics.increment('atp.sdk.recovery_attempts', 1, tags);
  }
}
```

## Testing Error Scenarios

### Error Simulation

```javascript
// Test helper for simulating errors
class ErrorSimulator {
  constructor(client) {
    this.client = client;
    this.simulationMode = false;
    this.errorScenarios = new Map();
  }

  enableSimulation() {
    this.simulationMode = true;
  }

  disableSimulation() {
    this.simulationMode = false;
    this.errorScenarios.clear();
  }

  addErrorScenario(operation, errorType, probability = 1.0) {
    this.errorScenarios.set(operation, {
      errorType,
      probability,
      count: 0
    });
  }

  async simulateOperation(operation, originalFunction, ...args) {
    if (!this.simulationMode) {
      return await originalFunction.apply(this.client, args);
    }

    const scenario = this.errorScenarios.get(operation);
    if (scenario && Math.random() < scenario.probability) {
      scenario.count++;
      
      switch (scenario.errorType) {
        case 'network_timeout':
          throw new ATPNetworkError('Request timeout', 'TIMEOUT');
        
        case 'auth_failure':
          throw new ATPAuthenticationError('Authentication failed', 'AUTH_FAILED');
        
        case 'server_error':
          throw new ATPNetworkError('Internal server error', 'SERVER_ERROR', { statusCode: 500 });
        
        case 'rate_limit':
          throw new ATPNetworkError('Rate limit exceeded', 'RATE_LIMIT', { statusCode: 429 });
        
        default:
          throw new ATPError('Simulated error');
      }
    }

    return await originalFunction.apply(this.client, args);
  }
}

// Test cases
describe('Error Handling', () => {
  let client, simulator;

  beforeEach(() => {
    client = new ATPClient(testConfig);
    simulator = new ErrorSimulator(client);
  });

  test('should handle network timeouts', async () => {
    simulator.enableSimulation();
    simulator.addErrorScenario('identity.resolve', 'network_timeout', 1.0);

    await expect(
      simulator.simulateOperation(
        'identity.resolve',
        client.identity.resolve,
        'did:atp:testnet:example'
      )
    ).rejects.toThrow(ATPNetworkError);
  });

  test('should retry on server errors', async () => {
    const retryHandler = new ExponentialBackoff({ maxAttempts: 3 });
    
    simulator.enableSimulation();
    simulator.addErrorScenario('identity.resolve', 'server_error', 0.8);

    // Should eventually succeed or fail after retries
    try {
      await retryHandler.execute(() =>
        simulator.simulateOperation(
          'identity.resolve',
          client.identity.resolve,
          'did:atp:testnet:example'
        )
      );
    } catch (error) {
      expect(error).toBeInstanceOf(ATPNetworkError);
    }
  });

  test('should recover from authentication failures', async () => {
    const recoveryWorkflow = new RecoveryWorkflow(client);
    
    simulator.enableSimulation();
    simulator.addErrorScenario('identity.resolve', 'auth_failure', 1.0);

    // Mock token refresh
    jest.spyOn(recoveryWorkflow, 'refreshToken').mockResolvedValue(undefined);

    const result = await recoveryWorkflow.executeWithRecovery(
      () => simulator.simulateOperation(
        'identity.resolve',
        client.identity.resolve,
        'did:atp:testnet:example'
      ),
      { recoveryKey: 'test', maxRecoveryAttempts: 2 }
    );

    expect(recoveryWorkflow.refreshToken).toHaveBeenCalled();
  });
});
```

This comprehensive error handling guide provides patterns and strategies for building resilient applications with the ATP™ SDK. Always implement appropriate error handling for your specific use cases and test error scenarios thoroughly.