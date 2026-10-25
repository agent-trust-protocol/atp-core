# Operator-authority reference fixtures (Issue #169)

## Current local readiness work — October 24, 2026

Run the complete suite with Node 24 after installing the locked SDK dependencies:

```sh
npm ci --include=dev --ignore-scripts --prefix packages/sdk
ATP_LAB_REVISION2_VECTORS=/path/to/aps-conformance-suite/fixtures/lease-revocation-axes/revision-2/vectors.json \
  node --test examples/operator-authority/*.test.mjs
```

The signed fixture and two-key request tests now use `CryptoUtils` from the existing SDK source for key generation, signing and verification. This removes their separate signing implementation; it does not establish a normative signed-mandate profile. The SDK key generator creates a hybrid pair; these fixtures deliberately use only its Ed25519 member and make no post-quantum mandate claim. Private keys exist only in memory.

`lab-revision2.mjs` checks the exact revision-2 SHA-256 before parsing, translates timeline inputs into the synthetic policy evaluator, invokes its callback, then compares the decision and callback outcome with the live-standing-read / exclusive-endpoint oracle. It does not derive a decision from expected answers. It does not implement cached mode, inclusive expiry, authenticated status, real workers, or Guardian runtime. The three lab axes remain unclaimed; this is a narrow policy projection. Local refusal and grant-reference metadata are proposed additions, not an adopted revision-3 schema.

```sh
node examples/operator-authority/lab-revision2.mjs /path/to/revision-2/vectors.json
```

`revision-3/lab-revision3.mjs` maps the same synthetic evaluator onto the lab's revision-3 contract (refusal reason and grant reference), pinned to lab commit `7774daee7`. Revision 2 above is unchanged, and a test re-derives its frozen report digest. The declared reason mapping, the results and the disclosed disagreements are in `revision-3/REVISION-3-EVIDENCE-MAPPING.md`.

The matching test exercises all 12 cases / 44 calls, the altered-byte digest gate, a deny-everything mutation and a deny-but-dispatch mutation. When no corpus path is supplied it reports an explicit skip. The dedicated CI workflow supplies the corpus from a pinned lab commit so CI cannot silently skip it.

Earlier run descriptions below are historical. They do not establish the status of this local patch or a later commit. External submission remains on hold pending real-runtime gap closure and independent review.

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
