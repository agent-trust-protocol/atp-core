import { RedisCache } from '../cache/redis.js';

export interface RateLimitConfig {
  windowMs: number;     // Time window in milliseconds
  maxRequests: number;  // Max requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (identifier: string) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  totalHits: number;
  remainingRequests: number;
  resetTime: number;
}

/** In-memory fallback store used when Redis is unavailable. */
interface FallbackEntry {
  count: number;
  resetAt: number; // epoch ms when this window expires
}

const fallbackStore = new Map<string, FallbackEntry>();

/** Prune entries older than their window every 5 minutes to bound memory use. */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of fallbackStore) {
    if (entry.resetAt <= now) fallbackStore.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

function checkFallback(key: string, maxRequests: number, windowMs: number, now: number): RateLimitResult {
  const entry = fallbackStore.get(key);
  if (!entry || entry.resetAt <= now) {
    // Start a fresh window
    fallbackStore.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      totalHits: 1,
      remainingRequests: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  entry.count += 1;
  const allowed = entry.count <= maxRequests;
  return {
    allowed,
    totalHits: entry.count,
    remainingRequests: Math.max(0, maxRequests - entry.count),
    resetTime: entry.resetAt,
  };
}

export class RateLimiter {
  private cache: RedisCache;
  private config: RateLimitConfig;

  constructor(cache: RedisCache, config: RateLimitConfig) {
    this.cache = cache;
    this.config = config;
  }

  async checkLimit(identifier: string, endpoint?: string): Promise<RateLimitResult> {
    const key = this.generateKey(identifier, endpoint);
    const now = Date.now();

    try {
      // Get current count and last reset time
      const currentCount = await this.cache.get<number>(key) || 0;
      const lastReset = await this.cache.get<number>(`${key}:reset`) || now;

      // Check if we need to reset the window
      if (now - lastReset >= this.config.windowMs) {
        await this.cache.set(`${key}:reset`, now, Math.ceil(this.config.windowMs / 1000));
        await this.cache.set(key, 1, Math.ceil(this.config.windowMs / 1000));

        return {
          allowed: true,
          totalHits: 1,
          remainingRequests: this.config.maxRequests - 1,
          resetTime: now + this.config.windowMs,
        };
      }

      // Check if limit exceeded
      if (currentCount >= this.config.maxRequests) {
        return {
          allowed: false,
          totalHits: currentCount,
          remainingRequests: 0,
          resetTime: lastReset + this.config.windowMs,
        };
      }

      // Increment counter
      const newCount = await this.cache.incr(key, Math.ceil(this.config.windowMs / 1000));

      return {
        allowed: true,
        totalHits: newCount,
        remainingRequests: Math.max(0, this.config.maxRequests - newCount),
        resetTime: lastReset + this.config.windowMs,
      };

    } catch (error) {
      // Redis unavailable — fall back to in-process rate limiting (fail-closed)
      console.warn('[RateLimiter] Redis unavailable, using in-memory fallback (fail-closed):', (error as Error).message);
      return checkFallback(key, this.config.maxRequests, this.config.windowMs, now);
    }
  }

  async recordRequest(identifier: string, endpoint?: string, success: boolean = true): Promise<void> {
    if (this.config.skipSuccessfulRequests && success) return;
    if (this.config.skipFailedRequests && !success) return;

    const key = this.generateKey(identifier, endpoint);
    try {
      await this.cache.incr(key, Math.ceil(this.config.windowMs / 1000));
    } catch {
      // Best-effort; fallback store is already incremented via checkLimit
    }
  }

  async getRemainingRequests(identifier: string, endpoint?: string): Promise<number> {
    const result = await this.checkLimit(identifier, endpoint);
    return result.remainingRequests;
  }

  async resetLimit(identifier: string, endpoint?: string): Promise<void> {
    const key = this.generateKey(identifier, endpoint);
    fallbackStore.delete(key);
    try {
      await this.cache.del(key);
      await this.cache.del(`${key}:reset`);
    } catch {
      // Ignore Redis errors on reset
    }
  }

  private generateKey(identifier: string, endpoint?: string): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(identifier);
    }

    const base = `rate_limit:${identifier}`;
    return endpoint ? `${base}:${endpoint}` : base;
  }
}

// Preset configurations
export const RateLimitPresets = {
  // Very strict - 10 requests per minute
  STRICT: {
    windowMs: 60 * 1000,
    maxRequests: 10
  },
  // Normal - 100 requests per minute
  NORMAL: {
    windowMs: 60 * 1000,
    maxRequests: 100
  },
  // Generous - 1000 requests per minute
  GENEROUS: {
    windowMs: 60 * 1000,
    maxRequests: 1000
  },
  // Authentication - 5 attempts per 15 minutes
  AUTH: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5
  },
  // API burst - 50 requests per 10 seconds
  BURST: {
    windowMs: 10 * 1000,
    maxRequests: 50
  }
};

export const createRateLimiter = (
  cache: RedisCache,
  config: RateLimitConfig
): RateLimiter => {
  return new RateLimiter(cache, config);
};
