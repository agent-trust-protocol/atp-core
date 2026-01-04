import express from 'express';
import cors from 'cors';
import { dbConnection } from '../database/connection';
import workflowRoutes from './routes';
import { WorkflowScheduler } from '../services/WorkflowScheduler';
import { WorkflowEventService } from '../services/WorkflowEventService';

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
    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      credentials: true
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

    // API key authentication (if enabled)
    if (process.env.API_KEY_REQUIRED === 'true') {
      this.app.use((req, res, next) => {
        const apiKey = req.headers['x-api-key'];
        const validApiKey = process.env.API_KEY;
        
        if (!apiKey || apiKey !== validApiKey) {
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
        documentation: 'https://docs.atp.dev/workflow-engine'
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