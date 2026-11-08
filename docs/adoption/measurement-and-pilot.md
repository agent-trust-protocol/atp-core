# Learn what drives ATP adoption

## Reproduce the measurement

From the repository root:

```sh
python3 -m unittest discover -s tools/adoption -p 'test_*.py'
python3 tools/adoption/snapshot.py --end 2026-11-01 --output /tmp/atp-adoption-2026-11-01.json
```

Omit --end to use yesterday UTC. Archive each JSON snapshot with its retrieval timestamp in the existing reporting process; do not create a second scheduled reporting job. It contains original daily observations and source URLs, published release dates, and current/prior 7/30-day summaries for each package. Failed sources or missing dates fail the run; they never become zero downloads.

Compare the non-release daily mean AND median between equal windows. The exclusion covers each package's publication dates, not all release-related activity. Quiet dates still contain CI, bots, dependencies and repeated installs. Compare old and new snapshots for identical dates to identify backfill. Zero observations remain visible and potentially provisional. Report SDK downloads separately from the overlapping ecosystem sum. The internal target is 5,000 requests in a rolling 30 days; it is not verified OpenAI eligibility or a unique-user count.

## Trace discovery

Use one campaign per channel, for example:

- Tutorial: https://agenttrustprotocol.com/developers?utm_source=tutorial&utm_medium=guide&utm_campaign=hermes-pilot
- Community: https://agenttrustprotocol.com/developers?utm_source=community&utm_medium=post&utm_campaign=hermes-pilot

These are naming conventions, not installed analytics. Confirm the landing page works and its existing analytics records campaign parameters before distributing. Without that verification, use participant self-report; never infer attribution from the URL alone. Do not attach tracking to npm installation or add automatic SDK telemetry.

Add these optional questions to each participant's existing feedback report:

1. Where did you first find ATP? Community, tutorial, GitHub, npm, direct invitation, other, or prefer not to say.
2. Which guide or campaign code did you use? No private links or personal information.
3. What problem brought you here, and what nearly stopped setup?

## Run the five-person pilot

Use [the existing walkthrough and issue form](../launch/developer-pilot.md). Invite independent developers through channels Larry explicitly chooses. Prepared invitations are not sent invitations. Keep participant identities private and use anonymous IDs in a private tracker.

Record source, start date, environment, setup minutes, help needed, exact stage reached, own-profile read execution, terminal hook refusal, independent output-file absence, first friction, and next requested tool. An absent file alone is inconclusive. Retain failed starts in the denominator. Count each developer once; maintainer and automated results remain separate.

At least seven days after each activation, record whether another protected action was completed. An immature follow-up is pending, not failure. Report raw starts, activations and eligible returns. Fix the first repeated setup blocker before broadening the integration. Signed-mandate revocation remains a separate unproven runtime milestone.

## Update the existing OpenAI application evidence

Larry has tried three times. Establish the prior response or submission error before selecting a follow-up channel; do not submit duplicates automatically.

The current application asks for 500-character explanations. Draft factual text only after attaching dated evidence:

- Project: ATP Core, the public open-source foundation; distinguish commercial ATP Studio.
- Usage: dated per-package npm windows; overlapping combined requests disclosed; no unique-user claim.
- Maintenance: release history, reviewed fixes, tests and actual primary-maintainer responsibilities.
- Ecosystem contribution: public protocol work and reproducible integration evidence; no W3C endorsement or standardization claim.
- Credits: concrete use for PR review, regression reproduction, test maintenance and release validation for ATP Core.
- Participant evidence: actual completed independent integrations and seven-day returns, once available.

Official references checked in the parent analysis: https://openai.com/form/codex-for-oss/ and https://developers.openai.com/community/codex-for-oss . They describe discretionary selection; this plan does not treat 5,000 downloads as guaranteed qualification.
