# Keep published package surfaces aligned

The npm registry's top-level README can differ from the repository README and from the README in a version's tarball. Check all three before announcing a release. On October 12, 2026, `atp-sdk` metadata identified 2.2.0 as latest, while the registry README still described 1.2.5 and a blocked 2.1.0 release. Main's README was already corrected.

1. Read `npm view atp-sdk version` and the exact version's metadata.
2. Read the npm package page and compare its release-status text with main's `packages/sdk/README.md`.
3. Inspect the README in `npm pack atp-sdk@<version>` from an empty directory; inspect without executing package scripts.
4. Correct metadata with authorized npm maintainer access, or include the corrected README in the next **new version** published through the existing trusted-publishing workflow. Never republish an immutable version or bump merely to inflate download counts.
5. Verify the public npm page and registry README after publication before claiming the discrepancy is fixed.

Keep Core's open-source identity, trust utilities and profiles separate from Studio's commercial enterprise workflows. Describe draft/experimental work truthfully. Do not label payment ecosystem participants as ATP partners without actual partnership evidence.

Suggested GitHub repository About text:

> Open identity, trust evidence and action-policy tools for AI agents. Developer SDK, profiles and conformance work; enterprise operations in ATP Studio.

Suggested repository topics: `ai-agents`, `agent-trust-protocol`, `decentralized-identity`, `verifiable-credentials`, `security`, `mcp`, `post-quantum`, `typescript`, `open-source`. Remove the `al-agents` typo. Avoid `w3c-standards` because Community Group drafts are not W3C Standards. Changing About/topics requires repository administration access; a docs commit alone does not change them.
