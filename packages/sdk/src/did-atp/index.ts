/**
 * did:atp v2 — a quantum-safe, hybrid-signature DID method extending did:wba.
 *
 * Implements the finalized specification in docs/specs/did-atp/index.html:
 *   - two-segment identifier  did:atp:<domain>[:path]:e1_<fp>:pq1_<fp>
 *   - RFC 7638 JWK-thumbprint binding fingerprints
 *   - separate Ed25519 + ML-DSA-65 keys (OKP JWK + RFC 9964 AKP JWK)
 *   - dual proofs: eddsa-jcs-2022 (classical) + ML-DSA-65 JWS (post-quantum)
 *   - did:web-style did.json resolution with mandatory dual-binding verification
 *
 * This module is self-contained and does not replace the legacy `DIDUtils`,
 * which remains in use across the monorepo.
 */
export * from './identifier.js';
export * from './jwk.js';
export * from './proof.js';
export * from './document.js';
export * from './resolve.js';
