# Operator-authority reference fixtures (Issue #169)

Run: `node --test examples/operator-authority/fixture-policy.test.mjs` (Node 20+).

This is a **synthetic reference policy evaluator**, not ATP Guardian, an ATP mandate verifier, a DID implementation, or an independent APS/RTTP/IQA adapter. Boolean fields named `proofVerified` and `issuerVerified` are **trusted fixture inputs only**. They do not perform cryptographic verification; do not pass agent-supplied claims into them. This example does not claim real revocation freshness or production authorization.

The fixture models four separate concerns: a current operator, a resource-bound mandate assertion, visibility of revocation at action time, and a protected callback executed only on ALLOW. It uses simulated seconds and intentionally demonstrates that a cached result can allow while an unseen revocation exists. Live-mode test cases instead require a same-time status result and deny on missing status.

It does not model atomic revocation/execution consistency, signed evidence, replay defenses, cryptographic proof of possession, chained delegations, approval consumption, or multi-tenant storage. Those remain pending implementation gates under #169 and must be enforced independently.

Run results must include the actual command, Node version, branch commit, and pass/fail output. Do not describe repository acceptance as independent verification. Studio comparisons live in https://github.com/agent-trust-protocol/atp-studio/issues/94. Shared cross-stack fixtures need separate admission by Agent Authority Conformance Lab maintainers.
