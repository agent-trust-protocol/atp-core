# Get Started with ATP Core in Five Minutes

**SovrLabs Research & Insights · November 4, 2026**

This walkthrough is for developers who want to see whether a policy check can prevent an unwanted AI-agent tool call **before the host executes it**.

## Prerequisites

- Node.js **20 or 24**, npm, Git.
- A terminal and an isolated workspace.
- **No model API key, ATP account, or hosted service required.**

## Step 1 — Clone the public repository

```bash
git clone https://github.com/agent-trust-protocol/atp-core.git
cd atp-core/examples/action-boundary
npm ci --ignore-scripts
```

## Step 2 — Run the demonstration

```bash
npm start
```

Inspect the text output and compare it with the expected behavior in the [official walkthrough](../../examples/action-boundary/README.md):

1. A read of the allowed fixture runs.
2. A shell action requiring approval never invokes its callback.
3. The completed session does not permit a further read.

These are three *local tool-boundary behaviors*. No signed mandate is issued or revoked.

## Step 3 — Understand the protection

The host first converts a tool name to an ATP action category. A profile returns an `allow`, `require_approval`, or `deny` decision. The host must enforce that decision before calling the tool.

A policy evaluation that merely logs `deny` **after** a tool executes is not containment.

## Step 4 — Move to a framework integration

For Hermes Agent users, continue to the [Hermes pre-tool hook example](../../examples/hermes-hook/README.md). Begin with its subprocess test, then follow the separately documented runtime verification and own-profile steps. Never install a permissive hook into a sensitive production agent as the first test.

For another runtime, read the [profile evaluator documentation](../../packages/atp-profiles/README.md) and build a small adapter that normalizes each host tool to a category. Default unknown tools to deny and keep resource/path restrictions in the enforcing host.

## Step 5 — Help improve the release

We are seeking **five independent developer evaluations**. Tell us whether the setup succeeded, how long it took, and which real tool action was permitted or blocked.

[Join the pilot and report an outcome](../launch/developer-pilot.md). Do not publish customer data, prompts, credentials, or private local paths.

## Further reading

- [Technical whitepaper](technical-whitepaper-developer-edition-2026.md)
- [Why the action boundary matters](stop-agent-before-wrong-tool.md)
- [ATP Core README](../../README.md)
- [W3C Community Group specifications](https://w3c-cg.github.io/atp/specs/)

*ATP specifications remain Community Group drafts; they are not W3C Standards. The demonstrated local boundary does not establish universal agent security.*
