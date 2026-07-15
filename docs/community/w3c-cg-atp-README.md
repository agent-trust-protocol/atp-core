<!--
  READY-TO-PASTE README for the w3c-cg/atp repository.
  This is the SELF-CONTAINED version (no links back to agent-trust-protocol/atp-core).
  It is identical to the README.md inside atp-cg-specs-review.zip.
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
| [did:atp — Quantum-Safe DID Method](https://w3c-cg.github.io/atp/specs/did-atp/) | A DID method binding a classical Ed25519 key and a post-quantum ML-DSA-65 (FIPS 204) key in one hybrid identifier, with deterministic pairwise derivation. Includes published, vendor-neutral test vectors. |
| [Agent Trust Scoring & Credentials](https://w3c-cg.github.io/atp/specs/atp-trust/) | A deterministic, bounded, fail-closed trust model whose levels are expressible as signed W3C Verifiable Credentials. |
| [Privacy-First Interaction](https://w3c-cg.github.io/atp/specs/atp-privacy/) | Pairwise (per-relationship) identifiers, Merkle-based selective disclosure, and experimental zero-knowledge range proofs. |
| [Conformance & Interoperability](https://w3c-cg.github.io/atp/specs/atp-conformance/) | Normative conformance items and a vendor-neutral test-vector format for independent implementations to verify interoperability. |

The specifications are written with [ReSpec](https://respec.org/), a W3C-supported
specification tool.

## How to give feedback

Please file one **[GitHub issue](https://github.com/w3c-cg/atp/issues)** per topic —
questions, disagreements, gaps, and editorial nits are all welcome. We're running an
asynchronous review; there is no need to wait for a meeting to comment.

## Implementation status

These specifications are backed by a reference implementation and a conformance test
suite. The implementation is being finalized for public review and will be linked here
once it is ready; until then, the specifications above stand on their own (the did:atp
spec ships with its own published test vectors).

## License

This repository follows the standard W3C Community Group licensing (see
[`LICENSE.md`](LICENSE.md) and [`CONTRIBUTING.md`](CONTRIBUTING.md)):

- **Specifications** — contributions are made under the
  [W3C Community Contributor License Agreement (CLA)](https://www.w3.org/community/about/agreements/cla/).
- **Other reports** — [W3C Software and Document License](https://www.w3.org/copyright/software-license/).
- **Test suites** — [W3C 3-clause BSD License](https://www.w3.org/copyright/3-clause-bsd-license-2008/).

Substantive contributions to specifications require joining the Community Group.
