import express from 'express';
import cors from 'cors';
import { StorageService } from './services/storage.js';
import { PermissionService } from './services/permission.js';
import { PermissionController } from './controllers/permission.js';
import { DatabaseConfig, VisualPolicyStorageService, PolicyEvaluator, RedisCache, createCache, PerformanceOptimizer, createPerformanceOptimizer } from '@atp/shared';
import { PolicyController } from './controllers/policy.js';
import { PolicyEvaluationController } from './controllers/evaluation.js';

const app = express();
const port = process.env.PORT || 3003;
const secretKey = process.env.JWT_SECRET || 'atp-default-secret-key-change-in-production';

app.use(cors());
app.use(express.json());

// PostgreSQL configuration
const dbConfig: DatabaseConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://atp_user:password@localhost:5432/atp_production',
  ssl: process.env.NODE_ENV === 'production',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Redis Cache configuration
const cacheConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  keyPrefix: 'atp:permission',
  ttl: parseInt(process.env.CACHE_TTL || '300') // 5 minutes default
};

const cache = createCache(cacheConfig);
const performanceOptimizer = createPerformanceOptimizer(cache);

const storage = new StorageService(dbConfig);
const visualPolicyStorage = new VisualPolicyStorageService(dbConfig);
const permissionService = new PermissionService(storage, secretKey);
const permissionController = new PermissionController(permissionService);
const policyController = new PolicyController(visualPolicyStorage, cache, performanceOptimizer);
const evaluationController = new PolicyEvaluationController(visualPolicyStorage, cache, performanceOptimizer);

app.post('/perm/grant', (req, res) => permissionController.grant(req, res));
app.post('/perm/check', (req, res) => permissionController.check(req, res));
app.post('/perm/validate', (req, res) => permissionController.validateToken(req, res));
app.get('/perm/list/:did', (req, res) => permissionController.list(req, res));
app.delete('/perm/revoke/:grantId', (req, res) => permissionController.revoke(req, res));

app.post('/perm/policy/rules', (req, res) => permissionController.addPolicyRule(req, res));
app.delete('/perm/policy/rules/:ruleId', (req, res) => permissionController.removePolicyRule(req, res));
app.get('/perm/policy/rules', (req, res) => permissionController.listPolicyRules(req, res));

// Visual Policy CRUD
app.post('/policies', (req, res) => policyController.create(req, res));
app.get('/policies', (req, res) => policyController.list(req, res));
app.get('/policies/:id', (req, res) => policyController.get(req, res));
app.put('/policies/:id', (req, res) => policyController.update(req, res));
app.delete('/policies/:id', (req, res) => policyController.remove(req, res));

// Policy Evaluation endpoints
app.post('/policies/evaluate', (req, res) => evaluationController.evaluate(req, res));
app.post('/policies/simulate', (req, res) => evaluationController.simulate(req, res));

app.get('/health', async (req, res) => {
  try {
    const dbHealth = await storage.healthCheck();
    res.json({ 
      status: dbHealth.healthy ? 'healthy' : 'unhealthy', 
      service: 'permission-service',
      database: dbHealth
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      service: 'permission-service',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Initialize storage and start server
async function startServer() {
  try {
    await storage.initialize();
    await visualPolicyStorage.initialize();
    console.log('Database connection established');
    
    // Initialize with default policy rules
    await permissionService.loadPolicyRules();
    console.log('Policy rules loaded');
    
    app.listen(port, () => {
      console.log(`Permission Service running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start Permission Service:', error);
    process.exit(1);
  }
}

startServer();

export { StorageService, PermissionService, PermissionController };