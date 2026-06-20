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
 * The public `AuditService.verifyIntegrity()` performs full content + linkage
 * verification: it recomputes each event's SHA-256 hash over the canonical
 * field set (see `AuditService.integrityFields`) and checks `previousHash`
 * continuity. It does NOT delegate to `storage.verifyChain()`, whose backend
 * implementations only check linkage and would miss content tampering. These
 * tests recompute hashes with the exact same primitive the service uses (Node
 * `crypto` SHA-256 over the canonical sorted-key JSON); no bespoke crypto is
 * introduced. A `LyingVerifyChainStorage` further proves verifyIntegrity() does
 * its own content verification rather than trusting a storage-supplied verdict.
 */

import { createHash, createHmac } from 'crypto';
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

/**
 * The exact field set the service hashes over (mirrors AuditService.integrityFields).
 * Deliberately excludes `nonce`/`blockNumber` — they are storage-managed metadata
 * that some backends do not round-trip, so they are not part of the integrity hash.
 */
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

/**
 * Storage whose `verifyChain` always claims the chain is intact. Used to prove
 * that `AuditService.verifyIntegrity()` performs its OWN content verification
 * and does not trust a verdict supplied by the storage layer — a regression
 * guard against re-introducing `verifyIntegrity = () => storage.verifyChain()`.
 */
class LyingVerifyChainStorage extends InMemoryConformanceStorage {
  async verifyChain(): Promise<{ valid: boolean; brokenAt?: string }> {
    return { valid: true };
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
        name: 'reorder two adjacent entries (swap their block numbers)',
        // The canonical chain order is by blockNumber (robust to storage backends
        // that do not guarantee row order), so a meaningful reorder swaps the
        // entries' blockNumbers. After the swap the sorted order flips and the
        // now-second entry's previousHash no longer matches its predecessor.
        mutate: (s) => {
          const a = s._raw()[1];
          const b = s._raw()[2];
          const tmp = a.blockNumber;
          a.blockNumber = b.blockNumber;
          b.blockNumber = tmp;
        },
        expectBrokenIndex: 2,
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

  describe('verifyIntegrity owns content verification (does not trust storage.verifyChain)', () => {
    it('catches a content tamper even when storage.verifyChain lies "valid"', async () => {
      const lyingStorage = new LyingVerifyChainStorage();
      const lyingService = new AuditService(lyingStorage, noopIpfs);
      const chain = await buildChain(lyingService, 4);

      // Storage's own verdict is a (lying) clean bill of health...
      expect((await lyingStorage.verifyChain()).valid).toBe(true);
      // ...and an untampered chain still verifies through the service.
      expect((await lyingService.verifyIntegrity()).valid).toBe(true);

      // Tamper an entry's content. storage.verifyChain would STILL say valid,
      // so only the service's own content recomputation can catch this.
      lyingStorage._mutate(2, (e) => { e.action = 'action:TAMPERED'; });
      expect((await lyingStorage.verifyChain()).valid).toBe(true); // storage still lies
      const result = await lyingService.verifyIntegrity();
      expect(result.valid).toBe(false);
      expect((result as any).brokenAt).toBe(chain[2].id);
    });

    it('integrity hash is independent of nonce / blockNumber (round-trips on any backend)', async () => {
      const [event] = await buildChain(service, 1);
      const stored = (await storage.getEvent(event.id))!;
      // Recompute with nonce/blockNumber stripped (as a backend that drops them
      // would return them) — the hash MUST still match, proving they are not
      // part of the integrity hash.
      const withoutMeta: AuditEvent = { ...stored, nonce: undefined, blockNumber: undefined };
      expect(canonicalEventHash(withoutMeta)).toBe(stored.hash);
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

  // ──────────────────────────────────────────────────────────────────────────────
  // HMAC-SHA256 non-repudiation signature.
  //
  // TEETH for `signEvent`: with no signing key configured the service falls back
  // to a plain SHA-256 of the canonical event, so a "downgrade HMAC → sha256"
  // mutation is invisible. These tests configure AUDIT_SIGNING_KEY so the real
  // HMAC branch runs, then prove (a) the produced signature is exactly
  // HMAC-SHA256(key, canonical-event) and NOT the keyless sha256, and (b) the
  // signature binds the integrity-relevant fields (details + previousHash), so
  // any content or linkage tamper invalidates it.
  // ──────────────────────────────────────────────────────────────────────────────
  describe('HMAC-SHA256 event signature (non-repudiation)', () => {
    const SIGNING_KEY = 'conformance-signing-key-7f3a';
    let signedStorage: InMemoryConformanceStorage;
    let signedService: AuditService;
    const prevSigningKey = process.env.AUDIT_SIGNING_KEY;

    /** Canonical field set the service signs over (mirrors AuditService.integrityFields). */
    const signedPayload = (e: AuditEvent) => ({
      id: e.id,
      timestamp: e.timestamp,
      source: e.source,
      action: e.action,
      resource: e.resource,
      actor: e.actor,
      details: e.details,
      previousHash: e.previousHash,
    });
    const hmacSig = (e: AuditEvent, key: string) =>
      createHmac('sha256', key).update(canonicalize(signedPayload(e))).digest('hex');
    const plainSig = (e: AuditEvent) =>
      createHash('sha256').update(canonicalize(signedPayload(e))).digest('hex');

    beforeEach(() => {
      process.env.AUDIT_SIGNING_KEY = SIGNING_KEY;
      signedStorage = new InMemoryConformanceStorage();
      signedService = new AuditService(signedStorage, noopIpfs);
    });
    afterEach(() => {
      if (prevSigningKey === undefined) delete process.env.AUDIT_SIGNING_KEY;
      else process.env.AUDIT_SIGNING_KEY = prevSigningKey;
    });

    it('signature is a true HMAC-SHA256 over the canonical event, not a keyless sha256', async () => {
      const event = await signedService.logEvent({
        source: 'svc',
        action: 'transfer',
        resource: 'ledger',
        actor: 'did:atp:actor-x',
        details: { amount: 100 },
      });
      expect(event.signature).toBe(hmacSig(event, SIGNING_KEY));
      // A plain (keyless) sha256 downgrade MUST NOT match — proves the HMAC has teeth.
      expect(event.signature).not.toBe(plainSig(event));
    });

    it('a wrong signing key yields a different signature (key actually authenticates)', async () => {
      const event = await signedService.logEvent({
        source: 'svc',
        action: 'transfer',
        resource: 'ledger',
        actor: 'did:atp:actor-x',
        details: { amount: 100 },
      });
      expect(event.signature).not.toBe(hmacSig(event, 'attacker-key'));
    });

    type SigTamper = { name: string; mutate: (e: AuditEvent) => AuditEvent };
    const sigTampers: SigTamper[] = [
      { name: 'details payload', mutate: (e) => ({ ...e, details: { amount: 999_999 } }) },
      { name: 'actor', mutate: (e) => ({ ...e, actor: 'did:atp:attacker' }) },
      { name: 'action', mutate: (e) => ({ ...e, action: 'action:TAMPERED' }) },
      { name: 'previousHash linkage', mutate: (e) => ({ ...e, previousHash: 'f'.repeat(64) }) },
      { name: 'timestamp', mutate: (e) => ({ ...e, timestamp: '1999-01-01T00:00:00.000Z' }) },
    ];

    it.each(sigTampers)('tampering with $name invalidates the HMAC signature', async ({ mutate }) => {
      const event = await signedService.logEvent({
        source: 'svc',
        action: 'transfer',
        resource: 'ledger',
        actor: 'did:atp:actor-x',
        details: { amount: 100 },
      });
      // The stored signature still authenticates the original event...
      expect(event.signature).toBe(hmacSig(event, SIGNING_KEY));
      // ...but recomputing the HMAC over the tampered event no longer matches.
      const tampered = mutate(JSON.parse(JSON.stringify(event)));
      expect(event.signature).not.toBe(hmacSig(tampered, SIGNING_KEY));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────────
  // Service-owned periodic self-verification (`verifyChainIntegrity`).
  //
  // The public verifyIntegrity() now routes through this same checker, but the
  // every-100-blocks self-audit is an independent trigger worth its own teeth.
  // These tests drive the chain to block 100 with a tamper already in place and
  // assert the self-audit logs an INTEGRITY VIOLATION — isolating BOTH the
  // content-hash check and the linkage check so disabling either is caught.
  // ──────────────────────────────────────────────────────────────────────────────
  describe('periodic self-verification detects tamper at the 100-block checkpoint', () => {
    /** Build n events directly into `storage`, returning the service used. */
    async function logN(n: number): Promise<void> {
      for (let i = 0; i < n; i++) {
        await service.logEvent({
          source: 'svc',
          action: `action:${i}`,
          resource: `res-${i}`,
          actor: `did:atp:actor-${i}`,
          details: { step: i },
        });
      }
    }

    it('CONTENT tamper: mutating a stored event before block 100 triggers a violation', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      try {
        await logN(99); // blocks 1..99
        // Tamper an earlier event's content; its recorded hash no longer matches.
        storage._mutate(5, (e) => { e.action = 'action:TAMPERED'; });
        await logN(1); // block 100 → fires verifyChainIntegrity over the whole chain
        const flagged = spy.mock.calls.some((c) =>
          String(c[0]).includes('AUDIT CHAIN INTEGRITY VIOLATION'),
        );
        expect(flagged).toBe(true);
      } finally {
        spy.mockRestore();
      }
    });

    it('PURE LINKAGE break: dropping a middle event before block 100 triggers a violation', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      try {
        await logN(99); // blocks 1..99
        // Drop a middle event: every surviving event's OWN content hash is still
        // valid, so only the previousHash-linkage check can catch this.
        storage._raw().splice(40, 1);
        await logN(1); // block 100 → fires verifyChainIntegrity
        const flagged = spy.mock.calls.some((c) =>
          String(c[0]).includes('AUDIT CHAIN INTEGRITY VIOLATION'),
        );
        expect(flagged).toBe(true);
      } finally {
        spy.mockRestore();
      }
    });

    it('TEETH: an intact 100-block chain raises NO violation (no false positives)', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      try {
        await logN(100); // reaches block 100 with no tamper
        const flagged = spy.mock.calls.some((c) =>
          String(c[0]).includes('AUDIT CHAIN INTEGRITY VIOLATION'),
        );
        expect(flagged).toBe(false);
      } finally {
        spy.mockRestore();
      }
    });
  });
});
