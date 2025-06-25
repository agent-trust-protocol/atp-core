import express from 'express';
import cors from 'cors';
import { AuditStorageService } from './services/storage.js';
import { IPFSService } from './services/ipfs.js';
import { AuditService } from './services/audit.js';
import { AuditController } from './controllers/audit.js';

const app = express();
const port = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

// Initialize services
const storage = new AuditStorageService(process.env.DB_PATH || './audit.db');
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

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'audit-logger',
    version: '0.1.0',
    protocol: 'Agent Trust Protocol™',
  });
});

app.listen(port, () => {
  console.log(`Audit Logger Service running on port ${port}`);
  console.log('Agent Trust Protocol™ - Audit Logger Service v0.1.0');
});

export { AuditStorageService, IPFSService, AuditService, AuditController };