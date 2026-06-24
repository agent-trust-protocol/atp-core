/**
 * did:atp published conformance test vectors — anti-drift contract.
 *
 * Loads the generated, publishable vectors (docs/specs/did-atp/test-vectors.json,
 * produced by scripts/gen-did-atp-vectors.ts) and asserts the production SDK
 * reproduces every one. This guarantees the vectors we ship to the W3C CG stay
 * byte-identical to the reference implementation: if the SDK's identifier,
 * fingerprint, or pairwise derivation ever changes, this suite fails and the
 * vectors must be regenerated.
 *
 * Part of conformance item 1 (did:atp — create / parse / resolve).
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { DidAtp } from '../../utils/did';
import { CryptoUtils } from '../../utils/crypto';

const VECTORS_PATH = resolve(__dirname, '../../../../../docs/specs/did-atp/test-vectors.json');
const vectors = JSON.parse(readFileSync(VECTORS_PATH, 'utf8'));

const fromHex = (h: string) => new Uint8Array(Buffer.from(h, 'hex'));

describe('did:atp published conformance vectors (anti-drift)', () => {
  it('declares the expected primitive sizes', () => {
    expect(vectors.primitives.thumbprintLength).toBe(43);
    expect(vectors.primitives.ed25519PublicKeyBytes).toBe(32);
    expect(vectors.primitives.mlDsa65PublicKeyBytes).toBe(1952);
  });

  describe('root identifiers', () => {
    it.each(vectors.rootIdentifiers as Array<{ domain: string; did: string }>)(
      'reproduces root DID for $domain',
      ({ domain, did }) => {
        expect(DidAtp.rootDid(domain)).toBe(did);
        const parsed = DidAtp.parse(did)!;
        expect(parsed.type).toBe('root');
        expect(parsed.domain).toBe(domain);
      }
    );
  });

  describe('path identifiers', () => {
    it.each(vectors.pathIdentifiers as Array<any>)(
      'reproduces fingerprints + DID for $did',
      (v) => {
        const ed = fromHex(v.ed25519PublicKeyHex);
        const ml = fromHex(v.mlDsa65PublicKeyHex);

        // Fingerprints recompute from the published public keys.
        expect(CryptoUtils.e1Fingerprint(ed)).toBe(v.e1);
        expect(CryptoUtils.pq1Fingerprint(ml)).toBe(v.pq1);
        // JWK thumbprints (the spec's fingerprint definition) match too.
        expect(`e1_${CryptoUtils.jwkThumbprint(v.ed25519Jwk)}`).toBe(v.e1);
        expect(`pq1_${CryptoUtils.jwkThumbprint(v.mlDsa65Jwk)}`).toBe(v.pq1);

        // Full identifier reconstructs and round-trips through the parser.
        const did = DidAtp.fromPublicKeys(v.domain, v.path, ed, ml);
        expect(did).toBe(v.did);
        const parsed = DidAtp.parse(v.did)!;
        expect(parsed.type).toBe('path');
        expect(parsed.domain).toBe(v.domain);
        expect(parsed.path).toEqual(v.path);
        expect(parsed.e1).toBe(v.e1);
        expect(parsed.pq1).toBe(v.pq1);
        expect(DidAtp.matchesPublicKeys(v.did, ed, ml)).toBe(true);
      }
    );
  });

  describe('pairwise identifiers', () => {
    it.each(vectors.pairwiseIdentifiers as Array<any>)(
      'reproduces pairwise DID for $peerId',
      async (v) => {
        const salt = v.saltHex ? fromHex(v.saltHex) : undefined;
        const { did, peerSegment } = await DidAtp.generatePairwise(
          v.domain,
          fromHex(v.masterSecretHex),
          v.peerId,
          { salt }
        );
        expect(peerSegment).toBe(v.peerSegment);
        expect(did).toBe(v.did);
      }
    );

    it('pairwise vectors are mutually unlinkable (distinct DIDs and bindings)', () => {
      const dids = (vectors.pairwiseIdentifiers as Array<{ did: string }>).map((v) => v.did);
      expect(new Set(dids).size).toBe(dids.length);
    });
  });

  describe('invalid identifiers', () => {
    it.each(vectors.invalidIdentifiers as Array<{ description: string; value: string }>)(
      'rejects: $description',
      ({ value }) => {
        expect(DidAtp.parse(value)).toBeNull();
        expect(DidAtp.isValid(value)).toBe(false);
      }
    );
  });
});
