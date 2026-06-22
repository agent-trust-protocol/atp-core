# Agent Trust Protocol™ (ATP) Specification — DEPRECATED

> **This document has been retired.** It described an early (January 2025) draft
> with a DID syntax (`did:atp:<network>:<id>`) that no implementation emits,
> pre-finalization crypto names ("CRYSTALS-Dilithium"), and status claims that
> no longer hold. It contradicted the current, standards-aligned specification
> and has been replaced to avoid publishing inaccurate claims.

## Current specification

The authoritative `did:atp` specification is the ReSpec document:

- **`docs/specs/did-atp/index.html`** — _The did:atp DID Method: A Quantum-Safe,
  Hybrid-Signature Profile Extending did:wba._

It is scoped to **finalized** standards only:

- **FIPS 204** ML-DSA-65 (post-quantum signatures)
- **RFC 9964** JOSE/COSE serialization for ML-DSA
- **did:wba** (classical Ed25519 binding, resolution, and DID Document
  processing — adopted unchanged by normative reference)

`did:atp` is defined as a **delta over `did:wba`**: it adds exactly one
capability — a post-quantum binding key and signature path — on top of the AI
Agent Protocol Community Group's web-native agent identity model. Stripping the
post-quantum segment from a `did:atp` identifier yields a valid `did:wba`
identifier.

## Related documents

- Community Group proposal: `docs/W3C_SUBMISSION_PROPOSAL.md`
- AI Agent Protocol CG engagement plan: `docs/AI_AGENT_PROTOCOL_CG_ACTION_PLAN.md`
- Submission readiness tracker (internal): `docs/internal/W3C_SUBMISSION_READINESS.md`
