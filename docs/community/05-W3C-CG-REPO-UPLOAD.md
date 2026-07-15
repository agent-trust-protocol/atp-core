# Uploading the Review Copies to `w3c-cg/atp`

This is a **review-only** upload: put the four draft specs where CG members can read them
in a browser and file feedback. They remain **input documents** (status: *Unofficial
Draft*), **not** adopted CG Reports. The W3C liaison's note explicitly allows this —
"you can simply point participants at them wherever they reside."

> **Self-contained:** the review copies contain **no links back to
> `agent-trust-protocol/atp-core`**, so sharing the specs does not invite scrutiny of the
> reference implementation while it is still being finalized (npm package updates, README
> verification, code checks). The did:atp spec keeps its own embedded test vectors, so it
> stays credible standalone. Implementation links can be added later once atp-core is
> ready (see §4). A ready-to-push bundle reflecting all of this is provided as
> `atp-cg-specs-review.zip`.

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

- **The W3C group shortName stays `atp`.** The overall specification family is "ATP"; when
  the CG is formally registered, the ReSpec `group` value is `"atp"`. Do not rename the
  group or the spec family — that identity is fixed.

- **What distinguishes the copies is the status banner, not the name.** Both copies keep
  `specStatus: "unofficial"`, which ReSpec renders as a visible **"Unofficial Draft"**
  banner — exactly the honest label for a review input. Do **not** switch to `CG-DRAFT`
  yet: the group isn't formally registered, and ReSpec's `group: "atp"` lookup would 404
  and break the render. `CG-DRAFT` (with `group: "atp"`) comes only after the group adopts
  a document.

- **Roles of the two repos during review:**
  - `agent-trust-protocol/atp-core` → the **editor's source of truth**. All spec edits
    happen here; it carries the reference implementation, conformance suite, and proof.
    The review copies do **not** link to it (kept private-by-omission until finalized).
  - `w3c-cg/atp` → a self-contained **review snapshot** for members. When you revise a spec
    in atp-core, re-copy the changed file here. (Manual sync is fine at this volume; the
    specs change slowly during review.)

---

## 2. Files to upload to `w3c-cg/atp`

Copy these from `atp-core/docs/specs/` (plus the root `.nojekyll`). Target layout in
`w3c-cg/atp`:

```
README.md                          ← new; use docs/community/w3c-cg-atp-README.md
LICENSE.md                         ← W3C CG license; use docs/community/w3c-cg-LICENSE.md
CONTRIBUTING.md                    ← W3C CG contributing; use docs/community/w3c-cg-CONTRIBUTING.md
.nojekyll                          ← REQUIRED so GitHub Pages serves ReSpec verbatim
specs/
  index.html                       ← landing page (4 cards)
  common/
    respec-config.js               ← repoURL → w3c-cg/atp (see §5; pre-applied in bundle)
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
| `docs/community/w3c-cg-LICENSE.md` | `/LICENSE.md` |
| `docs/community/w3c-cg-CONTRIBUTING.md` | `/CONTRIBUTING.md` |
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
or internal docs. This is specs-for-review only, and the review copies deliberately do not
link to the code. Full code curation is a later step if the CG votes for it — see
`04-REPO-STRATEGY-DECISION.md` and `../COMMUNITY-RELEASE.md`.

> The provided `atp-cg-specs-review.zip` already contains exactly this tree with the
> self-contained edits applied — unzip it and you have the push-ready contents.

---

## 3. How to upload the files

**Important:** GitHub does **not** unzip an uploaded `.zip` — if you drag the zip into the
repo it just stores the zip file itself. **Unzip locally first, then upload the contents.**
Pick one of the two methods below.

### Method A — Git command line (recommended; handles the hidden `.nojekyll` reliably)

```bash
# 1. Unzip the bundle locally (creates README.md, .nojekyll, specs/)
unzip atp-cg-specs-review.zip -d atp-cg-upload

# 2. Clone the CG repo
git clone https://github.com/w3c-cg/atp.git
cd atp

# 3. Copy the unzipped contents in (the trailing /. copies hidden files like .nojekyll too)
cp -R ../atp-cg-upload/. .

# 4. Commit and push
git add -A
git commit -m "Add ATP draft specifications for Community Group review"
git push origin main
```

### Method B — GitHub web upload (drag & drop)

1. Unzip `atp-cg-specs-review.zip` locally.
2. On `https://github.com/w3c-cg/atp` → **Add file → Upload files**.
3. Drag in `README.md` and the **`specs/` folder** (the browser preserves the subfolders).
4. ⚠️ **The hidden `.nojekyll` file is the catch** — file pickers often hide dotfiles and
   the GitHub web uploader can skip it. After uploading, if `.nojekyll` is missing, create
   it directly in the browser: **Add file → Create new file**, name it exactly
   `.nojekyll`, leave it empty, commit. Without it GitHub Pages runs Jekyll and may mangle
   the ReSpec files. (Method A avoids this entirely.)

## 4. Enabling rendering (GitHub Pages, deploy-from-branch)

No Actions workflow needed:

1. Repo **Settings → Pages → Build and deployment → Source: "Deploy from a branch"**,
   Branch: `main`, Folder: **`/ (root)`**. Save.
2. The root `.nojekyll` disables Jekyll site-wide so the ReSpec files serve verbatim.
3. After the build, the rendered specs are at:
   **`https://w3c-cg.github.io/atp/specs/`**

That `/specs/` landing-page URL is what you put in the member outreach email
(`01-MEMBER-OUTREACH-EMAIL.md`), since members will be reviewing in the CG repo.

---

## 5. Self-contained edits (already applied in the provided bundle)

The bundle already has these applied — listed here so you can reproduce or audit them:

1. **`specs/common/respec-config.js`** → `repoURL: "https://github.com/w3c-cg/atp"` so
   ReSpec's auto-generated "file an issue / history" buttons land in the CG repo where
   members are reviewing. `specStatus: "unofficial"` is unchanged.
2. **`specs/index.html`** → the landing-page footer links to atp-core (proof, conformance,
   proposal, project repo) are replaced with two neutral links: "Provide feedback (GitHub
   issues)" → `w3c-cg/atp/issues`, and "AI Agent Protocol Community Group".
3. **`README.md`** → no atp-core links; an "Implementation status" section states the
   reference implementation is being finalized and will be linked when ready.

**W3C liaison corrections (also applied in the bundle):**

4. **No trademark on titles.** Removed the ™ from "Agent Trust Protocol" in the landing
   page (title and footer). W3C requires that CG specification titles not be trademarked
   prior to discussion with W3C. (Keep ™ on your own marketing site, not here.)
5. **No premature "CG document" status.** Landing-page eyebrow changed from "W3C Community
   Group Drafts" to "Draft specifications — community review", and the footer now states
   these are draft input documents, **not** adopted CG Reports.
6. **Correct W3C CG licensing.** Added `LICENSE.md` (W3C CG license: specs under the W3C
   CLA) and `CONTRIBUTING.md` (W3C CG contributing) from
   [w3c/licenses](https://github.com/w3c/licenses); README license section and the ReSpec
   `license` (now `cc-by` for the unofficial drafts, not `w3c-software-doc`) updated to
   match. On CG adoption, `specStatus` → `CG-DRAFT` and ReSpec applies the W3C CLA
   automatically.

> Tradeoff: review feedback lands in `w3c-cg/atp` issues, separate from atp-core issues.
> That's intended — members review in the CG repo. When you fix something, edit in atp-core
> (source of truth) and re-copy the changed file here.

### Re-adding atp-core links later (once the implementation is verified)

When atp-core is ready for eyes (npm updates in, README accurate, code green), restore the
implementation links: edit `specs/index.html`'s footer `links` block and the README
"Implementation status" section. Ask for a regenerated bundle, or do the two edits by hand.

---

## 6. Quick checklist

- [ ] Unzip `atp-cg-specs-review.zip` locally (don't upload the zip itself).
- [ ] Upload the contents (`README.md`, `LICENSE.md`, `CONTRIBUTING.md`, `.nojekyll`,
      `specs/`) via Method A or B (§3).
- [ ] Verify `.nojekyll` made it into the repo root (Method B's common miss).
- [ ] Enable Pages (Deploy from branch → main → `/ root`).
- [ ] Open `https://w3c-cg.github.io/atp/specs/` and click each of the four cards — confirm
      they render with an "Unofficial Draft" banner and the TOC builds.
- [ ] Confirm a spec's "file an issue" link points to `w3c-cg/atp`.
- [ ] Put that `/specs/` URL into the member outreach email and send.
