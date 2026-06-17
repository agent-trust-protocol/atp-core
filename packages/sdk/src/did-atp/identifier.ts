/**
 * did:atp v2 — method-specific identifier syntax.
 *
 * Implements the finalized spec (docs/specs/did-atp/index.html): a path-type
 * did:atp identifier is
 *
 *   did:atp:<domain>[:<path-segment>...]:e1_<fp>:pq1_<fp>
 *
 * where the two trailing segments are the classical Ed25519 (`e1_`) and
 * post-quantum ML-DSA-65 (`pq1_`) binding-key fingerprints, each an RFC 7638
 * JWK thumbprint encoded as 43 base64url characters. Stripping the `pq1_`
 * segment yields a syntactically valid did:wba identifier.
 *
 * This is a did:wba *extension*: there is no <network> segment.
 */

export const E1_PREFIX = 'e1_';
export const PQ1_PREFIX = 'pq1_';

/** 43 chars = base64url(SHA-256 digest) with no padding. */
const FINGERPRINT_BODY = '[A-Za-z0-9_-]{43}';
const E1_RE = new RegExp(`^e1_(${FINGERPRINT_BODY})$`);
const PQ1_RE = new RegExp(`^pq1_(${FINGERPRINT_BODY})$`);

export interface ParsedAtpDid {
  /** Always "atp". */
  method: 'atp';
  /** DNS host authority, e.g. "agents.example.com" (may carry an encoded port). */
  domain: string;
  /** Zero or more path segments between the domain and the fingerprints. */
  pathSegments: string[];
  /** The classical Ed25519 fingerprint segment, including the `e1_` prefix. */
  e1: string;
  /** The post-quantum ML-DSA-65 fingerprint segment, including the `pq1_` prefix. */
  pq1: string;
  /** Optional fragment (e.g. "key-mldsa65"). */
  fragment?: string;
}

/** A domain-name segment as used by did:web / did:wba (host, optionally %3A-encoded port). */
const DOMAIN_RE = /^[A-Za-z0-9.-]+(?:%3[Aa][0-9]+)?$/;
const PATH_SEGMENT_RE = /^[A-Za-z0-9_.-]+$/;

/**
 * Build a path-type did:atp identifier from its parts.
 * @throws if any fingerprint is malformed.
 */
export function buildAtpDid(params: {
  domain: string;
  pathSegments?: string[];
  e1Fingerprint: string; // with or without the "e1_" prefix
  pq1Fingerprint: string; // with or without the "pq1_" prefix
}): string {
  const { domain } = params;
  const pathSegments = params.pathSegments ?? [];

  if (!DOMAIN_RE.test(domain)) {
    throw new Error(`Invalid did:atp domain: "${domain}"`);
  }
  for (const seg of pathSegments) {
    if (!PATH_SEGMENT_RE.test(seg)) {
      throw new Error(`Invalid did:atp path segment: "${seg}"`);
    }
  }

  const e1 = params.e1Fingerprint.startsWith(E1_PREFIX)
    ? params.e1Fingerprint
    : `${E1_PREFIX}${params.e1Fingerprint}`;
  const pq1 = params.pq1Fingerprint.startsWith(PQ1_PREFIX)
    ? params.pq1Fingerprint
    : `${PQ1_PREFIX}${params.pq1Fingerprint}`;

  if (!E1_RE.test(e1)) {
    throw new Error(`Invalid e1_ fingerprint segment: "${e1}"`);
  }
  if (!PQ1_RE.test(pq1)) {
    throw new Error(`Invalid pq1_ fingerprint segment: "${pq1}"`);
  }

  const parts = ['did', 'atp', domain, ...pathSegments, e1, pq1];
  return parts.join(':');
}

/**
 * Parse a path-type did:atp identifier. Returns null if it is not a
 * well-formed two-segment (e1_ + pq1_) did:atp identifier.
 *
 * Legacy network-style identifiers (did:atp:mainnet:<fp>) are intentionally
 * rejected — they do not conform to the finalized spec.
 */
export function parseAtpDid(did: string): ParsedAtpDid | null {
  if (typeof did !== 'string' || did.length === 0) {
    return null;
  }

  let fragment: string | undefined;
  let core = did;
  const hashIdx = did.indexOf('#');
  if (hashIdx !== -1) {
    fragment = did.slice(hashIdx + 1);
    core = did.slice(0, hashIdx);
  }

  const segments = core.split(':');
  // Minimum: did, atp, domain, e1_, pq1_  => 5 segments.
  if (segments.length < 5) {
    return null;
  }
  if (segments[0] !== 'did' || segments[1] !== 'atp') {
    return null;
  }

  const pq1 = segments[segments.length - 1];
  const e1 = segments[segments.length - 2];
  if (!E1_RE.test(e1) || !PQ1_RE.test(pq1)) {
    return null;
  }

  const domain = segments[2];
  if (!DOMAIN_RE.test(domain)) {
    return null;
  }

  const pathSegments = segments.slice(3, segments.length - 2);
  for (const seg of pathSegments) {
    if (!PATH_SEGMENT_RE.test(seg)) {
      return null;
    }
  }

  return { method: 'atp', domain, pathSegments, e1, pq1, fragment };
}

/** True iff `did` is a well-formed path-type did:atp identifier. */
export function isValidAtpDid(did: string): boolean {
  return parseAtpDid(did) !== null;
}

/** Strip the `pq1_` segment to recover the underlying did:wba identifier. */
export function toWbaDid(did: string): string | null {
  const parsed = parseAtpDid(did);
  if (!parsed) {
    return null;
  }
  const parts = ['did', 'wba', parsed.domain, ...parsed.pathSegments, parsed.e1];
  return parts.join(':');
}
