/**
 * ATP Configuration Profiles
 *
 * Ready-to-use ATP integration configurations
 */

import type { ATPConfig } from 'atp-sdk';

export class ATPConfigProfile {
  /**
   * Strict Development Configuration
   */
  static strictDev(baseUrl = 'http://localhost:3000'): ATPConfig {
    return {
      baseUrl,
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      auth: {},
      services: {
        identity: `${baseUrl}:3001`,
        credentials: `${baseUrl}:3002`,
        permissions: `${baseUrl}:3003`,
        audit: `${baseUrl}:3005`,
        gateway: `${baseUrl}:3000`
      },
      options: {
        enableQuantumSafe: true,
        enableMFA: false,
        auditLevel: 'standard',
        trustUpdateInterval: 60000, // 1 minute
        policyEnforcement: 'strict'
      }
    };
  }

  /**
   * Production Finance Configuration
   */
  static productionFinance(baseUrl: string, options?: {
    minTrust?: number;
    requireMFA?: boolean;
    auditLevel?: 'minimal' | 'standard' | 'full';
  }): ATPConfig {
    return {
      baseUrl,
      timeout: 10000, // Shorter timeout for finance
      retries: 5, // More retries for reliability
      retryDelay: 500,
      auth: {},
      services: {
        identity: process.env.ATP_IDENTITY_URL || `${baseUrl}:3001`,
        credentials: process.env.ATP_CREDENTIALS_URL || `${baseUrl}:3002`,
        permissions: process.env.ATP_PERMISSIONS_URL || `${baseUrl}:3003`,
        audit: process.env.ATP_AUDIT_URL || `${baseUrl}:3005`,
        gateway: process.env.ATP_GATEWAY_URL || `${baseUrl}:3000`
      },
      options: {
        enableQuantumSafe: true,
        enableMFA: options?.requireMFA ?? true,
        auditLevel: options?.auditLevel || 'full',
        trustUpdateInterval: 30000, // 30 seconds
        policyEnforcement: 'strict',
        minTrustScore: options?.minTrust || 0.95
      }
    };
  }

  /**
   * PII Workflow Configuration
   */
  static piiWorkflow(baseUrl: string, options?: {
    dataEncryption?: boolean;
    retentionDays?: number;
    compliance?: string[];
  }): ATPConfig {
    return {
      baseUrl,
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      auth: {},
      services: {
        identity: `${baseUrl}:3001`,
        credentials: `${baseUrl}:3002`,
        permissions: `${baseUrl}:3003`,
        audit: `${baseUrl}:3005`,
        gateway: `${baseUrl}:3000`
      },
      options: {
        enableQuantumSafe: true,
        enableMFA: true,
        auditLevel: 'full',
        trustUpdateInterval: 60000,
        policyEnforcement: 'strict',
        dataEncryption: options?.dataEncryption ?? true,
        retentionDays: options?.retentionDays || 90,
        compliance: options?.compliance || ['GDPR', 'CCPA'],
        enableDLP: true
      }
    };
  }
}
