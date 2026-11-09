# agent-trust-protocol

Install this convenience package if you want the available **Agent Trust Protocol (ATP)** Python packages together. Today it installs `atp-profiles`. If you only want the evaluator, install `atp-profiles` directly. Requires Python 3.9 or newer.

```bash
python -m pip install agent-trust-protocol
```

| Package | What it gives you | Status |
| --- | --- | --- |
| [`atp-profiles`](https://pypi.org/project/atp-profiles/) | Fail-closed security profiles: decide `allow`, `require_approval` or `deny` before an agent runs a tool | Available |
| `atp-sdk` | did:atp identity and hybrid Ed25519 + ML-DSA-65 signatures | Planned; not yet available for Python. The TypeScript [`atp-sdk`](https://www.npmjs.com/package/atp-sdk) is available today |

Import from `atp_profiles` and follow the [Python quickstart](https://pypi.org/project/atp-profiles/). The convenience package does not have its own Python import.

Not to be confused with the unrelated `atp-core` package on PyPI ("Attested Transport Protocol").

Apache-2.0. Source: [ATP Core](https://github.com/agent-trust-protocol/atp-core).
