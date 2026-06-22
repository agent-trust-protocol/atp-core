# W3C ATP — First-Version Submission Readiness

_Internal working doc. Tracks the path to pushing a credible first version to
the W3C ATP Community Group repo. Not for publication._

## Verdict (2026-06-22)

Not yet push-ready. The four technical pillars are at very different
maturities. Closing them in the order below makes the public claims match the
implementation (continuing the Tier-1 "make the W3C claims honest" effort that
landed #92 and #93).

## The four pillars

| # | Pillar | Status | Gap to close |
|---|--------|--------|--------------|
| 1 | `did:atp` quantum-safe DID method (Ed25519 + ML-DSA-65) | Closest | `/proof` PoC + `../common/` ReSpec assets missing; `identity-service` still emits the old `did:atp:<multibase>` format (T1.1); stale `W3C_ATP_SPECIFICATION.md` contradicts the good HTML spec |
| 2 | Trust scoring backed by W3C VCs | Honest, not wired | #92 made it fail-closed; the concrete vc-service verifier is not wired and the 3 protocol-integration wrappers inject no verifier (credit zero) |
| 3 | Privacy-first (pairwise DIDs, selective disclosure, ZKP) | Most overstated | Selective disclosure is real (Merkle); ZKP is experimental (#93); pairwise DIDs are doc-only (no implementation) |
| 4 | Conformance suite for interoperability | Internal only | Strong internal conformance harness; no vendor-neutral, spec-bound interop test vectors |

## Source of truth for the spec

- KEEP / push: `docs/specs/did-atp/index.html` — honest ReSpec draft, scoped to
  finalized standards (FIPS 204 ML-DSA-65, RFC 9964 JOSE/COSE, did:wba delta).
- RETIRE: `docs/W3C_ATP_SPECIFICATION.md` — stale (Jan 2025), wrong DID syntax,
  "CRYSTALS-Dilithium", ngrok URL, "Production Ready". Now a deprecation pointer.

## Recommended order to reach "ready"

1. Retire/reconcile the stale markdown spec; fix the proposal's broken links,
   ngrok URL, dates, and overclaims. **(doc — in progress)**
2. Add the `/proof` PoC and the ReSpec `common/` assets the spec references;
   land **T1.1** so `identity-service` emits `did:atp` v2. **(pillar 1)**
3. Wire the concrete VC verifier into `TrustScoringEngine` callers
   (vc-service + the 3 protocol-integration wrappers). **(pillar 2)**
4. Re-scope the privacy story: lead with selective disclosure + Merkle
   membership; mark ZKP and pairwise DIDs as roadmap/experimental. **(pillar 3)**
5. Package vendor-neutral interop test vectors tied to the did:atp spec.
   **(pillar 4 — sequenced after step 2)**

## Decisions still open

- Target: ATP's own CG repo vs. contributing into the AI Agent Protocol CG's
  did:wba/ANP work. The HTML spec is written as a did:wba *extension*, which
  leans toward the collaborative path.
