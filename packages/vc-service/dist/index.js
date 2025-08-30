import express from 'express';
import cors from 'cors';
import { StorageService } from './services/storage.js';
import { CredentialService } from './services/credential.js';
import { CredentialController } from './controllers/credential.js';
const app = express();
const port = process.env.PORT || 3002;
app.use(cors());
app.use(express.json());
// PostgreSQL configuration
const dbConfig = {
    connectionString: process.env.DATABASE_URL || 'postgresql://atp_user:password@localhost:5432/atp_production',
    ssl: process.env.NODE_ENV === 'production',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};
const storage = new StorageService(dbConfig);
const credentialService = new CredentialService(storage);
const credentialController = new CredentialController(credentialService);
app.post('/vc/issue', (req, res) => credentialController.issue(req, res));
app.post('/vc/verify', (req, res) => credentialController.verify(req, res));
app.post('/vc/revoke/:credentialId', (req, res) => credentialController.revoke(req, res));
app.post('/vc/schemas', (req, res) => credentialController.registerSchema(req, res));
app.get('/vc/schemas/:schemaId', (req, res) => credentialController.getSchema(req, res));
app.get('/vc/schemas', (req, res) => credentialController.listSchemas(req, res));
app.get('/health', async (req, res) => {
    try {
        const dbHealth = await storage.healthCheck();
        res.json({
            status: dbHealth.healthy ? 'healthy' : 'unhealthy',
            service: 'vc-service',
            database: dbHealth
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            service: 'vc-service',
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
            console.log(`VC Service running on port ${port}`);
        });
    }
    catch (error) {
        console.error('Failed to start VC Service:', error);
        process.exit(1);
    }
}
startServer();
export { StorageService, CredentialService, CredentialController };
