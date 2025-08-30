/**
 * ATP Cloud Tenant Manager
 * Core tenant management functionality
 */

import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import { db } from '../shared/database.js';
import { auth } from '../shared/auth.js';
import { createServiceLogger } from '../shared/logger.js';
import { Tenant, TenantSchema, TenantError } from '../types/index.js';

const logger = createServiceLogger('tenant-manager');

export interface CreateTenantRequest {
  name: string;
  email: string;
  plan?: 'free' | 'starter' | 'professional' | 'enterprise';
  domain?: string;
}

export interface ListTenantsOptions {
  page: number;
  limit: number;
  status?: string;
  plan?: string;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions?: string[];
  expiresIn?: number; // Days
  rateLimit?: {
    requests: number;
    window: number;
  };
}

export class TenantManager {
  private readonly PLAN_LIMITS = {
    free: {
      maxAgents: 10,
      maxRequests: 5000,
      maxStorage: 100, // MB
      maxBandwidth: 1000, // MB
      apiKeysLimit: 3
    },
    starter: {
      maxAgents: 25,
      maxRequests: 25000,
      maxStorage: 5000, // MB
      maxBandwidth: 25000, // MB
      apiKeysLimit: 5
    },
    professional: {
      maxAgents: 100,
      maxRequests: 250000,
      maxStorage: 50000, // MB
      maxBandwidth: 250000, // MB
      apiKeysLimit: 15
    },
    enterprise: {
      maxAgents: 1000,
      maxRequests: 2500000,
      maxStorage: 500000, // MB
      maxBandwidth: 2500000, // MB
      apiKeysLimit: 50
    }
  };

  private readonly PLAN_PRICES = {
    free: 0,
    starter: 250, // $3,000/year
    professional: 1500, // $18,000/year
    enterprise: 4167 // $50,000/year minimum
  };

  /**
   * Create a new tenant
   */
  public async createTenant(request: CreateTenantRequest): Promise<Tenant> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    // Validate input
    if (!request.name || !request.email) {
      throw new TenantError('Name and email are required', '', 'INVALID_INPUT');
    }

    // Check if email already exists
    const existingTenant = await database.collection('tenants').findOne({
      'billing.email': request.email
    });

    if (existingTenant) {
      throw new TenantError('Email already registered', '', 'EMAIL_EXISTS');
    }

    // Check if domain already exists (if provided)
    if (request.domain) {
      const existingDomain = await database.collection('tenants').findOne({
        domain: request.domain
      });

      if (existingDomain) {
        throw new TenantError('Domain already registered', '', 'DOMAIN_EXISTS');
      }
    }

    const tenantId = nanoid(16);
    const plan = request.plan || 'free';
    const limits = this.PLAN_LIMITS[plan];

    // Create initial API key
    const initialApiKey = {
      id: nanoid(12),
      name: 'Default API Key',
      key: auth.generateApiKey(tenantId),
      permissions: ['*'],
      lastUsed: undefined,
      expiresAt: undefined,
      rateLimit: {
        requests: limits.maxRequests,
        window: 3600 // 1 hour
      }
    };

    const tenant: Tenant = {
      id: tenantId,
      name: request.name,
      domain: request.domain,
      plan,
      status: 'active',
      limits: {
        maxAgents: limits.maxAgents,
        maxRequests: limits.maxRequests,
        maxStorage: limits.maxStorage,
        maxBandwidth: limits.maxBandwidth
      },
      usage: {
        currentAgents: 0,
        currentRequests: 0,
        currentStorage: 0,
        currentBandwidth: 0
      },
      billing: {
        customerId: undefined,
        subscriptionId: undefined,
        planPrice: this.PLAN_PRICES[plan],
        currency: 'usd'
      },
      apiKeys: [initialApiKey],
      services: {
        identity: true,
        credentials: true,
        permissions: true,
        audit: true,
        monitoring: plan === 'professional' || plan === 'enterprise'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate with schema
    const validatedTenant = TenantSchema.parse(tenant);

    try {
      await database.collection('tenants').insertOne(validatedTenant);
      
      logger.info('Tenant created successfully', {
        tenantId,
        name: request.name,
        plan,
        email: request.email
      });

      return validatedTenant;
    } catch (error) {
      logger.error('Failed to create tenant', { error, tenantId });
      throw new TenantError('Failed to create tenant', tenantId, 'CREATION_FAILED');
    }
  }

  /**
   * Get tenant by ID
   */
  public async getTenant(tenantId: string): Promise<Tenant | null> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    try {
      const tenant = await database.collection('tenants').findOne({ id: tenantId });
      return tenant ? TenantSchema.parse(tenant) : null;
    } catch (error) {
      logger.error('Failed to get tenant', { error, tenantId });
      return null;
    }
  }

  /**
   * List tenants with pagination and filtering
   */
  public async listTenants(options: ListTenantsOptions): Promise<{
    tenants: Tenant[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    const { page, limit, status, plan } = options;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};
    if (status) filter.status = status;
    if (plan) filter.plan = plan;

    try {
      const [tenants, total] = await Promise.all([
        database.collection('tenants')
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        database.collection('tenants').countDocuments(filter)
      ]);

      const validatedTenants = tenants.map(t => TenantSchema.parse(t));

      return {
        tenants: validatedTenants,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Failed to list tenants', { error, options });
      throw error;
    }
  }

  /**
   * Update tenant
   */
  public async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    // Prevent updating certain fields
    const allowedUpdates = { ...updates };
    delete allowedUpdates.id;
    delete allowedUpdates.createdAt;
    delete allowedUpdates.apiKeys;

    allowedUpdates.updatedAt = new Date();

    try {
      const result = await database.collection('tenants').findOneAndUpdate(
        { id: tenantId },
        { $set: allowedUpdates },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new TenantError('Tenant not found', tenantId, 'NOT_FOUND');
      }

      logger.info('Tenant updated', { tenantId, updates: Object.keys(allowedUpdates) });
      return TenantSchema.parse(result);
    } catch (error) {
      logger.error('Failed to update tenant', { error, tenantId });
      throw error;
    }
  }

  /**
   * Suspend tenant
   */
  public async suspendTenant(tenantId: string, reason?: string): Promise<Tenant> {
    const updates = {
      status: 'suspended' as const,
      suspendedAt: new Date(),
      suspensionReason: reason
    };

    logger.warn('Tenant suspended', { tenantId, reason });
    return this.updateTenant(tenantId, updates);
  }

  /**
   * Activate tenant
   */
  public async activateTenant(tenantId: string): Promise<Tenant> {
    const updates = {
      status: 'active' as const,
      suspendedAt: null,
      suspensionReason: null
    };

    logger.info('Tenant activated', { tenantId });
    return this.updateTenant(tenantId, updates);
  }

  /**
   * Generate API key for tenant
   */
  public async generateApiKey(tenantId: string, request: CreateApiKeyRequest): Promise<{
    id: string;
    name: string;
    key: string;
    permissions: string[];
    expiresAt: Date | null;
    rateLimit: { requests: number; window: number };
  }> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new TenantError('Tenant not found', tenantId, 'NOT_FOUND');
    }

    const limits = this.PLAN_LIMITS[tenant.plan];

    // Check API key limit
    if (tenant.apiKeys.length >= limits.apiKeysLimit) {
      throw new TenantError(
        `API key limit reached (${limits.apiKeysLimit} keys maximum for ${tenant.plan} plan)`,
        tenantId,
        'API_KEY_LIMIT_EXCEEDED'
      );
    }

    const apiKey = {
      id: nanoid(12),
      name: request.name,
      key: auth.generateApiKey(tenantId),
      permissions: request.permissions || ['*'],
      lastUsed: undefined,
      expiresAt: request.expiresIn ? new Date(Date.now() + request.expiresIn * 24 * 60 * 60 * 1000) : null,
      rateLimit: request.rateLimit || {
        requests: limits.maxRequests,
        window: 3600
      }
    };

    try {
      await database.collection('tenants').updateOne(
        { id: tenantId },
        {
          $push: { apiKeys: apiKey } as any,
          $set: { updatedAt: new Date() }
        }
      );

      logger.info('API key generated', {
        tenantId,
        keyId: apiKey.id,
        keyName: request.name
      });

      return apiKey;
    } catch (error) {
      logger.error('Failed to generate API key', { error, tenantId });
      throw new TenantError('Failed to generate API key', tenantId, 'API_KEY_GENERATION_FAILED');
    }
  }

  /**
   * Revoke API key
   */
  public async revokeApiKey(tenantId: string, keyId: string): Promise<void> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new TenantError('Tenant not found', tenantId, 'NOT_FOUND');
    }

    // Prevent revoking the last API key
    if (tenant.apiKeys.length <= 1) {
      throw new TenantError('Cannot revoke the last API key', tenantId, 'LAST_API_KEY');
    }

    try {
      const result = await database.collection('tenants').updateOne(
        { id: tenantId },
        {
          $pull: { apiKeys: { id: keyId } } as any,
          $set: { updatedAt: new Date() }
        }
      );

      if (result.modifiedCount === 0) {
        throw new TenantError('API key not found', tenantId, 'API_KEY_NOT_FOUND');
      }

      logger.info('API key revoked', { tenantId, keyId });
    } catch (error) {
      logger.error('Failed to revoke API key', { error, tenantId, keyId });
      throw error;
    }
  }

  /**
   * Get tenant statistics
   */
  public async getTenantStats(): Promise<{
    totalTenants: number;
    activeTenantsCount: number;
    suspendedTenantsCount: number;
    planDistribution: Record<string, number>;
    recentTenants: Array<{ id: string; name: string; plan: string; createdAt: Date }>;
  }> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    try {
      const [
        totalTenants,
        activeTenantsCount,
        suspendedTenantsCount,
        planDistribution,
        recentTenants
      ] = await Promise.all([
        database.collection('tenants').countDocuments(),
        database.collection('tenants').countDocuments({ status: 'active' }),
        database.collection('tenants').countDocuments({ status: 'suspended' }),
        database.collection('tenants').aggregate([
          { $group: { _id: '$plan', count: { $sum: 1 } } }
        ]).toArray(),
        database.collection('tenants')
          .find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .project({ id: 1, name: 1, plan: 1, createdAt: 1 })
          .toArray() as Promise<Array<{ id: string; name: string; plan: string; createdAt: Date }>>
      ]);

      const planDistributionMap: Record<string, number> = {};
      planDistribution.forEach(item => {
        planDistributionMap[item._id] = item.count;
      });

      return {
        totalTenants,
        activeTenantsCount,
        suspendedTenantsCount,
        planDistribution: planDistributionMap,
        recentTenants
      };
    } catch (error) {
      logger.error('Failed to get tenant statistics', { error });
      throw error;
    }
  }
}