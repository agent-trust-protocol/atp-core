/**
 * did:atp v2 — key material and JWK representations.
 *
 * Two *independent* keypairs back a did:atp identity (no composite blob):
 *   - a classical Ed25519 key, represented as an OKP JWK (per did:wba), and
 *   - a post-quantum ML-DSA-65 key, represented as an RFC 9964 AKP JWK
 *     ({ "kty": "AKP", "alg": "ML-DSA-65", "pub": <base64url> }).
 *
 * Each binding fingerprint is the RFC 7638 JWK thumbprint of the respective
 * JWK, base64url-encoded with no padding (43 characters), prefixed `e1_` /
 * `pq1_`.
 */
import * as ed25519 from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha2.js';
import { sha512 } from '@noble/hashes/sha2.js';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa';
import { randomBytes } from 'crypto';
import { E1_PREFIX, PQ1_PREFIX } from './identifier.js';

// @noble/ed25519 v2 needs a synchronous SHA-512 for sign/verify.
ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m));

// FIPS 204 ML-DSA-65 sizes (bytes).
export const ML_DSA_65_PUBLIC_KEY_BYTES = 1952;
export const ML_DSA_65_SECRET_KEY_BYTES = 4032;
export const ML_DSA_65_SIGNATURE_BYTES = 3309;

export const ED25519_PUBLIC_KEY_BYTES = 32;

export interface Ed25519Jwk {
  kty: 'OKP';
  crv: 'Ed25519';
  x: string; // base64url(32-byte public key)
}

/** RFC 9964 AKP (Algorithm Key Pair) JWK for ML-DSA. */
export interface AkpJwk {
  kty: 'AKP';
  alg: 'ML-DSA-65';
  pub: string; // base64url(1952-byte public key)
}

export interface AtpKeyMaterial {
  ed25519: {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
    jwk: Ed25519Jwk;
  };
  mlDsa65: {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
    jwk: AkpJwk;
  };
}

function b64u(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

/** Generate the two independent binding keypairs for a did:atp identity. */
export async function generateAtpKeyMaterial(): Promise<AtpKeyMaterial> {
  const edSecret = ed25519.utils.randomPrivateKey();
  const edPublic = await ed25519.getPublicKey(edSecret);

  const mlDsa = ml_dsa65.keygen(randomBytes(32));

  return {
    ed25519: {
      publicKey: edPublic,
      secretKey: edSecret,
      jwk: ed25519Jwk(edPublic),
    },
    mlDsa65: {
      publicKey: mlDsa.publicKey,
      secretKey: mlDsa.secretKey,
      jwk: mlDsa65Jwk(mlDsa.publicKey),
    },
  };
}

export function ed25519Jwk(publicKey: Uint8Array): Ed25519Jwk {
  if (publicKey.length !== ED25519_PUBLIC_KEY_BYTES) {
    throw new Error(`Ed25519 public key must be ${ED25519_PUBLIC_KEY_BYTES} bytes`);
  }
  return { kty: 'OKP', crv: 'Ed25519', x: b64u(publicKey) };
}

export function mlDsa65Jwk(publicKey: Uint8Array): AkpJwk {
  if (publicKey.length !== ML_DSA_65_PUBLIC_KEY_BYTES) {
    throw new Error(`ML-DSA-65 public key must be ${ML_DSA_65_PUBLIC_KEY_BYTES} bytes`);
  }
  return { kty: 'AKP', alg: 'ML-DSA-65', pub: b64u(publicKey) };
}

/**
 * Compute an RFC 7638 JWK thumbprint: SHA-256 over the canonical JSON of the
 * JWK's required members (lexicographically ordered names, no whitespace),
 * base64url-encoded without padding.
 */
export function rfc7638Thumbprint(jwk: Ed25519Jwk | AkpJwk): string {
  let canonical: string;
  if (jwk.kty === 'OKP') {
    // RFC 7638 / RFC 8037: required members for OKP are crv, kty, x.
    canonical = `{"crv":"${jwk.crv}","kty":"OKP","x":"${jwk.x}"}`;
  } else {
    // RFC 9964: required members for AKP are alg, kty, pub.
    canonical = `{"alg":"${jwk.alg}","kty":"AKP","pub":"${jwk.pub}"}`;
  }
  return Buffer.from(sha256(Buffer.from(canonical, 'utf8'))).toString('base64url');
}

/** `e1_<thumbprint>` for the Ed25519 binding key. */
export function e1Fingerprint(publicKey: Uint8Array): string {
  return `${E1_PREFIX}${rfc7638Thumbprint(ed25519Jwk(publicKey))}`;
}

/** `pq1_<thumbprint>` for the ML-DSA-65 binding key. */
export function pq1Fingerprint(publicKey: Uint8Array): string {
  return `${PQ1_PREFIX}${rfc7638Thumbprint(mlDsa65Jwk(publicKey))}`;
}

export function ed25519PublicKeyFromJwk(jwk: Ed25519Jwk): Uint8Array {
  return new Uint8Array(Buffer.from(jwk.x, 'base64url'));
}

export function mlDsa65PublicKeyFromJwk(jwk: AkpJwk): Uint8Array {
  return new Uint8Array(Buffer.from(jwk.pub, 'base64url'));
}
