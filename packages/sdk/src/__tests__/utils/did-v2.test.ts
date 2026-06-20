/**
 * Tests for the did:atp v2 identifier core — generator/parser for
 * did:atp:<domain>[:path...]:e1_<fp>:pq1_<fp> per the spec ABNF.
 */

import { DidAtp } from '../../utils/did';
import { CryptoUtils, HybridKeyPair } from '../../utils/crypto';

const FP43 = 'A'.repeat(43);
const E1 = `e1_${FP43}`;
const PQ1 = `pq1_${FP43}`;

describe('did:atp v2 identifier core', () => {
  let keyPair: HybridKeyPair;
  let did: string;

  beforeAll(async () => {
    keyPair = await CryptoUtils.generateHybridKeyPair();
    did = DidAtp.fromPublicKeys(
      'agents.example.com',
      ['billing'],
      keyPair.ed25519.publicKey,
      keyPair.mlDsa65.publicKey
    );
  });

  describe('fromPublicKeys / generate', () => {
    it('builds a path DID with e1_ and pq1_ trailing segments', () => {
      expect(did).toMatch(
        /^did:atp:agents\.example\.com:billing:e1_[A-Za-z0-9_-]{43}:pq1_[A-Za-z0-9_-]{43}$/
      );
    });

    it('embeds the RFC 7638 fingerprints of the binding keys', () => {
      const parsed = DidAtp.parse(did)!;
      expect(parsed.e1).toBe(CryptoUtils.e1Fingerprint(keyPair.ed25519.publicKey));
      expect(parsed.pq1).toBe(CryptoUtils.pq1Fingerprint(keyPair.mlDsa65.publicKey));
    });

    it('supports multiple path segments', () => {
      const multi = DidAtp.fromPublicKeys(
        'example.com',
        ['a', 'b-c', 'd.e'],
        keyPair.ed25519.publicKey,
        keyPair.mlDsa65.publicKey
      );
      expect(DidAtp.parse(multi)!.path).toEqual(['a', 'b-c', 'd.e']);
    });

    it('generate() returns a keypair whose fingerprints match the DID', async () => {
      const result = await DidAtp.generate('example.com', ['agent']);
      expect(
        DidAtp.matchesPublicKeys(
          result.did,
          result.keyPair.ed25519.publicKey,
          result.keyPair.mlDsa65.publicKey
        )
      ).toBe(true);
    });

    it('rejects an empty path (path DIDs require >=1 segment)', () => {
      expect(() =>
        DidAtp.fromPublicKeys('example.com', [], keyPair.ed25519.publicKey, keyPair.mlDsa65.publicKey)
      ).toThrow(/at least one path segment/);
    });

    it('rejects invalid domains', () => {
      for (const bad of ['Example.com', 'exa mple.com', '-example.com', '', 'exa_mple.com']) {
        expect(() =>
          DidAtp.fromPublicKeys(bad, ['x'], keyPair.ed25519.publicKey, keyPair.mlDsa65.publicKey)
        ).toThrow(/Invalid did:atp domain/);
      }
    });

    it('rejects invalid and fingerprint-shaped path segments', () => {
      expect(() =>
        DidAtp.fromPublicKeys('example.com', ['bad/seg'], keyPair.ed25519.publicKey, keyPair.mlDsa65.publicKey)
      ).toThrow(/Invalid did:atp path segment/);
      expect(() =>
        DidAtp.fromPublicKeys('example.com', [E1], keyPair.ed25519.publicKey, keyPair.mlDsa65.publicKey)
      ).toThrow(/ambiguous/);
    });

    it('there is no network segment in v2 identifiers', () => {
      expect(did).not.toContain('mainnet');
      expect(did).not.toContain('testnet');
    });
  });

  describe('rootDid', () => {
    it('builds a domain-only root DID', () => {
      expect(DidAtp.rootDid('example.com')).toBe('did:atp:example.com');
    });

    it('accepts a did:web-style percent-encoded port', () => {
      expect(DidAtp.rootDid('localhost%3A8443')).toBe('did:atp:localhost%3A8443');
    });
  });

  describe('parse', () => {
    it('parses a root DID', () => {
      expect(DidAtp.parse('did:atp:example.com')).toEqual({
        did: 'did:atp:example.com',
        type: 'root',
        domain: 'example.com',
        path: [],
        fragment: undefined
      });
    });

    it('parses a path DID with fingerprints', () => {
      const parsed = DidAtp.parse(`did:atp:agents.example.com:billing:${E1}:${PQ1}`);
      expect(parsed).toMatchObject({
        type: 'path',
        domain: 'agents.example.com',
        path: ['billing'],
        e1: E1,
        pq1: PQ1
      });
    });

    it('parses and strips a fragment', () => {
      const parsed = DidAtp.parse(`did:atp:example.com:billing:${E1}:${PQ1}#key-mldsa65`);
      expect(parsed!.fragment).toBe('key-mldsa65');
      expect(parsed!.did).toBe(`did:atp:example.com:billing:${E1}:${PQ1}`);
    });

    it('rejects a path DID with no path segments before the fingerprints', () => {
      expect(DidAtp.parse(`did:atp:example.com:${E1}:${PQ1}`)).toBeNull();
    });

    it('rejects missing or swapped fingerprint segments', () => {
      expect(DidAtp.parse(`did:atp:example.com:billing:${E1}`)).toBeNull();
      expect(DidAtp.parse(`did:atp:example.com:billing:${PQ1}:${E1}`)).toBeNull();
      expect(DidAtp.parse(`did:atp:example.com:billing:${PQ1}`)).toBeNull();
    });

    it('rejects fingerprints with the wrong length or alphabet', () => {
      expect(DidAtp.parse(`did:atp:example.com:billing:e1_${'A'.repeat(42)}:${PQ1}`)).toBeNull();
      expect(DidAtp.parse(`did:atp:example.com:billing:e1_${'A'.repeat(44)}:${PQ1}`)).toBeNull();
      expect(DidAtp.parse(`did:atp:example.com:billing:e1_${'+'.repeat(43)}:${PQ1}`)).toBeNull();
    });

    it('rejects legacy v1 identifiers (network segment, sha256 fingerprint)', () => {
      expect(DidAtp.parse('did:atp:mainnet:abc123def456')).toBeNull();
    });

    it('rejects other methods and malformed strings', () => {
      expect(DidAtp.parse('did:web:example.com')).toBeNull();
      expect(DidAtp.parse('did:atp:')).toBeNull();
      expect(DidAtp.parse('not-a-did')).toBeNull();
      expect(DidAtp.parse(`did:atp:example.com:billing:${E1}:${PQ1}#`)).toBeNull();
    });

    it('rejects path DIDs whose path segment contains illegal characters', () => {
      // Exercises parse()'s own per-segment PATH_SEGMENT_RE guard, not just
      // the create-time assertPath() — a hand-built DID string must still be
      // rejected when a middle segment uses chars outside [A-Za-z0-9._-].
      for (const bad of ['ba~d', 'b!ad', 'b@d', 'b+d', 'b d', 'b%3Ad']) {
        expect(DidAtp.parse(`did:atp:example.com:${bad}:${E1}:${PQ1}`)).toBeNull();
      }
    });

    it('rejects a fingerprint-shaped middle path segment (ambiguous) on parse', () => {
      // A path segment that itself looks like e1_/pq1_ would make the trailing
      // binding fingerprints ambiguous; parse() must reject it directly.
      expect(DidAtp.parse(`did:atp:example.com:${E1}:billing:${E1}:${PQ1}`)).toBeNull();
      expect(DidAtp.parse(`did:atp:example.com:${PQ1}:billing:${E1}:${PQ1}`)).toBeNull();
    });

    it('accepts a valid multi-segment path on parse and preserves order', () => {
      const parsed = DidAtp.parse(`did:atp:example.com:user:alice:agent-7:${E1}:${PQ1}`);
      expect(parsed).not.toBeNull();
      expect(parsed!.path).toEqual(['user', 'alice', 'agent-7']);
    });

    it('round-trips a generated DID', () => {
      const parsed = DidAtp.parse(did)!;
      expect(parsed.did).toBe(did);
      expect(parsed.type).toBe('path');
    });
  });

  describe('isValid', () => {
    it('accepts valid root and path DIDs', () => {
      expect(DidAtp.isValid('did:atp:example.com')).toBe(true);
      expect(DidAtp.isValid(did)).toBe(true);
    });

    it('rejects invalid DIDs', () => {
      expect(DidAtp.isValid('did:atp:mainnet:abc')).toBe(false);
      expect(DidAtp.isValid('')).toBe(false);
    });
  });

  describe('matchesPublicKeys', () => {
    it('accepts the binding keys the DID was created from', () => {
      expect(
        DidAtp.matchesPublicKeys(did, keyPair.ed25519.publicKey, keyPair.mlDsa65.publicKey)
      ).toBe(true);
    });

    it('rejects when either key is substituted', async () => {
      const other = await CryptoUtils.generateHybridKeyPair();
      expect(
        DidAtp.matchesPublicKeys(did, other.ed25519.publicKey, keyPair.mlDsa65.publicKey)
      ).toBe(false);
      expect(
        DidAtp.matchesPublicKeys(did, keyPair.ed25519.publicKey, other.mlDsa65.publicKey)
      ).toBe(false);
    });

    it('rejects root DIDs (no fingerprints to match)', () => {
      expect(
        DidAtp.matchesPublicKeys('did:atp:example.com', keyPair.ed25519.publicKey, keyPair.mlDsa65.publicKey)
      ).toBe(false);
    });
  });
});
