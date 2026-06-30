# Decision: How ATP Uses the `w3c-cg/atp` Repository

**Question:** should the community repo (`w3c-cg/atp`) eventually mirror the full
reference code, or stay specs-only — with `agent-trust-protocol/atp-core` remaining the
authoritative implementation?

**Recommendation: specs-first now; mirror code only if and when the CG votes to.**

This reflects the W3C liaison's guidance that the drafts are *input documents* today and
shouldn't be force-pushed into a repo prematurely — "you can simply point participants at
them wherever they reside." The repository decision follows the group's adoption process,
not the other way around.

---

## Recommended path

### Stage 1 — Now: point members at the existing repo (no `w3c-cg/atp` push yet)
- Keep everything in `agent-trust-protocol/atp-core` (specs under `docs/specs/`, code,
  conformance suite, proof).
- Share the rendered specs via GitHub Pages:
  https://agent-trust-protocol.github.io/atp-core/specs/
- Members review and file issues against `atp-core`. **No content goes to `w3c-cg/atp`
  yet** — there's nothing the CG has adopted to put there.

### Stage 2 — After the CG adopts a first document: `w3c-cg/atp` becomes specs-home
- When the group votes to adopt (e.g. did:atp) as a CG report, publish **the specs** to
  `w3c-cg/atp` and apply the W3C community-report requirements
  (https://www.w3.org/community/reports/reqs/): W3C copyright/document notice, IPR-compliant
  contributors, `specStatus: "CG-DRAFT"`, `group: "atp"` in the ReSpec config.
- `w3c-cg/atp` hosts the **specifications + conformance vectors** (the standards
  artifacts). It does **not** need to carry the full service implementation.

### Stage 3 — Only if the CG asks: mirror a reference-implementation subset
- If members want to stand up a node from the community repo, copy the lean reference
  subset (Option B in `docs/COMMUNITY-RELEASE.md`). Treat this as a CG decision, not a
  default.

---

## Why specs-first (not full mirror) by default

| Consideration | Specs-first | Full code mirror |
|---|---|---|
| Matches W3C process (drafts = input until adopted) | ✅ | ✅ but premature |
| Maintenance burden (one source of truth for code) | ✅ low | ❌ two repos to keep in sync |
| What a CG actually needs to review/adopt | ✅ specs + vectors | mostly noise |
| IPR/copyright surface to manage | ✅ small | ❌ large |
| Lets members run a full node | ⚠️ via link to atp-core | ✅ |

The only real advantage of a full mirror — letting a member run a complete node from the
CG repo — is already served by linking to `atp-core`, where the code is maintained and
CI-tested. Duplicating it into `w3c-cg/atp` creates a sync liability for a need the group
hasn't expressed.

---

## What's already prepared for whichever path

`docs/COMMUNITY-RELEASE.md` already documents:
- **Option A** (recommended): docs-forward — specs + proof + conformance + reference SDK.
- **Option B**: fuller reference-impl subset (adds identity/vc/permission/audit services).
- A pre-publish hygiene checklist (scrub ngrok URLs, secrets; isolation build/test).
- The exact push commands for `w3c-cg/atp`.

So Stage 2 maps to **Option A** and Stage 3 maps to **Option B** — no new prep needed;
just execute the relevant section when the CG decides.

---

## Concrete next actions tied to this decision

- [ ] **Now:** confirm GitHub Pages is live on `atp-core`; share the landing-page link
      (see `01-MEMBER-OUTREACH-EMAIL.md`).
- [ ] **Now:** do *not* push to `w3c-cg/atp`. Leave it empty or with a placeholder README
      that points back to `atp-core` and explains adoption is pending.
- [ ] **At first adoption vote:** execute Option A from `COMMUNITY-RELEASE.md` into
      `w3c-cg/atp`, apply the community-report requirements, flip ReSpec to `CG-DRAFT`.
- [ ] **Only on CG request:** add the Option B service subset.

### Suggested placeholder README for `w3c-cg/atp` (if you want the repo to not look empty)

```markdown
# Agent Trust Protocol (ATP) — W3C Community Group

This repository will host ATP specifications once the Community Group adopts them as
CG reports. Until then, the draft specifications and reference implementation live at:

- Specifications (rendered): https://agent-trust-protocol.github.io/atp-core/specs/
- Source & reference code: https://github.com/agent-trust-protocol/atp-core

ATP's charter: produce open specifications that fill the Security and Privacy modules
described by the AI Agent Protocol Community Group. Feedback is welcome as issues on the
atp-core repository.
```
