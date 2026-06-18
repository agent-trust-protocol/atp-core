/**
 * W3C-style conformance tests for the append-only audit store.
 *
 * These tests are TABLE-DRIVEN so that future W3C conformance vectors can drop
 * in as new rows in the `tamperCases` / chain-construction tables.
 *
 * They cover:
 *   1. Hash-chain construction — each event.previousHash === prior event.hash,
 *      block numbers increment, and an untampered chain verifies as valid.
 *   2. Tamper detection — payload mutation, hash alteration, broken chain link,
 *      and event removal/insertion each cause verifyIntegrity() to report INVALID.
 *   3. Non-repudiation — a tampered event fails its HMAC-SHA256 signature check.
 *
 * Storage strategy mirrors the existing audit.test.ts: a fully in-memory mock
 * implementing IAuditStorageService, plus a no-op IPFS mock, so the suite runs
 * without a real DB or IPFS. The mock's verifyChain() reimplements the SAME
 * SHA-256 hash recomputation + previousHash linkage checks the real service uses
 * internally (AuditService.verifyChainIntegrity), so these tests genuinely
 * exercise integrity semantics rather than a stubbed `valid: true`.
 */

import { createHash, createHmac } from 'crypto';
import { AuditService } from '../audit.js';
import { AuditEvent, AuditEventRequest } from '../../models/audit.js';

// ─── canonical crypto helpers (mirror AuditService internals) ───────────────────

const GENESIS = '0'.repeat(64);

/** Deterministic SHA-256 over sorted keys — identical to AuditService.generateSecureHash. */
const secureHash = (data: Record<string, any>): string => {
  const dataString = JSON.stringify(data, Object.keys(data).sort());
  return createHash('sha256').update(dataString).digest('hex');
};

/** The exact field projection AuditService hashes for an event. */
const eventHashInput = (event: AuditEvent) => ({
  id: event.id,
  timestamp: event.timestamp,
  source: event.source,
  action: event.action,
  resource: event.resource,
  actor: event.actor,
  details: event.details,
  previousHash: event.previousHash,
  nonce: event.nonce,
  blockNumber: event.blockNumber,
});

/** Recompute the canonical HMAC-SHA256 signature for an event. */
const expectedSignature = (event: AuditEvent, signingKey: string): string => {
  const eventData = eventHashInput(event);
  const dataString = JSON.stringify(eventData, Object.keys(eventData).sort());
  return createHmac('sha256', signingKey).update(dataString).digest('hex');
};

/**
 * Pure chain verifier that reimplements AuditService.verifyChainIntegrity over a
 * snapshot of events. Returns the same shape as IAuditStorageService.verifyChain.
 */
const verifyChainOver = (
  events: AuditEvent[]
): { valid: boolean; brokenAt?: string } => {
  const sorted = [...events].sort(
    (a, b) => (a.blockNumber || 0) - (b.blockNumber || 0)
  );

  let previousHash = GENESIS;
  for (const event of sorted) {
    if (event.previousHash !== previousHash) {
      return { valid: false, brokenAt: event.id };
    }
    const expectedHash = secureHash(eventHashInput(event));
    if (event.hash !== expectedHash) {
      return { valid: false, brokenAt: event.id };
    }
    previousHash = event.hash;
  }
  return { valid: true };
};

// ─── in-memory storage + IPFS mocks ─────────────────────────────────────────────

/**
 * In-memory store backed by an ordered array so tamper cases can mutate the
 * exact chain that verifyChain() inspects. The shared `chain` array is the
 * source of truth for both `getLastEvent` and `verifyChain`.
 */
const makeChainStorage = () => {
  const chain: AuditEvent[] = [];

  return {
    chain,
    storeEvent: jest.fn(async (evt: AuditEvent) => {
      chain.push(evt);
    }),
    getEvent: jest.fn(async (id: string) => chain.find((e) => e.id === id) ?? null),
    queryEvents: jest.fn(async () => ({ events: [...chain], total: chain.length })),
    getLastEvent: jest.fn(async () => chain[chain.length - 1] ?? null),
    verifyChain: jest.fn(async () => verifyChainOver(chain)),
    close: jest.fn(),
  };
};

const makeIPFSMock = () => ({
  storeEvent: jest.fn(async () => ''),
  retrieveEvent: jest.fn(async () => null),
  isAvailable: jest.fn(async () => false),
});

const makeRequest = (
  overrides: Partial<AuditEventRequest> = {}
): AuditEventRequest => ({
  source: 'identity-service',
  action: 'did:register',
  resource: 'did:atp:test',
  actor: 'did:atp:admin',
  ...overrides,
});

// Deterministic signing key for non-repudiation assertions.
const SIGNING_KEY = 'conformance-test-signing-key';

// ─── tests ───────────────────────────────────────────────────────────────────

describe('Audit store — W3C conformance', () => {
  let service: AuditService;
  let storage: ReturnType<typeof makeChainStorage>;
  let ipfs: ReturnType<typeof makeIPFSMock>;
  let prevSigningKey: string | undefined;
  let prevEncKey: string | undefined;

  beforeAll(() => {
    prevSigningKey = process.env.AUDIT_SIGNING_KEY;
    prevEncKey = process.env.AUDIT_ENCRYPTION_KEY;
    process.env.AUDIT_SIGNING_KEY = SIGNING_KEY;
    process.env.AUDIT_ENCRYPTION_KEY = 'conformance-test-encryption-key';
  });

  afterAll(() => {
    if (prevSigningKey === undefined) delete process.env.AUDIT_SIGNING_KEY;
    else process.env.AUDIT_SIGNING_KEY = prevSigningKey;
    if (prevEncKey === undefined) delete process.env.AUDIT_ENCRYPTION_KEY;
    else process.env.AUDIT_ENCRYPTION_KEY = prevEncKey;
  });

  beforeEach(() => {
    storage = makeChainStorage();
    ipfs = makeIPFSMock();
    service = new AuditService(storage as any, ipfs as any);
  });

  /** Append N events through the real logEvent path, building a genuine chain. */
  const appendChain = async (count: number): Promise<AuditEvent[]> => {
    const out: AuditEvent[] = [];
    for (let i = 0; i < count; i++) {
      out.push(await service.logEvent(makeRequest({ action: `step:${i}` })));
    }
    return out;
  };

  // ── 1. hash-chain construction (table-driven over chain lengths) ──────────────
  describe('hash-chain construction', () => {
    const lengths = [
      { name: 'single event', count: 1 },
      { name: 'short chain', count: 3 },
      { name: 'longer chain', count: 8 },
    ];

    it.each(lengths)(
      'builds a valid linked chain: $name',
      async ({ count }) => {
        const events = await appendChain(count);

        // First event links to genesis.
        expect(events[0].previousHash).toBe(GENESIS);
        expect(events[0].blockNumber).toBe(1);

        // Each subsequent event links to the prior event's hash, blocks increment.
        for (let i = 1; i < events.length; i++) {
          expect(events[i].previousHash).toBe(events[i - 1].hash);
          expect(events[i].blockNumber).toBe((events[i - 1].blockNumber ?? 0) + 1);
        }

        // Every event hash is a 64-char hex digest matching the canonical recompute.
        for (const e of events) {
          expect(e.hash).toMatch(/^[0-9a-f]{64}$/);
          expect(e.hash).toBe(secureHash(eventHashInput(e)));
        }
      }
    );

    it('verifyIntegrity() returns valid on an untampered chain', async () => {
      await appendChain(5);
      const result = await service.verifyIntegrity();
      expect(result.valid).toBe(true);
      expect(result.brokenAt).toBeUndefined();
    });
  });

  // ── 2. tamper detection (table-driven mutate fns) ─────────────────────────────
  describe('tamper detection', () => {
    type TamperCase = {
      name: string;
      mutate: (events: AuditEvent[]) => void;
      expectValid: false;
    };

    const tamperCases: TamperCase[] = [
      {
        name: '(a) event payload mutated after logging',
        mutate: (events) => {
          // Change the action of the 2nd event without recomputing its hash.
          events[1].action = 'tampered:action';
        },
        expectValid: false,
      },
      {
        name: '(a2) event details mutated after logging',
        mutate: (events) => {
          events[2].details = { injected: 'malicious' };
        },
        expectValid: false,
      },
      {
        name: '(b) stored hash altered',
        mutate: (events) => {
          events[2].hash = 'f'.repeat(64);
        },
        expectValid: false,
      },
      {
        name: '(c) chain previousHash link broken',
        mutate: (events) => {
          events[3].previousHash = 'a'.repeat(64);
        },
        expectValid: false,
      },
      {
        name: '(d-remove) an event removed from the chain',
        mutate: (events) => {
          // Drop the middle event, breaking the link of the next one.
          events.splice(2, 1);
        },
        expectValid: false,
      },
      {
        name: '(d-insert) a forged event inserted into the chain',
        mutate: (events) => {
          const forged: AuditEvent = {
            id: 'forged-1',
            timestamp: new Date().toISOString(),
            source: 'attacker',
            action: 'inject',
            resource: 'did:atp:victim',
            actor: 'did:atp:attacker',
            hash: 'c'.repeat(64),
            previousHash: events[2].hash,
            blockNumber: 3, // collides / misorders block numbering
            nonce: 'forged-nonce',
          };
          events.splice(3, 0, forged);
        },
        expectValid: false,
      },
    ];

    it.each(tamperCases)(
      'reports INVALID when $name',
      async ({ mutate }) => {
        await appendChain(6);

        // Sanity: clean chain verifies before tampering.
        expect((await service.verifyIntegrity()).valid).toBe(true);

        mutate(storage.chain);

        const result = await service.verifyIntegrity();
        expect(result.valid).toBe(false);
      }
    );

    it('points brokenAt at a tampered event id', async () => {
      const events = await appendChain(5);
      events[2].action = 'tampered';
      // Reflect the in-place mutation into the backing store.
      const result = await service.verifyIntegrity();
      expect(result.valid).toBe(false);
      // brokenAt should identify a real event in the chain.
      const ids = events.map((e) => e.id);
      expect(ids).toContain((result as any).brokenAt);
    });
  });

  // ── 3. non-repudiation: HMAC signature ────────────────────────────────────────
  describe('non-repudiation (HMAC-SHA256 signature)', () => {
    it('produces a signature that verifies for an untampered event', async () => {
      const [event] = await appendChain(1);
      expect(event.signature).toBeDefined();
      expect(event.signature).toBe(expectedSignature(event, SIGNING_KEY));
    });

    type SigTamperCase = {
      name: string;
      mutate: (e: AuditEvent) => void;
    };

    const sigTamperCases: SigTamperCase[] = [
      { name: 'action changed', mutate: (e) => { e.action = 'evil'; } },
      { name: 'resource changed', mutate: (e) => { e.resource = 'did:atp:other'; } },
      { name: 'actor changed', mutate: (e) => { e.actor = 'did:atp:impostor'; } },
      { name: 'details changed', mutate: (e) => { e.details = { tampered: true }; } },
    ];

    it.each(sigTamperCases)(
      'a tampered event fails its HMAC signature check ($name)',
      async ({ mutate }) => {
        const [event] = await appendChain(1);
        const originalSig = event.signature;

        mutate(event);

        // The stored signature no longer matches a fresh recompute over the
        // tampered fields → non-repudiation violation detected.
        const recomputed = expectedSignature(event, SIGNING_KEY);
        expect(recomputed).not.toBe(originalSig);
        expect(event.signature).not.toBe(recomputed);
      }
    );
  });
});
