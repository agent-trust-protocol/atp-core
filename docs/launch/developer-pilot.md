# Protect one agent tool: developer pilot

**Goal: five independent developers complete one protected tool action with ATP, then tell us whether the boundary is useful enough to keep.**

Start with Hermes users who already want to restrict file or terminal access. We are testing a narrow tool boundary, not asking them to adopt identity, credentials, every protocol draft, or ATP Studio.

## Try it

1. Use Node.js 20 or 24. [Run the five-minute local demo](../../examples/action-boundary/README.md).
2. [Run the Hermes hook walkthrough](../../examples/hermes-hook/README.md#reproduce-the-hook-decisions). This checks subprocess decisions, not Hermes execution.
3. [Run the pinned Hermes runtime verifier](../../examples/hermes-hook/README.md#verify-the-hermes-runtime). Confirm a real read and a blocked terminal call. Its provider selects scripted calls; it does not test autonomous model reasoning.
4. If useful, [configure a disposable Hermes profile](../../examples/hermes-hook/README.md#connect-a-live-hermes-profile), review and consent to the hook, and repeat the fixed read and terminal attempt. Keep your existing sandbox and permissions. Use test data.
5. [Report the result](https://github.com/agent-trust-protocol/atp-core/issues/new?template=developer-pilot.yml). A failed install is useful; do not wait until everything works.

The script is a demonstration of a fixed-file boundary. It does not authorize arbitrary paths or commands, verify signed mandates, implement remote revocation, or issue signed receipts. Closing the local demo session is not revoking a mandate.

## What counts as success

| Stage | Evidence | Counts toward the five? |
| --- | --- | --- |
| Started | Participant tried the documented setup | No |
| Installed | Dependencies installed; environment versions recorded | No |
| Hook contract passed | JavaScript subprocess walkthrough passed | No |
| Runtime probe passed | Pinned verifier returned the expected real read and terminal denial | Track separately |
| Protected action in participant's profile | Participant confirms the matched read executed, the terminal attempt was blocked, and its output file was absent | Yes, once per independent developer |
| Returned | Participant reports another protected run after at least seven days | Retention, tracked separately |
| Setup failed or abandoned | Step, error and elapsed time reported | Record as friction; keep in denominator |

As of October 26, 2026, **zero independent participant outcomes have been collected by this pilot**. Maintainer-generated evidence and automated tests do not count as participants. Do not infer users from npm requests, GitHub stars, CI runs, or repeated reports from one person.

## Feedback to collect

Use the [pilot issue form](https://github.com/agent-trust-protocol/atp-core/issues/new?template=developer-pilot.yml). Public reports should contain only:

- OS, Node/npm, Hermes commit/version, and ATP Core commit.
- Which stage was reached, approximate setup minutes, and whether help was needed.
- Whether the expected tool actually executed or was blocked; keep subprocess, runtime-verifier and own-profile results separate.
- First confusing step or error, using a short sanitized excerpt.
- The real tool/action they want to protect next and whether they would use the integration again.

No automatic telemetry is added. Do not request prompts, credentials, local filesystem paths, customer files, raw conversation logs, or personal contact details. Never publish someone else's name or testimonial without permission. Suspected vulnerabilities belong in the repository's private reporting process, not a public pilot issue; follow [SECURITY.md](../../SECURITY.md).

The maintainer can use anonymous participant IDs P01–P05 in a private tracker with these columns:

`participant_id, started_on, installed, hook_contract_passed, runtime_probe_passed, own_profile_protected_action, setup_minutes, assistance_needed, blocker, returned_after_7d, next_tool_requested`

Count activation as unique participants with an own-profile protected action divided by unique participants who started. Report the raw numerator and denominator alongside the percentage. Report median setup time for completed participants and list incomplete attempts separately. Measure seven-day return only among activated participants whose follow-up window has elapsed. Do not put a public participant roster in this repository.

## Maintainer sequence

- [x] Lead the README with a visible tool-control outcome.
- [x] Provide a short no-model local demo and a distinct Hermes hook walkthrough.
- [x] Surface the existing Hermes runtime verifier from security-readiness PR #170.
- [ ] Complete independent review and merge the onboarding changes.
- [ ] Review the published package release against the merged fail-closed fixes and outstanding security findings. A README update does not release code.
- [ ] Invite five suitable developers through approved channels; track actual starts and friction.
- [ ] Observe their setup without coaching first; record where help becomes necessary.
- [ ] Fix the first repeated setup failure before broadening the integration surface.
- [ ] Collect seven-day follow-up and decide whether to expand, simplify, or change the first use case.
- [ ] Publish the evidence-backed announcement after review. Keep signed-mandate revocation out of the claim until verified through the real enforcement path.

Research fixtures #172/#173 continue separately. They are not a prerequisite for learning whether developers can use this Hermes boundary. CLI #166 has its own release blockers; this pilot does not depend on the unpublished CLI. Security-readiness #170 and monitoring #171 still need their own review and release decisions; this pilot does not imply they are merged or released.

## Invitation draft — not sent

I'm looking for five developers using Hermes to try a small ATP integration. It lets Hermes read one test file while blocking terminal and write calls at the tool boundary.

The first walkthrough needs no model key. There is also a pinned Hermes runtime test, so you can check what actually executes. The scope and limitations are in the guide.

Try it and tell me where setup gets confusing, whether the block works in your profile, and which tool you would want to protect next. A failed setup helps us improve it too.

Guide: https://github.com/agent-trust-protocol/atp-core/tree/main/examples/hermes-hook

## Launch draft — not published

Your AI agent can call a tool. What checks the action before it runs?

ATP Core has a small Hermes example: one fixed-file read is allowed; terminal and write calls are blocked. Start with the local walkthrough, then verify a real Hermes read and terminal denial using a scripted local provider. No model API key is needed for either test.

This is a narrow policy boundary. It does not yet demonstrate signed-mandate revocation or a general filesystem sandbox. We're looking for five developers to try it in a test profile and tell us what works and what breaks.

Start here: https://github.com/agent-trust-protocol/atp-core#protect-one-tool-in-hermes

If it helps your project, a star helps you follow the work. A reproducible setup report helps us make it useful.
