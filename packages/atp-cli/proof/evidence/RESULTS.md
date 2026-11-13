# ATP CLI 3.0 existing-agent proof: bounded SQL proof shown locally / release blocked

Updated 2026-10-20 (UTC).

- **Bounded Chinook SQL live proof: shown on a local harness.** A free local model on the
  developer Mac drove the existing agent to a real, structured `sql_db_query` call that the
  mandate route ALLOWED, with a receipt, one SQL execution, an intact audit chain and an
  unchanged database. This held with harness-coerced tool selection and with autonomous selection,
  on two locally installed models. Read the disclosures in part 0 before citing it.
- **ATP CLI 3.0 release: still blocked.** Open items: the mandate bridge for arbitrary tools
  (blocker 3), a security review and CI for the cross-repository fixture, and operator approval
  through the console route rather than in the harness.

This file has three parts:

0. **Bounded Chinook SQL proof (2026-10-20):** new below.
1. **Developer-Mac local-model attempts (2026-10-18 UTC, recorded 2026-10-20):** no free-local
   ALLOW on those models. Kept as recorded.
2. **Isolated workspace run (recorded 2026-10-18 UTC):** the original record, kept unchanged as
   historical context. That environment had no Ollama service or model.

## 0. Bounded Chinook SQL proof on the developer Mac (2026-10-20)

### What ran

- **Studio implementation:** private repository, draft PR #90, branch
  `integrate/chinook-sql-proof` (from Studio `main`). Commits: `9b420c3` for the first run and
  `f38b3ec` for the others; the only difference between them is a `run.sh` exit-status fix. Studio
  source is **not** included here.
- **Existing agent:** the LangChain Deep Agents Text-to-SQL example (upstream `e80fd67d`) on the
  ATP demo fork's boundary branch (`e0e5b1c`). `agent.py` is unmodified. Before `agent.py` loads,
  the harness replaces the `ChatAnthropic` name with a local `ChatOllama` on loopback.
- **Environment:** an isolated local harness — disposable Docker PostgreSQL and a loopback
  Fastify listener mounting the Studio mandate SQL route and the neighbouring atp.trust route. It
  is **not** a Studio deployment. There was no paid or hosted inference and no model download.
  The harness refuses cloud models, models not already installed, and models without tool
  support.
- **Pairing:** the agent starts Pending with no key and proves possession of its key by signing
  a challenge verified by the server's runtime proof path (`proveRegisteredAgent`). **Operator
  approval (Pending → Active, `read` granted) is applied directly in the harness database, not
  through the operator console route.**
- **SQL bound:** the product default approved set, which is the single pinned statement. The
  mandate pins the exact signed SQL bytes. **Nothing was widened or normalized.**
- **Selection modes, recorded per run:**
  - `harness-coerced`: whenever the agent binds tools, the set is narrowed to `sql_db_query` and
    `tool_choice` is forced.
  - `autonomous`: no coercion.

  In both modes the **model generated the SQL argument**. The harness never writes, edits,
  normalizes or fabricates a call.

### Disclosure: the agent's instructions contain the statement

The demo fork's `AGENTS.md` (an addition to the upstream example) tells the model, when ATP is
enabled, to emit the pinned statement verbatim for this question. These runs therefore show
**faithful reproduction of an operator-supplied statement inside a real structured tool call**,
not independent SQL authorship. The 2026-10-18 `llama3.2:3b` and `qwen2.5-coder:7b` attempts
(part 1) ran with the same instructions and did not succeed.

### Results

| Model (local Ollama, digest) | Selection | Structured calls | Outcome | Evidence |
| --- | --- | --- | --- | --- |
| `ornith:latest` (`a75697c14589`, 9B Q4_K_M) | harness-coerced | 1 × `sql_db_query` | **ALLOW**: SUCCEEDED, 8 rows, 1 SQL callback, receipt `mrx_01M5E4RC…`, audit `authorized → started → succeeded`, chain OK, Chinook unchanged; 19.5 s | [L-ornith-latest-coerced](mac-local-ollama-20261020/L-ornith-latest-coerced.json) |
| `ornith:latest` | autonomous | `sql_db_schema`, then 1 × `sql_db_query` | **ALLOW**, same properties; 33.7 s | [L-ornith-latest-autonomous](mac-local-ollama-20261020/L-ornith-latest-autonomous.json) |
| `hrbrmstr/ornith-9b-fixed:latest` (`e0736e04f077`) | harness-coerced | 1 × `sql_db_query` | **ALLOW**, same properties; 19.9 s | [L-ornith9bfixed-coerced](mac-local-ollama-20261020/L-ornith9bfixed-coerced.json) |
| `hrbrmstr/ornith-9b-fixed:latest` | autonomous | 1 × `sql_db_query` | **ALLOW**, same properties; 31.3 s | [L-ornith9bfixed-autonomous](mac-local-ollama-20261020/L-ornith9bfixed-autonomous.json) |

Each run used a freshly started harness and a 240-second wall-clock bound. Each produced exactly
one SQL callback and one new `SUCCEEDED` receipt.

### Enforcement matrix (no model), same harness, commit `f38b3ec`

**14/14 PASS**, audit chain OK, Chinook unchanged
([M2](mac-local-ollama-20261020/M2-enforcement-matrix.json)):
- **allow:** 1 callback, with receipt.
- **replay:** `origin_unverified`, unaudited.
- **unapproved SQL:** `sql_not_approved`, audited, no receipt — never `UNCERTAIN`.
- **truncated SQL from the verified agent:** `invalid_payload`, audited, nonce spent.
- **tampered payload:** `payload_digest_mismatch`, audited; the original envelope is then unusable.
- **expired origin:** `origin_unverified`, unaudited.
- **wrong audience:** `origin_unverified`, unaudited.
- **cross-route, both directions:** `origin_unverified`. An envelope sent to the wrong route does
  not consume its nonce, and it later succeeds on its own route.
- **pause → resume:** `mandate_paused`, then ALLOW.
- **revoke:** `mandate_revoked`.
- **server-side outage:** HTTP 500 `application/problem+json`, with no decision envelope.
- **unreachable verifier:** the agent tool returns `verifier_unavailable`, with no direct-database
  fallback.

No refusal executed SQL.

`resource_out_of_scope` and the ordering cases are covered by the Studio integration suite
(521/521 tests pass on the PR branch) rather than widened into the harness:
- a revocation or pause committed after authorization cancels the call without executing it;
- one committed after execution starts lets that single call finish, and blocks every later
  request.

### Changes since the 2026-10-18 record that affect these results

- Refusals from verified callers are now audited. Previously `invalid_payload` and
  `action_payload_mismatch` returned `auditEventId: null`.
- Unapproved SQL is refused before execution starts.
- Signatures are bound to their route.
- The harness now returns the product's RFC 9457 error shape, where it previously returned a bare
  HTTP 500.

All of these are in Studio draft PR #90.

### Gaps

- Operator approval is harness-applied. The console approval route is not exercised.
- One agent and one bounded action. Nothing here covers arbitrary tools.
- The `AGENTS.md` disclosure above.
- Raw outputs, server logs and handshakes are held privately. The sanitized files above cite the
  SHA-256 of each raw file.

## 1. Developer-Mac local-model attempts (2026-10-18)

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

## Completion-gate status (as of 2026-10-20)

| Gate element | Status |
| --- | --- |
| Pre-existing agent selected and pinned | Done (Deep Agents Text-to-SQL, upstream `e80fd67d`) |
| Free local model available | Done on the Mac (Ollama). Not available in the workspace (part 2) |
| Real structured tool invocation reaching ATP, free local model | **Shown**, harness-coerced and autonomous (part 0). On 2026-10-18 it was shown only under coercion, and was denied |
| Live signed ALLOW with receipt, free local model | **Shown for the bounded Chinook SQL action**, on a local harness, with the `AGENTS.md` disclosure |
| Refusal without side effects under enforcement | Shown (M2, plus the Studio integration suite) |
| Operator approval through the console route | **Open.** Harness-applied in these runs |
| Mandate bridge for arbitrary LangChain tools (blocker 3) | **Open.** The proof uses a SQL-specific dispatch route |
| Security review and CI for the cross-repository fixture | **Open** |

### CI status of this PR (recorded honestly)

- Semgrep OSS code-scanning alert #453 (`react-insecure-request` on the loopback Ollama preflight
  request in `proof/preflight.mjs`) is **open** and is being left open for now.
- The `Semgrep OSS` check therefore **fails**. It is advisory, not a required check, and an inline
  suppression (honored in the SARIF) does not close a GitHub alert.
- Do not read this PR's checks as all green while that check fails.

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
