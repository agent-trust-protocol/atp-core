/**
 * ATP Cloud Database Connections
 * MongoDB and Redis connection management
 */

import { MongoClient, Db } from 'mongodb';
import Redis from 'ioredis';
import { config } from './config.js';
import { logger } from './logger.js';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private mongodb: MongoClient | null = null;
  private redis: Redis | null = null;
  private db: Db | null = null;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async connectMongoDB(): Promise<Db> {
    if (this.db) {
      return this.db;
    }

    try {
      const cloudConfig = config.getConfig();
      this.mongodb = new MongoClient(cloudConfig.database.mongodb.url);
      await this.mongodb.connect();
      this.db = this.mongodb.db(cloudConfig.database.mongodb.database);
      
      logger.info('Connected to MongoDB', {
        database: cloudConfig.database.mongodb.database
      });

      // Create indexes for optimal performance
      await this.createIndexes();

      return this.db;
    } catch (error) {
      logger.error('Failed to connect to MongoDB', { error });
      throw error;
    }
  }

  public async connectRedis(): Promise<Redis> {
    if (this.redis) {
      return this.redis;
    }

    try {
      const cloudConfig = config.getConfig();
      this.redis = new Redis(cloudConfig.database.redis.url, {
        keyPrefix: cloudConfig.database.redis.keyPrefix,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      await this.redis.connect();
      
      logger.info('Connected to Redis', {
        keyPrefix: cloudConfig.database.redis.keyPrefix
      });

      return this.redis;
    } catch (error) {
      logger.error('Failed to connect to Redis', { error });
      throw error;
    }
  }

  private async createIndexes(): Promise<void> {
    if (!this.db) return;

    try {
      // Tenants collection indexes
      await this.db.collection('tenants').createIndexes([
        { key: { id: 1 }, unique: true },
        { key: { domain: 1 }, unique: true, sparse: true },
        { key: { status: 1 } },
        { key: { plan: 1 } },
        { key: { 'apiKeys.key': 1 } },
        { key: { createdAt: 1 } }
      ]);

      // Usage events collection indexes
      await this.db.collection('usage_events').createIndexes([
        { key: { tenantId: 1, timestamp: -1 } },
        { key: { eventType: 1 } },
        { key: { service: 1 } },
        { key: { timestamp: -1 }, expireAfterSeconds: 2592000 } // 30 days TTL
      ]);

      // Billing events collection indexes
      await this.db.collection('billing_events').createIndexes([
        { key: { tenantId: 1, timestamp: -1 } },
        { key: { eventType: 1 } },
        { key: { timestamp: -1 } }
      ]);

      // Service health collection indexes
      await this.db.collection('service_health').createIndexes([
        { key: { service: 1 }, unique: true },
        { key: { status: 1 } },
        { key: { lastCheck: -1 } }
      ]);

      logger.info('Database indexes created successfully');
    } catch (error) {
      logger.error('Failed to create database indexes', { error });
    }
  }

  public getDB(): Db | null {
    return this.db;
  }

  public getRedis(): Redis | null {
    return this.redis;
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.mongodb) {
        await this.mongodb.close();
        this.mongodb = null;
        this.db = null;
        logger.info('Disconnected from MongoDB');
      }

      if (this.redis) {
        this.redis.disconnect();
        this.redis = null;
        logger.info('Disconnected from Redis');
      }
    } catch (error) {
      logger.error('Error disconnecting from databases', { error });
    }
  }
}

export const db = DatabaseManager.getInstance();