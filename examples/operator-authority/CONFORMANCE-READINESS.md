# ATP Core conformance readiness

Internal engineering record for PR #172 (issue #169). **NO-GO for external submission.** First recorded October 24, 2026; updated November 7, 2026. The update below is current. The sections after it are the October 24 checkpoint, kept unchanged as the record that the evidence hashes describe, except where marked superseded.

## Update — November 7, 2026

### What changed on the branch

| Item | Reference |
|---|---|
| Verified commit (code and fixtures) | `0e55055` (merge of `main` into `test/169-operator-authority-fixtures`) |
| PR #173 (revision-3 mapping, including the live-read adapter from #175) | squash-merged into this branch as `c23d39a` |
| Live-read note linking the open lab question | `2d7b80f` |
| `main` merged in | `package.json` and `package-lock.json` taken from `main` unchanged |
| PR #172 merged into `main` | squash commit `3856db0` (2026-11-08 00:58 UTC), at head `0e55055` |

Merging into `main` is not an external submission; the NO-GO above still applies to sending this work to the lab.

`main` removed the legacy Next.js site from atp-core in #200. That removed `src/` (including `src/lib/email.ts` and the `/api/request-access` route) and the root dependencies `next`, `eslint-config-next`, `nodemailer`, `kysely`, `lucide-react`, `postcss` and `tailwindcss`. This branch's only change to the root package files was the `next` / `eslint-config-next` 15.5.28 bump (`4f7bb5c`), which no longer has anything to apply to. After the merge, the branch differs from `main` only in `examples/operator-authority/` and `.github/workflows/operator-authority-fixtures.yml`.

### Re-verification (Node v24.4.0, macOS, after `npm ci --include=dev --ignore-scripts` from `main`'s lockfile)

| Check | Result |
|---|---|
| Fixture suites, both pinned lab corpora required (`ATP_REQUIRE_LAB_CORPUS=1`) | 57 pass, 0 fail, 0 skipped |
| Corpus pins | revision 2 at `7141c616`, vectors `a0a07ea5…`; revision 3 at `7774daee`, vectors `3b7b3fb9…`; both match |
| Revision-3 historical comparison | action 44/44, `refusal_reason` 44/44, `grant_ref` 42/44; the disagreement set is exactly LRA-09-r1 and LRA-09-r2, as disclosed. Not a conformance pass |
| Revision-3 live-read comparison (`live_standing_read`, exclusive, P1) | 44/44 on action, reason, `grant_ref` and local read contract |
| `npm run conformance` | 510/510 across five items (does not exercise these fixtures) |
| GitHub CI on `0e55055` | 28/28 checks pass, including lint/type-check/test, the operator-authority workflow, CodeQL, Semgrep and per-package audits |
| `npm audit --audit-level=critical` | exit 0 (0 critical) |

The lab clarified on aps-conformance-suite#192 (2026-10-26) that `live_standing_read` requires one status read for every unexpired, correctly bound call, including an out-of-scope operation. The live-read adapter implements that. One boundary remains open: whether a not-yet-valid grant (`now < notBefore`) needs a read, and which refusal reason applies. ATP asked on #192 on 2026-11-07; there is no answer as of this update. ATP's current behaviour there is its own choice, not a conforming result.

### Dependency findings now

The root lockfile is identical to `main`'s, so these findings are inherited from `main`, not introduced by this branch. `npm audit` on `0e55055`: 0 critical, 3 high, 17 moderate, 4 low.

| Severity | Package | Path | Available fix |
|---|---|---|---|
| High | `axios` 1.0.0–1.19.0 | direct | non-major update available |
| High | `follow-redirects` 1.16.0–1.16.1 | nested | non-major update available |
| High | `browserslist` ≤4.28.6 | nested, build tooling | non-major update available |
| Moderate / low | `jest`, `ts-jest` and their nested packages, `glob`, `minimatch`, `baseline-browser-mapping` | test and build tooling | mostly via a major `jest` / `ts-jest` change |

Whether the `axios` / `follow-redirects` findings are reachable from SDK runtime paths has not been assessed here. They belong to a `main` dependency update, not to this PR.

The nodemailer, postcss and Tailwind findings in the October 24 table below no longer apply: those packages and the code that used them are gone from the root project.

### Review threads (GitHub, November 7)

Six threads are resolved and outdated: both Semgrep mutable-tag findings, and the four Greptile findings on `fixture-policy.mjs` and `signed-mandate.mjs`. A seventh, a code-quality note that `revision-3/lab-revision3-live.mjs` line 105 passed a superfluous second argument to its own `observationUsed(result)`, is fixed in the same commit as this note. The argument was ignored, so behaviour is unchanged; fixtures re-ran at 57/57 and the live-read comparison at 44/44.

### Remaining gates before any external submission

1. Close or explicitly accept the open gaps in the Studio runtime tests. The tests exist and run (atp-studio#94, #95): on 2026-11-07 they passed 66/66 locally with Docker, including 13 integration tests against a disposable PostgreSQL container, and the same 13 passed in Studio CI. They cover revocation timing, concurrent replay and audit-failure handling with effects measured on a protected resource. Some matrix items are covered at the decision level only, and some known gaps remain; both are tracked in atp-studio#94. Studio results are separate evidence and are not substituted for ATP Core proof.
2. Define canonical, authenticated, versioned mandate proofs using the shared utilities.
3. Independent reproduction by someone who authored neither the inputs nor the implementation.
4. Final provenance, secrets and claims review, then founder approval.

Closed since October 24: the old gate 1 (push and fresh CI, Semgrep and Greptile review; the threads it named are resolved), the old gate 2 (nodemailer and postcss/Tailwind; removed with the legacy site), and the code-quality thread above. The `axios` / `follow-redirects` / `browserslist` findings are a `main` maintenance item, not a gate for this PR. The not-yet-valid question on #192 is not a gate for the revision-3 vectors, which contain no such call.

The scope limits under "What this does not establish" still apply, with one addition: revision-3 refusal reasons and grant references are now compared against the pinned revision-3 corpus in `revision-3/`, still as ATP-authored, author-produced evidence (Mode A) and not as a conformance claim. The October 24 statement that "no revision-3 schema is adopted or claimed" remains true.

---

## October 24, 2026 checkpoint

This record supersedes the "Verified outcomes" table of the earlier off-repo package `ATP_Conformance_Readiness_2026-10-24` for the commits listed below. That package's files are unchanged and its own SHA-256 manifest still verifies.

### Source

| Item | Reference |
|---|---|
| PR #172 remote head before this work | `5fb127ada28910c4a64f98cc10842013ea66d29b` |
| Package patch 1/2 — Next.js / eslint-config-next 15.5.28 | `4f7bb5c` (original authorship preserved; original local ID `7263517`) |
| Package patch 2/2 — SDK crypto, revision-2 mapping | `219d68f` (original authorship preserved; original local ID `1b4e624`) |
| Fixture workflow action pinning | `c160a5f` |
| Gate run source commit | `c160a5f14e84b9836677c2da21196d0b6b0afda7`, clean worktree before and after |
| External lab corpus commit | `Agent-Authority-Conformance/aps-conformance-suite@7141c6167acfdd5288ec7cc1ca8d2ba9207b3390` |
| Frozen revision-2 vectors SHA-256 | `a0a07ea58bcacfd056cbd648e03de4ff14778aa151e8b5d2574e43e31a111ed8` |

The package patch applied with `git am` to the clean branch. The resulting tree (`8759706…`) is identical to an independent scratch application, and the post-image blobs match the patch's `index` lines.

### Workflow hardening (`c160a5f`)

`.github/workflows/operator-authority-fixtures.yml` now pins every action to a full commit SHA with a version comment:

| Action | SHA | Tag |
|---|---|---|
| `actions/checkout` (repository checkout) | `11d5960a326750d5838078e36cf38b85af677262` | v4.4.0 |
| `actions/setup-node` | `49933ea5288caeca8642d1e84afbd3f7d6820020` | v4.4.0 |
| `actions/checkout` (lab corpus, read-only) | `11d5960a326750d5838078e36cf38b85af677262` | v4.4.0 |

Each SHA was resolved from the upstream `v4` ref via the GitHub API and cross-checked with `git ls-remote`, where `v4` and `v4.4.0` point to the same commit. `permissions: contents: read`, `persist-credentials: false` on the lab checkout, and all steps are unchanged.

**Lab corpus immutability.** The lab checkout `ref` is a full 40-character SHA that resolves to a commit (2026-10-24T15:23:11Z); no branch shadows that name. Independently of the ref, `lab-revision2.mjs` hashes the corpus bytes and throws `Frozen revision-2 corpus digest mismatch` **before parsing**. The test asserts this, and the gate below shows the CLI exits 1 on a one-byte-altered corpus. In CI the corpus path is always set, so a missing corpus fails the test rather than skipping it. Locally, without `ATP_LAB_REVISION2_VECTORS`, the test reports an explicit skip (see step 12).

**Revision-3.** Refusal reasons and grant references appear only as labelled local metadata (`proposed_revision3_fields: 'local metadata only; not a revision-3 conformance claim'`). No revision-3 schema is adopted or claimed.

### Gate results

Environment: macOS 26.4 arm64. Node v20.19.1 / npm 10.8.2 for the main gate (matches `.nvmrc` and `ci.yml`). Node v24.3.0 / npm 11.4.2 for the fixture workflow commands (the workflow requests Node 24). Run 2026-10-24T21:32:48Z–21:34:07Z.

| # | Command | Node | Exit | Result |
|---|---|---|---|---|
| 01 | `npm ci --include=dev` | 20 | 0 | Locked install |
| 02 | `npm run lint` | 20 | 0 | 0 errors, 288 warnings (pre-existing; threshold unchanged) |
| 03 | `npm run type-check` | 20 | 0 | Pass |
| 04 | `npm test -- --ci` | 20 | 0 | 51/51 suites, 1,095/1,095 tests |
| 05 | `npm run conformance` | 20 | 0 | 510 tests across 5 items |
| 06 | `npm run build` | 20 | 0 | Compiled; 31/31 static pages. The Next config skips lint and type validation during build; steps 02–03 cover them |
| 07 | `npm audit --audit-level=critical` | 20 | 0 | **Blocking gate passes** (0 critical; was 1 at `5fb127a`) |
| 08 | `npm audit --audit-level=high` | 20 | 1 | Advisory in CI; 2 high remain (below) |
| 10 | `npm ci --include=dev --ignore-scripts --prefix packages/sdk` | 24 | 0 | Locked SDK install |
| 11 | `ATP_LAB_REVISION2_VECTORS=<corpus> node --test examples/operator-authority/*.test.mjs` | 24 | 0 | 35/35 pass, 0 skipped |
| 12 | Same, corpus variable unset | 24 | 0 | 34 pass, **1 explicit skip** (revision-2 mapping) — expected |
| 13 | `node examples/operator-authority/lab-revision2.mjs <corpus>` | 24 | 0 | 12 cases, 44/44 decisions and callback outcomes match |
| 14 | Same CLI, corpus with one appended byte | 24 | 1 | **Must fail; fails** with `Frozen revision-2 corpus digest mismatch` |

Step 11 includes the deny-everything and deny-but-dispatch mutants, the tamper assertion, and refusal-reason checks for revoked versus not-current status. The step 13 report was byte-identical to the earlier package's `revision2-results.json` in a separate scratch run.

The same 35 fixture tests also passed on Node v22.22.3 in that scratch run. GitHub CI steps not reproduced here: public package builds, the did-atp clean consumer install, and the separate sdk/openclaw-atp package test runs.

### Dependency findings (`npm audit`, after this change)

*Superseded November 7, 2026: these packages were removed with the legacy site. See the update above.*

7 findings remain: 2 high, 5 moderate, 0 critical. At `5fb127a` there were 14 (1 critical, 11 high, 2 moderate). The earlier package recorded 2 high + 4 moderate; the extra moderate reflects advisory-database updates since then, not a regression. No threshold was changed and nothing was suppressed.

| Severity | Package | Path | Applicability | Available fix |
|---|---|---|---|---|
| High | `nodemailer` ≤10.1.3 | direct (`^8.0.5`), `src/lib/email.ts` | **Plausibly applicable.** Used for the SMTP and SendGrid transports (not the Resend path). The unauthenticated `/api/request-access` route sends to a user-supplied recipient validated only by `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, which admits quotes, angle brackets, semicolons and comments. The addressparser misdelivery and quadratic-DoS advisories are therefore reachable when SMTP or SendGrid is configured. The `raw`/`resolveContent` advisories do not appear to be reachable: neither option is used. | `nodemailer@10.2.1` (semver-major) |
| High | `postcss` ≤8.5.22 | nested under `next` | Low. Processes the repository's own CSS at build time; the advisories need attacker-controlled CSS input. | Only via `next@16.4.3` (major) |
| Moderate | `next` | direct | Inherits the nested postcss finding only. The critical Next.js advisories are resolved by 15.5.28. | `next@16.4.3` (major) |
| Moderate | `postcss-selector-parser`, `postcss-nested`, `tailwindcss`, `tailwindcss-animate` | build toolchain | Low. Build-time processing of first-party CSS. | None, or a major Tailwind migration |

Recommended follow-up (not done here): upgrade nodemailer to 10.x in its own PR, with send-path tests. Independently, validate and normalize recipient addresses server-side to a single bare `local@domain`, so that parser behavior is not load-bearing.

### Review threads on PR #172 (state on GitHub)

*Superseded November 7, 2026: all of these are resolved. See the update above.*

| Thread | GitHub state | Local status |
|---|---|---|
| Semgrep mutable tag, workflow line 18 | Unresolved | Fixed in `c160a5f`; clears only after push and re-scan |
| Semgrep mutable tag, workflow line 19 | Unresolved | Fixed in `c160a5f`; clears only after push and re-scan |
| Greptile: signing bypasses required SDK helpers | Unresolved | Fixed in `219d68f` (SDK `CryptoUtils`); needs Greptile re-review |
| Greptile: missing time bounds / approval digests / scope fields | Resolved, outdated | Fixed in earlier commits on the branch |

### What this does not establish

- These are ATP-authored tests and author-produced results (Mode A), not independent reproduction or review. The repository conformance command's "W3C conformance" wording is an internal label, not a W3C certification, endorsement, or specification adoption.
- The mapping covers one profile (live-standing-read, exclusive expiry, P1): 44 calls, not the lab's 176 across four profiles. Cached lease and inclusive endpoint are not supported. The lab's three axes remain not claimed.
- The signed fixtures still use `JSON.stringify` rather than a canonical, versioned mandate encoding. Operator and issuer keys are directly pretrusted, and status objects are fixture-supplied. The fixtures use only the Ed25519 member of the SDK hybrid key pair and make no post-quantum mandate claim.
- Not demonstrated: authenticated status reads, durable replay prevention, separate processes or workers, real resource enforcement, protocol wire compatibility.
- Studio runtime evidence was not re-run in this session. `INDEPENDENT-LAB-HANDOFF.md` item 5's statement that no pinned revision-2 translation exists is superseded by `lab-revision2.mjs`. Its other gaps stand.
- Private AAP research is not included or referenced.

### Remaining gates before any external submission

*Superseded November 7, 2026. See the update above for the current list.*

1. Push only when authorized. Confirm the full GitHub CI (including package builds), the fixture workflow, Semgrep and Greptile pass on the new head, and that the three open threads resolve.
2. Fix or explicitly accept the nodemailer finding, and record the postcss/Tailwind decision.
3. Complete Studio real-runtime tests in a Docker-capable environment: authenticated status, revocation timing, concurrent replay, audit-failure rollback.
4. Define canonical, authenticated, versioned mandate proofs using the shared utilities.
5. Independent reproduction by someone who authored neither the inputs nor the implementation.
6. Final provenance, secrets and claims review, then founder approval.

### Evidence

Raw outputs are kept outside the repository because they contain local machine paths. Folder: `ATP_Conformance_Readiness_2026-10-24_r2/`, containing `environment.txt`, `commands.tsv`, `run-gate.sh`, `logs/01–14`, `logs/09-audit.json` and `corpus/revision-2-vectors.json`.

| File | SHA-256 |
|---|---|
| `commands.tsv` | `959a87476aa17c737035b671b6060f69021e482f27b6c16742becf32a4a1ba2e` |
| `environment.txt` | `8083f41f3449299b26c88acac641c40df9e2f8d96daf3f39b6bfd1f10f03e8ba` |
| `logs/04-jest.log` | `746a7c9c6b21f9ce61dccee7bb01c957a7c9da8b04a578ef678a5a23a5f80614` |
| `logs/05-conformance.log` | `039909b1912ef7906efc0d8fb3244f5985150b8860505cb0c238e841739fba14` |
| `logs/07-audit-critical.log` | `e398b6e65273e86cc451e9684bbe184e3e994cfdbf1ee8b50e4bdba7843d8055` |
| `logs/09-audit.json` | `88972084bd9107e4bd780718b60b38f4471588e5fb9b0aa4ae737a04a99e1550` |
| `logs/11-fixtures-with-corpus.log` | `a8a835bc22e703a6c8e2436f79b68de141cbc9519d29c92f72d2caf9643d62b9` |
| `logs/13-rev2-mapping-cli.log` | `c0c6ffeb100acfad4d0372ec5cc16e4388ea7e91878acafc296e5ef21ae23dc5` |
| `logs/14-rev2-tampered-corpus-must-fail.log` | `6023c56031257974bfb38f52a9f10c0515666220d2a4edffc65ece1e4226dd04` |

The folder's `SHA256SUMS` lists every file.
