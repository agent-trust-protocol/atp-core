/**
 * Visual Policy Storage Service Tests
 * 
 * Comprehensive test suite for the Visual Policy Storage Service
 * Tests CRUD operations, multi-tenancy, version control, audit logging,
 * and performance metrics.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { randomUUID } from 'crypto';
import {
  VisualPolicyStorageService,
  PolicySearchFilters,
  OrganizationSettings
} from '../visual-policy-storage.js';
import {
  ATPVisualPolicy,
  createAllowAllPolicyTemplate,
  createSecurityPolicyTemplate
} from '../visual-policy-schema.js';

// Mock database configuration
const mockDbConfig = {
  connectionString: 'postgresql://atp_user:test_password@localhost:5432/atp_test',
  ssl: false,
  max: 10
};

// Mock database client
class MockDatabaseClient {
  private data: Map<string, any[]> = new Map();
  
  async query(sql: string, params: any[] = []): Promise<{ rows: any[] }> {
    // Mock implementation for testing
    // In real tests, you would use a test database or more sophisticated mocking
    
    if (sql.includes('create_visual_policy')) {
      const policyId = params[0];
      return { rows: [{ create_visual_policy: policyId }] };
    }
    
    if (sql.includes('SELECT policy_document')) {
      // Mock policy retrieval
      const policyId = params[0];
      if (policyId === 'test-policy-1') {
        return {
          rows: [{
            policy_document: createAllowAllPolicyTemplate('org_test', 'did:atp:creator'),
            status: 'active',
            enabled: true
          }]
        };
      }
      return { rows: [] };
    }
    
    if (sql.includes('COUNT(*)')) {
      return { rows: [{ total: 5, count: 2 }] };
    }
    
    if (sql.includes('deploy_visual_policy')) {
      return { rows: [{ deploy_visual_policy: 'deploy_123456' }] };
    }
    
    if (sql.includes('visual_policy_deployments')) {
      return {
        rows: [{
          deployment_id: 'deploy_123456',
          policy_id: 'test-policy-1',
          version: '1.0.0',
          deployed_by: 'did:atp:deployer',
          deployed_at: new Date(),
          environment: 'production',
          gateway_instances: ['gateway-1', 'gateway-2'],
          status: 'active',
          rollback_reason: null
        }]
      };
    }
    
    if (sql.includes('visual_policy_metrics')) {
      return {
        rows: [{
          policy_id: 'test-policy-1',
          date: new Date(),
          evaluations_count: 100,
          allow_count: 80,
          deny_count: 15,
          throttle_count: 5,
          error_count: 0,
          avg_evaluation_time_ms: 2.5,
          max_evaluation_time_ms: 10.0,
          min_evaluation_time_ms: 1.0
        }]
      };
    }
    
    if (sql.includes('visual_policy_audit_log')) {
      return {
        rows: [{
          id: randomUUID(),
          policy_id: 'test-policy-1',
          timestamp: new Date(),
          action: 'created',
          actor: 'did:atp:creator',
          changes_json: null,
          reason: 'Policy created via API',
          ip_address: '192.168.1.100',
          user_agent: 'ATP-Client/1.0',
          session_id: 'session_123'
        }]
      };
    }
    
    if (sql.includes('visual_policy_org_settings')) {
      const orgId = params[0];
      if (orgId === 'org_test') {
        return {
          rows: [{
            organization_id: 'org_test',
            max_policies_per_org: 100,
            max_rules_per_policy: 50,
            require_approval_for_deployment: true,
            default_policy_category: 'operational',
            notify_on_policy_changes: true,
            notification_channels: ['email'],
            notification_recipients: ['admin@test.com'],
            audit_retention_days: 365,
            enable_detailed_logging: true
          }]
        };
      }
      return { rows: [] }; // Return empty for non-existent organizations
    }
    
    // Default empty response
    return { rows: [] };
  }
}

describe('Visual Policy Storage Service', () => {
  let storageService: VisualPolicyStorageService;
  let mockDb: MockDatabaseClient;
  
  beforeEach(() => {
    mockDb = new MockDatabaseClient();
    storageService = new VisualPolicyStorageService(mockDbConfig);
    // Replace the real database client with our mock
    (storageService as any).db = mockDb;
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe('Policy CRUD Operations', () => {
    describe('createPolicy', () => {
      it('should create a new policy successfully', async () => {
        const policy = createAllowAllPolicyTemplate('org_test', 'did:atp:creator');
        
        const policyId = await storageService.createPolicy(policy, 'did:atp:creator');
        
        expect(policyId).toBe(policy.id);
      });

      it('should validate policy before creation', async () => {
        const invalidPolicy = {
          name: 'Invalid Policy',
          // Missing required fields
        } as any;
        
        await expect(
          storageService.createPolicy(invalidPolicy, 'did:atp:creator')
        ).rejects.toThrow();
      });
    });

    describe('getPolicy', () => {
      it('should retrieve an existing policy', async () => {
        const policy = await storageService.getPolicy('test-policy-1');
        
        expect(policy).toBeTruthy();
        expect(policy?.name).toBe('Allow All Access');
      });

      it('should return null for non-existent policy', async () => {
        const policy = await storageService.getPolicy('non-existent');
        
        expect(policy).toBeNull();
      });

      it('should filter by organization ID', async () => {
        const policy = await storageService.getPolicy('test-policy-1', 'org_test');
        
        expect(policy).toBeTruthy();
      });
    });

    describe('updatePolicy', () => {
      it('should update an existing policy', async () => {
        const updates = {
          name: 'Updated Policy Name',
          description: 'Updated description'
        };
        
        await expect(
          storageService.updatePolicy('test-policy-1', updates, 'did:atp:updater')
        ).resolves.not.toThrow();
      });

      it('should throw error for non-existent policy', async () => {
        const updates = { name: 'Updated Name' };
        
        await expect(
          storageService.updatePolicy('non-existent', updates, 'did:atp:updater')
        ).rejects.toThrow('Policy not found');
      });
    });

    describe('deletePolicy', () => {
      it('should soft delete a policy', async () => {
        await expect(
          storageService.deletePolicy('test-policy-1', 'did:atp:deleter', 'No longer needed')
        ).resolves.not.toThrow();
      });
    });

    describe('searchPolicies', () => {
      it('should search policies with filters', async () => {
        const filters: PolicySearchFilters = {
          organizationId: 'org_test',
          status: 'active',
          limit: 10,
          offset: 0
        };
        
        const result = await storageService.searchPolicies(filters);
        
        expect(result).toHaveProperty('policies');
        expect(result).toHaveProperty('total');
        expect(result.total).toBe(5);
      });

      it('should handle empty search results', async () => {
        const filters: PolicySearchFilters = {
          organizationId: 'non-existent-org'
        };
        
        const result = await storageService.searchPolicies(filters);
        
        expect(result.policies).toHaveLength(0);
        expect(result.total).toBe(5); // Mock returns 5
      });
    });

    describe('togglePolicy', () => {
      it('should enable a policy', async () => {
        await expect(
          storageService.togglePolicy('test-policy-1', true, 'did:atp:admin')
        ).resolves.not.toThrow();
      });

      it('should disable a policy', async () => {
        await expect(
          storageService.togglePolicy('test-policy-1', false, 'did:atp:admin')
        ).resolves.not.toThrow();
      });
    });
  });

  describe('Policy Deployment Operations', () => {
    describe('deployPolicy', () => {
      it('should deploy a policy to production', async () => {
        const deploymentId = await storageService.deployPolicy(
          'test-policy-1',
          'did:atp:deployer',
          'production',
          ['gateway-1', 'gateway-2']
        );
        
        expect(deploymentId).toBe('deploy_123456');
      });

      it('should deploy to staging environment', async () => {
        const deploymentId = await storageService.deployPolicy(
          'test-policy-1',
          'did:atp:deployer',
          'staging'
        );
        
        expect(deploymentId).toBe('deploy_123456');
      });
    });

    describe('getDeploymentHistory', () => {
      it('should retrieve deployment history', async () => {
        const history = await storageService.getDeploymentHistory('test-policy-1');
        
        expect(history).toHaveLength(1);
        expect(history[0].deploymentId).toBe('deploy_123456');
        expect(history[0].environment).toBe('production');
        expect(history[0].status).toBe('active');
      });
    });
  });

  describe('Policy Metrics and Analytics', () => {
    describe('recordEvaluation', () => {
      it('should record policy evaluation metrics', async () => {
        await expect(
          storageService.recordEvaluation('test-policy-1', 'allow', 2.5)
        ).resolves.not.toThrow();
      });

      it('should record different action types', async () => {
        const actions: Array<'allow' | 'deny' | 'throttle' | 'error'> = ['allow', 'deny', 'throttle', 'error'];
        
        for (const action of actions) {
          await expect(
            storageService.recordEvaluation('test-policy-1', action, 1.0)
          ).resolves.not.toThrow();
        }
      });
    });

    describe('getPolicyMetrics', () => {
      it('should retrieve policy metrics for date range', async () => {
        const startDate = new Date('2025-01-01');
        const endDate = new Date('2025-01-31');
        
        const metrics = await storageService.getPolicyMetrics('test-policy-1', startDate, endDate);
        
        expect(metrics).toHaveLength(1);
        expect(metrics[0].policyId).toBe('test-policy-1');
        expect(metrics[0].evaluationsCount).toBe(100);
        expect(metrics[0].allowCount).toBe(80);
        expect(metrics[0].denyCount).toBe(15);
        expect(metrics[0].avgEvaluationTimeMs).toBe(2.5);
      });
    });
  });

  describe('Audit and Compliance', () => {
    describe('logAuditEvent', () => {
      it('should log audit events', async () => {
        const event = {
          policyId: 'test-policy-1',
          action: 'updated' as const,
          actor: 'did:atp:user',
          changes: { name: { from: 'Old Name', to: 'New Name' } },
          reason: 'Policy name update',
          ipAddress: '192.168.1.100',
          userAgent: 'ATP-Client/1.0'
        };
        
        await expect(
          storageService.logAuditEvent(event)
        ).resolves.not.toThrow();
      });
    });

    describe('getAuditTrail', () => {
      it('should retrieve audit trail for a policy', async () => {
        const auditTrail = await storageService.getAuditTrail('test-policy-1');
        
        expect(auditTrail).toHaveLength(1);
        expect(auditTrail[0].policyId).toBe('test-policy-1');
        expect(auditTrail[0].action).toBe('created');
        expect(auditTrail[0].actor).toBe('did:atp:creator');
      });

      it('should support pagination', async () => {
        const auditTrail = await storageService.getAuditTrail('test-policy-1', 50, 10);
        
        expect(auditTrail).toHaveLength(1);
      });
    });
  });

  describe('Organization Management', () => {
    describe('getOrganizationSettings', () => {
      it('should retrieve organization settings', async () => {
        const settings = await storageService.getOrganizationSettings('org_test');
        
        expect(settings).toBeTruthy();
        expect(settings?.organizationId).toBe('org_test');
        expect(settings?.maxPoliciesPerOrg).toBe(100);
        expect(settings?.requireApprovalForDeployment).toBe(true);
      });

      it('should return null for non-existent organization', async () => {
        const settings = await storageService.getOrganizationSettings('non-existent');
        
        expect(settings).toBeNull();
      });
    });

    describe('updateOrganizationSettings', () => {
      it('should update organization settings', async () => {
        const settings: OrganizationSettings = {
          organizationId: 'org_test',
          maxPoliciesPerOrg: 200,
          maxRulesPerPolicy: 100,
          requireApprovalForDeployment: false,
          defaultPolicyCategory: 'security',
          notifyOnPolicyChanges: true,
          notificationChannels: ['email', 'slack'],
          notificationRecipients: ['admin@test.com', '#security-alerts'],
          auditRetentionDays: 730,
          enableDetailedLogging: true
        };
        
        await expect(
          storageService.updateOrganizationSettings(settings)
        ).resolves.not.toThrow();
      });
    });
  });

  describe('Policy Templates', () => {
    describe('createFromTemplate', () => {
      it('should create policy from allow_all template', async () => {
        const policyId = await storageService.createFromTemplate(
          'allow_all',
          'org_test',
          'did:atp:creator'
        );
        
        expect(policyId).toBeTruthy();
      });

      it('should create policy from security template', async () => {
        const policyId = await storageService.createFromTemplate(
          'security',
          'org_test',
          'did:atp:creator'
        );
        
        expect(policyId).toBeTruthy();
      });

      it('should apply customizations to template', async () => {
        const customizations = {
          name: 'Custom Security Policy',
          description: 'Customized security policy for testing'
        };
        
        const policyId = await storageService.createFromTemplate(
          'security',
          'org_test',
          'did:atp:creator',
          customizations
        );
        
        expect(policyId).toBeTruthy();
      });

      it('should throw error for unknown template type', async () => {
        await expect(
          storageService.createFromTemplate(
            'unknown' as any,
            'org_test',
            'did:atp:creator'
          )
        ).rejects.toThrow('Unknown template type');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      const errorDb = {
        query: async () => {
          throw new Error('Database connection failed');
        }
      };
      
      (storageService as any).db = errorDb;
      
      await expect(
        storageService.getPolicy('test-policy-1')
      ).rejects.toThrow('Database connection failed');
    });

    it('should validate policy data before operations', async () => {
      const invalidPolicy = {
        // Missing required fields
        name: '',
        rules: []
      } as any;
      
      await expect(
        storageService.createPolicy(invalidPolicy, 'did:atp:creator')
      ).rejects.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large policy documents', async () => {
      const largePolicy = createAllowAllPolicyTemplate('org_test', 'did:atp:creator');
      
      // Add many rules to simulate large policy
      for (let i = 0; i < 100; i++) {
        largePolicy.rules.push({
          ...largePolicy.rules[0],
          id: randomUUID(),
          name: `Rule ${i}`,
          priority: i
        });
      }
      
      await expect(
        storageService.createPolicy(largePolicy, 'did:atp:creator')
      ).resolves.not.toThrow();
    });

    it('should handle concurrent operations', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          storageService.getPolicy('test-policy-1')
        );
      }
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result?.name).toBe('Allow All Access');
      });
    });
  });
});