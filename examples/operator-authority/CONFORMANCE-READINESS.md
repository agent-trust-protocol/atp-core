# ATP Core conformance readiness — local checkpoint

October 24, 2026. Internal engineering record for PR #172 (issue #169). **NO-GO for external submission.** Core is ready for a push and fresh CI/Greptile review once publication is authorized; nothing in this record has run on GitHub yet.

This record supersedes the "Verified outcomes" table of the earlier off-repo package `ATP_Conformance_Readiness_2026-10-24` for the commits listed below. That package's files are unchanged and its own SHA-256 manifest still verifies.

## Source

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

## Workflow hardening (`c160a5f`)

`.github/workflows/operator-authority-fixtures.yml` now pins every action to a full commit SHA with a version comment:

| Action | SHA | Tag |
|---|---|---|
| `actions/checkout` (repository checkout) | `11d5960a326750d5838078e36cf38b85af677262` | v4.4.0 |
| `actions/setup-node` | `49933ea5288caeca8642d1e84afbd3f7d6820020` | v4.4.0 |
| `actions/checkout` (lab corpus, read-only) | `11d5960a326750d5838078e36cf38b85af677262` | v4.4.0 |

Each SHA was resolved from the upstream `v4` ref via the GitHub API and cross-checked with `git ls-remote`, where `v4` and `v4.4.0` point to the same commit. `permissions: contents: read`, `persist-credentials: false` on the lab checkout, and all steps are unchanged.

**Lab corpus immutability.** The lab checkout `ref` is a full 40-character SHA that resolves to a commit (2026-10-24T15:23:11Z); no branch shadows that name. Independently of the ref, `lab-revision2.mjs` hashes the corpus bytes and throws `Frozen revision-2 corpus digest mismatch` **before parsing**. The test asserts this, and the gate below shows the CLI exits 1 on a one-byte-altered corpus. In CI the corpus path is always set, so a missing corpus fails the test rather than skipping it. Locally, without `ATP_LAB_REVISION2_VECTORS`, the test reports an explicit skip (see step 12).

**Revision-3.** Refusal reasons and grant references appear only as labelled local metadata (`proposed_revision3_fields: 'local metadata only; not a revision-3 conformance claim'`). No revision-3 schema is adopted or claimed.

## Gate results

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

## Dependency findings (`npm audit`, after this change)

7 findings remain: 2 high, 5 moderate, 0 critical. At `5fb127a` there were 14 (1 critical, 11 high, 2 moderate). The earlier package recorded 2 high + 4 moderate; the extra moderate reflects advisory-database updates since then, not a regression. No threshold was changed and nothing was suppressed.

| Severity | Package | Path | Applicability | Available fix |
|---|---|---|---|---|
| High | `nodemailer` ≤10.1.3 | direct (`^8.0.5`), `src/lib/email.ts` | **Plausibly applicable.** Used for the SMTP and SendGrid transports (not the Resend path). The unauthenticated `/api/request-access` route sends to a user-supplied recipient validated only by `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, which admits quotes, angle brackets, semicolons and comments. The addressparser misdelivery and quadratic-DoS advisories are therefore reachable when SMTP or SendGrid is configured. The `raw`/`resolveContent` advisories do not appear to be reachable: neither option is used. | `nodemailer@10.2.1` (semver-major) |
| High | `postcss` ≤8.5.22 | nested under `next` | Low. Processes the repository's own CSS at build time; the advisories need attacker-controlled CSS input. | Only via `next@16.4.3` (major) |
| Moderate | `next` | direct | Inherits the nested postcss finding only. The critical Next.js advisories are resolved by 15.5.28. | `next@16.4.3` (major) |
| Moderate | `postcss-selector-parser`, `postcss-nested`, `tailwindcss`, `tailwindcss-animate` | build toolchain | Low. Build-time processing of first-party CSS. | None, or a major Tailwind migration |

Recommended follow-up (not done here): upgrade nodemailer to 10.x in its own PR, with send-path tests. Independently, validate and normalize recipient addresses server-side to a single bare `local@domain`, so that parser behavior is not load-bearing.

## Review threads on PR #172 (state on GitHub)

| Thread | GitHub state | Local status |
|---|---|---|
| Semgrep mutable tag, workflow line 18 | Unresolved | Fixed in `c160a5f`; clears only after push and re-scan |
| Semgrep mutable tag, workflow line 19 | Unresolved | Fixed in `c160a5f`; clears only after push and re-scan |
| Greptile: signing bypasses required SDK helpers | Unresolved | Fixed in `219d68f` (SDK `CryptoUtils`); needs Greptile re-review |
| Greptile: missing time bounds / approval digests / scope fields | Resolved, outdated | Fixed in earlier commits on the branch |

## What this does not establish

- These are ATP-authored tests and author-produced results (Mode A), not independent reproduction or review. The repository conformance command's "W3C conformance" wording is an internal label, not a W3C certification, endorsement, or specification adoption.
- The mapping covers one profile (live-standing-read, exclusive expiry, P1): 44 calls, not the lab's 176 across four profiles. Cached lease and inclusive endpoint are not supported. The lab's three axes remain not claimed.
- The signed fixtures still use `JSON.stringify` rather than a canonical, versioned mandate encoding. Operator and issuer keys are directly pretrusted, and status objects are fixture-supplied. The fixtures use only the Ed25519 member of the SDK hybrid key pair and make no post-quantum mandate claim.
- Not demonstrated: authenticated status reads, durable replay prevention, separate processes or workers, real resource enforcement, protocol wire compatibility.
- Studio runtime evidence was not re-run in this session. `INDEPENDENT-LAB-HANDOFF.md` item 5's statement that no pinned revision-2 translation exists is superseded by `lab-revision2.mjs`. Its other gaps stand.
- Private AAP research is not included or referenced.

## Remaining gates before any external submission

1. Push only when authorized. Confirm the full GitHub CI (including package builds), the fixture workflow, Semgrep and Greptile pass on the new head, and that the three open threads resolve.
2. Fix or explicitly accept the nodemailer finding, and record the postcss/Tailwind decision.
3. Complete Studio real-runtime tests in a Docker-capable environment: authenticated status, revocation timing, concurrent replay, audit-failure rollback.
4. Define canonical, authenticated, versioned mandate proofs using the shared utilities.
5. Independent reproduction by someone who authored neither the inputs nor the implementation.
6. Final provenance, secrets and claims review, then founder approval.

## Evidence

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
