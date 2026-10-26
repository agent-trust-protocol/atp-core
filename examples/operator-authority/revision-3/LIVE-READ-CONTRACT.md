# Clarified synthetic live-read adapter

Maintainer ruling: https://github.com/Agent-Authority-Conformance/aps-conformance-suite/issues/192#issuecomment-6420938886

For live_standing_read, every unexpired correctly bound call must attempt one source read before
returning, even if operation scope already fails. Under P1, refusal precedence is binding, expiry,
undetermined authority, revoked authority, then forbidden operation. Scope may be computed earlier
but cannot suppress the read. The legacy adapter's skipped reads do not satisfy this profile.

This change adds a separate synchronous synthetic profile adapter rather than modifying the frozen
fixture-policy.mjs or revision-2 mapping. The previous 42/44 record is historical evidence, not an
unresolved interpretation. No production policy, SDK, or Studio code is changed.

`live-read-policy.mjs` accepts a source callback and emits an explicit read-attempt record with the
presented grant, evaluation instant, purpose, outcome, and consulted observation. It never substitutes
the requested instant for a stale observation. Missing, malformed, unavailable, stale or throwing
sources deny. Errors are reduced to a local error outcome without source messages. Approval checks
remain after authority and operation checks. Binding and validity refusals do not read the source.

`lab-revision3-live.mjs` translates only the pinned lab events into inputs and invokes the callback
through a separately instrumented source. `source-read-contract.mjs` checks that local log against
the adapter's trace and valid binding/time inputs, without using expected verdicts, truth labels or
case IDs. This checker assumes the corpus adapter's valid operator/identity/proof preconditions.
It is not the external lab runner's source_read_contract implementation.

Run from the repository root on Node 24:

```sh
node examples/operator-authority/revision-3/lab-revision3-live.mjs "$ATP_LAB_REVISION3_VECTORS"
ATP_REQUIRE_LAB_CORPUS=1 node --test examples/operator-authority/*.test.mjs examples/operator-authority/revision-3/*.test.mjs
```

The suite also needs ATP_LAB_REVISION2_VECTORS set to the frozen revision-2 corpus. Both corpus
digests are checked before parsing. The CLI exits nonzero on a decision, reason, grant-reference
or local read-contract mismatch. CI keeps the historical disagreement check and adds this new CLI.

## Scope and limits

This is author-produced synthetic evidence for live_standing_read, exclusive end, P1 only.
The source callback reads in-memory fixture state, not a network, authenticated status source or
database. Local attempt records are not durable audit receipts. The adapter is synchronous; async
sources are unsupported. Its source-error handling also catches programming errors within the
callback, so it must not be reused as production error classification. Caller preconditions are
synthetic assertions, not cryptographic proofs. There is no independent reproduction or claim of
full lab conformance, separately scored axes, composite verification, diagnostic reads, cached
mode, inclusive boundary, or Studio runtime enforcement.

The previously measured 216-combination experiment showed 48 reason changes and 36 to 72 status
consultations; those measurements belong to that prototype, not a fresh measurement of this adapter.
The new adapter converts source exceptions to local refusals instead of propagating them. The
added reads and status-dependent reasons can reveal grant status to its holder through a forbidden
operation. Latency, rate limits and real-source failure behavior remain unmeasured.

The pinned lab corpus remains unchanged. Synthetic overlap tests exercise the precedence clarified
by the maintainer; they are not new adopted lab vectors. No public comment, submission, merge,
deployment or endorsement follows from this change.

## Local verification

On Node v24.22.1, Linux, all 48 fixture tests passed with both corpora required, zero skips.
The corpus checkout was detached at 7774daee77a7766f737c6da71265c9e214b47ff5. The full
suite includes the unchanged historical 42/44 comparison and revision-2 report digest test.
The new CLI returned exit 0 with 44/44 actions, reasons, grant references and local read contracts.
All four legacy mapper mutants reduced matches. Targeted tests rejected skipped, duplicated,
wrong-grant and fabricated read traces. No root Jest/build/conformance gate, remote CI, Mac
reproduction, live source or staging run was performed for this fixture-only change.
