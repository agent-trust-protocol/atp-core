<!--
  NOTE: docs/W3C_ATP_SPECIFICATION.md is the LEGACY ATP v1 document. It is
  superseded, for the did:atp method, by docs/specs/did-atp/index.html (the
  finalized did:wba-extension spec). Where the two conflict, index.html wins.
-->

# `did:atp` v2 — Implementation Gap Report

**Date:** 2026-06-10
**Branch:** `feat/did-atp-v2`
**Scope:** `packages/sdk` (primary), `packages/identity-service` (where the SDK delegates)
**Audited against:** [`docs/specs/did-atp/index.html`](./index.html) — the finalized `did:atp`
method specification, defined as a **delta over `did:wba`** (`did:web` → `did:wba` → `did:atp`).

This report records the gap between the legacy `did:atp` implementation and the **finalized**
spec. The findings below describe the **pre-rebuild** state.

> **Resolution status (Phase 1):** A new, self-contained, spec-conformant module now lives at
> `packages/sdk/src/did-atp/` and closes items 1–7 and 9 below (two-segment identifier, RFC 7638
> thumbprints, separate Ed25519 + ML-DSA-65 keys, RFC 9964 AKP JWK, the dual `eddsa-jcs-2022` +
> ML-DSA-65 JWS proofs, `did:web`-style `did.json` resolution, and the correct FIPS 204 sizes —
> the actual ML-DSA-65 signature is **3309** bytes, resolving the 3293/3309 discrepancy noted in
> item 9). It is covered by `packages/sdk/src/__tests__/did-atp/did-atp.test.ts` (24 tests,
> including the RFC 8037 thumbprint vector and the spec's forged-classical-signature
> defense-in-depth case). The legacy `DIDUtils`/`CryptoUtils` are intentionally left in place
> (consumed across 8+ packages); item 8's Update/Deactivate operations and the migration of
> downstream consumers (`identity-service`, etc.) onto the new module remain as follow-up work.
> The findings below are preserved as the original audit record.

> **Important:** This supersedes the Phase-0 gap report, which was written against
> `docs/W3C_ATP_SPECIFICATION.md` — the **legacy** v1 design we are rebuilding *away from*.
> Requirements that exist *only* in that legacy document (the 24-hour key-rotation grace
> period, the `-3200x` JSON-RPC error codes, the `HybridSignature2024` proof format, the
> `https://atp.dev/ns/v1` `@context`) are **not** measured here as gaps. Anything from the
> legacy doc that still looks valuable but is absent from the finalized spec is listed in
> [Appendix A](#appendix-a-candidate-spec-additions-not-requirements) as a *candidate*, not a
> requirement.

---

## The finalized target, in one paragraph

A `did:atp` path-type identifier is `did:atp:<domain>[:<path>...]:e1_<fp>:pq1_<fp>` — a DNS
host (and optional path), then **two** trailing fingerprint segments. `e1_` is the classical
Ed25519 binding (byte-identical to `did:wba`); `pq1_` is a post-quantum ML-DSA-65 binding added
by this spec. Each fingerprint is an **RFC 7638 JWK thumbprint** (43 base64url chars). The two
keys are **separate** (no composite blob): Ed25519, plus ML-DSA-65 represented as an **RFC 9964
`AKP` JWK** (`{"kty":"AKP","alg":"ML-DSA-65","pub":...}`). The DID Document carries **two
independent proofs**: the classical `eddsa-jcs-2022` Data Integrity proof (from `did:wba`) and a
separate ML-DSA-65 **RFC 9964 JWS** over the same document. Resolution is **`did:web`-style** —
transform the DID to an HTTPS URL, fetch `did.json`, and verify **both** bindings; resolution
MUST fail if either fails. Rotating *either* key changes the DID, since both fingerprints are
part of the path.

---

## Summary Matrix

| # | Finalized requirement | Current `packages/sdk` / `identity-service` | Verdict |
|---|---|---|---|
| 1 | DID syntax `did:atp:<domain>[:path]:e1_<fp>:pq1_<fp>` | 3-segment `did:atp:<network>:<fingerprint>` (or `did:atp:<multibase>`) | ❌ Structural |
| 2 | RFC 7638 JWK thumbprint fingerprints (43 b64url) | `SHA256(hex pubkey).slice(0,16)` truncated hex | ❌ Algorithm |
| 3 | Two separate keypairs (Ed25519, ML-DSA-65) | Length-prefixed composite key/sig blob | ❌ Structural |
| 4 | ML-DSA-65 pubkey as RFC 9964 `AKP` JWK | `DilithiumVerificationKey2023` + `publicKeyMultibase` | ❌ Representation |
| 5 | Separate ML-DSA-65 RFC 9964 JWS proof | None (only internal binary hybrid sig) | ❌ Missing |
| 6 | Classical `eddsa-jcs-2022` Data Integrity proof | `Ed25519Signature2020` over pretty-printed JSON | ❌ Type + canon. |
| 7 | `did:web`-style HTTPS `did.json` resolution, dual-verify | In-memory store + universal-resolver JSON-RPC | ❌ Model |
| 8 | Create/Resolve/Update/Deactivate; key rotation changes DID | Create/Resolve/partial Update; rotation keeps DID; no Deactivate | ⚠️ Partial |
| 9 | ML-DSA-65 (FIPS 204): 1952-B key, 3309-B sig | `@noble/post-quantum` `ml_dsa65`; sizes ~match; labelled "Dilithium" | ⚠️ Naming |

Legend: ❌ = does not meet spec; ⚠️ = partially present / mislabelled.

---

## Detailed Findings

### 1. Identifier syntax — wrong shape entirely (Structural)

The spec mandates a domain-anchored, two-fingerprint path identifier
(`identifier-syntax` / ABNF in the spec). The code instead mints a network-anchored,
single-fingerprint identifier:

- `packages/sdk/src/utils/did.ts:25` — `did:${method}:${network}:${fingerprint}`; network
  defaults to `mainnet` (lines 19–20).
- `packages/sdk/src/utils/did.ts:57` — parser regex `^did:([^:]+):([^:]+):([^#]+)...` expects
  exactly method/network/identifier; it cannot represent a domain, path segments, or two
  fingerprint segments.
- `packages/identity-service/src/utils/crypto.ts:150-160` — `did:atp:${multibase}` (two
  segments, no network *and* no domain).

**Gap:** No concept of `<domain>`, path segments, or separate `e1_` / `pq1_` segments. The
generator and parser both need replacing. The SDK and identity-service also disagree with each
other today (network vs. bare multibase).

### 2. Fingerprints — not RFC 7638 thumbprints (Algorithm)

- `packages/sdk/src/utils/crypto.ts:215-219` — `createKeyFingerprint()` returns
  `sha256(hexPublicKey).slice(0, 16)` — a 16-hex-char (8-byte) truncation of a hash over the
  raw key hex.
- `packages/identity-service/src/utils/crypto.ts:150-154` — same truncated-hash approach.

**Gap:** The spec requires an RFC 7638 JWK thumbprint — SHA-256 over the *canonical JWK* (sorted
member names, no whitespace), base64url no-pad, 43 chars — computed for each of the two keys.
Neither the canonical-JWK construction nor the 43-char base64url output exists.

### 3. Keys — composite blob instead of two independent keypairs (Structural)

- `packages/sdk/src/utils/crypto.ts:16-24` — `HybridKeyPair` stores a combined
  `publicKey`/`privateKey` alongside optional component fields.
- `packages/sdk/src/utils/crypto.ts:68-77` — public key is the **length-prefixed concatenation**
  Ed25519(32) ‖ ML-DSA(1952); private key similarly concatenated.
- `packages/sdk/src/utils/crypto.ts:109-125` — `signData()` concatenates both signatures into
  one length-prefixed blob.

**Gap:** The spec treats the two keys as independent verification methods, each with its own
fingerprint segment and its own proof. The composite blob (and its single combined fingerprint)
is incompatible with the two-segment design and must be unbundled into separate Ed25519 and
ML-DSA-65 keys.

### 4. ML-DSA-65 public key — not an RFC 9964 AKP JWK (Representation)

- `packages/identity-service/src/services/identity.ts:49-52` — PQ verification method is
  `type: 'DilithiumVerificationKey2023'` with `publicKeyMultibase`.
- `packages/sdk/src/utils/did.ts:97-103` — DID utils can *read* a `publicKeyJwk` but never
  *emit* one; no `AKP` JWK is constructed anywhere.

**Gap:** The spec requires the ML-DSA-65 key as `{"kty":"AKP","alg":"ML-DSA-65","pub":"<b64url
1952-byte key>"}` (RFC 9964), in a `JsonWebKey` verification method, whose RFC 7638 thumbprint
equals the `pq1_` segment. Current output uses the wrong type and multibase encoding.

### 5. Post-quantum proof — no separate JWS (Missing)

- `packages/sdk/src/utils/did.ts:169-190` — `signDIDDocument()` emits a single
  `Ed25519Signature2020` proof.
- `packages/sdk/src/utils/crypto.ts:109-125` — hybrid ML-DSA signing exists but only inside
  `signData()`; it is never surfaced as a DID-Document proof.

**Gap:** The spec requires a **separate** ML-DSA-65 RFC 9964 JWS (JOSE) over the DID Document, in
addition to the classical proof. No JWS/JOSE PQ proof is produced.

### 6. Classical proof — wrong suite and canonicalization (Type + Canonicalization)

- `packages/sdk/src/utils/did.ts:182` — proof `type: 'Ed25519Signature2020'`.
- `packages/sdk/src/utils/did.ts:175` — signs `JSON.stringify(document, null, 2)`
  (pretty-printed, not canonical).
- For comparison, `packages/vc-service/src/services/credential.ts:194-195` canonicalizes via
  key-sorted `JSON.stringify`, which is still **not** JCS (RFC 8785).

**Gap:** The spec (via `did:wba`) requires an `eddsa-jcs-2022` Data Integrity proof, i.e. JCS
(RFC 8785) canonicalization. Current code uses `Ed25519Signature2020` over pretty-printed JSON.

### 7. Resolution — wrong model (Model)

- `packages/identity-service/src/services/identity.ts:125-136` — `resolveDID()` reads from
  **in-memory storage** first.
- `packages/identity-service/src/services/identity.ts:138-194` — external fallback hits a
  **universal-resolver JSON-RPC** endpoint (`DID_UNIVERSAL_RESOLVER_URL` + `/1.0/identifiers/`).
- SDK client `packages/sdk/src/client/identity.ts` resolves via ATP REST (`GET /identity/...`).

**Gap:** The spec requires `did:web`-style resolution: transform the DID's domain/path to an
HTTPS URL, fetch `did.json`, and verify **both** the classical and post-quantum bindings,
failing if either fails. None of: the domain→URL transform, the `did.json` fetch, or the
dual-binding verification exist.

### 8. Operations — partial; rotation semantics wrong (Partial)

- Create — present (`packages/identity-service/src/services/identity.ts:9-123`).
- Resolve — present but wrong model (see #7).
- Update — only partial (`addService()` at `:222-236`, `updateTrustLevel()` at `:242-272`); no
  general DID-Document update aligned to `did:wba`.
- Key rotation — `:196-220` replaces the verification method **in place**; the DID does **not**
  change. The spec says rotating *either* key changes the DID (the fingerprint is part of the
  path), so an in-place rotation that preserves the DID is semantically wrong.
- Deactivate — **absent**.

**Gap:** Bring operations into `did:wba` alignment; make key rotation produce a new DID; add
Deactivate.

### 9. ML-DSA-65 algorithm & sizes — right primitive, wrong labels (Naming)

- `packages/sdk/src/utils/crypto.ts:4` — imports `ml_dsa65` from `@noble/post-quantum/ml-dsa`
  (this is FIPS 204 ML-DSA-65 — the correct primitive).
- `packages/sdk/src/__tests__/utils/crypto.test.ts:35-38` — asserts a 1952-byte public key and a
  **3293**-byte signature; FIPS 204 ML-DSA-65 signatures are **3309** bytes. This discrepancy
  should be re-checked against the installed `@noble/post-quantum` version during implementation.
- `packages/identity-service/src/services/identity.ts:96` and the `DilithiumVerificationKey2023`
  type label the primitive as "Dilithium" rather than "ML-DSA-65".

**Gap:** The underlying primitive is acceptable, but every surface label (verification-method
type, algorithm enum, JWK `alg`) must read `ML-DSA-65`, and the expected signature size
(3293 vs. 3309) must be reconciled with FIPS 204.

---

## Test Coverage Gaps

Existing DID-related tests (all exercise the *current* design, not the finalized spec):

- `packages/sdk/src/__tests__/utils/did.test.ts` — generate/parse/validate/sign/verify DIDs
  (mocked `CryptoUtils`).
- `packages/sdk/src/__tests__/utils/crypto.test.ts` — Ed25519 + hybrid key/sign/verify and PQ
  sizes.
- `packages/sdk/src/__tests__/client/identity.test.ts` — REST identity-client calls (mocked
  axios).
- `packages/identity-service/src/services/__tests__/identity.test.ts` — register/resolve/
  trust/rotate against in-memory storage.

Tests to add for v2 (against the finalized spec):

- Two-segment `did:atp:<domain>[:path]:e1_<fp>:pq1_<fp>` generation and parsing; round-trip and
  rejection of network-style legacy DIDs.
- RFC 7638 thumbprint computation for both Ed25519 and `AKP` ML-DSA-65 JWKs (43-char output).
- `AKP` JWK construction and `pq1_` ↔ thumbprint equality.
- `eddsa-jcs-2022` classical proof with JCS (RFC 8785) canonicalization.
- Separate ML-DSA-65 RFC 9964 JWS proof; dual-proof verification.
- Resolution: domain→HTTPS transform, `did.json` fetch, and failure when **either** binding
  fails (incl. the forged-classical-signature defense-in-depth case from the spec's PoC).
- Operations: Update and Deactivate; key rotation yields a new DID.

How tests run (unchanged): `cd packages/sdk && npm test` (Jest; see `packages/sdk/jest.config.js`
and `package.json` scripts `test` / `test:coverage`).

---

## Suggested Remediation Order (for subsequent phases)

1. **Identifier core** — new generator/parser for `did:atp:<domain>[:path]:e1_<fp>:pq1_<fp>`;
   delete the network segment. Unblocks everything else.
2. **Fingerprints** — RFC 7638 JWK-thumbprint helper, used for both segments.
3. **Keys** — split the composite `HybridKeyPair` into independent Ed25519 and ML-DSA-65 keys;
   emit the ML-DSA-65 key as an RFC 9964 `AKP` JWK verification method.
4. **Proofs** — `eddsa-jcs-2022` (JCS) classical proof + a separate ML-DSA-65 RFC 9964 JWS
   proof; reuse the existing `@noble` primitives (do **not** roll new crypto).
5. **Resolution** — `did:web`-style `did.json` retrieval with mandatory dual-binding
   verification.
6. **Operations** — `did:wba`-aligned Update/Deactivate; rotation-changes-DID semantics.
7. **Labels/sizes** — rename Dilithium→ML-DSA-65 throughout; reconcile the 3293 vs. 3309
   signature-size expectation.

---

## Appendix A — Candidate spec additions (NOT requirements)

These appear in the **legacy** `docs/W3C_ATP_SPECIFICATION.md` but are **absent** from the
finalized spec. They are recorded here as ideas to raise with the spec authors, **not** as gaps
to implement:

- **24-hour key-rotation grace period** (legacy §6.3). The finalized spec makes rotation change
  the DID, so an overlap window would need a different framing (e.g. a deprecation note on the
  old DID Document) if desired at all.
- **Structured error code registry** `-32001..-32005` (legacy Appendix B). The finalized spec is
  resolution-centric (`did.json` over HTTPS) and does not define a JSON-RPC error surface;
  HTTP/resolution-result semantics likely suffice, but a small documented error vocabulary could
  aid interop.
- **Explicit trust-score / verifiable-credential coupling** (legacy §7, §9). The finalized spec
  is intentionally identity-only; ATP trust scoring lives outside the DID method. Worth a
  cross-reference note rather than a method requirement.
- **`ATPGateway` service-endpoint convention** (legacy §5.2). Not required by the finalized spec;
  could be offered as an optional, documented service `type` for discovery.

None of the above is treated as a v2 implementation requirement.
