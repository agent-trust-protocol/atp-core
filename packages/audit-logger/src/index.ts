import express from 'express';
import cors from 'cors';
import { AuditStorageService } from './services/storage.js';
import { IPFSService } from './services/ipfs.js';
import { AuditService } from './services/audit.js';
import { AuditController } from './controllers/audit.js';
import { DatabaseConfig } from '@atp/shared';

const app = express();
const port = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

// PostgreSQL configuration
console.log('DATABASE_URL environment variable:', process.env.DATABASE_URL);
const dbConfig: DatabaseConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://atp_user:password@agent-trust-protocol-1-postgres-1:5432/atp_production',
  ssl: process.env.NODE_ENV === 'production',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
console.log('Using database connection string:', dbConfig.connectionString);

const storage = new AuditStorageService(dbConfig);
const ipfs = new IPFSService(process.env.IPFS_URL);
const auditService = new AuditService(storage, ipfs);
const auditController = new AuditController(auditService);

// Routes
app.post('/audit/log', (req, res) => auditController.logEvent(req, res));
app.get('/audit/event/:id', (req, res) => auditController.getEvent(req, res));
app.get('/audit/events', (req, res) => auditController.queryEvents(req, res));
app.get('/audit/integrity', (req, res) => auditController.verifyIntegrity(req, res));
app.get('/audit/stats', (req, res) => auditController.getStats(req, res));
app.get('/audit/ipfs/:hash', (req, res) => auditController.getEventFromIPFS(req, res));

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
    
    app.listen(port, () => {
      console.log(`Audit Logger Service running on port ${port}`);
      console.log('Agent Trust Protocol™ - Audit Logger Service v0.1.0');
    });
  } catch (error) {
    console.error('Failed to start Audit Logger Service:', error);
    process.exit(1);
  }
}

startServer();

export { AuditStorageService, IPFSService, AuditService, AuditController };