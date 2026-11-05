# First independent Hermes hook pilot

Use `atp-hermes-hook@0.1.0` with Node 20+ and a Hermes test profile. Start a timer before installation. Record failures and help required.

## Install and configure

Follow the [published hook installation and configuration](https://github.com/agent-trust-protocol/atp-core/tree/main/packages/hermes-hook#install), installing the explicit version with `npm install atp-hermes-hook@0.1.0`. Configure `safe-default`, `state: executing`, `onApproval: block`, one test directory in `paths.read`, and an empty `paths.write`. Run the documented `--check`. Set the absolute installed binary/config paths in the test profile's `pre_tool_call` hook and enable `fail_closed: true`. Review the hook and accept consent in Hermes.

On a POSIX host, prepare the following outside Hermes. Keep the directory path locally for the requests below.

```sh
pilot_dir="$(mktemp -d)"
printf 'ATP pilot fixture\n' > "$pilot_dir/notes.txt"
printf '%s\n' "$pilot_dir"
```

Use the printed directory in `paths.read`. Replace `ABSOLUTE_PILOT_DIR` below with it. The terminal target must start absent. Verify that outside Hermes before proceeding.

## Run through Hermes

1. Ask Hermes to use `read_file` on `ABSOLUTE_PILOT_DIR/notes.txt`. Confirm the tool executes and returns `ATP pilot fixture`.
2. Ask Hermes to use `terminal` to run `printf blocked > ABSOLUTE_PILOT_DIR/terminal-must-not-run`. Require an actual tool attempt and the ATP hook refusal. A model declining without attempting the call leaves this step unverified.
3. Ask Hermes to use `write_file` to write `blocked` to `ABSOLUTE_PILOT_DIR/write-must-not-run.txt`. Require the tool attempt and ATP hook refusal.
4. Outside Hermes, use the host shell to check both targets.

```sh
if [ ! -e "$pilot_dir/terminal-must-not-run" ] && [ ! -e "$pilot_dir/write-must-not-run.txt" ]; then
  echo 'Output files absent'
else
  echo 'FAIL: an attempted output file exists'
fi
```

Keep this check in the same shell that created `pilot_dir`. File absence supports the observed hook refusals. Record any failed or inconclusive step with its actual result.

## Report

Use the [existing pilot feedback form](https://github.com/agent-trust-protocol/atp-core/issues/new?template=developer-pilot.yml). Add the following optional discovery details in the feedback text.

- Discovery source, such as GitHub, npm, tutorial, community or invitation.
- Guide/campaign identifier, if known.
- OS, Node/npm, Hermes version and installed hook version.
- Setup minutes, help required and first confusing step.
- Read execution, terminal refusal, write refusal and independent file checks.
- Whether the integration solves a real problem and which tool to protect next.

Use sanitized excerpts. Keep personal paths, credentials and private data out of the public issue. The maintainer assigns an anonymous participant ID in the private tracker after an actual start. Invite the participant to report another protected action at least seven days after their first success. Track that return only once the observation window has elapsed.

## Invitation text for Larry to send

Would you try ATP's published Hermes hook in a test profile? It allows reads inside a directory you choose and blocks terminal and write calls under safe-default. We're gathering the first five independent developer results. Please record setup time, where you found ATP, anything confusing, and whether the expected calls execute or block. Failed setup attempts help us improve the guide too.

Installation guide: https://github.com/agent-trust-protocol/atp-core/tree/main/packages/hermes-hook

Feedback: https://github.com/agent-trust-protocol/atp-core/issues/new?template=developer-pilot.yml

## Status

Prepared November 5, 2026. GitHub search found zero issues with `[Pilot]` in the title. That search does not establish whether private volunteers exist. A participant and delivery channel still need to be selected. The maintainer-run published-package verification is recorded separately in this PR.
