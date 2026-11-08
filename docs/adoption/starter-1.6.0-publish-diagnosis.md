# Starter 1.6.0 publishing diagnosis — November 6, 2026

Run https://github.com/agent-trust-protocol/atp-core/actions/runs/42167203210 , job 127726329273, passed version validation, dependency installation, three tests, generated-project startup, and package inspection. npm generated a provenance statement, then the registry rejected the PUT for create-atp-agent with E404 and an explicit missing-resource-or-permission message. Registry latest remained 1.5.0 during this check; SDK latest was 5.0.0.

## Likely cause and required account check

An npm trusted-publisher identity mismatch or missing configuration is the leading hypothesis. Account settings have not been inspected, so the exact cause remains unresolved. Workflow permissions include id-token: write, a GitHub-hosted runner is used, and the npm >=11.5.1 guard passed. The masked NODE_AUTH_TOKEN shown by setup-node does not establish use of a stored token.

In npm's create-atp-agent package settings, inspect the GitHub Actions trusted publisher against these exact values from the workflow:

| Setting | Required identity |
| --- | --- |
| Organization or user | agent-trust-protocol |
| Repository | atp-core |
| Workflow filename | npm-publish-cli.yml |
| GitHub environment used by job | npm-publish |

The workflow filename is the basename, without .github/workflows/. If an environment constraint is configured on npm, it must match npm-publish. Configure that constraint when establishing the intended package publisher.

After the account configuration is verified/corrected, first check that version 1.6.0 remains unpublished. Run Publish ATP CLI on main with version 1.6.0 and dry_run=true to validate current code, then use the existing founder review gate for publication with dry_run=false. Verify npm version, provenance and fresh generated SDK 5 consumer afterward. Preserve the version if it remains unpublished.

## References

- https://docs.npmjs.com/trusted-publishers/
- https://github.com/actions/setup-node/blob/main/docs/advanced-usage.md

GitHub's setup-node documentation notes that trusted-publisher identity mismatches can produce E404 despite an existing package. npm documents exact case-sensitive repository, workflow and optional environment matching. The GitHub connector cannot inspect or edit npm account settings. This diagnosis does not report the account setting as corrected or the package as published.

## Resolved after npm account configuration

Larry completed the trusted-publisher configuration including Allow npm publish and authorized validation. Inspected current main and release activity first. Main and the failed run both used 9ad0772831ba1261cb7324337fd3c2dd9d01633c, incorporating Claude's merged #206 work. Version 1.6.0 was absent and no newer active starter publish was visible.

Reran the existing failed workflow, run 42167203210 attempt 2, job 127980536596. All steps passed, including the three tests, generated-project startup, pack inspection and npm publish. npm accepted create-atp-agent@1.6.0 at 2026-11-06T15:31:24Z. Registry metadata subsequently reported latest 1.6.0 and SLSA provenance at https://registry.npmjs.org/-/npm/v1/attestations/create-atp-agent@1.6.0 .

The standard tarball URL continued returning cached 404 responses in this environment after metadata propagation. A fresh query fetched the published tarball. Its SHA-1 8973ba81a4325e7bd08870beef5d0ddad741f319 matched the release logs. Installed that downloaded artifact into a fresh consumer, generated a project, installed its dependencies, confirmed atp-sdk@5.0.0 with npm ls and successfully ran npm start with Standalone: true. Standard version-based installation remained unverified due to the cached tarball response. The npm settings page validation badge was not inspected directly.

Execution used the existing merged release workflow. No release code or Claude branch changes were required. This update records evidence on the separate adoption branch.
