/**
 * Canonical did:atp v2 identifier + key-fingerprint primitives.
 *
 * This is the SINGLE SOURCE OF TRUTH for the did:atp v2 fingerprint and
 * identifier-construction algorithm used across ATP packages. The SDK's
 * `CryptoUtils`/`DidAtp`, `@atp/shared`, and the identity service all delegate
 * here, rather than each re-implementing it and risking drift from the spec.
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

// did:atp v2 identifier ABNF anchors (shared by builders and validators). The
// e1_/pq1_ anchors are built from ATP_THUMBPRINT_LENGTH so the fingerprint
// length has a single source of truth and the regexes cannot silently diverge.
export const ATP_E1_RE = new RegExp(`^e1_[A-Za-z0-9_-]{${ATP_THUMBPRINT_LENGTH}}$`);
export const ATP_PQ1_RE = new RegExp(`^pq1_[A-Za-z0-9_-]{${ATP_THUMBPRINT_LENGTH}}$`);
export const ATP_PATH_SEGMENT_RE = /^[A-Za-z0-9._-]+$/;
// Lowercase hostname per did:web, with an optional percent-encoded port.
export const ATP_DOMAIN_RE =
  /^(?=.{1,253}(%3[aA]|$))[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*(%3[aA][0-9]{1,5})?$/;

/** base64url without padding (RFC 4648 §5). */
export function atpBase64Url(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    result += alphabet[a >>> 2] + alphabet[((a & 3) << 4) | ((b ?? 0) >>> 4)];
    if (i + 1 < bytes.length) result += alphabet[((b & 15) << 2) | ((c ?? 0) >>> 6)];
    if (i + 2 < bytes.length) result += alphabet[c & 63];
  }
  return result;
}

/**
 * RFC 7638 JWK thumbprint: members sorted lexicographically, serialized as JSON
 * with no whitespace, UTF-8 encoded, SHA-256 hashed, base64url encoded. The JWK
 * must contain the required public members for its key type. Optional metadata
 * and private members do not participate in the thumbprint.
 */
export function atpJwkThumbprint(jwk: Record<string, string>): string {
  if (!jwk || typeof jwk !== 'object' || Array.isArray(jwk)) {
    throw new Error('Invalid JWK: expected an object');
  }
  const members: Record<string, string[]> = {
    OKP: ['crv', 'kty', 'x'],
    AKP: ['alg', 'kty', 'pub'],
    EC: ['crv', 'kty', 'x', 'y'],
    RSA: ['e', 'kty', 'n'],
  };
  const required = Object.prototype.hasOwnProperty.call(members, jwk.kty) ? members[jwk.kty] : undefined;
  if (!required) throw new Error('Unsupported JWK key type');
  const publicJwk: Record<string, string> = {};
  for (const member of required) {
    if (!Object.prototype.hasOwnProperty.call(jwk, member) ||
        typeof jwk[member] !== 'string' || jwk[member].length === 0) {
      throw new Error(`Invalid JWK: missing or invalid ${member}`);
    }
    publicJwk[member] = jwk[member];
  }
  const canonical = JSON.stringify(publicJwk);
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
    // A fingerprint-shaped path segment would make the DID ambiguous (the
    // parser locates the e1_/pq1_ bindings positionally). Reject it so this
    // builder stays byte-compatible with the SDK's DidAtp parser/builder.
    if (ATP_E1_RE.test(segment) || ATP_PQ1_RE.test(segment)) {
      throw new Error(`Path segment "${segment}" is fingerprint-shaped and would be ambiguous`);
    }
  }
  const e1 = atpE1Fingerprint(ed25519PublicKey);
  const pq1 = atpPq1Fingerprint(mlDsa65PublicKey);
  return `did:atp:${domain}:${path.join(':')}:${e1}:${pq1}`;
}

/** Stable syntax errors for path-type identifiers; no network resolution occurs. */
export type AtpDidErrorCode = 'invalid_format' | 'invalid_domain' | 'invalid_path' | 'invalid_bindings';

export class AtpDidParseError extends Error {
  constructor(public readonly code: AtpDidErrorCode, message: string) {
    super(message);
    this.name = 'AtpDidParseError';
  }
}

export interface AtpV2PathDid {
  domain: string;
  path: string[];
  e1: string;
  pq1: string;
}

/** Parse a bare path-type v2 DID. DID URLs and other identifier forms are rejected. */
export function parseAtpV2PathDid(did: string): AtpV2PathDid {
  if (typeof did !== 'string' || !did.startsWith('did:atp:')) {
    throw new AtpDidParseError('invalid_format', 'Expected a bare did:atp path identifier');
  }
  const parts = did.slice(8).split(':');
  if (parts.length < 4) {
    throw new AtpDidParseError('invalid_format', 'Expected a domain, path, and both binding fingerprints');
  }
  const domain = parts[0];
  const e1 = parts[parts.length - 2];
  const pq1 = parts[parts.length - 1];
  const path = parts.slice(1, -2);
  if (!ATP_DOMAIN_RE.test(domain)) {
    throw new AtpDidParseError('invalid_domain', 'Invalid did:atp domain');
  }
  if (!ATP_E1_RE.test(e1) || !ATP_PQ1_RE.test(pq1)) {
    throw new AtpDidParseError('invalid_bindings', 'Expected trailing e1_ and pq1_ fingerprints');
  }
  if (path.some(segment => !ATP_PATH_SEGMENT_RE.test(segment) ||
      ATP_E1_RE.test(segment) || ATP_PQ1_RE.test(segment))) {
    throw new AtpDidParseError('invalid_path', 'Invalid or ambiguous did:atp path');
  }
  return { domain, path, e1, pq1 };
}

/** Syntax only: does not establish resolution, key possession, or authority. */
export function isAtpV2PathDid(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    parseAtpV2PathDid(value);
    return true;
  } catch (error) {
    if (error instanceof AtpDidParseError) return false;
    throw error;
  }
}

/** Check both public-key bindings. Throws on malformed identifiers or key sizes.
 * A match does not prove possession, signature validity, status, or permission.
 */
export function verifyAtpV2KeyBindings(
  did: string,
  ed25519PublicKey: Uint8Array,
  mlDsa65PublicKey: Uint8Array
): boolean {
  const parsed = parseAtpV2PathDid(did);
  const e1 = atpE1Fingerprint(ed25519PublicKey);
  const pq1 = atpPq1Fingerprint(mlDsa65PublicKey);
  return parsed.e1 === e1 && parsed.pq1 === pq1;
}
