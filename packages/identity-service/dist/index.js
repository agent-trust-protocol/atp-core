import express from 'express';
import cors from 'cors';
import { StorageService } from './services/storage.js';
import { IdentityService } from './services/identity.js';
import { IdentityController } from './controllers/identity.js';
const app = express();
const port = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());
const storage = new StorageService(process.env.DB_PATH);
const identityService = new IdentityService(storage);
const identityController = new IdentityController(identityService);
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
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'identity-service' });
});
app.listen(port, () => {
    console.log(`Identity Service running on port ${port}`);
});
export { StorageService, IdentityService, IdentityController };
