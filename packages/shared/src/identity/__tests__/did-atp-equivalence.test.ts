/**
 * Anti-drift contract test: the canonical did:atp primitives in @atp/shared
 * MUST produce byte-identical output to the SDK's CryptoUtils/DidAtp. Both the
 * identity service (via @atp/shared) and external consumers (via atp-sdk) rely
 * on the same identifiers, so any divergence between the two implementations
 * must fail CI here.
 *
 * The SDK is imported by relative path because `atp-sdk` is not on the internal
 * `@atp/*` module map.
 */
import { describe, it, expect } from '@jest/globals';
import {
  atpBase64Url,
  atpJwkThumbprint,
  atpE1Fingerprint,
  atpPq1Fingerprint,
  buildAtpV2Did,
} from '../did-atp.js';
import { CryptoUtils } from '../../../../sdk/src/utils/crypto';
import { DidAtp } from '../../../../sdk/src/utils/did';

describe('did:atp primitives — @atp/shared ⇆ atp-sdk equivalence (anti-drift)', () => {
  it('fingerprints and path-DID construction match the SDK for the same keys', async () => {
    for (let i = 0; i < 5; i++) {
      const kp = await CryptoUtils.generateHybridKeyPair();
      const ed = kp.ed25519.publicKey;
      const ml = kp.mlDsa65.publicKey;

      expect(atpE1Fingerprint(ed)).toBe(CryptoUtils.e1Fingerprint(ed));
      expect(atpPq1Fingerprint(ml)).toBe(CryptoUtils.pq1Fingerprint(ml));

      const domain = 'agents.example.com';
      const path = ['billing', `agent-${i}`];
      expect(buildAtpV2Did(domain, path, ed, ml)).toBe(
        DidAtp.fromPublicKeys(domain, path, ed, ml),
      );
    }
  });

  it('rejects fingerprint-shaped path segments exactly like the SDK', async () => {
    const kp = await CryptoUtils.generateHybridKeyPair();
    const ed = kp.ed25519.publicKey;
    const ml = kp.mlDsa65.publicKey;
    const ambiguous = [`e1_${'A'.repeat(43)}`];

    // Both builders must throw on a fingerprint-shaped segment (no divergence
    // where shared mints a DID the SDK parser would reject).
    expect(() => buildAtpV2Did('example.com', ambiguous, ed, ml)).toThrow();
    expect(() => DidAtp.fromPublicKeys('example.com', ambiguous, ed, ml)).toThrow();

    // And a normal underscore-bearing segment is still accepted by both.
    const ok = ['agent_01'];
    expect(buildAtpV2Did('example.com', ok, ed, ml)).toBe(
      DidAtp.fromPublicKeys('example.com', ok, ed, ml),
    );
  });

  it('jwkThumbprint matches the SDK and the RFC 8037 §A.3 vector', () => {
    const jwk = {
      crv: 'Ed25519',
      kty: 'OKP',
      x: '11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo',
    };
    expect(atpJwkThumbprint(jwk)).toBe('kPrK_qmxVWaYVA9wwBF6Iuo3vVzz7TxHCTwXBygrS4k');
    expect(atpJwkThumbprint(jwk)).toBe(CryptoUtils.jwkThumbprint(jwk));
  });

  it('base64url matches the SDK', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    expect(atpBase64Url(bytes)).toBe(CryptoUtils.base64url(bytes));
  });
});
