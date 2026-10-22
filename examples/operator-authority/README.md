# Operator-authority reference fixtures (Issue #169)

Run: `node --test examples/operator-authority/fixture-policy.test.mjs` (Node 20+).

This is a **synthetic reference policy evaluator**, not ATP Guardian, an ATP mandate verifier, a DID implementation, or an independent APS/RTTP/IQA adapter. Boolean fields named `proofVerified` and `issuerVerified` are **trusted fixture inputs only**. They do not perform cryptographic verification; do not pass agent-supplied claims into them. This example does not claim real revocation freshness or production authorization.

The fixture models four separate concerns: a current operator, a resource-bound mandate assertion, visibility of revocation at action time, and a protected callback executed only on ALLOW. It uses simulated seconds. It intentionally denies protected execution if current mandate status is unavailable, even when evidence could remain inside a 120-second cache lease. An evidence-freshness-only verifier may have different semantics; that must be tested independently rather than conflated with authorization.

It does not model atomic revocation/execution consistency, signed evidence, replay defenses, cryptographic proof of possession, chained delegations, approval consumption, or multi-tenant storage. Those remain pending implementation gates under #169 and must be enforced independently.

Run results must include the actual command, Node version, branch commit, and pass/fail output. Do not describe repository acceptance as independent verification. Studio comparisons live in https://github.com/agent-trust-protocol/atp-studio/issues/94. Shared cross-stack fixtures need separate admission by Agent Authority Conformance Lab maintainers.

Approval fields are also fixture-only inputs. `verifiedByTrustedOperator` must be derived from real authenticated operator checks in a future implementation, never accepted from the requesting agent; approval replay/atomic consumption is not implemented here.

## Experimental cryptographic fixture (non-normative)

`node --test examples/operator-authority/signed-mandate.test.mjs` runs a standalone Ed25519 signature/issuer-allowlist/scope/expiry/revocation **fixture**. Its JSON byte encoding is not a canonical ATP mandate wire format. Keys are synthetic and generated within the test. It assumes a trusted status reader has already produced `status.available`, `checkedAt`, and `revokedIds`; the code does not authenticate or fetch revocation evidence. A fabricated status object is not valid security evidence. No replay handling, approval consumption, durable storage, agent proof of possession, or execution-side atomicity is supplied.

Local isolated runner verified ten fixture tests passing before commit (Node built-in test runner). Repository CI against this commit and independent external replication remain **unverified**. The earlier `fixture-policy` test is also a reference-only control and does not consume this signature verifier. Do not deploy or treat fixture `ALLOW` as permission for a real tool.

## Isolated two-agent request-to-execution test

Run `node --test examples/operator-authority/two-agent.test.mjs`. This uses independently generated operator/agent signing keys, signed action-bound request envelopes, a signed operator mandate, a one-use nonce in a synchronous in-memory execution boundary, and a fixed non-destructive invocation counter. In a local Node 22.16.0 test harness, **9/9 tests passed** before repository commit. Reproduce against the committed branch and capture CI output before treating it as repository evidence.

**Security limitations:** the status service is a boolean/time fixture, revocation time is an injected test input, request signatures use noncanonical JSON bytes rather than a versioned signed-wire profile, the nonce cache is per-process and not durable/transactional, identity keys are directly pretrusted, and no network agent/process isolation, approval source authentication, operator role verification, or atomic revocation/execution coupling is proven. It does not integrate production Guardian or official ATP SDK. Never deploy the code as an authorization gateway.
