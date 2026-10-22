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
The lab's CONTRIBUTING.md requires an issue before developing a new external family; maintainer acceptance is discretionary. Suggested candidate `fixtures/cross-stack/trust-freshness-revocation/` is **not an approved path**. Seek guidance on naming, schemas and owner, and obtain an independent run for claims requiring it. The connected GitHub integration has read-only access to the lab and received 403 on issue creation. A Gmail draft to the participants was prepared; do not infer it was sent.

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
