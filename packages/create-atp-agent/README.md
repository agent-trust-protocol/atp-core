# create-atp-agent
### From idea to a running ATP starter

[![npm](https://img.shields.io/npm/v/create-atp-agent)](https://www.npmjs.com/package/create-atp-agent) [![license](https://img.shields.io/npm/l/create-atp-agent)](https://github.com/agent-trust-protocol/atp-core/blob/main/LICENSE)

Scaffold a small JavaScript ESM agent with an identity from **Agent Trust Protocol™ (ATP)** in one command. The starter uses the published [`atp-sdk`](https://www.npmjs.com/package/atp-sdk) 6.x (minimum 6.0.2). Requires Node.js 20 or newer.

```bash
npx create-atp-agent my-agent --no-dashboard
cd my-agent
npm start
```

Expect a local `did:atp:...` identifier and `Standalone: true`. Open `agent.mjs` to see the few lines that start it. No API key or ATP service is needed. Omit `--no-dashboard` to open the optional local configuration screen.

Once your starter runs, [star ATP Core](https://github.com/agent-trust-protocol/atp-core) if you’d like to follow the project.

## Feedback and support

[Rate your setup experience](https://github.com/agent-trust-protocol/atp-core/blob/main/docs/package-feedback.md#starter), leave a comment, or report a reproducible issue. Include `create-atp-agent`, its installed version, your runtime, and what you expected to happen. Remove secrets and private data from examples and logs. For vulnerabilities, follow the [private reporting guidance](https://github.com/agent-trust-protocol/atp-core/blob/main/SECURITY.md#reporting-a-vulnerability).

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

Starter CLI 1.7.0 generates projects with `atp-sdk@^6.0.2`, which installs the latest compatible SDK 6 release. The starter and SDK have separate version numbers. A new SDK major is reviewed and tested before the starter adopts it; it is not selected automatically with `@latest`.

Projects created with starter 1.6.x still use SDK 5.x until you upgrade them. Read the [migration guide](https://github.com/agent-trust-protocol/atp-core/blob/main/packages/sdk/docs/MIGRATION.md), run `npm install atp-sdk@^6.0.2` in the existing project, then rerun `npm start` and your integration tests. SDK 6 changes DID resolution and adds an opt-in Node transport; the local standalone quickstart stays available.

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
