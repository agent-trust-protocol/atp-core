# Contribute to Agent Trust Protocol™

ATP is an open trust layer for AI agents. You can help by trying a package, testing an integration boundary, reviewing a specification draft, or improving a guide. You do not need to adopt the whole stack to participate.

## Find a place to start

- **Developer experience:** Try [`atp-sdk`](packages/sdk/README.md) or [`create-atp-agent`](packages/create-atp-agent/README.md). File an issue with the command, expected result, actual result, Node version, and a small reproduction.
- **Identity:** Add `did:atp` vectors and edge cases for [`@atpdeveloper/did-atp`](packages/did-atp/README.md).
- **Policy:** Add action and session-state cases for [`atp-profiles`](packages/atp-profiles/README.md), including how a runtime enforces the returned decision.
- **Interop:** Propose a concrete MCP, A2A, ANP, ADK, or framework binding and an executable test. ATP complements those systems.
- **Specifications:** Review the [Community Group drafts](https://w3c-cg.github.io/atp/specs/) and discuss normative wording in [w3c-cg/atp](https://github.com/w3c-cg/atp). Community Group drafts are not W3C Standards.

## Work in the repository

```bash
git clone https://github.com/agent-trust-protocol/atp-core.git
cd atp-core
npm install
npm run conformance
```

For package-specific changes, follow that package's README and run its relevant tests. Keep changes focused and include tests where behavior changes. Never commit secrets, production connection strings, or ATP Studio data.

1. Check existing issues and pull requests.
2. Create a branch in your fork.
3. Explain the behavior or draft text you are changing and why.
4. Include a test vector or reproduction when applicable.
5. Open a pull request with the commands you ran and any known limitations.

Please describe released code, experimental work, and specification proposals separately. A passing conformance test is evidence for its covered case, not certification of every draft capability.

## Project boundaries and license

This repo is ATP Core. The [website](https://github.com/agent-trust-protocol/atp-website) and [ATP Studio](https://studio.agenttrustprotocol.com/) are separate projects. Contributions to this repository follow its [Apache-2.0 license](LICENSE). Agent Trust Protocol™ is a trademark of Sovr INC.
