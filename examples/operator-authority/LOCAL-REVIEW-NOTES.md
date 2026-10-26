# Local pre-submission review

This note is an internal engineering checkpoint, not an independent review or lab submission.

The current mapping proves only synthetic action-policy and callback behavior. It cannot establish authenticated revocation, DID resolution, trusted operator control, durable replay prevention, separate-worker behavior, or protection of a real external resource. Matching expected answers is not sufficient to claim any of those properties.

Remaining runtime work belongs to Studio's isolated test environment: real PostgreSQL authority reads and failures, signature/key-control negatives, separate runtime connections and processes, concurrent nonce redemption, before/after-dispatch revocation ordering, audit failure rollback, and downstream execution instrumentation. Existing Studio integration results must remain separately attributed and pinned to their own source SHA.

The signed fixture still uses JSON.stringify and pretrusted ephemeral keys. A canonical, versioned signed-wire profile and authenticated status contract require further implementation-backed work. SDK utility reuse does not resolve these protocol gaps.

The lab mapping supports only live-standing-read with an exclusive expiry endpoint and lab-defined P1 action policy. It reports no independently verified axis and no cached-mode or inclusive-boundary support. Refusal reason and grant references are local proposed metadata; no revision-3 adoption is implied.

Before external publication: close or explicitly exclude each remaining claim, obtain a genuinely independent reviewer, reproduce from pinned source in a clean environment, preserve raw records, and obtain founder publication approval. Private research is excluded.
