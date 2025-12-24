/**
 * Rate Limiting API Middleware Integration
 * Protects against brute force and API abuse
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// In-memory store for rate limiting (use Redis in production)
interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked?: number;
}

class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private readonly cleanupInterval = 60000; // 1 minute

  constructor() {
    // Cleanup expired entries periodically
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), this.cleanupInterval);
    }
  }

  increment(key: string, windowMs: number): RateLimitEntry {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetTime < now) {
      // New window
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs
      };
      this.store.set(key, newEntry);
      return newEntry;
    }

    // Check if blocked
    if (entry.blocked && entry.blocked > now) {
      return { ...entry, count: entry.count + 1 };
    }

    // Increment existing
    entry.count++;
    return entry;
  }

  block(key: string, duration: number): void {
    const entry = this.store.get(key);
    if (entry) {
      entry.blocked = Date.now() + duration;
    }
  }

  isBlocked(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry || !entry.blocked) return false;
    return entry.blocked > Date.now();
  }

  cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.store.entries());
    for (let i = 0; i < entries.length; i++) {
      const [key, entry] = entries[i];
      if (entry.resetTime < now && (!entry.blocked || entry.blocked < now)) {
        this.store.delete(key);
      }
    }
  }
}

// Global store instance
const rateLimitStore = new RateLimitStore();

// Rate limit configurations for different endpoints
export const RateLimitConfigs = {
  // Authentication endpoints - very strict
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    blockDuration: 30 * 60 * 1000 // 30 minutes block after limit
  },
  
  // Policy evaluation - expensive operations
  policyEvaluation: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    blockDuration: 5 * 60 * 1000 // 5 minutes block
  },
  
  // General API - moderate limits
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    blockDuration: 60 * 1000 // 1 minute block
  },
  
  // Registration - prevent spam
  registration: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    blockDuration: 24 * 60 * 60 * 1000 // 24 hours block
  }
};

/**
 * Apply rate limiting to a request
 */
export async function applyRateLimit(
  request: NextRequest,
  config: keyof typeof RateLimitConfigs | { windowMs: number; maxRequests: number; blockDuration: number }
): Promise<NextResponse | null> {
  const limitConfig = typeof config === 'string' ? RateLimitConfigs[config] : config;
  
  // Generate rate limit key
  const key = generateRateLimitKey(request, typeof config === 'string' ? config : 'custom');
  
  // Check if blocked
  if (rateLimitStore.isBlocked(key)) {
    return createRateLimitResponse(true, 0, new Date(Date.now() + limitConfig.blockDuration));
  }
  
  // Increment counter
  const entry = rateLimitStore.increment(key, limitConfig.windowMs);
  
  // Check if limit exceeded
  if (entry.count > limitConfig.maxRequests) {
    // Block the key
    rateLimitStore.block(key, limitConfig.blockDuration);
    return createRateLimitResponse(true, 0, new Date(Date.now() + limitConfig.blockDuration));
  }
  
  // Add rate limit headers to successful responses
  const remainingRequests = Math.max(0, limitConfig.maxRequests - entry.count);
  
  // Return null to indicate request should proceed
  // Headers will be added by the wrapper
  return null;
}

/**
 * Generate a unique key for rate limiting
 */
function generateRateLimitKey(request: NextRequest, type: string): string {
  // Get identifier components
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const path = request.nextUrl.pathname;
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // For auth endpoints, also include username/email if present
  let identifier = `${type}:${ip}:${path}`;
  
  if (type === 'auth' && request.method === 'POST') {
    // Note: In real implementation, would need to parse body
    identifier += ':auth-attempt';
  }
  
  // Hash the identifier for privacy
  return crypto
    .createHash('sha256')
    .update(identifier)
    .digest('hex');
}

/**
 * Create rate limit exceeded response
 */
function createRateLimitResponse(
  blocked: boolean,
  remainingRequests: number,
  resetTime: Date
): NextResponse {
  const message = blocked 
    ? 'Too many requests. You have been temporarily blocked.'
    : 'Rate limit exceeded. Please try again later.';
  
  return NextResponse.json(
    {
      error: 'Too Many Requests',
      message,
      retryAfter: resetTime.toISOString(),
      blocked
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Remaining': remainingRequests.toString(),
        'X-RateLimit-Reset': resetTime.toISOString(),
        'Retry-After': Math.ceil((resetTime.getTime() - Date.now()) / 1000).toString()
      }
    }
  );
}

/**
 * Middleware wrapper for rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: keyof typeof RateLimitConfigs | { windowMs: number; maxRequests: number; blockDuration: number }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Apply rate limiting
    const rateLimitResponse = await applyRateLimit(request, config);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Proceed with the original handler
    const response = await handler(request);
    
    // Add rate limit headers to successful responses
    const limitConfig = typeof config === 'string' ? RateLimitConfigs[config] : config;
    const key = generateRateLimitKey(request, typeof config === 'string' ? config : 'custom');
    const entry = rateLimitStore.increment(key, limitConfig.windowMs);
    
    response.headers.set('X-RateLimit-Limit', limitConfig.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', Math.max(0, limitConfig.maxRequests - entry.count).toString());
    response.headers.set('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());
    
    return response;
  };
}

export default withRateLimit;