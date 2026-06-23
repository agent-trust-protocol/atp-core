/**
 * did:atp pairwise identifiers — per-peer, unlinkable DIDs.
 *
 * A pairwise DID presents a DIFFERENT, uncorrelatable did:atp to each peer,
 * derived deterministically from a master secret so the agent can recompute the
 * keypair on demand. Covered:
 *   - determinism (same master+peer => same DID/keys; known-answer vector)
 *   - unlinkability (different peers/masters => independent DIDs & fingerprints)
 *   - the DID is a well-formed path-type did:atp that parses & key-matches
 *   - control proof (sign with the derived hybrid keypair, both bindings)
 *   - input validation
 *
 * Part of conformance item 1 (did:atp — create / parse / resolve).
 */

import { DidAtp } from '../../utils/did';
import { CryptoUtils } from '../../utils/crypto';

const DOMAIN = 'agents.example.com';
// Fixed 32-byte master secret for the deterministic known-answer vectors.
const MASTER = new Uint8Array(32).fill(9);
const PEER_A = 'did:example:relying-party-1';
const PEER_B = 'did:example:relying-party-2';

// Known-answer vector: did:atp pairwise DID for (DOMAIN, MASTER.fill(9), PEER_A),
// computed independently from the documented HKDF derivation.
const KAT_SEGMENT = 'p_fad4fe7b41096f53e62fc34133eab6e7';
const KAT_DID =
  'did:atp:agents.example.com:p_fad4fe7b41096f53e62fc34133eab6e7:' +
  'e1_lmymt0BeCG1HJGFK7COftXLzJGOrDDNY1vmLYBMe5A0:' +
  'pq1_YQm0BqWxJDTUol5l-MGoy5N9fn6sEM7_Zx3g8MUe8rw';

describe('did:atp pairwise (per-peer unlinkable DIDs)', () => {
  describe('deterministic derivation (known-answer)', () => {
    it('produces the pinned DID + pseudonym segment for a fixed master/peer', async () => {
      const { did, peerSegment } = await DidAtp.generatePairwise(DOMAIN, MASTER, PEER_A);
      expect(peerSegment).toBe(KAT_SEGMENT);
      expect(did).toBe(KAT_DID);
    });

    it('is reproducible — re-derivation yields identical keys and DID', async () => {
      const a = await DidAtp.generatePairwise(DOMAIN, MASTER, PEER_A);
      const b = await DidAtp.generatePairwise(DOMAIN, MASTER, PEER_A);
      expect(b.did).toBe(a.did);
      expect(b.peerSegment).toBe(a.peerSegment);
      expect(Buffer.from(b.keyPair.ed25519.publicKey)).toEqual(Buffer.from(a.keyPair.ed25519.publicKey));
      expect(Buffer.from(b.keyPair.ed25519.secretKey)).toEqual(Buffer.from(a.keyPair.ed25519.secretKey));
      expect(Buffer.from(b.keyPair.mlDsa65.publicKey)).toEqual(Buffer.from(a.keyPair.mlDsa65.publicKey));
    });
  });

  describe('unlinkability', () => {
    it('different peers yield independent DIDs, segments and BOTH fingerprints', async () => {
      const a = await DidAtp.generatePairwise(DOMAIN, MASTER, PEER_A);
      const b = await DidAtp.generatePairwise(DOMAIN, MASTER, PEER_B);
      expect(b.did).not.toBe(a.did);
      expect(b.peerSegment).not.toBe(a.peerSegment);
      const pa = DidAtp.parse(a.did)!;
      const pb = DidAtp.parse(b.did)!;
      expect(pb.e1).not.toBe(pa.e1);
      expect(pb.pq1).not.toBe(pa.pq1);
    });

    it('a different master secret yields a different DID for the same peer', async () => {
      const a = await DidAtp.generatePairwise(DOMAIN, MASTER, PEER_A);
      const other = new Uint8Array(32).fill(11);
      const b = await DidAtp.generatePairwise(DOMAIN, other, PEER_A);
      expect(b.did).not.toBe(a.did);
    });

    it('an explicit salt changes the derivation', async () => {
      const a = await DidAtp.generatePairwise(DOMAIN, MASTER, PEER_A);
      const b = await DidAtp.generatePairwise(DOMAIN, MASTER, PEER_A, { salt: new Uint8Array([1, 2, 3]) });
      expect(b.did).not.toBe(a.did);
    });
  });

  describe('well-formedness', () => {
    it('is a valid path-type did:atp whose single path segment is the pseudonym', async () => {
      const { did, peerSegment } = await DidAtp.generatePairwise(DOMAIN, MASTER, PEER_A);
      expect(DidAtp.isValid(did)).toBe(true);
      const parsed = DidAtp.parse(did)!;
      expect(parsed.type).toBe('path');
      expect(parsed.domain).toBe(DOMAIN);
      expect(parsed.path).toEqual([peerSegment]);
    });

    it('the pseudonym segment is not fingerprint-shaped', () => {
      const seg = CryptoUtils.pairwisePeerSegment(MASTER, PEER_A);
      expect(seg).toMatch(/^p_[0-9a-f]{32}$/);
      expect(seg.startsWith('e1_')).toBe(false);
      expect(seg.startsWith('pq1_')).toBe(false);
    });

    it('the DID fingerprints match the derived public keys', async () => {
      const { did, keyPair } = await DidAtp.generatePairwise(DOMAIN, MASTER, PEER_A);
      expect(
        DidAtp.matchesPublicKeys(did, keyPair.ed25519.publicKey, keyPair.mlDsa65.publicKey),
      ).toBe(true);
    });
  });

  describe('control proof (both bindings)', () => {
    it('signs and verifies with the derived hybrid keypair, and rejects tampering', async () => {
      const { keyPair } = await DidAtp.generatePairwise(DOMAIN, MASTER, PEER_A);
      const msg = 'pairwise-control-challenge';

      const edSig = await CryptoUtils.signEd25519(msg, keyPair.ed25519.secretKey);
      expect(await CryptoUtils.verifyEd25519(msg, edSig, keyPair.ed25519.publicKey)).toBe(true);
      expect(await CryptoUtils.verifyEd25519('other', edSig, keyPair.ed25519.publicKey)).toBe(false);

      const pqSig = CryptoUtils.signMlDsa65(msg, keyPair.mlDsa65.secretKey);
      expect(CryptoUtils.verifyMlDsa65(msg, pqSig, keyPair.mlDsa65.publicKey)).toBe(true);
      expect(CryptoUtils.verifyMlDsa65('other', pqSig, keyPair.mlDsa65.publicKey)).toBe(false);
    });

    it("another peer's keypair cannot satisfy this DID's bindings (unlinkable + unforgeable)", async () => {
      const a = await DidAtp.generatePairwise(DOMAIN, MASTER, PEER_A);
      const b = await DidAtp.generatePairwise(DOMAIN, MASTER, PEER_B);
      expect(
        DidAtp.matchesPublicKeys(a.did, b.keyPair.ed25519.publicKey, b.keyPair.mlDsa65.publicKey),
      ).toBe(false);
    });
  });

  describe('input validation', () => {
    it('rejects a master secret shorter than 32 bytes', async () => {
      await expect(DidAtp.generatePairwise(DOMAIN, new Uint8Array(16), PEER_A)).rejects.toThrow();
    });

    it('rejects an empty peerId', async () => {
      await expect(DidAtp.generatePairwise(DOMAIN, MASTER, '')).rejects.toThrow();
    });

    it('rejects an invalid domain', async () => {
      await expect(DidAtp.generatePairwise('Not A Domain', MASTER, PEER_A)).rejects.toThrow();
    });

    it('pairwisePeerSegment validates its inputs directly (weak master / empty peer)', () => {
      expect(() => CryptoUtils.pairwisePeerSegment(new Uint8Array(8), PEER_A)).toThrow();
      expect(() => CryptoUtils.pairwisePeerSegment(MASTER, '')).toThrow();
      expect(CryptoUtils.pairwisePeerSegment(MASTER, PEER_A)).toMatch(/^p_[0-9a-f]{32}$/);
    });
  });
});
