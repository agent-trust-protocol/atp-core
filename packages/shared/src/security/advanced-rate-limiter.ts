/**
 * Advanced Rate Limiter with Multiple Strategies
 * Prevents brute force attacks and API abuse
 */

import { Redis } from 'ioredis';
import crypto from 'crypto';

export interface RateLimitConfig {
  windowMs: number;           // Time window in milliseconds
  maxRequests: number;        // Max requests per window
  skipSuccessfulRequests?: boolean;  // Don't count successful requests
  skipFailedRequests?: boolean;      // Don't count failed requests
  keyGenerator?: (req: any) => string; // Custom key generation
  handler?: (req: any, res: any) => void; // Custom response handler
  store?: RateLimitStore;     // Storage backend
}

export interface RateLimitStore {
  increment(key: string): Promise<RateLimitInfo>;
  decrement(key: string): Promise<void>;
  reset(key: string): Promise<void>;
  block(key: string, duration: number): Promise<void>;
  isBlocked(key: string): Promise<boolean>;
}

export interface RateLimitInfo {
  count: number;
  resetTime: Date;
  blocked: boolean;
  remainingRequests: number;
}

/**
 * Redis-backed rate limit store for distributed systems
 */
export class RedisRateLimitStore implements RateLimitStore {
  private redis: Redis;
  private windowMs: number;
  private maxRequests: number;

  constructor(redis: Redis, windowMs: number, maxRequests: number) {
    this.redis = redis;
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async increment(key: string): Promise<RateLimitInfo> {
    const multi = this.redis.multi();
    const ttl = Math.ceil(this.windowMs / 1000);
    
    multi.incr(key);
    multi.expire(key, ttl);
    
    const results = await multi.exec();
    const count = results?.[0]?.[1] as number || 0;
    
    // Check if blocked
    const blockedKey = `${key}:blocked`;
    const isBlocked = await this.redis.exists(blockedKey);
    
    return {
      count,
      resetTime: new Date(Date.now() + this.windowMs),
      blocked: isBlocked === 1,
      remainingRequests: Math.max(0, this.maxRequests - count)
    };
  }

  async decrement(key: string): Promise<void> {
    await this.redis.decr(key);
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async block(key: string, duration: number): Promise<void> {
    const blockedKey = `${key}:blocked`;
    await this.redis.setex(blockedKey, Math.ceil(duration / 1000), '1');
  }

  async isBlocked(key: string): Promise<boolean> {
    const blockedKey = `${key}:blocked`;
    const exists = await this.redis.exists(blockedKey);
    return exists === 1;
  }
}

/**
 * In-memory rate limit store for single-instance deployments
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private blocked: Map<string, number> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), 60000);
  }

  async increment(key: string): Promise<RateLimitInfo> {
    const now = Date.now();
    const entry = this.requests.get(key);
    
    if (!entry || entry.resetTime < now) {
      // New window
      const resetTime = now + this.windowMs;
      this.requests.set(key, { count: 1, resetTime });
      
      return {
        count: 1,
        resetTime: new Date(resetTime),
        blocked: this.isBlockedSync(key),
        remainingRequests: this.maxRequests - 1
      };
    }
    
    // Increment existing
    entry.count++;
    
    return {
      count: entry.count,
      resetTime: new Date(entry.resetTime),
      blocked: this.isBlockedSync(key),
      remainingRequests: Math.max(0, this.maxRequests - entry.count)
    };
  }

  async decrement(key: string): Promise<void> {
    const entry = this.requests.get(key);
    if (entry && entry.count > 0) {
      entry.count--;
    }
  }

  async reset(key: string): Promise<void> {
    this.requests.delete(key);
  }

  async block(key: string, duration: number): Promise<void> {
    this.blocked.set(key, Date.now() + duration);
  }

  async isBlocked(key: string): Promise<boolean> {
    return this.isBlockedSync(key);
  }

  private isBlockedSync(key: string): boolean {
    const blockedUntil = this.blocked.get(key);
    if (!blockedUntil) return false;
    
    if (blockedUntil < Date.now()) {
      this.blocked.delete(key);
      return false;
    }
    
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    
    // Clean up expired request windows
    for (const [key, entry] of this.requests.entries()) {
      if (entry.resetTime < now) {
        this.requests.delete(key);
      }
    }
    
    // Clean up expired blocks
    for (const [key, blockedUntil] of this.blocked.entries()) {
      if (blockedUntil < now) {
        this.blocked.delete(key);
      }
    }
  }
}

/**
 * Advanced rate limiting strategies
 */
export class RateLimitStrategies {
  /**
   * Sliding window rate limiting
   */
  static slidingWindow(config: {
    windowMs: number;
    maxRequests: number;
    identifier: string;
    store: RateLimitStore;
  }): Promise<RateLimitInfo> {
    return config.store.increment(config.identifier);
  }

  /**
   * Token bucket algorithm
   */
  static async tokenBucket(config: {
    capacity: number;
    refillRate: number;
    identifier: string;
    store: any; // Custom token bucket store
  }): Promise<{ allowed: boolean; tokens: number }> {
    // Implementation would require custom token bucket store
    // This is a placeholder for the pattern
    return { allowed: true, tokens: config.capacity };
  }

  /**
   * Progressive delay (exponential backoff)
   */
  static progressiveDelay(attemptCount: number): number {
    return Math.min(1000 * Math.pow(2, attemptCount), 30000);
  }

  /**
   * Adaptive rate limiting based on system load
   */
  static async adaptiveLimit(config: {
    baseLimit: number;
    currentLoad: number;
    maxLoad: number;
  }): Promise<number> {
    const loadFactor = config.currentLoad / config.maxLoad;
    return Math.floor(config.baseLimit * (1 - loadFactor * 0.5));
  }
}

/**
 * Rate limiter middleware factory
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private store: RateLimitStore;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.store = config.store || new MemoryRateLimitStore(
      config.windowMs,
      config.maxRequests
    );
  }

  /**
   * Express middleware
   */
  middleware() {
    return async (req: any, res: any, next: any) => {
      try {
        const key = this.getKey(req);
        
        // Check if already blocked
        if (await this.store.isBlocked(key)) {
          return this.handleRateLimitExceeded(req, res, {
            count: this.config.maxRequests + 1,
            resetTime: new Date(Date.now() + this.config.windowMs),
            blocked: true,
            remainingRequests: 0
          });
        }
        
        // Increment counter
        const info = await this.store.increment(key);
        
        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', this.config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', info.remainingRequests);
        res.setHeader('X-RateLimit-Reset', info.resetTime.toISOString());
        
        // Check if limit exceeded
        if (info.count > this.config.maxRequests) {
          // Block for progressive duration based on violations
          const blockDuration = this.calculateBlockDuration(info.count);
          await this.store.block(key, blockDuration);
          
          return this.handleRateLimitExceeded(req, res, info);
        }
        
        // Track response for conditional counting
        if (this.config.skipSuccessfulRequests || this.config.skipFailedRequests) {
          const originalSend = res.send;
          const rateLimiter = this; // Capture 'this' for use in closure
          res.send = function(data: any) {
            const statusCode = res.statusCode;
            
            // Decrement if should skip
            if ((rateLimiter.config.skipSuccessfulRequests && statusCode < 400) ||
                (rateLimiter.config.skipFailedRequests && statusCode >= 400)) {
              rateLimiter.store.decrement(key);
            }
            
            return originalSend.call(res, data);
          };
        }
        
        next();
      } catch (error) {
        console.error('Rate limiter error:', error);
        next(); // Fail open to avoid blocking legitimate traffic
      }
    };
  }

  private getKey(req: any): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }
    
    // Default: IP + route
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const route = req.route?.path || req.path || 'unknown';
    
    return crypto
      .createHash('sha256')
      .update(`${ip}:${route}`)
      .digest('hex');
  }

  private calculateBlockDuration(violations: number): number {
    // Progressive blocking: 1min, 5min, 15min, 1hr, 24hr
    const durations = [60000, 300000, 900000, 3600000, 86400000];
    const index = Math.min(violations - this.config.maxRequests - 1, durations.length - 1);
    return durations[Math.max(0, index)];
  }

  private handleRateLimitExceeded(req: any, res: any, info: RateLimitInfo): void {
    if (this.config.handler) {
      return this.config.handler(req, res);
    }
    
    // Default handler
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: info.resetTime,
      blocked: info.blocked
    });
  }
}

/**
 * Specialized rate limiters for different scenarios
 */
export class SpecializedRateLimiters {
  /**
   * Authentication attempt limiter (strict)
   */
  static authenticationLimiter(store?: RateLimitStore): RateLimiter {
    return new RateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 attempts per 15 minutes
      skipSuccessfulRequests: true, // Only count failures
      keyGenerator: (req) => {
        // Key by IP + username for targeted protection
        const ip = req.ip || 'unknown';
        const username = req.body?.username || req.body?.email || 'unknown';
        return crypto.createHash('sha256').update(`auth:${ip}:${username}`).digest('hex');
      },
      handler: (req, res) => {
        res.status(429).json({
          error: 'Authentication Blocked',
          message: 'Too many failed authentication attempts. Account temporarily locked.',
          retryAfter: new Date(Date.now() + 15 * 60 * 1000)
        });
      },
      store
    });
  }

  /**
   * API endpoint limiter (moderate)
   */
  static apiLimiter(store?: RateLimitStore): RateLimiter {
    return new RateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 requests per minute
      keyGenerator: (req) => {
        // Key by API key or IP
        const apiKey = req.headers['x-api-key'];
        const ip = req.ip || 'unknown';
        return crypto.createHash('sha256').update(`api:${apiKey || ip}`).digest('hex');
      },
      store
    });
  }

  /**
   * Policy evaluation limiter (expensive operations)
   */
  static policyEvaluationLimiter(store?: RateLimitStore): RateLimiter {
    return new RateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 evaluations per minute
      keyGenerator: (req) => {
        const ip = req.ip || 'unknown';
        const agentId = req.body?.agentId || 'unknown';
        return crypto.createHash('sha256').update(`policy:${ip}:${agentId}`).digest('hex');
      },
      handler: (req, res) => {
        res.status(429).json({
          error: 'Policy Evaluation Rate Limit',
          message: 'Too many policy evaluation requests. Please implement caching or reduce request frequency.',
          suggestion: 'Consider using batch evaluation endpoints for multiple policies.'
        });
      },
      store
    });
  }

  /**
   * Registration limiter (prevent spam)
   */
  static registrationLimiter(store?: RateLimitStore): RateLimiter {
    return new RateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3, // 3 registrations per hour per IP
      keyGenerator: (req) => {
        const ip = req.ip || 'unknown';
        return crypto.createHash('sha256').update(`register:${ip}`).digest('hex');
      },
      store
    });
  }
}

export default RateLimiter;