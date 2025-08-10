import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';

export interface APIKey {
  id: string;
  name: string;
  keyHash: string;
  permissions: string[];
  organizationId?: string;
  expiresAt?: Date;
  createdAt: Date;
  lastUsed?: Date;
  rateLimit?: {
    requestsPerMinute: number;
    burstLimit: number;
  };
}

export interface JWTPayload {
  sub: string;        // Subject (DID)
  iss: string;        // Issuer
  aud: string;        // Audience
  exp: number;        // Expiration
  iat: number;        // Issued at
  jti: string;        // JWT ID
  permissions: string[];
  organizationId?: string;
  apiKeyId?: string;
}

export class APISecurityManager {
  private jwtSecret: string;
  private jwtIssuer: string;

  constructor(jwtSecret: string, jwtIssuer: string = 'atp-system') {
    this.jwtSecret = jwtSecret;
    this.jwtIssuer = jwtIssuer;
  }

  // API Key Management
  generateAPIKey(): { apiKey: string; keyHash: string; id: string } {
    const id = randomBytes(16).toString('hex');
    const apiKey = `atp_${id}_${randomBytes(32).toString('base64url')}`;
    const keyHash = createHash('sha256').update(apiKey).digest('hex');
    
    return { apiKey, keyHash, id };
  }

  hashAPIKey(apiKey: string): string {
    return createHash('sha256').update(apiKey).digest('hex');
  }

  validateAPIKeyFormat(apiKey: string): boolean {
    return /^atp_[a-f0-9]{32}_[A-Za-z0-9_-]{43}$/.test(apiKey);
  }

  // JWT Management
  generateJWT(payload: Omit<JWTPayload, 'iss' | 'iat' | 'jti'>): string {
    const jwtPayload: JWTPayload = {
      ...payload,
      iss: this.jwtIssuer,
      iat: Math.floor(Date.now() / 1000),
      jti: randomBytes(16).toString('hex')
    };

    return jwt.sign(jwtPayload, this.jwtSecret, {
      algorithm: 'HS256'
    });
  }

  verifyJWT(token: string): JWTPayload | null {
    try {
      const payload = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
        issuer: this.jwtIssuer
      }) as JWTPayload;

      // Check expiration
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        return null;
      }

      return payload;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  // Security Headers
  getSecurityHeaders(): Record<string, string> {
    return {
      // HTTPS enforcement
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      
      // XSS protection
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      
      // Content Security Policy
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' https:",
        "connect-src 'self' https:",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; '),
      
      // Referrer policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Permissions policy
      'Permissions-Policy': [
        'accelerometer=()',
        'camera=()',
        'geolocation=()',
        'gyroscope=()',
        'magnetometer=()',
        'microphone=()',
        'payment=()',
        'usb=()'
      ].join(', '),
      
      // Cache control for sensitive endpoints
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      
      // Custom ATP headers
      'X-ATP-Version': '1.0',
      'X-Content-Type-Options': 'nosniff'
    };
  }

  // Request signing for high-security operations
  signRequest(method: string, path: string, body: string, timestamp: number, apiKey: string): string {
    const message = `${method.toUpperCase()}\n${path}\n${body}\n${timestamp}`;
    const signature = createHash('sha256')
      .update(message + apiKey)
      .digest('base64');
    
    return signature;
  }

  verifyRequestSignature(
    method: string,
    path: string,
    body: string,
    timestamp: number,
    signature: string,
    apiKey: string
  ): boolean {
    // Check timestamp (within 5 minutes)
    const now = Date.now();
    if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
      return false;
    }

    const expectedSignature = this.signRequest(method, path, body, timestamp, apiKey);
    return signature === expectedSignature;
  }

  // Permission checking
  hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    // Admin has all permissions
    if (userPermissions.includes('admin')) {
      return true;
    }

    // Exact permission match
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    // Wildcard permission matching
    const wildcardPerms = userPermissions.filter(p => p.endsWith('*'));
    for (const perm of wildcardPerms) {
      const prefix = perm.slice(0, -1);
      if (requiredPermission.startsWith(prefix)) {
        return true;
      }
    }

    return false;
  }

  // Generate secure session token
  generateSessionToken(): string {
    return randomBytes(32).toString('base64url');
  }

  // IP address utilities for security
  extractClientIP(req: any): string {
    return req.ip || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           'unknown';
  }

  // Security audit logging
  createSecurityEvent(type: string, details: Record<string, any>) {
    return {
      timestamp: new Date().toISOString(),
      type,
      severity: this.getSecurityEventSeverity(type),
      details: {
        ...details,
        userAgent: details.userAgent || 'unknown',
        ip: details.ip || 'unknown'
      }
    };
  }

  private getSecurityEventSeverity(type: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'login_success': 'low',
      'login_failure': 'medium',
      'api_key_created': 'medium',
      'api_key_revoked': 'medium',
      'permission_denied': 'medium',
      'rate_limit_exceeded': 'medium',
      'invalid_signature': 'high',
      'suspicious_activity': 'high',
      'security_breach': 'critical'
    };

    return severityMap[type] || 'medium';
  }
}

// Middleware factories
export function createAPIKeyMiddleware(
  securityManager: APISecurityManager,
  getAPIKey: (keyHash: string) => Promise<APIKey | null>
) {
  return async (req: any, res: any, next: any) => {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required'
      });
    }

    if (!securityManager.validateAPIKeyFormat(apiKey)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key format'
      });
    }

    const keyHash = securityManager.hashAPIKey(apiKey);
    const keyInfo = await getAPIKey(keyHash);
    
    if (!keyInfo) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    if (keyInfo.expiresAt && keyInfo.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'API key expired'
      });
    }

    req.apiKey = keyInfo;
    req.permissions = keyInfo.permissions;
    next();
  };
}

export function createJWTMiddleware(securityManager: APISecurityManager) {
  return (req: any, res: any, next: any) => {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'JWT token required'
      });
    }

    const payload = securityManager.verifyJWT(token);
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    req.user = payload;
    req.permissions = payload.permissions;
    next();
  };
}

export function createPermissionMiddleware(requiredPermission: string) {
  return (req: any, res: any, next: any) => {
    const permissions = req.permissions || [];
    
    if (!permissions.includes('admin') && !permissions.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
}