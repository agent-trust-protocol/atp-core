/**
 * Canonical did:atp v2 identifier + key-fingerprint primitives.
 *
 * This is the SINGLE SOURCE OF TRUTH for the did:atp v2 fingerprint and
 * identifier-construction algorithm used across ATP packages (the SDK's
 * `CryptoUtils`/`DidAtp` and the identity service delegate here, rather than
 * each re-implementing it and risking drift from the spec).
 *
 * Spec: w3c-cg/specs/did-atp. A path-type did:atp v2 identifier is:
 *   did:atp:<domain>:<path...>:e1_<thumbprint>:pq1_<thumbprint>
 * where e1_ is the RFC 7638 JWK thumbprint of the Ed25519 (OKP) binding key
 * and pq1_ is the RFC 7638 JWK thumbprint of the ML-DSA-65 (AKP, RFC 9964)
 * binding key. Only SHA-256 (from @noble/hashes) is used — no new crypto
 * primitives are introduced here.
 */
import { sha256 } from '@noble/hashes/sha2.js';

/** Byte sizes for the did:atp v2 hybrid key model (FIPS 204 final, ML-DSA-65). */
export const ATP_ED25519_PUBLIC_KEY_BYTES = 32;
export const ATP_ML_DSA_65_PUBLIC_KEY_BYTES = 1952;
/** RFC 7638 SHA-256 thumbprints are 32 bytes → 43 base64url chars, no padding. */
export const ATP_THUMBPRINT_LENGTH = 43;

/** did:atp v2 identifier ABNF anchors (shared by builders and validators). */
export const ATP_E1_RE = /^e1_[A-Za-z0-9_-]{43}$/;
export const ATP_PQ1_RE = /^pq1_[A-Za-z0-9_-]{43}$/;
export const ATP_PATH_SEGMENT_RE = /^[A-Za-z0-9._-]+$/;
// Lowercase hostname per did:web, with an optional percent-encoded port.
export const ATP_DOMAIN_RE =
  /^(?=.{1,253}(%3[aA]|$))[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*(%3[aA][0-9]{1,5})?$/;

/** base64url without padding (RFC 4648 §5). */
export function atpBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

/**
 * RFC 7638 JWK thumbprint: members sorted lexicographically, serialized as JSON
 * with no whitespace, UTF-8 encoded, SHA-256 hashed, base64url encoded. The JWK
 * must contain exactly the required members for its key type.
 */
export function atpJwkThumbprint(jwk: Record<string, string>): string {
  const sortedKeys = Object.keys(jwk).sort();
  const canonical = JSON.stringify(jwk, sortedKeys);
  const digest = sha256(new TextEncoder().encode(canonical));
  return atpBase64Url(digest);
}

/** Classical key fingerprint: "e1_" + RFC 7638 thumbprint of the Ed25519 JWK. */
export function atpE1Fingerprint(ed25519PublicKey: Uint8Array): string {
  if (ed25519PublicKey.length !== ATP_ED25519_PUBLIC_KEY_BYTES) {
    throw new Error(
      `Invalid Ed25519 public key length: expected 32 bytes, got ${ed25519PublicKey.length}`
    );
  }
  const jwk = { crv: 'Ed25519', kty: 'OKP', x: atpBase64Url(ed25519PublicKey) };
  return `e1_${atpJwkThumbprint(jwk)}`;
}

/** Post-quantum key fingerprint: "pq1_" + RFC 7638 thumbprint of the AKP JWK. */
export function atpPq1Fingerprint(mlDsa65PublicKey: Uint8Array): string {
  if (mlDsa65PublicKey.length !== ATP_ML_DSA_65_PUBLIC_KEY_BYTES) {
    throw new Error(
      `Invalid ML-DSA-65 public key length: expected 1952 bytes, got ${mlDsa65PublicKey.length}`
    );
  }
  const jwk = { alg: 'ML-DSA-65', kty: 'AKP', pub: atpBase64Url(mlDsa65PublicKey) };
  return `pq1_${atpJwkThumbprint(jwk)}`;
}

/**
 * Build a path-type did:atp v2 identifier from the two raw binding public keys,
 * a resolution domain, and at least one path segment (per the spec ABNF,
 * path-type DIDs require >=1 segment).
 */
export function buildAtpV2Did(
  domain: string,
  path: string[],
  ed25519PublicKey: Uint8Array,
  mlDsa65PublicKey: Uint8Array
): string {
  if (!ATP_DOMAIN_RE.test(domain)) {
    throw new Error(`Invalid did:atp domain: "${domain}" (lowercase hostname, optional %3A port)`);
  }
  if (!Array.isArray(path) || path.length === 0) {
    throw new Error('A path-type did:atp requires at least one path segment');
  }
  for (const segment of path) {
    if (!ATP_PATH_SEGMENT_RE.test(segment)) {
      throw new Error(`Invalid did:atp path segment: "${segment}"`);
    }
  }
  const e1 = atpE1Fingerprint(ed25519PublicKey);
  const pq1 = atpPq1Fingerprint(mlDsa65PublicKey);
  return `did:atp:${domain}:${path.join(':')}:${e1}:${pq1}`;
}
