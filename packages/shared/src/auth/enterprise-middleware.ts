/**
 * Enterprise Authentication Middleware
 * Provides express middleware for enterprise authentication and authorization
 */

import { Request, Response, NextFunction } from 'express';
import { EventEmitter } from 'events';
import { EnterpriseAuthenticationService, EnterpriseUser, SSOSession } from './enterprise-sso';
import { EnterpriseRBACService, AccessContext, AccessDecision } from './enterprise-rbac';

export interface AuthenticatedRequest extends Request {
  user?: EnterpriseUser;
  ssoSession?: SSOSession;
  accessDecision?: AccessDecision;
  authContext?: AccessContext;
}

export interface MiddlewareConfig {
  authService: EnterpriseAuthenticationService;
  rbacService: EnterpriseRBACService;
  skipPaths?: string[];
  requireAuthentication?: boolean;
  sessionCookieName?: string;
  csrfProtection?: boolean;
  rateLimiting?: {
    windowMs: number;
    maxRequests: number;
  };
}

export interface AuthorizationOptions {
  resource: string;
  action: string;
  requireAllPermissions?: boolean;
  customContext?: (req: AuthenticatedRequest) => Record<string, any>;
}

export class EnterpriseAuthMiddleware extends EventEmitter {
  private config: MiddlewareConfig;
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(config: MiddlewareConfig) {
    super();
    this.config = {
      sessionCookieName: 'atp-session',
      requireAuthentication: true,
      csrfProtection: true,
      skipPaths: ['/health', '/metrics', '/auth/login', '/auth/callback'],
      ...config
    };

    this.startRateLimitCleanup();
  }

  /**
   * Main authentication middleware
   */
  authenticate() {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        // Skip authentication for certain paths
        if (this.shouldSkipAuth(req.path || '')) {
          return next();
        }

        // Apply rate limiting
        if (this.config.rateLimiting && !this.checkRateLimit(req)) {
          return res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: this.getRateLimitRetryAfter(req)
          });
        }

        // Extract session ID from various sources
        const sessionId = this.extractSessionId(req);
        if (!sessionId) {
          if (this.config.requireAuthentication) {
            return this.handleUnauthenticated(req, res);
          }
          return next();
        }

        // Validate session
        const sessionValidation = this.config.authService.validateSession(sessionId);
        if (!sessionValidation.valid) {
          if (this.config.requireAuthentication) {
            return this.handleUnauthenticated(req, res);
          }
          return next();
        }

        // Attach user and session to request
        req.user = sessionValidation.user;
        req.ssoSession = sessionValidation.session;
        req.authContext = this.buildAuthContext(req);

        // CSRF protection
        if (this.config.csrfProtection && !this.validateCSRFToken(req)) {
          return res.status(403).json({
            error: 'CSRF Token Invalid',
            message: 'Invalid or missing CSRF token'
          });
        }

        this.emit('userAuthenticated', {
          userId: req.user!.id,
          sessionId: req.ssoSession!.sessionId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path
        });

        next();

      } catch (error) {
        this.emit('authenticationError', {
          error: error instanceof Error ? error.message : String(error),
          path: req.path,
          ip: req.ip
        });

        return res.status(500).json({
          error: 'Authentication Error',
          message: 'An error occurred during authentication'
        });
      }
    };
  }

  /**
   * Authorization middleware factory
   */
  authorize(options: AuthorizationOptions) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required'
          });
        }

        // Build access context
        const context: AccessContext = {
          ...req.authContext,
          ...(options.customContext ? options.customContext(req) : {})
        };

        // Check permission
        const decision = await this.config.rbacService.checkPermission(
          req.user.id,
          options.resource,
          options.action,
          context
        );

        req.accessDecision = decision;

        if (!decision.granted) {
          this.emit('accessDenied', {
            userId: req.user.id,
            resource: options.resource,
            action: options.action,
            reason: decision.reason,
            context
          });

          return res.status(403).json({
            error: 'Forbidden',
            message: 'Insufficient permissions',
            required: {
              resource: options.resource,
              action: options.action
            },
            reason: decision.reason
          });
        }

        this.emit('accessGranted', {
          userId: req.user.id,
          resource: options.resource,
          action: options.action,
          context
        });

        next();

      } catch (error) {
        this.emit('authorizationError', {
          error: error instanceof Error ? error.message : String(error),
          userId: req.user?.id,
          resource: options.resource,
          action: options.action
        });

        return res.status(500).json({
          error: 'Authorization Error',
          message: 'An error occurred during authorization'
        });
      }
    };
  }

  /**
   * Require specific roles middleware
   */
  requireRoles(roleNames: string[], requireAll: boolean = false) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const userRoles = this.config.rbacService.getUserRoles(req.user.id);
      const userRoleNames = userRoles.map(ur => {
        const role = this.config.rbacService['roles'].get(ur.roleId);
        return role?.name;
      }).filter(Boolean);

      const hasRequiredRoles = requireAll
        ? roleNames.every(roleName => userRoleNames.includes(roleName))
        : roleNames.some(roleName => userRoleNames.includes(roleName));

      if (!hasRequiredRoles) {
        this.emit('roleCheckFailed', {
          userId: req.user.id,
          requiredRoles: roleNames,
          userRoles: userRoleNames,
          requireAll
        });

        return res.status(403).json({
          error: 'Forbidden',
          message: 'Required roles not found',
          required: roleNames,
          requireAll
        });
      }

      next();
    };
  }

  /**
   * Multi-factor authentication middleware
   */
  requireMFA() {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      // Check if MFA is enabled and verified for this session
      const mfaVerified = req.ssoSession?.metadata?.mfaVerified;
      if (!mfaVerified) {
        return res.status(403).json({
          error: 'MFA Required',
          message: 'Multi-factor authentication required',
          mfaChallenge: this.generateMFAChallenge(req.user)
        });
      }

      next();
    };
  }

  /**
   * IP whitelist middleware
   */
  requireIPWhitelist(allowedIPs: string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const clientIP = this.getClientIP(req);

      if (!allowedIPs.includes(clientIP)) {
        this.emit('ipBlocked', {
          userId: req.user?.id,
          blockedIP: clientIP,
          allowedIPs
        });

        return res.status(403).json({
          error: 'IP Not Allowed',
          message: 'Your IP address is not authorized to access this resource'
        });
      }

      next();
    };
  }

  /**
   * Time-based access control middleware
   */
  requireBusinessHours(businessHours: { start: number; end: number; timezone?: string }) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const now = new Date();
      const hour = now.getHours();

      if (hour < businessHours.start || hour >= businessHours.end) {
        this.emit('outsideBusinessHours', {
          userId: req.user?.id,
          currentHour: hour,
          businessHours
        });

        return res.status(403).json({
          error: 'Outside Business Hours',
          message: `Access restricted to business hours (${businessHours.start}:00 - ${businessHours.end}:00)`,
          currentTime: now.toISOString(),
          businessHours
        });
      }

      next();
    };
  }

  /**
   * Session management routes
   */
  getSessionRoutes() {
    return {
      // Get current session info
      getSession: (req: AuthenticatedRequest, res: Response) => {
        if (!req.user || !req.ssoSession) {
          return res.status(401).json({ error: 'Not authenticated' });
        }

        res.json({
          user: {
            id: req.user.id,
            email: req.user.email,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            roles: req.user.groups,
            permissions: req.user.permissions,
            provider: req.user.provider
          },
          session: {
            sessionId: req.ssoSession.sessionId,
            createdAt: req.ssoSession.createdAt,
            expiresAt: req.ssoSession.expiresAt,
            lastActivity: req.ssoSession.lastActivity
          }
        });
      },

      // Refresh session
      refreshSession: async (req: AuthenticatedRequest, res: Response) => {
        if (!req.ssoSession) {
          return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
          // Extend session expiry
          req.ssoSession.expiresAt = Date.now() + (3600 * 1000); // 1 hour
          req.ssoSession.lastActivity = Date.now();

          res.json({
            message: 'Session refreshed',
            expiresAt: req.ssoSession.expiresAt
          });
        } catch (error) {
          res.status(500).json({
            error: 'Session Refresh Error',
            message: 'Failed to refresh session'
          });
        }
      },

      // Logout
      logout: (req: AuthenticatedRequest, res: Response) => {
        if (!req.ssoSession) {
          return res.status(401).json({ error: 'Not authenticated' });
        }

        try {
          this.config.authService.logout(req.ssoSession.sessionId);
          res.clearCookie(this.config.sessionCookieName!);

          res.json({ message: 'Logged out successfully' });
        } catch (error) {
          res.status(500).json({
            error: 'Logout Error',
            message: 'Failed to logout'
          });
        }
      }
    };
  }

  // Private methods

  private shouldSkipAuth(path: string): boolean {
    return this.config.skipPaths?.some(skipPath =>
      path.startsWith(skipPath) || path.match(new RegExp(skipPath))
    ) || false;
  }

  private extractSessionId(req: AuthenticatedRequest): string | null {
    // Try cookie first
    const cookieSessionId = req.cookies?.[this.config.sessionCookieName!];
    if (cookieSessionId) return cookieSessionId;

    // Try Authorization header
    const authHeader = req.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try custom header
    const sessionHeader = req.get('X-Session-ID');
    if (sessionHeader) return sessionHeader;

    return null;
  }

  private buildAuthContext(req: AuthenticatedRequest): AccessContext {
    const now = new Date();

    return {
      ip: this.getClientIP(req),
      userAgent: req.get('User-Agent'),
      sessionId: req.ssoSession?.sessionId,
      department: req.user?.department,
      timeOfDay: now.getHours(),
      dayOfWeek: now.getDay(),
      additionalData: {
        method: req.method,
        path: req.path,
        query: req.query,
        referer: req.get('Referer')
      }
    };
  }

  private getClientIP(req: AuthenticatedRequest): string {
    return req.ip ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           '0.0.0.0';
  }

  private handleUnauthenticated(req: AuthenticatedRequest, res: Response): void {
    this.emit('unauthenticatedAccess', {
      path: req.path,
      method: req.method,
      ip: this.getClientIP(req),
      userAgent: req.get('User-Agent')
    });

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      loginUrl: '/auth/login'
    });
  }

  private validateCSRFToken(req: AuthenticatedRequest): boolean {
    // Skip CSRF for GET requests
    if (req.method === 'GET') return true;

    const token = req.get('X-CSRF-Token') || req.body._csrf;
    const sessionToken = (req as any).ssoSession?.metadata?.csrfToken;

    return token && sessionToken && token === sessionToken;
  }

  private checkRateLimit(req: AuthenticatedRequest): boolean {
    if (!this.config.rateLimiting) return true;

    const key = this.getRateLimitKey(req);
    const now = Date.now();
    const window = this.config.rateLimiting.windowMs;
    const maxRequests = this.config.rateLimiting.maxRequests;

    const entry = this.rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + window
      });
      return true;
    }

    if (entry.count >= maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  private getRateLimitKey(req: AuthenticatedRequest): string {
    return `${this.getClientIP(req)}:${req.path}`;
  }

  private getRateLimitRetryAfter(req: AuthenticatedRequest): number {
    const key = this.getRateLimitKey(req);
    const entry = this.rateLimitStore.get(key);

    if (!entry) return 0;

    return Math.ceil((entry.resetTime - Date.now()) / 1000);
  }

  private generateMFAChallenge(user: EnterpriseUser): any {
    // Simplified MFA challenge generation
    return {
      type: 'totp',
      challenge: 'Please enter your authenticator code',
      qrCode: `otpauth://totp/ATP:${user.email}?secret=MOCKBASE32SECRET&issuer=ATP`
    };
  }

  private startRateLimitCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.rateLimitStore) {
        if (now > entry.resetTime) {
          this.rateLimitStore.delete(key);
        }
      }
    }, 60000); // Clean every minute
  }
}
