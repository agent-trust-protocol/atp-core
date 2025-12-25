/**
 * Authentication Event Logging System
 * Tracks all authentication-related events for security monitoring and compliance
 */

export enum AuthEventType {
  // Success events
  LOGIN_SUCCESS = 'login_success',
  SIGNUP_SUCCESS = 'signup_success',
  LOGOUT_SUCCESS = 'logout_success',
  SESSION_REFRESH = 'session_refresh',
  
  // Failure events
  LOGIN_FAILED = 'login_failed',
  SIGNUP_FAILED = 'signup_failed',
  TOKEN_INVALID = 'token_invalid',
  SESSION_EXPIRED = 'session_expired',
  
  // Security events
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  BRUTE_FORCE_DETECTED = 'brute_force_detected',
  ACCOUNT_LOCKED = 'account_locked',
  
  // API access
  API_AUTH_SUCCESS = 'api_auth_success',
  API_AUTH_FAILED = 'api_auth_failed',
}

export enum AuthEventSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface AuthEvent {
  timestamp: string;
  type: AuthEventType;
  severity: AuthEventSeverity;
  userId?: string;
  email?: string;
  ip: string;
  userAgent: string;
  endpoint?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

class AuthLogger {
  private static instance: AuthLogger;
  private events: AuthEvent[] = [];
  private readonly MAX_EVENTS = 10000; // Keep last 10k events in memory

  private constructor() {}

  static getInstance(): AuthLogger {
    if (!AuthLogger.instance) {
      AuthLogger.instance = new AuthLogger();
    }
    return AuthLogger.instance;
  }

  /**
   * Log an authentication event
   */
  log(event: Omit<AuthEvent, 'timestamp'>): void {
    const fullEvent: AuthEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    // Add to in-memory store
    this.events.push(fullEvent);
    
    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Console logging with appropriate level
    const logMessage = `[AUTH] ${fullEvent.type} - ${fullEvent.email || fullEvent.userId || 'unknown'} from ${fullEvent.ip}`;
    
    switch (fullEvent.severity) {
      case AuthEventSeverity.INFO:
        console.info(logMessage, fullEvent);
        break;
      case AuthEventSeverity.WARNING:
        console.warn(logMessage, fullEvent);
        break;
      case AuthEventSeverity.ERROR:
        console.error(logMessage, fullEvent);
        break;
      case AuthEventSeverity.CRITICAL:
        console.error('🚨 CRITICAL SECURITY EVENT:', logMessage, fullEvent);
        break;
    }

    // In production, you would also:
    // 1. Send to centralized logging (e.g., CloudWatch, Datadog, Elasticsearch)
    // 2. Send alerts for critical events (e.g., PagerDuty, Slack)
    // 3. Store in database for long-term retention
    // 4. Update Prometheus metrics
  }

  /**
   * Get recent events (for monitoring dashboard)
   */
  getRecentEvents(limit: number = 100): AuthEvent[] {
    return this.events.slice(-limit).reverse();
  }

  /**
   * Get events by type
   */
  getEventsByType(type: AuthEventType, limit: number = 100): AuthEvent[] {
    return this.events
      .filter(event => event.type === type)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get failed login attempts for a user/IP
   */
  getFailedAttempts(identifier: string, withinMinutes: number = 15): AuthEvent[] {
    const cutoff = Date.now() - withinMinutes * 60 * 1000;
    return this.events.filter(event => 
      event.type === AuthEventType.LOGIN_FAILED &&
      new Date(event.timestamp).getTime() > cutoff &&
      (event.email === identifier || event.ip === identifier)
    );
  }

  /**
   * Get statistics for monitoring
   */
  getStatistics(withinMinutes: number = 60): {
    totalEvents: number;
    successfulLogins: number;
    failedLogins: number;
    suspiciousActivity: number;
    rateLimitExceeded: number;
    uniqueUsers: Set<string>;
    uniqueIPs: Set<string>;
  } {
    const cutoff = Date.now() - withinMinutes * 60 * 1000;
    const recentEvents = this.events.filter(
      event => new Date(event.timestamp).getTime() > cutoff
    );

    return {
      totalEvents: recentEvents.length,
      successfulLogins: recentEvents.filter(e => e.type === AuthEventType.LOGIN_SUCCESS).length,
      failedLogins: recentEvents.filter(e => e.type === AuthEventType.LOGIN_FAILED).length,
      suspiciousActivity: recentEvents.filter(e => e.type === AuthEventType.SUSPICIOUS_ACTIVITY).length,
      rateLimitExceeded: recentEvents.filter(e => e.type === AuthEventType.RATE_LIMIT_EXCEEDED).length,
      uniqueUsers: new Set(recentEvents.filter(e => e.userId).map(e => e.userId!)),
      uniqueIPs: new Set(recentEvents.map(e => e.ip)),
    };
  }

  /**
   * Check for brute force attack patterns
   */
  detectBruteForce(ip: string, threshold: number = 5, withinMinutes: number = 5): boolean {
    const attempts = this.getFailedAttempts(ip, withinMinutes);
    return attempts.length >= threshold;
  }

  /**
   * Clear old events (for memory management)
   */
  clearOldEvents(olderThanHours: number = 24): void {
    const cutoff = Date.now() - olderThanHours * 60 * 60 * 1000;
    this.events = this.events.filter(
      event => new Date(event.timestamp).getTime() > cutoff
    );
  }
}

export const authLogger = AuthLogger.getInstance();

/**
 * Helper functions for common logging scenarios
 */

export function logLoginSuccess(userId: string, email: string, ip: string, userAgent: string): void {
  authLogger.log({
    type: AuthEventType.LOGIN_SUCCESS,
    severity: AuthEventSeverity.INFO,
    userId,
    email,
    ip,
    userAgent,
    success: true,
  });
}

export function logLoginFailure(email: string, ip: string, userAgent: string, reason: string): void {
  authLogger.log({
    type: AuthEventType.LOGIN_FAILED,
    severity: AuthEventSeverity.WARNING,
    email,
    ip,
    userAgent,
    success: false,
    errorMessage: reason,
  });
}

export function logSignupSuccess(userId: string, email: string, ip: string, userAgent: string): void {
  authLogger.log({
    type: AuthEventType.SIGNUP_SUCCESS,
    severity: AuthEventSeverity.INFO,
    userId,
    email,
    ip,
    userAgent,
    success: true,
  });
}

export function logSuspiciousActivity(
  reason: string,
  ip: string,
  userAgent: string,
  metadata?: Record<string, any>
): void {
  authLogger.log({
    type: AuthEventType.SUSPICIOUS_ACTIVITY,
    severity: AuthEventSeverity.CRITICAL,
    ip,
    userAgent,
    success: false,
    errorMessage: reason,
    metadata,
  });
}

export function logRateLimitExceeded(
  endpoint: string,
  ip: string,
  userAgent: string
): void {
  authLogger.log({
    type: AuthEventType.RATE_LIMIT_EXCEEDED,
    severity: AuthEventSeverity.WARNING,
    ip,
    userAgent,
    endpoint,
    success: false,
    errorMessage: `Rate limit exceeded for ${endpoint}`,
  });
}

export function logApiAuthSuccess(userId: string, ip: string, userAgent: string, endpoint: string): void {
  authLogger.log({
    type: AuthEventType.API_AUTH_SUCCESS,
    severity: AuthEventSeverity.INFO,
    userId,
    ip,
    userAgent,
    endpoint,
    success: true,
  });
}

export function logApiAuthFailure(ip: string, userAgent: string, endpoint: string, reason: string): void {
  authLogger.log({
    type: AuthEventType.API_AUTH_FAILED,
    severity: AuthEventSeverity.WARNING,
    ip,
    userAgent,
    endpoint,
    success: false,
    errorMessage: reason,
  });
}

