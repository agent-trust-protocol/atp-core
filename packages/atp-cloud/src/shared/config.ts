/**
 * ATP Cloud Configuration
 * Centralized configuration management for cloud services
 */

import { CloudConfig, CloudConfigSchema } from '../types/index.js';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: CloudConfig = {} as CloudConfig;

  private constructor() {
    this.loadConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): void {
    const config = {
      environment: process.env.NODE_ENV || 'development',
      services: {
        identity: {
          url: process.env.ATP_IDENTITY_SERVICE_URL || 'http://localhost:3001',
          port: parseInt(process.env.ATP_IDENTITY_SERVICE_PORT || '3001'),
          replicas: parseInt(process.env.ATP_IDENTITY_SERVICE_REPLICAS || '1')
        },
        credentials: {
          url: process.env.ATP_CREDENTIALS_SERVICE_URL || 'http://localhost:3002',
          port: parseInt(process.env.ATP_CREDENTIALS_SERVICE_PORT || '3002'),
          replicas: parseInt(process.env.ATP_CREDENTIALS_SERVICE_REPLICAS || '1')
        },
        permissions: {
          url: process.env.ATP_PERMISSIONS_SERVICE_URL || 'http://localhost:3003',
          port: parseInt(process.env.ATP_PERMISSIONS_SERVICE_PORT || '3003'),
          replicas: parseInt(process.env.ATP_PERMISSIONS_SERVICE_REPLICAS || '1')
        },
        audit: {
          url: process.env.ATP_AUDIT_SERVICE_URL || 'http://localhost:3006',
          port: parseInt(process.env.ATP_AUDIT_SERVICE_PORT || '3006'),
          replicas: parseInt(process.env.ATP_AUDIT_SERVICE_REPLICAS || '1')
        },
        monitoring: {
          url: process.env.ATP_MONITORING_SERVICE_URL || 'http://localhost:3007',
          port: parseInt(process.env.ATP_MONITORING_SERVICE_PORT || '3007'),
          replicas: parseInt(process.env.ATP_MONITORING_SERVICE_REPLICAS || '1')
        }
      },
      database: {
        mongodb: {
          url: process.env.MONGODB_URL || 'mongodb://localhost:27017',
          database: process.env.MONGODB_DATABASE || 'atp_cloud'
        },
        redis: {
          url: process.env.REDIS_URL || 'redis://localhost:6379',
          keyPrefix: process.env.REDIS_KEY_PREFIX || 'atp:cloud:'
        }
      },
      auth: {
        jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-here',
        apiKeyPrefix: process.env.API_KEY_PREFIX || 'atp_'
      },
      billing: {
        stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
      },
      limits: {
        defaultRateLimit: {
          requests: parseInt(process.env.DEFAULT_RATE_LIMIT_REQUESTS || '1000'),
          window: parseInt(process.env.DEFAULT_RATE_LIMIT_WINDOW || '3600')
        },
        maxTenants: parseInt(process.env.MAX_TENANTS || '1000'),
        maxApiKeysPerTenant: parseInt(process.env.MAX_API_KEYS_PER_TENANT || '10')
      }
    };

    // Validate configuration
    this.config = CloudConfigSchema.parse(config);
    
    // Security check for production
    if (this.config.environment === 'production') {
      if (this.config.auth.jwtSecret === 'your-jwt-secret-here') {
        throw new Error('JWT_SECRET must be set for production environment');
      }
      if (!this.config.billing.stripeSecretKey) {
        throw new Error('STRIPE_SECRET_KEY must be set for production environment');
      }
    }
  }

  public getConfig(): CloudConfig {
    return this.config;
  }

  public getServiceUrl(service: keyof CloudConfig['services']): string {
    return this.config.services[service].url;
  }

  public isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  public isProduction(): boolean {
    return this.config.environment === 'production';
  }

  public reload(): void {
    this.loadConfig();
  }
}

export const config = ConfigManager.getInstance();