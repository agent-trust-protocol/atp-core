/**
 * did:atp v2 identifier + key-fingerprint primitives for `@atp/shared`.
 *
 * The canonical implementation now lives in the standalone `@atp/did-atp`
 * package — the SINGLE SOURCE OF TRUTH for the did:atp v2 fingerprint and
 * identifier-construction algorithm (Phase 2 of the de-duplication started in
 * #104). This module simply re-exports it so existing `@atp/shared` consumers
 * (and the `@atp/shared/identity/did-atp` import path) keep working unchanged.
 *
 * Do NOT re-implement any of these primitives here — edit `@atp/did-atp` so the
 * SDK, `@atp/shared`, and the identity service all stay byte-identical.
 */
export * from '@atp/did-atp';
