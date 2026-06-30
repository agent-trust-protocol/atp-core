# Uploading the Review Copies to `w3c-cg/atp`

This is a **review-only** upload: put the four draft specs where CG members can read them
in a browser and file feedback. They remain **input documents** (status: *Unofficial
Draft*), **not** adopted CG Reports. The W3C liaison's note explicitly allows this —
"you can simply point participants at them wherever they reside."

---

## 1. Naming: one spec identity, two hosting locations

**Do not create an "atp-core version" and a separate "w3c version" of each spec.** A
specification is a single document with a single name; only its *hosting location* and
*status label* differ. Two differently-named copies would drift and members wouldn't know
which is canonical.

So:

- **Keep the existing shortNames, identical in both repos.** They are already correct for
  W3C:

  | shortName | Human-readable title | Why this name |
  |---|---|---|
  | `did-atp` | did:atp — Quantum-Safe DID Method | W3C convention is `did-<method>`; matches the `did:atp` method name |
  | `atp-trust` | Agent Trust Scoring & Credentials | Consistent `atp-` family |
  | `atp-privacy` | Privacy-First Interaction | Consistent `atp-` family |
  | `atp-conformance` | Conformance & Interoperability | Consistent `atp-` family |

- **What distinguishes the copies is the status banner, not the name.** Both copies keep
  `specStatus: "unofficial"`, which ReSpec renders as a visible **"Unofficial Draft"**
  banner — exactly the honest label for a review input. Do **not** switch to `CG-DRAFT`
  yet: the group isn't formally registered, and ReSpec's `group: "atp"` lookup would 404
  and break the render. `CG-DRAFT` comes only after the group adopts a document.

- **Roles of the two repos during review:**
  - `agent-trust-protocol/atp-core` → the **editor's source of truth**. All spec edits
    happen here; it carries the reference implementation, conformance suite, and proof.
  - `w3c-cg/atp` → a **review snapshot** for members. When you revise a spec in atp-core,
    re-copy the changed file here. (Manual sync is fine at this volume; the specs change
    slowly during review.)

State this division in the `w3c-cg/atp` README (the ready-to-paste README does).

---

## 2. Files to upload to `w3c-cg/atp`

Copy these from `atp-core/docs/specs/` (plus the root `.nojekyll`). Target layout in
`w3c-cg/atp`:

```
README.md                          ← new; use docs/community/w3c-cg-atp-README.md
.nojekyll                          ← REQUIRED so GitHub Pages serves ReSpec verbatim
specs/
  index.html                       ← landing page (4 cards)
  common/
    respec-config.js               ← one edit: repoURL → w3c-cg/atp (see §4)
    biblio.js                      ← local bibliography (FIPS 204, RFC refs)
  did-atp/
    index.html                     ← most mature spec
    test-vectors.json              ← published did:atp vectors
  atp-trust/
    index.html
  atp-privacy/
    index.html
  atp-conformance/
    index.html
```

Source → destination mapping (everything keeps the same relative structure, so ReSpec's
relative `../common/respec-config.js` loads keep working):

| From `atp-core` | To `w3c-cg/atp` |
|---|---|
| `docs/.nojekyll` | `/.nojekyll` |
| `docs/specs/index.html` | `/specs/index.html` |
| `docs/specs/common/respec-config.js` | `/specs/common/respec-config.js` |
| `docs/specs/common/biblio.js` | `/specs/common/biblio.js` |
| `docs/specs/did-atp/index.html` | `/specs/did-atp/index.html` |
| `docs/specs/did-atp/test-vectors.json` | `/specs/did-atp/test-vectors.json` |
| `docs/specs/atp-trust/index.html` | `/specs/atp-trust/index.html` |
| `docs/specs/atp-privacy/index.html` | `/specs/atp-privacy/index.html` |
| `docs/specs/atp-conformance/index.html` | `/specs/atp-conformance/index.html` |

**Do NOT upload (yet):** the reference code, `packages/`, the conformance runner scripts,
or internal docs. This is specs-for-review only. (Members who want the code follow the
link to atp-core.) Full code curation is a later step if the CG votes for it — see
`04-REPO-STRATEGY-DECISION.md` and `../COMMUNITY-RELEASE.md`.

---

## 3. Enabling rendering (GitHub Pages, deploy-from-branch)

Simplest path for a manual upload — no Actions workflow needed:

1. Push the files above to `w3c-cg/atp` (default branch, e.g. `main`).
2. Repo **Settings → Pages → Build and deployment → Source: "Deploy from a branch"**,
   Branch: `main`, Folder: **`/ (root)`**. Save.
3. The root `.nojekyll` disables Jekyll site-wide so the ReSpec files serve verbatim.
4. After the build, the rendered specs are at:
   **`https://w3c-cg.github.io/atp/specs/`**

That `/specs/` landing-page URL is what you put in the member outreach email
(`01-MEMBER-OUTREACH-EMAIL.md`) instead of the atp-core Pages URL, since members will be
reviewing in the CG repo.

---

## 4. One config edit before upload (feedback links)

In the **uploaded copy** of `specs/common/respec-config.js`, point the GitHub links at the
CG repo so ReSpec's auto-generated "file an issue / history" buttons land where members are
reviewing:

```js
github: {
  repoURL: "https://github.com/w3c-cg/atp",
  branch: "main",
},
```

(Leave the atp-core copy pointing at atp-core.) Keep `specStatus: "unofficial"` unchanged.

> Tradeoff: review feedback then lands in `w3c-cg/atp` issues, separate from atp-core
> issues. That's the right call here because you explicitly want members reviewing in the
> CG repo. When you fix something, edit in atp-core (source of truth) and re-copy the file.

---

## 5. Quick checklist

- [ ] Copy the 9 spec files + `.nojekyll` into `w3c-cg/atp` per the layout above.
- [ ] Edit `specs/common/respec-config.js` → `repoURL: https://github.com/w3c-cg/atp`.
- [ ] Add `README.md` from `docs/community/w3c-cg-atp-README.md`.
- [ ] Enable Pages (Deploy from branch → main → `/ root`).
- [ ] Open `https://w3c-cg.github.io/atp/specs/` and click each of the four cards — confirm
      they render with an "Unofficial Draft" banner and the TOC builds.
- [ ] Confirm a spec's "file an issue" link points to `w3c-cg/atp`.
- [ ] Put that `/specs/` URL into the member outreach email and send.
