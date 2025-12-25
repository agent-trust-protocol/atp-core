/**
 * Long-term Log Storage Integration
 * Supports CloudWatch, Elasticsearch, and local file storage
 */

import { AuthEvent } from './auth-logger';

export interface LogStorageProvider {
  send(events: AuthEvent[]): Promise<void>;
  query(filters: LogQueryFilters): Promise<AuthEvent[]>;
}

export interface LogQueryFilters {
  startTime?: Date;
  endTime?: Date;
  eventTypes?: string[];
  userId?: string;
  email?: string;
  ip?: string;
  severity?: string;
  limit?: number;
}

/**
 * CloudWatch Logs Provider
 */
export class CloudWatchLogsProvider implements LogStorageProvider {
  private logGroupName: string;
  private logStreamName: string;
  private region: string;
  private accessKeyId?: string;
  private secretAccessKey?: string;

  constructor(config: {
    logGroupName: string;
    logStreamName: string;
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  }) {
    this.logGroupName = config.logGroupName;
    this.logStreamName = config.logStreamName;
    this.region = config.region;
    this.accessKeyId = config.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
    this.secretAccessKey = config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
  }

  async send(events: AuthEvent[]): Promise<void> {
    if (!this.accessKeyId || !this.secretAccessKey) {
      console.warn('[CloudWatch] AWS credentials not configured');
      return;
    }

    try {
      // In production, use AWS SDK
      // const CloudWatchLogs = require('@aws-sdk/client-cloudwatch-logs');
      // const client = new CloudWatchLogs.CloudWatchLogsClient({ region: this.region });
      
      // For now, log that we would send to CloudWatch
      console.log(`[CloudWatch] Would send ${events.length} events to ${this.logGroupName}/${this.logStreamName}`);
      
      // Actual implementation:
      // await client.send(new PutLogEventsCommand({
      //   logGroupName: this.logGroupName,
      //   logStreamName: this.logStreamName,
      //   logEvents: events.map(e => ({
      //     message: JSON.stringify(e),
      //     timestamp: new Date(e.timestamp).getTime()
      //   }))
      // }));
    } catch (error) {
      console.error('[CloudWatch] Failed to send logs:', error);
    }
  }

  async query(filters: LogQueryFilters): Promise<AuthEvent[]> {
    // Query CloudWatch Logs Insights
    console.log('[CloudWatch] Query not implemented yet');
    return [];
  }
}

/**
 * Elasticsearch Provider
 */
export class ElasticsearchProvider implements LogStorageProvider {
  private endpoint: string;
  private index: string;
  private username?: string;
  private password?: string;

  constructor(config: {
    endpoint: string;
    index: string;
    username?: string;
    password?: string;
  }) {
    this.endpoint = config.endpoint;
    this.index = config.index;
    this.username = config.username || process.env.ELASTICSEARCH_USERNAME;
    this.password = config.password || process.env.ELASTICSEARCH_PASSWORD;
  }

  async send(events: AuthEvent[]): Promise<void> {
    try {
      const bulkBody = events.flatMap(event => [
        { index: { _index: this.index } },
        event
      ]);

      const auth = this.username && this.password
        ? `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`
        : undefined;

      const response = await fetch(`${this.endpoint}/_bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-ndjson',
          ...(auth ? { 'Authorization': auth } : {}),
        },
        body: bulkBody.map((item) => JSON.stringify(item)).join('\n') + '\n',
      });

      if (!response.ok) {
        throw new Error(`Elasticsearch returned ${response.status}`);
      }

      console.log(`[Elasticsearch] Sent ${events.length} events to ${this.index}`);
    } catch (error) {
      console.error('[Elasticsearch] Failed to send logs:', error);
    }
  }

  async query(filters: LogQueryFilters): Promise<AuthEvent[]> {
    try {
      const query: any = {
        bool: {
          must: [],
          filter: []
        }
      };

      if (filters.startTime || filters.endTime) {
        query.bool.filter.push({
          range: {
            timestamp: {
              ...(filters.startTime ? { gte: filters.startTime.toISOString() } : {}),
              ...(filters.endTime ? { lte: filters.endTime.toISOString() } : {})
            }
          }
        });
      }

      if (filters.eventTypes?.length) {
        query.bool.filter.push({
          terms: { type: filters.eventTypes }
        });
      }

      if (filters.userId) {
        query.bool.filter.push({ term: { userId: filters.userId } });
      }

      if (filters.email) {
        query.bool.filter.push({ term: { email: filters.email } });
      }

      if (filters.ip) {
        query.bool.filter.push({ term: { ip: filters.ip } });
      }

      if (filters.severity) {
        query.bool.filter.push({ term: { severity: filters.severity } });
      }

      const auth = this.username && this.password
        ? `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`
        : undefined;

      const response = await fetch(`${this.endpoint}/${this.index}/_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(auth ? { 'Authorization': auth } : {}),
        },
        body: JSON.stringify({
          query,
          size: filters.limit || 100,
          sort: [{ timestamp: 'desc' }]
        }),
      });

      if (!response.ok) {
        throw new Error(`Elasticsearch returned ${response.status}`);
      }

      const result = await response.json();
      return result.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      console.error('[Elasticsearch] Failed to query logs:', error);
      return [];
    }
  }
}

/**
 * Local File Storage Provider (for development/small deployments)
 */
export class FileStorageProvider implements LogStorageProvider {
  private filePath: string;

  constructor(filePath: string = './logs/auth-events.jsonl') {
    this.filePath = filePath;
  }

  async send(events: AuthEvent[]): Promise<void> {
    try {
      // In Node.js environment, use fs
      // const fs = require('fs').promises;
      // const lines = events.map(e => JSON.stringify(e)).join('\n') + '\n';
      // await fs.appendFile(this.filePath, lines);
      
      console.log(`[FileStorage] Would append ${events.length} events to ${this.filePath}`);
    } catch (error) {
      console.error('[FileStorage] Failed to write logs:', error);
    }
  }

  async query(filters: LogQueryFilters): Promise<AuthEvent[]> {
    // Read and filter from file
    console.log('[FileStorage] Query not fully implemented');
    return [];
  }
}

/**
 * Log Storage Manager
 * Handles batching and sending to multiple providers
 */
export class LogStorageManager {
  private static instance: LogStorageManager;
  private providers: LogStorageProvider[] = [];
  private buffer: AuthEvent[] = [];
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL_MS = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  private constructor() {
    this.startFlushTimer();
  }

  static getInstance(): LogStorageManager {
    if (!LogStorageManager.instance) {
      LogStorageManager.instance = new LogStorageManager();
    }
    return LogStorageManager.instance;
  }

  /**
   * Add a storage provider
   */
  addProvider(provider: LogStorageProvider): void {
    this.providers.push(provider);
    console.log(`[LogStorage] Added provider: ${provider.constructor.name}`);
  }

  /**
   * Add event to buffer
   */
  async addEvent(event: AuthEvent): Promise<void> {
    this.buffer.push(event);

    // Flush if buffer is full
    if (this.buffer.length >= this.BATCH_SIZE) {
      await this.flush();
    }
  }

  /**
   * Add multiple events to buffer
   */
  async addEvents(events: AuthEvent[]): Promise<void> {
    this.buffer.push(...events);

    if (this.buffer.length >= this.BATCH_SIZE) {
      await this.flush();
    }
  }

  /**
   * Flush buffer to all providers
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];

    console.log(`[LogStorage] Flushing ${events.length} events to ${this.providers.length} providers`);

    // Send to all providers in parallel
    await Promise.allSettled(
      this.providers.map(provider => provider.send(events))
    );
  }

  /**
   * Query from all providers
   */
  async query(filters: LogQueryFilters): Promise<AuthEvent[]> {
    const results = await Promise.allSettled(
      this.providers.map(provider => provider.query(filters))
    );

    // Combine and deduplicate results
    const allEvents: AuthEvent[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allEvents.push(...result.value);
      }
    }

    // Deduplicate by timestamp + type + ip
    const seen = new Set<string>();
    return allEvents.filter(event => {
      const key = `${event.timestamp}:${event.type}:${event.ip}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Start automatic flushing
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(error => {
        console.error('[LogStorage] Auto-flush failed:', error);
      });
    }, this.FLUSH_INTERVAL_MS);
  }

  /**
   * Cleanup on shutdown
   */
  async destroy(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }
}

// Export singleton
export const logStorage = LogStorageManager.getInstance();

// Initialize providers based on environment
if (process.env.CLOUDWATCH_LOG_GROUP) {
  logStorage.addProvider(new CloudWatchLogsProvider({
    logGroupName: process.env.CLOUDWATCH_LOG_GROUP,
    logStreamName: process.env.CLOUDWATCH_LOG_STREAM || 'auth-events',
    region: process.env.AWS_REGION || 'us-east-1',
  }));
}

if (process.env.ELASTICSEARCH_ENDPOINT) {
  logStorage.addProvider(new ElasticsearchProvider({
    endpoint: process.env.ELASTICSEARCH_ENDPOINT,
    index: process.env.ELASTICSEARCH_INDEX || 'atp-auth-events',
  }));
}

// Always add file storage for local development
if (process.env.NODE_ENV === 'development') {
  logStorage.addProvider(new FileStorageProvider());
}

