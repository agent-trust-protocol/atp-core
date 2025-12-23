import Redis from 'ioredis';

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  ttl: number; // default TTL in seconds
}

export class RedisCache {
  private client: Redis;
  private defaultTTL: number;
  private keyPrefix: string;

  constructor(config: CacheConfig) {
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      lazyConnect: true
    });

    this.defaultTTL = config.ttl;
    this.keyPrefix = config.keyPrefix;

    this.client.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    this.client.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(this.getKey(key));
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      const result = await this.client.setex(
        this.getKey(key),
        ttl || this.defaultTTL,
        serialized
      );
      return result === 'OK';
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(this.getKey(key));
      return result > 0;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(this.getKey(key));
      return result > 0;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const redisKeys = keys.map(key => this.getKey(key));
      const values = await this.client.mget(...redisKeys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      console.error('Redis mget error:', error);
      return new Array(keys.length).fill(null);
    }
  }

  async mset<T>(keyValuePairs: Array<{key: string, value: T, ttl?: number}>): Promise<boolean> {
    try {
      const pipeline = this.client.pipeline();

      for (const {key, value, ttl} of keyValuePairs) {
        const serialized = JSON.stringify(value);
        pipeline.setex(this.getKey(key), ttl || this.defaultTTL, serialized);
      }

      const results = await pipeline.exec();
      return results?.every(([error, result]) => !error && result === 'OK') || false;
    } catch (error) {
      console.error('Redis mset error:', error);
      return false;
    }
  }

  async incr(key: string, ttl?: number): Promise<number> {
    try {
      const redisKey = this.getKey(key);
      const result = await this.client.incr(redisKey);

      if (result === 1 && ttl) {
        await this.client.expire(redisKey, ttl);
      }

      return result;
    } catch (error) {
      console.error('Redis incr error:', error);
      return 0;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.client.expire(this.getKey(key), ttl);
      return result === 1;
    } catch (error) {
      console.error('Redis expire error:', error);
      return false;
    }
  }

  async flushPattern(pattern: string): Promise<boolean> {
    try {
      const keys = await this.client.keys(this.getKey(pattern));
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Redis flush pattern error:', error);
      return false;
    }
  }

  async health(): Promise<{healthy: boolean, message: string}> {
    try {
      const result = await this.client.ping();
      return {
        healthy: result === 'PONG',
        message: result === 'PONG' ? 'Redis connection healthy' : 'Redis ping failed'
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Redis health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
    } catch (error) {
      console.error('Redis disconnect error:', error);
    }
  }

  getClient(): Redis {
    return this.client;
  }
}

export const createCache = (config: CacheConfig): RedisCache => {
  return new RedisCache(config);
};
