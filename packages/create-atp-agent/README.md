# create-atp-agent

The Agent Trust Protocol (ATP) CLI scaffolds a JavaScript ESM project using the published `atp-sdk`. The optional local browser UI saves configuration metadata. It does **not** mint a DID, generate keys, register an issuer, or enforce a security profile. The SDK creates a local, ephemeral identity when the generated agent runs without ATP services; a locally generated identifier is not publicly resolvable.

## New project

```bash
npx create-atp-agent my-agent
# The CLI installs dependencies and opens the local configuration UI.
# After closing it:
cd my-agent
npm start
```

For a terminal-only flow:

```bash
npx create-atp-agent my-agent --no-dashboard
cd my-agent
npm start
```

Use `--skip-install` to scaffold without installing. If installation fails, the CLI leaves the generated project in place, prints the npm error, and exits unsuccessfully. Run `npm install` in that directory to retry. `--no-open` runs the UI without opening a browser. `--dashboard-only` starts the UI without scaffolding.

## Existing project

```bash
npm install atp-sdk
npx -p create-atp-agent atp-stamp-agent
```

The stamping UI saves `.atp.json` in the current directory. It does not modify your application code or install a policy engine. Review the file and integrate the SDK and policy evaluation yourself. `atp-stamp-agent --no-dashboard` makes no changes. The UI is bound to `127.0.0.1`, default port 3456 (or the next available port); pass `--port` with `atp-stamp-agent` or `atp-onboard-agent`.

## What the files do

- `agent.mjs`: imports `Agent` from `atp-sdk` and creates an agent on each run.
- `.atp.json`: optional metadata saved by the local UI. The starter code does not read or enforce it.
- `package.json`: pins a compatible range of the currently published SDK; it does not depend on the unreleased SDK version in this repository. The published SDK 1.2.5 omits `dist/index.d.ts`, so the CLI scaffolds JavaScript until a typed SDK release is available.

For production identity, persist key material securely and integrate a resolvable DID and managed ATP services. The public specification work is distinct from the released SDK.

## Verify this package locally

```bash
cd packages/create-atp-agent
npm ci
npm test
npm pack --dry-run
```
