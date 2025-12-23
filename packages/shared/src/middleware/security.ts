import { Request, Response, NextFunction } from 'express';
import { RateLimiter, RateLimitConfig } from '../security/rate-limiter.js';
import { RequestValidator } from '../security/request-validator.js';
import { APISecurityManager } from '../security/api-security.js';
import { RedisCache } from '../cache/redis.js';

export interface SecurityMiddlewareOptions {
  cache: RedisCache;
  securityManager: APISecurityManager;
  rateLimits?: {
    [endpoint: string]: RateLimitConfig;
  };
  enableRequestValidation?: boolean;
  enableSecurityHeaders?: boolean;
  enableRequestSigning?: boolean;
}

export class SecurityMiddleware {
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private securityManager: APISecurityManager;
  private options: SecurityMiddlewareOptions;

  constructor(options: SecurityMiddlewareOptions) {
    this.options = options;
    this.securityManager = options.securityManager;

    // Initialize rate limiters
    if (options.rateLimits) {
      for (const [endpoint, config] of Object.entries(options.rateLimits)) {
        this.rateLimiters.set(endpoint, new RateLimiter(options.cache, config));
      }
    }
  }

  // Security headers middleware
  securityHeaders() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (this.options.enableSecurityHeaders !== false) {
        const headers = this.securityManager.getSecurityHeaders();
        for (const [key, value] of Object.entries(headers)) {
          res.setHeader(key, value);
        }
      }
      next();
    };
  }

  // Rate limiting middleware
  rateLimit(endpoint?: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const limiter = this.rateLimiters.get(endpoint || 'default');
        if (!limiter) {
          return next();
        }

        const clientId = this.getClientIdentifier(req);
        const result = await limiter.checkLimit(clientId, endpoint);

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', limiter['config'].maxRequests);
        res.setHeader('X-RateLimit-Remaining', result.remainingRequests);
        res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

        if (!result.allowed) {
          return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          });
        }

        next();
      } catch (error) {
        console.error('Rate limiting error:', error);
        next(); // Fail open
      }
    };
  }

  // Request validation middleware
  requestValidation(validatorFn?: (data: unknown) => any) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (this.options.enableRequestValidation === false) {
        return next();
      }

      try {
        // Basic security checks on all string inputs
        const checkAllStrings = (obj: any): string[] => {
          const errors: string[] = [];

          const traverse = (value: any, path: string = '') => {
            if (typeof value === 'string') {
              const securityCheck = RequestValidator.validateSecureInput(value);
              if (!securityCheck.valid) {
                errors.push(...securityCheck.errors.map(err => `${path}: ${err}`));
              }
            } else if (Array.isArray(value)) {
              value.forEach((item, index) => traverse(item, `${path}[${index}]`));
            } else if (value && typeof value === 'object') {
              for (const [key, val] of Object.entries(value)) {
                traverse(val, path ? `${path}.${key}` : key);
              }
            }
          };

          traverse(obj);
          return errors;
        };

        const securityErrors = checkAllStrings(req.body);
        if (securityErrors.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Security validation failed',
            details: securityErrors
          });
        }

        // Run specific validator if provided
        if (validatorFn) {
          const result = validatorFn(req.body);
          if (!result.valid) {
            return res.status(400).json({
              success: false,
              error: 'Validation failed',
              details: result.errors
            });
          }
          req.body = result.sanitizedData;
        }

        next();
      } catch (error) {
        console.error('Request validation error:', error);
        res.status(400).json({
          success: false,
          error: 'Invalid request format'
        });
      }
    };
  }

  // Request signing verification middleware
  requestSigning() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (this.options.enableRequestSigning === false) {
        return next();
      }

      const signature = req.headers['x-signature'] as string;
      const timestamp = parseInt(req.headers['x-timestamp'] as string);
      const apiKey = req.headers['x-api-key'] as string;

      if (!signature || !timestamp || !apiKey) {
        return res.status(401).json({
          success: false,
          error: 'Request signing required'
        });
      }

      const body = JSON.stringify(req.body || {});
      const isValid = this.securityManager.verifyRequestSignature(
        req.method,
        req.path,
        body,
        timestamp,
        signature,
        apiKey
      );

      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid request signature'
        });
      }

      next();
    };
  }

  // CORS middleware with security considerations
  corsMiddleware(allowedOrigins: string[] = ['http://localhost:3000']) {
    return (req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin;

      if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }

      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Signature, X-Timestamp');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }

      next();
    };
  }

  // IP whitelist middleware
  ipWhitelist(allowedIPs: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientIP = this.securityManager.extractClientIP(req);

      if (!allowedIPs.includes(clientIP) && !allowedIPs.includes('*')) {
        return res.status(403).json({
          success: false,
          error: 'IP not allowed'
        });
      }

      next();
    };
  }

  // Request size limiting
  requestSizeLimit(maxSizeBytes: number = 10 * 1024 * 1024) { // 10MB default
    return (req: Request, res: Response, next: NextFunction) => {
      const contentLength = parseInt(req.headers['content-length'] || '0');

      if (contentLength > maxSizeBytes) {
        return res.status(413).json({
          success: false,
          error: 'Request too large'
        });
      }

      next();
    };
  }

  // Security audit logging
  auditLogging() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const clientIP = this.securityManager.extractClientIP(req);
      const userAgent = req.headers['user-agent'] || 'unknown';

      // Log request
      console.log(`[AUDIT] ${req.method} ${req.path} from ${clientIP}`);

      // Override res.json to log responses
      const originalJson = res.json.bind(res);
      res.json = function(body: any) {
        const responseTime = Date.now() - startTime;
        const statusCode = res.statusCode;

        // Log response
        console.log(`[AUDIT] ${req.method} ${req.path} - ${statusCode} - ${responseTime}ms`);

        // Log security events
        if (statusCode === 401) {
          console.log(`[SECURITY] Authentication failure from ${clientIP} - ${userAgent}`);
        } else if (statusCode === 403) {
          console.log(`[SECURITY] Authorization failure from ${clientIP} - ${userAgent}`);
        } else if (statusCode === 429) {
          console.log(`[SECURITY] Rate limit exceeded from ${clientIP} - ${userAgent}`);
        }

        return originalJson(body);
      };

      next();
    };
  }

  private getClientIdentifier(req: Request): string {
    // Use API key if available, otherwise fall back to IP
    const apiKeyHeader = req.headers['x-api-key'] || req.headers['authorization'];
    if (apiKeyHeader) {
      return `api:${this.securityManager.hashAPIKey(apiKeyHeader.toString())}`;
    }

    return `ip:${this.securityManager.extractClientIP(req)}`;
  }
}

// Factory function for easy setup
export function createSecurityMiddleware(options: SecurityMiddlewareOptions): SecurityMiddleware {
  return new SecurityMiddleware(options);
}
