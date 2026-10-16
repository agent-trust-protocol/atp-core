# ATP at the Hermes tool boundary

This example connects the published `atp-profiles@1.1.0` evaluator to Hermes Agent's documented **shell `pre_tool_call`** protocol. Hermes sends JSON on stdin; the hook replies with a block directive or `{}`. A `read_file` of this directory's fixed `fixture.txt` proceeds. `terminal`, `write_file` and `patch` are blocked, as are unknown events. The hook never runs those tools itself.

```bash
cd examples/hermes-hook
npm ci
npm test
printf '{"hook_event_name":"pre_tool_call","tool_name":"terminal","tool_input":{"command":"echo hi"}}' | node atp-hook.mjs
```

## Reproduce the hook decisions

After `npm ci`, run `npm run demo`. It sends four events through the actual hook subprocess and asserts the returned JSON:

| Event | Expected hook response |
| --- | --- |
| Read the fixed fixture | `{}` (pass through) |
| Attempt terminal execution | `action: block` |
| Attempt a file write | `action: block` |
| Read outside the fixed fixture | `action: block` |

The walkthrough does not execute any of these tools or start Hermes. A nonzero exit means an expected response failed. This is an integration-contract reproduction, not evidence of live Hermes activation or signed mandate verification.

## Connect a live Hermes profile

To try it in a Hermes profile, put an **absolute path** to this installed script in the profile's `config.yaml`. Hermes requires first-use consent for shell hooks; approve this exact local hook after reviewing its code. Keep `fail_closed: true` so a failed, missing or timed-out script blocks the matched tool.

```yaml
hooks:
  pre_tool_call:
    - matcher: "^(read_file|terminal|write_file|patch)$"
      command: "node /absolute/path/to/atp-core/examples/hermes-hook/atp-hook.mjs"
      timeout: 10
      fail_closed: true
```

The matcher only covers these four Hermes tool names. Other tools are outside this example's scope; expand the matcher and map them explicitly before treating it as a wider gate. Run `hermes hooks test pre_tool_call --for-tool terminal` and a real Hermes session to confirm consent and blocking in your installed version. This repository test verifies Hermes' documented wire format with a subprocess; it does **not** exercise a live Hermes runtime.

The ATP profile is a category and state gate. The adapter adds the fixed file restriction; it does not provide a general filesystem sandbox, signed audit, identity or mandate verification, nor does it implement an approval workflow. Hermes shell hooks are trusted local code and a separate hook or plugin may affect execution. Preserve Hermes' native permissions and sandbox. This demonstration is for ATP Core, the open developer foundation; ATP Studio is a separate enterprise product.

Hermes protocol reference: [Event Hooks](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/hooks.md#shell-hooks).
