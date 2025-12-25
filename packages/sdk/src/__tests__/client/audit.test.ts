/**
 * Tests for AuditClient
 */

import axios from 'axios';
import { AuditClient } from '../../client/audit';
import { ATPConfig } from '../../types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AuditClient', () => {
  let client: AuditClient;
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
      services: { audit: 'http://audit-service:3004' }
    };

    client = new AuditClient(config);
  });

  describe('logEvent', () => {
    it('should log an audit event', async () => {
      const mockEvent = {
        id: 'event-123',
        source: 'sdk',
        action: 'create',
        resource: 'agent',
        timestamp: '2024-01-01T00:00:00Z'
      };
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockEvent }
      });

      const result = await client.logEvent({
        source: 'sdk',
        action: 'create',
        resource: 'agent'
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/audit/log',
        data: {
          source: 'sdk',
          action: 'create',
          resource: 'agent'
        }
      });
      expect(result.data).toEqual(mockEvent);
    });

    it('should include optional actor and details', async () => {
      mockAxiosInstance.request.mockResolvedValue({ data: { success: true } });

      await client.logEvent({
        source: 'sdk',
        action: 'update',
        resource: 'credential',
        actor: 'did:atp:agent123',
        details: { credentialId: 'cred-456', changes: ['status'] }
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actor: 'did:atp:agent123',
            details: { credentialId: 'cred-456', changes: ['status'] }
          })
        })
      );
    });
  });

  describe('getEvent', () => {
    it('should get audit event by ID', async () => {
      const mockEvent = {
        id: 'event-123',
        source: 'sdk',
        action: 'read',
        resource: 'identity'
      };
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockEvent }
      });

      const result = await client.getEvent('event-123');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/audit/event/event-123',
        data: undefined
      });
      expect(result.data).toEqual(mockEvent);
    });
  });

  describe('queryEvents', () => {
    it('should query events with filters', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: { events: [], total: 0 } }
      });

      await client.queryEvents({
        source: 'sdk',
        action: 'create',
        startTime: '2024-01-01T00:00:00Z',
        endTime: '2024-12-31T23:59:59Z'
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/audit/events',
          params: {
            source: 'sdk',
            action: 'create',
            startTime: '2024-01-01T00:00:00Z',
            endTime: '2024-12-31T23:59:59Z'
          }
        })
      );
    });

    it('should support pagination', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: { events: [], total: 100 } }
      });

      await client.queryEvents({ limit: 20, offset: 40 });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { limit: 20, offset: 40 }
        })
      );
    });
  });

  describe('verifyIntegrity', () => {
    it('should verify audit chain integrity', async () => {
      const mockVerification = {
        valid: true,
        totalEvents: 1000,
        verifiedEvents: 1000,
        chainHash: 'abc123'
      };
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockVerification }
      });

      const result = await client.verifyIntegrity();

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/audit/integrity',
        data: undefined
      });
      expect(result.data?.valid).toBe(true);
    });

    it('should return broken chain information', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          success: true,
          data: {
            valid: false,
            brokenAt: 'event-500',
            totalEvents: 1000,
            verifiedEvents: 500
          }
        }
      });

      const result = await client.verifyIntegrity();
      expect(result.data?.valid).toBe(false);
      expect(result.data?.brokenAt).toBe('event-500');
    });
  });

  describe('getStats', () => {
    it('should get audit statistics', async () => {
      const mockStats = {
        totalEvents: 5000,
        eventsBySource: { sdk: 3000, api: 2000 },
        eventsByAction: { create: 1000, read: 2500, update: 1000, delete: 500 },
        recentActivity: [],
        integrityStatus: 'valid'
      };
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockStats }
      });

      const result = await client.getStats();

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/audit/stats'
        })
      );
      expect(result.data?.totalEvents).toBe(5000);
    });

    it('should support date range and grouping', async () => {
      mockAxiosInstance.request.mockResolvedValue({ data: { success: true, data: {} } });

      await client.getStats({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        groupBy: 'day'
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { startDate: '2024-01-01', endDate: '2024-12-31', groupBy: 'day' }
        })
      );
    });
  });

  describe('getEventFromIPFS', () => {
    it('should get event from IPFS', async () => {
      const mockEvent = { id: 'event-123', ipfsHash: 'QmXyz' };
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockEvent }
      });

      const result = await client.getEventFromIPFS('QmXyz123');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/audit/ipfs/QmXyz123',
        data: undefined
      });
      expect(result.data).toEqual(mockEvent);
    });
  });

  describe('getResourceAuditTrail', () => {
    it('should get audit trail for a resource', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          success: true,
          data: {
            events: [],
            total: 0,
            summary: {
              firstEvent: '2024-01-01',
              lastEvent: '2024-06-01',
              uniqueActors: 5,
              actionCounts: {}
            }
          }
        }
      });

      await client.getResourceAuditTrail('credential:123');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/audit/resource/credential%3A123'
        })
      );
    });

    it('should support filtering parameters', async () => {
      mockAxiosInstance.request.mockResolvedValue({ data: { success: true, data: {} } });

      await client.getResourceAuditTrail('credential:123', {
        startDate: '2024-01-01',
        actions: ['create', 'update'],
        limit: 50
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { startDate: '2024-01-01', actions: ['create', 'update'], limit: 50 }
        })
      );
    });
  });

  describe('getActorAuditTrail', () => {
    it('should get audit trail for an actor', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: { events: [], total: 0 } }
      });

      await client.getActorAuditTrail('did:atp:agent123');

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/audit/actor/did%3Aatp%3Aagent123'
        })
      );
    });
  });

  describe('searchEvents', () => {
    it('should search events with advanced filters', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: {
          success: true,
          data: {
            events: [],
            total: 0,
            facets: { sources: {}, actions: {}, actors: {}, resources: {} }
          }
        }
      });

      await client.searchEvents({
        query: 'credential',
        filters: {
          sources: ['sdk'],
          actions: ['create', 'update'],
          hasSignature: true
        },
        dateRange: { start: '2024-01-01', end: '2024-12-31' },
        sort: { field: 'timestamp', order: 'desc' },
        limit: 100
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/audit/search',
        data: {
          query: 'credential',
          filters: {
            sources: ['sdk'],
            actions: ['create', 'update'],
            hasSignature: true
          },
          dateRange: { start: '2024-01-01', end: '2024-12-31' },
          sort: { field: 'timestamp', order: 'desc' },
          limit: 100
        }
      });
    });
  });

  describe('Blockchain Integration', () => {
    describe('getBlockchainAnchor', () => {
      it('should get blockchain anchor for an event', async () => {
        const mockAnchor = {
          eventId: 'event-123',
          blockIndex: 42,
          transactionId: 'tx-abc',
          merkleProof: ['proof1', 'proof2'],
          anchoredAt: '2024-01-01T00:00:00Z'
        };
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: mockAnchor }
        });

        const result = await client.getBlockchainAnchor('event-123');

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'GET',
          url: '/audit/blockchain/anchor/event-123',
          data: undefined
        });
        expect(result.data).toEqual(mockAnchor);
      });
    });

    describe('verifyBlockchainAnchor', () => {
      it('should verify a blockchain anchor', async () => {
        const anchor = {
          eventId: 'event-123',
          blockIndex: 42,
          transactionId: 'tx-abc',
          merkleProof: ['proof1'],
          anchoredAt: '2024-01-01'
        };
        mockAxiosInstance.request.mockResolvedValue({
          data: {
            success: true,
            data: { valid: true, blockchainHeight: 100, confirmations: 10 }
          }
        });

        const result = await client.verifyBlockchainAnchor(anchor);

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/audit/blockchain/verify',
          data: { anchor }
        });
        expect(result.data?.valid).toBe(true);
      });
    });

    describe('getBlockchainStats', () => {
      it('should get blockchain statistics', async () => {
        const mockStats = {
          totalBlocks: 1000,
          totalTransactions: 5000,
          totalAuditEvents: 10000,
          lastBlockTime: '2024-01-01T00:00:00Z',
          averageBlockTime: 10,
          chainHash: 'abc123',
          integrityStatus: 'valid'
        };
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: mockStats }
        });

        const result = await client.getBlockchainStats();

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'GET',
          url: '/audit/blockchain/stats',
          data: undefined
        });
        expect(result.data?.totalBlocks).toBe(1000);
      });
    });
  });

  describe('Compliance and Reporting', () => {
    describe('generateComplianceReport', () => {
      it('should generate a compliance report', async () => {
        const mockReport = {
          reportId: 'report-123',
          summary: {
            totalEvents: 1000,
            uniqueActors: 50,
            uniqueResources: 100,
            securityEvents: 10,
            integrityViolations: 0
          }
        };
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: mockReport }
        });

        const result = await client.generateComplianceReport({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          reportType: 'summary'
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/audit/compliance/report',
          data: {
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            reportType: 'summary'
          }
        });
        expect(result.data?.reportId).toBe('report-123');
      });

      it('should support different formats and filters', async () => {
        mockAxiosInstance.request.mockResolvedValue({ data: { success: true } });

        await client.generateComplianceReport({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          reportType: 'detailed',
          filters: { actors: ['did:atp:admin'], actions: ['delete'] },
          format: 'pdf'
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              reportType: 'detailed',
              filters: { actors: ['did:atp:admin'], actions: ['delete'] },
              format: 'pdf'
            })
          })
        );
      });
    });

    describe('exportAuditData', () => {
      it('should export audit data', async () => {
        const mockExport = {
          exportId: 'export-123',
          downloadUrl: 'https://storage/export-123.json',
          fileSize: 1024000,
          eventCount: 5000,
          expiresAt: '2024-01-08'
        };
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: mockExport }
        });

        const result = await client.exportAuditData({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          format: 'json'
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/audit/export',
          data: {
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            format: 'json'
          }
        });
        expect(result.data?.exportId).toBe('export-123');
      });
    });

    describe('getExportStatus', () => {
      it('should get export status', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: {
            success: true,
            data: { status: 'completed', downloadUrl: 'https://storage/file.json' }
          }
        });

        const result = await client.getExportStatus('export-123');

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'GET',
          url: '/audit/export/export-123/status',
          data: undefined
        });
        expect(result.data?.status).toBe('completed');
      });
    });
  });

  describe('Real-time Monitoring', () => {
    describe('getRecentEvents', () => {
      it('should get recent events', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: {
            success: true,
            data: { events: [], lastEventTime: '2024-01-01', hasMore: false }
          }
        });

        await client.getRecentEvents({ sources: ['sdk'], limit: 20 });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'GET',
            url: '/audit/recent',
            params: { sources: ['sdk'], limit: 20 }
          })
        );
      });
    });

    describe('getNotifications', () => {
      it('should get notifications', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { notifications: [], total: 0 } }
        });

        await client.getNotifications({ severity: 'high', acknowledged: false });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'GET',
            url: '/audit/notifications',
            params: { severity: 'high', acknowledged: false }
          })
        );
      });
    });

    describe('acknowledgeNotification', () => {
      it('should acknowledge a notification', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { success: true } }
        });

        const result = await client.acknowledgeNotification('notif-123');

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/audit/notifications/notif-123/acknowledge',
          data: undefined
        });
        expect(result.data?.success).toBe(true);
      });
    });
  });

  describe('getHealth', () => {
    it('should check service health', async () => {
      const mockHealth = {
        status: 'healthy',
        service: 'audit',
        database: { connected: true },
        ipfs: { connected: true, peerId: 'Qm...' },
        blockchain: { height: 1000, integrityStatus: 'valid' }
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
