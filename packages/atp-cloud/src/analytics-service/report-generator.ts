/**
 * ATP Cloud Report Generator
 * Generates usage reports and analytics summaries
 */

import { db } from '../shared/database.js';
import { createServiceLogger } from '../shared/logger.js';
import { AnalyticsEngine } from './analytics-engine.js';

const logger = createServiceLogger('report-generator');

export interface ReportConfig {
  type: 'usage' | 'performance' | 'billing' | 'security' | 'custom';
  period: {
    start: Date;
    end: Date;
  };
  format: 'json' | 'csv' | 'pdf';
  includeCharts: boolean;
  filters?: {
    services?: string[];
    statusCodes?: number[];
    minResponseTime?: number;
    maxResponseTime?: number;
  };
  groupBy?: 'service' | 'status' | 'endpoint' | 'hour' | 'day' | 'week';
}

export interface Report {
  id: string;
  tenantId?: string;
  title: string;
  description: string;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  data: any;
  metadata: {
    totalRecords: number;
    dataPoints: number;
    generationTime: number; // milliseconds
  };
}

export class ReportGenerator {
  private analyticsEngine: AnalyticsEngine;

  constructor() {
    this.analyticsEngine = new AnalyticsEngine();
  }

  /**
   * Generate tenant-specific report
   */
  public async generateTenantReport(tenantId: string, config: ReportConfig): Promise<Report> {
    const startTime = Date.now();
    
    try {
      logger.info('Generating tenant report', { tenantId, type: config.type });

      let data: any;
      let title: string;
      let description: string;

      switch (config.type) {
        case 'usage':
          data = await this.generateUsageReport(tenantId, config);
          title = 'Usage Analytics Report';
          description = `Comprehensive usage analytics for the period ${config.period.start.toDateString()} to ${config.period.end.toDateString()}`;
          break;

        case 'performance':
          data = await this.generatePerformanceReport(tenantId, config);
          title = 'Performance Analytics Report';
          description = `Performance metrics and response time analysis for the specified period`;
          break;

        case 'billing':
          data = await this.generateBillingReport(tenantId, config);
          title = 'Billing Report';
          description = `Usage-based billing details and cost breakdown`;
          break;

        case 'security':
          data = await this.generateSecurityReport(tenantId, config);
          title = 'Security Report';
          description = `Security events and error analysis`;
          break;

        case 'custom':
          data = await this.generateCustomReport(tenantId, config);
          title = 'Custom Analytics Report';
          description = 'Custom analytics report based on specified criteria';
          break;

        default:
          throw new Error(`Unsupported report type: ${config.type}`);
      }

      const generationTime = Date.now() - startTime;

      const report: Report = {
        id: `report_${tenantId}_${Date.now()}`,
        tenantId,
        title,
        description,
        generatedAt: new Date(),
        period: config.period,
        data,
        metadata: {
          totalRecords: this.countDataPoints(data),
          dataPoints: Array.isArray(data) ? data.length : Object.keys(data).length,
          generationTime
        }
      };

      // Store report in database for future reference
      await this.saveReport(report);

      logger.info('Tenant report generated successfully', {
        tenantId,
        reportId: report.id,
        generationTime
      });

      return report;
    } catch (error) {
      logger.error('Failed to generate tenant report', { error, tenantId, type: config.type });
      throw error;
    }
  }

  /**
   * Generate admin report (platform-wide)
   */
  public async generateAdminReport(config: ReportConfig): Promise<Report> {
    const startTime = Date.now();
    
    try {
      logger.info('Generating admin report', { type: config.type });

      let data: any;
      let title: string;
      let description: string;

      switch (config.type) {
        case 'usage':
          data = await this.generatePlatformUsageReport(config);
          title = 'Platform Usage Report';
          description = 'Platform-wide usage statistics and trends';
          break;

        case 'performance':
          data = await this.generatePlatformPerformanceReport(config);
          title = 'Platform Performance Report';
          description = 'Overall platform performance and health metrics';
          break;

        case 'billing':
          data = await this.generateRevenueReport(config);
          title = 'Revenue Report';
          description = 'Revenue analytics and billing insights';
          break;

        default:
          throw new Error(`Unsupported admin report type: ${config.type}`);
      }

      const generationTime = Date.now() - startTime;

      const report: Report = {
        id: `admin_report_${Date.now()}`,
        title,
        description,
        generatedAt: new Date(),
        period: config.period,
        data,
        metadata: {
          totalRecords: this.countDataPoints(data),
          dataPoints: Array.isArray(data) ? data.length : Object.keys(data).length,
          generationTime
        }
      };

      await this.saveReport(report);

      logger.info('Admin report generated successfully', {
        reportId: report.id,
        generationTime
      });

      return report;
    } catch (error) {
      logger.error('Failed to generate admin report', { error, type: config.type });
      throw error;
    }
  }

  /**
   * Generate weekly reports for all tenants (cron job)
   */
  public async generateWeeklyReports(): Promise<void> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    try {
      // Get all active tenants
      const tenants = await database.collection('tenants').find({
        status: 'active'
      }).toArray();

      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

      const reportConfig: ReportConfig = {
        type: 'usage',
        period: { start: startDate, end: endDate },
        format: 'json',
        includeCharts: false,
        groupBy: 'day'
      };

      const reportPromises = tenants.map(tenant =>
        this.generateTenantReport(tenant.id, reportConfig)
          .catch(error => {
            logger.error('Failed to generate weekly report for tenant', {
              tenantId: tenant.id,
              error: error.message
            });
          })
      );

      await Promise.allSettled(reportPromises);
      logger.info('Weekly reports generation completed', { tenantCount: tenants.length });
    } catch (error) {
      logger.error('Failed to generate weekly reports', { error });
      throw error;
    }
  }

  private async generateUsageReport(tenantId: string, config: ReportConfig): Promise<any> {
    const { start, end } = config.period;
    
    // Get usage history with daily granularity
    const usageHistory = await this.analyticsEngine.getUsageHistory(
      tenantId,
      start,
      end,
      'daily'
    );

    // Get service breakdown
    const period = this.formatPeriodForAPI(start, end);
    const serviceBreakdown = await this.analyticsEngine.getServiceBreakdown(tenantId, period);

    // Get current usage metrics
    const currentUsage = await this.analyticsEngine.getCurrentUsage(tenantId);

    return {
      summary: {
        totalRequests: usageHistory.reduce((sum, day) => sum + day.requests, 0),
        totalBandwidth: usageHistory.reduce((sum, day) => sum + day.bandwidth, 0),
        averageResponseTime: usageHistory.length > 0
          ? usageHistory.reduce((sum, day) => sum + day.responseTime, 0) / usageHistory.length
          : 0,
        averageErrorRate: usageHistory.length > 0
          ? usageHistory.reduce((sum, day) => sum + day.errorRate, 0) / usageHistory.length
          : 0
      },
      dailyTrends: usageHistory,
      serviceBreakdown,
      currentMetrics: currentUsage
    };
  }

  private async generatePerformanceReport(tenantId: string, config: ReportConfig): Promise<any> {
    const period = this.formatPeriodForAPI(config.period.start, config.period.end);
    
    const performanceMetrics = await this.analyticsEngine.getPerformanceMetrics(tenantId, period);
    const errorAnalytics = await this.analyticsEngine.getErrorAnalytics(tenantId, period);

    return {
      latency: performanceMetrics.latency,
      throughput: performanceMetrics.throughput,
      availability: performanceMetrics.availability,
      errors: {
        totalErrors: errorAnalytics.totalErrors,
        errorRate: errorAnalytics.errorRate,
        topErrors: errorAnalytics.topErrors,
        errorTrend: errorAnalytics.errorTrend
      }
    };
  }

  private async generateBillingReport(tenantId: string, config: ReportConfig): Promise<any> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    // Get tenant info
    const tenant = await database.collection('tenants').findOne({ id: tenantId });
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Calculate usage costs
    const { start, end } = config.period;
    const usageHistory = await this.analyticsEngine.getUsageHistory(tenantId, start, end, 'daily');
    
    const totalRequests = usageHistory.reduce((sum, day) => sum + day.requests, 0);
    const totalBandwidth = usageHistory.reduce((sum, day) => sum + day.bandwidth, 0);

    // Get plan limits and pricing
    const planLimits = this.getPlanLimits(tenant.plan);
    const planPricing = this.getPlanPricing(tenant.plan);

    // Calculate overages
    const requestOverage = Math.max(0, totalRequests - planLimits.maxRequests);
    const bandwidthOverageGB = Math.max(0, (totalBandwidth - planLimits.maxBandwidth * 1024 * 1024) / (1024 * 1024 * 1024));

    const overageCosts = {
      requests: requestOverage * 0.001, // $0.001 per request
      bandwidth: bandwidthOverageGB * 0.10 // $0.10 per GB
    };

    return {
      period: { start, end },
      plan: {
        name: tenant.plan,
        baseCost: planPricing.baseCost,
        limits: planLimits
      },
      usage: {
        totalRequests,
        totalBandwidth,
        dailyBreakdown: usageHistory
      },
      overages: {
        requests: {
          overage: requestOverage,
          cost: overageCosts.requests
        },
        bandwidth: {
          overageGB: Math.round(bandwidthOverageGB * 100) / 100,
          cost: overageCosts.bandwidth
        }
      },
      totalCost: planPricing.baseCost + overageCosts.requests + overageCosts.bandwidth
    };
  }

  private async generateSecurityReport(tenantId: string, config: ReportConfig): Promise<any> {
    const period = this.formatPeriodForAPI(config.period.start, config.period.end);
    const errorAnalytics = await this.analyticsEngine.getErrorAnalytics(tenantId, period);

    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    // Get security-related events (4xx and 5xx errors)
    const securityEvents = await database.collection('usage_events').aggregate([
      {
        $match: {
          tenantId,
          timestamp: { $gte: config.period.start, $lte: config.period.end },
          statusCode: { $in: [401, 403, 429, 500, 502, 503] }
        }
      },
      {
        $group: {
          _id: {
            statusCode: '$statusCode',
            path: '$path'
          },
          count: { $sum: 1 },
          ips: { $addToSet: '$metadata.ip' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();

    return {
      securityEvents: securityEvents.map(event => ({
        statusCode: event._id.statusCode,
        path: event._id.path,
        count: event.count,
        uniqueIPs: event.ips.length
      })),
      errorSummary: {
        totalErrors: errorAnalytics.totalErrors,
        errorRate: errorAnalytics.errorRate,
        errorsByStatus: errorAnalytics.errorsByStatus
      },
      recommendations: this.generateSecurityRecommendations(securityEvents, errorAnalytics)
    };
  }

  private async generateCustomReport(tenantId: string, config: ReportConfig): Promise<any> {
    // Implementation for custom reports based on filters and groupBy
    return {
      message: 'Custom report generation not yet implemented',
      config
    };
  }

  private async generatePlatformUsageReport(config: ReportConfig): Promise<any> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    const { start, end } = config.period;

    // Platform-wide usage statistics
    const platformStats = await database.collection('usage_events').aggregate([
      {
        $match: {
          timestamp: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          totalBandwidth: { $sum: { $add: ['$requestSize', '$responseSize'] } },
          averageResponseTime: { $avg: '$responseTime' },
          uniqueTenants: { $addToSet: '$tenantId' },
          serviceBreakdown: { $push: '$service' }
        }
      }
    ]).toArray();

    const stats = platformStats[0] || {
      totalRequests: 0,
      totalBandwidth: 0,
      averageResponseTime: 0,
      uniqueTenants: [],
      serviceBreakdown: []
    };

    // Service usage breakdown
    const serviceStats: Record<string, number> = {};
    stats.serviceBreakdown.forEach((service: string) => {
      serviceStats[service] = (serviceStats[service] || 0) + 1;
    });

    return {
      summary: {
        totalRequests: stats.totalRequests,
        totalBandwidth: stats.totalBandwidth,
        averageResponseTime: Math.round(stats.averageResponseTime || 0),
        activeTenants: stats.uniqueTenants.length
      },
      serviceBreakdown: serviceStats,
      period: { start, end }
    };
  }

  private async generatePlatformPerformanceReport(config: ReportConfig): Promise<any> {
    // Platform performance implementation
    return {
      message: 'Platform performance report not yet implemented',
      config
    };
  }

  private async generateRevenueReport(config: ReportConfig): Promise<any> {
    // Revenue report implementation
    return {
      message: 'Revenue report not yet implemented',
      config
    };
  }

  private async saveReport(report: Report): Promise<void> {
    const database = db.getDB();
    if (!database) return;

    try {
      await database.collection('reports').insertOne(report);
      logger.debug('Report saved to database', { reportId: report.id });
    } catch (error) {
      logger.error('Failed to save report', { error, reportId: report.id });
    }
  }

  private countDataPoints(data: any): number {
    if (Array.isArray(data)) {
      return data.length;
    }
    if (typeof data === 'object' && data !== null) {
      return Object.keys(data).reduce((sum, key) => {
        const value = data[key];
        if (Array.isArray(value)) {
          return sum + value.length;
        }
        if (typeof value === 'object' && value !== null) {
          return sum + this.countDataPoints(value);
        }
        return sum + 1;
      }, 0);
    }
    return 1;
  }

  private formatPeriodForAPI(start: Date, end: Date): string {
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return '24h';
    if (diffDays <= 7) return '7d';
    if (diffDays <= 30) return '30d';
    return '90d';
  }

  private getPlanLimits(plan: string): any {
    const limits = {
      free: { maxRequests: 1000, maxBandwidth: 1000 },
      starter: { maxRequests: 10000, maxBandwidth: 10000 },
      professional: { maxRequests: 100000, maxBandwidth: 100000 },
      enterprise: { maxRequests: 1000000, maxBandwidth: 1000000 }
    };
    return limits[plan as keyof typeof limits] || limits.free;
  }

  private getPlanPricing(plan: string): any {
    const pricing = {
      free: { baseCost: 0 },
      starter: { baseCost: 29 },
      professional: { baseCost: 99 },
      enterprise: { baseCost: 499 }
    };
    return pricing[plan as keyof typeof pricing] || pricing.free;
  }

  private generateSecurityRecommendations(securityEvents: any[], errorAnalytics: any): string[] {
    const recommendations: string[] = [];
    
    // Check for high 401/403 rates
    const authErrors = securityEvents.filter(e => [401, 403].includes(e._id.statusCode));
    if (authErrors.length > 0) {
      recommendations.push('High authentication/authorization errors detected. Consider reviewing API key management.');
    }

    // Check for rate limiting
    const rateLimitErrors = securityEvents.filter(e => e._id.statusCode === 429);
    if (rateLimitErrors.length > 0) {
      recommendations.push('Rate limiting events detected. Consider optimizing request patterns or upgrading plan.');
    }

    // Check for server errors
    const serverErrors = securityEvents.filter(e => e._id.statusCode >= 500);
    if (serverErrors.length > 0) {
      recommendations.push('Server errors detected. Monitor system health and consider contacting support.');
    }

    if (recommendations.length === 0) {
      recommendations.push('No significant security issues detected during this period.');
    }

    return recommendations;
  }
}