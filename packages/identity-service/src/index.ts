import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { StorageService } from './services/storage.js';
import { IdentityService } from './services/identity.js';
import { IdentityController } from './controllers/identity.js';
import { MFAController } from './controllers/mfa.js';
import { DatabaseConfig } from '@atp/shared';
import { Pool } from 'pg';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// SECURITY: SESSION_SECRET must be set in production
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV === 'production') {
  console.error('FATAL: SESSION_SECRET environment variable is required in production');
  process.exit(1);
}

// Session configuration for MFA setup
app.use(session({
  secret: sessionSecret || 'dev-only-session-secret-not-for-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 15 * 60 * 1000 // 15 minutes
  }
}));

// PostgreSQL configuration
const dbConfig: DatabaseConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://atp_user:password@localhost:5432/atp_production',
  ssl: process.env.NODE_ENV === 'production',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const storage = new StorageService(dbConfig);
const identityService = new IdentityService(storage);
const identityController = new IdentityController(identityService);

// Create database pool for MFA service
const pool = new Pool({
  connectionString: dbConfig.connectionString,
  ssl: dbConfig.ssl,
  max: dbConfig.max,
  idleTimeoutMillis: dbConfig.idleTimeoutMillis,
  connectionTimeoutMillis: dbConfig.connectionTimeoutMillis,
});

const mfaController = new MFAController(pool);

// API Endpoints: GET, POST, PUT operations for identity management

app.post('/identity/register', (req, res) => identityController.register(req, res));
app.get('/identity/:did', (req, res) => identityController.resolve(req, res));
app.get('/identity/:did/document', (req, res) => identityController.getDocument(req, res));
app.post('/identity/:did/rotate-keys', (req, res) => identityController.rotateKeys(req, res));
app.post('/identity/:did/trust-level', (req, res) => identityController.updateTrustLevel(req, res));
app.put('/identity/:did/trust-level', (req, res) => identityController.updateTrustLevel(req, res)); // PUT alternative
app.get('/identity/:did/trust-info', (req, res) => identityController.getTrustLevelInfo(req, res));
// GET /identity - List all identities  
app.get('/identity', (req, res) => identityController.list(req, res));
app.post('/identity', (req, res) => identityController.register(req, res)); // Alternative POST endpoint

// MFA Endpoints
app.post('/mfa/setup', (req, res) => mfaController.setupMFA(req, res));
app.post('/mfa/confirm', (req, res) => mfaController.confirmMFA(req, res));
app.post('/mfa/verify', (req, res) => mfaController.verifyMFA(req, res));
app.get('/mfa/status/:did', (req, res) => mfaController.getMFAStatus(req, res));
app.post('/mfa/disable', (req, res) => mfaController.disableMFA(req, res));
app.post('/mfa/backup-codes/regenerate', (req, res) => mfaController.regenerateBackupCodes(req, res));

app.get('/health', async (req, res) => {
  try {
    const dbHealth = await storage.healthCheck();
    res.json({ 
      status: dbHealth.healthy ? 'healthy' : 'unhealthy', 
      service: 'identity-service',
      database: dbHealth
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      service: 'identity-service',
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
      console.log(`Identity Service running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start Identity Service:', error);
    process.exit(1);
  }
}

startServer();

export { StorageService, IdentityService, IdentityController };