import { DidAtp, ParsedAtpDid } from './did.js';
import { DidAtpDocument } from './did-document.js';
import { AtpDidDocument } from '../types.js';

/**
 * did:atp v2 resolution (spec "Method Operations / Resolve").
 *
 * Resolution is did:web/did:wba-style did.json retrieval: the DID's domain
 * and path segments map to an HTTPS URL hosting the DID Document, which is
 * then validated with the mandatory dual-binding verification from Phase 3
 * (both path fingerprints AND both proofs — eddsa-jcs-2022 and the
 * RFC 9964 ML-DSA-65 JWS). Resolution MUST fail if any single check fails;
 * a valid classical proof is never sufficient on its own.
 *
 * URL transformation (did:wba rules):
 *   did:atp:<domain>                          → https://<domain>/.well-known/did.json
 *   did:atp:<domain>:<p1>:…:<pN>:e1_…:pq1_…   → https://<domain>/<p1>/…/<pN>/did.json
 *
 * A did:web-style "%3A<port>" suffix on the domain becomes ":<port>" in the
 * URL authority. The fingerprint segments are binding material, not path —
 * they never appear in the URL.
 *
 * Deactivate (did:wba/did:web convention): the controller deactivates a DID
 * by simply ceasing to serve its did.json — there is no tombstone document.
 * A deactivated DID is therefore indistinguishable from one that never
 * existed: resolution fails with DidResolutionError('notFound'). Update is
 * similarly out-of-band: rotating either binding key changes the DID (see
 * DidAtpDocument.rotate()), so the old DID's did.json is replaced or
 * removed, after which resolving the old DID fails with 'didMismatch' (new
 * document served at the same path) or 'notFound' (removed).
 */

export type DidResolutionErrorCode =
  | 'invalidDid'
  | 'insecureUrl'
  | 'notFound'
  | 'invalidDidDocument'
  | 'didMismatch'
  | 'verificationFailed';

export class DidResolutionError extends Error {
  constructor(
    public readonly code: DidResolutionErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'DidResolutionError';
  }
}

export interface ResolveOptions {
  /** Fetch implementation override (e.g. for tests). Defaults to global fetch. */
  fetch?: typeof fetch;
}

export interface DidResolutionResult {
  did: string;
  /** The HTTPS URL the document was retrieved from. */
  documentUrl: string;
  document: AtpDidDocument;
}

export class DidAtpResolver {
  /**
   * Map a did:atp identifier to the HTTPS URL of its did.json document.
   * Throws DidResolutionError('invalidDid') if the DID does not parse.
   */
  static didToUrl(did: string): string {
    const parsed = DidAtp.parse(did);
    if (!parsed) {
      throw new DidResolutionError('invalidDid', `Not a valid did:atp identifier: "${did}"`);
    }
    return this.parsedToUrl(parsed);
  }

  private static parsedToUrl(parsed: ParsedAtpDid): string {
    // did:web rule: a percent-encoded "%3A<port>" in the domain becomes the
    // URL authority's ":<port>".
    const authority = parsed.domain.replace(/%3[aA]/, ':');
    if (parsed.type === 'root') {
      return `https://${authority}/.well-known/did.json`;
    }
    return `https://${authority}/${parsed.path.join('/')}/did.json`;
  }

  /**
   * Resolve a did:atp identifier: fetch its did.json over HTTPS and run the
   * mandatory dual-binding verification. Throws DidResolutionError on any
   * failure — there is no partially-valid result.
   *
   * Root DIDs (no fingerprint segments) carry no binding material and cannot
   * satisfy dual-binding verification, so only path-type DIDs resolve.
   */
  static async resolve(did: string, options: ResolveOptions = {}): Promise<DidResolutionResult> {
    const parsed = DidAtp.parse(did);
    if (!parsed) {
      throw new DidResolutionError('invalidDid', `Not a valid did:atp identifier: "${did}"`);
    }
    if (parsed.type !== 'path') {
      throw new DidResolutionError(
        'invalidDid',
        'Only path-type did:atp identifiers (with e1_/pq1_ binding fingerprints) are resolvable'
      );
    }

    const documentUrl = this.parsedToUrl(parsed);
    const document = await this.fetchDidJson(documentUrl, options);

    if (document.id !== parsed.did) {
      throw new DidResolutionError(
        'didMismatch',
        `Retrieved document id "${document.id}" does not match requested DID "${parsed.did}"`
      );
    }

    const { valid, errors } = await DidAtpDocument.verify(document);
    if (!valid) {
      throw new DidResolutionError(
        'verificationFailed',
        `Dual-binding verification failed: ${errors.join('; ')}`
      );
    }

    return { did: parsed.did, documentUrl, document };
  }

  /**
   * Fetch a did.json URL. HTTPS only — http:// (or any other scheme) is
   * rejected before any network I/O, and an https→http redirect is rejected
   * after the fact via the response's final URL.
   */
  static async fetchDidJson(url: string, options: ResolveOptions = {}): Promise<AtpDidDocument> {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new DidResolutionError('insecureUrl', `Invalid URL: "${url}"`);
    }
    if (parsedUrl.protocol !== 'https:') {
      throw new DidResolutionError(
        'insecureUrl',
        `did:atp resolution requires HTTPS; refusing to fetch "${url}"`
      );
    }

    const fetchImpl = options.fetch ?? fetch;
    let response: Response;
    try {
      response = await fetchImpl(parsedUrl.toString(), {
        headers: { accept: 'application/did+json, application/json' },
        redirect: 'follow'
      });
    } catch (e) {
      throw new DidResolutionError('notFound', `Failed to fetch ${url}: ${(e as Error).message}`);
    }

    if (response.url && !response.url.startsWith('https:')) {
      throw new DidResolutionError(
        'insecureUrl',
        `did.json fetch was redirected to a non-HTTPS URL: "${response.url}"`
      );
    }
    if (!response.ok) {
      throw new DidResolutionError('notFound', `did.json fetch returned HTTP ${response.status} for ${url}`);
    }

    let document: unknown;
    try {
      document = await response.json();
    } catch {
      throw new DidResolutionError('invalidDidDocument', `did.json at ${url} is not valid JSON`);
    }
    if (typeof document !== 'object' || document === null || typeof (document as { id?: unknown }).id !== 'string') {
      throw new DidResolutionError('invalidDidDocument', `did.json at ${url} is not a DID Document`);
    }
    return document as AtpDidDocument;
  }
}
