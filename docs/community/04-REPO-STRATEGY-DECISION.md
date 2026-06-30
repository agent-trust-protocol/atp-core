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

### Stage 1 — Now: self-contained spec review copies in `w3c-cg/atp` (specs only, no code)
- Keep the **editing source of truth** in `agent-trust-protocol/atp-core` (specs under
  `docs/specs/`, plus code, conformance suite, proof).
- Upload **review-only copies of the four specs** to `w3c-cg/atp` so members read and file
  feedback in the CG repo. These copies are **self-contained** — no links back to atp-core,
  so the in-progress implementation isn't put under scrutiny yet. See
  `05-W3C-CG-REPO-UPLOAD.md` (and the ready-to-push `atp-cg-specs-review.zip`).
- Share the rendered specs via the CG Pages site:
  https://w3c-cg.github.io/atp/specs/
- **No code goes to `w3c-cg/atp` yet** — specs only. Members who need the implementation
  get it later (Stage 2/3), or on request.

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

- [ ] **Now:** upload the self-contained spec review copies to `w3c-cg/atp` (specs only,
      no code) — unzip `atp-cg-specs-review.zip` and push per `05-W3C-CG-REPO-UPLOAD.md`.
- [ ] **Now:** use the self-contained README (`w3c-cg-atp-README.md`) — no atp-core links;
      enable Pages and share `https://w3c-cg.github.io/atp/specs/` (see `01`).
- [ ] **When atp-core is verified** (npm updates, README, code green): re-add the
      implementation links to the spec landing page + README (see `05` §5).
- [ ] **At first adoption vote:** execute Option A from `COMMUNITY-RELEASE.md` into
      `w3c-cg/atp`, apply the community-report requirements, flip ReSpec to
      `CG-DRAFT` + `group: "atp"`.
- [ ] **Only on CG request:** add the Option B service subset.

> The ready-to-paste README for `w3c-cg/atp` is `w3c-cg-atp-README.md` (self-contained,
> identical to the README inside the bundle). It supersedes the old placeholder that
> pointed back to atp-core.
