import express from 'express';
import cors from 'cors';
import { StorageService } from './services/storage.js';
import { PermissionService } from './services/permission.js';
import { PermissionController } from './controllers/permission.js';
import { DatabaseConfig, VisualPolicyStorageService, PolicyEvaluator, RedisCache, createCache, PerformanceOptimizer, createPerformanceOptimizer } from '@atp/shared';
import { PolicyController } from './controllers/policy.js';
import { PolicyEvaluationController } from './controllers/evaluation.js';
import { config } from './config.js';

const app = express();

app.use(cors());
app.use(express.json());

// PostgreSQL configuration
const dbConfig: DatabaseConfig = {
  connectionString: config.DATABASE_URL,
  ssl: config.NODE_ENV === 'production',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Redis Cache configuration
const cacheConfig = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
  db: config.REDIS_DB,
  keyPrefix: 'atp:permission',
  ttl: config.CACHE_TTL,
};

const cache = createCache(cacheConfig);
const performanceOptimizer = createPerformanceOptimizer(cache);

const jwtSecret = config.JWT_SECRET || 'dev-only-secret-not-for-production';

const storage = new StorageService(dbConfig);
const visualPolicyStorage = new VisualPolicyStorageService(dbConfig);
const permissionService = new PermissionService(storage, jwtSecret);
const permissionController = new PermissionController(permissionService);
const policyController = new PolicyController(visualPolicyStorage, cache, performanceOptimizer);
const evaluationController = new PolicyEvaluationController(visualPolicyStorage);

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
    
    app.listen(config.PORT, () => {
      console.log(`Permission Service running on port ${config.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start Permission Service:', error);
    process.exit(1);
  }
}

startServer();

export { StorageService, PermissionService, PermissionController };