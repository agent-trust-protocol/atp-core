/**
 * Audit Store / Trust Registry conformance — AUDIT STORE INTEGRITY (Item D).
 *
 * Table-driven conformance tests for the append-only hash chain produced by
 * {@link AuditService}. These assert two properties of an audit store:
 *
 *   1. An intact chain verifies as valid.
 *   2. ANY tamper — mutating an entry's content, reordering entries, or
 *      breaking the `previousHash` linkage — is detected (verification FALSE).
 *
 * The production `AuditStorageService.verifyChain` (Postgres / SQLite) only
 * checks `previousHash` linkage. The `AuditService` itself owns the canonical
 * hashing rule (SHA-256 over the sorted event fields) but only exposes it via
 * the private periodic `verifyChainIntegrity`. To give the tamper tests TEETH
 * for content mutation as well as linkage, this suite uses an in-memory
 * conformance storage whose `verifyChain` replicates BOTH checks using the
 * exact same hashing primitive the service uses (Node `crypto` SHA-256 over the
 * canonical sorted-key JSON). No bespoke crypto is introduced.
 */

import { createHash } from 'crypto';
import { AuditService } from '../audit.js';
import { AuditEvent, AuditEventRequest, AuditQuery } from '../../models/audit.js';
import { IAuditStorageService } from '../../interfaces/storage.js';

// ─── canonical hashing (mirrors AuditService.generateSecureHash) ────────────────

/** Deterministic, content-preserving canonical JSON (recursively sorted keys). */
function canonicalize(data: any): string {
  return JSON.stringify(data, (_key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value)
        .sort()
        .reduce((acc: Record<string, any>, k) => {
          acc[k] = value[k];
          return acc;
        }, {});
    }
    return value;
  });
}

/** The exact field set the service hashes over (mirrors AuditService). */
function canonicalEventHash(event: AuditEvent): string {
  const data = {
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
  };
  return createHash('sha256').update(canonicalize(data)).digest('hex');
}

const GENESIS = '0'.repeat(64);

// ─── in-memory conformance storage ──────────────────────────────────────────────

/**
 * In-memory append-only store. `verifyChain` enforces the full conformance
 * contract: genesis linkage, per-link `previousHash` continuity, AND content
 * integrity by recomputing each event's hash.
 */
class InMemoryConformanceStorage implements IAuditStorageService {
  private events: AuditEvent[] = [];

  async storeEvent(event: AuditEvent): Promise<void> {
    // Store a deep copy so callers cannot mutate stored state by reference.
    this.events.push(JSON.parse(JSON.stringify(event)));
  }

  async getEvent(id: string): Promise<AuditEvent | null> {
    return this.events.find((e) => e.id === id) ?? null;
  }

  async queryEvents(_query: AuditQuery): Promise<{ events: AuditEvent[]; total: number }> {
    const events = this.events.map((e) => JSON.parse(JSON.stringify(e)));
    return { events, total: events.length };
  }

  async getLastEvent(): Promise<AuditEvent | null> {
    return this.events.length ? JSON.parse(JSON.stringify(this.events[this.events.length - 1])) : null;
  }

  async verifyChain(): Promise<{ valid: boolean; brokenAt?: string }> {
    // Verify in stored (append) order — reordering MUST therefore be caught.
    let previousHash: string = GENESIS;
    for (const event of this.events) {
      // 1. Linkage continuity.
      if ((event.previousHash ?? GENESIS) !== previousHash) {
        return { valid: false, brokenAt: event.id };
      }
      // 2. Content integrity — recompute and compare the stored hash.
      if (event.hash !== canonicalEventHash(event)) {
        return { valid: false, brokenAt: event.id };
      }
      previousHash = event.hash;
    }
    return { valid: true };
  }

  close(): void {
    /* no-op */
  }

  // ── test-only accessors (bypass the read-copy semantics) ──
  _raw(): AuditEvent[] {
    return this.events;
  }
  _mutate(index: number, fn: (e: AuditEvent) => void): void {
    fn(this.events[index]);
  }
  _swap(a: number, b: number): void {
    const tmp = this.events[a];
    this.events[a] = this.events[b];
    this.events[b] = tmp;
  }
}

const noopIpfs = {
  storeEvent: async () => '',
  retrieveEvent: async () => null,
  isAvailable: async () => false,
} as any;

/** Append `count` genuine events through the real service to build a chain. */
async function buildChain(service: AuditService, count: number): Promise<AuditEvent[]> {
  const events: AuditEvent[] = [];
  for (let i = 0; i < count; i++) {
    const req: AuditEventRequest = {
      source: `svc-${i % 3}`,
      action: `action:${i}`,
      resource: `res-${i}`,
      actor: `did:atp:actor-${i}`,
      details: { step: i, note: `event ${i}` },
    };
    events.push(await service.logEvent(req));
  }
  return events;
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('Audit store conformance — hash-chain integrity', () => {
  let storage: InMemoryConformanceStorage;
  let service: AuditService;

  beforeEach(() => {
    storage = new InMemoryConformanceStorage();
    service = new AuditService(storage, noopIpfs);
  });

  describe('intact chains verify as valid (determinism / linkage)', () => {
    const lengthCases: Array<{ name: string; length: number }> = [
      { name: 'empty chain (genesis only)', length: 0 },
      { name: 'single event', length: 1 },
      { name: 'short chain', length: 3 },
      { name: 'medium chain', length: 10 },
    ];

    it.each(lengthCases)('$name → valid', async ({ length }) => {
      await buildChain(service, length);
      const result = await service.verifyIntegrity();
      expect(result.valid).toBe(true);
      expect((result as any).brokenAt).toBeUndefined();
    });

    it('each link references the prior event hash (append-only chain)', async () => {
      const events = await buildChain(service, 5);
      expect(events[0].previousHash).toBe(GENESIS);
      for (let i = 1; i < events.length; i++) {
        expect(events[i].previousHash).toBe(events[i - 1].hash);
        expect(events[i].blockNumber).toBe((events[i - 1].blockNumber ?? 0) + 1);
      }
    });

    it('every stored hash recomputes deterministically (no drift)', async () => {
      await buildChain(service, 6);
      for (const event of storage._raw()) {
        expect(event.hash).toBe(canonicalEventHash(event));
      }
    });
  });

  describe('encrypted sensitive events remain verifiable (hash covers stored form)', () => {
    it('an event with sensitive details is encrypted at rest yet still verifies valid', async () => {
      const event = await service.logEvent({
        source: 'svc',
        action: 'auth:login',
        resource: 'session',
        actor: 'did:atp:actor-x',
        details: { token: 'super-secret-value', note: 'sensitive' },
      });

      const stored = (await storage.getEvent(event.id))!;
      // Sensitive details must be encrypted at rest, never stored in the clear.
      expect(stored.encrypted).toBe(true);
      expect((stored.details as any).__encrypted).toBe(true);
      expect(JSON.stringify(stored.details)).not.toContain('super-secret-value');

      // The integrity hash must cover the stored (ciphertext) form so the chain
      // verifies. Hashing plaintext while storing ciphertext made this fail for
      // every sensitive event.
      const integrity = await service.verifyIntegrity();
      expect(integrity.valid).toBe(true);
      expect(stored.hash).toBe(canonicalEventHash(stored));
    });

    it('tampering with the stored ciphertext of a sensitive event is detected', async () => {
      await service.logEvent({
        source: 'svc',
        action: 'auth:login',
        resource: 'session',
        actor: 'did:atp:actor-x',
        details: { password: 'hunter2' },
      });
      expect((await service.verifyIntegrity()).valid).toBe(true);

      // Mutate the encrypted payload in place — must break integrity.
      storage._mutate(0, (e) => {
        (e.details as any).__data = 'tampered-ciphertext';
      });
      const result = await service.verifyIntegrity();
      expect(result.valid).toBe(false);
      expect((result as any).brokenAt).toBeDefined();
    });
  });

  describe('tamper detection — every mutation MUST break verification', () => {
    /**
     * Each case mutates a 5-event chain (indices 0..4) and asserts the chain
     * no longer verifies. `mutate` receives the storage and chain so it can
     * tamper with a specific stored entry.
     */
    type TamperCase = {
      name: string;
      mutate: (s: InMemoryConformanceStorage, chain: AuditEvent[]) => void;
      expectBrokenIndex?: number;
    };

    const tamperCases: TamperCase[] = [
      {
        name: 'mutate the action of a middle entry',
        mutate: (s) => s._mutate(2, (e) => { e.action = 'action:TAMPERED'; }),
        expectBrokenIndex: 2,
      },
      {
        name: 'mutate the actor of an entry',
        mutate: (s) => s._mutate(1, (e) => { e.actor = 'did:atp:attacker'; }),
        expectBrokenIndex: 1,
      },
      {
        name: 'mutate the details payload of an entry',
        mutate: (s) => s._mutate(3, (e) => { e.details = { step: 999, injected: true }; }),
        expectBrokenIndex: 3,
      },
      {
        name: 'mutate the resource of the first entry',
        mutate: (s) => s._mutate(0, (e) => { e.resource = 'res-evil'; }),
        expectBrokenIndex: 0,
      },
      {
        name: 'mutate the timestamp of an entry',
        mutate: (s) => s._mutate(2, (e) => { e.timestamp = '1999-01-01T00:00:00.000Z'; }),
        expectBrokenIndex: 2,
      },
      {
        name: 'break the previousHash linkage of an entry',
        mutate: (s) => s._mutate(3, (e) => { e.previousHash = 'f'.repeat(64); }),
        expectBrokenIndex: 3,
      },
      {
        name: 'overwrite a stored hash with an arbitrary value',
        mutate: (s) => s._mutate(2, (e) => { e.hash = 'a'.repeat(64); }),
        expectBrokenIndex: 2,
      },
      {
        name: 'reorder two adjacent entries',
        mutate: (s) => s._swap(1, 2),
        // After swap, the new index-1 entry's previousHash no longer matches.
        expectBrokenIndex: 1,
      },
      {
        name: 'delete (drop) a middle entry, breaking continuity',
        mutate: (s) => { s._raw().splice(2, 1); },
        expectBrokenIndex: 2,
      },
      {
        name: 'inject a forged entry with a recomputed-but-mislinked hash',
        mutate: (s, chain) => {
          const forged: AuditEvent = {
            ...JSON.parse(JSON.stringify(chain[1])),
            id: 'forged-evt',
            action: 'action:forged',
            previousHash: chain[1].hash,
          };
          // Recompute its hash so content-integrity alone would pass — only the
          // linkage of the FOLLOWING entry exposes the injection.
          forged.hash = canonicalEventHash(forged);
          s._raw().splice(2, 0, forged);
        },
      },
    ];

    it.each(tamperCases)('$name → invalid', async ({ mutate, expectBrokenIndex }) => {
      const chain = await buildChain(service, 5);

      // Sanity: the untampered chain is valid (the test would be vacuous otherwise).
      expect((await service.verifyIntegrity()).valid).toBe(true);

      mutate(storage, chain);

      const result = await service.verifyIntegrity();
      expect(result.valid).toBe(false);
      expect((result as any).brokenAt).toBeDefined();

      if (expectBrokenIndex !== undefined) {
        const expectedId = storage._raw()[expectBrokenIndex]?.id;
        expect((result as any).brokenAt).toBe(expectedId);
      }
    });

    it('TEETH: restoring the mutated field makes the chain valid again', async () => {
      const chain = await buildChain(service, 4);
      const original = chain[2].action;

      storage._mutate(2, (e) => { e.action = 'action:TAMPERED'; });
      expect((await service.verifyIntegrity()).valid).toBe(false);

      storage._mutate(2, (e) => { e.action = original; });
      expect((await service.verifyIntegrity()).valid).toBe(true);
    });
  });

  describe('content-hash recomputation is independent of field key ordering', () => {
    it('hash is stable regardless of object key insertion order', async () => {
      const [event] = await buildChain(service, 1);
      const reordered: AuditEvent = {
        // intentionally different key order
        nonce: event.nonce,
        blockNumber: event.blockNumber,
        previousHash: event.previousHash,
        action: event.action,
        resource: event.resource,
        actor: event.actor,
        details: event.details,
        source: event.source,
        timestamp: event.timestamp,
        id: event.id,
        hash: event.hash,
      } as AuditEvent;
      expect(canonicalEventHash(reordered)).toBe(event.hash);
    });
  });
});
