import { RedisCache } from './redis.js';

export interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  lastUpdated: string;
}

export class PerformanceOptimizer {
  private cache: RedisCache;
  private metricsPrefix = 'perf';

  constructor(cache: RedisCache) {
    this.cache = cache;
  }

  async withCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<{data: T, fromCache: boolean}> {
    const startTime = Date.now();
    
    try {
      // Try to get from cache first
      const cached = await this.cache.get<T>(key);
      if (cached) {
        await this.recordCacheHit(key, Date.now() - startTime);
        return { data: cached, fromCache: true };
      }

      // Cache miss - fetch from source
      const data = await fetchFn();
      await this.cache.set(key, data, ttl);
      
      await this.recordCacheMiss(key, Date.now() - startTime);
      return { data, fromCache: false };
      
    } catch (error) {
      await this.recordError(key, error);
      throw error;
    }
  }

  async batchCache<T>(
    items: Array<{key: string, fetchFn: () => Promise<T>, ttl?: number}>
  ): Promise<Array<{key: string, data: T, fromCache: boolean}>> {
    const results: Array<{key: string, data: T, fromCache: boolean}> = [];
    
    // Get all keys from cache
    const keys = items.map(item => item.key);
    const cached = await this.cache.mget<T>(keys);
    
    const toFetch: Array<{index: number, item: typeof items[0]}> = [];
    
    // Process cached results and identify what needs fetching
    for (let i = 0; i < items.length; i++) {
      if (cached[i]) {
        results[i] = { key: items[i].key, data: cached[i]!, fromCache: true };
        await this.recordCacheHit(items[i].key, 0);
      } else {
        toFetch.push({ index: i, item: items[i] });
      }
    }
    
    // Fetch missing items
    if (toFetch.length > 0) {
      const fetchPromises = toFetch.map(async ({index, item}) => {
        const startTime = Date.now();
        try {
          const data = await item.fetchFn();
          await this.cache.set(item.key, data, item.ttl);
          
          results[index] = { key: item.key, data, fromCache: false };
          await this.recordCacheMiss(item.key, Date.now() - startTime);
        } catch (error) {
          await this.recordError(item.key, error);
          throw error;
        }
      });
      
      await Promise.all(fetchPromises);
    }
    
    return results;
  }

  async invalidatePattern(pattern: string): Promise<void> {
    await this.cache.flushPattern(pattern);
  }

  async recordRequest(endpoint: string, responseTime: number): Promise<void> {
    const key = `${this.metricsPrefix}:request:${endpoint}`;
    
    // Increment request count
    await this.cache.incr(`${key}:count`, 3600); // 1 hour TTL
    
    // Update response time (using moving average)
    const currentAvg = await this.cache.get<number>(`${key}:avg_time`) || 0;
    const requestCount = await this.cache.get<number>(`${key}:count`) || 1;
    
    const newAvg = ((currentAvg * (requestCount - 1)) + responseTime) / requestCount;
    await this.cache.set(`${key}:avg_time`, newAvg, 3600);
  }

  async recordError(key: string, error: unknown): Promise<void> {
    const errorKey = `${this.metricsPrefix}:error:${key}`;
    await this.cache.incr(errorKey, 3600);
  }

  async recordCacheHit(key: string, responseTime: number): Promise<void> {
    await this.cache.incr(`${this.metricsPrefix}:cache:hits:${key}`, 3600);
    await this.recordRequest(`cache:${key}`, responseTime);
  }

  async recordCacheMiss(key: string, responseTime: number): Promise<void> {
    await this.cache.incr(`${this.metricsPrefix}:cache:misses:${key}`, 3600);
    await this.recordRequest(`fetch:${key}`, responseTime);
  }

  async getMetrics(endpoint?: string): Promise<PerformanceMetrics> {
    const prefix = endpoint ? `${this.metricsPrefix}:request:${endpoint}` : `${this.metricsPrefix}:request:*`;
    
    if (endpoint) {
      const [requestCount, averageResponseTime, errorCount, cacheHits, cacheMisses] = await Promise.all([
        this.cache.get<number>(`${this.metricsPrefix}:request:${endpoint}:count`) || 0,
        this.cache.get<number>(`${this.metricsPrefix}:request:${endpoint}:avg_time`) || 0,
        this.cache.get<number>(`${this.metricsPrefix}:error:${endpoint}`) || 0,
        this.cache.get<number>(`${this.metricsPrefix}:cache:hits:${endpoint}`) || 0,
        this.cache.get<number>(`${this.metricsPrefix}:cache:misses:${endpoint}`) || 0,
      ]);

      const totalCacheRequests = (cacheHits || 0) + (cacheMisses || 0);
      const cacheHitRate = totalCacheRequests > 0 ? ((cacheHits || 0) / totalCacheRequests) * 100 : 0;
      const errorRate = (requestCount || 0) > 0 ? ((errorCount || 0) / (requestCount || 0)) * 100 : 0;

      return {
        requestCount: requestCount || 0,
        averageResponseTime: averageResponseTime || 0,
        errorRate,
        cacheHitRate,
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Return aggregated metrics for all endpoints
    return {
      requestCount: 0, // Would need to aggregate across all endpoints
      averageResponseTime: 0,
      errorRate: 0,
      cacheHitRate: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  async clearMetrics(): Promise<void> {
    await this.cache.flushPattern(`${this.metricsPrefix}:*`);
  }
}

export const createPerformanceOptimizer = (cache: RedisCache): PerformanceOptimizer => {
  return new PerformanceOptimizer(cache);
};