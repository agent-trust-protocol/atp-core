# ATP CLI — Interactive Developer Preview

This is an **unpublished, development-only** CLI shell, separate from the existing `create-atp-agent`, `atp-onboard-agent`, and `atp-stamp-agent` programs. It does not change their behavior.

## Local use

```bash
cd packages/atp-cli
node src/cli.mjs --help
node src/cli.mjs
npm test
```

The interactive session accepts `/help`, `/status`, `/agents`, `/connect`, `/guardian`, `/mandates`, `/audit`, and `/exit`. Commands currently provide read-only descriptions and **do not connect** to remote systems. The CLI has no LLM integration yet and does not execute natural-language requests.

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
