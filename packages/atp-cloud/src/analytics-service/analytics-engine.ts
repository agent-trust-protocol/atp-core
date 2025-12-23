/**
 * ATP Cloud Analytics Engine
 * Core analytics processing and metrics calculation
 */

import { db } from '../shared/database.js';
import { createServiceLogger } from '../shared/logger.js';
import { UsageHistory, ErrorMetrics, ServiceUsage, MetricValue, PerformanceMetrics } from '../types/index.js';

const logger = createServiceLogger('analytics-engine');

export interface UsageMetrics {
  requests: {
    total: number;
    change: number; // percentage change from previous period
    perService: Record<string, number>;
  };
  bandwidth: {
    total: number; // in bytes
    change: number;
  };
  responseTime: {
    average: number; // in ms
    p95: number;
    p99: number;
  };
  errorRate: {
    rate: number; // percentage
    change: number;
  };
}


export class AnalyticsEngine {
  /**
   * Get current usage metrics for a tenant
   */
  public async getCurrentUsage(tenantId: string): Promise<UsageMetrics> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    try {
      // Get current hour metrics
      const currentMetrics = await this.getUsageMetricsForPeriod(tenantId, hourAgo, now);
      
      // Get previous hour metrics for comparison
      const previousHourStart = new Date(hourAgo.getTime() - 60 * 60 * 1000);
      const previousMetrics = await this.getUsageMetricsForPeriod(tenantId, previousHourStart, hourAgo);

      // Calculate changes
      const requestsChange = previousMetrics.requests.total > 0 
        ? ((currentMetrics.requests.total - previousMetrics.requests.total) / previousMetrics.requests.total) * 100
        : 0;

      const bandwidthChange = previousMetrics.bandwidth.total > 0
        ? ((currentMetrics.bandwidth.total - previousMetrics.bandwidth.total) / previousMetrics.bandwidth.total) * 100
        : 0;

      const errorRateChange = previousMetrics.errorRate.rate > 0
        ? ((currentMetrics.errorRate.rate - previousMetrics.errorRate.rate) / previousMetrics.errorRate.rate) * 100
        : 0;

      return {
        requests: {
          total: currentMetrics.requests.total,
          change: requestsChange,
          perService: currentMetrics.requests.perService
        },
        bandwidth: {
          total: currentMetrics.bandwidth.total,
          change: bandwidthChange
        },
        responseTime: currentMetrics.responseTime,
        errorRate: {
          rate: currentMetrics.errorRate.rate,
          change: errorRateChange
        }
      };
    } catch (error) {
      logger.error('Failed to get current usage', { error, tenantId });
      throw error;
    }
  }

  /**
   * Get usage history with specified granularity
   */
  public async getUsageHistory(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    granularity: 'hourly' | 'daily' | 'weekly' | 'monthly'
  ): Promise<Array<{
    timestamp: Date;
    requests: number;
    bandwidth: number;
    responseTime: number;
    errorRate: number;
  }>> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    let groupBy: any;
    switch (granularity) {
      case 'hourly':
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' }
        };
        break;
      case 'daily':
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        };
        break;
      case 'weekly':
        groupBy = {
          year: { $year: '$timestamp' },
          week: { $week: '$timestamp' }
        };
        break;
      case 'monthly':
        groupBy = {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' }
        };
        break;
    }

    try {
      const pipeline = [
        {
          $match: {
            tenantId,
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: groupBy,
            requests: { $sum: 1 },
            bandwidth: { $sum: { $add: ['$requestSize', '$responseSize'] } },
            responseTime: { $avg: '$responseTime' },
            errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } }
          }
        },
        {
          $addFields: {
            errorRate: {
              $cond: [
                { $gt: ['$requests', 0] },
                { $multiply: [{ $divide: ['$errors', '$requests'] }, 100] },
                0
              ]
            },
            timestamp: {
              $dateFromParts: {
                year: '$_id.year',
                month: { $ifNull: ['$_id.month', 1] },
                day: { $ifNull: ['$_id.day', 1] },
                hour: { $ifNull: ['$_id.hour', 0] }
              }
            }
          }
        },
        {
          $sort: { timestamp: 1 }
        },
        {
          $project: {
            _id: 0,
            timestamp: 1,
            requests: 1,
            bandwidth: 1,
            responseTime: { $round: ['$responseTime', 2] },
            errorRate: { $round: ['$errorRate', 2] }
          }
        }
      ];

      const results = await database.collection('usage_events').aggregate(pipeline).toArray();
      return results as UsageHistory[];
    } catch (error) {
      logger.error('Failed to get usage history', { error, tenantId, granularity });
      throw error;
    }
  }

  /**
   * Get performance metrics for a tenant
   */
  public async getPerformanceMetrics(tenantId: string, period: string): Promise<PerformanceMetrics> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    const { startDate, endDate } = this.parsePeriod(period);

    try {
      // Get latency metrics
      const latencyPipeline = [
        {
          $match: {
            tenantId,
            timestamp: { $gte: startDate, $lte: endDate },
            statusCode: { $lt: 400 } // Only successful requests
          }
        },
        {
          $group: {
            _id: null,
            average: { $avg: '$responseTime' },
            values: { $push: '$responseTime' }
          }
        }
      ];

      const [latencyResult] = await database.collection('usage_events').aggregate(latencyPipeline).toArray();
      
      let p50 = 0, p95 = 0, p99 = 0;
      if (latencyResult && latencyResult.values.length > 0) {
        const sorted = latencyResult.values.sort((a: number, b: number) => a - b);
        const len = sorted.length;
        p50 = sorted[Math.floor(len * 0.5)];
        p95 = sorted[Math.floor(len * 0.95)];
        p99 = sorted[Math.floor(len * 0.99)];
      }

      // Get latency trend (hourly)
      const latencyTrend = await this.getMetricTrend(tenantId, 'responseTime', startDate, endDate, 'hourly');

      // Get throughput metrics
      const throughputTrend = await this.getMetricTrend(tenantId, 'requests', startDate, endDate, 'hourly');
      const totalRequests = throughputTrend.reduce((sum, point) => sum + point.value, 0);
      const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      const requestsPerSecond = hours > 0 ? totalRequests / (hours * 3600) : 0;

      // Get availability metrics
      const availability = await this.getAvailabilityMetrics(tenantId, startDate, endDate);

      return {
        latency: {
          average: latencyResult?.average || 0,
          p50,
          p95,
          p99,
          trend: latencyTrend
        },
        throughput: {
          requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
          trend: throughputTrend
        },
        availability
      };
    } catch (error) {
      logger.error('Failed to get performance metrics', { error, tenantId, period });
      throw error;
    }
  }

  /**
   * Get service usage breakdown
   */
  public async getServiceBreakdown(tenantId: string, period: string): Promise<Record<string, {
    requests: number;
    bandwidth: number;
    averageResponseTime: number;
    errorRate: number;
    percentage: number;
  }>> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    const { startDate, endDate } = this.parsePeriod(period);

    try {
      const pipeline = [
        {
          $match: {
            tenantId,
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$service',
            requests: { $sum: 1 },
            bandwidth: { $sum: { $add: ['$requestSize', '$responseSize'] } },
            responseTime: { $avg: '$responseTime' },
            errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } }
          }
        },
        {
          $addFields: {
            errorRate: {
              $cond: [
                { $gt: ['$requests', 0] },
                { $multiply: [{ $divide: ['$errors', '$requests'] }, 100] },
                0
              ]
            }
          }
        }
      ];

      const results = await database.collection('usage_events').aggregate(pipeline).toArray();
      const totalRequests = results.reduce((sum, service) => sum + service.requests, 0);

      const breakdown: Record<string, any> = {};
      for (const service of results) {
        breakdown[service._id] = {
          requests: service.requests,
          bandwidth: service.bandwidth,
          averageResponseTime: Math.round(service.responseTime || 0),
          errorRate: Math.round(service.errorRate * 100) / 100,
          percentage: totalRequests > 0 ? Math.round((service.requests / totalRequests) * 100 * 100) / 100 : 0
        };
      }

      return breakdown;
    } catch (error) {
      logger.error('Failed to get service breakdown', { error, tenantId, period });
      throw error;
    }
  }

  /**
   * Get error analytics
   */
  public async getErrorAnalytics(tenantId: string, period: string): Promise<{
    totalErrors: number;
    errorRate: number;
    errorsByStatus: Record<string, number>;
    errorsByService: Record<string, number>;
    topErrors: Array<{
      path: string;
      count: number;
      percentage: number;
    }>;
    errorTrend: Array<{
      timestamp: Date;
      errors: number;
      rate: number;
    }>;
  }> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    const { startDate, endDate } = this.parsePeriod(period);

    try {
      // Get error statistics
      const errorStats = await database.collection('usage_events').aggregate([
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
            totalErrors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } }
          }
        }
      ]).toArray();

      const stats = errorStats[0] || { totalRequests: 0, totalErrors: 0 };
      const errorRate = stats.totalRequests > 0 ? (stats.totalErrors / stats.totalRequests) * 100 : 0;

      // Get errors by status code
      const errorsByStatus = await database.collection('usage_events').aggregate([
        {
          $match: {
            tenantId,
            timestamp: { $gte: startDate, $lte: endDate },
            statusCode: { $gte: 400 }
          }
        },
        {
          $group: {
            _id: '$statusCode',
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      const statusBreakdown: Record<string, number> = {};
      errorsByStatus.forEach(item => {
        statusBreakdown[item._id.toString()] = item.count;
      });

      // Get errors by service
      const errorsByService = await database.collection('usage_events').aggregate([
        {
          $match: {
            tenantId,
            timestamp: { $gte: startDate, $lte: endDate },
            statusCode: { $gte: 400 }
          }
        },
        {
          $group: {
            _id: '$service',
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      const serviceBreakdown: Record<string, number> = {};
      errorsByService.forEach(item => {
        serviceBreakdown[item._id] = item.count;
      });

      // Get top error endpoints
      const topErrors = await database.collection('usage_events').aggregate([
        {
          $match: {
            tenantId,
            timestamp: { $gte: startDate, $lte: endDate },
            statusCode: { $gte: 400 }
          }
        },
        {
          $group: {
            _id: '$path',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 10
        }
      ]).toArray();

      const topErrorsFormatted = topErrors.map(error => ({
        path: error._id,
        count: error.count,
        percentage: stats.totalErrors > 0 ? Math.round((error.count / stats.totalErrors) * 100 * 100) / 100 : 0
      }));

      // Get error trend
      const errorTrend = await database.collection('usage_events').aggregate([
        {
          $match: {
            tenantId,
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$timestamp' },
              month: { $month: '$timestamp' },
              day: { $dayOfMonth: '$timestamp' },
              hour: { $hour: '$timestamp' }
            },
            totalRequests: { $sum: 1 },
            errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } }
          }
        },
        {
          $addFields: {
            timestamp: {
              $dateFromParts: {
                year: '$_id.year',
                month: '$_id.month',
                day: '$_id.day',
                hour: '$_id.hour'
              }
            },
            rate: {
              $cond: [
                { $gt: ['$totalRequests', 0] },
                { $multiply: [{ $divide: ['$errors', '$totalRequests'] }, 100] },
                0
              ]
            }
          }
        },
        {
          $sort: { timestamp: 1 }
        },
        {
          $project: {
            _id: 0,
            timestamp: 1,
            errors: 1,
            rate: { $round: ['$rate', 2] }
          }
        }
      ]).toArray() as ErrorMetrics[];

      return {
        totalErrors: stats.totalErrors,
        errorRate: Math.round(errorRate * 100) / 100,
        errorsByStatus: statusBreakdown,
        errorsByService: serviceBreakdown,
        topErrors: topErrorsFormatted,
        errorTrend
      };
    } catch (error) {
      logger.error('Failed to get error analytics', { error, tenantId, period });
      throw error;
    }
  }

  /**
   * Get platform-wide overview (admin)
   */
  public async getPlatformOverview(): Promise<{
    totalRequests: number;
    activeTenants: number;
    totalBandwidth: number;
    averageResponseTime: number;
    systemHealth: 'healthy' | 'degraded' | 'down';
    topServices: Array<{ service: string; requests: number }>;
  }> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    try {
      const [platformStats, activeTenants, topServices] = await Promise.all([
        database.collection('usage_events').aggregate([
          {
            $match: { timestamp: { $gte: dayAgo, $lte: now } }
          },
          {
            $group: {
              _id: null,
              totalRequests: { $sum: 1 },
              totalBandwidth: { $sum: { $add: ['$requestSize', '$responseSize'] } },
              averageResponseTime: { $avg: '$responseTime' }
            }
          }
        ]).toArray(),
        
        database.collection('usage_events').distinct('tenantId', {
          timestamp: { $gte: dayAgo, $lte: now }
        }),
        
        database.collection('usage_events').aggregate([
          {
            $match: { timestamp: { $gte: dayAgo, $lte: now } }
          },
          {
            $group: {
              _id: '$service',
              requests: { $sum: 1 }
            }
          },
          {
            $sort: { requests: -1 }
          },
          {
            $limit: 5
          },
          {
            $project: {
              service: '$_id',
              requests: 1,
              _id: 0
            }
          }
        ]).toArray() as unknown as ServiceUsage[]
      ]);

      const stats = platformStats[0] || {
        totalRequests: 0,
        totalBandwidth: 0,
        averageResponseTime: 0
      };

      // Simple health check based on recent activity
      let systemHealth: 'healthy' | 'degraded' | 'down' = 'healthy';
      if (stats.totalRequests === 0) {
        systemHealth = 'down';
      } else if (stats.averageResponseTime > 1000) {
        systemHealth = 'degraded';
      }

      return {
        totalRequests: stats.totalRequests,
        activeTenants: activeTenants.length,
        totalBandwidth: stats.totalBandwidth,
        averageResponseTime: Math.round(stats.averageResponseTime || 0),
        systemHealth,
        topServices
      };
    } catch (error) {
      logger.error('Failed to get platform overview', { error });
      throw error;
    }
  }

  // Helper methods

  private async getUsageMetricsForPeriod(tenantId: string, startDate: Date, endDate: Date): Promise<UsageMetrics> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
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
          errors: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } },
          responseTimeValues: { $push: '$responseTime' },
          services: { $push: '$service' }
        }
      }
    ];

    const [result] = await database.collection('usage_events').aggregate(pipeline).toArray();
    
    if (!result) {
      return {
        requests: { total: 0, change: 0, perService: {} },
        bandwidth: { total: 0, change: 0 },
        responseTime: { average: 0, p95: 0, p99: 0 },
        errorRate: { rate: 0, change: 0 }
      };
    }

    // Calculate percentiles
    const sorted = result.responseTimeValues.sort((a: number, b: number) => a - b);
    const len = sorted.length;
    const p95 = len > 0 ? sorted[Math.floor(len * 0.95)] : 0;
    const p99 = len > 0 ? sorted[Math.floor(len * 0.99)] : 0;

    // Calculate service breakdown
    const perService: Record<string, number> = {};
    result.services.forEach((service: string) => {
      perService[service] = (perService[service] || 0) + 1;
    });

    const errorRate = result.totalRequests > 0 ? (result.errors / result.totalRequests) * 100 : 0;

    return {
      requests: {
        total: result.totalRequests,
        change: 0, // Will be calculated by caller
        perService
      },
      bandwidth: {
        total: result.totalBandwidth,
        change: 0 // Will be calculated by caller
      },
      responseTime: {
        average: result.averageResponseTime || 0,
        p95,
        p99
      },
      errorRate: {
        rate: errorRate,
        change: 0 // Will be calculated by caller
      }
    };
  }

  private async getMetricTrend(
    tenantId: string,
    metric: string,
    startDate: Date,
    endDate: Date,
    granularity: string
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    const groupBy = granularity === 'hourly'
      ? {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' },
          hour: { $hour: '$timestamp' }
        }
      : {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        };

    const aggregateField = metric === 'requests' ? { $sum: 1 } : { $avg: `$${metric}` };

    const pipeline = [
      {
        $match: {
          tenantId,
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: groupBy,
          value: aggregateField
        }
      },
      {
        $addFields: {
          timestamp: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day',
              hour: { $ifNull: ['$_id.hour', 0] }
            }
          }
        }
      },
      {
        $sort: { timestamp: 1 }
      },
      {
        $project: {
          _id: 0,
          timestamp: 1,
          value: 1
        }
      }
    ];

    return await database.collection('usage_events').aggregate(pipeline).toArray() as MetricValue[];
  }

  private async getAvailabilityMetrics(tenantId: string, startDate: Date, endDate: Date): Promise<{
    percentage: number;
    downtime: number;
    incidents: Array<{
      start: Date;
      end: Date;
      service: string;
      reason: string;
    }>;
  }> {
    // Simplified availability calculation
    // In a real implementation, this would track service health events
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    const totalRequests = await database.collection('usage_events').countDocuments({
      tenantId,
      timestamp: { $gte: startDate, $lte: endDate }
    });

    const successfulRequests = await database.collection('usage_events').countDocuments({
      tenantId,
      timestamp: { $gte: startDate, $lte: endDate },
      statusCode: { $lt: 500 }
    });

    const availability = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;
    const downtime = ((100 - availability) / 100) * ((endDate.getTime() - startDate.getTime()) / (1000 * 60));

    return {
      percentage: Math.round(availability * 100) / 100,
      downtime: Math.round(downtime),
      incidents: [] // Would be populated from service health events
    };
  }

  private parsePeriod(period: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    const endDate = now;
    let startDate: Date;

    switch (period) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate };
  }

  // Additional admin methods
  public async getTenantsSummary(): Promise<any> {
    // Implementation for admin tenant summary
    return {};
  }

  public async getRevenueAnalytics(period: string): Promise<any> {
    // Implementation for revenue analytics
    return {};
  }

  public async getSystemHealth(): Promise<any> {
    // Implementation for system health
    return {};
  }

  public async getTopTenants(metric: string, limit: number, period: string): Promise<any[]> {
    // Implementation for top tenants
    return [];
  }

  public async generateDailySummaries(): Promise<void> {
    // Implementation for daily summaries
  }

  public async cleanupOldEvents(): Promise<void> {
    const database = db.getDB();
    if (!database) return;

    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
    
    try {
      const result = await database.collection('usage_events').deleteMany({
        timestamp: { $lt: cutoffDate }
      });
      
      logger.info('Old usage events cleaned up', { deletedCount: result.deletedCount });
    } catch (error) {
      logger.error('Failed to cleanup old events', { error });
    }
  }
}