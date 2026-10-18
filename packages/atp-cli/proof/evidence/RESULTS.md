# ATP CLI 3.0 existing-agent proof: incomplete / release blocked

Recorded 2026-10-18 (UTC).

## Pinned inputs

- Core baseline / PR #166 head: `b89d64f06549e184d2f25df780aeae519a0a0c0e`.
- Studio source: `da2014d22ec53117839b8bebdd711478da89f562`.
- Node: `v24.19.0`; LangChain: `1.5.18`; Vitest: `2.1.8`.
- Fixture dependency lock: `../package-lock.json`. No hosted LLM or paid API invoked.
- Studio was read via authenticated GitHub file access into a separate source directory.
  Private Studio Git clone failed because shell Git had no credentials. No private
  Studio source is included in this public PR.

## What changed

Added an experimental LangChain middleware bridge importing the real Studio SDK.
The original tool handler is invoked through `withMcpGuard`; an unmapped tool is
refused before authorization. Scope configuration is copied at construction, not
inferred from model output. Added locked, standalone boundary tests and preflight.
Pinned the preview workflow's checkout/setup-node actions to verified commit SHAs
to address both mutable-tag review findings. Security scanner rerun is pending.

## Executed checks

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

## Live end-to-end matrix

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

## Release blockers

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
