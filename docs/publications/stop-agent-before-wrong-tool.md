# Stop an AI Agent Before It Executes the Wrong Tool

**SovrLabs Research & Insights · November 4, 2026**

An AI agent can be helpful for an hour and then make one tool call that changes everything. A coding agent reads a file, searches documentation, and finally attempts a terminal command. That last action deserves a different permission decision from the first.

**A verified identity does not mean unrestricted authority.** Proving which agent made a request cannot tell a host whether the particular tool call is permitted.

## The control point is immediately before execution

The critical moment is the handoff from an agent's proposed action to a tool's real side effects. A host needs to translate a tool name into a known action category, evaluate a policy, and honor one of three decisions:

- **Allow:** dispatch the action, subject to its resource constraints.
- **Require approval:** stop and obtain valid approval separately; do not quietly execute.
- **Deny:** do not dispatch the tool callback.

The open-source [ATP profiles package](../../packages/atp-profiles/README.md) implements a small decision evaluator with conservative behavior for unknown actions. It does not automatically control every tool on a machine. An adapter and host must enforce its result.

## Try the action boundary yourself

With Node.js 20 or 24, run:

```bash
git clone https://github.com/agent-trust-protocol/atp-core.git
cd atp-core/examples/action-boundary
npm ci --ignore-scripts
npm start
```

The example demonstrates a limited read that runs, an approval-requiring shell callback that remains blocked, and a read that is denied after the local session ends. You can inspect the [source and transcript](../../examples/action-boundary/README.md) rather than trust a screenshot.

For an actual agent integration, ATP Core includes a [Hermes Agent pre-tool hook walkthrough](../../examples/hermes-hook/README.md). The walkthrough shows how a restricted read can be allowed while terminal and write calls are held or blocked. The runtime verifier uses scripted local tool selection; it does **not** prove that arbitrary autonomous agent behavior is contained.

## Why fail-closed behavior matters

A dangerous integration is one that treats an unfamiliar tool name as harmless. If an agent runtime changes the identifier of a terminal tool, a policy that recognizes only the old name might never apply.

ATP's conservative profiles are designed to deny unknown action categories. But the application developer must still make sure that every tool is actually routed through that check. No policy engine can block an action it never sees.

## What remains unsolved by this demonstration

The demo is not a signed authorization mandate, remote revocation test, receipt-verification service, or comprehensive sandbox. Completing a local session and blocking further reads is different from revoking a delegation credential already carried through several services.

The broader Agent Trust Protocol effort explores portable identity, trust evidence, bounded authorization, and interoperability across MCP, A2A, ANP, and other systems. Those goals require separate specification work and conformance evidence.

## Your next step

**Protect one real tool.** Start with the demo, inspect the policy, and test one read or terminal boundary in your own isolated runtime using safe test data. Then [report what worked or failed in the developer pilot](../launch/developer-pilot.md).

Five independent developers completing and reporting one real protected tool action will teach us more than inflated adoption claims. Even a failed installation is useful evidence.

[ATP Core on GitHub](https://github.com/agent-trust-protocol/atp-core) · [Developer pilot](../launch/developer-pilot.md) · [Technical whitepaper](technical-whitepaper-developer-edition-2026.md)

*Published by SovrLabs Research & Insights. ATP Community Group drafts are not W3C Standards or endorsed by W3C.*
