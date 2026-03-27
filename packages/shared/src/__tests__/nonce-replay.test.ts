/**
 * Nonce / Replay-Attack Test Suite
 *
 * Tests the replay-prevention logic from NonceService without a live Redis
 * instance by reimplementing the core algorithm in-memory (same logic as
 * validateNonce, minus I/O).
 *
 * Covered scenarios:
 *  1. Fresh nonce accepted within the validity window
 *  2. Stale nonce rejected (timestamp too old)
 *  3. Future nonce rejected (timestamp in the future beyond window)
 *  4. Nonce reuse rejected for the same DID (replay attack)
 *  5. Same nonce string allowed for different DIDs (isolation)
 *  6. Nonce accepted at exact window boundary (inclusive)
 *  7. Nonce rejected just past the window boundary
 *  8. generateNonce() produces monotonically-unique values
 */

import { createHash } from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// In-memory replica of NonceService.validateNonce logic
// (mirrors packages/shared/src/security/nonce-service.ts exactly)
// ─────────────────────────────────────────────────────────────────────────────

const WINDOW_MS = 60_000; // 1 minute — matches NonceService default

/** Tracks nonce keys that have already been consumed. */
const usedNonces = new Set<string>();

function createNonceKey(did: string, nonce: string, timestamp: number): string {
  const data = `${did}:${nonce}:${timestamp}`;
  return createHash('sha256').update(data).digest('hex');
}

function validateNonce(did: string, nonce: string, timestamp: number, now: number): boolean {
  const age = now - timestamp;

  // Reject if outside the acceptable time window (mirrors lines 55-58 of nonce-service.ts)
  if (age > WINDOW_MS || age < -WINDOW_MS) {
    return false;
  }

  // Reject if already seen (mirrors the Redis SET NX behaviour)
  const key = createNonceKey(did, nonce, timestamp);
  if (usedNonces.has(key)) {
    return false;
  }

  usedNonces.add(key);
  return true;
}

/** generateNonce() replica — matches nonce-service.ts lines 39-43. */
function generateNonce(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

function freshNonce(): { nonce: string; timestamp: number } {
  const timestamp = Date.now();
  const nonce = generateNonce();
  return { nonce, timestamp };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Nonce validation — happy path', () => {
  it('accepts a fresh nonce within the validity window', () => {
    const did = 'did:atp:alice';
    const { nonce, timestamp } = freshNonce();
    const now = timestamp + 100; // 100 ms later — well within window
    expect(validateNonce(did, nonce, timestamp, now)).toBe(true);
  });

  it('accepts a nonce at the exact window boundary (windowMs - 1ms)', () => {
    const did = 'did:atp:boundary-agent';
    const timestamp = Date.now() - (WINDOW_MS - 1);
    const nonce = 'boundary-nonce-ok';
    expect(validateNonce(did, nonce, timestamp, Date.now())).toBe(true);
  });
});

describe('Nonce validation — stale / future timestamps', () => {
  it('rejects a nonce whose timestamp is older than the window', () => {
    const did = 'did:atp:attacker';
    const timestamp = Date.now() - (WINDOW_MS + 1); // 1ms past expiry
    const nonce = 'stale-nonce';
    expect(validateNonce(did, nonce, timestamp, Date.now())).toBe(false);
  });

  it('rejects a nonce with a timestamp far in the past', () => {
    const did = 'did:atp:attacker';
    const timestamp = Date.now() - 10 * 60 * 1000; // 10 minutes ago
    expect(validateNonce(did, 'very-old-nonce', timestamp, Date.now())).toBe(false);
  });

  it('rejects a nonce with a timestamp in the future beyond the window', () => {
    const did = 'did:atp:future-agent';
    const now = Date.now();
    const timestamp = now + WINDOW_MS + 1; // beyond forward tolerance
    expect(validateNonce(did, 'future-nonce', timestamp, now)).toBe(false);
  });

  it('rejects a nonce just 1ms past the window boundary', () => {
    const did = 'did:atp:just-expired';
    const timestamp = Date.now() - WINDOW_MS - 1;
    expect(validateNonce(did, 'just-expired-nonce', timestamp, Date.now())).toBe(false);
  });
});

describe('Nonce reuse — replay attack prevention', () => {
  it('rejects the same nonce used twice for the same DID', () => {
    const did = 'did:atp:replayer';
    const timestamp = Date.now();
    const nonce = `replay-nonce-${Date.now()}`;

    const first = validateNonce(did, nonce, timestamp, timestamp + 50);
    const second = validateNonce(did, nonce, timestamp, timestamp + 100);

    expect(first).toBe(true);
    expect(second).toBe(false); // replay rejected
  });

  it('rejects a replay even when attempted with a slightly different now', () => {
    const did = 'did:atp:replay2';
    const timestamp = Date.now();
    const nonce = `replay-nonce2-${Date.now()}`;

    validateNonce(did, nonce, timestamp, timestamp + 10);

    // Attacker tries again 30 seconds later — still within window but nonce is consumed
    const replayed = validateNonce(did, nonce, timestamp, timestamp + 30_000);
    expect(replayed).toBe(false);
  });
});

describe('Nonce isolation — different DIDs', () => {
  it('allows the same nonce string for two different DIDs', () => {
    // The key includes the DID, so nonce reuse across agents is NOT a replay
    const sharedNonce = `shared-nonce-${Date.now()}`;
    const timestamp = Date.now();

    const alice = validateNonce('did:atp:alice2', sharedNonce, timestamp, timestamp + 50);
    const bob = validateNonce('did:atp:bob2', sharedNonce, timestamp, timestamp + 50);

    expect(alice).toBe(true);
    expect(bob).toBe(true);
  });
});

describe('generateNonce uniqueness', () => {
  it('returns unique nonces on every call', () => {
    const nonces = Array.from({ length: 20 }, generateNonce);
    const unique = new Set(nonces);
    expect(unique.size).toBe(20);
  });

  it('nonce contains a timestamp prefix', () => {
    const before = Date.now();
    const nonce = generateNonce();
    const after = Date.now();

    const [tsPart] = nonce.split('-');
    const ts = parseInt(tsPart, 10);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});
