# ATP CG — First Meeting Agenda & Speaker Notes

A 60-minute first call, scheduled **after** the 1–2 week async review window so the
discussion is informed by feedback already filed as GitHub issues. Keep it to 60 minutes;
this is a working group, not a webinar.

**Format:** real-time call (recorded for members who can't attend live), minutes posted
to the repo afterward. Per W3C guidance, real-time meetings are *occasional* — the group
runs asynchronously by default — so use this hour to make decisions, not to read specs
aloud.

**Scheduling note (international group):** rotate or pick a time that's tolerable across
the members' time zones (many are overseas). Always record and post minutes so attendance
is never required to stay involved.

---

## Pre-read (sent with the invite)

- Specifications landing page: https://w3c-cg.github.io/atp/specs/
- The open GitHub issues filed during the review window (the de facto agenda input)

---

## Agenda (60 min)

| # | Item | Time | Lead |
|---|------|------|------|
| 1 | Welcome, roll call, scribe/minutes assignment | 5 min | Chair |
| 2 | Charter recap: filling AI Agent Protocol's Security & Privacy modules | 5 min | Chair |
| 3 | Walkthrough of the four drafts (status, not line-by-line) | 15 min | Editor |
| 4 | Review of feedback filed as issues; triage into themes | 15 min | Chair + all |
| 5 | Decide near-term priorities & first adoption candidate(s) | 10 min | All |
| 6 | Working mode: async cadence, issue process, meeting frequency | 5 min | Chair |
| 7 | Coordination with AI Agent Protocol CG (status + next step) | 3 min | Chair |
| 8 | Action items, owners, next checkpoint | 2 min | Chair |

---

## Speaker notes

### 1. Welcome & roll call (5 min)
- Thank everyone for reviewing in advance. Confirm a volunteer scribe; minutes go to the
  repo. Note the call is recorded.

### 2. Charter recap (5 min)
- One slide / one paragraph: ATP exists to produce open specs that fill the **Security and
  Privacy modules** the AI Agent Protocol CG marked as pending community contribution.
- Emphasize: we are *contributing input*, not competing. The four drafts are proposals for
  this group to shape and adopt.

### 3. Walkthrough of the four drafts (15 min, ~3–4 min each)
- **did:atp:** most mature — hybrid Ed25519 + ML-DSA-65, runnable proof, published test
  vectors. Frame as the likely first adoption candidate.
- **Trust scoring & credentials:** deterministic, fail-closed, expressible as W3C VCs.
- **Privacy:** pairwise DIDs + selective disclosure are solid; ZKP range proofs are
  explicitly experimental and flagged for crypto review.
- **Conformance:** vendor-neutral vectors + runner; the mechanism that will let
  independent implementations prove interop.
- Do **not** read specs aloud. Members read them already; surface only status + open
  questions.

### 4. Feedback triage (15 min)
- Walk the issues filed during review. Group into themes (e.g. "crypto/PQC questions,"
  "VC profile shape," "privacy threat model," "conformance scope").
- For each theme: assign an owner or mark "needs more discussion." Don't try to resolve
  everything live — capture and route.

### 5. Near-term priorities & first adoption candidate (10 min)
- Propose **did:atp** as the first document the group works toward adopting as a CG report
  (it's the most complete and has test vectors). Seek rough consensus, not a formal vote
  yet.
- Identify the 2–3 issues that block that adoption and assign them.

### 6. Working mode (5 min)
- **Async by default:** specs evolve via PRs + issues; anyone can comment anytime.
- **Meeting cadence:** propose **every 2–4 weeks** to start (lean toward 4 if momentum is
  async-heavy). Confirm the group's appetite. Note that many active W3C CGs meet roughly
  biweekly; rarely-meeting CGs are common too — let the work drive cadence.
- **Decisions:** record rough consensus in minutes + issues; controversial items get a
  dedicated issue with a comment period.

### 7. Coordination with AI Agent Protocol CG (3 min)
- Status: we've reached out to their chairs to ask how often they'd like updates (see the
  outreach draft). No joint meetings planned; cross-repo issues are the lightweight link.
- Action: report back next meeting on their preferred cadence.

### 8. Action items (2 min)
- Read back owners + due dates. Set the next checkpoint (async deadline or next call).

---

## Decisions to capture in minutes

- [ ] Confirmed meeting cadence (e.g. every N weeks)
- [ ] First adoption candidate (recommended: did:atp)
- [ ] Issue/PR process for spec feedback (Issues vs. Discussions)
- [ ] Owners for each feedback theme
- [ ] Preferred update cadence to AI Agent Protocol CG (pending their reply)

---

## Editor's notes (do not present)

- Keep slides minimal — the specs are the artifact. A one-page status grid is plenty.
- If turnout is low because the review window was too short, **postpone** rather than hold
  an uninformed call. The async review is the point.
- "Rough consensus" is the W3C norm at CG stage; avoid heavyweight voting this early.
