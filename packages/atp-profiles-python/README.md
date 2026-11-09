# atp-profiles (Python)

Fail-closed security profiles for AI agents, from **Agent Trust Protocol (ATP)**. Before an agent runs a tool, map the tool to an action category (`shell`, `filesystem`, `network`, `credentials`, `messaging`) and ask the active profile whether the action is allowed, needs approval, or is denied.

This is the Python port of the [`atp-profiles`](https://www.npmjs.com/package/atp-profiles) npm package. The built-in profiles are generated from the TypeScript package. The evaluator is tested against the same shared conformance vectors, so both languages return the same decision and reason for the same input. Version numbers track the npm package whose behaviour this mirrors.

Not to be confused with the unrelated `atp-core` package on PyPI ("Attested Transport Protocol").

## Install

```bash
python -m pip install atp-profiles
```

Python 3.9 or newer. No dependencies.

## Use

Save this as `check_tool.py` and run `python check_tool.py`:

```python
from atp_profiles import BUILTIN_PROFILES, evaluate_action_with_profile

TOOL_CATEGORIES = {"terminal": "shell", "read_file": "filesystem", "http_get": "network"}

for tool_name in ("read_file", "terminal", "unmapped"):
    result = evaluate_action_with_profile(
        BUILTIN_PROFILES["safe-default"],
        {"actionType": TOOL_CATEGORIES.get(tool_name), "state": "executing"},
    )
    print(tool_name, result.decision)

# read_file allow
# terminal require_approval
# unmapped deny
```

Call the check at every tool boundary. Block both `deny` and `require_approval` unless your host has a real approval flow.

## API

- `evaluate_action_with_profile(profile, context)` returns a `ProfileEvaluationResult` with `allowed`, `decision` (`"allow" | "deny" | "require_approval"`) and `reason`. `to_dict()` gives the TypeScript JSON shape.
  - `context` uses the TypeScript keys: `actionType` (required), `state` or `sessionState`, and the externally verified `trustScore` (0 to 1) and `mandateVerified`. Those two must come from trusted verifiers, never from the agent or the tool call.
- `BUILTIN_PROFILES` is a read-only mapping of `safe-default`, `dev-mode`, `enterprise-locked` and `openclaw-sandbox`. Each is also available as a constant, such as `SAFE_DEFAULT_PROFILE`. A custom profile is a plain `dict` with the same schema.

## Fails closed

- A missing, unknown or malformed profile returns `deny` (reason `unknown_profile`) instead of raising.
- An `actionType` that is neither a control category nor named by the active state's policy returns `deny` (`unknown_action_type`). `dev-mode` returns `require_approval` instead.
- A missing or non-string `actionType` returns `deny`.
- Trust and mandate requirements deny unless a verified score or mandate is supplied.

## Scope

A profile is a category and state gate, not an operating-system sandbox. It does not inspect commands, paths or domains, verify identities, or write an audit log. Keep your runtime's own permissions and sandbox in place.

## Development

From the repository root:

```bash
cd packages/atp-profiles && npm ci && npm run build && node scripts/gen-conformance.mjs --check
cd ../atp-profiles-python && python -m unittest discover -s tests
```

`gen-conformance.mjs` regenerates `src/atp_profiles/builtin_profiles.json` and the shared vectors from the TypeScript package. CI fails if they drift.

## License

Apache-2.0. Part of [ATP Core](https://github.com/agent-trust-protocol/atp-core).
