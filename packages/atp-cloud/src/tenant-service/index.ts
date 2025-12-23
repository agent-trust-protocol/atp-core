/**
 * ATP Cloud Tenant Management Service
 * Handles tenant creation, billing, and management
 * 
 * ⚠️  INTERNAL TESTING ONLY - NOT FOR PRODUCTION USE
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { db } from '../shared/database.js';
import { config } from '../shared/config.js';
import { createServiceLogger } from '../shared/logger.js';
import { authenticateToken } from '../shared/auth.js';
import { TenantManager } from './tenant-manager.js';
import { BillingService } from './billing-service.js';

const logger = createServiceLogger('tenant-service');

export class TenantService {
  private app: express.Application;
  private tenantManager: TenantManager;
  private billingService: BillingService;

  constructor() {
    this.app = express();
    this.tenantManager = new TenantManager();
    this.billingService = new BillingService();
    this.setupMiddleware();
    this.setupRoutes();
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
      logger.debug('Tenant service request', {
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
        service: 'atp-tenant-service',
        version: '0.1.0-alpha',
        timestamp: new Date().toISOString()
      });
    });

    // Authentication required for all tenant operations
    this.app.use('/api/v1/*', authenticateToken);

    // Tenant management routes
    this.setupTenantRoutes();
    this.setupBillingRoutes();

    // Error handler
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Tenant service error', { error: err.message, stack: err.stack });
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    });
  }

  private setupTenantRoutes(): void {
    const router = express.Router();

    // Create new tenant
    router.post('/tenants', async (req, res) => {
      try {
        const tenant = await this.tenantManager.createTenant(req.body);
        res.status(201).json(tenant);
      } catch (error: any) {
        logger.error('Failed to create tenant', { error: error.message });
        res.status(400).json({
          error: error.message,
          code: 'TENANT_CREATION_FAILED'
        });
      }
    });

    // Get tenant by ID
    router.get('/tenants/:id', async (req, res) => {
      try {
        const tenant = await this.tenantManager.getTenant(req.params.id);
        if (!tenant) {
          return res.status(404).json({
            error: 'Tenant not found',
            code: 'TENANT_NOT_FOUND'
          });
        }
        res.json(tenant);
      } catch (error: any) {
        logger.error('Failed to get tenant', { error: error.message });
        res.status(500).json({
          error: 'Failed to retrieve tenant',
          code: 'TENANT_RETRIEVAL_FAILED'
        });
      }
    });

    // List tenants
    router.get('/tenants', async (req, res) => {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string;
        const plan = req.query.plan as string;

        const result = await this.tenantManager.listTenants({
          page,
          limit,
          status,
          plan
        });

        res.json(result);
      } catch (error: any) {
        logger.error('Failed to list tenants', { error: error.message });
        res.status(500).json({
          error: 'Failed to list tenants',
          code: 'TENANT_LIST_FAILED'
        });
      }
    });

    // Update tenant
    router.put('/tenants/:id', async (req, res) => {
      try {
        const tenant = await this.tenantManager.updateTenant(req.params.id, req.body);
        res.json(tenant);
      } catch (error: any) {
        logger.error('Failed to update tenant', { error: error.message });
        res.status(400).json({
          error: error.message,
          code: 'TENANT_UPDATE_FAILED'
        });
      }
    });

    // Suspend tenant
    router.post('/tenants/:id/suspend', async (req, res) => {
      try {
        const tenant = await this.tenantManager.suspendTenant(req.params.id, req.body.reason);
        res.json(tenant);
      } catch (error: any) {
        logger.error('Failed to suspend tenant', { error: error.message });
        res.status(400).json({
          error: error.message,
          code: 'TENANT_SUSPEND_FAILED'
        });
      }
    });

    // Activate tenant
    router.post('/tenants/:id/activate', async (req, res) => {
      try {
        const tenant = await this.tenantManager.activateTenant(req.params.id);
        res.json(tenant);
      } catch (error: any) {
        logger.error('Failed to activate tenant', { error: error.message });
        res.status(400).json({
          error: error.message,
          code: 'TENANT_ACTIVATE_FAILED'
        });
      }
    });

    // Generate API key
    router.post('/tenants/:id/api-keys', async (req, res) => {
      try {
        const apiKey = await this.tenantManager.generateApiKey(req.params.id, req.body);
        res.status(201).json(apiKey);
      } catch (error: any) {
        logger.error('Failed to generate API key', { error: error.message });
        res.status(400).json({
          error: error.message,
          code: 'API_KEY_GENERATION_FAILED'
        });
      }
    });

    // Revoke API key
    router.delete('/tenants/:id/api-keys/:keyId', async (req, res) => {
      try {
        await this.tenantManager.revokeApiKey(req.params.id, req.params.keyId);
        res.status(204).send();
      } catch (error: any) {
        logger.error('Failed to revoke API key', { error: error.message });
        res.status(400).json({
          error: error.message,
          code: 'API_KEY_REVOCATION_FAILED'
        });
      }
    });

    this.app.use('/api/v1', router);
  }

  private setupBillingRoutes(): void {
    const router = express.Router();

    // Get tenant usage
    router.get('/tenants/:id/usage', async (req, res) => {
      try {
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

        const usage = await this.billingService.getTenantUsage(req.params.id, startDate, endDate);
        res.json(usage);
      } catch (error: any) {
        logger.error('Failed to get tenant usage', { error: error.message });
        res.status(500).json({
          error: 'Failed to retrieve usage data',
          code: 'USAGE_RETRIEVAL_FAILED'
        });
      }
    });

    // Get billing summary
    router.get('/tenants/:id/billing', async (req, res) => {
      try {
        const billing = await this.billingService.getBillingSummary(req.params.id);
        res.json(billing);
      } catch (error: any) {
        logger.error('Failed to get billing summary', { error: error.message });
        res.status(500).json({
          error: 'Failed to retrieve billing data',
          code: 'BILLING_RETRIEVAL_FAILED'
        });
      }
    });

    // Change tenant plan
    router.post('/tenants/:id/plan', async (req, res) => {
      try {
        const result = await this.billingService.changePlan(req.params.id, req.body.plan);
        res.json(result);
      } catch (error: any) {
        logger.error('Failed to change plan', { error: error.message });
        res.status(400).json({
          error: error.message,
          code: 'PLAN_CHANGE_FAILED'
        });
      }
    });

    // Stripe webhook for payment processing
    router.post('/billing/webhook', async (req, res) => {
      try {
        await this.billingService.handleStripeWebhook(req.body, req.headers);
        res.status(200).send();
      } catch (error: any) {
        logger.error('Stripe webhook failed', { error: error.message });
        res.status(400).json({
          error: 'Webhook processing failed',
          code: 'WEBHOOK_FAILED'
        });
      }
    });

    this.app.use('/api/v1', router);
  }

  public async start(port: number = 3011): Promise<void> {
    try {
      // Connect to databases
      await db.connectMongoDB();
      await db.connectRedis();

      // Start HTTP server
      this.app.listen(port, () => {
        logger.info('🏢 ATP Tenant Service started', {
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
      logger.error('Failed to start Tenant Service', { error });
      process.exit(1);
    }
  }

  private async shutdown(): Promise<void> {
    logger.info('Shutting down Tenant Service...');
    await db.disconnect();
    process.exit(0);
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Start the service if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tenantService = new TenantService();
  tenantService.start(parseInt(process.env.PORT || '3011'));
}