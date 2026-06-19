/**
 * did:atp v2 DID Document tests — dual-VM document, dual-proof verification.
 * Identifier-syntax tests live in did-v2.test.ts.
 */

import { DidAtpDocument } from '../../utils/did-document';
import { DidAtp } from '../../utils/did';
import { CryptoUtils, HybridKeyPair } from '../../utils/crypto';
import { jcsCanonicalize } from '../../utils/jcs';
import { AtpDidDocument } from '../../types';

const DOMAIN = 'agents.example.com';
const PATH = ['billing'];

// W3C did:key Ed25519 test vector (did:key spec / vc-di-eddsa).
const DID_KEY_VECTOR = 'z6MkiTBz1ymuepAQ4HEHYSF1H8quG5GLVVQR3djdX3mDooWp';

describe('jcsCanonicalize (RFC 8785)', () => {
  it('sorts object members lexicographically with no whitespace', () => {
    expect(jcsCanonicalize({ b: 2, a: [true, null, 'x'], c: { z: 1, y: 2 } })).toBe(
      '{"a":[true,null,"x"],"b":2,"c":{"y":2,"z":1}}'
    );
  });

  it('drops undefined members and escapes strings via JSON.stringify', () => {
    expect(jcsCanonicalize({ a: undefined, b: 'a"b' })).toBe('{"b":"a\\"b"}');
  });
});

describe('Multikey encoding', () => {
  it('matches the did:key Ed25519 test vector (multicodec 0xed01, base58btc)', () => {
    const raw = DidAtpDocument.multibaseToEd25519(DID_KEY_VECTOR);
    expect(raw.length).toBe(32);
    expect(DidAtpDocument.ed25519ToMultibase(raw)).toBe(DID_KEY_VECTOR);
  });

  it('rejects wrong multibase prefix and wrong key length', () => {
    expect(() => DidAtpDocument.multibaseToEd25519('f00ff')).toThrow(/base58btc/);
    expect(() => DidAtpDocument.ed25519ToMultibase(new Uint8Array(31))).toThrow(/32 bytes/);
  });
});

describe('DidAtpDocument', () => {
  let keyPair: HybridKeyPair;
  let did: string;
  let document: AtpDidDocument;

  beforeAll(async () => {
    keyPair = await CryptoUtils.generateHybridKeyPair();
    ({ did, document } = await DidAtpDocument.create(DOMAIN, PATH, keyPair));
  }, 60000);

  describe('create', () => {
    it('produces a path-type DID whose fingerprints match the keys', () => {
      const parsed = DidAtp.parse(did)!;
      expect(parsed.type).toBe('path');
      expect(parsed.e1).toBe(CryptoUtils.e1Fingerprint(keyPair.ed25519.publicKey));
      expect(parsed.pq1).toBe(CryptoUtils.pq1Fingerprint(keyPair.mlDsa65.publicKey));
    });

    it('has the classical Multikey VM first and the ML-DSA-65 JsonWebKey VM second', () => {
      const [vm0, vm1] = document.verificationMethod;
      expect(vm0.type).toBe('Multikey');
      expect(vm0.id).toBe(`${did}#key-ed25519`);
      expect(vm0.publicKeyMultibase!.startsWith('z')).toBe(true);
      expect(DidAtpDocument.multibaseToEd25519(vm0.publicKeyMultibase!)).toEqual(
        keyPair.ed25519.publicKey
      );

      expect(vm1.type).toBe('JsonWebKey');
      expect(vm1.id).toBe(`${did}#key-mldsa65`);
      expect(vm1.publicKeyJwk).toEqual({
        kty: 'AKP',
        alg: 'ML-DSA-65',
        pub: CryptoUtils.base64url(keyPair.mlDsa65.publicKey)
      });
    });

    it('authorizes both verification methods for authentication', () => {
      expect(document.authentication).toEqual([`${did}#key-ed25519`, `${did}#key-mldsa65`]);
    });

    it('carries both proofs: eddsa-jcs-2022 Data Integrity and ML-DSA-65 JWS', () => {
      expect(document.proof).toMatchObject({
        type: 'DataIntegrityProof',
        cryptosuite: 'eddsa-jcs-2022',
        verificationMethod: `${did}#key-ed25519`
      });
      expect(document.atpPqProof).toMatchObject({
        type: 'AtpPqProof',
        verificationMethod: `${did}#key-mldsa65`
      });
      expect(document.atpPqProof!.jws.split('.')).toHaveLength(3);
      const header = JSON.parse(
        Buffer.from(document.atpPqProof!.jws.split('.')[0], 'base64url').toString('utf8')
      );
      expect(header.alg).toBe('ML-DSA-65');
    });
  });

  describe('verify', () => {
    it('accepts a freshly created document', async () => {
      const result = await DidAtpDocument.verify(document);
      expect(result.errors).toEqual([]);
      expect(result.valid).toBe(true);
    });

    it('rejects a document whose id is not a path-type did:atp', async () => {
      const result = await DidAtpDocument.verify({ ...document, id: `did:atp:${DOMAIN}` });
      expect(result.valid).toBe(false);
    });

    it('rejects when the classical VM key does not match the e1_ segment', async () => {
      const otherKeys = await CryptoUtils.generateHybridKeyPair();
      const tampered: AtpDidDocument = {
        ...document,
        verificationMethod: [
          {
            ...document.verificationMethod[0],
            publicKeyMultibase: DidAtpDocument.ed25519ToMultibase(otherKeys.ed25519.publicKey)
          },
          document.verificationMethod[1]
        ]
      };
      const result = await DidAtpDocument.verify(tampered);
      expect(result.valid).toBe(false);
      expect(result.errors.join()).toMatch(/e1_ fingerprint/);
    }, 60000);

    it('rejects when the AKP JWK does not match the pq1_ segment', async () => {
      const otherKeys = await CryptoUtils.generateHybridKeyPair();
      const tampered: AtpDidDocument = {
        ...document,
        verificationMethod: [
          document.verificationMethod[0],
          {
            ...document.verificationMethod[1],
            publicKeyJwk: CryptoUtils.mlDsa65PublicKeyToJwk(otherKeys.mlDsa65.publicKey)
          }
        ]
      };
      const result = await DidAtpDocument.verify(tampered);
      expect(result.valid).toBe(false);
      expect(result.errors.join()).toMatch(/pq1_ fingerprint/);
    }, 60000);

    it('rejects a document with either proof missing', async () => {
      const { proof: _p, ...noClassical } = document;
      const { atpPqProof: _q, ...noPq } = document;
      expect((await DidAtpDocument.verify(noClassical as AtpDidDocument)).valid).toBe(false);
      expect((await DidAtpDocument.verify(noPq as AtpDidDocument)).valid).toBe(false);
    });

    it('rejects content tampering (both proofs fail)', async () => {
      const tampered: AtpDidDocument = {
        ...document,
        service: [{ id: `${did}#evil`, type: 'Evil', serviceEndpoint: 'https://evil.example' }]
      };
      const result = await DidAtpDocument.verify(tampered);
      expect(result.valid).toBe(false);
      expect(result.errors.join()).toMatch(/eddsa-jcs-2022 proof verification failed/);
      expect(result.errors.join()).toMatch(/ML-DSA-65 JWS verification failed/);
    });

    it('catches a forged classical proof via the post-quantum check', async () => {
      // Simulate a future adversary who can forge Ed25519 (here: a leaked
      // classical key) re-signing a tampered document. The classical proof
      // verifies, but the ML-DSA-65 JWS over the same document does not —
      // per spec, a valid classical proof alone is never sufficient.
      const { proof: _proof, atpPqProof, ...unsigned } = document;
      const tamperedUnsigned: AtpDidDocument = {
        ...(unsigned as AtpDidDocument),
        service: [{ id: `${did}#mitm`, type: 'Attack', serviceEndpoint: 'https://mitm.example' }]
      };
      const forged = await (DidAtpDocument as any).signClassicalProof(
        tamperedUnsigned,
        keyPair.ed25519.secretKey,
        `${did}#key-ed25519`,
        new Date().toISOString()
      );

      // The forged classical proof is valid on its own…
      expect(
        await DidAtpDocument.verifyClassicalProof(tamperedUnsigned, forged, keyPair.ed25519.publicKey)
      ).toBe(true);

      // …but full verification fails because the PQ JWS no longer matches.
      const result = await DidAtpDocument.verify({
        ...tamperedUnsigned,
        proof: forged,
        atpPqProof
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['atpPqProof ML-DSA-65 JWS verification failed']);
    });

    it('verifies a document round-tripped through JSON (did.json simulation)', async () => {
      const roundTripped = JSON.parse(JSON.stringify(document));
      expect((await DidAtpDocument.verify(roundTripped)).valid).toBe(true);
    });
  });
});
