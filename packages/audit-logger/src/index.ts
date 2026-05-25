import express from 'express';
import cors from 'cors';
import { AuditStorageService } from './services/storage.js';
import { IPFSService } from './services/ipfs.js';
import { AuditService } from './services/audit.js';
import { AuditController } from './controllers/audit.js';
import { DatabaseConfig, requireServiceAuth, parseAllowedOrigins } from '@atp/shared';
import { config } from './config.js';

const app = express();

const allowedOrigins = parseAllowedOrigins(config.ALLOWED_ORIGINS);
app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  credentials: false,
}));
app.use(express.json({ limit: '512kb' }));

// PostgreSQL configuration
const dbConfig: DatabaseConfig = {
  connectionString: config.DATABASE_URL,
  ssl: config.NODE_ENV === 'production',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const storage = new AuditStorageService(dbConfig);
const ipfs = new IPFSService(config.IPFS_URL);
const auditService = new AuditService(storage, ipfs);
const auditController = new AuditController(auditService);

// Auth gates: writers need `audit:write`, readers `audit:read`,
// integrity verification requires `audit:admin`.
const { JWT_SECRET: jwtSecret } = config;
const writeAuth = requireServiceAuth({ jwtSecret, requiredScopes: ['audit:write'] });
const readAuth = requireServiceAuth({ jwtSecret, requiredScopes: ['audit:read'] });
const adminAuth = requireServiceAuth({ jwtSecret, requiredScopes: ['audit:admin'] });

// Routes
app.post('/audit/log', writeAuth, (req, res) => auditController.logEvent(req, res));
app.get('/audit/event/:id', readAuth, (req, res) => auditController.getEvent(req, res));
app.get('/audit/events', readAuth, (req, res) => auditController.queryEvents(req, res));
app.get('/audit/integrity', adminAuth, (req, res) => auditController.verifyIntegrity(req, res));
app.get('/audit/stats', readAuth, (req, res) => auditController.getStats(req, res));
app.get('/audit/ipfs/:hash', readAuth, (req, res) => auditController.getEventFromIPFS(req, res));

app.get('/health', async (req, res) => {
  try {
    const dbHealth = await storage.healthCheck();
    res.json({ 
      status: dbHealth.healthy ? 'healthy' : 'unhealthy', 
      service: 'audit-logger',
      version: '0.1.0',
      protocol: 'Agent Trust Protocol™',
      database: dbHealth
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      service: 'audit-logger',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Initialize storage and start server
async function startServer() {
  try {
    await storage.initialize();
    console.log('Database connection established');
    
    app.listen(config.PORT, () => {
      console.log(`Audit Logger Service running on port ${config.PORT}`);
      console.log('Agent Trust Protocol™ - Audit Logger Service v0.1.0');
    });
  } catch (error) {
    console.error('Failed to start Audit Logger Service:', error);
    process.exit(1);
  }
}

startServer();

export { AuditStorageService, IPFSService, AuditService, AuditController };