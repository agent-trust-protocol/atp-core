# `did:atp` v2 — Implementation Gap Report

**Date:** 2026-06-10
**Scope:** `packages/sdk` (primary), `packages/identity-service` (where the SDK delegates)
**Reference:** [`docs/specs/did-atp/index.html`](./index.html) — finalized `did:atp` method specification

This report records the audited gap between the current `did:atp` implementation and the
finalized spec, **before** any v2 implementation work. No code changes accompany this report.

---

## Summary Matrix

| # | Spec requirement | `packages/sdk` | `packages/identity-service` | Severity |
|---|---|---|---|---|
| 1 | DID syntax `did:atp:<network>:<id>` | ✅ Correct | ❌ Omits network segment | **Critical** |
| 2 | `@context` includes `https://atp.dev/ns/v1` | ❌ Missing | ❌ Missing | **Critical** |
| 3 | `DilithiumVerificationKey2024` in DID document | ❌ Ed25519 only | ⚠️ Uses `DilithiumVerificationKey2023` | **Critical** |
| 4 | `HybridSignature2024` JSON proof format | ❌ `Ed25519Signature2020` / binary concat | ❌ Binary/abstracted format | **Critical** |
| 5 | `PUT /identity/update/{did}` with DID-JWT auth | ❌ Missing | ❌ Missing | Major |
| 6 | DID deactivation | ❌ Missing | ❌ Missing | Major |
| 7 | Key rotation 24h grace period | ❌ No grace logic | ❌ Old key replaced immediately | Major |
| 8 | Default `ATPGateway` service endpoint | ❌ None | ❌ Defaults to `[]` | Major |
| 9 | JSON-RPC 2.0 error codes (−32001…−32005) | ❌ HTTP/status-string codes | ❌ HTTP codes | Major |

---

## Detailed Findings

### 1. DID syntax — inconsistent between packages (Critical)

- `packages/sdk/src/utils/did.ts:25` generates `did:${method}:${network}:${fingerprint}`
  (network defaults to `mainnet` at lines 19–20) — **spec-conformant**.
- `packages/identity-service/src/utils/crypto.ts:153` generates `did:atp:${multibase}` with
  **no network segment** — non-conformant, and incompatible with DIDs minted by the SDK.
  Cross-package resolution of SDK-minted DIDs against the identity service is therefore broken
  at the format level.

### 2. Missing ATP `@context` (Critical)

- SDK (`packages/sdk/src/utils/did.ts:27-39`): `@context` contains only
  `https://www.w3.org/ns/did/v1`.
- Identity service (`packages/identity-service/src/services/identity.ts:57-84`): adds the W3C
  security-suite contexts but never `https://atp.dev/ns/v1`.

### 3. Post-quantum verification method (Critical)

- SDK documents carry only an `Ed25519VerificationKey2020` method; no Dilithium key at all.
- Identity service emits `DilithiumVerificationKey2023` (`services/identity.ts:50`) when
  quantum-safe mode is enabled; the spec requires `DilithiumVerificationKey2024`, and only
  conditionally — the spec makes the PQ key mandatory.

### 4. Hybrid signature proof format (Critical)

- `packages/sdk/src/utils/did.ts:182` signs DID documents with an `Ed25519Signature2020`
  proof — no post-quantum component.
- `packages/sdk/src/utils/crypto.ts:93-126` (`signData`) does produce hybrid
  Ed25519 + ML-DSA signatures, but as a length-prefixed binary concatenation hex string
  (`[ed_len][mldsa_len][ed_sig][mldsa_sig]`), not the spec's `HybridSignature2024` JSON
  structure with `classical` / `postQuantum` members.
- Identity service (`utils/crypto.ts:87-148`) routes hybrid signing through
  `CryptoAgilityManager` with its own combined format; also not `HybridSignature2024`.

### 5. Update operation (Major)

- SDK client (`packages/sdk/src/client/identity.ts`) exposes `registerDID` (POST
  `/identity/register`, line 47), `resolveDID` (line 54), `getDIDDocument` (line 61), and
  `rotateKeys` (lines 82–84), but **no** `PUT /identity/update/{did}`.
- Identity service controller has no full-document update endpoint and no DID-JWT
  authorization check for mutations.

### 6. Deactivation (Major)

No deactivation operation exists in the SDK client, identity service, or controller.
Required by spec §4.4 and by the GDPR right-to-be-forgotten claim in the legacy spec §12.2.

### 7. Key-rotation grace period (Major)

`packages/identity-service/src/services/identity.ts:196-214` (`rotateKeys`) replaces the
verification method in place; signatures by the previous key become unverifiable immediately.
Spec §5.3 requires a minimum 24-hour grace period. No grace logic exists in either package.

### 8. Service endpoints (Major)

Neither implementation provisions a default `ATPGateway` service entry; identity-service
defaults `service` to `[]` (`services/identity.ts:81`). Spec §3 says documents SHOULD include
the gateway endpoint.

### 9. Error codes (Major)

- SDK (`packages/sdk/src/client/base.ts:134-158`, `packages/sdk/src/types.ts:335-369`) uses
  string codes (`AUTHZ_ERROR`, `VALIDATION_ERROR`, `NOT_FOUND`, …) mapped from HTTP status.
- Identity service returns HTTP 404 + `{ success: false, error: "DID not found" }`.
- Nothing emits the spec's JSON-RPC codes: `DID_NOT_FOUND` (−32001), `INVALID_SIGNATURE`
  (−32002), `INSUFFICIENT_TRUST` (−32003), `CREDENTIAL_EXPIRED` (−32004),
  `QUANTUM_SIG_REQUIRED` (−32005).

---

## Test Coverage Gaps

Existing coverage (all mocked crypto / mocked axios / in-memory storage):

- `packages/sdk/src/__tests__/utils/did.test.ts` — generate/parse/validate DIDs, verification
  methods, sign/verify document proofs (mocked `CryptoUtils`).
- `packages/sdk/src/__tests__/client/identity.test.ts` — register/resolve/rotate/trust/MFA
  client calls (mocked axios).
- `packages/identity-service/src/services/__tests__/identity.test.ts` — register, resolve,
  trust level, rotate, list.

Missing tests (to be added during v2 implementation):

- Hybrid `HybridSignature2024` sign/verify round-trips with real crypto
- Mandatory Dilithium verification method in generated documents
- DID update (PUT) and deactivation flows
- Key-rotation grace-period behaviour
- JSON-RPC error-code mapping
- Cross-package DID format consistency (SDK ↔ identity-service)

---

## Suggested Remediation Order (for subsequent phases)

1. Unify DID syntax (fix identity-service network segment) — unblocks everything else.
2. DID document structure: ATP `@context`, mandatory `DilithiumVerificationKey2024`, default
   `ATPGateway` service.
3. `HybridSignature2024` proof format in `packages/sdk` (reusing existing `CryptoUtils`
   hybrid primitives — do not roll new crypto).
4. Update + deactivate operations with DID-JWT auth.
5. Key-rotation grace period.
6. JSON-RPC error-code layer.
