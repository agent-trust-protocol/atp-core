# atp-hermes-hook

A fail-closed [Hermes Agent](https://github.com/NousResearch/hermes-agent) `pre_tool_call` shell hook that enforces **Agent Trust Protocol (ATP)** security profiles at the tool boundary. Before Hermes runs a matched tool, the hook evaluates it against an [`atp-profiles`](https://www.npmjs.com/package/atp-profiles) profile and a path scope you configure, then lets the call through, blocks it, or sends it to Hermes' human-approval gate.

Requires Node.js 20 or newer. Want to see the decisions before changing Hermes settings? Start with the [local walkthrough](https://github.com/agent-trust-protocol/atp-core/tree/main/examples/hermes-hook), which runs the hook without starting Hermes or calling a model.

## Install

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
    - matcher: "^(read_file|terminal|write_file|patch)$"
      command: "/home/me/.hermes/agent-hooks/atp/node_modules/.bin/atp-hermes-hook --config /home/me/.hermes/agent-hooks/atp/atp-hermes.json"
      timeout: 10
      fail_closed: true
```

Hermes asks for consent the first time it sees this hook. Review the installed code before you approve it. Hermes keys consent on the exact command string, not the script's contents, so re-review after upgrading. Keep `fail_closed: true`.

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

To cover more tools, map them and widen the Hermes `matcher` to match:

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
