# Published Hermes hook validation — November 5, 2026

Installed `atp-hermes-hook@0.1.0` into a clean npm consumer using `npm install --ignore-scripts`. Its configuration check passed. The installed binary allowed the scoped fixture read and blocked terminal, write, and an existing outside-scope `/etc/passwd` read with exit code 2.

Ran the repository runtime verifier against that installed npm binary using the pinned Hermes checkout below. The session completed, the fixture read executed, and terminal/write output files were absent. The runtime out-of-scope path was nonexistent, so that runtime case proves path-resolution refusal. The separate installed-binary probe covered an existing outside-scope file.

This evidence is maintainer-produced with deterministic tool selection. Independent pilot participation and autonomous model behavior remain unverified. Python was restored to 3.14.9 after workspace maintenance left the prior interpreter unavailable. The dependency lockfile was retained with `uv run --frozen --python 3.14 --no-dev`.

## Runtime evidence

```json
{
  "package": "0.1.0",
  "hermesCommit": "55ee4acdd822b73fb9573a2321531ae3a9d0b3e0",
  "python": "3.14.9",
  "mode": "actual Hermes AIAgent session; deterministic local provider; no autonomous model reasoning; no CLI gateway claim",
  "consent": "register_from_config accept_hooks=True in an isolated temporary profile; allowlist persisted",
  "hookOutputs": [
    {
      "tool": "read_file",
      "status": 0,
      "response": {}
    },
    {
      "tool": "terminal",
      "status": 2,
      "response": {
        "action": "block",
        "message": "ATP: terminal requires approval under profile safe-default; approval escalation is disabled"
      }
    },
    {
      "tool": "write_file",
      "status": 2,
      "response": {
        "action": "block",
        "message": "ATP: write_file needs filesystem write access, which profile safe-default does not permit"
      }
    },
    {
      "tool": "read_file",
      "status": 2,
      "response": {
        "action": "block",
        "message": "ATP: read_file path cannot be resolved"
      }
    }
  ],
  "inScopeReadExecuted": true,
  "terminalBlocked": true,
  "writeBlocked": true,
  "outOfScopeReadBlocked": true,
  "sentinelAbsent": true,
  "sessionCompleted": true,
  "providerRequests": 5
}
```

## Next participant step

Use the existing developer-pilot guide with a consenting independent Hermes developer. Record discovery source, setup minutes, actual read execution, terminal refusal and output-file absence in their own test profile. Track a return only after the seven-day eligibility window. This run contributes zero independent participant outcomes.
