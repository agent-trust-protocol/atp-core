# ATP evidence mapping to lease-revocation-axes revision 3

October 25, 2026. Internal record prepared for local review. **Not submitted to the lab, not posted,
not a conformance verdict.** Every result below is ATP-authored and author-produced (Mode A). No one
who did not write the inputs or the implementation has recomputed anything here.

Revision 3 of the lab's `lease-revocation-axes` candidate adds two fields to every decision record,
`refusal_reason` and `grant_ref`, and changes nothing else. This record maps ATP's synthetic policy
evaluator onto that contract, keeps the frozen revision-2 mapping and its results unchanged, and
states where ATP's semantics differ from the lab's.

## 1. Pins

| Item | Reference |
|---|---|
| Lab repository | `Agent-Authority-Conformance/aps-conformance-suite` |
| Lab commit used (merge of PR #191) | `7774daee77a7766f737c6da71265c9e214b47ff5`, merged 2026-10-25T18:46:20Z |
| Revision-3 commit | `9a28261967bf0d2f9d08ed48f06026871818e816`, 2026-10-25T17:14:59Z |
| `revision-3/vectors.json` SHA-256 | `3b7b3fb97682fb967801641b8ed680a9cae608ff57738a594fc6f0314aac1bb6` |
| `revision-3/oracle-checkpoints.json` SHA-256 | `08293dbd991fe3f76534e176800e15365545a43a6d94e4d89f79d6d58ec7e830` |
| `revision-3/model.json` SHA-256 | `b71f02f570237a354cf23abd515c1bd1138461016f7eaaed7e83e16d61bc8237` |
| `revision-2/vectors.json` SHA-256 (unchanged since the `7141c61` pin) | `a0a07ea58bcacfd056cbd648e03de4ff14778aa151e8b5d2574e43e31a111ed8` |
| Frozen revision-2 report SHA-256 (CLI output, 12 cases, 44/44) | `f6110feb3a48d3734e554ee25182ada7bbf6c50af6696000e507931062b3d342` |
| ATP Core base | `b092eb51e53025fbe8ef32ba5b7151dad765bfc4` (PR #172 head, branch `test/169-operator-authority-fixtures`) |
| This work | branch `test/191-revision3-evidence-mapping`, directory `examples/operator-authority/revision-3/` |
| ATP Studio runtime evidence (separate, §6) | PR #95 head `4141fd8a23b3acd69d2b1672fb6146dbc9742d58` |

The lab's three revision-3 files verified against `revision-3/SHA256SUMS.txt`, and the five revision-2
files against `revision-2/SHA256SUMS.txt`, at commit `7774daee7`. `lab-revision3.mjs` hashes the
corpus bytes and refuses to parse anything but the pinned digest.

## 2. What was compared

Profile: `live_standing_read`, `exclusive` endpoint, `P1-current-observation`. That is the one profile
ATP's revision-2 mapping supports, and it is the only one compared here. 12 cases, 44 calls.

For every call, after the evaluator has run and the protected callback has or has not fired:

| Field | Revision 2 | Revision 3 |
|---|---|---|
| `action_decision`, `downstream_reached` | compared | compared, same rule |
| `refusal_reason` | ATP-native value recorded as local metadata | compared, through the declared mapping in §3 |
| `grant_ref` | local `grant_reference` metadata | compared field by field |

The evaluator is `examples/operator-authority/fixture-policy.mjs` (`decide()` and `protectedBoundary()`),
unchanged. It is a synthetic reference, not ATP Guardian, not a mandate verifier and not a production
adapter. No expected value, truth field, case ID or worker label enters it. Comparison happens after
execution, so the oracle cannot choose the verdict.

## 3. Declared reason mapping

ATP keeps its own reason names. The mapping is a local translation for this comparison. It is not an
adoption of the lab's vocabulary by ATP, and the lab has not adopted ATP's. On the lab side the values
and their precedence are proposals for this family (PR #191); the lab maintainer has said separately
(issue #189) that other candidates keep their own vocabulary.

| ATP reason (`decide()`) | Revision-3 `refusal_reason` | How the mapping decides |
|---|---|---|
| `ALLOW` | `null` | |
| `out_of_scope`, resource bound to another grant | `evidence_binding_mismatch` | compares the grant's resource with the request's resource, both inputs the mapping built |
| `out_of_scope`, operation outside the grant | `operation_not_permitted` | the remaining `out_of_scope` case, after the audience check below |
| `out_of_scope`, audience mismatch | `unmapped:out_of_scope(audience)` | no lab class exists; reported as unmapped rather than guessed. The translation never varies audience, so it cannot occur in this corpus |
| `mandate_expired` | `evidence_expired` | |
| `status_not_current` | `authority_not_determined` | |
| `mandate_revoked` | `authority_revoked` | |

`grant_ref` is built from the evidence entry the call presented (`grant`, `evidence_id`,
`issued_at_ms`, `expires_at_ms`) and from the decision's own path: `observation_as_of_ms` is the
consulted status's own `checkedAt` when the decision reached the status check and the status was
available, and `null` when it refused before consulting status or the status was unavailable. It is
never the call time by assumption: a status dated before the call is refused as `status_not_current`
and the record names the instant that was observed. In this corpus `checkedAt` always equals the call
instant, so the two coincide. `mapping-rules.test.mjs` checks these rules on synthetic inputs without
the corpus. The report carries `vectors_sha256`, so the pair
(`vectors_sha256`, `evidence_id`) resolves a record to one `profile.initial_evidence` entry exactly as
the lab's README describes.

## 4. Results

Command: `node examples/operator-authority/revision-3/lab-revision3.mjs <revision-3/vectors.json>`.
Run on Node v22.22.3 and again on Node v24.4.0 (the workflow's version), macOS arm64, 2026-10-25;
the two reports are byte-identical. The CLI exits 1 because not every field agrees; that is the
honest result, not a defect in the runner.

Two different things are checked, and they are kept apart on purpose:

- **The comparison** (`lab-revision3.mjs`) measures agreement with the lab contract. It disagrees on
  two records and exits 1. Nothing relabels that as a pass.
- **The regression tests** (`lab-revision3.test.mjs`) pin the comparison's output, including the two
  disagreements, so that any change in either direction fails the suite. A green suite means the
  output is unchanged, not that the comparison agrees. `check-known-disagreements.mjs` does the same
  for CI as its own workflow step, named to say so.

| Comparison | Matched | Of |
|---|---|---|
| Action decision and callback outcome | 44 | 44 |
| `refusal_reason` (declared mapping) | 44 | 44 |
| `grant_ref` | 42 | 44 |
| All three | 42 | 44 |

Reason distribution in the profile, ATP reason → mapped value: `authorized` → `null` ×20,
`mandate_revoked` → `authority_revoked` ×7, `status_not_current` → `authority_not_determined` ×7,
`mandate_expired` → `evidence_expired` ×7, `out_of_scope` → `operation_not_permitted` ×2,
`out_of_scope` → `evidence_binding_mismatch` ×1. Every revision-3 value occurs at least once and is
produced by the mapping; no ATP reason was left unmapped.

The two disagreements:

| Call | ATP | Lab | Field | Observed | Expected |
|---|---|---|---|---|---|
| LRA-09-r1 (T=0, write) | `out_of_scope` | `operation_not_permitted` | `grant_ref.observation_as_of_ms` | `null` | `0` |
| LRA-09-r2 (T=30000, write) | `out_of_scope` | `operation_not_permitted` | `grant_ref.observation_as_of_ms` | `null` | `30000` |

The refusal reason agrees on both. The grant reference does not, for the reason in §5.1.

Falsification controls, all in `lab-revision3.test.mjs`: a one-byte-altered corpus is refused before
parsing; `deny-everything` and `deny-but-dispatch` reduce the action matches; folding
`status_not_current` into `authority_revoked` reduces the reason matches, and only on
`status_not_current` rows; naming the requested grant instead of the presented evidence breaks
LRA-12-r2's grant reference. The test pins the exact mismatch set above, so a change in either
direction is noticed.

Revision 2 is unchanged: `lab-revision2.mjs`, `lab-revision2.test.mjs` and `fixture-policy.mjs` have
no diff against `b092eb5`, and the test re-derives the frozen revision-2 report digest from the pinned
corpus.

## 5. Semantic mismatches and unsupported cases

These are stated, not repaired. No evaluator or product code was changed to raise a score.

1. **Order of status and scope checks.** ATP's `decide()` refuses an out-of-scope operation before it
   consults status. The lab's model reads status first and checks the operation last, so on a write
   call it has an observation and records its instant in `grant_ref`. ATP's decision used no
   observation and says so. Same reason, different `observation_as_of_ms`. Reordering ATP's checks
   to match would change behaviour only to score, so it was not done.
2. **One ATP reason, two lab classes.** `out_of_scope` covers resource, audience and operation. The
   mapping splits it into `evidence_binding_mismatch` and `operation_not_permitted` using only the
   inputs it built, binding first as the lab orders it, and audience left unmapped. That split is a
   mapping-layer judgment, not something the evaluator states. The lab's `operation_not_permitted`
   also presupposes that lease and current authority hold; ATP's `out_of_scope` is checked before
   expiry and status, so an out-of-scope operation on an expired or unobservable grant would map to
   `operation_not_permitted` where the lab would say `evidence_expired` or
   `authority_not_determined`. No call in the mapped profile combines these conditions, so the corpus
   does not exercise the difference; a synthetic test records it.
3. **`status_not_current` is wider than `authority_not_determined` as exercised here.** ATP's reason
   fires for an unavailable status or a status not checked at the call instant. In this profile the
   translation always sets `checkedAt` to the call instant, so only unavailability triggers it. The
   lab's other `authority_not_determined` case, a cached observation under P1, is in a profile ATP
   does not support.
4. **Only one of four profiles.** `cached_lease` and the `inclusive` endpoint are not supported, so
   132 of the lab's 176 expected records in revision 3 are not compared.
5. **No source-read audit.** ATP's status is a fixture input, not an instrumented read. The lab's
   `source_read_contract`, which catches `sticky-unavailable` and `fabricated-live-read`, has nothing
   to inspect here. The evidence-freshness and authority-validity axes, and the composite
   verification result, are therefore not claimed.
6. **No diagnostic reads.** The lab's 20 diagnostic runs are not reproduced. In this profile a
   diagnostic read does not change the expected `refusal_reason` or `grant_ref`.
7. **The lab's twelve defective variants were not run.** ATP ran four mutants of its own (§4). They
   are not the lab's variants and do not reproduce the lab's failure sets.
8. **Checks the lab does not model.** ATP's evaluator also checks operator standing, issuer and proof
   flags. The translation sets them to pass as trusted fixture inputs. They are not exercised.
9. **No narrowing events** exist in revision 3, so behaviour under later narrowing is untested on both
   sides.
10. **Vocabulary.** Neither side has adopted the other's reason names. Issue #189's proposed names
    (`revocation_status_indeterminate`, `ancestor_revoked`) are the issue author's AAE vocabulary and
    are not used here.

## 6. Pure evaluator results kept apart from Studio dispatcher enforcement

Three layers produced results in the last two days. They are different code, at different commits,
and only the first was run against lab vectors.

| Layer | Code | Source commit | Run against lab vectors | Result | Provenance |
|---|---|---|---|---|---|
| Core synthetic evaluator, revision-3 mapping | `fixture-policy.mjs` via `revision-3/lab-revision3.mjs` | this branch, base `b092eb5` | yes, revision 3, one profile | §4 | author-produced |
| Core synthetic evaluator, revision-2 mapping (frozen) | `lab-revision2.mjs` | `219d68f`, at `b092eb5` | yes, revision 2, one profile | 12 cases, 44/44, report `f6110feb…` | author-produced |
| Studio pure evaluator | `@atp/core` `evaluateMandate` / `evaluateMandateLineage` | Studio `d046bfc` (tests), `e921f8d`, `fd4a598` | **no** | 8 proposed #189 validity tests pass; see `packages/core/src/mandate-experimental.validity.LIMITATIONS.md` | author-produced, not scored against revision 3 |
| Studio dispatcher enforcement | `executeMandatedTool` against PostgreSQL and a protected resource | Studio PR #95 head `4141fd8` | **no** | 13 integration tests; CI run 40244229594, 511/511; see `apps/server/src/guardian/mandate-execution.experimental.LIMITATIONS.md` | author-produced; enforcement evidence, not a lab result |

Studio's reason codes correspond to the revision-3 classes only loosely. This table is for orientation
and is **not scored**:

| Revision-3 class | Studio evaluator code | Studio dispatcher outcome |
|---|---|---|
| `authority_not_determined` | `evidence_unavailable` (missing or stale status) | `evidence_unavailable` with `statusAssessmentFailure: status_source_error`; receipt `CANCELED` after authorization. A separate `evaluation_failed` class (a defect, not an unavailable source) has no revision-3 counterpart. |
| `authority_revoked` | `mandate_revoked` (also `mandate_paused`, `mandate_superseded`) | `mandate_revoked`; receipt `CANCELED` at the recheck |
| `evidence_expired` | `mandate_expired` | same |
| `operation_not_permitted` | `prohibited_action`, `action_out_of_scope`, `tool_out_of_scope` | `invalid_action` at the adapter boundary |
| `evidence_binding_mismatch` | `resource_out_of_scope`, `audience_mismatch`, `agent_mismatch` (partial) | `origin_unverified` for an unsigned or replayed envelope (different concept) |

Precedence differs too, and is disclosed rather than changed. Studio's evaluator checks status
availability and age first, then identity bindings, then revoked/paused/superseded, then expiry, then
scope. Revision 3 orders binding, expiry, undetermined, revoked, operation. So a revoked and expired
mandate is `mandate_revoked` in Studio and `evidence_expired` in the lab; an expired mandate whose
status is stale is `evidence_unavailable` in Studio and `evidence_expired` in the lab. Studio's
dispatcher also refuses before the evaluator runs for unverified origin, replay and monetary actions,
which have no revision-3 class. None of this was scored, because Studio was not run on lab vectors.

## 7. Claims, each tied to a commit, a test and a command

| Claim | Implementation | Test | Command |
|---|---|---|---|
| Revision-3 corpus is pinned by digest and refused otherwise | `lab-revision3.mjs` `CORPUS_SHA256` | `lab-revision3.test.mjs` tamper assertion; log `06` | `node revision-3/lab-revision3.mjs <altered copy>` → exit 1 |
| 44/44 action decisions and callback outcomes in the live/exclusive profile | `fixture-policy.mjs` at `b092eb5`, translation in `lab-revision3.mjs` | `lab-revision3.test.mjs` | `node revision-3/lab-revision3.mjs <revision-3/vectors.json>` |
| 44/44 refusal reasons under the declared mapping | `REASON_MAP`, `mapRefusalReason` | same, plus `fold-undetermined-into-revoked` mutant | same |
| 42/44 grant references, exactly LRA-09-r1 and -r2 differing in `observation_as_of_ms` | `observationUsed` in `lab-revision3.mjs` | same, pinned mismatch set, plus `name-requested-grant` mutant | same |
| Revision 2 unchanged, report digest `f6110feb…` reproduced | `lab-revision2.mjs` at `219d68f` | `lab-revision3.test.mjs` third test | `node lab-revision2.mjs <revision-2/vectors.json> \| shasum -a 256` |
| CI cannot silently skip either corpus | `.github/workflows/operator-authority-fixtures.yml` (`ATP_REQUIRE_LAB_CORPUS=1`, both pins) | `lab-revision3.test.mjs` first test; logs `05`, `13` | `ATP_REQUIRE_LAB_CORPUS=1 node --test …` without the variable set → exit 1 |
| The disagreement set is exactly LRA-09-r1/-r2 with observed `null` and expected `0`/`30000`, checked apart from the regression tests and not called a pass; added, removed, reordered or value-altered disagreements are rejected | `check-known-disagreements.mjs`; its own workflow step | `mapping-rules.test.mjs`; logs `10`, `16` (exit 0, prints "NOT a conformance pass"), `12` (tampered corpus → exit 1) | `node revision-3/check-known-disagreements.mjs <revision-3/vectors.json>` |
| Mapping rules hold on synthetic inputs: binding before operation, audience unmapped, observation instant is the consulted `checkedAt` or `null`, and the untested precedence difference is recorded | `mapRefusalReason`, `observationUsed` | `mapping-rules.test.mjs` (no corpus needed) | `node --test examples/operator-authority/revision-3/mapping-rules.test.mjs` |
| Studio enforcement evidence (separate) | Studio `6192a27`…`4141fd8` | Studio integration suites | `pnpm test` in Studio; CI run 40244229594 |

Reproduce locally, from the Core repository root with Node 22 or 24:

```sh
npm ci --include=dev --ignore-scripts --prefix packages/sdk
L=/path/to/aps-conformance-suite/fixtures/lease-revocation-axes   # at 7774daee7
ATP_REQUIRE_LAB_CORPUS=1 \
ATP_LAB_REVISION2_VECTORS=$L/revision-2/vectors.json \
ATP_LAB_REVISION3_VECTORS=$L/revision-3/vectors.json \
  node --test examples/operator-authority/*.test.mjs examples/operator-authority/revision-3/*.test.mjs
node examples/operator-authority/revision-3/lab-revision3.mjs $L/revision-3/vectors.json
```

Local runs on this branch, Node v22.22.3 and Node v24.4.0: 38 tests, 38 passed, 0 skipped (35
existing, 3 new) on both. Without the corpus variables the three new tests report explicit skips;
with `ATP_REQUIRE_LAB_CORPUS=1` and no corpus they fail. The workflow's Node 24 path has been run
locally only; it has not run on GitHub.

## 8. What this does not establish

- Conformance to anything. The lab calls revision 3 "lab-authored and author-produced, not a protocol
  conformance verdict", and this mapping is one step further removed.
- Any of the lab's three axes, the composite verification result, cached mode, the inclusive
  endpoint, diagnostic reads, source-read provenance or the lab's variant failure sets.
- Authenticated status, DID resolution, signed mandates, replay prevention, separate processes or
  protection of a real resource. Those belong to Studio's runtime evidence (§6), which is attributed
  separately and was not run on lab vectors.
- Independent reproduction. Everything here was produced by the people who wrote it.
- Lab adoption of ATP's reason names, or ATP adoption of the lab's.
- A green fixture workflow. Its tests and its comparison step pass while the comparison still
  disagrees with the lab on two grant references. Green means "unchanged from this record".

## 9. Evidence

Raw outputs are kept outside the repository, in `ATP_Revision3_Evidence_Mapping_2026-10-25/`, with
`environment.txt` and `environment-node24.txt`, `corpus/` (the pinned lab inputs and manifest),
`logs/01`–`06` (Node 22), `logs/07`–`13` (Node 24: install, suite, comparison CLI, disagreement
check, revision-2 CLI, tampered-corpus and missing-corpus controls), `COMMANDS.md` and a
`SHA256SUMS` over every file. The commit hashes of this branch are recorded there.
