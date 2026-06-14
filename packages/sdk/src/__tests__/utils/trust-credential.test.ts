/**
 * Tests for the TrustCredential — the ATP trust score issued and verified as a
 * W3C Verifiable Credential (VC v2) with an eddsa-jcs-2022 Data Integrity proof
 * and an optional RFC 9964 ML-DSA-65 atpPqProof.
 *
 * Covers: issue -> verify (valid), tamper rejection, wrong-issuer rejection,
 * expiry rejection, the post-quantum proof path, revocation honesty, and
 * "derive trust from a verified VC".
 */

import { CryptoUtils, HybridKeyPair } from '../../utils/crypto';
import { TrustScoring, TrustLevel, InteractionEvent } from '../../utils/trust';
import {
  issueTrustCredential,
  verifyTrustCredential,
  TrustCredential,
  TrustCredentialVerifyKeys,
  VC_V2_CONTEXT,
  TRUST_CREDENTIAL_TYPE,
  TRUST_CREDENTIAL_CRYPTOSUITE
} from '../../utils/trust-credential';

const ISSUER_DID = 'did:atp:trust.example:e1_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:pq1_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const SUBJECT_DID = 'did:atp:agents.example:e1_ccccccccccccccccccccccccccccccccccccccccccc:pq1_ddddddddddddddddddddddddddddddddddddddddddd';

describe('TrustCredential', () => {
  let issuerKeys: HybridKeyPair;
  let verifyKeys: TrustCredentialVerifyKeys;

  // A representative trust score from the real scoring engine.
  const interactions: InteractionEvent[] = Array.from({ length: 25 }, (_, i) => ({
    timestamp: new Date(Date.now() - i * 60_000).toISOString(),
    action: 'tool.call',
    success: i % 5 !== 0
  }));
  const score = new TrustScoring().calculateTrustScore(interactions, 3);

  beforeAll(async () => {
    issuerKeys = await CryptoUtils.generateHybridKeyPair();
    verifyKeys = {
      ed25519PublicKey: issuerKeys.ed25519.publicKey,
      mlDsa65PublicKey: issuerKeys.mlDsa65.publicKey
    };
  });

  describe('issueTrustCredential', () => {
    it('produces a well-formed VC v2 TrustCredential', async () => {
      const vc = await issueTrustCredential({
        score,
        issuerDid: ISSUER_DID,
        subjectDid: SUBJECT_DID,
        keyPair: issuerKeys
      });

      expect(vc['@context']).toContain(VC_V2_CONTEXT);
      expect(vc.type).toEqual(['VerifiableCredential', TRUST_CREDENTIAL_TYPE]);
      expect(vc.issuer).toBe(ISSUER_DID);
      expect(vc.credentialSubject.id).toBe(SUBJECT_DID);
      expect(vc.credentialSubject.trustScore).toBe(score.score);
      expect(vc.credentialSubject.trustLevel).toBe(score.level);
      expect(vc.credentialSubject.factors).toEqual(score.factors);
      expect(vc.id).toMatch(/^urn:atp:trustcredential:/);
    });

    it('signs an eddsa-jcs-2022 Data Integrity proof', async () => {
      const vc = await issueTrustCredential({
        score,
        issuerDid: ISSUER_DID,
        subjectDid: SUBJECT_DID,
        keyPair: issuerKeys
      });

      expect(vc.proof.type).toBe('DataIntegrityProof');
      expect(vc.proof.cryptosuite).toBe(TRUST_CREDENTIAL_CRYPTOSUITE);
      expect(vc.proof.proofPurpose).toBe('assertionMethod');
      expect(vc.proof.verificationMethod).toBe(`${ISSUER_DID}#key-ed25519`);
      // multibase base58btc, same encoding as the DID Document proof.
      expect(vc.proof.proofValue.startsWith('z')).toBe(true);
      // by default no post-quantum proof is attached.
      expect(vc.atpPqProof).toBeUndefined();
    });

    it('uses the score assessedAt as issuanceDate', async () => {
      const vc = await issueTrustCredential({
        score,
        issuerDid: ISSUER_DID,
        subjectDid: SUBJECT_DID,
        keyPair: issuerKeys
      });
      expect(vc.issuanceDate).toBe(score.metadata.assessedAt);
    });

    it('honours a caller-supplied id and expirationDate', async () => {
      const vc = await issueTrustCredential({
        score,
        issuerDid: ISSUER_DID,
        subjectDid: SUBJECT_DID,
        keyPair: issuerKeys,
        id: 'urn:uuid:fixed-id',
        expirationDate: '2999-01-01T00:00:00.000Z'
      });
      expect(vc.id).toBe('urn:uuid:fixed-id');
      expect(vc.expirationDate).toBe('2999-01-01T00:00:00.000Z');
    });
  });

  describe('verifyTrustCredential — valid path', () => {
    it('accepts a freshly issued credential and reports clean checks', async () => {
      const vc = await issueTrustCredential({
        score,
        issuerDid: ISSUER_DID,
        subjectDid: SUBJECT_DID,
        keyPair: issuerKeys
      });

      const result = await verifyTrustCredential(vc, verifyKeys);
      expect(result.errors).toEqual([]);
      expect(result.valid).toBe(true);
      expect(result.checks.structure).toBe(true);
      expect(result.checks.classicalProof).toBe(true);
      expect(result.checks.pqProof).toBe('skipped');
      expect(result.checks.revocation).toBe('unchecked');
    });

    it('derives the trust claim from a verified VC', async () => {
      const vc = await issueTrustCredential({
        score,
        issuerDid: ISSUER_DID,
        subjectDid: SUBJECT_DID,
        keyPair: issuerKeys
      });

      const result = await verifyTrustCredential(vc, verifyKeys);
      expect(result.valid).toBe(true);
      expect(result.claim).toBeDefined();
      expect(result.claim!.subjectDid).toBe(SUBJECT_DID);
      expect(result.claim!.issuerDid).toBe(ISSUER_DID);
      expect(result.claim!.trustScore).toBe(score.score);
      expect(result.claim!.trustLevel).toBe(score.level);
      expect(result.claim!.factors).toEqual(score.factors);
      expect(result.claim!.confidence).toBe(score.confidence);
      expect(Object.values(TrustLevel)).toContain(result.claim!.trustLevel);
    });
  });

  describe('verifyTrustCredential — failure modes', () => {
    it('rejects a tampered trustScore', async () => {
      const vc = await issueTrustCredential({
        score,
        issuerDid: ISSUER_DID,
        subjectDid: SUBJECT_DID,
        keyPair: issuerKeys
      });
      const tampered: TrustCredential = {
        ...vc,
        credentialSubject: { ...vc.credentialSubject, trustScore: 0.99 }
      };

      const result = await verifyTrustCredential(tampered, verifyKeys);
      expect(result.valid).toBe(false);
      expect(result.checks.classicalProof).toBe(false);
      expect(result.errors.join()).toMatch(/eddsa-jcs-2022 proof verification failed/);
    });

    it('rejects a tampered factor block', async () => {
      const vc = await issueTrustCredential({
        score,
        issuerDid: ISSUER_DID,
        subjectDid: SUBJECT_DID,
        keyPair: issuerKeys
      });
      const tampered: TrustCredential = {
        ...vc,
        credentialSubject: {
          ...vc.credentialSubject,
          factors: { ...vc.credentialSubject.factors, credentialScore: 1 }
        }
      };

      const result = await verifyTrustCredential(tampered, verifyKeys);
      expect(result.valid).toBe(false);
    });

    it('rejects a credential signed by a different issuer key', async () => {
      const vc = await issueTrustCredential({
        score,
        issuerDid: ISSUER_DID,
        subjectDid: SUBJECT_DID,
        keyPair: issuerKeys
      });
      const otherKeys = await CryptoUtils.generateHybridKeyPair();

      const result = await verifyTrustCredential(vc, {
        ed25519PublicKey: otherKeys.ed25519.publicKey
      });
      expect(result.valid).toBe(false);
      expect(result.errors.join()).toMatch(/eddsa-jcs-2022 proof verification failed/);
    });

    it('rejects an expired credential', async () => {
      const vc = await issueTrustCredential({
        score,
        issuerDid: ISSUER_DID,
        subjectDid: SUBJECT_DID,
        keyPair: issuerKeys,
        expirationDate: '2000-01-01T00:00:00.000Z'
      });

      const result = await verifyTrustCredential(vc, verifyKeys);
      expect(result.valid).toBe(false);
      expect(result.checks.expiration).toBe(false);
      expect(result.errors.join()).toMatch(/expired/);
    });

    it('rejects a credential missing the VC v2 context', async () => {
      const vc = await issueTrustCredential({
        score,
        issuerDid: ISSUER_DID,
        subjectDid: SUBJECT_DID,
        keyPair: issuerKeys
      });
      const broken: TrustCredential = { ...vc, '@context': ['https://example.com/other'] };

      const result = await verifyTrustCredential(broken, verifyKeys);
      expect(result.valid).toBe(false);
      expect(result.checks.structure).toBe(false);
      expect(result.errors.join()).toMatch(/VC v2 context/);
    });

    it('treats a present credentialStatus as an honest conformance gap', async () => {
      const vc = await issueTrustCredential({
        score,
        issuerDid: ISSUER_DID,
        subjectDid: SUBJECT_DID,
        keyPair: issuerKeys
      });
      const withStatus = {
        ...vc,
        credentialStatus: { id: 'https://example.com/status/1', type: 'StatusList2021Entry' }
      } as TrustCredential;

      const result = await verifyTrustCredential(withStatus, verifyKeys);
      expect(result.valid).toBe(false);
      expect(result.checks.revocation).toBe('unchecked');
      expect(result.errors.join()).toMatch(/revocation\/status-list checking is not implemented/);
    });
  });

  describe('post-quantum atpPqProof', () => {
    it('issues and verifies an ML-DSA-65 atpPqProof', async () => {
      const vc = await issueTrustCredential({
        score,
        issuerDid: ISSUER_DID,
        subjectDid: SUBJECT_DID,
        keyPair: issuerKeys,
        withPqProof: true
      });

      expect(vc.atpPqProof).toBeDefined();
      expect(vc.atpPqProof!.type).toBe('AtpPqProof');
      expect(vc.atpPqProof!.verificationMethod).toBe(`${ISSUER_DID}#key-mldsa65`);
      expect(vc.atpPqProof!.jws.split('.')).toHaveLength(3);

      const result = await verifyTrustCredential(vc, verifyKeys);
      expect(result.errors).toEqual([]);
      expect(result.valid).toBe(true);
      expect(result.checks.pqProof).toBe(true);
    });

    it('rejects a tampered credential under the post-quantum proof too', async () => {
      const vc = await issueTrustCredential({
        score,
        issuerDid: ISSUER_DID,
        subjectDid: SUBJECT_DID,
        keyPair: issuerKeys,
        withPqProof: true
      });
      const tampered: TrustCredential = {
        ...vc,
        credentialSubject: { ...vc.credentialSubject, confidence: 0.123456 }
      };

      const result = await verifyTrustCredential(tampered, verifyKeys);
      expect(result.valid).toBe(false);
      expect(result.checks.classicalProof).toBe(false);
      expect(result.checks.pqProof).toBe(false);
      expect(result.errors.join()).toMatch(/ML-DSA-65 JWS verification failed/);
    });

    it('flags an atpPqProof that cannot be verified without the PQ key', async () => {
      const vc = await issueTrustCredential({
        score,
        issuerDid: ISSUER_DID,
        subjectDid: SUBJECT_DID,
        keyPair: issuerKeys,
        withPqProof: true
      });

      const result = await verifyTrustCredential(vc, {
        ed25519PublicKey: issuerKeys.ed25519.publicKey
      });
      expect(result.valid).toBe(false);
      expect(result.errors.join()).toMatch(/no ML-DSA-65 public key/);
    });
  });
});
