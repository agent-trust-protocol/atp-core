# See an ATP action boundary work

Run a permitted fixture read, hold an approval-required callback, then deny a read after completing the session. The example uses the **published `atp-profiles@1.1.0` evaluator**, with a host wrapper that enforces its decision. No account, ATP server, model key or paid service is required.

```bash
git clone https://github.com/agent-trust-protocol/atp-core.git
cd atp-core/examples/action-boundary
npm ci
npm start
npm test
```

The output records four decisions: `allow`, `require_approval`, `deny`, `deny`. Only the first callback runs. The script asserts this and exits nonzero if the boundary fails. The shell attempt is a harmless sentinel; no shell command runs. The only file read is the fixed local fixture.

## Bring this pattern to your agent

Keep the registered callbacks, action categories and session state under host control. Invoke the boundary immediately before the protected operation. Accept only `allow`; `deny` and `require_approval` must not execute. An approval workflow needs its own trusted verification and a new decision. Keep existing sandbox and operating-system permissions.

The package evaluator is a category/state gate. It does not enforce file paths, modes, command allowlists or network domains. This example limits file access by exposing one fixed resource, not by claiming that the evaluator implements a filesystem sandbox. Do not attach a general-purpose shell, file or network tool without enforcing those controls in the adapter.

Session completion is **not mandate revocation**. This demo does not verify signatures, agent identity, issuer authority, credential status or mandate scope/expiry. In production, check those through trusted current verification before execution. Never trust `trustScore` or `mandateVerified` copied from incoming agent data. The JSON history is local diagnostic output, not a signed or tamper-proof audit log.

ATP Core is the open developer foundation. [ATP Studio](https://studio.agenttrustprotocol.com) is the separate enterprise product for managed operational controls. Community Group drafts are not W3C Standards.
