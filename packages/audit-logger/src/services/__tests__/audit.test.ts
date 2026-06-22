import { AuditService } from '../audit.js';
import { AuditEvent, AuditEventRequest } from '../../models/audit.js';
import { IAuditStorageService } from '../../interfaces/storage.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

const makeEvent = (overrides: Partial<AuditEvent> = {}): AuditEvent => ({
  id: 'evt-1',
  timestamp: new Date().toISOString(),
  source: 'identity-service',
  action: 'did:register',
  resource: 'did:atp:abc123',
  hash: 'a'.repeat(64),
  previousHash: '0'.repeat(64),
  blockNumber: 1,
  nonce: 'nonce-1',
  ...overrides,
});

const makeRequest = (overrides: Partial<AuditEventRequest> = {}): AuditEventRequest => ({
  source: 'identity-service',
  action: 'did:register',
  resource: 'did:atp:test',
  actor: 'did:atp:admin',
  ...overrides,
});

const makeStorageMock = (lastEvent: AuditEvent | null = null) => {
  const events = new Map<string, AuditEvent>();
  let _lastEvent = lastEvent;

  return {
    storeEvent: jest.fn(async (evt: AuditEvent) => {
      events.set(evt.id, evt);
      _lastEvent = evt;
    }),
    getEvent: jest.fn(async (id: string) => events.get(id) ?? null),
    queryEvents: jest.fn(async (query: any) => {
      const all = Array.from(events.values());
      return { events: all, total: all.length };
    }),
    getLastEvent: jest.fn(async () => _lastEvent),
    verifyChain: jest.fn(async () => ({ valid: true })),
    close: jest.fn(),
    _events: events,
  };
};

const makeIPFSMock = () => ({
  storeEvent: jest.fn(async () => 'QmFakeIPFSHash'),
  retrieveEvent: jest.fn(async () => null),
  isAvailable: jest.fn(async () => false),
});

// ─── tests ────────────────────────────────────────────────────────────────────

describe('AuditService', () => {
  let service: AuditService;
  let storage: ReturnType<typeof makeStorageMock>;
  let ipfs: ReturnType<typeof makeIPFSMock>;

  beforeEach(() => {
    storage = makeStorageMock();
    ipfs = makeIPFSMock();
    service = new AuditService(storage as any, ipfs as any);
  });

  describe('logEvent', () => {
    it('returns an AuditEvent with required fields', async () => {
      const event = await service.logEvent(makeRequest());

      expect(event.id).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(event.hash).toBeDefined();
      expect(event.source).toBe('identity-service');
      expect(event.action).toBe('did:register');
    });

    it('stores the event in storage', async () => {
      await service.logEvent(makeRequest());
      expect(storage.storeEvent).toHaveBeenCalledTimes(1);
    });

    it('starts block chain at block 1 when no previous event exists', async () => {
      const event = await service.logEvent(makeRequest());
      expect(event.blockNumber).toBe(1);
    });

    it('increments blockNumber from the last event', async () => {
      const prev = makeEvent({ blockNumber: 5, hash: 'b'.repeat(64) });
      storage = makeStorageMock(prev);
      service = new AuditService(storage as any, ipfs as any);

      const event = await service.logEvent(makeRequest());
      expect(event.blockNumber).toBe(6);
    });

    it('sets previousHash to last event hash', async () => {
      const prevHash = 'deadbeef'.repeat(8);
      const prev = makeEvent({ hash: prevHash, blockNumber: 1 });
      storage = makeStorageMock(prev);
      service = new AuditService(storage as any, ipfs as any);

      const event = await service.logEvent(makeRequest());
      expect(event.previousHash).toBe(prevHash);
    });

    it('uses genesis hash (64 zeros) when no previous event', async () => {
      const event = await service.logEvent(makeRequest());
      expect(event.previousHash).toBe('0'.repeat(64));
    });

    it('generates a 64-character hex hash', async () => {
      const event = await service.logEvent(makeRequest());
      expect(event.hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('generates unique hashes for different events', async () => {
      const e1 = await service.logEvent(makeRequest({ action: 'action:one' }));

      // Reset last event
      storage = makeStorageMock(e1);
      service = new AuditService(storage as any, ipfs as any);

      const e2 = await service.logEvent(makeRequest({ action: 'action:two' }));
      expect(e1.hash).not.toBe(e2.hash);
    });

    it('includes a nonce for replay protection', async () => {
      const e1 = await service.logEvent(makeRequest());
      const e2 = await service.logEvent(makeRequest());
      expect(e1.nonce).not.toBe(e2.nonce);
    });

    it('preserves actor and details on the stored event', async () => {
      const event = await service.logEvent(
        makeRequest({ actor: 'did:atp:user1', details: { reason: 'test' } })
      );

      expect(event.actor).toBe('did:atp:user1');
      expect(event.details).toEqual({ reason: 'test' });
    });
  });

  describe('getEvent', () => {
    it('returns null for unknown id', async () => {
      const result = await service.getEvent('nonexistent');
      expect(result).toBeNull();
    });

    it('returns the event after it is logged', async () => {
      const logged = await service.logEvent(makeRequest());
      storage.getEvent.mockResolvedValueOnce(logged);

      const fetched = await service.getEvent(logged.id);
      expect(fetched?.id).toBe(logged.id);
    });
  });

  describe('queryEvents', () => {
    it('returns empty list when no events exist', async () => {
      const result = await service.queryEvents({});
      expect(result.events).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('returns events after logging', async () => {
      await service.logEvent(makeRequest());
      await service.logEvent(makeRequest({ action: 'did:resolve' }));

      const result = await service.queryEvents({});
      expect(result.events).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('passes query filters to storage', async () => {
      const query = { source: 'identity-service', limit: 10 };
      await service.queryEvents(query);
      expect(storage.queryEvents).toHaveBeenCalledWith(query);
    });
  });

  describe('verifyIntegrity', () => {
    it('returns valid: true when chain is intact', async () => {
      const result = await service.verifyIntegrity();
      expect(result.valid).toBe(true);
    });

    it('returns valid: false when a stored event has been tampered', async () => {
      // verifyIntegrity performs its own content verification (it does not trust
      // storage.verifyChain), so tampering a stored event's content must break it.
      const event = await service.logEvent(makeRequest());
      const stored = storage._events.get(event.id)!;
      stored.action = 'action:TAMPERED';

      const result = await service.verifyIntegrity();
      expect(result.valid).toBe(false);
      expect((result as any).brokenAt).toBe(event.id);
    });
  });

  describe('hash chain integrity', () => {
    it('two consecutive events form a valid chain link', async () => {
      const e1 = await service.logEvent(makeRequest({ action: 'step:1' }));

      storage = makeStorageMock(e1);
      service = new AuditService(storage as any, ipfs as any);

      const e2 = await service.logEvent(makeRequest({ action: 'step:2' }));

      expect(e2.previousHash).toBe(e1.hash);
      expect(e2.blockNumber).toBe((e1.blockNumber ?? 0) + 1);
    });
  });

  describe('getStats', () => {
    it('returns stats with zero counts when no events', async () => {
      const stats = await service.getStats();
      expect(stats.totalEvents).toBe(0);
      expect(stats.eventsBySource).toEqual({});
      expect(stats.eventsByAction).toEqual({});
    });

    it('correctly aggregates events by source and action', async () => {
      storage.queryEvents.mockResolvedValueOnce({
        events: [
          makeEvent({ source: 'svc-a', action: 'create' }),
          makeEvent({ source: 'svc-a', action: 'delete' }),
          makeEvent({ source: 'svc-b', action: 'create' }),
        ],
        total: 3,
      });

      const stats = await service.getStats();
      expect(stats.eventsBySource['svc-a']).toBe(2);
      expect(stats.eventsBySource['svc-b']).toBe(1);
      expect(stats.eventsByAction['create']).toBe(2);
      expect(stats.eventsByAction['delete']).toBe(1);
    });

    it('reports IPFS availability from the IPFS service', async () => {
      ipfs.isAvailable.mockResolvedValueOnce(true);
      const stats = await service.getStats();
      expect(stats.ipfsAvailable).toBe(true);
    });
  });
});
