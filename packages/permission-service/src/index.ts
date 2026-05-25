import express from 'express';
import cors from 'cors';
import { StorageService } from './services/storage.js';
import { PermissionService } from './services/permission.js';
import { PermissionController } from './controllers/permission.js';
import { DatabaseConfig, VisualPolicyStorageService, PolicyEvaluator, RedisCache, createCache, PerformanceOptimizer, createPerformanceOptimizer, requireServiceAuth, parseAllowedOrigins } from '@atp/shared';
import { PolicyController } from './controllers/policy.js';
import { PolicyEvaluationController } from './controllers/evaluation.js';
import { config } from './config.js';

const app = express();

const allowedOrigins = parseAllowedOrigins(config.ALLOWED_ORIGINS);
app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  credentials: false,
}));
app.use(express.json({ limit: '256kb' }));

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

const { JWT_SECRET: jwtSecret } = config;

const storage = new StorageService(dbConfig);
const visualPolicyStorage = new VisualPolicyStorageService(dbConfig);
const permissionService = new PermissionService(storage, jwtSecret);
const permissionController = new PermissionController(permissionService);
const policyController = new PolicyController(visualPolicyStorage, cache, performanceOptimizer);
const evaluationController = new PolicyEvaluationController(visualPolicyStorage);

// Auth gates. All mutating and listing routes require a valid service token.
// Mutations additionally require the `perm:admin` scope.
const readAuth = requireServiceAuth({ jwtSecret, requiredScopes: ['perm:read'] });
const writeAuth = requireServiceAuth({ jwtSecret, requiredScopes: ['perm:admin'] });
const evalAuth = requireServiceAuth({ jwtSecret, requiredScopes: ['perm:evaluate'] });

app.post('/perm/grant', writeAuth, (req, res) => permissionController.grant(req, res));
app.post('/perm/check', readAuth, (req, res) => permissionController.check(req, res));
app.post('/perm/validate', readAuth, (req, res) => permissionController.validateToken(req, res));
app.get('/perm/list/:did', readAuth, (req, res) => permissionController.list(req, res));
app.delete('/perm/revoke/:grantId', writeAuth, (req, res) => permissionController.revoke(req, res));

app.post('/perm/policy/rules', writeAuth, (req, res) => permissionController.addPolicyRule(req, res));
app.delete('/perm/policy/rules/:ruleId', writeAuth, (req, res) => permissionController.removePolicyRule(req, res));
app.get('/perm/policy/rules', readAuth, (req, res) => permissionController.listPolicyRules(req, res));

// Visual Policy CRUD
app.post('/policies', writeAuth, (req, res) => policyController.create(req, res));
app.get('/policies', readAuth, (req, res) => policyController.list(req, res));
app.get('/policies/:id', readAuth, (req, res) => policyController.get(req, res));
app.put('/policies/:id', writeAuth, (req, res) => policyController.update(req, res));
app.delete('/policies/:id', writeAuth, (req, res) => policyController.remove(req, res));

// Policy Evaluation endpoints
app.post('/policies/evaluate', evalAuth, (req, res) => evaluationController.evaluate(req, res));
app.post('/policies/simulate', evalAuth, (req, res) => evaluationController.simulate(req, res));

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