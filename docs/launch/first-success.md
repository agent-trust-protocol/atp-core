# Your first useful ATP result

Choose one path. No account or survey is required to install.

## Protect Hermes

Use a disposable profile and keep native host permissions enabled:

```bash
npx --yes atp-hermes-hook@0.2.1 setup
hermes -p atp-pilot hooks test pre_tool_call --for-tool terminal
hermes -p atp-pilot chat
```

Follow the [complete walkthrough](../../examples/hermes-hook/README.md), including provider setup if needed and consent to the exact hook. Confirm matcher `.*` and `fail_closed: true`; restart an existing session after changes. Read only the setup fixture successfully. Confirm terminal, write and `execute_code` attempts are blocked before execution. Do not run destructive commands for testing. Stop if an unexpected action executes; record versions and report the failure privately if security sensitive. Hook tests and decision previews alone do not establish live enforcement. This policy gate does not supply OS sandboxing, identity verification or mandates.

## Build a JavaScript agent

```bash
npx create-atp-agent@latest my-agent --no-dashboard
cd my-agent
npm start
```

The next starter release adds three policy previews: allow, require_approval, deny. Until published, the registry starter may only print the standalone result. An identifier or preview does not prove tool enforcement. For an existing agent, use the SDK's decision evaluator and enforce every result before calling a tool.

## Try Python decisions

Install either `atp-profiles` or the `agent-trust-protocol` convenience bundle. Both use the same evaluator; the bundle has no separate import. Run the [Python quickstart](../../packages/atp-profiles-python/README.md#use): expect read_file allow, terminal require_approval, unmapped deny. No tool runs. Route approval to a real human gate, or block it. Keep Python identity experiments separate from this policy exercise.

## Share the outcome

Use the [optional developer feedback path](developer-pilot.md). Record runtime/package versions, setup time, expected and actual allowed/blocked outcomes, and first failure. Remove secrets and private paths. Public GitHub feedback requires sign-in and explicit submission. Record consenting participants privately, deduplicate across packages, and count seven-day returns only after seven days. Package requests, GitHub accounts and installation IDs do not establish unique developers.

## Release order

1. Align CLI dependencies, repair stale SDK starter instructions, run CLI and packed-install gates, then publish through the existing CLI workflow.
2. Verify the Hermes walkthrough on the published packages with an outside developer; record live allowed and blocked outcomes.
3. Release the starter policy preview after generated-project smoke testing. Reuse the three-outcome flow in Python and the convenience-bundle documentation.
4. Measure completion and repeat use before expanding adapters. Optional feedback follows a useful result; installation stays ungated.
