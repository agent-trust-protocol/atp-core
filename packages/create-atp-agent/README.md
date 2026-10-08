# create-atp-agent
### From idea to a running ATP starter

Use the ATP CLI to scaffold a small JavaScript ESM agent project with the published `atp-sdk`. Node.js 18 or newer is required.

```bash
npx create-atp-agent my-agent
cd my-agent
npm start
```

The CLI installs dependencies and opens an optional local configuration screen at `127.0.0.1:3456` (or the next available port). You can explore the generated `agent.mjs` and add ATP to the tools and protocols your agent already uses.

## Pick your flow

| Goal | Command |
| --- | --- |
| New project with local UI | `npx create-atp-agent my-agent` |
| Terminal-only scaffold | `npx create-atp-agent my-agent --no-dashboard` |
| Scaffold without installing | `npx create-atp-agent my-agent --skip-install` |
| Open the UI without scaffolding | `npx create-atp-agent --dashboard-only` |
| Add metadata to an existing project | `npx -p create-atp-agent atp-stamp-agent` |

Use `--no-open` to start the UI without launching a browser. If dependency installation fails, the generated folder remains; run `npm install` inside it to retry.

## What it creates

- `agent.mjs` calls `Agent.quickstart` from `atp-sdk` when you run the starter.
- `package.json` declares the SDK dependency and a `start` script.
- `.atp.json` can hold metadata saved by the local UI.

The local UI is a configuration demo. It does **not** mint a DID, generate or persist keys, register an issuer, connect a production ATP service, or enforce a security profile. The generated agent's standalone identity is ephemeral and not remotely resolvable by default. Review key storage, service connections, and policy enforcement before cross-system or consequential use.

For an existing application, install the [SDK](../sdk/README.md) directly. For canonical profiles, see [`atp-profiles`](../atp-profiles/README.md).

## Try it and contribute

Run the scaffold, inspect the output, and tell us where onboarding is confusing. Reproducible issues, starter templates, and tests for new agent ecosystems are welcome in [ATP Core](https://github.com/agent-trust-protocol/atp-core/issues). See [CONTRIBUTING.md](../../CONTRIBUTING.md).

To verify a CLI change locally:

```bash
cd packages/create-atp-agent
npm ci
npm test
npm pack --dry-run
```

ATP specifications are Community Group drafts, not W3C Standards. The CLI is an implementation tool, not a conformance certificate.
