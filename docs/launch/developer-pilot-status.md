# Developer pilot implementation status — October 26, 2026

## Outcome

ATP Core's proposed entry path now explains a concrete tool boundary, links a real Hermes runtime verifier, and invites five developers to test it. This is an onboarding change, not an npm release or public campaign.

The verifier was brought forward from PR #170 so adoption work does not depend on merging the entire security-readiness change set. It adds assertion-optimization refusal and shell quoting for temporary paths. The existing hook and the published `atp-profiles@1.1.0` dependency are unchanged. Existing security review and release decisions remain separate.

## Local verification

Environment: Node.js 24.22.1, Python 3.14.8, uv 0.13.4, Hermes commit `55ee4acdd822b73fb9573a2321531ae3a9d0b3e0`. Hermes dependencies installed with `uv sync --frozen --python 3.14 --no-dev`. ATP example dependencies installed from their lockfiles with `npm ci --ignore-scripts`.

| Check | Result |
| --- | --- |
| Local action-boundary tests | 3/3 passed |
| Local action-boundary walkthrough | Read callback ran; shell, completed-session read and unknown tool callbacks did not run |
| Hermes hook tests | 3/3 passed |
| Hermes subprocess walkthrough | All four responses matched: fixed read passes; terminal, write and outside-file read block |
| Real Hermes AIAgent runtime | Fixture contents returned; terminal denied by hook; sentinel absent; consent allowlist persisted; conversation completed |
| Evidence | `hermes-runtime-evidence.json`; maintainer-produced, scripted local provider, three provider requests |
| Optimized Python guard | `python -O` exits nonzero before verification; assertions cannot be skipped |
| YAML and Markdown checks | Workflow/form YAML parses; local links resolve; whitespace check passes |
| Bypass negative control | In an isolated temporary copy, replacing the hook with unconditional `{}` made the runtime verifier fail on the expected terminal denial |

The runtime job added to `.github/workflows/hermes-hook-example.yml` repeats the pinned Hermes setup on Node 24. Its status must be checked after pushing; local success is not a GitHub Actions result. Existing subprocess CI still covers Node 20/24.

## Remaining work and acceptance gates

1. Review this onboarding PR and its GitHub checks. Do not merge on the basis of this local report alone.
2. Review the separate fail-closed/security release changes, and select the versioned package release. This PR does not publish packages or resolve #166/#170/#171.
3. Invite five suitable developers through authorized channels using the prepared draft. No invitations have been sent by this task.
4. Collect five independent own-profile protected-action results, including failed setup attempts in the starting cohort. Current confirmed participant outcomes: zero.
5. Follow up after seven days and improve the first repeated friction point.
6. Publish an evidence-backed announcement after release/claims review. Drafts remain in `developer-pilot.md`.

## Revocation milestone

Do not market this example as “allow, deny, revoke” yet. It currently demonstrates a local category/resource boundary and a separate session-state example.

A future revocation proof needs an authentic operator grant and trusted verification path, a permission/status change while the same agent session remains active, and a repeat of the previously allowed protected action. The next tool callback must not run; record grant identity/version, status observation, denial and execution outcome. Test stale/unavailable status handling and disclose the race between checking permission and committing a side effect. Do not claim atomic revocation without an atomic enforcement mechanism.

Synthetic fixtures in #172/#173 do not satisfy that runtime gate. They can continue as research while the narrow Hermes pilot tests developer demand. Keep ATP Core and ATP Studio infrastructure, credentials and evidence boundaries separate.
