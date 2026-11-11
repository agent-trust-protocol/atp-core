# ATP package feedback and support

Tell us how setup went, what you were trying to build, and where you got stuck. A short comment helps us identify the next improvement. A reproducible bug report helps us test a fix.

## Choose your package

Use the package's poll to share a 1–5 setup rating and comments. GitHub hosts the feedback and requires sign-in to post. These are self-reported setup ratings. They do not measure unique users, npm downloads, or security assurance.

<a id="sdk"></a>

### `atp-sdk`

[Rate your setup experience](https://github.com/agent-trust-protocol/atp-core/discussions/230) · [Report a bug](https://github.com/agent-trust-protocol/atp-core/issues/new?template=bug_report.md&title=%5BBUG%5D%20atp-sdk%20)

Share your experience getting an agent running. Include the installed package version and your runtime.

<a id="starter"></a>

### `create-atp-agent`

[Rate your setup experience](https://github.com/agent-trust-protocol/atp-core/discussions/231) · [Report a bug](https://github.com/agent-trust-protocol/atp-core/issues/new?template=bug_report.md&title=%5BBUG%5D%20create-atp-agent%20)

Share your experience creating and running a starter project. Include the installed package version and your runtime.

<a id="did"></a>

### `@atpdeveloper/did-atp`

[Rate your setup experience](https://github.com/agent-trust-protocol/atp-core/discussions/232) · [Report a bug](https://github.com/agent-trust-protocol/atp-core/issues/new?template=bug_report.md&title=%5BBUG%5D%20%40atpdeveloper%2Fdid-atp%20)

Share your experience building and inspecting a DID. Include the installed package version and your runtime.

<a id="profiles"></a>

### `atp-profiles`

[Rate your setup experience](https://github.com/agent-trust-protocol/atp-core/discussions/233) · [Report a bug](https://github.com/agent-trust-protocol/atp-core/issues/new?template=bug_report.md&title=%5BBUG%5D%20atp-profiles%20)

Share your experience evaluating a tool action with a profile. Include the installed package version and your runtime.

<a id="hermes"></a>

### `atp-hermes-hook`

[Rate your setup experience](https://github.com/agent-trust-protocol/atp-core/discussions/234) · [Report a bug](https://github.com/agent-trust-protocol/atp-core/issues/new?template=bug_report.md&title=%5BBUG%5D%20atp-hermes-hook%20)

Share your experience configuring and checking a Hermes hook. Include the installed package version and your runtime.

<a id="cli"></a>

### `@atpdeveloper/atp-cli`

[Rate your setup experience](https://github.com/agent-trust-protocol/atp-core/discussions/235) · [Report a bug](https://github.com/agent-trust-protocol/atp-core/issues/new?template=bug_report.md&title=%5BBUG%5D%20%40atpdeveloper%2Fatp-cli%20)

Share your experience installing and using the ATP CLI. Include the installed package version and your runtime.

<a id="legacy-openclaw"></a>

### `@atpdevelopment/openclaw-atp`

[Rate your setup experience](https://github.com/agent-trust-protocol/atp-core/discussions/236) · [Report a bug](https://github.com/agent-trust-protocol/atp-core/issues/new?template=bug_report.md&title=%5BBUG%5D%20%40atpdevelopment%2Fopenclaw-atp%20)

This adapter is deprecated and archived. Use this route for migration blockers and feedback about the legacy package. Review the [migration guidance](https://github.com/agent-trust-protocol/atp-core/blob/main/archive/openclaw-atp/README.md) and include both the legacy version and the current package you are moving to. Maintenance of the archived adapter is discontinued.

## Questions and reproducible problems

- Ask setup or usage questions in [GitHub Q&A](https://github.com/agent-trust-protocol/atp-core/discussions/categories/q-a). Mention the exact package and version in the title or first paragraph.
- For a bug, include your install command, package manager, Node.js version, operating system, agent runtime version where relevant, and the smallest sanitized example that reproduces it. Show the expected result and actual error.
- If an existing issue describes your problem, add your environment and reproduction there. Link related feedback so the discussion and fix stay connected.
- Follow [private vulnerability reporting](https://github.com/agent-trust-protocol/atp-core/blob/main/SECURITY.md#reporting-a-vulnerability) for security concerns. Keep credentials, private keys, personal data, and private audit logs out of public feedback.

## Rating guide

| Rating | Setup experience |
| --- | --- |
| 1 | Could not get it working |
| 2 | Difficult |
| 3 | Manageable |
| 4 | Easy |
| 5 | Very easy |

Add the task you tried and the first point of friction. You can report a blocker without choosing a rating.

## Maintainer follow-through

1. Confirm the package, installed version, and reproduction. Ask for missing details in the same thread.
2. Route usage questions to Q&A and track reproducible bugs in Issues. Link a resulting bug from the feedback thread.
3. Link the fix or pull request and identify the first released version containing it. A merged pull request can still be waiting for publication to npm.
4. Ask the reporter to verify that version in their environment, then close the resolved issue with the result.

Community support is best effort. This workflow creates a public record for follow-up. A rating by itself does not open an automatic fix or notify every maintainer.

## Feedback channels

All seven package polls are live. Each poll accepts ratings and comments, with links to the bug report form, Q&A, and private vulnerability reporting. If you prefer structured feedback without voting, use the [package feedback form](https://github.com/agent-trust-protocol/atp-core/issues/new?template=package_feedback.md).

Replies to a poll notify its author through GitHub according to their notification settings. Maintainers should review reports and link each reproducible problem to its tracking issue.
