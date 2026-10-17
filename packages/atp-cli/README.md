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
