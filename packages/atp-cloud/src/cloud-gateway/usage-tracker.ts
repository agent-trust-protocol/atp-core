/**
 * ATP Cloud Usage Tracker
 * Tracks API usage for billing and analytics
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../shared/database.js';
import { createServiceLogger } from '../shared/logger.js';
import { AuthenticatedRequest } from '../shared/auth.js';
import { UsageEvent } from '../types/index.js';

const logger = createServiceLogger('usage-tracker');

export class UsageTracker {
  private eventQueue: UsageEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL = 10000; // 10 seconds

  constructor() {
    this.startBatchProcessor();
  }

  /**
   * Express middleware to track API usage
   */
  public trackUsage = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const originalSend = res.send;
    const tracker = this; // Capture the tracker instance

    // Override res.send to capture response details
    res.send = function(data: any) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const requestSize = req.get('content-length') ? parseInt(req.get('content-length') || '0') : 0;
      const responseSize = Buffer.byteLength(typeof data === 'string' ? data : JSON.stringify(data));

      // Create usage event
      if (req.tenant) {
        const event: UsageEvent = {
          tenantId: req.tenant.id,
          eventType: 'api_request',
          service: req.path.split('/')[3] || 'unknown', // Extract service from /api/v1/service
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          responseTime,
          requestSize,
          responseSize,
          timestamp: new Date(),
          metadata: {
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            apiKey: req.tenant.apiKey.substring(0, 10) + '...'
          }
        };

        // Queue the event for batch processing
        tracker.queueEvent(event);
      }

      return originalSend.call(this, data);
    };

    next();
  };

  /**
   * Queue usage event for batch processing
   */
  private queueEvent(event: UsageEvent): void {
    this.eventQueue.push(event);
    
    if (this.eventQueue.length >= this.BATCH_SIZE) {
      this.flushEvents();
    }
  }

  /**
   * Start the batch processor
   */
  private startBatchProcessor(): void {
    this.flushInterval = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Flush events to database
   */
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = this.eventQueue.splice(0); // Move all events to process
    const database = db.getDB();

    if (!database) {
      logger.error('Database not available for usage tracking');
      return;
    }

    try {
      // Insert usage events
      await database.collection('usage_events').insertMany(events);
      
      // Update tenant usage counters
      await this.updateTenantUsage(events);

      logger.debug('Usage events flushed', { count: events.length });
    } catch (error) {
      logger.error('Failed to flush usage events', { error, eventCount: events.length });
      
      // Re-queue events on failure (with limit to prevent memory issues)
      if (this.eventQueue.length < 1000) {
        this.eventQueue.unshift(...events);
      }
    }
  }

  /**
   * Update tenant usage counters
   */
  private async updateTenantUsage(events: UsageEvent[]): Promise<void> {
    const database = db.getDB();
    if (!database) return;

    // Group events by tenant
    const tenantUsage = new Map<string, {
      requests: number;
      storage: number;
      bandwidth: number;
    }>();

    for (const event of events) {
      const current = tenantUsage.get(event.tenantId) || {
        requests: 0,
        storage: 0,
        bandwidth: 0
      };

      current.requests += 1;
      current.bandwidth += event.requestSize + event.responseSize;
      
      // Storage calculation would depend on the service and operation
      if (event.eventType === 'agent_created') {
        current.storage += 1000; // Estimated storage per agent
      }

      tenantUsage.set(event.tenantId, current);
    }

    // Update tenant usage in database
    const bulkOps = Array.from(tenantUsage.entries()).map(([tenantId, usage]) => ({
      updateOne: {
        filter: { id: tenantId },
        update: {
          $inc: {
            'usage.currentRequests': usage.requests,
            'usage.currentStorage': usage.storage,
            'usage.currentBandwidth': usage.bandwidth
          },
          $set: {
            updatedAt: new Date()
          }
        }
      }
    }));

    if (bulkOps.length > 0) {
      try {
        await database.collection('tenants').bulkWrite(bulkOps);
      } catch (error) {
        logger.error('Failed to update tenant usage', { error });
      }
    }
  }

  /**
   * Get usage analytics for a tenant
   */
  public async getTenantUsage(tenantId: string, startDate: Date, endDate: Date): Promise<{
    totalRequests: number;
    totalBandwidth: number;
    averageResponseTime: number;
    errorRate: number;
    topEndpoints: Array<{ path: string; count: number }>;
    dailyUsage: Array<{ date: string; requests: number; bandwidth: number }>;
  }> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not available');
    }

    const pipeline = [
      {
        $match: {
          tenantId,
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          totalBandwidth: { $sum: { $add: ['$requestSize', '$responseSize'] } },
          averageResponseTime: { $avg: '$responseTime' },
          errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } }
        }
      }
    ];

    const [analytics] = await database.collection('usage_events').aggregate(pipeline).toArray();
    
    if (!analytics) {
      return {
        totalRequests: 0,
        totalBandwidth: 0,
        averageResponseTime: 0,
        errorRate: 0,
        topEndpoints: [],
        dailyUsage: []
      };
    }

    // Get top endpoints
    const topEndpoints = await database.collection('usage_events').aggregate([
      { $match: { tenantId, timestamp: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: '$path', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $project: { path: '$_id', count: 1, _id: 0 } }
    ]).toArray() as Array<{ path: string; count: number }>;

    // Get daily usage
    const dailyUsage = await database.collection('usage_events').aggregate([
      { $match: { tenantId, timestamp: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          requests: { $sum: 1 },
          bandwidth: { $sum: { $add: ['$requestSize', '$responseSize'] } }
        }
      },
      { $sort: { '_id': 1 } },
      { $project: { date: '$_id', requests: 1, bandwidth: 1, _id: 0 } }
    ]).toArray() as Array<{ date: string; requests: number; bandwidth: number }>;

    return {
      totalRequests: analytics.totalRequests || 0,
      totalBandwidth: analytics.totalBandwidth || 0,
      averageResponseTime: Math.round(analytics.averageResponseTime || 0),
      errorRate: analytics.totalRequests ? (analytics.errors / analytics.totalRequests) * 100 : 0,
      topEndpoints: topEndpoints || [],
      dailyUsage: dailyUsage || []
    };
  }

  /**
   * Stop the usage tracker
   */
  public stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // Flush any remaining events
    this.flushEvents();
  }
}