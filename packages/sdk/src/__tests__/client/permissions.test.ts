/**
 * Tests for PermissionsClient
 */

import axios from 'axios';
import { PermissionsClient } from '../../client/permissions';
import { ATPConfig } from '../../types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PermissionsClient', () => {
  let client: PermissionsClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAxiosInstance = {
      request: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

    const config: ATPConfig = {
      baseUrl: 'http://localhost',
      services: { permissions: 'http://permissions-service:3003' }
    };

    client = new PermissionsClient(config);
  });

  describe('grantPermission', () => {
    it('should grant a permission', async () => {
      const mockGrant = {
        id: 'grant-123',
        subject: 'did:atp:agent',
        resource: 'api:endpoint',
        action: 'read'
      };
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockGrant }
      });

      const result = await client.grantPermission({
        subject: 'did:atp:agent',
        resource: 'api:endpoint',
        action: 'read'
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/permissions/grant',
        data: {
          subject: 'did:atp:agent',
          resource: 'api:endpoint',
          action: 'read'
        }
      });
      expect(result.data).toEqual(mockGrant);
    });

    it('should include optional conditions and metadata', async () => {
      mockAxiosInstance.request.mockResolvedValue({ data: { success: true } });

      await client.grantPermission({
        subject: 'did:atp:agent',
        resource: 'api:endpoint',
        action: 'write',
        conditions: { time: { before: '18:00' } },
        expiresAt: '2025-12-31T23:59:59Z',
        metadata: { reason: 'Project access' }
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            conditions: { time: { before: '18:00' } },
            expiresAt: '2025-12-31T23:59:59Z',
            metadata: { reason: 'Project access' }
          })
        })
      );
    });
  });

  describe('checkAccess', () => {
    it('should check if access is allowed', async () => {
      const mockResult = {
        allowed: true,
        appliedPolicies: ['policy-1'],
        grantId: 'grant-123'
      };
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockResult }
      });

      const result = await client.checkAccess({
        subject: 'did:atp:agent',
        resource: 'api:endpoint',
        action: 'read'
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/permissions/check',
        data: {
          subject: 'did:atp:agent',
          resource: 'api:endpoint',
          action: 'read'
        }
      });
      expect(result.data?.allowed).toBe(true);
    });

    it('should include optional context', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: { allowed: false, reason: 'Time restriction' } }
      });

      await client.checkAccess({
        subject: 'did:atp:agent',
        resource: 'api:endpoint',
        action: 'write',
        context: { time: '22:00', location: 'external' }
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            context: { time: '22:00', location: 'external' }
          })
        })
      );
    });
  });

  describe('revokePermission', () => {
    it('should revoke a permission grant', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: { success: true } }
      });

      const result = await client.revokePermission('grant-123', 'No longer needed');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/permissions/grant/grant-123',
        data: { reason: 'No longer needed' }
      });
      expect(result.data?.success).toBe(true);
    });
  });

  describe('getPermission', () => {
    it('should get permission by ID', async () => {
      const mockGrant = { id: 'grant-123', subject: 'did:atp:agent' };
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockGrant }
      });

      const result = await client.getPermission('grant-123');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/permissions/grant/grant-123',
        data: undefined
      });
      expect(result.data).toEqual(mockGrant);
    });
  });

  describe('queryPermissions', () => {
    it('should query permissions with filters', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: { grants: [], total: 0 } }
      });

      await client.queryPermissions({
        subject: 'did:atp:agent',
        resource: 'api:*',
        status: 'active'
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/permissions/grants',
          params: { subject: 'did:atp:agent', resource: 'api:*', status: 'active' }
        })
      );
    });
  });

  describe('getPermissionsForSubject', () => {
    it('should get permissions for a subject', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: { grants: [], total: 0 } }
      });

      await client.getPermissionsForSubject('did:atp:agent');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/permissions/subject/did%3Aatp%3Aagent'
        })
      );
    });

    it('should support filtering parameters', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: { grants: [], total: 0 } }
      });

      await client.getPermissionsForSubject('did:atp:agent', {
        resource: 'api:endpoint',
        action: 'read',
        limit: 10
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { resource: 'api:endpoint', action: 'read', limit: 10 }
        })
      );
    });
  });

  describe('getPermissionsForResource', () => {
    it('should get permissions for a resource', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: { grants: [], total: 0 } }
      });

      await client.getPermissionsForResource('api:endpoint');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/permissions/resource/api%3Aendpoint'
        })
      );
    });
  });

  describe('Policy Management', () => {
    describe('createPolicy', () => {
      it('should create a policy', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { policyId: 'policy-123' } }
        });

        const policy = {
          name: 'Read Access',
          effect: 'allow' as const,
          subjects: ['did:atp:*'],
          resources: ['api:public:*'],
          actions: ['read']
        };

        const result = await client.createPolicy(policy);

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/policies',
          data: policy
        });
        expect(result.data?.policyId).toBe('policy-123');
      });

      it('should include optional fields', async () => {
        mockAxiosInstance.request.mockResolvedValue({ data: { success: true } });

        await client.createPolicy({
          name: 'Admin Access',
          description: 'Full admin access policy',
          effect: 'allow',
          subjects: ['did:atp:admin'],
          resources: ['*'],
          actions: ['*'],
          conditions: { trustLevel: { gte: 'TRUSTED' } },
          priority: 100
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              description: 'Full admin access policy',
              conditions: { trustLevel: { gte: 'TRUSTED' } },
              priority: 100
            })
          })
        );
      });
    });

    describe('getPolicy', () => {
      it('should get policy by ID', async () => {
        const mockPolicy = { name: 'Test Policy', effect: 'allow' };
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: mockPolicy }
        });

        const result = await client.getPolicy('policy-123');

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'GET',
          url: '/policies/policy-123',
          data: undefined
        });
        expect(result.data).toEqual(mockPolicy);
      });
    });

    describe('updatePolicy', () => {
      it('should update a policy', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { name: 'Updated Policy' } }
        });

        await client.updatePolicy('policy-123', { name: 'Updated Policy', priority: 50 });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'PUT',
          url: '/policies/policy-123',
          data: { name: 'Updated Policy', priority: 50 }
        });
      });
    });

    describe('deletePolicy', () => {
      it('should delete a policy', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { success: true } }
        });

        const result = await client.deletePolicy('policy-123');

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'DELETE',
          url: '/policies/policy-123',
          data: undefined
        });
        expect(result.data?.success).toBe(true);
      });
    });

    describe('listPolicies', () => {
      it('should list all policies', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { policies: [], total: 0 } }
        });

        await client.listPolicies();

        expect(mockAxiosInstance.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'GET',
            url: '/policies'
          })
        );
      });

      it('should support filtering', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { policies: [], total: 0 } }
        });

        await client.listPolicies({ effect: 'deny', subject: 'did:atp:*' });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith(
          expect.objectContaining({
            params: { effect: 'deny', subject: 'did:atp:*' }
          })
        );
      });
    });

    describe('evaluatePolicies', () => {
      it('should evaluate policies for a request', async () => {
        const mockResult = {
          decision: 'allow',
          appliedPolicies: [{ policyId: 'policy-1', effect: 'allow', priority: 10 }],
          explanation: 'Matched allow policy'
        };
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: mockResult }
        });

        const result = await client.evaluatePolicies({
          subject: 'did:atp:agent',
          resource: 'api:endpoint',
          action: 'read'
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/policies/evaluate',
          data: {
            subject: 'did:atp:agent',
            resource: 'api:endpoint',
            action: 'read'
          }
        });
        expect(result.data?.decision).toBe('allow');
      });
    });
  });

  describe('Capability Tokens', () => {
    describe('issueCapabilityToken', () => {
      it('should issue a capability token', async () => {
        const mockToken = {
          id: 'token-123',
          subject: 'did:atp:agent',
          capabilities: ['read', 'write'],
          signature: 'sig123'
        };
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: mockToken }
        });

        const result = await client.issueCapabilityToken({
          subject: 'did:atp:agent',
          capabilities: ['read', 'write']
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/capabilities/issue',
          data: {
            subject: 'did:atp:agent',
            capabilities: ['read', 'write']
          }
        });
        expect(result.data).toEqual(mockToken);
      });

      it('should include restrictions and expiration', async () => {
        mockAxiosInstance.request.mockResolvedValue({ data: { success: true } });

        await client.issueCapabilityToken({
          subject: 'did:atp:agent',
          capabilities: ['read'],
          restrictions: { maxCalls: 100 },
          expiresAt: '2025-12-31T23:59:59Z'
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              restrictions: { maxCalls: 100 },
              expiresAt: '2025-12-31T23:59:59Z'
            })
          })
        );
      });
    });

    describe('verifyCapabilityToken', () => {
      it('should verify a capability token', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { valid: true, token: { id: 'token-123' } } }
        });

        const result = await client.verifyCapabilityToken('encoded-token-string');

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/capabilities/verify',
          data: { token: 'encoded-token-string' }
        });
        expect(result.data?.valid).toBe(true);
      });
    });

    describe('revokeCapabilityToken', () => {
      it('should revoke a capability token', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { success: true } }
        });

        const result = await client.revokeCapabilityToken('token-123');

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'DELETE',
          url: '/capabilities/token-123',
          data: undefined
        });
        expect(result.data?.success).toBe(true);
      });
    });

    describe('getCapabilityTokens', () => {
      it('should get capability tokens for a subject', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { tokens: [], total: 0 } }
        });

        await client.getCapabilityTokens('did:atp:agent');

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'GET',
          url: '/capabilities/subject/did%3Aatp%3Aagent',
          data: undefined
        });
      });
    });
  });

  describe('Permission Analytics', () => {
    describe('getPermissionStats', () => {
      it('should get permission statistics', async () => {
        const mockStats = {
          totalGrants: 100,
          activeGrants: 80,
          revokedGrants: 15,
          expiredGrants: 5,
          usageByAction: { read: 50, write: 30 },
          usageByResource: { 'api:endpoint': 40 }
        };
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: mockStats }
        });

        const result = await client.getPermissionStats();

        expect(mockAxiosInstance.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'GET',
            url: '/permissions/stats'
          })
        );
        expect(result.data?.totalGrants).toBe(100);
      });

      it('should support date range filtering', async () => {
        mockAxiosInstance.request.mockResolvedValue({ data: { success: true, data: {} } });

        await client.getPermissionStats({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          subject: 'did:atp:agent'
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith(
          expect.objectContaining({
            params: {
              startDate: '2024-01-01',
              endDate: '2024-12-31',
              subject: 'did:atp:agent'
            }
          })
        );
      });
    });

    describe('getAccessAuditTrail', () => {
      it('should get access audit trail', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { events: [], total: 0 } }
        });

        await client.getAccessAuditTrail({
          subject: 'did:atp:agent',
          startDate: '2024-01-01',
          limit: 50
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'GET',
            url: '/permissions/audit',
            params: { subject: 'did:atp:agent', startDate: '2024-01-01', limit: 50 }
          })
        );
      });
    });
  });

  describe('getHealth', () => {
    it('should check service health', async () => {
      const mockHealth = { status: 'healthy', service: 'permissions' };
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockHealth }
      });

      const result = await client.getHealth();

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/health',
        data: undefined
      });
      expect(result.data?.status).toBe('healthy');
    });
  });
});
