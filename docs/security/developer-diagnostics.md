# Voluntary Core developer diagnostics

This change is unpublished. It adds local counters to newly scaffolded agents and
successful CLI dependency installs, plus completion recording in the action-boundary
example. Existing installed CLIs and existing projects are unchanged.

## Consent and disable

Off by default. Enable for a command with `ATP_DIAGNOSTICS=1`; use
`ATP_DIAGNOSTICS=0` or unset it to disable. Disabled calls return before creating or
reading files. No events are transmitted and there is no hosted endpoint. Studio
analytics and hosted trust decisions are outside this path.

```sh
ATP_DIAGNOSTICS=1 npx create-atp-agent@<future-approved-version> my-agent --no-dashboard
cd my-agent
ATP_DIAGNOSTICS=1 npm start
```

The version placeholder is intentional: no release of this change is claimed.

## Data and definitions

Each JSONL record contains only `day` (UTC date) and `event` (fixed enumeration):

| Event | Definition |
| --- | --- |
| `install` | CLI's child `npm install` completed successfully; not a count of npm downloads or unique installations. |
| `first_run` | First successful generated `Agent.quickstart` observed in this local retained log; not unique developers. |
| `run_success` | Every successful generated `Agent.quickstart` invocation, including the first. |
| `example_completion` | All action-boundary demo assertions completed. |
| `error` | CLI dependency install failed, or generated starter quickstart threw; no error content recorded. |

No names, identifiers, keys, paths, prompts, stack traces, tool inputs/outputs,
IP addresses, or project contents enter the record. There is no background task.

Default file: `~/.atp/diagnostics/events.jsonl`. Override the parent directory with
`ATP_DIAGNOSTICS_DIR`. New directory/file modes are 0700/0600. Records older than
30 days are pruned on the next enabled write; inactive files remain until deleted.
Inspect with a text editor. Delete the diagnostics directory to erase the records.
Disabling stops collection but does not erase old records. Writes are best-effort;
concurrent processes can lose counts. This is not authoritative analytics.

## Weekly local view

From the repository, run `node scripts/diagnostics-report.mjs`. It reads only the
local file and prints a trailing seven UTC day view. It reports successful run
counts, completed examples, installs, errors, and days with successful runs.
Unique developers, recurring users, and top failure points are explicitly
unobserved. Zero records means no local observations, not zero ATP adoption.
No aggregate adoption claim or external publication is authorized by this change.

## Live Hermes gate

`hermes` is not installed in this execution environment. Hook fixture/subprocess
tests remain useful but cannot satisfy a live Hermes session. Before #160 closes,
record the actual Hermes version, documented consent configuration, real hook
output and allow/block outcomes, using a sanitized transcript. No model API keys,
paid calls, runtime installation, or fabricated live results are included here.
