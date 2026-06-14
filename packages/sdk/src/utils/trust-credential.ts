import { base58 } from '@scure/base';
import { sha256 } from '@noble/hashes/sha256';
import { CryptoUtils, HybridKeyPair } from './crypto.js';
import { jcsCanonicalize } from './jcs.js';
import { TrustLevel, TrustScoreResult } from './trust.js';
import { VerifiableCredential, DataIntegrityProof, AtpPqProof } from '../types.js';

/**
 * TrustCredential — the ATP agent trust score issued and verified as a W3C
 * Verifiable Credential (VC Data Model v2).
 *
 * This module couples two things that previously lived apart: the local
 * 4-factor trust score produced by {@link TrustScoring.calculateTrustScore}
 * (utils/trust.ts), and the W3C VC machinery. A {@link TrustCredential} is a
 * VC v2 whose `credentialSubject` carries the score and whose integrity is
 * protected by a Data Integrity `eddsa-jcs-2022` proof — optionally paired with
 * an RFC 9964 ML-DSA-65 JWS (`atpPqProof`) for post-quantum assurance.
 *
 * The `eddsa-jcs-2022` algorithm here is byte-identical to the did:atp v2 DID
 * Document implementation (utils/did-document.ts): sign
 * `sha256(JCS(proof config)) || sha256(JCS(unsecured document))`, encode the
 * signature as multibase base58btc (`z…`). It is reimplemented over the same
 * public primitives (`jcsCanonicalize`, `CryptoUtils`, `@noble/hashes/sha256`,
 * `@scure/base` base58) rather than calling DID-method internals, so the frozen
 * DID source is untouched and proof vectors stay consistent for the conformance
 * suite. A future refactor could lift these helpers into a shared
 * `data-integrity.ts` consumed by both layers.
 *
 * The one intentional, documented divergence from the DID Document proof is the
 * `proofPurpose`: credentials use `assertionMethod` (the issuer is asserting a
 * claim), whereas DID Documents use `authentication`.
 */

/** VC Data Model v2 base context. */
export const VC_V2_CONTEXT = 'https://www.w3.org/ns/credentials/v2';
/** The credential type that marks a trust-score credential. */
export const TRUST_CREDENTIAL_TYPE = 'TrustCredential';
/** Data Integrity cryptosuite — same suite the did:atp DID Documents use. */
export const TRUST_CREDENTIAL_CRYPTOSUITE = 'eddsa-jcs-2022';

/** RFC 9964 JOSE algorithm identifier for ML-DSA-65 (matches did-document.ts). */
const ML_DSA_65_JOSE_ALG = 'ML-DSA-65';
/** Verification-method fragments, parallel to the did:atp DID Document. */
const ED25519_VM_FRAGMENT = 'key-ed25519';
const ML_DSA_65_VM_FRAGMENT = 'key-mldsa65';

/**
 * The verifiable claim about an agent's trustworthiness. Mirrors the public
 * surface of a {@link TrustScoreResult} (minus internal counters), keyed by the
 * subject agent's DID.
 */
export interface TrustCredentialSubject {
  /** DID of the agent the score is about. */
  id: string;
  /** Overall trust score in [0, 1]. */
  trustScore: number;
  /** Categorical trust level. */
  trustLevel: TrustLevel;
  /** The four contributing factor scores. */
  factors: TrustScoreResult['factors'];
  /** Confidence in the score in [0, 1]. */
  confidence: number;
  /** ISO-8601 timestamp the score was assessed. */
  assessedAt: string;
}

/**
 * A W3C Verifiable Credential (VC v2) carrying a {@link TrustCredentialSubject},
 * secured with an `eddsa-jcs-2022` Data Integrity proof and, optionally, an
 * ML-DSA-65 post-quantum JWS.
 */
export interface TrustCredential extends VerifiableCredential {
  '@context': string[];
  type: string[];
  credentialSubject: TrustCredentialSubject;
  proof: DataIntegrityProof;
  /** Optional RFC 9964 ML-DSA-65 JWS, parallel to the DID Document's. */
  atpPqProof?: AtpPqProof;
}

/** Inputs to {@link issueTrustCredential}. */
export interface IssueTrustCredentialParams {
  /** The trust score to attest, as produced by TrustScoring.calculateTrustScore. */
  score: TrustScoreResult;
  /** DID of the issuing trust service (becomes `issuer` and signs the proof). */
  issuerDid: string;
  /** DID of the agent the score is about (becomes `credentialSubject.id`). */
  subjectDid: string;
  /** Issuer's hybrid keypair (Ed25519 signs the proof; ML-DSA-65 the optional PQ JWS). */
  keyPair: HybridKeyPair;
  /** Credential id; defaults to a urn under `urn:atp:trustcredential:`. */
  id?: string;
  /** Optional ISO-8601 expiry. */
  expirationDate?: string;
  /** Attach an ML-DSA-65 `atpPqProof` for post-quantum assurance. */
  withPqProof?: boolean;
  /** Override the proof `created` timestamp (primarily for deterministic tests). */
  created?: string;
}

/** Public keys needed to verify a {@link TrustCredential} (obtained by resolving the issuer DID). */
export interface TrustCredentialVerifyKeys {
  /** Issuer Ed25519 public key — verifies the eddsa-jcs-2022 proof. */
  ed25519PublicKey: Uint8Array;
  /** Issuer ML-DSA-65 public key — required only if an `atpPqProof` is present. */
  mlDsa65PublicKey?: Uint8Array;
}

/** The trust claim recovered from a successfully verified credential. */
export interface VerifiedTrustClaim {
  subjectDid: string;
  issuerDid: string;
  trustScore: number;
  trustLevel: TrustLevel;
  factors: TrustScoreResult['factors'];
  confidence: number;
  assessedAt: string;
}

/** Result of {@link verifyTrustCredential}. */
export interface TrustCredentialVerificationResult {
  valid: boolean;
  errors: string[];
  /** Per-check breakdown (mirrors the v1 credentials client's `checks`). */
  checks: {
    structure: boolean;
    classicalProof: boolean;
    /** `'skipped'` when no `atpPqProof` is present. */
    pqProof: boolean | 'skipped';
    expiration: boolean;
    issuer: boolean;
    /**
     * Revocation is NOT implemented. ATP does not yet ship a StatusList2021
     * credential-status mechanism, so this is always `'unchecked'`; a present
     * `credentialStatus` is treated as an honest failure rather than silently
     * ignored. Tracked as a conformance gap (see docs/specs/atp-trust).
     */
    revocation: 'unchecked';
  };
  /** Present only when `valid` — the recovered, verified trust claim. */
  claim?: VerifiedTrustClaim;
}

type ProofConfig = Omit<DataIntegrityProof, 'proofValue'>;

/**
 * eddsa-jcs-2022 hash data: `sha256(JCS(config)) || sha256(JCS(document))`.
 * Identical construction to DidAtpDocument.classicalHashData.
 */
function classicalHashData(unsigned: unknown, config: ProofConfig): Uint8Array {
  const configHash = sha256(new TextEncoder().encode(jcsCanonicalize(config)));
  const docHash = sha256(new TextEncoder().encode(jcsCanonicalize(unsigned)));
  const data = new Uint8Array(configHash.length + docHash.length);
  data.set(configHash, 0);
  data.set(docHash, configHash.length);
  return data;
}

/** The credential with its proofs removed — the "unsecured document" the proofs cover. */
function unsecuredView(credential: TrustCredential): Record<string, unknown> {
  const { proof: _proof, atpPqProof: _pq, ...unsecured } = credential as TrustCredential &
    Record<string, unknown>;
  return unsecured;
}

/** Sign an RFC 9964 ML-DSA-65 compact JWS over the unsecured credential (mirrors DidAtpDocument.signPqProof). */
function signPqProof(
  unsigned: unknown,
  secretKey: Uint8Array,
  verificationMethod: string,
  created: string
): AtpPqProof {
  const header = { alg: ML_DSA_65_JOSE_ALG, typ: 'JOSE' };
  const encode = (s: string) => CryptoUtils.base64url(new TextEncoder().encode(s));
  const signingInput = `${encode(JSON.stringify(header))}.${encode(jcsCanonicalize(unsigned))}`;
  const signature = CryptoUtils.signMlDsa65(new TextEncoder().encode(signingInput), secretKey);
  return {
    type: 'AtpPqProof',
    created,
    verificationMethod,
    proofPurpose: 'assertionMethod',
    jws: `${signingInput}.${CryptoUtils.base64url(signature)}`
  };
}

/**
 * Issue a {@link TrustCredential} from a computed trust score.
 *
 * Builds the VC v2 envelope, signs an `eddsa-jcs-2022` Data Integrity proof
 * with the issuer's Ed25519 key, and (when `withPqProof`) attaches an ML-DSA-65
 * `atpPqProof`.
 */
export async function issueTrustCredential(
  params: IssueTrustCredentialParams
): Promise<TrustCredential> {
  const { score, issuerDid, subjectDid, keyPair } = params;
  const created = params.created ?? new Date().toISOString();
  const issuanceDate = score.metadata.assessedAt ?? created;

  const credentialSubject: TrustCredentialSubject = {
    id: subjectDid,
    trustScore: score.score,
    trustLevel: score.level,
    factors: score.factors,
    confidence: score.confidence,
    assessedAt: score.metadata.assessedAt
  };

  // Unsecured credential — the exact bytes the proofs are computed over.
  const unsigned: Omit<TrustCredential, 'proof' | 'atpPqProof'> = {
    '@context': [VC_V2_CONTEXT],
    id: params.id ?? `urn:atp:trustcredential:${CryptoUtils.generateId()}`,
    type: ['VerifiableCredential', TRUST_CREDENTIAL_TYPE],
    issuer: issuerDid,
    issuanceDate,
    ...(params.expirationDate ? { expirationDate: params.expirationDate } : {}),
    credentialSubject
  };

  // eddsa-jcs-2022 Data Integrity proof (classical binding).
  const config: ProofConfig = {
    type: 'DataIntegrityProof',
    cryptosuite: TRUST_CREDENTIAL_CRYPTOSUITE,
    created,
    verificationMethod: `${issuerDid}#${ED25519_VM_FRAGMENT}`,
    proofPurpose: 'assertionMethod',
    '@context': unsigned['@context']
  };
  const signature = await CryptoUtils.signEd25519(
    classicalHashData(unsigned, config),
    keyPair.ed25519.secretKey
  );
  const { '@context': _ctx, ...proofOptions } = config;
  const proof: DataIntegrityProof = { ...proofOptions, proofValue: `z${base58.encode(signature)}` };

  const credential: TrustCredential = { ...unsigned, proof };

  if (params.withPqProof) {
    credential.atpPqProof = signPqProof(
      unsigned,
      keyPair.mlDsa65.secretKey,
      `${issuerDid}#${ML_DSA_65_VM_FRAGMENT}`,
      created
    );
  }

  return credential;
}

/** Verify the classical `eddsa-jcs-2022` proof (mirrors DidAtpDocument.verifyClassicalProof). */
async function verifyClassicalProof(
  credential: TrustCredential,
  proof: DataIntegrityProof,
  ed25519PublicKey: Uint8Array
): Promise<boolean> {
  if (!proof.proofValue?.startsWith('z')) return false;
  let signature: Uint8Array;
  try {
    signature = base58.decode(proof.proofValue.slice(1));
  } catch {
    return false;
  }
  const unsigned = unsecuredView(credential);
  const { proofValue: _pv, ...options } = proof;
  const config = { ...options, '@context': unsigned['@context'] as string[] };
  return CryptoUtils.verifyEd25519(
    classicalHashData(unsigned, config as ProofConfig),
    signature,
    ed25519PublicKey
  );
}

/** Verify the post-quantum ML-DSA-65 JWS (mirrors DidAtpDocument.verifyPqProof). */
function verifyPqProof(
  credential: TrustCredential,
  atpPqProof: AtpPqProof,
  mlDsaPublicKey: Uint8Array
): boolean {
  const parts = atpPqProof.jws.split('.');
  if (parts.length !== 3) return false;
  const [headerB64, payloadB64, signatureB64] = parts;
  try {
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    if (header.alg !== ML_DSA_65_JOSE_ALG) return false;
    const payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
    if (payload !== jcsCanonicalize(unsecuredView(credential))) return false;
    return CryptoUtils.verifyMlDsa65(
      new TextEncoder().encode(`${headerB64}.${payloadB64}`),
      new Uint8Array(Buffer.from(signatureB64, 'base64url')),
      mlDsaPublicKey
    );
  } catch {
    return false;
  }
}

function deriveClaim(credential: TrustCredential): VerifiedTrustClaim {
  const s = credential.credentialSubject;
  return {
    subjectDid: s.id,
    issuerDid: credential.issuer,
    trustScore: s.trustScore,
    trustLevel: s.trustLevel,
    factors: s.factors,
    confidence: s.confidence,
    assessedAt: s.assessedAt
  };
}

/**
 * Verify a {@link TrustCredential} and recover its trust claim.
 *
 * The caller supplies the issuer's public key(s) — typically obtained by
 * resolving the issuer DID (out of band, mirroring how DID Document proof
 * verification takes the key as a parameter). Honest failure modes: a tampered
 * credential fails proof verification; an expired credential reports an expiry
 * error; a wrong issuer key fails proof verification. Revocation is not
 * implemented (see `checks.revocation`).
 */
export async function verifyTrustCredential(
  credential: TrustCredential,
  keys: TrustCredentialVerifyKeys,
  options?: { now?: Date }
): Promise<TrustCredentialVerificationResult> {
  const errors: string[] = [];
  const now = options?.now ?? new Date();

  // --- Structural checks (VC v2 + TrustCredential shape) ---
  let structureOk = true;
  if (!Array.isArray(credential['@context']) || !credential['@context'].includes(VC_V2_CONTEXT)) {
    errors.push(`@context must include the VC v2 context (${VC_V2_CONTEXT})`);
    structureOk = false;
  }
  if (
    !Array.isArray(credential.type) ||
    !credential.type.includes('VerifiableCredential') ||
    !credential.type.includes(TRUST_CREDENTIAL_TYPE)
  ) {
    errors.push(`type must include 'VerifiableCredential' and '${TRUST_CREDENTIAL_TYPE}'`);
    structureOk = false;
  }
  const issuerOk = typeof credential.issuer === 'string' && credential.issuer.length > 0;
  if (!issuerOk) {
    errors.push('missing or invalid issuer');
    structureOk = false;
  }
  const subject = credential.credentialSubject;
  if (
    !subject ||
    typeof subject.id !== 'string' ||
    typeof subject.trustScore !== 'number' ||
    typeof subject.confidence !== 'number' ||
    !subject.factors
  ) {
    errors.push('malformed credentialSubject');
    structureOk = false;
  }

  // --- Expiration ---
  let expirationOk = true;
  if (credential.expirationDate) {
    const exp = new Date(credential.expirationDate);
    if (Number.isNaN(exp.getTime())) {
      errors.push('invalid expirationDate');
      expirationOk = false;
    } else if (exp.getTime() < now.getTime()) {
      errors.push('credential has expired');
      expirationOk = false;
    }
  }

  // --- Revocation (honest stub: status-list checking is not implemented) ---
  if ((credential as { credentialStatus?: unknown }).credentialStatus) {
    errors.push(
      'credentialStatus is present but revocation/status-list checking is not implemented (conformance gap)'
    );
  }

  // --- Classical eddsa-jcs-2022 proof ---
  let classicalOk = false;
  const proof = credential.proof;
  if (!proof || proof.cryptosuite !== TRUST_CREDENTIAL_CRYPTOSUITE) {
    errors.push(`missing or wrong-cryptosuite '${TRUST_CREDENTIAL_CRYPTOSUITE}' Data Integrity proof`);
  } else {
    classicalOk = await verifyClassicalProof(credential, proof, keys.ed25519PublicKey);
    if (!classicalOk) errors.push('eddsa-jcs-2022 proof verification failed');
  }

  // --- Optional post-quantum ML-DSA-65 JWS ---
  let pqOk: boolean | 'skipped' = 'skipped';
  if (credential.atpPqProof) {
    if (!keys.mlDsa65PublicKey) {
      errors.push('atpPqProof is present but no ML-DSA-65 public key was supplied to verify it');
      pqOk = false;
    } else {
      pqOk = verifyPqProof(credential, credential.atpPqProof, keys.mlDsa65PublicKey);
      if (!pqOk) errors.push('atpPqProof ML-DSA-65 JWS verification failed');
    }
  }

  const valid = errors.length === 0;
  const result: TrustCredentialVerificationResult = {
    valid,
    errors,
    checks: {
      structure: structureOk,
      classicalProof: classicalOk,
      pqProof: pqOk,
      expiration: expirationOk,
      issuer: issuerOk,
      revocation: 'unchecked'
    }
  };
  if (valid) {
    result.claim = deriveClaim(credential);
  }
  return result;
}
