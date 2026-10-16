# ATP Core developer launch

## Message and evidence

**The Open Trust Layer for AI Agents. Put a policy check immediately before an AI agent acts.**

Start with the local action-boundary demo, then the Hermes hook. These demonstrate category/state enforcement and a fixed-resource adapter. They do not demonstrate signed mandate issuance or revocation. ATP Core is the open developer foundation; ATP Studio is a separate enterprise product. W3C Community Group drafts are not W3C Standards.

## Launch checklist

- [ ] Merge the launch PR after its required checks pass.
- [ ] Confirm the README animation and five-minute command sequence render on main.
- [ ] Upload `social-preview.png` in repository Settings → General → Social preview (1280 × 640).
- [ ] Review existing topics; add only accurate topics from: `ai-agents`, `agent-security`, `authorization`, `decentralized-identity`, `verifiable-credentials`, `typescript`, `policy-enforcement`. Add runtime/protocol topics only where the documented integration warrants them.
- [ ] Record a live Hermes session with the exact Hermes version, hook consent, matched read and terminal attempts, returned decisions and execution outcome. Keep it separate from the wire-format demo.
- [ ] Publish the approved announcement on the maintainer's channels and relevant communities where project sharing is welcome.
- [ ] Invite a small number of independent developers to try the documented commands and report friction. Obtain permission before using names or testimonials.

## Ready-to-edit announcement

I'm building Agent Trust Protocol (ATP), an open trust layer for AI agents.

The first thing you can try is small: run a permitted read, hold a shell callback for approval, then deny the next read when the session ends. No hosted service or model key is needed. There's also a Hermes pre-tool hook example with a reproducible JSON walkthrough.

The larger goal is portable identity, trust evidence and authorization across agent systems. The examples document what works today and where the limits are. The local demo is a policy boundary, not a signed-mandate revocation demo.

Try it: https://github.com/agent-trust-protocol/atp-core#try-it-in-five-minutes

If it's useful to your agent project, star the repository and tell me what runtime or policy case you want to test next. Reproducible issues and contributions are welcome.

## Short post

What happens immediately before an AI agent executes a tool? ATP Core has a local policy-boundary demo and a Hermes hook example you can reproduce without model keys. Try them, report the rough edges, and star the repo if useful: https://github.com/agent-trust-protocol/atp-core

## GitHub visibility

Topics and a social preview improve how the project is described and shared. Neither guarantees Trending, Explore placement or an editorial feature. GitHub Explore accepts broadly useful topic/collection contributions; its guidelines discourage self-promotion. Do not submit a collection solely to feature ATP.

References:
- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics
- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview
- https://github.com/github/explore/blob/main/CONTRIBUTING.md

## Evaluate the launch

Compare dated star snapshots, independent issue reports, reproducible successful setups and useful contributions after publication. Treat npm downloads as package requests, not unique developers. Record verified live runtime use separately from example tests. No numeric star growth or featured placement is promised.
