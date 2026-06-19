/**
 * Tests for the did:atp v2 key model — split Ed25519 / ML-DSA-65 keypairs,
 * RFC 7638 JWK thumbprints, e1_/pq1_ fingerprints.
 */

import {
  CryptoUtils,
  HybridKeyPair,
  ED25519_PUBLIC_KEY_BYTES,
  ML_DSA_65_PUBLIC_KEY_BYTES,
  ML_DSA_65_SIGNATURE_BYTES
} from '../../utils/crypto';

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
  });
});
