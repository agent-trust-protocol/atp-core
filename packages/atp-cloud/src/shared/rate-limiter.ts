/**
 * ATP Cloud Rate Limiter
 * Redis-based rate limiting for API requests
 */

import { RateLimiterRedis } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
import { db } from './database.js';
import { config } from './config.js';
import { logger } from './logger.js';
import { RateLimitError } from '../types/index.js';
import { AuthenticatedRequest } from './auth.js';

export class RateLimiterService {
  private static instance: RateLimiterService;
  private rateLimiters: Map<string, RateLimiterRedis> = new Map();

  private constructor() {}

  public static getInstance(): RateLimiterService {
    if (!RateLimiterService.instance) {
      RateLimiterService.instance = new RateLimiterService();
    }
    return RateLimiterService.instance;
  }

  /**
   * Initialize rate limiter for a tenant
   */
  public async initializeTenantRateLimiter(tenantId: string, requests: number, window: number): Promise<void> {
    const redis = db.getRedis();
    if (!redis) {
      throw new Error('Redis not connected');
    }

    const rateLimiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: `rate_limit:${tenantId}`,
      points: requests, // Number of requests
      duration: window, // Per window in seconds
      blockDuration: window, // Block duration in seconds
      execEvenly: true // Spread requests evenly across window
    });

    this.rateLimiters.set(tenantId, rateLimiter);
    
    logger.debug('Rate limiter initialized for tenant', {
      tenantId,
      requests,
      window
    });
  }

  /**
   * Check rate limit for a tenant
   */
  public async checkRateLimit(tenantId: string, key?: string): Promise<void> {
    let rateLimiter = this.rateLimiters.get(tenantId);
    
    if (!rateLimiter) {
      // Get tenant's rate limit configuration
      const database = db.getDB();
      if (!database) {
        throw new Error('Database not connected');
      }

      const tenant = await database.collection('tenants').findOne({ id: tenantId });
      if (!tenant) {
        throw new RateLimitError(tenantId, 0, 0);
      }

      // Find the API key's rate limit or use default
      const apiKey = tenant.apiKeys.find((k: any) => k.key === key);
      const rateLimit = apiKey?.rateLimit || config.getConfig().limits.defaultRateLimit;

      await this.initializeTenantRateLimiter(tenantId, rateLimit.requests, rateLimit.window);
      rateLimiter = this.rateLimiters.get(tenantId)!;
    }

    try {
      await rateLimiter.consume(tenantId);
    } catch (rejRes: any) {
      const totalHits = rejRes.totalHits || 0;
      const remainingPoints = rejRes.remainingPoints || 0;
      const msBeforeNext = rejRes.msBeforeNext || 0;

      logger.warn('Rate limit exceeded', {
        tenantId,
        totalHits,
        remainingPoints,
        msBeforeNext
      });

      throw new RateLimitError(
        tenantId,
        rateLimiter.points,
        rateLimiter.duration
      );
    }
  }

  /**
   * Get rate limit status for a tenant
   */
  public async getRateLimitStatus(tenantId: string): Promise<{
    totalHits: number;
    remainingPoints: number;
    msBeforeNext: number;
    limit: number;
    window: number;
  } | null> {
    const rateLimiter = this.rateLimiters.get(tenantId);
    if (!rateLimiter) {
      return null;
    }

    try {
      const resRateLimiter = await rateLimiter.get(tenantId);
      return {
        totalHits: resRateLimiter ? (rateLimiter.points - resRateLimiter.remainingPoints) : 0,
        remainingPoints: resRateLimiter?.remainingPoints || rateLimiter.points,
        msBeforeNext: resRateLimiter?.msBeforeNext || 0,
        limit: rateLimiter.points,
        window: rateLimiter.duration
      };
    } catch (error) {
      logger.error('Failed to get rate limit status', { tenantId, error });
      return null;
    }
  }

  /**
   * Reset rate limit for a tenant (admin function)
   */
  public async resetRateLimit(tenantId: string): Promise<void> {
    const rateLimiter = this.rateLimiters.get(tenantId);
    if (rateLimiter) {
      await rateLimiter.delete(tenantId);
      logger.info('Rate limit reset for tenant', { tenantId });
    }
  }
}

/**
 * Express middleware for rate limiting
 */
export const rateLimitMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.tenant) {
    // If no tenant, apply global rate limit
    next();
    return;
  }

  try {
    const rateLimiter = RateLimiterService.getInstance();
    await rateLimiter.checkRateLimit(req.tenant.id, req.tenant.apiKey);

    // Add rate limit headers
    const status = await rateLimiter.getRateLimitStatus(req.tenant.id);
    if (status) {
      res.set({
        'X-RateLimit-Limit': status.limit.toString(),
        'X-RateLimit-Remaining': status.remainingPoints.toString(),
        'X-RateLimit-Reset': new Date(Date.now() + status.msBeforeNext).toISOString()
      });
    }

    next();
  } catch (error: any) {
    if (error instanceof RateLimitError) {
      res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
        retryAfter: Math.ceil((error as any).msBeforeNext / 1000)
      });
    } else {
      logger.error('Rate limiting error', { error: error.message, tenantId: req.tenant.id });
      res.status(500).json({
        error: 'Rate limiting service unavailable',
        code: 'RATE_LIMIT_ERROR'
      });
    }
  }
};

export const rateLimiter = RateLimiterService.getInstance();