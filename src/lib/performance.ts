"use client"

interface RequestCache {
  [key: string]: {
    data: any;
    timestamp: number;
    ttl: number;
  }
}

class ClientCache {
  private cache: RequestCache = {};
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.cache[key];
    if (!entry) return null;
    
    if (Date.now() > entry.timestamp + entry.ttl) {
      delete this.cache[key];
      return null;
    }
    
    return entry.data;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };
  }

  delete(key: string): void {
    delete this.cache[key];
  }

  clear(): void {
    this.cache = {};
  }

  size(): number {
    return Object.keys(this.cache).length;
  }
}

class PerformanceMonitor {
  private requestTimes: { [endpoint: string]: number[] } = {};
  private errorCounts: { [endpoint: string]: number } = {};
  private cacheHits = 0;
  private cacheMisses = 0;

  recordRequest(endpoint: string, responseTime: number): void {
    if (!this.requestTimes[endpoint]) {
      this.requestTimes[endpoint] = [];
    }
    
    this.requestTimes[endpoint].push(responseTime);
    
    // Keep only last 100 requests per endpoint
    if (this.requestTimes[endpoint].length > 100) {
      this.requestTimes[endpoint] = this.requestTimes[endpoint].slice(-100);
    }
  }

  recordError(endpoint: string): void {
    this.errorCounts[endpoint] = (this.errorCounts[endpoint] || 0) + 1;
  }

  recordCacheHit(): void {
    this.cacheHits++;
  }

  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  getMetrics() {
    const metrics: {
      [endpoint: string]: {
        avgResponseTime: number;
        requestCount: number;
        errorCount: number;
        errorRate: number;
      }
    } = {};

    for (const [endpoint, times] of Object.entries(this.requestTimes)) {
      const avgResponseTime = times.length > 0 
        ? times.reduce((sum, time) => sum + time, 0) / times.length 
        : 0;
        
      const requestCount = times.length;
      const errorCount = this.errorCounts[endpoint] || 0;
      const errorRate = requestCount > 0 ? (errorCount / requestCount) * 100 : 0;

      metrics[endpoint] = {
        avgResponseTime,
        requestCount,
        errorCount,
        errorRate
      };
    }

    const totalCacheRequests = this.cacheHits + this.cacheMisses;
    const cacheHitRate = totalCacheRequests > 0 ? (this.cacheHits / totalCacheRequests) * 100 : 0;

    return {
      endpoints: metrics,
      cache: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRate: cacheHitRate
      }
    };
  }

  reset(): void {
    this.requestTimes = {};
    this.errorCounts = {};
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}

// Global instances
export const clientCache = new ClientCache();
export const performanceMonitor = new PerformanceMonitor();

// Enhanced fetch with caching and performance monitoring
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit & { 
    cacheKey?: string;
    cacheTTL?: number;
    skipCache?: boolean;
  }
): Promise<T> {
  const cacheKey = options?.cacheKey || url;
  const startTime = Date.now();
  
  try {
    // Check cache first (unless explicitly skipped)
    if (!options?.skipCache) {
      const cached = clientCache.get<T>(cacheKey);
      if (cached) {
        performanceMonitor.recordCacheHit();
        performanceMonitor.recordRequest(url, Date.now() - startTime);
        return cached;
      }
    }

    // Make the actual request
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache the response (unless explicitly skipped)
    if (!options?.skipCache) {
      clientCache.set(cacheKey, data, options?.cacheTTL);
      performanceMonitor.recordCacheMiss();
    }
    
    performanceMonitor.recordRequest(url, Date.now() - startTime);
    return data;
    
  } catch (error) {
    performanceMonitor.recordError(url);
    performanceMonitor.recordRequest(url, Date.now() - startTime);
    throw error;
  }
}

// Batch request optimization
export async function batchFetch<T>(
  requests: Array<{
    url: string;
    options?: RequestInit;
    cacheKey?: string;
    cacheTTL?: number;
  }>
): Promise<Array<{url: string, data: T | null, error?: string}>> {
  const results = await Promise.allSettled(
    requests.map(async ({ url, options, cacheKey, cacheTTL }) => {
      try {
        const data = await cachedFetch<T>(url, {
          ...options,
          cacheKey,
          cacheTTL
        });
        return { url, data };
      } catch (error) {
        return {
          url,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    })
  );

  return results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        url: 'unknown',
        data: null,
        error: result.reason?.message || 'Request failed'
      };
    }
  });
}

// Debounced function for frequent operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Throttled function for rate limiting
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}