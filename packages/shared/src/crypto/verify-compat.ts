/**
 * Backward-compatible signature verification shim for the did:atp v2 rollout.
 *
 * During the migration to the v2 hybrid key model (Ed25519 + ML-DSA-65,
 * FIPS 204), downstream verifiers still receive legacy classical Ed25519
 * signatures from agents and credentials that have not yet rotated to v2.
 * This helper verifies a signature against whichever key material is
 * available, auto-selecting the algorithm by signature size, so v2
 * (post-quantum) signatures verify while legacy Ed25519 signatures keep
 * working throughout the rollout.
 *
 * It deliberately reuses the existing @noble primitives rather than rolling
 * new crypto: Ed25519 mirrors the usage in crypto/pqc-crypto.ts, and
 * ML-DSA-65 mirrors security/quantum-safe.ts (argument order is correct for
 * @noble/post-quantum >= 0.5.0).
 */
import * as ed25519 from '@noble/ed25519';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { initializeCrypto } from '../crypto-setup.js';

// Ensure @noble/ed25519's SHA-512 hook and the WebCrypto polyfill are wired on
// this module's ed25519 instance before any verification runs.
initializeCrypto();

export type SignatureAlgorithm = 'ed25519' | 'ml-dsa-65';

/** Raw signature sizes in bytes. */
export const ED25519_SIGNATURE_BYTES = 64;
export const ML_DSA_65_SIGNATURE_BYTES = 3309;

export interface CompatVerifyKeys {
  /** Hex-encoded 32-byte Ed25519 public key (legacy / classical proof). */
  ed25519PublicKeyHex?: string;
  /** Hex-encoded 1952-byte ML-DSA-65 public key (v2 post-quantum proof). */
  mlDsa65PublicKeyHex?: string;
}

export interface CompatVerifyOptions {
  /** Force a specific algorithm instead of detecting from signature length. */
  algorithm?: SignatureAlgorithm;
}

export interface CompatVerifyResult {
  valid: boolean;
  /** The algorithm that produced a successful verification, or null on failure. */
  algorithm: SignatureAlgorithm | null;
}

function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

/**
 * Best-effort detection of the signature algorithm from its byte length.
 * Returns null when the length matches neither scheme.
 */
export function detectSignatureAlgorithm(signatureHex: string): SignatureAlgorithm | null {
  const len = Buffer.from(signatureHex, 'hex').length;
  if (len === ED25519_SIGNATURE_BYTES) return 'ed25519';
  if (len === ML_DSA_65_SIGNATURE_BYTES) return 'ml-dsa-65';
  return null;
}

async function verifyEd25519(message: string, signatureHex: string, publicKeyHex: string): Promise<boolean> {
  try {
    return await ed25519.verifyAsync(hexToBytes(signatureHex), Buffer.from(message, 'utf8'), hexToBytes(publicKeyHex));
  } catch {
    return false;
  }
}

function verifyMlDsa65(message: string, signatureHex: string, publicKeyHex: string): boolean {
  try {
    return ml_dsa65.verify(hexToBytes(signatureHex), Buffer.from(message, 'utf8'), hexToBytes(publicKeyHex));
  } catch {
    return false;
  }
}

/**
 * Verify a hex-encoded signature over a UTF-8 message against whatever key
 * material is available, preferring the post-quantum proof when applicable.
 *
 * - When the algorithm is known (detected from length or forced via opts) and
 *   the matching key is present, that scheme is used.
 * - Otherwise every available key is tried (ML-DSA-65 first), so a caller that
 *   only knows "one of these keys signed this" still gets a correct answer.
 */
export async function verifySignatureCompat(
  message: string,
  signatureHex: string,
  keys: CompatVerifyKeys,
  opts: CompatVerifyOptions = {}
): Promise<CompatVerifyResult> {
  const algorithm = opts.algorithm ?? detectSignatureAlgorithm(signatureHex);

  if (algorithm === 'ml-dsa-65' && keys.mlDsa65PublicKeyHex) {
    return { valid: verifyMlDsa65(message, signatureHex, keys.mlDsa65PublicKeyHex), algorithm: 'ml-dsa-65' };
  }
  if (algorithm === 'ed25519' && keys.ed25519PublicKeyHex) {
    return { valid: await verifyEd25519(message, signatureHex, keys.ed25519PublicKeyHex), algorithm: 'ed25519' };
  }

  // Detection inconclusive (or the matching key is missing): try every key we
  // have, post-quantum first, so the strongest available proof wins.
  if (keys.mlDsa65PublicKeyHex && verifyMlDsa65(message, signatureHex, keys.mlDsa65PublicKeyHex)) {
    return { valid: true, algorithm: 'ml-dsa-65' };
  }
  if (keys.ed25519PublicKeyHex && (await verifyEd25519(message, signatureHex, keys.ed25519PublicKeyHex))) {
    return { valid: true, algorithm: 'ed25519' };
  }

  return { valid: false, algorithm: null };
}
