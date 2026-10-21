# ATP Core remediation verification — 2026-10-21

Baseline: `c62a3629b17349ac81332ae45cb55be75c815af3`.
Runtime: Node 24.19.0. Local checks; GitHub workflow results must be reviewed
separately. No merge, npm publication, cloud change, live-target security probe,
or Studio access performed.

| Check | Result |
| --- | --- |
| Root unit suite | 51 suites, 1,094 tests pass |
| Root conformance | 510 tests across five items pass (overlaps other suites) |
| SDK build / tests after compatible lock updates | Build passes; 23 suites, 584 tests pass |
| OpenClaw build / tests after compatible lock updates | Build passes; 3 suites, 27 tests pass |
| Shared isolated package suite | 12 suites, 284 tests pass after aligning its Jest transforms/types/DID mapping with root CI |
| CLI build / tests | 3 tests pass, including disabled diagnostics, consent, fixed schema, retention and first-observation deduplication |
| CLI packed file inventory | dist/index.js, template/agent.mjs and template/diagnostics.mjs present |
| DID build / known-answer vectors | 2 tests pass |
| Profiles build / tests | 3 tests pass |
| Action-boundary demo / tests | All assertions pass; 3 tests pass; allow callback executes, approval-required/deny/unknown callbacks do not |
| Hermes hook example | 3 wire-format/subprocess tests pass; **not a live Hermes session** |
| Pinned published entry-point consumer | Pass on Node 24: SDK 2.2.1, CLI 1.3.3, DID 0.1.1, Profiles 1.1.0; quickstart, three decisions, scaffold, generated agent and onboarding PNG checked |
| Root typecheck / lint | Pass; lint has 0 errors and 288 warnings |
| Workflow SHA checker | Pass; all remote action references use 40-character commits |
| Package classification / lock presence | All 15 pass |
| Workflow YAML syntax / whitespace | Parse and git diff checks pass |
| Per-package npm audits | All 15 full and production graphs assessed; findings preserved in dependency-audit.json |
| Independent clean installs | CLI, DID, Profiles, SDK, OpenClaw pass. Nine additional private packages pass npm ci --ignore-scripts (Shared passed on retry). VC service received registry HTTP 403 for setimmediate. Native addon lifecycle scripts were not executed. |
| Node 18 / 20 local proof | Runtime bootstrap downloads rejected with HTTP 403; matrix added to GitHub workflow, pending runs |
| Actual Hermes runtime | Not installed; no live integration result claimed |
| Production site serving revision | Not checked or deployed in this task |
| Independent security review | Pending; issues remain open |

## Remaining release blockers

- Monitoring service sqlite3/tar critical dependency finding remains. Expanded CI
  intentionally blocks on it; do not bypass the critical gate to merge.
- Remaining high/moderate findings need scoped follow-up per dependency-triage.md.
- Supply-chain pinning freezes current upstream refs; independent action-content
  review and controlled release/deploy workflow verification remain required.
- Diagnostic counts are local observations, not organization-wide adoption. Recurring
  users and top failure points are unobserved; no telemetry is sent to a server.
- Cross-product central register update and independent approvals remain pending.
