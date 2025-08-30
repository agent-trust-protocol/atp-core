/**
 * ATP Cloud Authentication
 * API key validation and JWT token management
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db } from './database.js';
import { config } from './config.js';
import { logger, createTenantLogger } from './logger.js';
import { TenantError } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  tenant?: {
    id: string;
    name: string;
    plan: string;
    status: string;
    apiKey: string;
  };
}

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Validate API key and get tenant information
   */
  public async validateApiKey(apiKey: string): Promise<any> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    try {
      const tenant = await database.collection('tenants').findOne({
        'apiKeys.key': apiKey,
        status: 'active'
      });

      if (!tenant) {
        throw new TenantError('Invalid or inactive API key', '', 'INVALID_API_KEY');
      }

      // Find the specific API key
      const apiKeyData = tenant.apiKeys.find((key: any) => key.key === apiKey);
      if (!apiKeyData) {
        throw new TenantError('API key not found', tenant.id, 'API_KEY_NOT_FOUND');
      }

      // Check if API key is expired
      if (apiKeyData.expiresAt && new Date(apiKeyData.expiresAt) < new Date()) {
        throw new TenantError('API key expired', tenant.id, 'API_KEY_EXPIRED');
      }

      // Update last used timestamp
      await database.collection('tenants').updateOne(
        { id: tenant.id, 'apiKeys.key': apiKey },
        { $set: { 'apiKeys.$.lastUsed': new Date() } }
      );

      return {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          plan: tenant.plan,
          status: tenant.status,
          limits: tenant.limits,
          usage: tenant.usage,
          services: tenant.services
        },
        apiKey: apiKeyData
      };
    } catch (error) {
      logger.error('API key validation failed', { apiKey: apiKey.substring(0, 10) + '...', error });
      throw error;
    }
  }

  /**
   * Generate JWT token for authenticated sessions
   */
  public generateToken(payload: any, expiresIn: string = '1h'): string {
    const cloudConfig = config.getConfig();
    return jwt.sign(payload, cloudConfig.auth.jwtSecret, { expiresIn } as jwt.SignOptions);
  }

  /**
   * Verify JWT token
   */
  public verifyToken(token: string): any {
    const cloudConfig = config.getConfig();
    try {
      return jwt.verify(token, cloudConfig.auth.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Generate API key
   */
  public generateApiKey(tenantId: string): string {
    const cloudConfig = config.getConfig();
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    const tenantPrefix = tenantId.substring(0, 4);
    return `${cloudConfig.auth.apiKeyPrefix}${tenantPrefix}_${timestamp}_${random}`;
  }
}

/**
 * Express middleware to authenticate API requests
 */
export const authenticateApiKey = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.header('x-api-key') || req.header('authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      res.status(401).json({
        error: 'API key required',
        code: 'MISSING_API_KEY'
      });
      return;
    }

    const authService = AuthService.getInstance();
    const authData = await authService.validateApiKey(apiKey);
    
    req.tenant = {
      id: authData.tenant.id,
      name: authData.tenant.name,
      plan: authData.tenant.plan,
      status: authData.tenant.status,
      apiKey: authData.apiKey.key
    };

    // Add tenant-specific logger to request
    (req as any).logger = createTenantLogger('cloud-gateway', authData.tenant.id);

    next();
  } catch (error: any) {
    logger.error('Authentication failed', { error: error.message });
    
    if (error instanceof TenantError) {
      res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
    } else {
      res.status(401).json({
        error: 'Authentication failed',
        code: 'AUTH_FAILED'
      });
    }
  }
};

/**
 * Express middleware to authenticate JWT tokens
 */
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.header('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({
        error: 'Token required',
        code: 'MISSING_TOKEN'
      });
      return;
    }

    const authService = AuthService.getInstance();
    const payload = authService.verifyToken(token);
    
    (req as any).user = payload;
    next();
  } catch (error: any) {
    logger.error('Token authentication failed', { error: error.message });
    res.status(401).json({
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
};

export const auth = AuthService.getInstance();