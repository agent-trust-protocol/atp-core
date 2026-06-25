/**
 * ATP Trust Credential — issuance and present-side verification.
 *
 * An `AtpTrustCredential` is a W3C Verifiable Credential whose subject is an
 * agent DID and whose claims assert that agent's evaluated ATP trust level
 * (and optionally a numeric score) at a point in time. It lets a relying party
 * gate access on a *presented*, cryptographically verifiable credential rather
 * than having to query the trust-scoring engine directly.
 *
 * This service does NOT re-implement any crypto: issuance and verification go
 * through the existing `CredentialService` (Ed25519/ML-DSA proofs, expiry,
 * revocation, schema checks). It adds only the trust-specific schema, the
 * claim shaping, and a mapper into the policy evaluator's context type so a
 * verified credential can drive `PolicyEvaluator`'s `verifiable_credential` /
 * `trust_level` conditions unchanged.
 *
 * Spec/PoC: docs/specs/did-atp/ and proof/index.ts (`AtpTrustCredential`).
 */
import type { VerifiableCredentialInfo } from '@atp/shared';
import { VerifiableCredential, CredentialSchema } from '../models/credential.js';
import type { CredentialService } from './credential.js';

/** The credential `type` that marks an ATP Trust Credential. */
export const ATP_TRUST_CREDENTIAL_TYPE = 'AtpTrustCredential';

/**
 * Schema for the trust credential. `required` deliberately omits `id`: the
 * subject DID is supplied separately to `CredentialService.issueCredential`
 * (which validates the bare claims object before merging the subject `id`),
 * so marking `id` required would reject issuance. The subject `id` is still
 * present on the resulting credential and validated at verification time.
 */
export const ATP_TRUST_CREDENTIAL_SCHEMA: CredentialSchema = {
  id: 'atp:schema:trust-credential:v1',
  name: ATP_TRUST_CREDENTIAL_TYPE,
  description: "Asserts an ATP agent's evaluated trust level (and optional score) at a point in time.",
  version: '1.0.0',
  properties: {
    trustLevel: { type: 'string', description: 'Canonical ATP trust level (e.g. untrusted|basic|verified|premium|enterprise)', required: true },
    trustScore: { type: 'number', description: 'Numeric trust score (0–5)', required: false },
    evaluatedAt: { type: 'string', description: 'ISO-8601 timestamp the trust evaluation was made', required: true },
  },
  required: ['trustLevel', 'evaluatedAt'],
};

export interface IssueTrustCredentialRequest {
  /** DID of the agent whose trust the credential attests. */
  subjectDid: string;
  /** Canonical ATP trust level being asserted. */
  trustLevel: string;
  /** Optional numeric trust score (0–5). */
  trustScore?: number;
  /** When the trust was evaluated; defaults to now. */
  evaluatedAt?: string;
  /** Issuing authority DID and its signing key. */
  issuerDid: string;
  issuerPrivateKey: string;
  /** Optional validity window in seconds; sets `expirationDate` when provided. */
  expiresInSeconds?: number;
}

export interface PresentedTrustCredentialResult {
  valid: boolean;
  trustLevel?: string;
  trustScore?: number;
  subject?: string;
  issuer?: string;
  error?: string;
}

export class TrustCredentialService {
  constructor(private readonly credentialService: CredentialService) {}

  /** Register the trust-credential schema if it is not already present. */
  async ensureSchema(): Promise<void> {
    const existing = await this.credentialService.getSchema(ATP_TRUST_CREDENTIAL_SCHEMA.id);
    if (!existing) {
      await this.credentialService.registerSchema(ATP_TRUST_CREDENTIAL_SCHEMA);
    }
  }

  /**
   * Issue a signed `AtpTrustCredential` for an agent. Delegates signing and
   * storage to `CredentialService.issueCredential`.
   */
  async issueTrustCredential(req: IssueTrustCredentialRequest): Promise<VerifiableCredential> {
    if (!req.subjectDid) throw new Error('subjectDid is required');
    if (!req.trustLevel) throw new Error('trustLevel is required');

    await this.ensureSchema();

    const evaluatedAt = req.evaluatedAt ?? new Date().toISOString();
    const expirationDate =
      req.expiresInSeconds !== undefined
        ? new Date(Date.now() + req.expiresInSeconds * 1000).toISOString()
        : undefined;

    const claims: Record<string, unknown> = { trustLevel: req.trustLevel, evaluatedAt };
    if (req.trustScore !== undefined) claims.trustScore = req.trustScore;

    return this.credentialService.issueCredential({
      schemaId: ATP_TRUST_CREDENTIAL_SCHEMA.id,
      subject: req.subjectDid,
      claims,
      expirationDate,
      issuerDid: req.issuerDid,
      issuerPrivateKey: req.issuerPrivateKey,
    });
  }

  /**
   * Cryptographically verify a *presented* trust credential. Returns
   * `valid: false` unless the credential carries the `AtpTrustCredential` type
   * AND `CredentialService.verifyCredential` confirms the issuer signature,
   * expiry, revocation status and schema. On success, the asserted trust
   * level/score and subject are returned for the relying party to act on.
   */
  async verifyPresentedTrustCredential(
    credential: VerifiableCredential
  ): Promise<PresentedTrustCredentialResult> {
    if (!Array.isArray(credential?.type) || !credential.type.includes(ATP_TRUST_CREDENTIAL_TYPE)) {
      return { valid: false, error: `credential is not an ${ATP_TRUST_CREDENTIAL_TYPE}` };
    }

    const result = await this.credentialService.verifyCredential({ credential });
    if (!result.valid) {
      return { valid: false, error: result.error ?? 'credential verification failed' };
    }

    const subject = credential.credentialSubject as Record<string, unknown>;
    return {
      valid: true,
      trustLevel: typeof subject.trustLevel === 'string' ? subject.trustLevel : undefined,
      trustScore: typeof subject.trustScore === 'number' ? subject.trustScore : undefined,
      subject: typeof subject.id === 'string' ? subject.id : undefined,
      issuer: typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id,
    };
  }

  /**
   * Map a trust credential into the policy evaluator's `VerifiableCredentialInfo`
   * so it can be placed on `PolicyEvaluationContext.credentials` and gated by an
   * existing `verifiable_credential` policy condition (type / issuer / claims).
   *
   * NOTE: this only computes structural expiry; the caller MUST verify the
   * credential (see {@link verifyPresentedTrustCredential}) before trusting it,
   * and pass the revocation status it determined as `opts.isRevoked`.
   */
  toVerifiableCredentialInfo(
    credential: VerifiableCredential,
    opts: { isRevoked?: boolean } = {}
  ): VerifiableCredentialInfo {
    const issuer = typeof credential.issuer === 'string' ? credential.issuer : credential.issuer.id;
    const isExpired = credential.expirationDate
      ? new Date(credential.expirationDate).getTime() <= Date.now()
      : false;

    return {
      id: credential.id,
      type: credential.type,
      issuer,
      issuanceDate: credential.issuanceDate,
      expirationDate: credential.expirationDate,
      credentialSubject: credential.credentialSubject,
      isExpired,
      isRevoked: opts.isRevoked ?? false,
    };
  }
}
