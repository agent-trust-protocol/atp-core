/**
 * Rate Limiting for Authentication Endpoints
 * Protects against brute force attacks and abuse
 */

import { logRateLimitExceeded, logSuspiciousActivity } from './auth-logger';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  blockDurationMs?: number; // How long to block after exceeding (optional)
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked?: boolean;
  blockedUntil?: number;
}

class RateLimiter {
  private static instance: RateLimiter;
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  // Rate limit configurations for different endpoints
  private configs: Record<string, RateLimitConfig> = {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 attempts per 15 minutes
      blockDurationMs: 30 * 60 * 1000, // Block for 30 minutes after exceeding
    },
    signup: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3, // 3 signups per hour per IP
      blockDurationMs: 60 * 60 * 1000, // Block for 1 hour
    },
    apiAuth: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60, // 60 requests per minute
      blockDurationMs: 5 * 60 * 1000, // Block for 5 minutes
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3, // 3 reset attempts per hour
      blockDurationMs: 60 * 60 * 1000, // Block for 1 hour
    },
  };

  private constructor() {
    // Cleanup old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Check if a request should be rate limited
   * @returns { allowed: boolean, retryAfter?: number }
   */
  check(
    identifier: string, // Usually IP address or user email
    endpoint: string,
    userAgent: string = 'unknown'
  ): { allowed: boolean; retryAfter?: number; remaining?: number } {
    const config = this.configs[endpoint];
    if (!config) {
      // No rate limit configured for this endpoint
      return { allowed: true };
    }

    const key = `${endpoint}:${identifier}`;
    const now = Date.now();
    const entry = this.store.get(key);

    // Check if currently blocked
    if (entry?.blocked && entry.blockedUntil && entry.blockedUntil > now) {
      const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
      
      // Log repeated attempts while blocked (suspicious)
      if (entry.count > config.maxRequests + 5) {
        logSuspiciousActivity(
          `Excessive rate limit violations: ${entry.count} attempts`,
          identifier,
          userAgent,
          { endpoint, attempts: entry.count }
        );
      }
      
      return {
        allowed: false,
        retryAfter,
        remaining: 0,
      };
    }

    // Check if window has expired
    if (!entry || entry.resetTime <= now) {
      // Create new window
      this.store.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
        blocked: false,
      });
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
      };
    }

    // Increment counter
    entry.count++;

    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      // Block if configured
      if (config.blockDurationMs) {
        entry.blocked = true;
        entry.blockedUntil = now + config.blockDurationMs;
      }

      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      // Log rate limit exceeded
      logRateLimitExceeded(endpoint, identifier, userAgent);

      return {
        allowed: false,
        retryAfter,
        remaining: 0,
      };
    }

    this.store.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
    };
  }

  /**
   * Reset rate limit for an identifier (e.g., after successful auth)
   */
  reset(identifier: string, endpoint: string): void {
    const key = `${endpoint}:${identifier}`;
    this.store.delete(key);
  }

  /**
   * Manually block an identifier
   */
  block(identifier: string, endpoint: string, durationMs: number): void {
    const key = `${endpoint}:${identifier}`;
    const now = Date.now();
    
    this.store.set(key, {
      count: 999,
      resetTime: now + durationMs,
      blocked: true,
      blockedUntil: now + durationMs,
    });
  }

  /**
   * Check if identifier is currently blocked
   */
  isBlocked(identifier: string, endpoint: string): boolean {
    const key = `${endpoint}:${identifier}`;
    const entry = this.store.get(key);
    const now = Date.now();
    
    return !!(entry?.blocked && entry.blockedUntil && entry.blockedUntil > now);
  }

  /**
   * Get current rate limit status
   */
  getStatus(identifier: string, endpoint: string): {
    count: number;
    remaining: number;
    resetTime: number;
    blocked: boolean;
  } | null {
    const config = this.configs[endpoint];
    if (!config) return null;

    const key = `${endpoint}:${identifier}`;
    const entry = this.store.get(key);
    const now = Date.now();

    if (!entry || entry.resetTime <= now) {
      return {
        count: 0,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
        blocked: false,
      };
    }

    return {
      count: entry.count,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetTime: entry.resetTime,
      blocked: entry.blocked || false,
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    const entries = Array.from(this.store.entries());
    for (let i = 0; i < entries.length; i++) {
      const [key, entry] = entries[i];
      // Remove if window expired and not blocked, or block expired
      if (
        (entry.resetTime <= now && !entry.blocked) ||
        (entry.blocked && entry.blockedUntil && entry.blockedUntil <= now)
      ) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.store.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`[RateLimiter] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Get statistics for monitoring
   */
  getStats(): {
    totalEntries: number;
    blockedCount: number;
    entriesByEndpoint: Record<string, number>;
  } {
    let blockedCount = 0;
    const entriesByEndpoint: Record<string, number> = {};

    const entries = Array.from(this.store.entries());
    for (let i = 0; i < entries.length; i++) {
      const [key, entry] = entries[i];
      if (entry.blocked) blockedCount++;

      const endpoint = key.split(':')[0];
      entriesByEndpoint[endpoint] = (entriesByEndpoint[endpoint] || 0) + 1;
    }

    return {
      totalEntries: this.store.size,
      blockedCount,
      entriesByEndpoint,
    };
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

export const rateLimiter = RateLimiter.getInstance();

/**
 * Helper function to get client IP from request
 */
export function getClientIp(request: Request): string {
  // Check common headers for real IP (behind proxy/load balancer)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to connection IP (not available in Edge runtime)
  return 'unknown';
}

/**
 * Helper function to get user agent
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}

