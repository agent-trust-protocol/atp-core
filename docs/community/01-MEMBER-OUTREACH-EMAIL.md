# ATP CG — Member Outreach Email (Draft Review Round)

Send this to the ATP Community Group mailing list / participants **about one to two
weeks before** the first meeting. Its only job is to get the four draft documents in
front of members so the first meeting is an *informed* discussion, not a cold read.

Per W3C guidance: these are **input documents to the CG** (for review), not yet adopted
CG reports. The email therefore points members at where the drafts live and invites
asynchronous feedback — it does **not** announce them as official CG deliverables.

---

## Subject

`ATP Community Group — please review four draft specifications before our first call`

## Body

Hello everyone, and welcome to the Agent Trust Protocol (ATP) Community Group.

Thank you for joining. Before we hold our first call, I'd like to give everyone a
chance to read the material asynchronously so our meeting time is spent on discussion
rather than introductions.

**What ATP is:** a quantum-safe identity, trust, and privacy layer for AI agents. It
extends the W3C [Decentralized Identifiers](https://www.w3.org/TR/did-core/) and
[Verifiable Credentials](https://www.w3.org/TR/vc-data-model/) data models for
autonomous agents. Our charter is to produce open specifications that fill the
**Security and Privacy modules** that the AI Agent Protocol Community Group has marked
as pending community contribution.

**Four draft specifications are ready for your review.** These are *input documents* —
proposals for the group to consider, refine, and (we hope) eventually adopt as CG
reports. They are written with [ReSpec](https://respec.org/), a W3C-supported spec tool,
and render in any browser:

> **Specifications landing page:**
> https://agent-trust-protocol.github.io/atp-core/specs/

1. **did:atp — Quantum-Safe DID Method** — a DID method binding a classical Ed25519 key
   and a post-quantum ML-DSA-65 (FIPS 204) key in one hybrid identifier, with
   deterministic pairwise derivation. *Backed by a runnable proof and published test
   vectors.*
2. **Agent Trust Scoring & Credentials** — a deterministic, bounded, fail-closed trust
   model whose levels are expressible as signed W3C Verifiable Credentials.
3. **Privacy-First Interaction** — pairwise (per-relationship) identifiers, Merkle-based
   selective disclosure, and experimental zero-knowledge range proofs.
4. **Conformance & Interoperability** — normative conformance items and a vendor-neutral
   test-vector format so independent implementations can verify interoperability.

**If you want to go deeper**, the reference implementation is open source:

- Runnable proof of concept: https://github.com/agent-trust-protocol/atp-core/tree/main/proof
- Conformance suite (`npm run conformance`): https://github.com/agent-trust-protocol/atp-core/blob/main/scripts/conformance.mjs
- Project repository: https://github.com/agent-trust-protocol/atp-core

**What I'm asking of you:**

- Please **read at least the landing page and the two draft specs closest to your
  interest** over the next **1–2 weeks**.
- Raise questions, disagreements, or gaps as **GitHub issues** on the project repo:
  https://github.com/agent-trust-protocol/atp-core/issues — one issue per topic is
  easiest to track. (No issue is too small; editorial nits are welcome too.)
- If you'd rather comment by email, just reply to this thread.

I'll send a calendar invite for our **first call** once the review window is open, with
a proposed agenda built around the feedback we receive. To accommodate members across
time zones, the group will work **asynchronously by default** and meet in real time only
occasionally — so reading and commenting on the drafts is the most valuable thing you
can do right now.

Looking forward to your feedback.

Best regards,
Larry Lewis
Chair, Agent Trust Protocol Community Group
Sovr Labs

---

## Editor's notes (do not send)

- **Timing:** send 1–2 weeks before the proposed first-call date. The review window *is*
  the ramp-up; don't shorten it.
- **Links:** confirm the GitHub Pages site is live (`Settings → Pages → Source: GitHub
  Actions`) before sending. If Pages isn't enabled yet, link to the spec sources under
  `docs/specs/` in the repo instead.
- **Issues vs. Discussions:** if you enable GitHub Discussions, point editorial feedback
  there and reserve Issues for actionable spec changes. Pick one and be consistent.
- **Don't over-claim status:** keep the "input documents / not yet adopted" framing.
  Calling them "CG reports" before the group adopts them is premature per W3C process.
