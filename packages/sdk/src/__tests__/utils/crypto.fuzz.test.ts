/**
 * Property-based / fuzz + adversarial tests for CryptoUtils.
 *
 * These complement the example-based tests in crypto.test.ts. The goal is to
 * exercise the signing/verification, AEAD, ECDH, and helper primitives against
 * a large space of arbitrary and adversarial inputs, asserting the security
 * invariants:
 *   - sign -> verify round-trips (hybrid + legacy)
 *   - any tampering (sig / message / pubkey) makes verify return false (no throw)
 *   - wrong key never verifies
 *   - truncation never verifies
 *   - cross-algorithm confusion is rejected
 *   - AES-GCM tampering is detected (throws on decrypt)
 *   - ECDH encrypt/decrypt round-trips
 *   - helper invariants for isValidHex / constantTimeEqual / generateId
 */

import fc from 'fast-check';
import { CryptoUtils } from '../../utils/crypto';

jest.setTimeout(60000);

// ---------------------------------------------------------------------------
// Shared keypair pools (hybrid keygen via ML-DSA is slow; generate once).
// ---------------------------------------------------------------------------
type KP = Awaited<ReturnType<typeof CryptoUtils.generateKeyPair>>;

let hybridPool: KP[] = [];
let legacyPool: KP[] = [];

beforeAll(async () => {
  hybridPool = await Promise.all([
    CryptoUtils.generateKeyPair(true),
    CryptoUtils.generateKeyPair(true),
    CryptoUtils.generateKeyPair(true)
  ]);
  legacyPool = await Promise.all([
    CryptoUtils.generateKeyPair(false),
    CryptoUtils.generateKeyPair(false),
    CryptoUtils.generateKeyPair(false)
  ]);
});

// Pick a pool member deterministically from a fast-check-provided index.
const pick = <T>(arr: T[], i: number): T => arr[((i % arr.length) + arr.length) % arr.length];

// Flip one hex character (deterministically) at position derived from `at`.
function flipHexChar(hex: string, at: number): string {
  if (hex.length === 0) return 'a';
  const idx = (((at % hex.length) + hex.length) % hex.length);
  const c = hex[idx];
  const replacement = c === '0' ? '1' : '0';
  return hex.slice(0, idx) + replacement + hex.slice(idx + 1);
}

describe('CryptoUtils — sign/verify property tests (hybrid)', () => {
  it('round-trips arbitrary string messages', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), fc.nat(), async (msg, kpIdx) => {
        const kp = pick(hybridPool, kpIdx);
        const sig = await CryptoUtils.signData(msg, kp.privateKey, true);
        return (await CryptoUtils.verifySignature(msg, sig, kp.publicKey, true)) === true;
      }),
      { numRuns: 15 }
    );
  });

  it('round-trips arbitrary byte messages', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uint8Array({ minLength: 0, maxLength: 256 }), fc.nat(), async (bytes, kpIdx) => {
        const kp = pick(hybridPool, kpIdx);
        const buf = Buffer.from(bytes);
        const sig = await CryptoUtils.signData(buf, kp.privateKey, true);
        return (await CryptoUtils.verifySignature(buf, sig, kp.publicKey, true)) === true;
      }),
      { numRuns: 15 }
    );
  });

  it('rejects a tampered message (verify false, never throws)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), fc.nat(), async (msg, kpIdx) => {
        const kp = pick(hybridPool, kpIdx);
        const sig = await CryptoUtils.signData(msg, kp.privateKey, true);
        const tampered = msg + 'X'; // guaranteed different content
        const ok = await CryptoUtils.verifySignature(tampered, sig, kp.publicKey, true);
        return ok === false;
      }),
      { numRuns: 15 }
    );
  });

  it('rejects a tampered signature byte (verify false, never throws)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), fc.nat(), fc.nat(), async (msg, kpIdx, at) => {
        const kp = pick(hybridPool, kpIdx);
        const sig = await CryptoUtils.signData(msg, kp.privateKey, true);
        const tamperedSig = flipHexChar(sig, at);
        const ok = await CryptoUtils.verifySignature(msg, tamperedSig, kp.publicKey, true);
        return ok === false;
      }),
      { numRuns: 20 }
    );
  });

  it('rejects tampering of any public-key byte (Ed25519 OR ML-DSA region)', async () => {
    // With real hybrid signing, the ENTIRE 1984-byte public key is authenticated,
    // so flipping any byte — including the ML-DSA half (bytes 32..1983) — must be
    // detected. (This previously had to be scoped to the Ed25519 region because a
    // length-check bug silently disabled hybrid signing; see crypto.ts:98.)
    await fc.assert(
      fc.asyncProperty(fc.string(), fc.nat(), fc.nat(), async (msg, kpIdx, at) => {
        const kp = pick(hybridPool, kpIdx);
        const sig = await CryptoUtils.signData(msg, kp.privateKey, true);
        const idx = at % kp.publicKey.length; // anywhere in the full hybrid pubkey
        const tamperedPub = flipHexChar(kp.publicKey, idx);
        const ok = await CryptoUtils.verifySignature(msg, sig, tamperedPub, true);
        return ok === false;
      }),
      { numRuns: 20 }
    );
  });

  // ---------------------------------------------------------------------------
  // REGRESSION GUARD for the hybrid-signing fix (crypto.ts:98).
  //
  // The hybrid private key is 4064 bytes (32 Ed25519 + 4032 ML-DSA-65). signData
  // must take the hybrid branch and co-sign with ML-DSA, producing a combined
  // signature (~3377 bytes), and verifySignature must authenticate the full
  // public key — so tampering the ML-DSA half (bytes 32..1983) is detected.
  //
  // Before the fix this test FAILS: the signature is only 64 bytes (Ed25519-only)
  // and ML-DSA-region tampering verifies `true`. Do NOT weaken these assertions.
  // ---------------------------------------------------------------------------
  it('produces a real hybrid signature that authenticates the ML-DSA public-key half', async () => {
    const kp = pick(hybridPool, 0);
    const sig = await CryptoUtils.signData('quantum-safe?', kp.privateKey, true);

    // A genuine hybrid signature is far larger than a bare 64-byte Ed25519 sig.
    expect(Buffer.from(sig, 'hex').length).toBeGreaterThan(3000);

    // The untampered signature verifies.
    expect(await CryptoUtils.verifySignature('quantum-safe?', sig, kp.publicKey, true)).toBe(true);

    // Flipping a byte well inside the ML-DSA public-key region (byte 100 -> hex 200)
    // is now detected.
    const tamperedPub = flipHexChar(kp.publicKey, 200);
    expect(await CryptoUtils.verifySignature('quantum-safe?', sig, tamperedPub, true)).toBe(false);
  });

  it('rejects a signature from a different keypair (wrong-key)', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), fc.nat(), async (msg, kpIdx) => {
        const a = pick(hybridPool, kpIdx);
        const b = pick(hybridPool, kpIdx + 1); // guaranteed different member (pool size 3)
        const sig = await CryptoUtils.signData(msg, a.privateKey, true);
        const ok = await CryptoUtils.verifySignature(msg, sig, b.publicKey, true);
        return ok === false;
      }),
      { numRuns: 15 }
    );
  });

  it('rejects truncated signatures', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), fc.nat(), fc.nat(), async (msg, kpIdx, cut) => {
        const kp = pick(hybridPool, kpIdx);
        const sig = await CryptoUtils.signData(msg, kp.privateKey, true);
        // Truncate to somewhere strictly shorter than full length (keep even length for hex).
        const half = Math.max(2, sig.length - 2 - (cut % Math.max(1, sig.length - 2)));
        const truncated = sig.slice(0, half - (half % 2));
        const ok = await CryptoUtils.verifySignature(msg, truncated, kp.publicKey, true);
        return ok === false;
      }),
      { numRuns: 15 }
    );
  });
});

describe('CryptoUtils — sign/verify property tests (legacy Ed25519)', () => {
  it('round-trips arbitrary messages', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), fc.nat(), async (msg, kpIdx) => {
        const kp = pick(legacyPool, kpIdx);
        const sig = await CryptoUtils.signData(msg, kp.privateKey, false);
        return (await CryptoUtils.verifySignature(msg, sig, kp.publicKey, false)) === true;
      }),
      { numRuns: 30 }
    );
  });

  it('rejects tampered message / signature / pubkey', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1 }), fc.nat(), fc.nat(), async (msg, kpIdx, at) => {
        const kp = pick(legacyPool, kpIdx);
        const sig = await CryptoUtils.signData(msg, kp.privateKey, false);

        const okMsg = await CryptoUtils.verifySignature(msg + 'X', sig, kp.publicKey, false);
        const okSig = await CryptoUtils.verifySignature(msg, flipHexChar(sig, at), kp.publicKey, false);
        const okPub = await CryptoUtils.verifySignature(msg, sig, flipHexChar(kp.publicKey, at), false);

        return okMsg === false && okSig === false && okPub === false;
      }),
      { numRuns: 30 }
    );
  });

  it('rejects a signature from a different legacy keypair', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), fc.nat(), async (msg, kpIdx) => {
        const a = pick(legacyPool, kpIdx);
        const b = pick(legacyPool, kpIdx + 1);
        const sig = await CryptoUtils.signData(msg, a.privateKey, false);
        return (await CryptoUtils.verifySignature(msg, sig, b.publicKey, false)) === false;
      }),
      { numRuns: 30 }
    );
  });
});

describe('CryptoUtils — cross-algorithm confusion', () => {
  it('a legacy Ed25519-only signature does not verify as a hybrid signature', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), fc.nat(), async (msg, idx) => {
        const legacy = pick(legacyPool, idx);
        const hybrid = pick(hybridPool, idx);
        // Sign in legacy mode, attempt to verify in hybrid mode against the hybrid pubkey.
        const legacySig = await CryptoUtils.signData(msg, legacy.privateKey, false);
        const ok = await CryptoUtils.verifySignature(msg, legacySig, hybrid.publicKey, true);
        return ok === false;
      }),
      { numRuns: 15 }
    );
  });

  it('a hybrid signature does not verify against a legacy pubkey in legacy mode for a different key', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), fc.nat(), async (msg, idx) => {
        const hybrid = pick(hybridPool, idx);
        const legacy = pick(legacyPool, idx);
        const hybridSig = await CryptoUtils.signData(msg, hybrid.privateKey, true);
        // Verify hybrid signature against an unrelated legacy pubkey -> must be false.
        const ok = await CryptoUtils.verifySignature(msg, hybridSig, legacy.publicKey, false);
        return ok === false;
      }),
      { numRuns: 15 }
    );
  });

  it('mismatched pubkey/sig combinations return false rather than throw (garbage inputs)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string(),
        fc.hexaString({ minLength: 0, maxLength: 300 }),
        fc.hexaString({ minLength: 0, maxLength: 4000 }),
        fc.boolean(),
        async (msg, sigHex, pubHex, qs) => {
          // Must never throw; must return a boolean. Random hex is overwhelmingly
          // invalid, so the result should essentially always be false, but we
          // only strictly require "no throw + boolean".
          const ok = await CryptoUtils.verifySignature(msg, sigHex, pubHex, qs);
          return typeof ok === 'boolean';
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('CryptoUtils — AES-256-GCM (encrypt/decrypt)', () => {
  const key32 = () => fc.uint8Array({ minLength: 32, maxLength: 32 }).map((u) => Buffer.from(u));

  it('round-trips arbitrary plaintext', () => {
    fc.assert(
      fc.property(fc.string(), key32(), (plaintext, key) => {
        const ct = CryptoUtils.encrypt(plaintext, key);
        const pt = CryptoUtils.decrypt(ct, key);
        return pt === plaintext;
      }),
      { numRuns: 50 }
    );
  });

  it('round-trips arbitrary binary plaintext (utf8 string compare via Buffer)', () => {
    fc.assert(
      fc.property(fc.string(), key32(), (plaintext, key) => {
        const ct = CryptoUtils.encrypt(Buffer.from(plaintext, 'utf8'), key);
        return CryptoUtils.decrypt(ct, key) === plaintext;
      }),
      { numRuns: 50 }
    );
  });

  it('decrypt throws when the ciphertext body is tampered', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), key32(), fc.nat(), (plaintext, key, at) => {
        const ct = CryptoUtils.encrypt(plaintext, key);
        // ciphertext body starts after iv(12)+authTag(16) = 28 bytes = 56 hex chars.
        if (ct.length <= 56) return true; // empty-body edge: skip (covered by authTag test)
        const flipped = flipHexChar(ct.slice(56), at);
        const tampered = ct.slice(0, 56) + flipped;
        expect(() => CryptoUtils.decrypt(tampered, key)).toThrow();
        return true;
      }),
      { numRuns: 40 }
    );
  });

  it('decrypt throws when the auth tag is tampered', () => {
    fc.assert(
      fc.property(fc.string(), key32(), fc.nat(), (plaintext, key, at) => {
        const ct = CryptoUtils.encrypt(plaintext, key);
        // authTag is bytes 12..28 => hex chars 24..56.
        const tagHex = ct.slice(24, 56);
        const flippedTag = flipHexChar(tagHex, at);
        const tampered = ct.slice(0, 24) + flippedTag + ct.slice(56);
        expect(() => CryptoUtils.decrypt(tampered, key)).toThrow();
        return true;
      }),
      { numRuns: 40 }
    );
  });

  it('decrypt throws when using the wrong key', () => {
    fc.assert(
      fc.property(fc.string(), key32(), key32(), (plaintext, k1, k2) => {
        fc.pre(!k1.equals(k2));
        const ct = CryptoUtils.encrypt(plaintext, k1);
        expect(() => CryptoUtils.decrypt(ct, k2)).toThrow();
        return true;
      }),
      { numRuns: 40 }
    );
  });
});

describe('CryptoUtils — X25519 encryptForRecipient / decryptFromSender', () => {
  it('round-trips arbitrary plaintext', () => {
    fc.assert(
      fc.property(fc.string(), (plaintext) => {
        const recipient = CryptoUtils.generateX25519KeyPair();
        const sealed = CryptoUtils.encryptForRecipient(plaintext, recipient.publicKey);
        const opened = CryptoUtils.decryptFromSender(sealed, recipient.privateKey);
        return opened === plaintext;
      }),
      { numRuns: 30 }
    );
  });

  it('fails to open with the wrong recipient private key', () => {
    fc.assert(
      fc.property(fc.string(), (plaintext) => {
        const recipient = CryptoUtils.generateX25519KeyPair();
        const other = CryptoUtils.generateX25519KeyPair();
        const sealed = CryptoUtils.encryptForRecipient(plaintext, recipient.publicKey);
        // Wrong key derives a different shared secret -> GCM auth fails -> throw.
        expect(() => CryptoUtils.decryptFromSender(sealed, other.privateKey)).toThrow();
        return true;
      }),
      { numRuns: 20 }
    );
  });
});

describe('CryptoUtils — helper invariants', () => {
  it('isValidHex: accepts even-length hex, rejects odd-length / non-hex', () => {
    fc.assert(
      fc.property(fc.hexaString({ minLength: 0, maxLength: 64 }), (hex) => {
        const expected = hex.length > 0 && hex.length % 2 === 0;
        // fc.hexaString yields only [0-9a-f]; empty string -> regex fails (no '+').
        return CryptoUtils.isValidHex(hex) === expected;
      }),
      { numRuns: 50 }
    );
  });

  it('isValidHex: rejects strings containing non-hex characters', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        // If the string contains any char outside [0-9a-fA-F], it must be invalid.
        const allHex = /^[0-9a-fA-F]*$/.test(s);
        if (allHex) return true; // not the case under test
        return CryptoUtils.isValidHex(s) === false;
      }),
      { numRuns: 50 }
    );
  });

  it('constantTimeEqual: true iff strings are identical', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (a, b) => {
        return CryptoUtils.constantTimeEqual(a, b) === (a === b);
      }),
      { numRuns: 50 }
    );
  });

  it('constantTimeEqual: always true for a string compared with itself', () => {
    fc.assert(
      fc.property(fc.string(), (a) => CryptoUtils.constantTimeEqual(a, a) === true),
      { numRuns: 50 }
    );
  });

  it('generateId: produces RFC4122 v4 shape with version=4 and variant in {8,9,a,b}', () => {
    const re = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    for (let i = 0; i < 200; i++) {
      const id = CryptoUtils.generateId();
      expect(id).toMatch(re);
      // version nibble (index 14) is the char immediately after the 3rd group dash.
      expect(id[14]).toBe('4');
      // variant nibble (index 19) is the char immediately after the 4th group dash.
      expect('89ab').toContain(id[19]);
    }
  });

  it('generateId: values are unique across many invocations', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) seen.add(CryptoUtils.generateId());
    expect(seen.size).toBe(1000);
  });

  it('hash: deterministic and 64-hex-char (sha256)', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const h1 = CryptoUtils.hash(s);
        const h2 = CryptoUtils.hash(s);
        return h1 === h2 && /^[0-9a-f]{64}$/.test(h1);
      }),
      { numRuns: 50 }
    );
  });
});
