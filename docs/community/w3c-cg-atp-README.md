<!--
  READY-TO-PASTE README for the w3c-cg/atp repository.
  Copy the content BELOW the line into w3c-cg/atp/README.md.
  (This wrapper note is not part of the README.)
-->

---

# Agent Trust Protocol (ATP) — W3C Community Group

A quantum-safe **identity, trust, and privacy layer for AI agents**. ATP extends the W3C
[Decentralized Identifiers](https://www.w3.org/TR/did-core/) and
[Verifiable Credentials](https://www.w3.org/TR/vc-data-model/) data models for autonomous
agents.

**Charter:** produce open specifications that fill the **Security and Privacy modules**
described by the [AI Agent Protocol Community Group](https://www.w3.org/community/agentprotocol/),
modules currently marked as pending community contribution.

> ⚠️ **Status: drafts for review — not yet adopted CG Reports.**
> The four specifications below are **input documents** to the Community Group, shared here
> so members can read and comment on them. They render with an **"Unofficial Draft"**
> banner. They become Community Group Reports only if and when the group votes to adopt
> them, at which point they will gain the formal W3C status, copyright, and IPR notices
> required by the [CG report requirements](https://www.w3.org/community/reports/reqs/).

## Read the specifications

Rendered (via GitHub Pages):

> **https://w3c-cg.github.io/atp/specs/**

| Spec | What it covers |
|---|---|
| [did:atp — Quantum-Safe DID Method](https://w3c-cg.github.io/atp/specs/did-atp/) | A DID method binding a classical Ed25519 key and a post-quantum ML-DSA-65 (FIPS 204) key in one hybrid identifier, with deterministic pairwise derivation. Backed by a runnable proof and published test vectors. |
| [Agent Trust Scoring & Credentials](https://w3c-cg.github.io/atp/specs/atp-trust/) | A deterministic, bounded, fail-closed trust model whose levels are expressible as signed W3C Verifiable Credentials. |
| [Privacy-First Interaction](https://w3c-cg.github.io/atp/specs/atp-privacy/) | Pairwise (per-relationship) identifiers, Merkle-based selective disclosure, and experimental zero-knowledge range proofs. |
| [Conformance & Interoperability](https://w3c-cg.github.io/atp/specs/atp-conformance/) | Normative conformance items and a vendor-neutral test-vector format for independent implementations to verify interoperability. |

The specifications are written with [ReSpec](https://respec.org/), a W3C-supported
specification tool.

## How to give feedback

Please file one **[GitHub issue](https://github.com/w3c-cg/atp/issues)** per topic —
questions, disagreements, gaps, and editorial nits are all welcome. We're running an
asynchronous review; there is no need to wait for a meeting to comment.

## Reference implementation & source of truth

These specs are edited and maintained, alongside a runnable reference implementation and
conformance suite, in the project repository:

- **Source & code:** https://github.com/agent-trust-protocol/atp-core
- **Runnable proof of concept:** https://github.com/agent-trust-protocol/atp-core/tree/main/proof
- **Conformance suite (`npm run conformance`):** https://github.com/agent-trust-protocol/atp-core/blob/main/scripts/conformance.mjs

The copies in *this* repository are review snapshots; spec edits are made in `atp-core` and
re-published here.

## License

Specifications are made available under the
[W3C Software and Document Notice and License](https://www.w3.org/copyright/software-license/)
when adopted as CG Reports. The reference implementation in `atp-core` is licensed under
Apache-2.0.

---

*Agent Trust Protocol™ — securing the agentic web, one trust relationship at a time.*
