# agent-trust-protocol

Installs the Python packages for **Agent Trust Protocol (ATP)**, the open trust layer for AI agents.

```bash
pip install agent-trust-protocol
```

| Package | What it gives you | Status |
| --- | --- | --- |
| [`atp-profiles`](https://pypi.org/project/atp-profiles/) | Fail-closed security profiles: decide `allow`, `require_approval` or `deny` before an agent runs a tool | Available |
| `atp-sdk` | did:atp identity and hybrid Ed25519 + ML-DSA-65 signatures | Planned; not yet available for Python. The TypeScript [`atp-sdk`](https://www.npmjs.com/package/atp-sdk) is available today |

Import the packages directly, for example `from atp_profiles import evaluate_action_with_profile`.

Not to be confused with the unrelated `atp-core` package on PyPI ("Attested Transport Protocol").

Apache-2.0. Source: [ATP Core](https://github.com/agent-trust-protocol/atp-core).
