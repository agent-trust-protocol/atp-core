# ATP mandates: implementation evidence

Status: non-normative evidence record, 25 November 2026. Prepared for the W3C AIKR CG trust work, which maps published specification texts and may assess implementation evidence in a separate pass. This page is not a specification, a conformance claim or an interoperability claim.

ATP Core is the open-source developer foundation. ATP Studio is a separate commercial product whose source is not public. This page points to what anyone can read and run in ATP Core, and summarizes the Studio work in prose so that reviewers can see what it covers and where its limits are. Nothing here asks for a classification change; it is offered so that evidence can be assessed the same way as for other initiatives.

## Where ATP stands, by level

| Level | What exists | Can a reviewer check it? |
|---|---|---|
| Specification | No adopted W3C ATP CG text defines mandates. An individual contributor proposal, [ATP Mandates v0.1](https://github.com/w3c-cg/atp/tree/274e8a9ab08560becce18d146812073f5f4776e0/specs/atp-mandates), is published for review in [draft pull request #14](https://github.com/w3c-cg/atp/pull/14) and has not been adopted. | Yes, the proposal is public. |
| Public implementation (ATP Core) | Non-normative reference fixtures for operator authority, signed mandates, revocation and a two-agent request-to-execution test. | Yes. Source and tests are public and runnable. |
| Private implementation (ATP Studio) | An experimental mandate evaluator, root issuance and server-owned dispatch, disabled by default. | No. Summarized below; source is not public. |

## ATP Core: public evidence

All links are pinned to ATP Core commit [`b0a1ac1`](https://github.com/agent-trust-protocol/atp-core/tree/b0a1ac1c8b3dd88e7ef6db6b119e35e0f03f43cb).

- [Operator-authority fixtures](https://github.com/agent-trust-protocol/atp-core/tree/b0a1ac1c8b3dd88e7ef6db6b119e35e0f03f43cb/examples/operator-authority): a synthetic reference policy evaluator modelling a current operator, a resource-bound mandate assertion, revocation visibility at action time, and a protected callback that runs only on ALLOW. It denies when current mandate status is unavailable.
- [Signed-mandate fixture](https://github.com/agent-trust-protocol/atp-core/blob/b0a1ac1c8b3dd88e7ef6db6b119e35e0f03f43cb/examples/operator-authority/signed-mandate.mjs): Ed25519 signature, issuer allowlist, scope, expiry and revocation checks. Its JSON encoding is explicitly not an ATP mandate wire format.
- [Two-agent test](https://github.com/agent-trust-protocol/atp-core/blob/b0a1ac1c8b3dd88e7ef6db6b119e35e0f03f43cb/examples/operator-authority/two-agent.test.mjs): separate operator and agent keys, signed action-bound requests, a signed operator mandate and a one-use nonce at an in-memory execution boundary.
- [Revision-3 evidence mapping](https://github.com/agent-trust-protocol/atp-core/blob/b0a1ac1c8b3dd88e7ef6db6b119e35e0f03f43cb/examples/operator-authority/revision-3/REVISION-3-EVIDENCE-MAPPING.md): the fixtures mapped onto the Agent Authority Conformance Lab's lease-revocation-axes vectors, with pinned digests and disclosed disagreements. ATP-authored; not a conformance verdict.
- [Conformance readiness record](https://github.com/agent-trust-protocol/atp-core/blob/b0a1ac1c8b3dd88e7ef6db6b119e35e0f03f43cb/examples/operator-authority/CONFORMANCE-READINESS.md): test results, corpus pins and the current NO-GO for external submission.
- [Protocol support inventory](https://github.com/agent-trust-protocol/atp-core/blob/b0a1ac1c8b3dd88e7ef6db6b119e35e0f03f43cb/docs/PROTOCOL-SUPPORT.md): what Core does and does not establish, protocol by protocol.

To run the fixtures, as the fixtures' README describes (Node 24, after installing the locked SDK dependencies):

```sh
npm ci --include=dev --ignore-scripts --prefix packages/sdk
node --test examples/operator-authority/*.test.mjs
```

The lab-corpus tests report an explicit skip unless a pinned corpus path is supplied; the README gives the variables.

Limits, as the fixtures themselves state: no canonical wire format, no authenticated revocation source, no durable replay protection, no chained delegation, and no production enforcement. Fixture ALLOW is not permission for a real tool.

## ATP Studio: experimental implementation (summary)

Studio's mandate work is experimental, staging-only and switched off by default. Its source is not public, so the points below can't be reproduced from this page; they describe what the implementation does at Studio commit `30a6c9b` (24 November 2026).

- **Grants.** Mandates are immutable, versioned grants with a digest. Status is ACTIVE, PAUSED, REVOKED or SUPERSEDED and is read from an authenticated store, never from the agent.
- **Constraints.** Each grant scopes actions, tools, resources, recipients and data classes, with prohibited actions, per-action and aggregate limits in minor currency units, and approval thresholds.
- **Delegation.** A child grant pins its parent by id, version and digest. Lineage is evaluated up to eight levels, and each child must narrow its parent: same tenant and audience, a validity window inside the parent's, and constraint sets and limits that are subsets. Delegated monetary actions are refused until a lineage-wide budget check exists.
- **Issuance.** Only a tenant owner or admin with an active signing key registered to them can issue a root grant. The signed statement carries the issuer's DID and key id, so the accountable issuer of authority is inside the grant. Issuance of delegated grants is not exposed yet.
- **Dispatch.** Protected actions run through server-owned adapters; the agent can't choose another tool or supply its own callback. Status is rechecked before dispatch, a durable receipt records authorization, execution and result, and each signed request yields at most one effect under replay.
- **Refusals.** Every decision is ALLOW or DENY with a reason code (for example evidence_unavailable, mandate_revoked, delegation_invalid, approval_required). An unreadable status store is a recorded refusal.
- **Known limit.** A revocation that lands after an action has started executing does not, by itself, stop that action. For effects written in the same PostgreSQL transaction, an experimental effect fence rechecks authority at commit; effects outside that transaction are not covered.

## What this evidence bears on

For the Mappings tab, this evidence relates to the Authority row (granted, narrowed, revocable authority) and to the accountable-party discussion (the issuing principal is named and signs the grant). It is implementation evidence only. It does not establish specification coverage, and the ATP Mandates v0.1 proposal has not been adopted by the ATP CG.

Questions and corrections: open an issue on [atp-core](https://github.com/agent-trust-protocol/atp-core/issues).
