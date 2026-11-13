# Live existing-agent proof — Work execution handoff

Status: **implementation plan only**. No live third-party agent proof has been run by this document.

## Source-backed implementation map

The authoritative enforcement code is **not** the ATP CLI prototype.

- ATP Studio `packages/sdk/src/agent-action-client.ts`: `AgentActionClient` signs each `/v1/agent-authorize` request using the runtime's own signer, a timestamp, and fresh nonce.
- ATP Studio `packages/sdk/src/middleware.ts`: `guard()` and `withMcpGuard()` wrap an existing handler, asking Guardian before invoking it.
- ATP Studio `packages/sdk/src/pairing.ts` and `scripts/pair-agent.ts`: runtime pairing, key control and receipt validation; the operator approves scopes separately.
- ATP Studio `apps/server/src/guardian/action-origin.ts`: validates signed assertions and consumes nonces to stop replay.
- ATP Studio `docs/protected-agent-action-proof.md`: narrow existing protected read and mandate pause/revoke staging verification.
- ATP Core `packages/atp-cli/src/agent-inspection.mjs`: manifest-only inspection, **not** an agent execution harness.
- ATP Core `packages/atp-cli/src/agent-tool-boundary.mjs`: prototype only, **not** an authority. Do **not** wire it into production tools; use Studio SDK middleware instead.

## Work execution steps

1. Open **Work mode** with both repositories. On an isolated development checkout, compare the Studio SDK versions and exact export names rather than inventing APIs. Keep the Core/Studio databases, credentials and deployment pipelines separate.
2. Select an existing minimal LangChain JavaScript agent, preferably an offline fixture with one read-only tool and one mutation-capable test tool. Record exact package versions and deterministic inputs. No paid LLMs; use deterministic test inputs, local Ollama only if an LLM is needed.
3. Run ATP CLI `/inspect` on the existing agent manifest; capture unverified framework hints. Do not run untrusted agent source merely to enumerate capabilities.
4. Use Studio's existing operator review and runtime pairing mechanism to register an isolated **Pending** agent, create a dedicated runtime signing key and prove control. Operator credentials must never enter the agent runtime; runtime private keys never enter logs, chat, or repository.
5. Require explicit narrow scope approval and a versioned active mandate where the Studio route requires it. Keep proof of ownership, operator approval and action-origin authentication distinct.
6. Integrate the **actual** Studio SDK `AgentActionClient` and `withMcpGuard` around the existing LangChain tool execution boundary. Do not trust CLI/model-generated `ALLOW` strings or a callback that simply claims to be Guardian. Do not rely on the prototype `agent-tool-boundary.mjs`.
7. Use real, isolated Studio HTTP with its test PostgreSQL and real signing primitives. Prove successful bounded read, denied wrong scope, failed/expired/replayed signed origin, paused and revoked mandate, unavailable Guardian and wrong tenant/audience. Verify the original tool has zero side effects for all refusal paths. Record audit and receipt IDs, never keys or protected payloads.
8. Capture the precise checkout SHA, commands, container image versions, decisions, audit IDs and pass/fail logs as reproducible evidence. Put all fixtures into a PR with CI checks; keep PR #166 draft until security review.
9. Check tool-argument binding separately: a signed action and scope cannot, by themselves, prove the exact invocation parameters were covered. Bound tool schemas/arguments need their own verified design and tamper tests before any external action is permitted.
10. Report whether the proof used real LangChain execution, real Guardian/mandate enforcement, or just simulated gates. Do not call the product production-ready based on a local harness.

## Completion gate

Must show **real agent tool runtime** → **real signed Guardian request** → **live authorization decision** → **conditional tool execution** → **audit receipt**, plus denial without tool invocation. A unit-test mock is insufficient.

No production rollout, global mandate-enforcement flag flip, npm publication or paid LLM inference without explicit subsequent approval.
