/**
 * Tests for IdentityClient
 */

import axios from 'axios';
import { IdentityClient } from '../../client/identity';
import { ATPConfig } from '../../types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('IdentityClient', () => {
  let client: IdentityClient;
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
      services: { identity: 'http://identity-service:3001' }
    };

    client = new IdentityClient(config);
  });

  describe('registerDID', () => {
    it('should register a new DID', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            did: 'did:atp:newagent123',
            document: { id: 'did:atp:newagent123' }
          }
        }
      };
      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await client.registerDID({
        publicKey: 'test-public-key',
        metadata: { name: 'TestBot' }
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/identity/register',
        data: {
          publicKey: 'test-public-key',
          metadata: { name: 'TestBot' }
        }
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should include optional trustLevel', async () => {
      mockAxiosInstance.request.mockResolvedValue({ data: { success: true } });

      await client.registerDID({
        publicKey: 'key',
        trustLevel: 'VERIFIED'
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ trustLevel: 'VERIFIED' })
        })
      );
    });
  });

  describe('resolveDID', () => {
    it('should resolve a DID', async () => {
      const mockAgent = {
        did: 'did:atp:test123',
        trustLevel: 'VERIFIED',
        publicKey: 'key'
      };
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockAgent }
      });

      const result = await client.resolveDID('did:atp:test123');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/identity/did%3Aatp%3Atest123',
        data: undefined
      });
      expect(result.data).toEqual(mockAgent);
    });

    it('should properly encode special characters in DID', async () => {
      mockAxiosInstance.request.mockResolvedValue({ data: { success: true } });

      await client.resolveDID('did:atp:special/chars:here');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/identity/did%3Aatp%3Aspecial%2Fchars%3Ahere'
        })
      );
    });
  });

  describe('getDIDDocument', () => {
    it('should get DID document', async () => {
      const mockDocument = {
        id: 'did:atp:test123',
        verificationMethod: [{ id: '#key-1', type: 'Ed25519' }]
      };
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockDocument }
      });

      const result = await client.getDIDDocument('did:atp:test123');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/identity/did%3Aatp%3Atest123/document',
        data: undefined
      });
      expect(result.data).toEqual(mockDocument);
    });
  });

  describe('updateTrustLevel', () => {
    it('should update trust level', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: { level: 'TRUSTED' } }
      });

      const result = await client.updateTrustLevel('did:atp:test123', {
        level: 'TRUSTED',
        justification: 'Passed verification'
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/identity/did%3Aatp%3Atest123/trust-level',
        data: {
          level: 'TRUSTED',
          justification: 'Passed verification'
        }
      });
      expect(result.data?.level).toBe('TRUSTED');
    });

    it('should include optional evidence', async () => {
      mockAxiosInstance.request.mockResolvedValue({ data: { success: true } });

      await client.updateTrustLevel('did:atp:test123', {
        level: 'PRIVILEGED',
        justification: 'Multiple verifications',
        evidence: [{ type: 'credential', id: 'cred-1' }]
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            evidence: [{ type: 'credential', id: 'cred-1' }]
          })
        })
      );
    });
  });

  describe('getTrustLevel', () => {
    it('should get trust level information', async () => {
      const mockTrustLevel = {
        level: 'VERIFIED',
        score: 0.75,
        lastUpdated: '2024-01-01'
      };
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockTrustLevel }
      });

      const result = await client.getTrustLevel('did:atp:test123');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/identity/did%3Aatp%3Atest123/trust-info',
        data: undefined
      });
      expect(result.data).toEqual(mockTrustLevel);
    });
  });

  describe('rotateKeys', () => {
    it('should rotate keys for a DID', async () => {
      const newKey = 'new-public-key';
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: { id: 'did:atp:test123' } }
      });

      await client.rotateKeys('did:atp:test123', newKey);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/identity/did%3Aatp%3Atest123/rotate-keys',
        data: { newPublicKey: newKey }
      });
    });
  });

  describe('listIdentities', () => {
    it('should list identities without params', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: { agents: [], total: 0 } }
      });

      await client.listIdentities();

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/identity',
        data: undefined,
        params: undefined
      });
    });

    it('should list identities with pagination', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: { agents: [{}], total: 100 } }
      });

      await client.listIdentities({ limit: 10, offset: 20 });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { limit: 10, offset: 20 }
        })
      );
    });

    it('should filter by trustLevel', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: { agents: [], total: 0 } }
      });

      await client.listIdentities({ trustLevel: 'VERIFIED' });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { trustLevel: 'VERIFIED' }
        })
      );
    });
  });

  describe('MFA Methods', () => {
    describe('setupMFA', () => {
      it('should setup TOTP MFA', async () => {
        const mockSetup = {
          secret: 'JBSWY3DPEHPK3PXP',
          qrCodeUrl: 'otpauth://...',
          backupCodes: ['123456', '789012']
        };
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: mockSetup }
        });

        const result = await client.setupMFA('did:atp:test123', {
          accountName: 'user@example.com',
          method: 'totp'
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/mfa/setup',
          data: {
            did: 'did:atp:test123',
            accountName: 'user@example.com',
            method: 'totp'
          }
        });
        expect(result.data).toEqual(mockSetup);
      });

      it('should setup hardware MFA', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true }
        });

        await client.setupMFA('did:atp:test123', {
          accountName: 'user@example.com',
          method: 'hardware'
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ method: 'hardware' })
          })
        );
      });
    });

    describe('confirmMFA', () => {
      it('should confirm MFA setup', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { backupCodes: ['111111', '222222'] } }
        });

        const result = await client.confirmMFA('did:atp:test123', '123456');

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/mfa/confirm',
          data: {
            did: 'did:atp:test123',
            verificationToken: '123456'
          }
        });
        expect(result.data?.backupCodes).toHaveLength(2);
      });
    });

    describe('verifyMFA', () => {
      it('should verify MFA with TOTP token', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { valid: true, method: 'totp' } }
        });

        const result = await client.verifyMFA('did:atp:test123', {
          token: '123456'
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/mfa/verify',
          data: {
            did: 'did:atp:test123',
            token: '123456'
          }
        });
        expect(result.data?.valid).toBe(true);
      });

      it('should verify MFA with backup code', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { valid: true } }
        });

        await client.verifyMFA('did:atp:test123', {
          backupCode: 'ABC123'
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ backupCode: 'ABC123' })
          })
        );
      });

      it('should verify MFA with hardware response', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { valid: true } }
        });

        await client.verifyMFA('did:atp:test123', {
          hardwareResponse: {
            signature: 'sig123',
            challenge: 'challenge456'
          }
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              hardwareResponse: { signature: 'sig123', challenge: 'challenge456' }
            })
          })
        );
      });
    });

    describe('getMFAStatus', () => {
      it('should get MFA status', async () => {
        const mockStatus = {
          enabled: true,
          methods: ['totp'],
          lastVerified: '2024-01-01T00:00:00Z'
        };
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: mockStatus }
        });

        const result = await client.getMFAStatus('did:atp:test123');

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'GET',
          url: '/mfa/status/did%3Aatp%3Atest123',
          data: undefined
        });
        expect(result.data).toEqual(mockStatus);
      });
    });

    describe('disableMFA', () => {
      it('should disable MFA', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { success: true } }
        });

        const result = await client.disableMFA('did:atp:test123', '123456');

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/mfa/disable',
          data: {
            did: 'did:atp:test123',
            verificationToken: '123456'
          }
        });
        expect(result.data?.success).toBe(true);
      });
    });

    describe('regenerateBackupCodes', () => {
      it('should regenerate backup codes', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { backupCodes: ['AAA', 'BBB', 'CCC'] } }
        });

        const result = await client.regenerateBackupCodes('did:atp:test123', '123456');

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/mfa/backup-codes/regenerate',
          data: {
            did: 'did:atp:test123',
            verificationToken: '123456'
          }
        });
        expect(result.data?.backupCodes).toHaveLength(3);
      });
    });
  });

  describe('getHealth', () => {
    it('should check service health', async () => {
      const mockHealth = {
        status: 'healthy',
        service: 'identity',
        database: { connected: true }
      };
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
