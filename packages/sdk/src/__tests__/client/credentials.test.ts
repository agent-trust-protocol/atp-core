/**
 * Tests for CredentialsClient
 */

import axios from 'axios';
import { CredentialsClient } from '../../client/credentials';
import { ATPConfig } from '../../types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CredentialsClient', () => {
  let client: CredentialsClient;
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
      services: { credentials: 'http://credentials-service:3002' }
    };

    client = new CredentialsClient(config);
  });

  describe('issueCredential', () => {
    it('should issue a new credential', async () => {
      const mockCredential = {
        id: 'cred-123',
        type: ['VerifiableCredential', 'TestCredential'],
        issuer: 'did:atp:issuer123',
        credentialSubject: { id: 'did:atp:subject456' }
      };
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockCredential }
      });

      const result = await client.issueCredential({
        subjectDID: 'did:atp:subject456',
        credentialType: 'TestCredential',
        claims: { name: 'Test Agent' }
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/credentials/issue',
        data: {
          subjectDID: 'did:atp:subject456',
          credentialType: 'TestCredential',
          claims: { name: 'Test Agent' }
        }
      });
      expect(result.data).toEqual(mockCredential);
    });

    it('should include optional expirationDate', async () => {
      mockAxiosInstance.request.mockResolvedValue({ data: { success: true } });

      await client.issueCredential({
        subjectDID: 'did:atp:subject456',
        credentialType: 'TestCredential',
        claims: {},
        expirationDate: '2025-12-31T23:59:59Z'
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ expirationDate: '2025-12-31T23:59:59Z' })
        })
      );
    });
  });

  describe('verifyCredential', () => {
    it('should verify a credential', async () => {
      const mockVerification = {
        valid: true,
        checks: {
          signature: true,
          expiration: true,
          revocation: true,
          schema: true
        }
      };
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockVerification }
      });

      const credential = { id: 'cred-123', type: ['VerifiableCredential'] } as any;
      const result = await client.verifyCredential({ credential });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/credentials/verify',
        data: { credential }
      });
      expect(result.data?.valid).toBe(true);
    });

    it('should include checkRevocation option', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: { valid: true } }
      });

      const credential = { id: 'cred-123' } as any;
      await client.verifyCredential({ credential, checkRevocation: true });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ checkRevocation: true })
        })
      );
    });
  });

  describe('revokeCredential', () => {
    it('should revoke a credential', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: { success: true } }
      });

      const result = await client.revokeCredential({
        credentialId: 'cred-123',
        reason: 'Compromised key'
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/credentials/revoke',
        data: {
          credentialId: 'cred-123',
          reason: 'Compromised key'
        }
      });
      expect(result.data?.success).toBe(true);
    });
  });

  describe('getCredential', () => {
    it('should get credential by ID', async () => {
      const mockCredential = { id: 'cred-123', type: ['VerifiableCredential'] };
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockCredential }
      });

      const result = await client.getCredential('cred-123');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/credentials/cred-123',
        data: undefined
      });
      expect(result.data).toEqual(mockCredential);
    });

    it('should encode special characters in credential ID', async () => {
      mockAxiosInstance.request.mockResolvedValue({ data: { success: true } });

      await client.getCredential('cred:special/chars');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/credentials/cred%3Aspecial%2Fchars'
        })
      );
    });
  });

  describe('queryCredentials', () => {
    it('should query credentials with filters', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: { credentials: [], total: 0 } }
      });

      await client.queryCredentials({
        subjectDID: 'did:atp:test',
        credentialType: 'TestCredential',
        status: 'active'
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/credentials',
          params: {
            subjectDID: 'did:atp:test',
            credentialType: 'TestCredential',
            status: 'active'
          }
        })
      );
    });

    it('should support pagination', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: { credentials: [], total: 100 } }
      });

      await client.queryCredentials({ limit: 10, offset: 20 });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { limit: 10, offset: 20 }
        })
      );
    });
  });

  describe('getCredentialsForDID', () => {
    it('should get credentials for a specific DID', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: { credentials: [], total: 0 } }
      });

      await client.getCredentialsForDID('did:atp:test123');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/credentials/holder/did%3Aatp%3Atest123'
        })
      );
    });

    it('should support filtering parameters', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: { credentials: [], total: 0 } }
      });

      await client.getCredentialsForDID('did:atp:test', {
        credentialType: 'TestCredential',
        status: 'active',
        limit: 10
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { credentialType: 'TestCredential', status: 'active', limit: 10 }
        })
      );
    });
  });

  describe('createPresentation', () => {
    it('should create a verifiable presentation', async () => {
      const mockPresentation = {
        id: 'pres-123',
        type: ['VerifiablePresentation'],
        verifiableCredential: [{ id: 'cred-123' }]
      };
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockPresentation }
      });

      const result = await client.createPresentation({
        credentialIds: ['cred-123', 'cred-456'],
        audience: 'did:atp:verifier'
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/presentations/create',
        data: {
          credentialIds: ['cred-123', 'cred-456'],
          audience: 'did:atp:verifier'
        }
      });
      expect(result.data).toEqual(mockPresentation);
    });

    it('should include optional challenge', async () => {
      mockAxiosInstance.request.mockResolvedValue({ data: { success: true } });

      await client.createPresentation({
        credentialIds: ['cred-123'],
        audience: 'did:atp:verifier',
        challenge: 'random-challenge-123'
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ challenge: 'random-challenge-123' })
        })
      );
    });
  });

  describe('verifyPresentation', () => {
    it('should verify a presentation', async () => {
      const mockResult = {
        valid: true,
        credentialResults: [{ credentialId: 'cred-123', valid: true }]
      };
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockResult }
      });

      const presentation = { id: 'pres-123', type: ['VerifiablePresentation'] } as any;
      const result = await client.verifyPresentation(presentation);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/presentations/verify',
        data: { presentation }
      });
      expect(result.data?.valid).toBe(true);
    });
  });

  describe('Schema Management', () => {
    describe('registerSchema', () => {
      it('should register a new schema', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { schemaId: 'schema-123' } }
        });

        const schema = {
          name: 'TestSchema',
          version: '1.0',
          properties: { name: { type: 'string' } },
          required: ['name']
        };

        const result = await client.registerSchema(schema);

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/schemas',
          data: schema
        });
        expect(result.data?.schemaId).toBe('schema-123');
      });
    });

    describe('getSchema', () => {
      it('should get schema by ID', async () => {
        const mockSchema = { name: 'TestSchema', version: '1.0', properties: {} };
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: mockSchema }
        });

        const result = await client.getSchema('schema-123');

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'GET',
          url: '/schemas/schema-123',
          data: undefined
        });
        expect(result.data).toEqual(mockSchema);
      });
    });

    describe('listSchemas', () => {
      it('should list all schemas', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { schemas: [], total: 0 } }
        });

        await client.listSchemas();

        expect(mockAxiosInstance.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'GET',
            url: '/schemas'
          })
        );
      });

      it('should support filtering', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { schemas: [], total: 0 } }
        });

        await client.listSchemas({ name: 'Test', version: '1.0', limit: 10 });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith(
          expect.objectContaining({
            params: { name: 'Test', version: '1.0', limit: 10 }
          })
        );
      });
    });

    describe('updateSchema', () => {
      it('should update a schema', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { schemaId: 'schema-123-v2' } }
        });

        const schema = { name: 'TestSchema', version: '2.0', properties: {} };
        await client.updateSchema('schema-123', schema);

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'PUT',
          url: '/schemas/schema-123',
          data: schema
        });
      });
    });
  });

  describe('Revocation Management', () => {
    describe('checkRevocationStatus', () => {
      it('should check revocation status', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { revoked: false } }
        });

        const result = await client.checkRevocationStatus('cred-123');

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'GET',
          url: '/credentials/cred-123/revocation-status',
          data: undefined
        });
        expect(result.data?.revoked).toBe(false);
      });

      it('should return revocation details if revoked', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: {
            success: true,
            data: {
              revoked: true,
              revokedAt: '2024-01-01T00:00:00Z',
              reason: 'Key compromised'
            }
          }
        });

        const result = await client.checkRevocationStatus('cred-456');
        expect(result.data?.revoked).toBe(true);
        expect(result.data?.reason).toBe('Key compromised');
      });
    });

    describe('getRevocationList', () => {
      it('should get revocation list for issuer', async () => {
        const mockList = {
          revokedCredentials: [
            { credentialId: 'cred-1', revokedAt: '2024-01-01', reason: 'Expired' }
          ]
        };
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: mockList }
        });

        const result = await client.getRevocationList('did:atp:issuer');

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'GET',
          url: '/revocation-list/did%3Aatp%3Aissuer',
          data: undefined
        });
        expect(result.data?.revokedCredentials).toHaveLength(1);
      });
    });
  });

  describe('Credential Templates', () => {
    describe('createFromTemplate', () => {
      it('should create credential from template', async () => {
        const mockCredential = { id: 'cred-new', type: ['VerifiableCredential'] };
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: mockCredential }
        });

        const result = await client.createFromTemplate('template-123', {
          subjectDID: 'did:atp:subject',
          claims: { role: 'admin' }
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/templates/template-123/issue',
          data: {
            subjectDID: 'did:atp:subject',
            claims: { role: 'admin' }
          }
        });
        expect(result.data).toEqual(mockCredential);
      });
    });

    describe('listTemplates', () => {
      it('should list available templates', async () => {
        const mockTemplates = [
          { id: 'tmpl-1', name: 'Test Template', description: 'A test', schema: {} }
        ];
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: mockTemplates }
        });

        const result = await client.listTemplates();

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'GET',
          url: '/templates',
          data: undefined
        });
        expect(result.data).toHaveLength(1);
      });
    });
  });

  describe('getHealth', () => {
    it('should check service health', async () => {
      const mockHealth = { status: 'healthy', service: 'credentials' };
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
