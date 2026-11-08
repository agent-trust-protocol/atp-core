# Adoption execution and ownership — November 3, 2026

This work starts at main adc9b9b. It does not modify existing Claude branches, SDK behavior, research fixtures, Studio, deployment settings, or release verification.

| Scope | Existing work | Handling |
| --- | --- | --- |
| Publish CLI workflow | #170 | Existing owner applies the two SDK checks below; adoption work does not edit this overlapping file. |
| Published-package verification | #178 | Preserve its assertions; refresh and review there. |
| Release/version policy | #184 | Preserve that PR; no competing policy rewrite. |
| Interactive CLI | #166 | Separate feature; this pilot uses the existing Hermes example. |
| Lab research | #172, #173, #175 | Preserve independent evidence and synthetic-source limitations. |
| Adoption measurement | tools/adoption | New isolated files in this PR. |
| Discovery and participant evidence | docs/adoption | Supplements existing pilot materials. |

Claude Code's unpublished local changes cannot be verified from this environment. This table establishes repository-visible boundaries, not a claim of coordination with an unseen session. Recheck open PR file lists before merging. No messages have been sent to contributors.

## Release-owner handoff

In `.github/workflows/npm-publish-cli.yml`, main still expects template dependency `^3.0.0` and queries `npm view atp-sdk@3.0.0 version`. The merged template expects `^4.0.0`. Change those two checks to `^4.0.0` and `atp-sdk@4.0.0` in the existing release/security workstream. Preserve action SHA pins if #170 updates them.

Run the workflow with version 1.5.0 and dry_run=true. Require package tests, a generated project's npm install/start, and pack inspection. Publish only after that reviewed gate passes. Verify npm reports 1.5.0 and repeat the installed consumer path. Nothing in this adoption PR publishes or certifies that release.

## Completion ledger

- Prepared: reproducible daily source snapshot, current/prior 7/30-day comparisons, release-date-excluded baseline, discovery and pilot capture, application update evidence checklist.
- Pending release owner: workflow fix, reviewed validation, npm publication.
- Pending participants: five independent own-profile outcomes and eligible seven-day returns. Maintainer or scripted runtime results never substitute.
- Pending application history: whether three prior attempts submitted, failed, or were rejected; no fourth submission is authorized by this plan.

## Starter validation — November 3, 2026

At main adc9b9b, applied the two SDK 4 checks in a detached local worktree. Node 24.22.1 and npm 11.9.0 validated the starter version and SDK range. The registry returned SDK 4.0.0. The clean install, two starter tests, and package dry run passed. A fresh generated project installed SDK 4.0.0 and reported `Standalone: true` on startup.

At the time of validation, #170 head 201b482 still targeted SDK 2.1 in its workflow and main targeted SDK 3. The release owner should reconcile the workflow against the SDK 4 starter on current main and run the GitHub Actions dry run before publication. These results cover the local build, package inspection and generated consumer, with hosted CI and publication pending.
