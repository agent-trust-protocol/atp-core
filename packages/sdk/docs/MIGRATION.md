# Migrating from SDK 5.x to 6.0

The stricter resolver defaults are intentional security boundaries.

- For planned HTTPS hosting/CDN redirects, list exact additional origins in
  `allowedRedirectOrigins`. Each redirect hop must stay on the original origin
  or this allowlist. Scheme, hostname, and effective port define an origin.
- Replace text/json-only fetch doubles with real Response byte streams. Fetch
  overrides must honor `redirect: 'manual'` and should honor AbortSignal.
- Configure `timeoutMs` (default 10,000) and `maxRedirects` (default five) for
  your deployment. The timeout covers transport, including DNS when using the
  protected Node entry point, not subsequent cryptographic verification.
- Stop resolving identifiers whose hostname/path is rewritten during URL
  processing. Identifier syntax itself has not changed.
- For server-side untrusted DID resolution, import `resolveDidWithNodeEgress`
  from `atp-sdk/node`. This entry point checks all DNS answers and connects to a
  validated IP. The generic resolver/global fetch is unchanged and does not
  automatically gain private-address filtering.
- Private Node deployments need exact-origin, explicit-IP exceptions and valid
  TLS trust. Review README before configuring those exceptions. TLS validation
  remains enabled; supplied CA roots replace Node's defaults.
- JWK thumbprints ignore optional metadata/private members and reject unsupported
  key types or missing required public members. Canonical ATP fingerprints and
  the SDK root/fragment/null-on-invalid parser behavior remain compatible.

Document identity, hybrid signatures, mandate authorization, and runtime
execution enforcement remain separate checks. A successful resolution alone
never grants permission to execute an action.

---

# Migration Guide

This guide documents notable changes and safe upgrade steps.

## v4.x → v5.0

- **`UniversalMonitor` / `SecurityEnforcer` fail closed.** The former event
  "signature" was an unkeyed SHA-256 digest that anyone could recompute; it is
  gone. With `enableSigning: true` (still the default) every event goes to the
  error channel with `Monitoring event signing is not implemented`.
  - Action: for unsigned diagnostics set `enableSigning: false`, and do not
    treat monitor events as signed or authenticated.
- **Monitoring events are unscored.** Protocol-name trust defaults are gone and
  a sender-supplied `trustScore` is dropped.
  - Action: compute trust from verified evidence outside the monitor.
- **`SecurityEnforcer.enforcePolicy` denies** whenever signatures, permissions or
  quantum-safe verification are required, or `minTrustLevel` is not `0`. Its
  `ALLOW` is a diagnostic-filter result, never an authorization grant.
  - Action: authorize with `evaluateActionWithProfile` and your own verifiers.
- **`Agent.mutualAuth()` is removed** (deprecated since 3.0).
  - Action: run the two explicit exchanges shown under v2.x → v3.0 below.
- **`IdentityClient.resolveDID()` is removed.** It returned the registry's
  unverified record, not DID resolution.
  - Action: use `DidAtpResolver.resolve()` for did:atp resolution, or
    `getRegistryRecord()` if you only want the registry's record.
- **`IdentityClient.rotateKeys()` is removed.** did:atp key rotation changes the
  DID, so it cannot be done in place through the registry.
  - Action: use `DidAtpDocument.rotate()` to produce the new DID and its
    dual-signed `did.json`, then register the new DID.

## v3.x → v4.0

- **Node.js 20 or newer is required.** Identity and key generation already
  failed on Node.js 18; `engines` now says so.
  - Action: run on Node.js 20 or 24.
- **`dev-mode` requires approval for unrecognized actions** (it allowed them).
  - Action: map host tool names to categories, or for a local-only profile use
    `{ ...DEV_MODE_PROFILE, unknown_action: 'allow' }`.
- **Missing profiles deny.** `evaluateActionWithProfile(undefined, ctx)` and
  lookups such as `BUILTIN_PROFILES['typo']` return `deny` with reason
  `unknown_profile` instead of throwing.
  - Action: none, unless you relied on catching the `TypeError`.
- `evaluateActionWithProfile` can be imported from `atp-sdk` directly.

## v2.x → v3.0

- **Unknown profile actions deny.** `evaluateActionWithProfile` returns `deny`
  (reason `unknown_action_type`) for any `actionType` that is not a control
  category (`shell`, `filesystem`, `network`, `credentials`, `messaging`) or
  named by the active state's policy.
  - Action: map host tool names to categories before evaluating, e.g.
    `{ terminal: 'shell', read_file: 'filesystem' }`. For a custom profile that
    must stay permissive, set `unknown_action: 'allow'` or `'require_approval'`.
- **No profile means deny.** `ATPClient.evaluateActionWithProfile()` returns
  `deny` when no profile is configured (it returned `allow`).
  - Action: pass `profileId` in the config or call `setProfile()` first.
- **`mutualAuth()` results start unverified** and the method is deprecated
  (removed in 5.0).
  - Action: replace with two exchanges:
    ```js
    const forBob = await alice.requestAuth(bob.getDID(), reqs);
    const aliceVerifiedBob = await alice.verifyAuthResponse(await bob.respondToChallenge(forBob));
    const forAlice = await bob.requestAuth(alice.getDID(), reqs);
    const bobVerifiedAlice = await bob.verifyAuthResponse(await alice.respondToChallenge(forAlice));
    ```
- **v1 identity and crypto helpers are gone** (removed in 2.0, still referenced
  by older guides): `DIDUtils.generateDID` → `DidAtp.generate(domain, path)`;
  `DIDUtils.parseDID` → `DidAtp.parse`; `CryptoUtils.generateKeyPair` →
  `CryptoUtils.generateHybridKeyPair`; `signData` / `verifySignature` →
  `signEd25519` + `signMlDsa65` / `verifyEd25519` + `verifyMlDsa65`.
  There is no payments client; payment types remain exported.

## v1.1.x → v1.1.x (Docs/Defaults Alignment)

- Package import name unified to `atp-sdk`.
  - Before: `@atp/sdk`
  - After: `atp-sdk`
  - Action: Update imports and mocks.

- Default Audit service port changed to `3005`.
  - Before: `ATP_AUDIT_URL` defaulted to `${baseUrl}:3006`
  - After: default is `${baseUrl}:3005`
  - Action: If you rely on envs, no change. If hardcoded, update URLs.

### Code changes that may affect you

- SDK metadata `SDK_INFO.name` now reports `atp-sdk`.
- No breaking API changes to exported classes/functions.

### Recommended checks

- Ensure services are reachable at the documented ports or override with env vars:
  - `ATP_GATEWAY_URL`, `ATP_IDENTITY_URL`, `ATP_CREDENTIALS_URL`, `ATP_PERMISSIONS_URL`, `ATP_AUDIT_URL`.
- Re-run your quickstart after upgrading:

```bash
npm install atp-sdk@latest
node -e "import('atp-sdk').then(async m=>{const a=await m.Agent.create('upgrade-check'); console.log(a.getName())})"
```

## Future (v1.2+)

- Additional protocol adapters may be added without breaking existing APIs.
- Any deprecations will be announced here with upgrade paths.
