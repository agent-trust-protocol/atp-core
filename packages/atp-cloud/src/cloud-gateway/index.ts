/**
 * ATP Cloud Gateway
 * Multi-tenant cloud gateway for Agent Trust Protocol services
 * 
 * ⚠️  INTERNAL TESTING ONLY - NOT FOR PRODUCTION USE
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { db } from '../shared/database.js';
import { config } from '../shared/config.js';
import { createServiceLogger } from '../shared/logger.js';
import { authenticateApiKey, AuthenticatedRequest } from '../shared/auth.js';
import { rateLimitMiddleware } from '../shared/rate-limiter.js';
import { UsageTracker } from './usage-tracker.js';
import { ServiceRouter } from './service-router.js';

const logger = createServiceLogger('cloud-gateway');

export class CloudGateway {
  private app: express.Application;
  private usageTracker: UsageTracker;
  private serviceRouter: ServiceRouter;

  constructor() {
    this.app = express();
    this.usageTracker = new UsageTracker();
    this.serviceRouter = new ServiceRouter();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS
    this.app.use(cors({
      origin: config.isDevelopment() ? '*' : /\.atp\.cloud$/,
      credentials: true
    }));

    // Parse JSON
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.debug('Incoming request', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'atp-cloud-gateway',
        version: '0.1.0-alpha',
        timestamp: new Date().toISOString(),
        environment: config.getConfig().environment
      });
    });

    // API documentation
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'ATP Cloud API',
        version: '0.1.0-alpha',
        description: 'Multi-tenant Agent Trust Protocol Cloud Platform',
        status: 'INTERNAL TESTING ONLY',
        endpoints: {
          identity: '/api/v1/identity/*',
          credentials: '/api/v1/credentials/*', 
          permissions: '/api/v1/permissions/*',
          audit: '/api/v1/audit/*',
          monitoring: '/api/v1/monitoring/*'
        },
        authentication: 'API Key required in X-API-Key header',
        rateLimit: 'Per-tenant rate limiting applied',
        documentation: 'https://docs.atp.cloud/api'
      });
    });

    // Apply authentication and rate limiting to all API routes
    this.app.use('/api/v1/*', authenticateApiKey);
    this.app.use('/api/v1/*', rateLimitMiddleware);
    this.app.use('/api/v1/*', this.usageTracker.trackUsage.bind(this.usageTracker));

    // Service proxy routes
    this.setupServiceProxies();

    // 404 handler
    this.app.use('*', (req, res) => {
      logger.warn('Route not found', { path: req.path, method: req.method });
      res.status(404).json({
        error: 'Route not found',
        code: 'NOT_FOUND',
        path: req.path
      });
    });

    // Error handler
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error', { error: err.message, stack: err.stack });
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    });
  }

  private setupServiceProxies(): void {
    const cloudConfig = config.getConfig();

    // Identity Service
    this.app.use('/api/v1/identity', createProxyMiddleware({
      target: cloudConfig.services.identity.url,
      changeOrigin: true,
      pathRewrite: { '^/api/v1/identity': '' },
      onProxyReq: this.addTenantHeaders,
      onError: (err, req, res) => {
        logger.error('Identity service proxy error', { error: err.message });
        (res as express.Response).status(502).json({
          error: 'Identity service unavailable',
          code: 'SERVICE_UNAVAILABLE'
        });
      }
    }));

    // Credential Service
    this.app.use('/api/v1/credentials', createProxyMiddleware({
      target: cloudConfig.services.credentials.url,
      changeOrigin: true,
      pathRewrite: { '^/api/v1/credentials': '' },
      onProxyReq: this.addTenantHeaders,
      onError: (err, req, res) => {
        logger.error('Credentials service proxy error', { error: err.message });
        (res as express.Response).status(502).json({
          error: 'Credentials service unavailable',
          code: 'SERVICE_UNAVAILABLE'
        });
      }
    }));

    // Permission Service
    this.app.use('/api/v1/permissions', createProxyMiddleware({
      target: cloudConfig.services.permissions.url,
      changeOrigin: true,
      pathRewrite: { '^/api/v1/permissions': '' },
      onProxyReq: this.addTenantHeaders,
      onError: (err, req, res) => {
        logger.error('Permissions service proxy error', { error: err.message });
        (res as express.Response).status(502).json({
          error: 'Permissions service unavailable',
          code: 'SERVICE_UNAVAILABLE'
        });
      }
    }));

    // Audit Service
    this.app.use('/api/v1/audit', createProxyMiddleware({
      target: cloudConfig.services.audit.url,
      changeOrigin: true,
      pathRewrite: { '^/api/v1/audit': '' },
      onProxyReq: this.addTenantHeaders,
      onError: (err, req, res) => {
        logger.error('Audit service proxy error', { error: err.message });
        (res as express.Response).status(502).json({
          error: 'Audit service unavailable',
          code: 'SERVICE_UNAVAILABLE'
        });
      }
    }));

    // Monitoring Service (if enabled for tenant)
    this.app.use('/api/v1/monitoring', (req: AuthenticatedRequest, res, next) => {
      // Check if tenant has monitoring enabled
      // This would be determined from tenant configuration
      next();
    }, createProxyMiddleware({
      target: cloudConfig.services.monitoring.url,
      changeOrigin: true,
      pathRewrite: { '^/api/v1/monitoring': '' },
      onProxyReq: this.addTenantHeaders,
      onError: (err, req, res) => {
        logger.error('Monitoring service proxy error', { error: err.message });
        (res as express.Response).status(502).json({
          error: 'Monitoring service unavailable',
          code: 'SERVICE_UNAVAILABLE'
        });
      }
    }));
  }

  private addTenantHeaders(proxyReq: any, req: AuthenticatedRequest): void {
    if (req.tenant) {
      proxyReq.setHeader('x-tenant-id', req.tenant.id);
      proxyReq.setHeader('x-tenant-plan', req.tenant.plan);
      proxyReq.setHeader('x-tenant-name', req.tenant.name);
    }
  }

  public async start(port: number = 3010): Promise<void> {
    try {
      // Connect to databases
      await db.connectMongoDB();
      await db.connectRedis();

      // Start HTTP server
      this.app.listen(port, () => {
        logger.info(`🔐 ATP Cloud Gateway started`, {
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
      logger.error('Failed to start Cloud Gateway', { error });
      process.exit(1);
    }
  }

  private async shutdown(): Promise<void> {
    logger.info('Shutting down Cloud Gateway...');
    await db.disconnect();
    process.exit(0);
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Start the service if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const gateway = new CloudGateway();
  gateway.start(parseInt(process.env.PORT || '3010'));
}