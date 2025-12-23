/**
 * ATP™ Monitoring Service - API Controllers
 */

import { Request, Response } from 'express';
import { MetricsCollector } from '../services/metrics-collector.js';
import { MetricsStorage } from '../services/metrics-storage.js';
import { AlertingService } from '../services/alerting-service.js';
import { MetricsQuery } from '../types/metrics.js';

export class MonitoringController {
  private metricsCollector: MetricsCollector;
  private metricsStorage: MetricsStorage;
  private alertingService: AlertingService;

  constructor() {
    this.metricsCollector = new MetricsCollector();
    this.metricsStorage = new MetricsStorage();
    this.alertingService = new AlertingService();
  }

  /**
   * GET /api/monitoring/metrics
   * Get current system metrics
   */
  async getCurrentMetrics(req: Request, res: Response) {
    try {
      const metrics = await this.metricsCollector.collectMetrics();
      
      // Store metrics for historical tracking
      await this.metricsStorage.storeMetrics(metrics);
      
      // Check for alerts
      await this.alertingService.checkMetrics(metrics);
      
      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to collect metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to collect system metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/monitoring/metrics/history
   * Get historical metrics data
   */
  async getMetricsHistory(req: Request, res: Response) {
    try {
      const query: MetricsQuery = {
        timeRange: (req.query.timeRange as any) || 'day',
        services: req.query.services ? (req.query.services as string).split(',') : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100
      };

      const history = await this.metricsStorage.getMetricsHistory(query);
      
      res.json({
        success: true,
        data: history,
        query,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to get metrics history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve metrics history'
      });
    }
  }

  /**
   * GET /api/monitoring/services
   * Get service health status
   */
  async getServiceHealth(req: Request, res: Response) {
    try {
      const metrics = await this.metricsCollector.collectMetrics();
      
      res.json({
        success: true,
        data: {
          services: metrics.services,
          summary: {
            total: metrics.services.length,
            online: metrics.services.filter(s => s.status === 'online').length,
            degraded: metrics.services.filter(s => s.status === 'degraded').length,
            offline: metrics.services.filter(s => s.status === 'offline').length
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to get service health:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check service health'
      });
    }
  }

  /**
   * GET /api/monitoring/alerts
   * Get active alerts
   */
  async getAlerts(req: Request, res: Response) {
    try {
      const alerts = await this.alertingService.getAlerts({
        resolved: req.query.resolved === 'true',
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50
      });

      res.json({
        success: true,
        data: alerts,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to get alerts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve alerts'
      });
    }
  }

  /**
   * POST /api/monitoring/alerts/:id/resolve
   * Resolve an alert
   */
  async resolveAlert(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const alert = await this.alertingService.resolveAlert(id);
      
      if (!alert) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }

      return res.json({
        success: true,
        data: alert,
        message: 'Alert resolved successfully'
      });
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to resolve alert'
      });
    }
  }

  /**
   * GET /api/monitoring/dashboard
   * Get dashboard overview data
   */
  async getDashboardData(req: Request, res: Response) {
    try {
      const metrics = await this.metricsCollector.collectMetrics();
      const recentAlerts = await this.alertingService.getAlerts({ limit: 5 });
      
      // Calculate uptime percentages
      const avgUptime = metrics.services.reduce((sum, service) => sum + service.uptime, 0) / metrics.services.length;
      
      // Calculate trends (simplified - in production would compare with historical data)
      const trends = {
        activeAgents: '+12%', // Would be calculated from historical data
        performance: '+5%',
        security: '0%',
        uptime: `${avgUptime.toFixed(1)}%`
      };

      const dashboardData = {
        overview: {
          activeAgents: metrics.business.activeAgents,
          systemUptime: avgUptime,
          avgResponseTime: metrics.performance.avgResponseTime,
          totalEvents: metrics.business.auditEvents
        },
        services: metrics.services,
        performance: metrics.performance,
        security: metrics.security,
        recentAlerts: recentAlerts.slice(0, 5),
        trends
      };

      res.json({
        success: true,
        data: dashboardData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve dashboard data'
      });
    }
  }

  /**
   * GET /api/monitoring/health
   * Health check endpoint for the monitoring service itself
   */
  async healthCheck(req: Request, res: Response) {
    try {
      const uptime = process.uptime();
      const memUsage = process.memoryUsage();
      
      res.json({
        success: true,
        service: 'ATP™ Monitoring Service',
        status: 'healthy',
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024),
          total: Math.round(memUsage.heapTotal / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024)
        },
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        service: 'ATP™ Monitoring Service',
        status: 'unhealthy',
        error: 'Health check failed'
      });
    }
  }
}