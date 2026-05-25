import express from 'express';
import cors from 'cors';
import { timingSafeEqual } from 'crypto';
import { dbConnection } from '../database/connection';
import workflowRoutes from './routes';
import { WorkflowScheduler } from '../services/WorkflowScheduler';
import { WorkflowEventService } from '../services/WorkflowEventService';

function parseAllowedOrigins(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  // timingSafeEqual requires equal-length buffers; pad shorter to longer with
  // zeros and OR the length-mismatch into the result so we still take
  // constant time but always return false on length mismatch.
  const len = Math.max(ab.length, bb.length);
  const apad = Buffer.alloc(len);
  const bpad = Buffer.alloc(len);
  ab.copy(apad);
  bb.copy(bpad);
  return timingSafeEqual(apad, bpad) && ab.length === bb.length;
}

export class WorkflowApiServer {
  private app: express.Application;
  private server: any;
  private scheduler: WorkflowScheduler;
  private eventService: WorkflowEventService;

  constructor() {
    this.app = express();
    this.scheduler = new WorkflowScheduler();
    this.eventService = new WorkflowEventService();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware() {
    // CORS configuration: refuse to start with the wildcard '*' in production,
    // and never combine wildcards with credentialed requests.
    const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN);
    const allowCredentials = process.env.CORS_ALLOW_CREDENTIALS === 'true';
    if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
      throw new Error('[workflow-api] CORS_ORIGIN must be set to an explicit allowlist in production');
    }
    this.app.use(cors({
      origin: allowedOrigins.length > 0 ? allowedOrigins : false,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      credentials: allowCredentials && allowedOrigins.length > 0,
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);

      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${new Date().toISOString()} ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
      });

      next();
    });

    // Security headers
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });

    // API key authentication is required by default. It can only be disabled
    // explicitly in non-production environments by setting
    // API_KEY_REQUIRED=false. Comparison uses timingSafeEqual to prevent
    // timing-channel attacks on the key.
    const apiKeyRequired = process.env.API_KEY_REQUIRED !== 'false'
      || process.env.NODE_ENV === 'production';
    if (apiKeyRequired) {
      const validApiKey = process.env.API_KEY;
      if (!validApiKey || validApiKey.length < 16) {
        throw new Error('[workflow-api] API_KEY must be set (≥16 chars) when API_KEY_REQUIRED is not "false"');
      }
      this.app.use('/api', (req, res, next) => {
        const provided = req.headers['x-api-key'];
        const candidate = Array.isArray(provided) ? provided[0] : provided;
        if (typeof candidate !== 'string' || !constantTimeEqual(candidate, validApiKey)) {
          return res.status(401).json({ error: 'Invalid or missing API key' });
        }
        next();
      });
    }
  }

  private setupRoutes() {
    // Health check endpoint (before auth)
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // API routes
    this.app.use('/api/workflows', workflowRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'ATP Workflow Engine API',
        version: process.env.npm_package_version || '1.0.0',
        endpoints: {
          health: '/health',
          workflows: '/api/workflows',
          nodes: '/api/workflows/nodes',
          executions: '/api/workflows/executions'
        },
        documentation: 'https://github.com/agent-trust-protocol/atp-core/tree/main/docs/workflow-engine'
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Not found',
        path: req.originalUrl
      });
    });
  }

  private setupErrorHandling() {
    // Global error handler
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Unhandled error:', error);

      // Don't leak error details in production
      const isProduction = process.env.NODE_ENV === 'production';

      res.status(500).json({
        error: 'Internal server error',
        message: isProduction ? 'Something went wrong' : error.message,
        stack: isProduction ? undefined : error.stack
      });
    });
  }

  async initialize() {
    try {
      // Initialize database connection
      console.log('Initializing database connection...');
      dbConnection.initializeFromEnv();

      const isConnected = await dbConnection.testConnection();
      if (!isConnected) {
        throw new Error('Database connection failed');
      }

      console.log('Database connection established');

      // Initialize scheduler
      console.log('Initializing workflow scheduler...');
      await this.scheduler.initialize();

      // Initialize event service
      console.log('Initializing event service...');
      await this.eventService.initialize();

      console.log('Workflow API server initialized successfully');
    } catch (error) {
      console.error('Failed to initialize workflow API server:', error);
      throw error;
    }
  }

  async start(port: number = 3005) {
    await this.initialize();

    this.server = this.app.listen(port, () => {
      console.log(`Workflow API server listening on port ${port}`);
      console.log(`Health check: http://localhost:${port}/health`);
      console.log(`API endpoint: http://localhost:${port}/api/workflows`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());

    return this.server;
  }

  async shutdown() {
    console.log('Shutting down workflow API server...');

    try {
      // Stop accepting new connections
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve);
        });
        console.log('HTTP server closed');
      }

      // Shutdown services
      await this.scheduler.shutdown();
      console.log('Workflow scheduler stopped');

      await this.eventService.shutdown();
      console.log('Event service stopped');

      // Close database connection
      await dbConnection.close();
      console.log('Database connection closed');

      console.log('Workflow API server shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  getApp() {
    return this.app;
  }
}

// For standalone execution (ES modules)
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new WorkflowApiServer();
  const port = parseInt(process.env.WORKFLOW_API_PORT || '3005');

  server.start(port).catch((error) => {
    console.error('Failed to start workflow API server:', error);
    process.exit(1);
  });
}

export default WorkflowApiServer;
