# Candidate independent verification handoff — ATP Core #169

**Status:** PROPOSAL / ATP-authored; NOT an independent lab result, accepted family, certification, or W3C determination.

## Where work lives
- ATP open reference tests: https://github.com/agent-trust-protocol/atp-core/pull/172 (draft).
- ATP Core planning: https://github.com/agent-trust-protocol/atp-core/issues/169.
- ATP Studio separate real-Guardian validation: https://github.com/agent-trust-protocol/atp-studio/issues/94.
- Proposed external host: https://github.com/Agent-Authority-Conformance/aps-conformance-suite .
- Related lab case: https://github.com/Agent-Authority-Conformance/aps-conformance-suite/issues/140 (APS ancestor revocation; **not ATP validation**).
- Related lab candidate case families: https://github.com/Agent-Authority-Conformance/aps-conformance-suite/issues/122 (proposed lifecycle text; **not conformance claims**).

## What the current reference tests can and cannot establish
`examples/operator-authority/*.test.mjs` exercise self-contained synthetic policy, Ed25519 mandate fixture, and signed agent request-to-protected-callback fixtures. GitHub Actions workflow `operator-authority-fixtures.yml` ran successfully at commit `77c11d8026e72bd6307690ac976170efe65c9090` (run 39818369683). The workflow conclusion is recorded as success, but a per-test log audit was **not** completed here.

These fixtures have **not** established a normative ATP mandate encoding, real DID resolution and issuer control, authenticated revocation source, runtime Guardian integration, durable replay ledger, multi-process independent agents, or an atomic check-to-execute boundary. They cannot be submitted as independently verified ATP implementation conformance. Existing tests use generated keys and fixture assertions only.

## Proposed cross-stack independent test-family scope
1. T=0: issued/verifiable evidence; state the authority status and claimed responsibilities.
2. T=10: issuer revokes standing/delegation/mandate.
3. T=30/60/119: receive protected action request.
4. Repeat with standing/status service unavailable.
5. Score separately: evidence freshness, authority validity, action authorization, actual execution (only when implementation claims that layer).
6. Require declared mode: cached lease, live-standing read, action-time delegation check, or another mode.
7. Mark `not_claimed` and `not_run` separately from `PASS`, `FAIL`, `BLOCKED`.
8. Include operator-authority cases: a positively trusted peer cannot self-grant; credential copy, unauthorized operator, wrong scope, and revoked operator must deny at a protected boundary.

## Evidence protocol (each distinct claim/layer)
- Fixture identifier and exact byte digest; regeneration and falsification procedure.
- Spec/profile version and normative-vs-proposed status; implementation commit and runtime version.
- Verification layer and claimed property; precise input, expected result, observed output and reason code.
- Protected-operation invocation counter when asserting enforcement.
- Reproducer commands, dependency lock, offline run ability, and raw machine-generated output.
- Record who authored **inputs**, verifier, implementation, and semantic decision logic. Declare Mode A/Mode B AND author-produced/independent as *separate* labels.
- An independently written verifier (not ATP-owned fixture evaluator) must recompute meaningful claims from published inputs before reporting independent verification.
- Do not replace or delete attributed run records; record disagreements and repairs explicitly.

## Suggested neutral lab intake
As of the current lab `CONTRIBUTING.md` and `docs/CANDIDATES.md`, **candidates may be submitted without an independent run** under `candidates/<submitter>-<name>/` plus an index row, with `CANDIDATE.md`, vectors/expectations, pinned source commit, declared license allowing Apache-2.0 redistribution, accurate limits, and a DCO sign-off. Publication is an initial scope/safety/provenance review, not technical admission. For **reviewed external-system family admission**, maintainers distinguish origin claims requiring independent recomputation from other attributed author-produced layers; discuss new scope early in an issue. Candidate-only PRs must not modify runner, workflow, or package paths. The connected GitHub integration previously received 403 attempting to create an external issue; this does not prevent proposing the candidate through a fork/manual maintainer coordination. Do not claim external acceptance. The earlier planned cross-stack path was unapproved.

## Candidate independent reproduction steps
```sh
git clone https://github.com/agent-trust-protocol/atp-core.git
cd atp-core
git fetch origin test/169-operator-authority-fixtures
git switch --detach 77c11d8026e72bd6307690ac976170efe65c9090
node --version
node --test examples/operator-authority/*.test.mjs
```
These commands **replay ATP-authored tests**. By themselves they do not qualify as independent reimplementation; the independent runner should additionally construct their own verifier from the relevant published specification or explicitly limit the claim to test reproducibility.

## Next gates
- Inspect GitHub Actions per-test logs and capture exact count, commit and artifacts.
- Replace synthetic status with authenticated verification and signed/versioned mandate profile.
- Link request proof, operator authorization, approval, replay state and status revalidation to the protected execution gate; prove under independent processes.
- Run same semantic tests against ATP Studio's actual mandate/Guardian enforcement in its own isolated environment.
- Receive the external lab's scoping/admission guidance; submit the smallest attributed family and obtain genuinely independent recomputation.

## PRE-SUBMISSION HOLD — 2026-10-24 independent readiness review

**Decision: NOT READY for external candidate submission or scored ATP conformance claims.** An accurate synthetic-research candidate would be permitted by lab policy, but the group's first ATP contribution should demonstrate more than author-produced policy assertions. This is an internal quality threshold, not a lab requirement.

Blocking gaps to close or explicitly exclude:
1. The fixture's issuer/operator verification flags are injected and not proven from an independent trust root; experimental Ed25519 signatures use noncanonical JSON and ephemeral directly trusted keys.
2. The fixture's revocation status is injected, not authenticated from a source and not exercised with an actual network outage; no real current-authority guarantee or measured propagation bound.
3. Two-agent test is within one Node process; replay state is in-memory and cannot prove cross-worker/atomic enforcement or crash recovery.
4. Actual production Guardian/Studio resource-side execution is not exercised in ATP Core; separate Studio integration evidence cannot be substituted as ATP Core proof.
5. No pinned translation of lab revision-2 vectors to ATP per-axis claims and P1 policy, and no refused-reason/grant-reference revision-3 schema agreement yet.
6. No independent signer/key-control and DID verification fixtures; no canonical signed message version, durable action idempotency, or authoritative operator-role proof.
7. No complete per-vector machine output, digest-checked corpus inventory, falsification controls, alternate independent recomputation, and clear RUN-REPORT provenance package yet.
8. General Core CI at commit 6801dcd had a blocking critical Next.js dependency audit, although the dedicated operator-fixture workflow passed. Do not bypass the security audit or merge the code on a false green claim.

A safe minimal first candidate should pick *one* proved layer (e.g. policy response to authenticated status) and state precisely which external inputs are assumptions; it should not imply the real resource is protected until a concrete independent boundary actually exercises it. For each denial, capture distinct `confirmed_revoked` versus `status_unavailable` reasoning and the exact mandate/grant reference, tenant, version/digest, and observation timestamp, with privacy redaction.

**Release gate:** Internal security review, falsification/mutation checks, frozen input digests, clean CI including critical audit, reproducible clean-room run, truthful axis and provenance labels, reviewer signoff, and explicit approval to publish external materials. Keep proprietary AAP R&D entirely out of public contribution materials.
