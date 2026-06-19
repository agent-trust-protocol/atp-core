import { CryptoUtils, HybridKeyPair } from './crypto.js';

/**
 * did:atp v2 identifier core.
 *
 * Implements the method-specific identifier syntax from the did:atp spec
 * (docs/specs/did-atp/index.html), which follows did:wba/did:web with two
 * trailing binding-key fingerprint segments on path-type DIDs:
 *
 *   atp-root-did = "did:atp:" domain-name
 *   atp-path-did = "did:atp:" domain-name 1*(":" path-segment)
 *                  ":" e1-fingerprint ":" pq1-fingerprint
 *
 *   e1-fingerprint  = "e1_"  43base64url-char   ; Ed25519, per did:wba
 *   pq1-fingerprint = "pq1_" 43base64url-char   ; ML-DSA-65, this spec
 *
 * There is no network segment; the domain is the resolution authority.
 * Rotating either binding key changes the DID, since both fingerprints
 * are part of the path.
 */

export type AtpDidType = 'root' | 'path';

export interface ParsedAtpDid {
  /** The DID without any fragment. */
  did: string;
  type: AtpDidType;
  /** Lowercase domain name, with optional did:web-style "%3A<port>" suffix. */
  domain: string;
  /** Path segments between the domain and the fingerprints; [] for root DIDs. */
  path: string[];
  /** Full classical fingerprint segment ("e1_" + 43 chars); path DIDs only. */
  e1?: string;
  /** Full post-quantum fingerprint segment ("pq1_" + 43 chars); path DIDs only. */
  pq1?: string;
  /** Fragment after "#", if present (e.g. a key id). */
  fragment?: string;
}

/** RFC 7638 SHA-256 thumbprints are 32 bytes → 43 base64url chars, no padding. */
const THUMBPRINT_LENGTH = 43;

const E1_RE = /^e1_[A-Za-z0-9_-]{43}$/;
const PQ1_RE = /^pq1_[A-Za-z0-9_-]{43}$/;
const PATH_SEGMENT_RE = /^[A-Za-z0-9._-]+$/;
// Lowercase hostname per did:web, with an optional percent-encoded port.
const DOMAIN_RE = /^(?=.{1,253}(%3[aA]|$))[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*(%3[aA][0-9]{1,5})?$/;

export class DidAtp {
  static readonly METHOD = 'atp';
  static readonly PREFIX = 'did:atp:';

  /**
   * Build a path-type did:atp identifier from the two binding public keys.
   * At least one path segment is required (per the spec ABNF); root DIDs
   * carry no fingerprints and are built with `rootDid()`.
   */
  static fromPublicKeys(
    domain: string,
    path: string[],
    ed25519PublicKey: Uint8Array,
    mlDsa65PublicKey: Uint8Array
  ): string {
    this.assertDomain(domain);
    this.assertPath(path);
    const e1 = CryptoUtils.e1Fingerprint(ed25519PublicKey);
    const pq1 = CryptoUtils.pq1Fingerprint(mlDsa65PublicKey);
    return `${this.PREFIX}${domain}:${path.join(':')}:${e1}:${pq1}`;
  }

  /**
   * Build a root did:atp identifier (domain only, no binding fingerprints).
   */
  static rootDid(domain: string): string {
    this.assertDomain(domain);
    return `${this.PREFIX}${domain}`;
  }

  /**
   * Generate a fresh hybrid keypair and the path-type DID bound to it.
   */
  static async generate(
    domain: string,
    path: string[]
  ): Promise<{ did: string; keyPair: HybridKeyPair }> {
    this.assertDomain(domain);
    this.assertPath(path);
    const keyPair = await CryptoUtils.generateHybridKeyPair();
    const did = this.fromPublicKeys(
      domain,
      path,
      keyPair.ed25519.publicKey,
      keyPair.mlDsa65.publicKey
    );
    return { did, keyPair };
  }

  /**
   * Parse a did:atp identifier. Returns null if the string is not a valid
   * did:atp root or path DID per the spec ABNF.
   */
  static parse(input: string): ParsedAtpDid | null {
    if (typeof input !== 'string') return null;

    let fragment: string | undefined;
    let did = input;
    const hashIndex = input.indexOf('#');
    if (hashIndex !== -1) {
      fragment = input.slice(hashIndex + 1);
      did = input.slice(0, hashIndex);
      if (fragment.length === 0) return null;
    }

    if (!did.startsWith(this.PREFIX)) return null;
    const msi = did.slice(this.PREFIX.length);
    if (msi.length === 0) return null;

    const segments = msi.split(':');
    const domain = segments[0];
    if (!DOMAIN_RE.test(domain)) return null;

    if (segments.length === 1) {
      return { did, type: 'root', domain, path: [], fragment };
    }

    // Path-type: domain, >=1 path segment, then e1_ and pq1_ fingerprints.
    if (segments.length < 4) return null;

    const pq1 = segments[segments.length - 1];
    const e1 = segments[segments.length - 2];
    if (!E1_RE.test(e1) || !PQ1_RE.test(pq1)) return null;

    const path = segments.slice(1, -2);
    for (const segment of path) {
      if (!PATH_SEGMENT_RE.test(segment)) return null;
      // A fingerprint-shaped path segment would make the DID ambiguous.
      if (E1_RE.test(segment) || PQ1_RE.test(segment)) return null;
    }

    return { did, type: 'path', domain, path, e1, pq1, fragment };
  }

  /**
   * True if the string is a valid did:atp root or path DID.
   */
  static isValid(did: string): boolean {
    return this.parse(did) !== null;
  }

  /**
   * Verify that a path-type DID's fingerprints match the given public keys
   * (the create-time half of the spec's dual-binding requirement).
   */
  static matchesPublicKeys(
    did: string,
    ed25519PublicKey: Uint8Array,
    mlDsa65PublicKey: Uint8Array
  ): boolean {
    const parsed = this.parse(did);
    if (!parsed || parsed.type !== 'path') return false;
    return (
      CryptoUtils.constantTimeEqual(parsed.e1!, CryptoUtils.e1Fingerprint(ed25519PublicKey)) &&
      CryptoUtils.constantTimeEqual(parsed.pq1!, CryptoUtils.pq1Fingerprint(mlDsa65PublicKey))
    );
  }

  private static assertDomain(domain: string): void {
    if (!DOMAIN_RE.test(domain)) {
      throw new Error(`Invalid did:atp domain: "${domain}" (lowercase hostname, optional %3A port)`);
    }
  }

  private static assertPath(path: string[]): void {
    if (!Array.isArray(path) || path.length === 0) {
      throw new Error('A path-type did:atp requires at least one path segment');
    }
    for (const segment of path) {
      if (!PATH_SEGMENT_RE.test(segment)) {
        throw new Error(`Invalid did:atp path segment: "${segment}"`);
      }
      if (E1_RE.test(segment) || PQ1_RE.test(segment)) {
        throw new Error(`Path segment "${segment}" is fingerprint-shaped and would be ambiguous`);
      }
    }
  }
}

export { THUMBPRINT_LENGTH };
