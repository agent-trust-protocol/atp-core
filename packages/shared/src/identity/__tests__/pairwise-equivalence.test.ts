/**
 * Anti-drift contract test for pairwise (per-peer, unlinkable) did:atp key
 * derivation. The canonical implementation in @atp/shared
 * (`derivePairwiseHybridKeyPair` / `pairwisePeerSegment`), used by the identity
 * service, MUST be byte-identical to the SDK twin
 * (`CryptoUtils.deriveHybridKeyPairForPeer` / `pairwisePeerSegment`). Both are
 * pinned to the SAME known-answer vector below, so neither can drift without
 * failing CI — which would otherwise break cross-implementation unlinkability
 * and interop.
 *
 * The SDK is imported by relative path because `atp-sdk` is not on the internal
 * `@atp/*` module map.
 */
import { describe, it, expect } from '@jest/globals';
import {
  derivePairwiseHybridKeyPair,
  pairwisePeerSegment,
} from '../pairwise.js';
import { buildAtpV2Did } from '../did-atp.js';
import { CryptoUtils } from '../../../../sdk/src/utils/crypto';

const DOMAIN = 'agents.example.com';
// Fixed 32-byte master secret — identical to the SDK pairwise KAT.
const MASTER = new Uint8Array(32).fill(9);
const PEER_A = 'did:example:relying-party-1';
const PEER_B = 'did:example:relying-party-2';

// Known-answer vector, pinned identically in the SDK's did-pairwise.test.ts.
const KAT_SEGMENT = 'p_fad4fe7b41096f53e62fc34133eab6e7';
const KAT_DID =
  'did:atp:agents.example.com:p_fad4fe7b41096f53e62fc34133eab6e7:' +
  'e1_lmymt0BeCG1HJGFK7COftXLzJGOrDDNY1vmLYBMe5A0:' +
  'pq1_YQm0BqWxJDTUol5l-MGoy5N9fn6sEM7_Zx3g8MUe8rw';

describe('pairwise did:atp derivation — @atp/shared ⇆ atp-sdk equivalence', () => {
  it('shared derivation matches the pinned known-answer vector', async () => {
    const segment = pairwisePeerSegment(MASTER, PEER_A);
    expect(segment).toBe(KAT_SEGMENT);

    const kp = await derivePairwiseHybridKeyPair(MASTER, PEER_A);
    const did = buildAtpV2Did(DOMAIN, [segment], kp.ed25519.publicKey, kp.mlDsa65.publicKey);
    expect(did).toBe(KAT_DID);
  });

  it('shared and SDK produce byte-identical segments and keys for the same inputs', async () => {
    for (const peer of [PEER_A, PEER_B]) {
      expect(pairwisePeerSegment(MASTER, peer)).toBe(CryptoUtils.pairwisePeerSegment(MASTER, peer));

      const shared = await derivePairwiseHybridKeyPair(MASTER, peer);
      const sdk = await CryptoUtils.deriveHybridKeyPairForPeer(MASTER, peer);
      expect(Buffer.from(shared.ed25519.publicKey)).toEqual(Buffer.from(sdk.ed25519.publicKey));
      expect(Buffer.from(shared.ed25519.secretKey)).toEqual(Buffer.from(sdk.ed25519.secretKey));
      expect(Buffer.from(shared.mlDsa65.publicKey)).toEqual(Buffer.from(sdk.mlDsa65.publicKey));
    }
  });

  it('an explicit salt changes the shared derivation, matching the SDK', async () => {
    const salt = new Uint8Array([1, 2, 3]);
    expect(pairwisePeerSegment(MASTER, PEER_A, { salt })).toBe(
      CryptoUtils.pairwisePeerSegment(MASTER, PEER_A, { salt })
    );
    expect(pairwisePeerSegment(MASTER, PEER_A, { salt })).not.toBe(pairwisePeerSegment(MASTER, PEER_A));
  });

  it('validates inputs (weak master / empty peer)', async () => {
    await expect(derivePairwiseHybridKeyPair(new Uint8Array(16), PEER_A)).rejects.toThrow();
    expect(() => pairwisePeerSegment(MASTER, '')).toThrow();
  });
});
