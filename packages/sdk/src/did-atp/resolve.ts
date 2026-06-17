/**
 * did:atp v2 — did:web-style resolution.
 *
 * Resolution is adopted unchanged from did:wba/did:web: the method-specific
 * identifier is transformed into an HTTPS URL and a `did.json` document is
 * fetched. did:atp then additionally verifies BOTH bindings; resolution fails
 * if either the classical or the post-quantum binding fails.
 *
 * There is no ATP REST endpoint and no JSON-RPC here.
 */
import { parseAtpDid } from './identifier.js';
import { AtpDidDocument, verifyAtpDidDocument } from './document.js';

export type FetchLike = (
  url: string,
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

export interface ResolutionResult {
  didDocument: AtpDidDocument | null;
  didResolutionMetadata: { contentType?: string; error?: string };
  didDocumentMetadata: Record<string, unknown>;
}

/**
 * Transform a did:atp identifier into the HTTPS URL of its `did.json`,
 * following the did:web rules (colon-separated path segments → "/"-separated
 * path; root DIDs use `/.well-known`). The `e1_`/`pq1_` fingerprint segments
 * are part of the path.
 */
export function didToHttpsUrl(did: string): string | null {
  const parsed = parseAtpDid(did);
  if (!parsed) {
    return null;
  }
  // Percent-encoded port (%3A) is decoded back to ":" for the host authority.
  const authority = parsed.domain.replace(/%3[Aa]/, ':');
  const pathParts = [...parsed.pathSegments, parsed.e1, parsed.pq1];
  // A path-type did:atp always has at least the two fingerprint segments, so
  // it never uses the /.well-known form; that branch is kept for completeness.
  const path = pathParts.length > 0 ? `/${pathParts.join('/')}` : '/.well-known';
  return `https://${authority}${path}/did.json`;
}

/**
 * Resolve a did:atp identifier. Fetches `did.json` and verifies both bindings.
 * @param fetchImpl injectable fetch (defaults to the global `fetch`).
 */
export async function resolveAtpDid(
  did: string,
  fetchImpl?: FetchLike,
): Promise<ResolutionResult> {
  const empty = {
    didDocument: null,
    didDocumentMetadata: {},
  };

  const url = didToHttpsUrl(did);
  if (!url) {
    return { ...empty, didResolutionMetadata: { error: 'invalidDid' } };
  }

  const doFetch: FetchLike =
    fetchImpl ?? (globalThis.fetch as unknown as FetchLike);
  if (!doFetch) {
    return { ...empty, didResolutionMetadata: { error: 'noFetchAvailable' } };
  }

  let document: AtpDidDocument;
  try {
    const res = await doFetch(url);
    if (!res.ok) {
      return {
        ...empty,
        didResolutionMetadata: { error: res.status === 404 ? 'notFound' : 'fetchError' },
      };
    }
    document = (await res.json()) as AtpDidDocument;
  } catch {
    return { ...empty, didResolutionMetadata: { error: 'fetchError' } };
  }

  if (document?.id !== did) {
    return { ...empty, didResolutionMetadata: { error: 'idMismatch' } };
  }

  const verification = await verifyAtpDidDocument(document);
  if (!verification.valid) {
    return {
      ...empty,
      didResolutionMetadata: { error: 'verificationFailed' },
      didDocumentMetadata: { verification },
    };
  }

  return {
    didDocument: document,
    didResolutionMetadata: { contentType: 'application/did+ld+json' },
    didDocumentMetadata: { verification },
  };
}
