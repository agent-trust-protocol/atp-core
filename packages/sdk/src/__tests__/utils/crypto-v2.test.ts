/**
 * Tests for the did:atp v2 key model — split Ed25519 / ML-DSA-65 keypairs,
 * RFC 7638 JWK thumbprints, e1_/pq1_ fingerprints.
 */

import { createHash } from 'crypto';
import * as ed25519 from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import {
  CryptoUtils,
  HybridKeyPair,
  ED25519_PUBLIC_KEY_BYTES,
  ML_DSA_65_PUBLIC_KEY_BYTES,
  ML_DSA_65_SIGNATURE_BYTES
} from '../../utils/crypto';

// @noble/ed25519 needs a synchronous SHA-512 for getPublicKey (matches crypto.ts).
ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m));

const BASE64URL_43 = /^[A-Za-z0-9_-]{43}$/;

describe('did:atp v2 key model', () => {
  let keyPair: HybridKeyPair;

  beforeAll(async () => {
    keyPair = await CryptoUtils.generateHybridKeyPair();
  });

  describe('generateHybridKeyPair', () => {
    it('produces a 32-byte Ed25519 public key', () => {
      expect(keyPair.ed25519.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.ed25519.publicKey.length).toBe(ED25519_PUBLIC_KEY_BYTES);
      expect(keyPair.ed25519.publicKey.length).toBe(32);
    });

    it('produces a 1952-byte ML-DSA-65 public key (FIPS 204 final)', () => {
      expect(keyPair.mlDsa65.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.mlDsa65.publicKey.length).toBe(ML_DSA_65_PUBLIC_KEY_BYTES);
      expect(keyPair.mlDsa65.publicKey.length).toBe(1952);
    });

    it('produces independent keypairs on each call', async () => {
      const other = await CryptoUtils.generateHybridKeyPair();
      expect(Buffer.from(other.ed25519.publicKey).equals(Buffer.from(keyPair.ed25519.publicKey))).toBe(false);
      expect(Buffer.from(other.mlDsa65.publicKey).equals(Buffer.from(keyPair.mlDsa65.publicKey))).toBe(false);
    });
  });

  describe('JWK construction', () => {
    it('builds an RFC 8037 OKP JWK for Ed25519', () => {
      const jwk = CryptoUtils.ed25519PublicKeyToJwk(keyPair.ed25519.publicKey);
      expect(jwk).toEqual({
        crv: 'Ed25519',
        kty: 'OKP',
        x: Buffer.from(keyPair.ed25519.publicKey).toString('base64url')
      });
    });

    it('builds an RFC 9964 AKP JWK for ML-DSA-65', () => {
      const jwk = CryptoUtils.mlDsa65PublicKeyToJwk(keyPair.mlDsa65.publicKey);
      expect(jwk).toEqual({
        alg: 'ML-DSA-65',
        kty: 'AKP',
        pub: Buffer.from(keyPair.mlDsa65.publicKey).toString('base64url')
      });
    });

    it('rejects wrong-length public keys', () => {
      expect(() => CryptoUtils.ed25519PublicKeyToJwk(new Uint8Array(31))).toThrow();
      expect(() => CryptoUtils.mlDsa65PublicKeyToJwk(new Uint8Array(1951))).toThrow();
    });
  });

  describe('RFC 7638 JWK thumbprint', () => {
    it('matches the RFC 8037 appendix A.3 Ed25519 test vector', () => {
      // Independently specified vector: RFC 8037 §A.3 computes the RFC 7638
      // thumbprint of this exact Ed25519 JWK.
      const jwk = {
        crv: 'Ed25519',
        kty: 'OKP',
        x: '11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo'
      };
      expect(CryptoUtils.jwkThumbprint(jwk)).toBe('kPrK_qmxVWaYVA9wwBF6Iuo3vVzz7TxHCTwXBygrS4k');
    });

    it('is deterministic and independent of member insertion order', () => {
      const a = CryptoUtils.jwkThumbprint({ crv: 'Ed25519', kty: 'OKP', x: 'abc' });
      const b = CryptoUtils.jwkThumbprint({ x: 'abc', kty: 'OKP', crv: 'Ed25519' });
      expect(a).toBe(b);
    });
  });

  describe('fingerprints', () => {
    it('e1Fingerprint is "e1_" plus a 43-char base64url thumbprint', () => {
      const fp = CryptoUtils.e1Fingerprint(keyPair.ed25519.publicKey);
      expect(fp.startsWith('e1_')).toBe(true);
      expect(fp.slice(3)).toMatch(BASE64URL_43);
    });

    it('pq1Fingerprint is "pq1_" plus a 43-char base64url thumbprint', () => {
      const fp = CryptoUtils.pq1Fingerprint(keyPair.mlDsa65.publicKey);
      expect(fp.startsWith('pq1_')).toBe(true);
      expect(fp.slice(4)).toMatch(BASE64URL_43);
    });

    it('fingerprints are deterministic for the same key', () => {
      expect(CryptoUtils.e1Fingerprint(keyPair.ed25519.publicKey))
        .toBe(CryptoUtils.e1Fingerprint(keyPair.ed25519.publicKey));
      expect(CryptoUtils.pq1Fingerprint(keyPair.mlDsa65.publicKey))
        .toBe(CryptoUtils.pq1Fingerprint(keyPair.mlDsa65.publicKey));
    });
  });

  describe('Ed25519 sign/verify', () => {
    it('round-trips', async () => {
      const sig = await CryptoUtils.signEd25519('hello atp v2', keyPair.ed25519.secretKey);
      expect(sig.length).toBe(64);
      expect(await CryptoUtils.verifyEd25519('hello atp v2', sig, keyPair.ed25519.publicKey)).toBe(true);
    });

    it('rejects modified data and wrong keys', async () => {
      const sig = await CryptoUtils.signEd25519('hello atp v2', keyPair.ed25519.secretKey);
      expect(await CryptoUtils.verifyEd25519('tampered', sig, keyPair.ed25519.publicKey)).toBe(false);
      const other = await CryptoUtils.generateHybridKeyPair();
      expect(await CryptoUtils.verifyEd25519('hello atp v2', sig, other.ed25519.publicKey)).toBe(false);
    });
  });

  describe('ML-DSA-65 sign/verify', () => {
    it('round-trips with a 3309-byte FIPS 204 final signature', () => {
      const sig = CryptoUtils.signMlDsa65('hello atp v2', keyPair.mlDsa65.secretKey);
      expect(sig.length).toBe(ML_DSA_65_SIGNATURE_BYTES);
      expect(sig.length).toBe(3309);
      expect(CryptoUtils.verifyMlDsa65('hello atp v2', sig, keyPair.mlDsa65.publicKey)).toBe(true);
    });

    it('rejects modified data', () => {
      const sig = CryptoUtils.signMlDsa65('hello atp v2', keyPair.mlDsa65.secretKey);
      expect(CryptoUtils.verifyMlDsa65('tampered', sig, keyPair.mlDsa65.publicKey)).toBe(false);
    });

    it('rejects a signature verified against a different (wrong) ML-DSA-65 key', async () => {
      const sig = CryptoUtils.signMlDsa65('hello atp v2', keyPair.mlDsa65.secretKey);
      const other = await CryptoUtils.generateHybridKeyPair();
      expect(CryptoUtils.verifyMlDsa65('hello atp v2', sig, other.mlDsa65.publicKey)).toBe(false);
    });
  });

  // --- Adversarial hardening added by conformance loop -----------------------

  describe('signature tampering (bit-flips)', () => {
    it('Ed25519: a single flipped bit anywhere in the signature is rejected', async () => {
      const sig = await CryptoUtils.signEd25519('hello atp v2', keyPair.ed25519.secretKey);
      for (const idx of [0, 1, 31, 32, 63]) {
        const bad = Uint8Array.from(sig);
        bad[idx] ^= 0x01;
        expect(await CryptoUtils.verifyEd25519('hello atp v2', bad, keyPair.ed25519.publicKey)).toBe(false);
      }
    });

    it('ML-DSA-65: a single flipped bit in the signature is rejected', () => {
      const sig = CryptoUtils.signMlDsa65('hello atp v2', keyPair.mlDsa65.secretKey);
      for (const idx of [0, 100, ML_DSA_65_SIGNATURE_BYTES - 1]) {
        const bad = Uint8Array.from(sig);
        bad[idx] ^= 0x01;
        expect(CryptoUtils.verifyMlDsa65('hello atp v2', bad, keyPair.mlDsa65.publicKey)).toBe(false);
      }
    });
  });

  describe('malformed signature lengths (truncated / over-long / empty)', () => {
    it('Ed25519 verify returns false (never throws) for wrong-length signatures', async () => {
      const sig = await CryptoUtils.signEd25519('hello atp v2', keyPair.ed25519.secretKey);
      const truncated = sig.slice(0, 63);
      const overlong = new Uint8Array(65);
      overlong.set(sig.slice(0, 64));
      const empty = new Uint8Array(0);
      for (const bad of [truncated, overlong, empty]) {
        await expect(
          CryptoUtils.verifyEd25519('hello atp v2', bad, keyPair.ed25519.publicKey)
        ).resolves.toBe(false);
      }
    });

    it('ML-DSA-65 verify returns false (never throws) for wrong-length signatures', () => {
      const sig = CryptoUtils.signMlDsa65('hello atp v2', keyPair.mlDsa65.secretKey);
      const truncated = sig.slice(0, ML_DSA_65_SIGNATURE_BYTES - 1);
      const overlong = new Uint8Array(ML_DSA_65_SIGNATURE_BYTES + 1);
      overlong.set(sig);
      const empty = new Uint8Array(0);
      for (const bad of [truncated, overlong, empty]) {
        expect(() => CryptoUtils.verifyMlDsa65('hello atp v2', bad, keyPair.mlDsa65.publicKey)).not.toThrow();
        expect(CryptoUtils.verifyMlDsa65('hello atp v2', bad, keyPair.mlDsa65.publicKey)).toBe(false);
      }
    });
  });

  describe('cross-algorithm confusion', () => {
    it('an Ed25519 signature does not verify under ML-DSA-65 (and vice versa)', async () => {
      const edSig = await CryptoUtils.signEd25519('hello atp v2', keyPair.ed25519.secretKey);
      const pqSig = CryptoUtils.signMlDsa65('hello atp v2', keyPair.mlDsa65.secretKey);

      // Ed25519 signature fed to the ML-DSA verifier (wrong size + wrong scheme).
      expect(CryptoUtils.verifyMlDsa65('hello atp v2', edSig, keyPair.mlDsa65.publicKey)).toBe(false);
      // ML-DSA signature fed to the Ed25519 verifier (wrong size + wrong scheme).
      expect(await CryptoUtils.verifyEd25519('hello atp v2', pqSig, keyPair.ed25519.publicKey)).toBe(false);
    });

    it('a key from the other algorithm cannot be used as a verification key', async () => {
      const edSig = await CryptoUtils.signEd25519('hello atp v2', keyPair.ed25519.secretKey);
      // Verify an Ed25519 signature using the (1952-byte) ML-DSA public key.
      expect(await CryptoUtils.verifyEd25519('hello atp v2', edSig, keyPair.mlDsa65.publicKey)).toBe(false);
    });
  });

  describe('binary safety of signed payloads', () => {
    it('round-trips arbitrary bytes including NUL and high bytes (Ed25519 + ML-DSA-65)', async () => {
      const data = new Uint8Array([0, 1, 2, 255, 254, 0, 128, 64]);
      const edSig = await CryptoUtils.signEd25519(data, keyPair.ed25519.secretKey);
      expect(await CryptoUtils.verifyEd25519(data, edSig, keyPair.ed25519.publicKey)).toBe(true);

      const pqSig = CryptoUtils.signMlDsa65(data, keyPair.mlDsa65.secretKey);
      expect(CryptoUtils.verifyMlDsa65(data, pqSig, keyPair.mlDsa65.publicKey)).toBe(true);

      // Flipping one payload byte must break both.
      const tampered = Uint8Array.from(data);
      tampered[0] ^= 0xff;
      expect(await CryptoUtils.verifyEd25519(tampered, edSig, keyPair.ed25519.publicKey)).toBe(false);
      expect(CryptoUtils.verifyMlDsa65(tampered, pqSig, keyPair.mlDsa65.publicKey)).toBe(false);
    });
  });

  describe('RFC 7638 thumbprint — independent recomputation & canonicalization', () => {
    // Independent RFC 7638 implementation: build canonical JSON from the
    // required members only, in lexicographic order, SHA-256, base64url(no pad).
    function independentThumbprint(members: Record<string, string>): string {
      const ordered = Object.keys(members).sort();
      const canonical = '{' + ordered.map((k) => `${JSON.stringify(k)}:${JSON.stringify(members[k])}`).join(',') + '}';
      const digest = createHash('sha256').update(Buffer.from(canonical, 'utf8')).digest();
      return digest.toString('base64url');
    }

    it('e1Fingerprint thumbprint equals an independent RFC 7638 computation for a generated key', () => {
      const x = Buffer.from(keyPair.ed25519.publicKey).toString('base64url');
      const expected = independentThumbprint({ crv: 'Ed25519', kty: 'OKP', x });
      expect(CryptoUtils.e1Fingerprint(keyPair.ed25519.publicKey)).toBe(`e1_${expected}`);
    });

    it('pq1Fingerprint thumbprint equals an independent RFC 7638 computation for a generated key', () => {
      const pub = Buffer.from(keyPair.mlDsa65.publicKey).toString('base64url');
      const expected = independentThumbprint({ alg: 'ML-DSA-65', kty: 'AKP', pub });
      expect(CryptoUtils.pq1Fingerprint(keyPair.mlDsa65.publicKey)).toBe(`pq1_${expected}`);
    });

    it('thumbprint output is unpadded base64url (no +, /, or = characters)', () => {
      const tp = CryptoUtils.jwkThumbprint({ crv: 'Ed25519', kty: 'OKP', x: 'abc' });
      expect(tp).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(tp).not.toContain('=');
    });

    it('different keys produce different thumbprints', async () => {
      const other = await CryptoUtils.generateHybridKeyPair();
      expect(CryptoUtils.e1Fingerprint(keyPair.ed25519.publicKey))
        .not.toBe(CryptoUtils.e1Fingerprint(other.ed25519.publicKey));
      expect(CryptoUtils.pq1Fingerprint(keyPair.mlDsa65.publicKey))
        .not.toBe(CryptoUtils.pq1Fingerprint(other.mlDsa65.publicKey));
    });
  });

  describe('fingerprint prefix is load-bearing & domain-separated', () => {
    it('e1_ and pq1_ prefixes are present and distinct', () => {
      const e1 = CryptoUtils.e1Fingerprint(keyPair.ed25519.publicKey);
      const pq1 = CryptoUtils.pq1Fingerprint(keyPair.mlDsa65.publicKey);
      expect(e1.startsWith('e1_')).toBe(true);
      expect(pq1.startsWith('pq1_')).toBe(true);
      // The classical fingerprint must not be mistakable for a PQ one.
      expect(e1.startsWith('pq1_')).toBe(false);
      expect(pq1.startsWith('e1_')).toBe(false);
      // The thumbprint bodies are over different JWKs, hence different.
      expect(e1.slice(3)).not.toBe(pq1.slice(4));
    });
  });

  describe('generateHybridKeyPair output invariants', () => {
    it('public keys have exactly the FIPS-mandated lengths (32 / 1952)', () => {
      expect(keyPair.ed25519.publicKey.length).toBe(ED25519_PUBLIC_KEY_BYTES);
      expect(keyPair.mlDsa65.publicKey.length).toBe(ML_DSA_65_PUBLIC_KEY_BYTES);
      // Guards against a regression that lets a non-1952-byte ML-DSA key through.
      expect(ML_DSA_65_PUBLIC_KEY_BYTES).toBe(1952);
      expect(ED25519_PUBLIC_KEY_BYTES).toBe(32);
    });

    it('secret keys actually sign verifiably under their paired public keys', async () => {
      const edSig = await CryptoUtils.signEd25519('invariant', keyPair.ed25519.secretKey);
      expect(await CryptoUtils.verifyEd25519('invariant', edSig, keyPair.ed25519.publicKey)).toBe(true);
      const pqSig = CryptoUtils.signMlDsa65('invariant', keyPair.mlDsa65.secretKey);
      expect(CryptoUtils.verifyMlDsa65('invariant', pqSig, keyPair.mlDsa65.publicKey)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Deterministic known-answer vectors (KAT) — hybrid Ed25519 + ML-DSA-65.
//
// Keys are derived from FIXED seeds so the e1_/pq1_ fingerprints are
// reproducible across implementations. Signature BYTES are not pinned:
// ML-DSA-65 signing is randomized (hedged), so we pin the fingerprints, key
// sizes and Ed25519 public key, and assert sign/verify round-trips + negatives.
// ---------------------------------------------------------------------------

describe('hybrid key model — deterministic known-answer vectors (KAT)', () => {
  const ED25519_SECRET = new Uint8Array(32).fill(7);
  const ML_DSA_65_SEED = new Uint8Array(32).fill(42);
  const KAT_MESSAGE = 'atp-conformance-kat-v1';

  const EXPECTED = {
    e1: 'e1_--6IM5l0OosLj9yWskISYhUA3n_3CURQkmrYMSha_ck',
    pq1: 'pq1_K7M2FNxAf3VIdhLYkrd0zH51TMhQ8YGULqtpEA-nY4c',
    edPublicKeyB64u: '6kpsY-KcUgq-9VB7Ey7F-ZVHdq6-vnuSQh7qaRRG0iw',
  };

  let edPublicKey: Uint8Array;
  let mlDsa: { publicKey: Uint8Array; secretKey: Uint8Array };

  beforeAll(async () => {
    edPublicKey = await ed25519.getPublicKey(ED25519_SECRET);
    mlDsa = ml_dsa65.keygen(ML_DSA_65_SEED);
  });

  it('derives the pinned Ed25519 public key from the fixed seed', () => {
    expect(edPublicKey.length).toBe(ED25519_PUBLIC_KEY_BYTES);
    expect(Buffer.from(edPublicKey).toString('base64url')).toBe(EXPECTED.edPublicKeyB64u);
  });

  it('derives the pinned e1_ fingerprint (RFC 7638 over the Ed25519 JWK)', () => {
    expect(CryptoUtils.e1Fingerprint(edPublicKey)).toBe(EXPECTED.e1);
  });

  it('derives a 1952-byte ML-DSA-65 public key from the fixed seed', () => {
    expect(mlDsa.publicKey.length).toBe(ML_DSA_65_PUBLIC_KEY_BYTES);
    expect(mlDsa.publicKey.length).toBe(1952);
  });

  it('derives the pinned pq1_ fingerprint (RFC 7638 over the RFC 9964 AKP JWK)', () => {
    expect(CryptoUtils.pq1Fingerprint(mlDsa.publicKey)).toBe(EXPECTED.pq1);
  });

  it('round-trips an ML-DSA-65 signature over the fixed message (3309-byte sig)', () => {
    const sig = CryptoUtils.signMlDsa65(KAT_MESSAGE, mlDsa.secretKey);
    expect(sig.length).toBe(ML_DSA_65_SIGNATURE_BYTES);
    expect(sig.length).toBe(3309);
    expect(CryptoUtils.verifyMlDsa65(KAT_MESSAGE, sig, mlDsa.publicKey)).toBe(true);
  });

  it('rejects a tampered ML-DSA-65 signature', () => {
    const sig = CryptoUtils.signMlDsa65(KAT_MESSAGE, mlDsa.secretKey);
    sig[0] ^= 0xff;
    expect(CryptoUtils.verifyMlDsa65(KAT_MESSAGE, sig, mlDsa.publicKey)).toBe(false);
  });

  it('rejects an ML-DSA-65 signature verified against the wrong message', () => {
    const sig = CryptoUtils.signMlDsa65(KAT_MESSAGE, mlDsa.secretKey);
    expect(CryptoUtils.verifyMlDsa65('a-different-message', sig, mlDsa.publicKey)).toBe(false);
  });

  it('fingerprints are stable across re-derivation from the same seeds', async () => {
    const ed2 = await ed25519.getPublicKey(ED25519_SECRET);
    const ml2 = ml_dsa65.keygen(ML_DSA_65_SEED);
    expect(CryptoUtils.e1Fingerprint(ed2)).toBe(EXPECTED.e1);
    expect(CryptoUtils.pq1Fingerprint(ml2.publicKey)).toBe(EXPECTED.pq1);
  });
});
