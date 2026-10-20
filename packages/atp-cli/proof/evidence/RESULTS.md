# ATP CLI 3.0 existing-agent proof: incomplete / release blocked

Updated 2026-10-20 (UTC). **Completion gate: still unmet.** No successful ALLOW from a free local
model has been shown. This file has two parts:

1. **Developer-Mac local-model attempts (2026-10-18 UTC, recorded 2026-10-20):** new below.
2. **Isolated workspace run (recorded 2026-10-18 UTC):** the original record, kept unchanged as
   historical context. That environment had no Ollama service or model. The Mac runs below took
   place afterwards, on a different machine where Ollama was available.

## 1. Developer-Mac local-model attempts

### Scope and honesty notes

- **Different agent and path from the workspace fixture.** The existing agent here is the
  LangChain Deep Agents Python Text-to-SQL example (pinned upstream `e80fd67d`). Its
  `sql_db_query` tool is replaced by an ATP-routed tool that posts a signed, mandate-bound
  request to Studio's server-owned Chinook SQL dispatch route. This is **not** the LangChain JS
  `withMcpGuard` / `AgentActionClient` path tested in part 2, and it does not resolve release
  blocker 3 for arbitrary tools.
- **Environment:** a developer Mac running a local Ollama on loopback, against an **isolated
  local harness**: disposable Docker PostgreSQL, restricted runtime and issuer roles, and a
  loopback Fastify listener mounting only the Studio mandate SQL route. It is **not** a running
  or deployed Studio. Studio source is private and is **not** included here.
- **No hosted or paid inference** in any attempt below, and no model downloads. One earlier,
  separately authorized paid run is listed only as context and is labelled as such.
- **Evidence provenance.** The run harness wrote its result files to temporary directories
  that were later wiped. Each claim below is backed by a sanitized JSON file in
  [`mac-local-ollama-20261018/`](mac-local-ollama-20261018/) carrying one of two classes:
  - `original-artifact`: the file the harness wrote, which still exists. Its SHA-256 is
    recorded.
  - `session-log-recovery`: the run's verbatim output as captured in the operator's local
    Claude Code session log. It cites the session ID, log line, timestamp and the SHA-256 of
    the privately held record.

  Raw session logs, recovered harness scripts (which contain test-only credentials) and
  unredacted records are held privately and are not published. The recovered scripts have not
  been re-executed since recovery and are not claimed to be runnable.
- **What "forced" means.** A test-only runner subclasses `ChatOllama`, overrides `bind_tools`,
  forces `tool_choice="sql_db_query"` (v2), and also narrows the bound tools to `sql_db_query`
  only (v3). This is harness coercion, not autonomous tool selection.

### Results

All runs asked "How many customers are from Canada?" with ATP enabled. The mandate pins exactly
one SQL string by digest (`... WHERE Country = 'Canada'`).

| Attempt | Model (local Ollama) | Outcome | Evidence |
| --- | --- | --- | --- |
| Autonomous (no coercion) | `llama3.2:3b` | **No structured tool invocation.** The call was printed as JSON text in the final answer. 0 tool calls, 0 ATP requests, `sqlCallbackDelta 0`. | [A1](mac-local-ollama-20261018/A1-autonomous-llama3.2-3b.json) (first launch failed on a runner bug before any model call: [A0](mac-local-ollama-20261018/A0-autonomous-llama3.2-3b-harness-error.json)) |
| Autonomous (no coercion) | `qwen2.5-coder:7b` | **No structured tool invocation.** Correct SQL as markdown text. 0 tool calls, `sqlCallbackDelta 0`. | [A2](mac-local-ollama-20261018/A2-autonomous-qwen2.5-coder-7b.json) (`original-artifact`) |
| Forced v1 / v2 / v3 | `qwen2.5-coder:7b` | **Plain text only, never a structured call.** In agent runs the SQL came back as markdown text. In a direct `bind_tools` probe the model returned `tool_calls=[]` with the call serialized as JSON in plain text, under `tool_choice` = tool name, `any` and `required`. | [F1](mac-local-ollama-20261018/F1-forced-qwen2.5-coder-7b-v1.json), [F2](mac-local-ollama-20261018/F2-forced-qwen2.5-coder-7b-v2.json), [F6](mac-local-ollama-20261018/F6-forced-qwen2.5-coder-7b-v3.json), [F3](mac-local-ollama-20261018/F3-direct-bind-tools-probe-qwen-llama.json) |
| Forced v2 (all tools bound) | `llama3.2:3b` | No structured call; JSON text. | [F4](mac-local-ollama-20261018/F4-forced-llama3.2-3b-v2.json) |
| Forced v3 (narrowed) | `llama3.2:3b` | **Two real structured `sql_db_query` calls** reached the ATP route and were signed and checked. Both were **DENIED `invalid_payload`**: the SQL string literal was cut off (`... WHERE Country = `). **No SQL callbacks** (`sqlCallbackDelta 0`), no success receipt, audit chain OK, **Chinook database unchanged** (SHA-256 `7651ba37…1f15` before and after). Repeated once with the same result. | [F8](mac-local-ollama-20261018/F8-forced-llama3.2-3b-v3-final.json) (complete record), [F5](mac-local-ollama-20261018/F5-forced-llama3.2-3b-v3-run1.json) (first run, filtered excerpt) |
| Direct probe (no ATP) | `llama3.2:3b` | Structured calls, but with typographic (curly) quotes around `Canada`, which would not match the pinned SQL either. | [F7](mac-local-ollama-20261018/F7-direct-probe-llama3.2-3b-quotes.json) |
| Load attempt | `gemma4:26b` | **Load timeout.** Did not load within 120 s. Two `ornith` models queued behind it in the same probe were **never evaluated** (zero output before the probe was stopped). | [G1](mac-local-ollama-20261018/G1-gemma4-26b-load-timeout.json) |
| **Successful ALLOW from a free local model** | — | **Still unproven.** | — |

The server's DENY of the malformed SQL is correct enforcement. Quote normalization at the tool
boundary and widening the approved-SQL set were both deliberately **not** done, because either
would weaken the argument binding the proof exists to show.

### Context: enforcement without a model, and one prior paid run

These do not satisfy the free-local requirement. They are recorded so the state is complete.

- **Enforcement matrix, no model** ([M1](mac-local-ollama-20261018/M1-enforcement-matrix.json),
  `original-artifact`). Real runtime pairing → ownership proof → mandate issuance → the mandate
  SQL route, on the same kind of isolated harness. Results: ALLOW (8 rows, receipt and audit
  event); wrong scope → `resource_out_of_scope`; replay → `origin_unverified`; expired origin
  → `origin_unverified`; paused → `mandate_paused`; resume → ALLOW; revoked →
  `mandate_revoked`; wrong tenant/audience → `action_payload_mismatch`; payload tamper →
  `invalid_action`; verifier unavailable → HTTP 500 with no decision envelope. No SQL callback
  on any refusal; Chinook unchanged. "Expired capability credential" does not apply on this path,
  because it binds through the mandate rather than a separate credential.
- **One prior paid, hosted-model run** ([P1](mac-local-ollama-20261018/P1-paid-allow-claude-sonnet-5-5.json),
  `original-artifact`, explicitly authorized once, 2026-10-17). `claude-sonnet-5-5` made a real
  structured `sql_db_query` call → SUCCEEDED, 8 rows, one SQL callback, receipt, audit chain
  OK, Chinook unchanged. This is the only agent-driven green ALLOW on record, and it **used a
  paid hosted model**.

### Gaps in the Mac evidence

- The F2, F4, F5 and F6 outputs were grep-filtered when captured. Only excerpts exist, so their
  Chinook hashes are not recorded (the F8 repeat run has the full record).
- The original A1 result file was overwritten by A2. Only the session-log copy of A1 survives.
- M1 has no committed reference hash. It was verified case by case against the session-log
  output. P1's three files match previously recorded hashes.
- Ollama model digests at run time were not captured in the run records.
- Nothing here was re-run in order to produce this update.

## Updated completion-gate status

| Gate element | Status |
| --- | --- |
| Pre-existing agent selected and pinned | Done on the Mac path (Deep Agents Text-to-SQL, upstream `e80fd67d`) |
| Free local model available | Done on the Mac (Ollama). Not available in the workspace (part 2) |
| Real structured tool invocation reaching ATP, free local model | Shown **only under harness coercion** (llama3.2:3b, F8). Never autonomously |
| Live signed ALLOW with receipt, free local model | **Not met** |
| Refusal without side effects under enforcement | Shown on the isolated harness (M1, F8) |
| Mandate bridge for arbitrary LangChain tools (blocker 3) | **Open.** The Mac path uses a SQL-specific dispatch route |
| Security review and CI for the cross-repository fixture | **Open** |

---

## 2. Historical record: isolated workspace run (recorded 2026-10-18 UTC)

The text below is unchanged from the original record except that its headings were moved down
one level. Its statements about Ollama, Docker and PostgreSQL describe that workspace only.

Recorded 2026-10-18 (UTC).

### Pinned inputs

- Core baseline / PR #166 head: `b89d64f06549e184d2f25df780aeae519a0a0c0e`.
- Studio source: `da2014d22ec53117839b8bebdd711478da89f562`.
- Node: `v24.19.0`; LangChain: `1.5.18`; Vitest: `2.1.8`.
- Fixture dependency lock: `../package-lock.json`. No hosted LLM or paid API invoked.
- Studio was read via authenticated GitHub file access into a separate source directory.
  Private Studio Git clone failed because shell Git had no credentials. No private
  Studio source is included in this public PR.

### What changed

Added an experimental LangChain middleware bridge importing the real Studio SDK.
The original tool handler is invoked through `withMcpGuard`; an unmapped tool is
refused before authorization. Scope configuration is copied at construction, not
inferred from model output. Added locked, standalone boundary tests and preflight.
Pinned the preview workflow's checkout/setup-node actions to verified commit SHAs
to address both mutable-tag review findings. Security scanner rerun is pending.

### Executed checks

| Check | Result | Evidence |
| --- | --- | --- |
| Existing CLI preview tests | 38 passed, 0 failed | cli-tests.log |
| Existing create-atp-agent build and tests | 2 passed, 0 failed | create-atp-agent-tests.log |
| Real Studio SDK signing/pairing unit tests | 9 passed, 0 failed | studio-sdk-tests.log |
| Real LangChain runtime + real SDK, simulated Guardian responses | 5 passed, 0 failed | langchain-boundary-tests.log |
| Live prerequisites | BLOCKED, exit 2 | preflight.json |

Boundary cases: ALLOW invokes the original fixture handler exactly once; DENY,
transport failure, malformed response, and unmapped tool invoke it zero times.
For requests that reach the simulated transport, ML-DSA signatures are verified
against canonical Studio request bytes and runtime cookies are omitted.
The model is LangChain's `FakeToolCallingModel`, not an LLM. Guardian responses are
explicitly simulated; no live policy, nonce store, audit commit or mandate status
is proven by these five tests. Handler counters are boundary-only side-effect evidence.

### Live end-to-end matrix

| Required case | Outcome |
| --- | --- |
| Existing agent with free local LLM | NOT RUN: no Ollama service/model available |
| Pending registration, runtime pairing, operator scope approval | NOT RUN against live Studio |
| Live signed ALLOW / DENY and audit receipt | NOT RUN |
| Replayed signed request | NOT RUN against PostgreSQL nonce store |
| Expired origin assertion / expired capability credential | NOT RUN against live Studio |
| Paused / revoked mandate | NOT RUN |
| Wrong tenant / audience | NOT RUN |
| Payload or tool-argument tampering | NOT RUN |
| Refusal without tool side effects under live enforcement | NOT RUN |

No live audit or receipt IDs exist from this execution. None are fabricated.
Preflight found no Docker executable, PostgreSQL server executable, or reachable
Ollama model. PostgreSQL installation was attempted; apt failed on container
permissions (setgroups/seteuid, then archive-cache write permission errors).
No production configuration or infrastructure was changed.

### Release blockers

1. Provision a runnable isolated Studio HTTP + real PostgreSQL environment and
   separate restricted runtime/mandate-issuer roles. Do not reuse Core resources.
2. Make a free local model available and select/pin the real pre-existing agent.
   This fixture validates the LangChain integration only, not a user's existing agent.
3. Complete the mandate bridge: `AgentActionClient` / `withMcpGuard` target legacy
   `/v1/agent-authorize` and lack mandate ID/version/digest/audience/payload binding.
   With `requireMandatesForAgentTools` enabled the legacy route returns
   `mandate_required`. The separate `/v1/mandate-agent-action` route currently
   executes a narrow server-owned `atp.trust` read, not arbitrary LangChain tools.
   A reviewed dispatch adapter must preserve argument binding and server-side
   status checks; disabling mandate enforcement is not a fix.
4. Execute every live matrix case with audit/receipt correlation, side-effect
   assertions and test PostgreSQL evidence. Complete security review and CI for
   this cross-repository fixture. Current public Core CI runs preview/compatibility
   tests only; it cannot assume access to private Studio sources.

Earlier setup failures were corrected: TypeScript was initially absent for the
compatibility build (fixed by its locked npm install); isolated Vitest initially
loaded Core's PostCSS config (fixed with an empty test-only PostCSS config).
Final executed test suites have zero failures; the end-to-end completion gate
remains unmet. No merge, npm publication, deployment or paid inference performed.
