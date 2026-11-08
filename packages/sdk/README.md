# atp-sdk

### Identity, policy decisions and trust evidence for AI agents

[![npm](https://img.shields.io/npm/v/atp-sdk)](https://www.npmjs.com/package/atp-sdk) [![license](https://img.shields.io/npm/l/atp-sdk)](https://github.com/agent-trust-protocol/atp-core/blob/main/LICENSE) ![node](https://img.shields.io/node/v/atp-sdk)

AI agents now call tools, move data and act for people. Before an agent acts, the system around it should be able to answer three questions: **who is this agent, is this action allowed, and what evidence supports that?**

`atp-sdk` is the TypeScript/JavaScript SDK for **Agent Trust Protocol™ (ATP)**, an open trust layer that helps you answer them:

- **Identity:** `did:atp` agent identifiers backed by a hybrid **Ed25519 + ML-DSA-65** (post-quantum) key pair.
- **Policy decisions:** built-in security profiles return `allow`, `require_approval` or `deny` for each action. Unknown actions and missing profiles never quietly pass.
- **Trust evidence:** utilities for credentials, signed challenges and verification results that your application can check.

ATP is designed to work alongside MCP, A2A, ANP, ADK and agent frameworks rather than replace them.

## Quickstart

Requires Node.js 20 or newer. The package is ESM-only.

```bash
npm install atp-sdk
```

```js
import { Agent } from 'atp-sdk';

const agent = await Agent.quickstart('my-agent');
console.log(agent.getDID());       // did:atp:...
console.log(agent.isStandalone()); // true: no hosted service needed
```

This runs without a hosted ATP service. Standalone identity material is local and ephemeral by default, and the identifier is not publicly resolvable. Persist keys securely and connect the services and policies your application needs before relying on it for consequential actions.

Prefer a scaffold? Run `npx create-atp-agent my-agent` (see the [CLI guide](https://github.com/agent-trust-protocol/atp-core/blob/main/packages/create-atp-agent/README.md)).

## Decide before an agent acts

Map each host tool to an action category, ask a profile for a decision, and enforce the decision in your runtime:

```js
import { BUILTIN_PROFILES, evaluateActionWithProfile } from 'atp-sdk';

const toolCategory = { read_file: 'filesystem', terminal: 'shell', http_get: 'network' };
const profile = BUILTIN_PROFILES['safe-default'];

const { decision, reason } = evaluateActionWithProfile(profile, {
  actionType: toolCategory['terminal'],
  state: 'executing',
});

if (decision === 'allow') {
  // run the tool
} else if (decision === 'require_approval') {
  // pause and route to your approval flow; this result does not grant approval
} else {
  // deny: do not run the tool
}
console.log(decision, reason); // require_approval control_blocked
```

The evaluator fails closed:

| Input | Result |
| --- | --- |
| Unrecognized action, such as a typo like `Shell` or a raw tool name | `deny` (`unknown_action_type`). `dev-mode` returns `require_approval` instead. |
| Missing, empty or non-string action | `deny` in every profile |
| Missing or unknown profile, such as `BUILTIN_PROFILES['typo']` | `deny` (`unknown_profile`) |
| `ATPClient` with no profile configured | `deny` |

Built-in profiles: `safe-default`, `dev-mode`, `enterprise-locked` and `openclaw-sandbox`. See [`atp-profiles`](https://www.npmjs.com/package/atp-profiles) for what each one allows and how to write your own.

A decision is not enforcement. Your application or runtime must act on it, keep its own audit log and run its own approval flow. A trust score is evidence to evaluate, not a grant of authority by itself.

## Post-quantum identity primitives

```js
import { DidAtp } from 'atp-sdk';

const { did, keyPair } = await DidAtp.generate('example.com', ['agents', 'billing']);
console.log(did);                              // did:atp:example.com:agents:billing:...
console.log(keyPair.mlDsa65.publicKey.length); // 1952 (ML-DSA-65 public key bytes)
console.log(DidAtp.isValid(did));              // true
```

`CryptoUtils` provides `generateHybridKeyPair`, `signEd25519` / `verifyEd25519` and `signMlDsa65` / `verifyMlDsa65`. The canonical identifier format lives in [`@atpdeveloper/did-atp`](https://www.npmjs.com/package/@atpdeveloper/did-atp).

## Runnable examples

The package ships examples that need no ATP services:

```bash
cd node_modules/atp-sdk && npm run examples
```

They cover the standalone quickstart, local DID generation, multi-protocol detection, the hybrid signature demo and zero-knowledge challenge flows.

## Where to go next

| Goal | Start here |
| --- | --- |
| Profile schema, built-ins and custom profiles | [`atp-profiles`](https://www.npmjs.com/package/atp-profiles) |
| Canonical `did:atp` identifier primitives | [`@atpdeveloper/did-atp`](https://www.npmjs.com/package/@atpdeveloper/did-atp) |
| A host that enforces allow / approval / deny end to end | [Action-boundary demo](https://github.com/agent-trust-protocol/atp-core/tree/main/examples/action-boundary) |
| Upgrading from 3.x or earlier | [Migration guide](https://github.com/agent-trust-protocol/atp-core/blob/main/packages/sdk/docs/MIGRATION.md) and [CHANGELOG](https://github.com/agent-trust-protocol/atp-core/blob/main/packages/sdk/CHANGELOG.md) |
| Specification design and feedback | [W3C ATP Community Group drafts](https://w3c-cg.github.io/atp/specs/) |

## What's new in 4.0

- `evaluateActionWithProfile` is exported from `atp-sdk` directly.
- A missing or unknown profile returns `deny` instead of throwing.
- **Breaking:** `dev-mode` returns `require_approval` for unrecognized actions instead of `allow`, so no built-in profile now lets an unrecognized action through. To restore the old behaviour in local development, use `{ ...DEV_MODE_PROFILE, unknown_action: 'allow' }`.
- **Breaking:** Node.js 20 or newer is required. On Node.js 18 the identity code fails because `globalThis.crypto` is not available.
- `@atpdeveloper/did-atp` is pinned to `0.1.1`.

## Status and limits

- Security depends on more than the SDK: key storage, the verifier, issuer authority, status checks and the deployment around them.
- Some privacy and zero-knowledge examples are experimental. Do not treat structural proof checks as cryptographic range-proof verification.
- An adapter example does not make ATP dependent on that framework. OpenClaw is a legacy optional adapter.
- Package releases and Community Group drafts have separate lifecycles. The drafts are Community Group work, not W3C Standards, and are not endorsed by W3C. Passing the available conformance suites is not certification of every draft capability.

## Contribute

Try the quickstart, report a reproducible issue, improve an example or propose a conformance vector. See the [contribution guide](https://github.com/agent-trust-protocol/atp-core/blob/main/CONTRIBUTING.md) and the [ATP Core repository](https://github.com/agent-trust-protocol/atp-core). Implementation changes should include tests for the behaviour they add.

Agent Trust Protocol™ is a trademark of Sovr Inc. Licensed under Apache-2.0.

### DID resolver transport bounds (SDK 6.0 release candidate)

`DidAtpResolver.resolve(did, options)` and `fetchDidJson(url, options)` use
manual HTTPS redirects (at most five by default), a total 10-second transport
deadline, and a streaming 256 KiB response limit. The deadline covers redirects,
headers, and body delivery; it does not bound subsequent cryptographic document
verification. A response exceeding the cap is cancelled without retaining its
full body. Transport buffers and the chunk currently delivered can exceed the
retained-byte cap.

Options include `timeoutMs` (positive integer up to 2,147,483,647),
`maxRedirects` (integer 0–20), and a caller `signal: AbortSignal`. New stable
`DidResolutionError.code` values are `timeout`, `aborted`, and `redirectLimit`.
Existing error codes remain available. A custom `fetch` must honor manual
redirect mode and should honor the supplied signal; the resolver can bound its
own wait but cannot stop arbitrary external work in an override that ignores
cancellation. Its response must provide a standards-compatible byte stream.
Text-only response doubles need updating.

The resolver does not supply a private-address allowlist or connection-level
DNS-rebinding protection. Server-side deployments must enforce their own egress
policy. Cross-origin manual redirect behavior differs in browsers; the controlled
TLS fixture uses a Node HTTPS adapter and is not browser or native-fetch
interoperability certification. Deployment egress remains an open acceptance case in the specialization
evidence report. The path/destination candidate below covers NET-05.

### DID paths and redirect destinations (NET-05, SDK 6.0 release candidate)

The resolver rejects a DID-to-HTTPS mapping when URL processing changes its
hostname or pathname. This prevents literal `.` and `..` segments from silently
selecting another resource, rejects noncanonical numeric host aliases, and
reports invalid URL ports as `invalidDid`. Identifier construction and syntax
validation are unchanged: a syntactically valid identifier is not necessarily
safe to map to a network resource. Normal segments such as `.hidden`, `...`, and
`v1.0` remain supported, as do canonical IPv4 addresses and explicit dev ports.

Redirects now stay on the starting HTTPS origin by default. An origin means the
scheme, hostname, and effective port. This tightens the previous behavior that
followed arbitrary HTTPS redirects. For an intentional CDN or hosting migration,
configure additional origins explicitly:

```ts
const result = await DidAtpResolver.resolve(did, {
  allowedRedirectOrigins: ['https://identity-cdn.example'],
  timeoutMs: 10_000,
  maxRedirects: 5,
});
```

The allowlist is validated and copied before I/O; every hop must stay on the
initial origin or an explicitly listed origin. Entries are HTTPS origin URLs
with an optional trailing slash, without credentials, paths, queries, fragments,
or wildcards. An unlisted redirect fails with `destinationNotAllowed` before
its request is sent. Relative same-origin redirects still work. URL fragments
are removed before dispatch because they are not part of the HTTP resource.
Paths and queries on a permitted redirect origin are not separately restricted.

Origin permission does not replace the document-ID equality and hybrid-proof
checks in `resolve`. The lower-level `fetchDidJson` only fetches/parses a document
and should not be treated as identity verification. This origin policy also
does not validate resolved IP addresses or stop DNS rebinding; NET-06 remains
open and deployments must retain their own egress controls.

### Node server egress protection (NET-06, SDK 6.0 release candidate)

For server-side resolution of untrusted DIDs, select the Node-specific entry
point. It enables address checks and connection pinning by default:

```ts
import { resolveDidWithNodeEgress } from 'atp-sdk/node';

const result = await resolveDidWithNodeEgress(did, {
  timeoutMs: 10_000,
  allowedRedirectOrigins: ['https://identity-cdn.example'],
});
```

This is a new opt-in entry point. `DidAtpResolver.resolve` with its ordinary
fetch remains unchanged and does **not** gain address filtering automatically.
The new Node transport is not exported through the SDK's default root entry.
`createNodeDidFetch` is also available from `atp-sdk/node` for callers explicitly
composing it with the resolver; it is a GET-only adapter requiring manual
redirect mode, not a general-purpose replacement for fetch.

On every hop the transport resolves all final A/AAAA answers, rejects the entire
answer set if any address is disallowed, and selects one validated address. It
connects directly to that IP without a second hostname lookup, fallback, proxy,
or pooled socket. Certificate-chain verification stays enabled; TLS hostname
verification and the HTTP Host header use the original requested hostname.
Changed DNS answers on a later redirect are evaluated again before a connection.
The resolver's deadline covers DNS waiting, headers, and body delivery. A timed
out OS DNS lookup can finish in the background but cannot dispatch a late request.

The default address policy blocks private, loopback, link-local, shared,
multicast, reserved, documentation, and other special-purpose IPv4 space. IPv6
is restricted to 2000::/3 excluding the reviewed special-purpose ranges;
IPv4-mapped, NAT64, 6to4, and other transition/special prefixes are denied. The
policy is deliberately conservative and also excludes some globally reachable
special-purpose services. Azure's platform virtual IP 168.63.129.16 is denied.
This is a static reviewed policy, not a live routability or ownership service.

A private deployment can supply an explicit exception for an exact HTTPS origin
and individual IP addresses, together with its trust roots when required:

```ts
const result = await resolveDidWithNodeEgress(did, {
  egress: {
    privateAddressAllowlist: [
      { origin: 'https://identity.internal.example', addresses: ['10.20.30.40'] },
    ],
    ca: organizationCaPem,
  },
});
```

Exceptions are snapshotted, are empty by default, and do not allow other hosts,
ports, or addresses. Origin approval for redirects is separate from private-IP
permission. `ca`, when supplied, replaces Node's default trust roots; it never
disables verification. A trusted `resolveAddresses` override can be used for
controlled DNS environments; returned addresses are still checked and pinned.
The transport requests identity encoding and rejects compressed responses rather
than silently applying the body cap to compressed bytes. It limits response
headers to 16 KiB and does not follow redirects itself.

Production egress firewalls remain useful: an application cannot determine how
a network routes or translates even a public IP, and a static policy needs
maintenance as assignments change. Platform endpoints beyond the reviewed list,
DNS authenticity/availability, operating-system compromise, proxy-based routing,
native browser interoperability, and independent implementation conformance are
outside this candidate's evidence. The tests use controlled local TLS with
explicit per-origin loopback exceptions; those exceptions never become defaults.

Policy references reviewed 2026-11-08:

- [IANA IPv4 special-purpose registry](https://www.iana.org/assignments/iana-ipv4-special-registry/)
- [IANA IPv6 special-purpose registry](https://www.iana.org/assignments/iana-ipv6-special-registry/)
- [Azure platform virtual IP](https://learn.microsoft.com/en-us/azure/virtual-network/what-is-ip-address-168-63-129-16)
- [Node 20 HTTPS request and TLS options](https://nodejs.org/docs/latest-v20.x/api/https.html#httpsrequestoptions-callback)
