# create-atp-agent
### From idea to a running ATP starter

[![npm](https://img.shields.io/npm/v/create-atp-agent)](https://www.npmjs.com/package/create-atp-agent) [![license](https://img.shields.io/npm/l/create-atp-agent)](https://github.com/agent-trust-protocol/atp-core/blob/main/LICENSE)

Scaffold a small JavaScript ESM agent with an identity from **Agent Trust Protocol™ (ATP)** in one command. The starter uses the published [`atp-sdk`](https://www.npmjs.com/package/atp-sdk) 5.x. Requires Node.js 20 or newer.

```bash
npx create-atp-agent my-agent --no-dashboard
cd my-agent
npm start
```

Expect a local `did:atp:...` identifier and `Standalone: true`. Open `agent.mjs` to see the few lines that start it. No API key or ATP service is needed. Omit `--no-dashboard` to open the optional local configuration screen.

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

For an existing application, install [`atp-sdk`](https://www.npmjs.com/package/atp-sdk) directly. To check each tool call against a security profile (`allow`, `require_approval` or `deny`), see the SDK's ["Decide before an agent acts"](https://www.npmjs.com/package/atp-sdk#decide-before-an-agent-acts) section and [`atp-profiles`](https://www.npmjs.com/package/atp-profiles).

## SDK version

Starter CLI 1.6.1 generates projects with `atp-sdk@^5.0.0`. The starter and SDK release separately. If you need SDK 6 in that project, read the [migration guide](https://github.com/agent-trust-protocol/atp-core/blob/main/packages/sdk/docs/MIGRATION.md), run `npm install atp-sdk@6` in the generated folder, and rerun `npm start` and your integration tests.

## Try it and contribute

Run the scaffold, inspect the output, and tell us where onboarding is confusing. Reproducible issues, starter templates, and tests for new agent ecosystems are welcome in [ATP Core](https://github.com/agent-trust-protocol/atp-core/issues). See the [contribution guide](https://github.com/agent-trust-protocol/atp-core/blob/main/CONTRIBUTING.md).

To verify a CLI change locally:

```bash
cd packages/create-atp-agent
npm ci
npm test
npm pack --dry-run
```

ATP specifications are Community Group drafts, not W3C Standards. The CLI is an implementation tool, not a conformance certificate.
