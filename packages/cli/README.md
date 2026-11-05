# atp-cli

**Agent Trust Protocol (ATP) in your terminal.** Put ATP security profiles in front of the tools your AI agents call, starting with **Claude Code** and **Hermes Agent**. Manage a local `did:atp` identity and keep a signed audit trail of every decision.

```bash
npm install -g atp-cli
atp
```

Requires Node.js 20 or newer.

## The interactive shell

Run `atp` with no arguments for an interactive session, in the spirit of Claude Code. The welcome screen shows the ATP shield logo in colour beside your working directory, profile and identity. Narrow terminals, `NO_COLOR` and piped output get a plain text panel. Then you get `/` commands with Tab completion, persistent history, and a status line showing your profile, identity and audit count after every command.

```
❯ /profile check Bash
● ask  Bash → shell under safe-default (executing) · control_blocked
  safe-default · did:atp:localhost:agent · 12 audited
```

Every command also works directly (`atp profile check Bash`), as a one-shot (`atp -p "/profile check Bash"`), and with `--json` for scripts and CI.

## Guard Claude Code

```bash
atp guard install claude-code              # user settings (~/.claude/settings.json)
atp guard install claude-code --scope project --profile dev-mode
atp guard status
atp guard uninstall claude-code
```

This adds a `PreToolUse` hook that runs `atp` before Claude Code's `Bash`, `PowerShell`, `Read`, `Glob`, `Grep`, `Write`, `Edit`, `MultiEdit`, `NotebookEdit`, `WebFetch`, `WebSearch` and MCP (`mcp__*`) tool calls. Claude Code's own internal tools are not touched. Your other hooks and settings are preserved, and a backup is kept next to the settings file.

**ATP only tightens Claude Code; it never loosens it.**

| ATP decision | What the hook returns | Effect in Claude Code |
| --- | --- | --- |
| `allow` | nothing | Claude Code's normal permission flow decides |
| `require_approval` | `ask` | Claude Code asks you |
| `deny` | `deny` | the call is blocked |
| invalid input, settings error | exit code 2 | the call is blocked |

ATP never returns `allow`, because that would skip Claude Code's own permission prompt. When several hooks disagree, Claude Code applies the most restrictive answer, and its settings `deny` and `ask` rules still apply.

The installed command uses absolute paths to the current Node.js and `atp`. If you move or uninstall either, Claude Code treats the broken hook as a non-blocking error, so run `atp guard install claude-code` again after upgrading. `atp guard status` shows where the hook is installed.

## Guard Hermes Agent

```bash
atp guard install hermes --read ~/projects/docs
```

This writes `~/.atp/hermes-hook.json` and prints the `hooks:` block to add to your Hermes profile's `config.yaml`. Decisions come from the published [`atp-hermes-hook`](https://www.npmjs.com/package/atp-hermes-hook) package: fail-closed, path-scoped, and blocking with exit code 2. Each decision is also written to the ATP audit trail.

## Profiles

```bash
atp profile list
atp profile show safe-default
atp profile check Write --profile dev-mode
```

| Profile | Claude Code effect, in short |
| --- | --- |
| `safe-default` (default) | Reads and web fetches allowed; shell asks; **file writes denied**; unrecognised tools (MCP) denied |
| `dev-mode` | Shell, file and network tools allowed; unrecognised tools (MCP) ask |
| `enterprise-locked` | Reads allowed; shell and credentials denied |

Settings are layered like Claude Code's: `~/.atp/settings.json`, then `<project>/.atp/settings.json`.

```json
{ "profile": "dev-mode", "state": "executing", "tools": { "mcp__db__query": "network" } }
```

`tools` maps extra tool names to ATP categories (`shell`, `filesystem`, `network`, `credentials`, `messaging`). Mapping a tool to `null` removes a default mapping, so the tool falls to the profile's rule for unrecognised actions.

## Identity

```bash
atp identity create --name my-agent
atp identity show
```

This creates a `did:atp` identifier bound to a fresh hybrid Ed25519 + ML-DSA-65 key pair, using [`atp-sdk`](https://www.npmjs.com/package/atp-sdk). The keys are stored in `~/.atp/identity.json` with owner-only permissions (`0600`, in a `0700` directory). Secret keys are never printed. Back the file up privately. The identifier is local (`did:atp:localhost:...`) until you publish a DID document for it.

## Audit trail

```bash
atp audit            # recent decisions
atp audit verify     # check the whole chain and every signature
```

Every guard decision is appended to `~/.atp/audit.jsonl`. Each entry records the previous entry's hash. When an identity exists, each entry's hash is also signed with its Ed25519 key, and `audit verify` reports how many entries are signed.

What this proves, precisely:
- **Unsigned entries** only detect accidental corruption. Anyone who can write the file can recompute the hashes.
- **Signed entries** also detect edits by anyone without the identity's secret key.
- **Neither** prevents deleting the file or cutting off its most recent entries.

## Scope

A profile is a category and state gate, not a sandbox. It does not inspect command contents, paths (except in the Hermes guard) or domains, and it does not verify remote identities or mandates. Keep your agent's own permissions and sandbox in place.

## License

Apache-2.0. Part of [ATP Core](https://github.com/agent-trust-protocol/atp-core).
