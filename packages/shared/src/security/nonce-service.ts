/**
 * Agent Trust Protocol™
 * Nonce tracking service to prevent replay attacks
 */

import Redis from 'ioredis';
import { createHash } from 'crypto';

export interface NonceConfig {
  redisUrl?: string;
  windowSizeMs?: number; // Time window for nonce validity
  cleanupIntervalMs?: number;
}

export class NonceService {
  private redis: Redis;
  private windowSizeMs: number;
  private cleanupIntervalMs: number;
  private cleanupTimer?: NodeJS.Timer;

  constructor(config: NonceConfig = {}) {
    this.windowSizeMs = config.windowSizeMs || 60 * 1000; // 1 minute default
    this.cleanupIntervalMs = config.cleanupIntervalMs || 5 * 60 * 1000; // 5 minutes
    
    // Connect to Redis
    this.redis = new Redis(config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379', {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    // Start cleanup timer
    this.startCleanup();
  }

  /**
   * Generates a unique nonce for a request
   */
  generateNonce(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}`;
  }

  /**
   * Validates and records a nonce to prevent replay attacks
   * Returns true if nonce is valid and hasn't been used
   */
  async validateNonce(did: string, nonce: string, timestamp: number): Promise<boolean> {
    try {
      // Check if timestamp is within acceptable window
      const now = Date.now();
      const age = now - timestamp;
      
      if (age > this.windowSizeMs || age < -this.windowSizeMs) {
        console.warn(`Nonce timestamp outside window: ${age}ms`);
        return false;
      }

      // Create unique key for this DID + nonce combination
      const nonceKey = this.createNonceKey(did, nonce, timestamp);
      
      // Use Redis SET with NX (only if not exists) and EX (expiration)
      const result = await this.redis.set(
        nonceKey,
        '1',
        'EX',
        Math.ceil(this.windowSizeMs / 1000), // Convert to seconds
        'NX'
      );

      // If result is 'OK', the nonce was set successfully (first use)
      // If result is null, the nonce already exists (replay attack)
      return result === 'OK';
    } catch (error) {
      console.error('Nonce validation error:', error);
      return false;
    }
  }

  /**
   * Creates a deterministic key for the nonce
   */
  private createNonceKey(did: string, nonce: string, timestamp: number): string {
    const data = `${did}:${nonce}:${timestamp}`;
    const hash = createHash('sha256').update(data).digest('hex');
    return `atp:nonce:${hash}`;
  }

  /**
   * Starts the cleanup process for expired nonces
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      // Redis TTL handles automatic cleanup, so this is mostly for metrics
      this.getStats().catch(error => {
        console.error('Nonce cleanup error:', error);
      });
    }, this.cleanupIntervalMs);
  }

  /**
   * Gets statistics about nonce usage
   */
  async getStats(): Promise<{ activeNonces: number; windowSizeMs: number }> {
    try {
      const keys = await this.redis.keys('atp:nonce:*');
      return {
        activeNonces: keys.length,
        windowSizeMs: this.windowSizeMs
      };
    } catch (error) {
      console.error('Error getting nonce stats:', error);
      return { activeNonces: -1, windowSizeMs: this.windowSizeMs };
    }
  }

  /**
   * Clears all nonces (for testing purposes)
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await this.redis.keys('atp:nonce:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Error clearing nonces:', error);
    }
  }

  /**
   * Closes the nonce service and cleanup resources
   */
  async close(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    await this.redis.quit();
  }

  /**
   * Health check for the nonce service
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      console.error('Nonce service health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const nonceService = new NonceService();