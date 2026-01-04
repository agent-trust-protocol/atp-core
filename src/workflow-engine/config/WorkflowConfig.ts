import { z } from 'zod';

// Configuration schema validation
const workflowConfigSchema = z.object({
  // Database configuration
  database: z.object({
    host: z.string().default('localhost'),
    port: z.number().int().min(1).max(65535).default(5432),
    database: z.string().default('atp_workflows'),
    username: z.string().default('atp_user'),
    password: z.string().default(''),
    ssl: z.boolean().default(false),
    maxConnections: z.number().int().min(1).max(100).default(20),
    connectionTimeout: z.number().int().min(1000).max(60000).default(10000),
    url: z.string().optional(), // DATABASE_URL override
  }),
  
  // API Server configuration
  api: z.object({
    port: z.number().int().min(1).max(65535).default(3005),
    host: z.string().default('0.0.0.0'),
    cors: z.object({
      origin: z.union([z.string(), z.array(z.string())]).default('*'),
      credentials: z.boolean().default(true),
    }),
    rateLimit: z.object({
      windowMs: z.number().int().min(1000).default(900000), // 15 minutes
      max: z.number().int().min(1).default(100), // requests per window
      message: z.string().default('Too many requests'),
    }),
    security: z.object({
      requireApiKey: z.boolean().default(false),
      apiKey: z.string().optional(),
      enableHelmet: z.boolean().default(true),
      trustProxy: z.boolean().default(false),
    }),
  }),
  
  // Workflow execution configuration
  execution: z.object({
    maxConcurrentExecutions: z.number().int().min(1).max(1000).default(10),
    defaultTimeout: z.number().int().min(1000).max(3600000).default(300000), // 5 minutes
    maxExecutionTime: z.number().int().min(1000).max(7200000).default(1800000), // 30 minutes
    retryPolicy: z.object({
      maxRetries: z.number().int().min(0).max(10).default(3),
      retryDelay: z.number().int().min(100).max(60000).default(1000),
      backoffMultiplier: z.number().min(1).max(10).default(2),
    }),
    errorHandling: z.enum(['stop', 'continue', 'retry']).default('stop'),
  }),
  
  // Scheduler configuration
  scheduler: z.object({
    enabled: z.boolean().default(true),
    timezone: z.string().default('UTC'),
    maxScheduledWorkflows: z.number().int().min(1).max(10000).default(1000),
    checkInterval: z.number().int().min(1000).max(300000).default(60000), // 1 minute
  }),
  
  // Event service configuration
  events: z.object({
    enabled: z.boolean().default(true),
    maxQueueSize: z.number().int().min(100).max(100000).default(10000),
    processingInterval: z.number().int().min(100).max(60000).default(1000),
    maxHandlersPerEvent: z.number().int().min(1).max(100).default(10),
    enableWebSocket: z.boolean().default(false),
    websocketPort: z.number().int().min(1).max(65535).default(3002),
  }),
  
  // Logging configuration
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    format: z.enum(['json', 'simple']).default('simple'),
    file: z.object({
      enabled: z.boolean().default(false),
      filename: z.string().default('workflow-engine.log'),
      maxSize: z.string().default('10m'),
      maxFiles: z.number().int().min(1).max(100).default(5),
    }),
    console: z.object({
      enabled: z.boolean().default(true),
      colorize: z.boolean().default(true),
    }),
  }),
  
  // Monitoring and metrics
  monitoring: z.object({
    enabled: z.boolean().default(true),
    metricsPort: z.number().int().min(1).max(65535).default(9090),
    healthCheckInterval: z.number().int().min(1000).max(300000).default(30000),
    collectNodeMetrics: z.boolean().default(true),
    collectExecutionMetrics: z.boolean().default(true),
  }),
  
  // Security configuration
  security: z.object({
    enableAuditLog: z.boolean().default(true),
    sensitiveDataMasking: z.boolean().default(true),
    encryptionKey: z.string().optional(),
    sessionTimeout: z.number().int().min(300000).max(86400000).default(3600000), // 1 hour
  }),
  
  // Performance tuning
  performance: z.object({
    nodeExecutionPoolSize: z.number().int().min(1).max(100).default(10),
    cacheSize: z.number().int().min(100).max(100000).default(1000),
    cacheTtl: z.number().int().min(60000).max(86400000).default(3600000), // 1 hour
    enableCompression: z.boolean().default(true),
  }),
  
  // Feature flags
  features: z.object({
    enableAdvancedValidation: z.boolean().default(true),
    enableNodeCaching: z.boolean().default(true),
    enableAsyncExecution: z.boolean().default(true),
    enableWorkflowVersioning: z.boolean().default(false),
    enableWorkflowTemplates: z.boolean().default(true),
  }),
  
  // Environment-specific settings
  environment: z.enum(['development', 'testing', 'staging', 'production']).default('development'),
  
  // ATP-specific configuration
  atp: z.object({
    integration: z.object({
      enabled: z.boolean().default(true),
      policyServiceUrl: z.string().default('http://localhost:3000'),
      trustServiceUrl: z.string().default('http://localhost:3000'),
      agentServiceUrl: z.string().default('http://localhost:3000'),
    }),
    triggers: z.object({
      enablePolicyTriggers: z.boolean().default(true),
      enableTrustTriggers: z.boolean().default(true),
      enableSecurityTriggers: z.boolean().default(true),
      enableComplianceTriggers: z.boolean().default(true),
    }),
    notifications: z.object({
      defaultChannels: z.array(z.string()).default(['email']),
      escalationRules: z.object({
        criticalAlertTimeout: z.number().int().min(60000).default(300000), // 5 minutes
        highAlertTimeout: z.number().int().min(300000).default(900000), // 15 minutes
      }),
    }),
  }),
});

export type WorkflowConfig = z.infer<typeof workflowConfigSchema>;

export class ConfigManager {
  private static instance: ConfigManager;
  private config: WorkflowConfig;
  private configPath?: string;

  private constructor() {
    this.config = this.loadDefaultConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadDefaultConfig(): WorkflowConfig {
    const defaultConfig = {
      database: {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        database: process.env.DATABASE_NAME || 'atp_workflows',
        username: process.env.DATABASE_USER || 'atp_user',
        password: process.env.DATABASE_PASSWORD || '',
        ssl: process.env.DATABASE_SSL === 'true',
        maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20'),
        connectionTimeout: parseInt(process.env.DATABASE_TIMEOUT || '10000'),
        url: process.env.DATABASE_URL,
      },
      api: {
        port: parseInt(process.env.WORKFLOW_API_PORT || '3005'),
        host: process.env.WORKFLOW_API_HOST || '0.0.0.0',
        cors: {
          origin: process.env.CORS_ORIGIN || '*',
          credentials: process.env.CORS_CREDENTIALS === 'true',
        },
        rateLimit: {
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
          max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
          message: process.env.RATE_LIMIT_MESSAGE || 'Too many requests',
        },
        security: {
          requireApiKey: process.env.API_KEY_REQUIRED === 'true',
          apiKey: process.env.API_KEY,
          enableHelmet: process.env.ENABLE_HELMET !== 'false',
          trustProxy: process.env.TRUST_PROXY === 'true',
        },
      },
      execution: {
        maxConcurrentExecutions: parseInt(process.env.MAX_CONCURRENT_EXECUTIONS || '10'),
        defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT || '300000'),
        maxExecutionTime: parseInt(process.env.MAX_EXECUTION_TIME || '1800000'),
        retryPolicy: {
          maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
          retryDelay: parseInt(process.env.RETRY_DELAY || '1000'),
          backoffMultiplier: parseFloat(process.env.BACKOFF_MULTIPLIER || '2'),
        },
        errorHandling: (process.env.ERROR_HANDLING as any) || 'stop',
      },
      scheduler: {
        enabled: process.env.SCHEDULER_ENABLED !== 'false',
        timezone: process.env.SCHEDULER_TIMEZONE || 'UTC',
        maxScheduledWorkflows: parseInt(process.env.MAX_SCHEDULED_WORKFLOWS || '1000'),
        checkInterval: parseInt(process.env.SCHEDULER_CHECK_INTERVAL || '60000'),
      },
      events: {
        enabled: process.env.EVENTS_ENABLED !== 'false',
        maxQueueSize: parseInt(process.env.EVENT_QUEUE_SIZE || '10000'),
        processingInterval: parseInt(process.env.EVENT_PROCESSING_INTERVAL || '1000'),
        maxHandlersPerEvent: parseInt(process.env.MAX_HANDLERS_PER_EVENT || '10'),
        enableWebSocket: process.env.ENABLE_WEBSOCKET === 'true',
        websocketPort: parseInt(process.env.WEBSOCKET_PORT || '3002'),
      },
      logging: {
        level: (process.env.LOG_LEVEL as any) || 'info',
        format: (process.env.LOG_FORMAT as any) || 'simple',
        file: {
          enabled: process.env.LOG_FILE_ENABLED === 'true',
          filename: process.env.LOG_FILENAME || 'workflow-engine.log',
          maxSize: process.env.LOG_MAX_SIZE || '10m',
          maxFiles: parseInt(process.env.LOG_MAX_FILES || '5'),
        },
        console: {
          enabled: process.env.LOG_CONSOLE_ENABLED !== 'false',
          colorize: process.env.LOG_COLORIZE !== 'false',
        },
      },
      monitoring: {
        enabled: process.env.MONITORING_ENABLED !== 'false',
        metricsPort: parseInt(process.env.METRICS_PORT || '9090'),
        healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
        collectNodeMetrics: process.env.COLLECT_NODE_METRICS !== 'false',
        collectExecutionMetrics: process.env.COLLECT_EXECUTION_METRICS !== 'false',
      },
      security: {
        enableAuditLog: process.env.ENABLE_AUDIT_LOG !== 'false',
        sensitiveDataMasking: process.env.SENSITIVE_DATA_MASKING !== 'false',
        encryptionKey: process.env.ENCRYPTION_KEY,
        sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600000'),
      },
      performance: {
        nodeExecutionPoolSize: parseInt(process.env.NODE_EXECUTION_POOL_SIZE || '10'),
        cacheSize: parseInt(process.env.CACHE_SIZE || '1000'),
        cacheTtl: parseInt(process.env.CACHE_TTL || '3600000'),
        enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
      },
      features: {
        enableAdvancedValidation: process.env.ENABLE_ADVANCED_VALIDATION !== 'false',
        enableNodeCaching: process.env.ENABLE_NODE_CACHING !== 'false',
        enableAsyncExecution: process.env.ENABLE_ASYNC_EXECUTION !== 'false',
        enableWorkflowVersioning: process.env.ENABLE_WORKFLOW_VERSIONING === 'true',
        enableWorkflowTemplates: process.env.ENABLE_WORKFLOW_TEMPLATES !== 'false',
      },
      environment: (process.env.NODE_ENV as any) || 'development',
      atp: {
        integration: {
          enabled: process.env.ATP_INTEGRATION_ENABLED !== 'false',
          policyServiceUrl: process.env.ATP_POLICY_SERVICE_URL || 'http://localhost:3000',
          trustServiceUrl: process.env.ATP_TRUST_SERVICE_URL || 'http://localhost:3000',
          agentServiceUrl: process.env.ATP_AGENT_SERVICE_URL || 'http://localhost:3000',
        },
        triggers: {
          enablePolicyTriggers: process.env.ENABLE_POLICY_TRIGGERS !== 'false',
          enableTrustTriggers: process.env.ENABLE_TRUST_TRIGGERS !== 'false',
          enableSecurityTriggers: process.env.ENABLE_SECURITY_TRIGGERS !== 'false',
          enableComplianceTriggers: process.env.ENABLE_COMPLIANCE_TRIGGERS !== 'false',
        },
        notifications: {
          defaultChannels: (process.env.DEFAULT_NOTIFICATION_CHANNELS || 'email').split(','),
          escalationRules: {
            criticalAlertTimeout: parseInt(process.env.CRITICAL_ALERT_TIMEOUT || '300000'),
            highAlertTimeout: parseInt(process.env.HIGH_ALERT_TIMEOUT || '900000'),
          },
        },
      },
    };

    return workflowConfigSchema.parse(defaultConfig);
  }

  loadFromFile(configPath: string): void {
    try {
      this.configPath = configPath;
      const fs = require('fs');
      const configFile = fs.readFileSync(configPath, 'utf8');
      const fileConfig = JSON.parse(configFile);
      
      // Merge with current config
      const mergedConfig = this.mergeConfigs(this.config, fileConfig);
      this.config = workflowConfigSchema.parse(mergedConfig);
      
      console.log(`Configuration loaded from ${configPath}`);
    } catch (error) {
      console.error(`Failed to load configuration from ${configPath}:`, error);
      throw new Error(`Configuration loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  loadFromObject(configObject: Partial<WorkflowConfig>): void {
    try {
      const mergedConfig = this.mergeConfigs(this.config, configObject);
      this.config = workflowConfigSchema.parse(mergedConfig);
      console.log('Configuration loaded from object');
    } catch (error) {
      console.error('Failed to load configuration from object:', error);
      throw new Error(`Configuration loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private mergeConfigs(base: any, override: any): any {
    const result = { ...base };
    
    for (const key in override) {
      if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
        result[key] = this.mergeConfigs(result[key] || {}, override[key]);
      } else {
        result[key] = override[key];
      }
    }
    
    return result;
  }


  getDatabase() {
    return this.config.database;
  }

  getApi() {
    return this.config.api;
  }

  getExecution() {
    return this.config.execution;
  }

  getScheduler() {
    return this.config.scheduler;
  }

  getEvents() {
    return this.config.events;
  }

  getLogging() {
    return this.config.logging;
  }

  getMonitoring() {
    return this.config.monitoring;
  }

  getSecurity() {
    return this.config.security;
  }

  getPerformance() {
    return this.config.performance;
  }

  getFeatures() {
    return this.config.features;
  }

  getAtp() {
    return this.config.atp;
  }

  isProduction(): boolean {
    return this.config.environment === 'production';
  }

  isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  isTesting(): boolean {
    return this.config.environment === 'testing';
  }

  validate(): { isValid: boolean; errors: string[] } {
    try {
      workflowConfigSchema.parse(this.config);
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error']
      };
    }
  }

  exportToFile(outputPath: string): void {
    try {
      const fs = require('fs');
      const configJson = JSON.stringify(this.config, null, 2);
      fs.writeFileSync(outputPath, configJson, 'utf8');
      console.log(`Configuration exported to ${outputPath}`);
    } catch (error) {
      console.error(`Failed to export configuration to ${outputPath}:`, error);
      throw new Error(`Configuration export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  reset(): void {
    this.config = this.loadDefaultConfig();
    this.configPath = undefined;
    console.log('Configuration reset to defaults');
  }

  reload(): void {
    if (this.configPath) {
      this.loadFromFile(this.configPath);
    } else {
      this.config = this.loadDefaultConfig();
    }
    console.log('Configuration reloaded');
  }

  set(path: string, value: any): void {
    const keys = path.split('.');
    let current = this.config as any;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    
    // Validate after setting
    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(`Invalid configuration after setting ${path}: ${validation.errors.join(', ')}`);
    }
  }

  get(path?: string): any {
    if (!path) {
      return this.config;
    }
    const keys = path.split('.');
    let current = this.config as any;
    
    for (const key of keys) {
      if (current[key] === undefined) {
        return undefined;
      }
      current = current[key];
    }
    
    return current;
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();