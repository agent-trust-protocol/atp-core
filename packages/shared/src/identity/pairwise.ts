/**
 * Pairwise (per-peer, unlinkable) did:atp key derivation.
 *
 * Derives, from a single high-entropy master secret, a DISTINCT hybrid keypair
 * and a pseudonymous path segment for each peer, so an agent can present a
 * different did:atp to every relying party that cannot be correlated to its
 * other pairwise DIDs (or its canonical DID) without the master secret.
 *
 * Spec: docs/specs/did-atp/index.html § "Pairwise (Per-Peer, Unlinkable)
 * Identifiers". The derivation is HKDF-SHA256 [RFC 5869] with domain-separated
 * `info` labels; Ed25519 and ML-DSA-65 (FIPS 204) key generation are both
 * deterministic functions of a 32-byte seed, so no new cryptographic primitive
 * is introduced.
 *
 * SINGLE-SOURCE NOTE: this is the canonical implementation used by
 * @atp/identity-service. The SDK (`packages/sdk/src/utils/crypto.ts`,
 * `CryptoUtils.deriveHybridKeyPairForPeer` / `pairwisePeerSegment`) carries a
 * byte-identical twin so the client SDK need not depend on @atp/shared's
 * server-side deps. Both are pinned to the SAME known-answer vector
 * (`p_fad4fe7b41096f53e62fc34133eab6e7`, …) by their respective conformance
 * tests, so the two implementations cannot silently diverge.
 */
import '../crypto-setup.js';
import * as ed25519 from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha2.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import {
  ATP_ED25519_PUBLIC_KEY_BYTES as ED25519_PUBLIC_KEY_BYTES,
  ATP_ML_DSA_65_PUBLIC_KEY_BYTES as ML_DSA_65_PUBLIC_KEY_BYTES,
} from '@atp/did-atp';

/** Raw-bytes hybrid keypair (Ed25519 classical + ML-DSA-65 post-quantum). */
export interface PairwiseHybridKeyPair {
  ed25519: { publicKey: Uint8Array; secretKey: Uint8Array };
  mlDsa65: { publicKey: Uint8Array; secretKey: Uint8Array };
}

export interface PairwiseOptions {
  /** Optional salt; rotates an agent's entire pairwise identifier set. */
  salt?: Uint8Array;
}

/**
 * HKDF-SHA256 expansion with domain-separated info for pairwise derivation.
 * The `label` separates the Ed25519 seed, the ML-DSA-65 seed and the path
 * pseudonym so they are mutually independent for a given (masterSecret, peer).
 */
function pairwiseSeed(
  masterSecret: Uint8Array,
  peerId: string,
  label: 'ed25519' | 'ml-dsa-65' | 'path',
  salt: Uint8Array | undefined,
  length: number
): Uint8Array {
  const info = new TextEncoder().encode(`atp-pairwise:v1:${label}:${peerId}`);
  return hkdf(sha256, masterSecret, salt, info, length);
}

/**
 * Validate pairwise derivation inputs: a high-entropy master secret (>=32
 * bytes) and a non-empty peer identifier. Shared by every public pairwise
 * function so none can be invoked with weak or empty key material.
 */
function assertPairwiseInputs(masterSecret: Uint8Array, peerId: string): void {
  if (!(masterSecret instanceof Uint8Array) || masterSecret.length < 32) {
    throw new Error('Pairwise master secret must be a Uint8Array of at least 32 bytes');
  }
  if (typeof peerId !== 'string' || peerId.length === 0) {
    throw new Error('Pairwise peerId must be a non-empty string');
  }
}

/**
 * Derive the pseudonymous path segment ("p_<32 hex>") for a pairwise did:atp.
 * Bound to (masterSecret, peerId[, salt]) so it is stable per peer but cannot
 * be correlated across peers — it is NOT a plain hash of the peerId. The
 * "p_" prefix keeps it distinct from the e1_/pq1_ fingerprint segments.
 */
export function pairwisePeerSegment(
  masterSecret: Uint8Array,
  peerId: string,
  opts: PairwiseOptions = {}
): string {
  assertPairwiseInputs(masterSecret, peerId);
  const seed = pairwiseSeed(masterSecret, peerId, 'path', opts.salt, 16);
  return `p_${Buffer.from(seed).toString('hex')}`;
}

/**
 * Deterministically derive a per-peer hybrid keypair from a master secret.
 *
 * Both seeds are derived with HKDF-SHA256 using domain-separated `info`
 * labels, so the same (masterSecret, peerId[, salt]) always yields the same
 * keypair, while different peers yield independent keys whose e1_/pq1_
 * fingerprints cannot be correlated without the master secret.
 */
export async function derivePairwiseHybridKeyPair(
  masterSecret: Uint8Array,
  peerId: string,
  opts: PairwiseOptions = {}
): Promise<PairwiseHybridKeyPair> {
  assertPairwiseInputs(masterSecret, peerId);

  const edSecretKey = pairwiseSeed(masterSecret, peerId, 'ed25519', opts.salt, 32);
  const edPublicKey = await ed25519.getPublicKey(edSecretKey);
  if (edPublicKey.length !== ED25519_PUBLIC_KEY_BYTES) {
    throw new Error(`Invalid Ed25519 public key length: expected 32 bytes, got ${edPublicKey.length}`);
  }

  const mlSeed = pairwiseSeed(masterSecret, peerId, 'ml-dsa-65', opts.salt, 32);
  const mlDsaKeyPair = ml_dsa65.keygen(mlSeed);
  if (mlDsaKeyPair.publicKey.length !== ML_DSA_65_PUBLIC_KEY_BYTES) {
    throw new Error(
      `Invalid ML-DSA-65 public key length: expected 1952 bytes, got ${mlDsaKeyPair.publicKey.length}`
    );
  }

  return {
    ed25519: { publicKey: edPublicKey, secretKey: edSecretKey },
    mlDsa65: { publicKey: mlDsaKeyPair.publicKey, secretKey: mlDsaKeyPair.secretKey },
  };
}
