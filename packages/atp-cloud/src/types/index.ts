/**
 * ATP Cloud Types
 * Shared TypeScript types for the multi-tenant cloud platform
 */

import { z } from 'zod';

// Tenant Management Types
export const TenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string().optional(),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']),
  status: z.enum(['active', 'suspended', 'pending', 'cancelled']),
  limits: z.object({
    maxAgents: z.number(),
    maxRequests: z.number(), // per month
    maxStorage: z.number(), // in MB
    maxBandwidth: z.number() // in MB per month
  }),
  usage: z.object({
    currentAgents: z.number(),
    currentRequests: z.number(),
    currentStorage: z.number(),
    currentBandwidth: z.number()
  }),
  billing: z.object({
    customerId: z.string().optional(),
    subscriptionId: z.string().optional(),
    planPrice: z.number(),
    currency: z.string().default('usd')
  }),
  apiKeys: z.array(z.object({
    id: z.string(),
    name: z.string(),
    key: z.string(),
    permissions: z.array(z.string()),
    lastUsed: z.date().optional(),
    expiresAt: z.date().optional(),
    rateLimit: z.object({
      requests: z.number(),
      window: z.number() // in seconds
    })
  })),
  services: z.object({
    identity: z.boolean().default(true),
    credentials: z.boolean().default(true),
    permissions: z.boolean().default(true),
    audit: z.boolean().default(true),
    monitoring: z.boolean().default(false)
  }),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Tenant = z.infer<typeof TenantSchema>;
export type TenantPlan = Tenant['plan'];
export type TenantStatus = Tenant['status'];

// Cloud Gateway Types
export const CloudRequestSchema = z.object({
  tenantId: z.string(),
  apiKey: z.string(),
  service: z.enum(['identity', 'credentials', 'permissions', 'audit', 'monitoring']),
  method: z.string(),
  path: z.string(),
  body: z.any().optional(),
  headers: z.record(z.string())
});

export type CloudRequest = z.infer<typeof CloudRequestSchema>;

// Usage Analytics Types
export const UsageEventSchema = z.object({
  tenantId: z.string(),
  eventType: z.enum(['api_request', 'agent_created', 'credential_issued', 'permission_checked']),
  service: z.string(),
  method: z.string(),
  path: z.string(),
  statusCode: z.number(),
  responseTime: z.number(), // in ms
  requestSize: z.number(), // in bytes
  responseSize: z.number(), // in bytes
  timestamp: z.date(),
  metadata: z.record(z.any()).optional()
});

export type UsageEvent = z.infer<typeof UsageEventSchema>;

// Billing Types
export const BillingEventSchema = z.object({
  tenantId: z.string(),
  eventType: z.enum(['usage_recorded', 'invoice_created', 'payment_processed', 'plan_changed']),
  amount: z.number(),
  currency: z.string(),
  description: z.string(),
  metadata: z.record(z.any()).optional(),
  timestamp: z.date()
});

export type BillingEvent = z.infer<typeof BillingEventSchema>;

// Service Health Types
export const ServiceHealthSchema = z.object({
  service: z.string(),
  status: z.enum(['healthy', 'degraded', 'down']),
  responseTime: z.number(),
  uptime: z.number(),
  version: z.string(),
  lastCheck: z.date(),
  errors: z.array(z.string())
});

export type ServiceHealth = z.infer<typeof ServiceHealthSchema>;

// Cloud Configuration Types
export const CloudConfigSchema = z.object({
  environment: z.enum(['development', 'staging', 'production']),
  services: z.object({
    identity: z.object({
      url: z.string(),
      port: z.number(),
      replicas: z.number().default(1)
    }),
    credentials: z.object({
      url: z.string(),
      port: z.number(),
      replicas: z.number().default(1)
    }),
    permissions: z.object({
      url: z.string(),
      port: z.number(),
      replicas: z.number().default(1)
    }),
    audit: z.object({
      url: z.string(),
      port: z.number(),
      replicas: z.number().default(1)
    }),
    monitoring: z.object({
      url: z.string(),
      port: z.number(),
      replicas: z.number().default(1)
    })
  }),
  database: z.object({
    mongodb: z.object({
      url: z.string(),
      database: z.string()
    }),
    redis: z.object({
      url: z.string(),
      keyPrefix: z.string().default('atp:cloud:')
    })
  }),
  auth: z.object({
    jwtSecret: z.string(),
    apiKeyPrefix: z.string().default('atp_')
  }),
  billing: z.object({
    stripeSecretKey: z.string(),
    webhookSecret: z.string()
  }),
  limits: z.object({
    defaultRateLimit: z.object({
      requests: z.number().default(1000),
      window: z.number().default(3600) // 1 hour
    }),
    maxTenants: z.number().default(1000),
    maxApiKeysPerTenant: z.number().default(10)
  })
});

export type CloudConfig = z.infer<typeof CloudConfigSchema>;

// Error Types
export class CloudError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public tenantId?: string
  ) {
    super(message);
    this.name = 'CloudError';
  }
}

export class TenantError extends CloudError {
  constructor(message: string, tenantId: string, code: string = 'TENANT_ERROR') {
    super(message, code, 400, tenantId);
    this.name = 'TenantError';
  }
}

export class RateLimitError extends CloudError {
  constructor(tenantId: string, limit: number, window: number) {
    super(`Rate limit exceeded: ${limit} requests per ${window} seconds`, 'RATE_LIMIT_EXCEEDED', 429, tenantId);
    this.name = 'RateLimitError';
  }
}

// Analytics Types
export interface UsageHistory {
  timestamp: Date;
  requests: number;
  bandwidth: number;
  responseTime: number;
  errorRate: number;
}

export interface ErrorMetrics {
  timestamp: Date;
  errors: number;
  rate: number;
}

export interface ServiceUsage {
  service: string;
  requests: number;
}

export interface MetricValue {
  timestamp: Date;
  value: number;
}

export interface PerformanceMetrics {
  latency: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
    trend: Array<{ timestamp: Date; value: number }>;
  };
  throughput: {
    requestsPerSecond: number;
    trend: Array<{ timestamp: Date; value: number }>;
  };
  availability: {
    percentage: number;
    downtime: number; // in minutes
    incidents: Array<{
      start: Date;
      end: Date;
      service: string;
      reason: string;
    }>;
  };
}