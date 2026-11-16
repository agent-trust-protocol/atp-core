# atp-hermes-hook

A fail-closed [Hermes Agent](https://github.com/NousResearch/hermes-agent) `pre_tool_call` shell hook that enforces **Agent Trust Protocol (ATP)** security profiles at the tool boundary. Before Hermes runs a matched tool, the hook evaluates it against an [`atp-profiles`](https://www.npmjs.com/package/atp-profiles) profile and a path scope you configure, then lets the call through, blocks it, or sends it to Hermes' human-approval gate.

Requires Node.js 20 or newer. Want to see the decisions before changing Hermes settings? Start with the [local walkthrough](https://github.com/agent-trust-protocol/atp-core/tree/main/examples/hermes-hook), which runs the hook without starting Hermes or calling a model.

## One-command setup (macOS/Linux)

Requires Hermes on your PATH and Node.js 20 or newer. From any directory, run:

```bash
npx --yes atp-hermes-hook@0.2.1 setup
```

This creates an `atp-pilot` Hermes profile if needed, installs a fixed copy under
`~/.hermes/agent-hooks/atp`, and creates a `safe-default` policy that allows reads
only within a disposable test folder. Terminal, write and patch calls are blocked.
Every tool call is intercepted; unmapped tools, including `execute_code`, are blocked.
It runs standalone read/terminal/write and unmapped-tool decision checks, backs up the profile's
`config.yaml`, and merges a fail-closed hook while preserving other hooks and
settings. It does not install packages into your current directory.

Hermes runs the persistent local copy, with no `npx` network fetch per tool call.
Setup does not restart gateways, import OpenClaw data, configure a model/provider,
or bypass Hermes' first-use consent. If the new profile needs a provider, run
`hermes -p atp-pilot setup` and skip unrelated migrations and messaging setup.

Verify Hermes' wiring next:

```bash
hermes -p atp-pilot hooks test pre_tool_call --for-tool terminal
hermes -p atp-pilot chat
```

Review and approve the exact local hook when Hermes asks. Expect an ATP terminal
block in the hook test. Complete the [live tool-call check](../../examples/hermes-hook/README.md#check-blocking-in-your-own-test-profile)
using this installation's `test-files/atp-setup-fixture.txt` as the allowed file.
Standalone checks do not prove live enforcement or signed mandate verification.

To choose another profile and read scope:

```bash
npx --yes atp-hermes-hook@0.2.1 setup --hermes-profile my-test-profile --read /absolute/path/to/docs
```

`--read` may be repeated; it replaces the default test-folder read scope on first
setup. No write scope is granted. Custom or existing policies receive terminal and
write checks; the fixture read check runs only when the test folder is an explicit
read root. Profiles configured by setup share this installation's policy file;
use manual installation for different policies per profile. `--hermes-home` selects
a custom Hermes root. Setup rejects malformed YAML, preserves existing ATP policies,
and refuses to replace their read scope implicitly. Rerunning setup does not add
duplicate copies of the same command. Existing manually configured ATP commands
are preserved with other hooks; review them separately if migrating. Unmapped
tools are blocked, so features such as code execution, browser automation and
delegation are unavailable until explicitly mapped and reviewed. Use WSL on Windows.

### Upgrade from 0.2.0 or a manual four-tool matcher

The earlier `^(read_file|terminal|write_file|patch)$` matcher did not intercept
`execute_code`. A live pilot reported a blocked terminal call followed by a
successful Python subprocess through that alternate tool. The four-tool check
therefore did not establish execution containment. Re-run setup at 0.2.1 to
replace the installer's matcher with `.*`, or update your manual matcher below.
Upgrading the package alone does not update profile YAML. Restart the affected
CLI session (and deliberately restart any affected gateway) after configuration
changes. Verify both `terminal` and `execute_code` are blocked through Hermes.

To undo the YAML change, restore the exact backup path printed by setup. This
restores the whole pre-setup file, so preserve later configuration edits first.
Revoke consent with `hermes -p <profile> hooks revoke '<exact command>'` if needed.
Running gateways require a deliberate restart to pick up changes; setup never
restarts them. Package files and the ATP policy remain available for inspection
after a failed or undone setup.

## Manual install

Install it locally (not through `npx`) so Hermes runs a fixed, reviewed copy without a network fetch on every tool call:

```bash
mkdir -p ~/.hermes/agent-hooks/atp && cd ~/.hermes/agent-hooks/atp
npm init -y >/dev/null
npm install atp-hermes-hook
```

## Configure

Create `~/.hermes/agent-hooks/atp/atp-hermes.json`:

```json
{
  "profile": "safe-default",
  "state": "executing",
  "onApproval": "block",
  "paths": {
    "read": ["/home/me/projects/docs"],
    "write": []
  }
}
```

| Key | Default | Meaning |
| --- | --- | --- |
| `profile` | `safe-default` | A built-in `atp-profiles` profile: `safe-default`, `dev-mode`, `enterprise-locked`, `openclaw-sandbox`. Unknown names are a configuration error. |
| `state` | `executing` | ATP lifecycle state: `planning`, `executing`, `communicating`, `completed`. |
| `onApproval` | `block` | What to do when the profile says `require_approval`: `block`, or `escalate` to Hermes' approval gate. |
| `paths.read` | `[]` | Directories that read tools may access. Relative entries resolve against the config file's directory. |
| `paths.write` | `[]` | Directories that write tools may modify. These are also readable. |
| `tools` | see below | Map Hermes tool names to ATP actions; `null` removes a default. |

Check the file before using it:

```bash
./node_modules/.bin/atp-hermes-hook --check --config ./atp-hermes.json
```

Then add the hook to your Hermes profile's `config.yaml`, using absolute paths:

```yaml
hooks:
  pre_tool_call:
    - matcher: ".*"
      command: "/home/me/.hermes/agent-hooks/atp/node_modules/.bin/atp-hermes-hook --config /home/me/.hermes/agent-hooks/atp/atp-hermes.json"
      timeout: 10
      fail_closed: true
```

Hermes asks for consent the first time it sees this hook. Review the installed code before you approve it. Hermes keys consent on the exact command string, not the script's contents, so re-review after upgrading. Keep `fail_closed: true`.

Verify the hook in a test profile: [allow one test-file read and confirm that the terminal attempt is blocked](https://github.com/agent-trust-protocol/atp-core/blob/main/examples/hermes-hook/README.md#check-blocking-in-your-own-test-profile). If that helped you protect a tool action, [star ATP Core](https://github.com/agent-trust-protocol/atp-core) to follow the project. [Share your result or setup blocker](https://github.com/agent-trust-protocol/atp-core/blob/main/docs/launch/developer-pilot.md).

## Feedback and support

[Rate your setup experience](https://github.com/agent-trust-protocol/atp-core/blob/main/docs/package-feedback.md#hermes), leave a comment, or report a reproducible issue. Include `atp-hermes-hook`, its installed version, your runtime, and what you expected to happen. Remove secrets and private data from examples and logs. For vulnerabilities, follow the [private reporting guidance](https://github.com/agent-trust-protocol/atp-core/blob/main/SECURITY.md#reporting-a-vulnerability).

## How a call is decided

1. Anything that is not a `pre_tool_call` event, or a tool missing from `tools`, is **blocked**.
2. The tool's ATP category (for example `shell` or `filesystem`) is evaluated against the profile and state with `evaluateActionWithProfile`. A `deny` is **blocked**.
3. Filesystem tools must use a mode the profile permits (`safe-default` and `enterprise-locked` are read-only). Their path must also resolve, after following symlinks, to a location inside `paths`. Writes may create a new file only in an existing directory, and never through a dangling symlink.
4. A `require_approval` decision is **blocked**, or, with `"onApproval": "escalate"`, returned as `{"action": "approve"}`. Hermes then asks a human; denial, timeout or a gate error fails closed. The approval `rule_key` is `atp:<profile>:<tool>`, so an "always" answer covers every later call of that tool under that profile.
5. Otherwise the call proceeds (`{}`).

Every block writes `{"action":"block","message":"ATP: ..."}` and **exits with code 2**, which Hermes treats as a block even if `fail_closed` is missing. A missing or invalid configuration, unreadable input or an internal error also blocks.

### Default tool mapping

| Hermes tool | ATP category | Path argument |
| --- | --- | --- |
| `read_file` | `filesystem` (read) | `path` |
| `write_file` | `filesystem` (write) | `path` |
| `patch` | `filesystem` (write) | `path` |
| `terminal` | `shell` | — |

Every tool reaches this hook. To permit another tool, map it explicitly after
reviewing its capabilities. Do not map a general interpreter to a harmless
category: `execute_code` can run subprocesses and access files directly.
For example, to evaluate a network tool and remove the terminal mapping:

```json
{
  "tools": {
    "web_search": { "category": "network" },
    "terminal": null
  }
}
```

Removing `terminal` from `tools` while the matcher still matches it means every terminal call is blocked as unmapped.

## What this does not do

- It is a policy gate, not a sandbox. The path check and the tool's own file access are separate steps, so a concurrent change to the filesystem between them is not prevented. Keep Hermes' native permissions and sandbox, and protect the scoped directories from untrusted writers.
- Profile `network` domain lists, `shell.allowed_commands`, and the example `allowed_paths` inside built-in profiles are not enforced by this hook. Path scope comes only from this hook's `paths`.
- It does not verify identity, trust scores or mandates, and it does not write a signed audit log.
- Hermes shell hooks are trusted local code. Another hook or plugin can still affect execution.

## Library use

```js
import { loadConfig, decide } from 'atp-hermes-hook';

const config = loadConfig('/path/to/atp-hermes.json');
decide(config, { hook_event_name: 'pre_tool_call', tool_name: 'terminal', tool_input: { command: 'ls' } });
// { action: 'block', message: 'ATP: terminal requires approval under profile safe-default; approval escalation is disabled' }
```

## Verification

`npm test` covers configuration validation, path scoping (including symlink and traversal escapes), profile decisions and the binary's exit codes. `test/verify-live-hermes.py` runs a real Hermes `AIAgent` session, at a pinned Hermes commit, against a deterministic local provider. In that session an in-scope read executes, while terminal, write and out-of-scope read calls are blocked without running. CI runs it against the packed npm tarball. That shows runtime integration with scripted tool selection; it is not an evaluation of autonomous model behaviour.

## License

Apache-2.0. Part of [ATP Core](https://github.com/agent-trust-protocol/atp-core), the open developer foundation for Agent Trust Protocol.
