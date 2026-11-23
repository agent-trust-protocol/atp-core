# ATP CLI — Interactive Developer Preview

This is an **unpublished, development-only** CLI shell, separate from the existing `create-atp-agent`, `atp-onboard-agent`, and `atp-stamp-agent` programs. It does not change their behavior.

## Local use

```bash
cd packages/atp-cli
node src/cli.mjs --help
node src/cli.mjs
npm test
```

The interactive session accepts `/help`, `/status`, `/agents`, `/connect`, `/guardian`, `/mandates`, `/audit`, and `/exit`. Commands currently provide read-only descriptions and **do not connect** to remote systems. The CLI now has optional, read-only LLM responses via `/ask`, but it cannot execute tools or take action from generated text.

## Free-first LLM policy

By default the CLI uses a local Ollama runtime on `127.0.0.1:11434` with model `qwen3:4b`. Local inference requires installing Ollama and pulling the model separately. It never falls back to a hosted service.

```bash
ollama pull qwen3:4b
ollama serve                   # only if Ollama is not already running
node src/cli.mjs               # then type: /model or /ask Explain ATP Guardian
```

To select the hosted **free** OpenRouter router, explicitly configure networking and a key:

```bash
export ATP_LLM_PROVIDER=free
export ATP_ALLOW_NETWORK=1
export OPENROUTER_API_KEY=...  # enter privately; never commit keys
node src/cli.mjs
```

This only requests `openrouter/free`. Free tiers can have rate limits, availability restrictions, and privacy implications. No silent fallback to paid inference occurs.

Paid inference is **disabled** unless you explicitly configure *both* `ATP_ALLOW_NETWORK=1` and `ATP_ALLOW_PAID=1`, plus `ATP_LLM_PROVIDER=paid`, `ATP_PAID_MODEL` and `OPENROUTER_API_KEY`. This is an expert-only opt-in; it is **not** automatic. No endpoint customization, agent tool execution, credential loading, or transcript upload is implemented. All hosted prompts are transmitted to the chosen provider, so do not enter secrets or sensitive operational data.

`/ask` is a read-only explanation path. LLM output is untrusted text and is not an ATP trust decision, authorization token, agent pairing proof or audit evidence.

## Read-only ATP Core registry inspection

ATP SDK's \`IdentityClient.listIdentities()\`, \`getTrustLevel()\`, and \`PermissionsClient.getPermissionsForSubject()\` correspond to existing ATP identity/permission service GET endpoints. The preview connects only to loopback services and makes only GET requests. No auto-discovery, Studio credential handling, or remote service access.

Run the locally trusted ATP services independently and deliberately opt in:

\`\`\`bash
export ATP_CORE_READ_ONLY=1
# Optional local ports: ATP_CORE_IDENTITY_PORT=3001 ATP_CORE_PERMISSIONS_PORT=3003
# Optional scoped token: ATP_CORE_READ_TOKEN (enter privately)
node src/cli.mjs
\`\`\`

Inside the terminal: \`/agents\` (registry list), \`/trust <did>\` (registry-reported trust level), \`/grants <did>\` (stored permission grants). Results are limited to 20 records per request. All results are **unverified registry evidence**; there is no cryptographic DID resolution, Guardian enforcement evaluation or authoritative permission-to-act determination. No data is uploaded to an LLM by these commands.

This read adapter is deliberately more constrained than the general-purpose SDK. It must not become an alternate Guardian authorization path. Real identity verification and Guardian decisions require separate validated implementations.

## Historical Guardian decisions from ATP Studio

The `/decision evt_...` command uses Studio's documented `GET /v1/audit/events/:id` detail endpoint, **not** the ATP Core permissions service. It is limited to an explicitly configured local Studio server and an operator session. The CLI does not request or issue an authorization decision.

```bash
export ATP_STUDIO_READ_ONLY=1
export ATP_STUDIO_LOCAL_PORT=3000
# Provide ATP_STUDIO_SESSION securely from an already authenticated local test session.
node src/cli.mjs
```

Never commit, paste, or share a session credential. Studio Core and Studio infrastructure must remain isolated. This preview uses an existing operator session and no login automation. Requests are GET-only, no redirects. The response is labeled historical/unverified until full cryptographic receipt verification is implemented. A previous ALLOW must never be treated as permission for a subsequent action.

## Existing-agent discovery: safe first pass

Run `/inspect [relative-directory]` within the ATP interactive terminal to inspect an existing **JavaScript package manifest**. For example, from a directory containing an existing agent:

```bash
node /path/to/atp-core/packages/atp-cli/src/cli.mjs
# atp ❯ /inspect .
```

The preview detects declared LangChain JavaScript packages, OpenAI Agents SDK, or CrewAI JS integration hints. Detection is limited to `package.json`, without executing scripts, importing modules, walking source files, or making network requests. Python agents and runtime tool discovery are not yet supported. A declared dependency is an unverified hint, **not** evidence of a functioning runtime, agent identity, scopes, authorization, or pairing.

The preview emits a human-review onboarding sequence: verify runtime capabilities, register a pending agent in ATP Studio, pair the actual runtime with a signed challenge, inspect requested scopes, approve only narrow authority, and test Guardian allow/deny/revocation. **It performs none of those actions.** Keep all onboarding and Studio data isolated from ATP Core.

## Existing-agent tool boundary prototype (not production enforcement)

The initial `src/agent-tool-boundary.mjs` wrapper demonstrates a **simulated** allow/deny integration around an existing JavaScript tool function. Tests cover allow, deny, malformed responses, and unavailable gate behavior without invoking real LangChain runtimes or making paid model calls.

**Security limitation:** this wrapper only checks an injected callback's response shape. It **cannot** independently authenticate that the response came from Guardian, bind the decision to the exact invocation arguments, verify ML-DSA signatures, nonce uniqueness, mandate revocation, or a short-lived execution token. Never install this module as a production security enforcement gate. A caller-controlled response that mimics the expected shape could bypass this prototype.

ATP Studio's real `POST /v1/agent-authorize` uses an agent runtime action assertion covering tenant, agent DID, key ID, timestamp, nonce, action, action kind, and required scope. Real adoption requires a vetted runtime signer and a trusted enforcement connector, plus the mandate controls currently under Studio, before a guarded tool may execute. A historical `/decision` audit event is not a substitute for that live authorization.

The next real proof must run against an isolated Studio test harness and verify a genuine signed ALLOW, a genuine DENY, replay denial, revoked/paused mandate denial, and no tool side effects on refusal. Not yet completed in this CLI branch.

## Release gates

1. Preserve existing published CLI command contracts and their tests.
2. Add an opt-in provider interface with explicit cost and network-consent controls.
3. Implement a narrow, read-only ATP Core adapter with evidence-aware output.
4. Implement agent discovery for a vetted existing framework; never conflate detected metadata with verified identity.
5. Add authorization previews and explicit operator approval before any mutation.
6. Add negative tests: replay, expired/revoked mandates, wrong scope/audience, denied actions, unavailable Guardian, and prompt injection.
7. Validate terminals, OS support, package naming/ownership, accessibility, CI, and versioning before publishing.

Trust evidence is distinct from permission to act. The interactive assistant must not mint authority or bypass ATP Core/Guardian. Fail closed on unavailable policy or identity verification.

## Status

This is an intentionally minimal first vertical slice. Not production-ready; no Studio or production environment access.
