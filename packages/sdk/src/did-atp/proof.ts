/**
 * did:atp v2 — dual-binding proofs over a DID Document.
 *
 * A did:atp DID Document carries TWO independent proofs:
 *
 *   1. Classical: an `eddsa-jcs-2022` W3C Data Integrity proof (adopted from
 *      did:wba). The signing input is SHA-256(JCS(proofConfig)) ‖
 *      SHA-256(JCS(document)), signed with Ed25519; the proofValue is multibase
 *      base64url ("u" prefix).
 *
 *   2. Post-quantum: an ML-DSA-65 signature serialized as a detached JWS per
 *      RFC 9964, over SHA-256(JCS(document)).
 *
 * Both proofs are computed over the document with the `proof` member removed,
 * so they are independent and order-insensitive.
 */
import * as ed25519 from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha2.js';
import { sha512 } from '@noble/hashes/sha2.js';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa';
import canonicalize from 'canonicalize';

ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m));

export const EDDSA_JCS_2022 = 'eddsa-jcs-2022';
export const ML_DSA_65_JWS = 'ML-DSA-65';

export interface DataIntegrityProof {
  type: 'DataIntegrityProof';
  cryptosuite: typeof EDDSA_JCS_2022;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  proofValue: string; // multibase base64url ("u"...)
}

export interface JwsProof {
  type: 'JsonWebSignature2020';
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  /** Detached compact JWS (header..signature) with alg ML-DSA-65. */
  jws: string;
}

export type AtpProof = DataIntegrityProof | JwsProof;

function jcs(value: unknown): Uint8Array {
  const out = canonicalize(value);
  if (out === undefined) {
    throw new Error('Unable to canonicalize value (JCS)');
  }
  return Buffer.from(out, 'utf8');
}

function stripProof<T extends { proof?: unknown }>(document: T): Omit<T, 'proof'> {
  const { proof: _proof, ...rest } = document;
  return rest;
}

function b64u(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

function fromB64u(s: string): Uint8Array {
  return new Uint8Array(Buffer.from(s, 'base64url'));
}

// ---------------------------------------------------------------------------
// Classical: eddsa-jcs-2022
// ---------------------------------------------------------------------------

function eddsaSigningInput(
  document: { proof?: unknown },
  proofConfig: Omit<DataIntegrityProof, 'proofValue'>,
): Uint8Array {
  const transformedDocHash = sha256(jcs(stripProof(document)));
  const proofConfigHash = sha256(jcs(proofConfig));
  return ed25519.etc.concatBytes(proofConfigHash, transformedDocHash);
}

export async function createEddsaJcsProof(
  document: { proof?: unknown },
  ed25519SecretKey: Uint8Array,
  verificationMethod: string,
  options?: { created?: string; proofPurpose?: string },
): Promise<DataIntegrityProof> {
  const config: Omit<DataIntegrityProof, 'proofValue'> = {
    type: 'DataIntegrityProof',
    cryptosuite: EDDSA_JCS_2022,
    created: options?.created ?? new Date().toISOString(),
    verificationMethod,
    proofPurpose: options?.proofPurpose ?? 'assertionMethod',
  };
  const signature = await ed25519.sign(eddsaSigningInput(document, config), ed25519SecretKey);
  return { ...config, proofValue: `u${b64u(signature)}` };
}

export async function verifyEddsaJcsProof(
  document: { proof?: unknown },
  proof: DataIntegrityProof,
  ed25519PublicKey: Uint8Array,
): Promise<boolean> {
  try {
    if (proof.type !== 'DataIntegrityProof' || proof.cryptosuite !== EDDSA_JCS_2022) {
      return false;
    }
    if (!proof.proofValue.startsWith('u')) {
      return false;
    }
    const { proofValue, ...config } = proof;
    const signature = fromB64u(proofValue.slice(1));
    return await ed25519.verify(signature, eddsaSigningInput(document, config), ed25519PublicKey);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Post-quantum: ML-DSA-65 detached JWS (RFC 9964)
// ---------------------------------------------------------------------------

function pqSigningInput(document: { proof?: unknown }): Uint8Array {
  return sha256(jcs(stripProof(document)));
}

export function createMlDsaJwsProof(
  document: { proof?: unknown },
  mlDsaSecretKey: Uint8Array,
  verificationMethod: string,
  options?: { created?: string; proofPurpose?: string },
): JwsProof {
  // Detached JWS: protected header describes alg; payload is omitted (b64:false, crit:["b64"]).
  const header = { alg: ML_DSA_65_JWS, b64: false, crit: ['b64'] };
  const protectedHeader = b64u(Buffer.from(JSON.stringify(header), 'utf8'));
  const signingInput = ed25519Concat(
    Buffer.from(`${protectedHeader}.`, 'utf8'),
    pqSigningInput(document),
  );
  const signature = ml_dsa65.sign(mlDsaSecretKey, signingInput);
  return {
    type: 'JsonWebSignature2020',
    created: options?.created ?? new Date().toISOString(),
    verificationMethod,
    proofPurpose: options?.proofPurpose ?? 'assertionMethod',
    jws: `${protectedHeader}..${b64u(signature)}`,
  };
}

export function verifyMlDsaJwsProof(
  document: { proof?: unknown },
  proof: JwsProof,
  mlDsaPublicKey: Uint8Array,
): boolean {
  try {
    if (proof.type !== 'JsonWebSignature2020' || typeof proof.jws !== 'string') {
      return false;
    }
    const [protectedHeader, payload, signatureB64] = proof.jws.split('.');
    if (payload !== '' || !protectedHeader || !signatureB64) {
      return false; // must be a detached JWS
    }
    const header = JSON.parse(Buffer.from(protectedHeader, 'base64url').toString('utf8'));
    if (header.alg !== ML_DSA_65_JWS) {
      return false;
    }
    const signingInput = ed25519Concat(
      Buffer.from(`${protectedHeader}.`, 'utf8'),
      pqSigningInput(document),
    );
    return ml_dsa65.verify(mlDsaPublicKey, signingInput, fromB64u(signatureB64));
  } catch {
    return false;
  }
}

function ed25519Concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}
