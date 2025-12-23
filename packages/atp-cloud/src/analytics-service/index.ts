/**
 * ATP Cloud Analytics Service
 * Usage analytics and insights for tenants and admins
 * 
 * ⚠️  INTERNAL TESTING ONLY - NOT FOR PRODUCTION USE
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';
import { db } from '../shared/database.js';
import { config } from '../shared/config.js';
import { createServiceLogger } from '../shared/logger.js';
import { authenticateApiKey, authenticateToken, AuthenticatedRequest } from '../shared/auth.js';
import { AnalyticsEngine } from './analytics-engine.js';
import { ReportGenerator } from './report-generator.js';

const logger = createServiceLogger('analytics-service');

export class AnalyticsService {
  private app: express.Application;
  private analyticsEngine: AnalyticsEngine;
  private reportGenerator: ReportGenerator;

  constructor() {
    this.app = express();
    this.analyticsEngine = new AnalyticsEngine();
    this.reportGenerator = new ReportGenerator();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupCronJobs();
  }

  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors({
      origin: config.isDevelopment() ? '*' : /\.atp\.cloud$/,
      credentials: true
    }));
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.debug('Analytics service request', {
        method: req.method,
        path: req.path,
        ip: req.ip
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'atp-analytics-service',
        version: '0.1.0-alpha',
        timestamp: new Date().toISOString()
      });
    });

    // Public analytics endpoints (require API key)
    this.setupTenantAnalyticsRoutes();

    // Admin analytics endpoints (require admin token)
    this.setupAdminAnalyticsRoutes();

    // Error handler
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Analytics service error', { error: err.message, stack: err.stack });
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    });
  }

  private setupTenantAnalyticsRoutes(): void {
    const router = express.Router();
    
    // Apply API key authentication to all tenant routes
    router.use(authenticateApiKey);

    // Real-time usage metrics
    router.get('/usage/current', async (req: AuthenticatedRequest, res) => {
      try {
        const metrics = await this.analyticsEngine.getCurrentUsage(req.tenant!.id);
        res.json(metrics);
      } catch (error: any) {
        logger.error('Failed to get current usage', { error: error.message, tenantId: req.tenant?.id });
        res.status(500).json({
          error: 'Failed to retrieve usage metrics',
          code: 'USAGE_RETRIEVAL_FAILED'
        });
      }
    });

    // Historical usage analytics
    router.get('/usage/history', async (req: AuthenticatedRequest, res) => {
      try {
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
        const granularity = (req.query.granularity as string) || 'daily';

        const analytics = await this.analyticsEngine.getUsageHistory(
          req.tenant!.id,
          startDate,
          endDate,
          granularity as 'hourly' | 'daily' | 'weekly' | 'monthly'
        );

        res.json(analytics);
      } catch (error: any) {
        logger.error('Failed to get usage history', { error: error.message, tenantId: req.tenant?.id });
        res.status(500).json({
          error: 'Failed to retrieve usage history',
          code: 'HISTORY_RETRIEVAL_FAILED'
        });
      }
    });

    // Performance analytics
    router.get('/performance', async (req: AuthenticatedRequest, res) => {
      try {
        const period = (req.query.period as string) || '7d';
        const performance = await this.analyticsEngine.getPerformanceMetrics(req.tenant!.id, period);
        res.json(performance);
      } catch (error: any) {
        logger.error('Failed to get performance metrics', { error: error.message, tenantId: req.tenant?.id });
        res.status(500).json({
          error: 'Failed to retrieve performance metrics',
          code: 'PERFORMANCE_RETRIEVAL_FAILED'
        });
      }
    });

    // Service usage breakdown
    router.get('/services', async (req: AuthenticatedRequest, res) => {
      try {
        const period = (req.query.period as string) || '30d';
        const breakdown = await this.analyticsEngine.getServiceBreakdown(req.tenant!.id, period);
        res.json(breakdown);
      } catch (error: any) {
        logger.error('Failed to get service breakdown', { error: error.message, tenantId: req.tenant?.id });
        res.status(500).json({
          error: 'Failed to retrieve service breakdown',
          code: 'SERVICE_BREAKDOWN_FAILED'
        });
      }
    });

    // Error analytics
    router.get('/errors', async (req: AuthenticatedRequest, res) => {
      try {
        const period = (req.query.period as string) || '7d';
        const errorAnalytics = await this.analyticsEngine.getErrorAnalytics(req.tenant!.id, period);
        res.json(errorAnalytics);
      } catch (error: any) {
        logger.error('Failed to get error analytics', { error: error.message, tenantId: req.tenant?.id });
        res.status(500).json({
          error: 'Failed to retrieve error analytics',
          code: 'ERROR_ANALYTICS_FAILED'
        });
      }
    });

    // Generate custom report
    router.post('/reports', async (req: AuthenticatedRequest, res) => {
      try {
        const reportConfig = req.body;
        const report = await this.reportGenerator.generateTenantReport(req.tenant!.id, reportConfig);
        res.json(report);
      } catch (error: any) {
        logger.error('Failed to generate report', { error: error.message, tenantId: req.tenant?.id });
        res.status(500).json({
          error: 'Failed to generate report',
          code: 'REPORT_GENERATION_FAILED'
        });
      }
    });

    this.app.use('/api/v1/analytics', router);
  }

  private setupAdminAnalyticsRoutes(): void {
    const router = express.Router();
    
    // Apply admin token authentication
    router.use(authenticateToken);

    // Platform-wide analytics
    router.get('/platform/overview', async (req, res) => {
      try {
        const overview = await this.analyticsEngine.getPlatformOverview();
        res.json(overview);
      } catch (error: any) {
        logger.error('Failed to get platform overview', { error: error.message });
        res.status(500).json({
          error: 'Failed to retrieve platform overview',
          code: 'PLATFORM_OVERVIEW_FAILED'
        });
      }
    });

    // Tenant analytics summary
    router.get('/tenants/summary', async (req, res) => {
      try {
        const summary = await this.analyticsEngine.getTenantsSummary();
        res.json(summary);
      } catch (error: any) {
        logger.error('Failed to get tenants summary', { error: error.message });
        res.status(500).json({
          error: 'Failed to retrieve tenants summary',
          code: 'TENANTS_SUMMARY_FAILED'
        });
      }
    });

    // Revenue analytics
    router.get('/revenue', async (req, res) => {
      try {
        const period = (req.query.period as string) || '30d';
        const revenue = await this.analyticsEngine.getRevenueAnalytics(period);
        res.json(revenue);
      } catch (error: any) {
        logger.error('Failed to get revenue analytics', { error: error.message });
        res.status(500).json({
          error: 'Failed to retrieve revenue analytics',
          code: 'REVENUE_ANALYTICS_FAILED'
        });
      }
    });

    // System health metrics
    router.get('/system/health', async (req, res) => {
      try {
        const health = await this.analyticsEngine.getSystemHealth();
        res.json(health);
      } catch (error: any) {
        logger.error('Failed to get system health', { error: error.message });
        res.status(500).json({
          error: 'Failed to retrieve system health',
          code: 'SYSTEM_HEALTH_FAILED'
        });
      }
    });

    // Top tenants by usage
    router.get('/tenants/top', async (req, res) => {
      try {
        const metric = (req.query.metric as string) || 'requests';
        const limit = parseInt(req.query.limit as string) || 10;
        const period = (req.query.period as string) || '30d';
        
        const topTenants = await this.analyticsEngine.getTopTenants(metric, limit, period);
        res.json(topTenants);
      } catch (error: any) {
        logger.error('Failed to get top tenants', { error: error.message });
        res.status(500).json({
          error: 'Failed to retrieve top tenants',
          code: 'TOP_TENANTS_FAILED'
        });
      }
    });

    // Generate admin report
    router.post('/reports/admin', async (req, res) => {
      try {
        const reportConfig = req.body;
        const report = await this.reportGenerator.generateAdminReport(reportConfig);
        res.json(report);
      } catch (error: any) {
        logger.error('Failed to generate admin report', { error: error.message });
        res.status(500).json({
          error: 'Failed to generate admin report',
          code: 'ADMIN_REPORT_FAILED'
        });
      }
    });

    this.app.use('/api/v1/admin/analytics', router);
  }

  private setupCronJobs(): void {
    // Generate daily analytics summaries at 2 AM
    cron.schedule('0 2 * * *', async () => {
      logger.info('Running daily analytics aggregation');
      try {
        await this.analyticsEngine.generateDailySummaries();
        logger.info('Daily analytics aggregation completed');
      } catch (error) {
        logger.error('Daily analytics aggregation failed', { error });
      }
    });

    // Generate weekly reports every Monday at 3 AM
    cron.schedule('0 3 * * 1', async () => {
      logger.info('Generating weekly reports');
      try {
        await this.reportGenerator.generateWeeklyReports();
        logger.info('Weekly reports generation completed');
      } catch (error) {
        logger.error('Weekly reports generation failed', { error });
      }
    });

    // Clean up old usage events (older than 90 days) daily at 4 AM
    cron.schedule('0 4 * * *', async () => {
      logger.info('Cleaning up old usage events');
      try {
        await this.analyticsEngine.cleanupOldEvents();
        logger.info('Usage events cleanup completed');
      } catch (error) {
        logger.error('Usage events cleanup failed', { error });
      }
    });
  }

  public async start(port: number = 3012): Promise<void> {
    try {
      // Connect to databases
      await db.connectMongoDB();
      await db.connectRedis();

      // Start HTTP server
      this.app.listen(port, () => {
        logger.info('📊 ATP Analytics Service started', {
          port,
          environment: config.getConfig().environment,
          version: '0.1.0-alpha',
          status: 'INTERNAL TESTING ONLY'
        });
      });

      // Graceful shutdown
      process.on('SIGTERM', this.shutdown.bind(this));
      process.on('SIGINT', this.shutdown.bind(this));

    } catch (error) {
      logger.error('Failed to start Analytics Service', { error });
      process.exit(1);
    }
  }

  private async shutdown(): Promise<void> {
    logger.info('Shutting down Analytics Service...');
    await db.disconnect();
    process.exit(0);
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Start the service if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyticsService = new AnalyticsService();
  analyticsService.start(parseInt(process.env.PORT || '3012'));
}