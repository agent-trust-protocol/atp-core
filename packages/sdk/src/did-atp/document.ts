/**
 * did:atp v2 — DID Document construction and verification.
 *
 * A path-type did:atp DID Document contains two verification methods (the
 * Ed25519 `#key-ed25519` and the ML-DSA-65 `#key-mldsa65`, both as
 * publicKeyJwk), both referenced by `authentication` and `assertionMethod`,
 * and two proofs (eddsa-jcs-2022 + ML-DSA-65 JWS).
 */
import {
  AtpKeyMaterial,
  Ed25519Jwk,
  AkpJwk,
  e1Fingerprint,
  pq1Fingerprint,
  ed25519PublicKeyFromJwk,
  mlDsa65PublicKeyFromJwk,
} from './jwk.js';
import { buildAtpDid, parseAtpDid } from './identifier.js';
import {
  AtpProof,
  DataIntegrityProof,
  JwsProof,
  createEddsaJcsProof,
  createMlDsaJwsProof,
  verifyEddsaJcsProof,
  verifyMlDsaJwsProof,
} from './proof.js';

export const ED25519_KEY_FRAGMENT = 'key-ed25519';
export const MLDSA65_KEY_FRAGMENT = 'key-mldsa65';

export interface AtpVerificationMethod {
  id: string;
  type: 'JsonWebKey';
  controller: string;
  publicKeyJwk: Ed25519Jwk | AkpJwk;
}

export interface AtpDidDocument {
  '@context': string[];
  id: string;
  verificationMethod: AtpVerificationMethod[];
  authentication: string[];
  assertionMethod: string[];
  service?: Array<{ id: string; type: string; serviceEndpoint: string }>;
  proof?: AtpProof[];
}

export interface CreateAtpIdentityResult {
  did: string;
  document: AtpDidDocument;
  keys: AtpKeyMaterial;
}

/**
 * Create a fully-formed, dual-signed did:atp identity from fresh key material.
 */
export async function createAtpDidDocument(params: {
  domain: string;
  pathSegments?: string[];
  keys: AtpKeyMaterial;
  service?: AtpDidDocument['service'];
  created?: string;
}): Promise<CreateAtpIdentityResult> {
  const { domain, keys } = params;
  const pathSegments = params.pathSegments ?? [];

  const e1 = e1Fingerprint(keys.ed25519.publicKey);
  const pq1 = pq1Fingerprint(keys.mlDsa65.publicKey);
  const did = buildAtpDid({ domain, pathSegments, e1Fingerprint: e1, pq1Fingerprint: pq1 });

  const edId = `${did}#${ED25519_KEY_FRAGMENT}`;
  const pqId = `${did}#${MLDSA65_KEY_FRAGMENT}`;

  const unsigned: AtpDidDocument = {
    '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/jwk/v1'],
    id: did,
    verificationMethod: [
      { id: edId, type: 'JsonWebKey', controller: did, publicKeyJwk: keys.ed25519.jwk },
      { id: pqId, type: 'JsonWebKey', controller: did, publicKeyJwk: keys.mlDsa65.jwk },
    ],
    authentication: [edId, pqId],
    assertionMethod: [edId, pqId],
    ...(params.service ? { service: params.service } : {}),
  };

  const classical = await createEddsaJcsProof(unsigned, keys.ed25519.secretKey, edId, {
    created: params.created,
  });
  const pq = createMlDsaJwsProof(unsigned, keys.mlDsa65.secretKey, pqId, {
    created: params.created,
  });

  return { did, document: { ...unsigned, proof: [classical, pq] }, keys };
}

function findJwk<T extends Ed25519Jwk | AkpJwk>(
  document: AtpDidDocument,
  fragment: string,
  kty: T['kty'],
): T | null {
  const vm = document.verificationMethod.find(
    (m) => m.id === `${document.id}#${fragment}` || m.id.endsWith(`#${fragment}`),
  );
  if (!vm || vm.publicKeyJwk?.kty !== kty) {
    return null;
  }
  return vm.publicKeyJwk as T;
}

export interface DocumentVerificationResult {
  valid: boolean;
  classicalValid: boolean;
  pqValid: boolean;
  /** True iff both fingerprint segments of the DID match the embedded keys. */
  bindingsMatch: boolean;
  errors: string[];
}

/**
 * Verify a did:atp DID Document: BOTH binding fingerprints must match the
 * embedded keys, AND both proofs must verify. Any failure fails the document.
 */
export async function verifyAtpDidDocument(
  document: AtpDidDocument,
): Promise<DocumentVerificationResult> {
  const errors: string[] = [];
  const parsed = parseAtpDid(document.id);
  if (!parsed) {
    return {
      valid: false,
      classicalValid: false,
      pqValid: false,
      bindingsMatch: false,
      errors: [`Document id is not a valid did:atp identifier: ${document.id}`],
    };
  }

  const edJwk = findJwk<Ed25519Jwk>(document, ED25519_KEY_FRAGMENT, 'OKP');
  const pqJwk = findJwk<AkpJwk>(document, MLDSA65_KEY_FRAGMENT, 'AKP');
  if (!edJwk) {
    errors.push('Missing Ed25519 (OKP) verification method');
  }
  if (!pqJwk) {
    errors.push('Missing ML-DSA-65 (AKP) verification method');
  }

  // Binding checks: recompute thumbprints and compare to the DID path segments.
  let bindingsMatch = false;
  if (edJwk && pqJwk) {
    const e1 = e1Fingerprint(ed25519PublicKeyFromJwk(edJwk));
    const pq1 = pq1Fingerprint(mlDsa65PublicKeyFromJwk(pqJwk));
    if (e1 !== parsed.e1) {
      errors.push('e1_ fingerprint does not match the Ed25519 key');
    }
    if (pq1 !== parsed.pq1) {
      errors.push('pq1_ fingerprint does not match the ML-DSA-65 key');
    }
    bindingsMatch = e1 === parsed.e1 && pq1 === parsed.pq1;
  }

  const proofs = document.proof ?? [];
  const classicalProof = proofs.find(
    (p): p is DataIntegrityProof => p.type === 'DataIntegrityProof',
  );
  const pqProof = proofs.find((p): p is JwsProof => p.type === 'JsonWebSignature2020');

  let classicalValid = false;
  let pqValid = false;
  if (edJwk && classicalProof) {
    classicalValid = await verifyEddsaJcsProof(
      document,
      classicalProof,
      ed25519PublicKeyFromJwk(edJwk),
    );
    if (!classicalValid) {
      errors.push('Classical eddsa-jcs-2022 proof failed verification');
    }
  } else {
    errors.push('Missing classical eddsa-jcs-2022 proof');
  }
  if (pqJwk && pqProof) {
    pqValid = verifyMlDsaJwsProof(document, pqProof, mlDsa65PublicKeyFromJwk(pqJwk));
    if (!pqValid) {
      errors.push('Post-quantum ML-DSA-65 proof failed verification');
    }
  } else {
    errors.push('Missing post-quantum ML-DSA-65 proof');
  }

  return {
    valid: bindingsMatch && classicalValid && pqValid,
    classicalValid,
    pqValid,
    bindingsMatch,
    errors,
  };
}
