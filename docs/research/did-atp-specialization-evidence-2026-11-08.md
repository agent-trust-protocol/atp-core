# did:atp specialization: evidence and next gates

Review date: 2026-11-08. Implementation baseline: ATP Core commit
`f73be0fdf0eb40c45feab54157721769431cb2b5` (merged PR #213, including #212).

## Decision

Continue the narrow identifier package release and SDK integration. Treat the
specialization case as a hypothesis supported by local implementation evidence,
with deployment and independent interoperability gates still open. No new DID
syntax, cryptographic scheme, executable resolver-module system, or authority
semantics is proposed by this review.

In plain English: the package creates and inspects an ID card tied to two keys.
The SDK additionally checks signed documents. Neither operation grants an agent
permission to act. A mandate verifier and an enforcing runtime remain separate.

## Colleague discussions and their limits

| Source | Position relevant to ATP | Engineering implication (our interpretation) |
| --- | --- | --- |
| [Amir Hameed, Credentials CG, 2026-01-26](https://lists.w3.org/Archives/Public/public-credentials/2026Jan/0119.html) | Advocated use-case-specific methods behind a common interface; proposed a Verified Encoder Model. | Explain the use case and keep the caller interface small. His proposed architecture and timelines are not evidence of adoption or group agreement. |
| [Kyle Den Hartog, Credentials CG, 2026-01-26](https://lists.w3.org/Archives/Public/public-credentials/2026Jan/0117.html) | Method-specific security and resolver complexity create maintenance and adoption costs. The message also quotes Manu Sporny's view that methods have different security models. | Expose predictable failures, publish the threat model, and measure integration cost. A shared document shape does not make methods interchangeable. |
| [Steve Capell, Credentials CG, archived 2026-02-22 UTC](https://lists.w3.org/Archives/Public/public-credentials/2026Feb/0283.html) | Technology-ecosystem-bound methods can burden business ecosystems with multiple integrations. | Compare ATP against existing-method profiles and preserve method-independent authorization boundaries. |
| [Daniel Hardman, DID WG, 2020-06-30](https://lists.w3.org/Archives/Public/public-did-wg/2020Jun/0067.html) | Relationship-specific identifiers can distribute key administration and limit risk; discovery and subsequent interaction need not use the same identifier. | Evaluate pairwise usage independently of the case for a new DID method. |

These are participant positions in public discussions, not endorsement of ATP,
consensus to adopt a new method, or a W3C Recommendation. Specializing a method
and using relationship-specific identifiers are distinct design choices.

## What is implemented and what the evidence establishes

Paths below are relative to the reviewed repository baseline.

| Capability | Evidence | Established scope | Remaining limit |
| --- | --- | --- | --- |
| Canonical construction and fingerprints | `packages/did-atp/src/index.ts`; `packages/did-atp/test/{vectors,hardening}.test.mjs` | Existing vectors retain their identifier bytes; required JWK members determine the thumbprint; new parser and dual-key comparison are available in source. | The package does not validate signatures, resolve a host, or prove key possession. Release 0.2.0 is separate from merging source. |
| Hybrid document verification | `packages/sdk/src/utils/did-document.ts`; SDK `utils/did.test.ts` and `utils/resolver.test.ts` | The SDK checks both identifier/key bindings and both document proofs; stripping the PQ proof or tampering causes rejection in local tests. | Same-project tests do not establish independent cryptographic interoperability or end-to-end quantum safety. |
| HTTPS resolution | `packages/sdk/src/utils/resolver.ts`; SDK `utils/resolver.test.ts` | URL mapping, document-ID equality, proof checks, insecure-URL rejection, and payload checks have local coverage. | Fetch is mocked in the resolver suite. No live independent HTTPS resolver interoperability was established here. |
| Rotation and deactivation | `packages/sdk/src/utils/did-document.ts`; SDK `utils/operations.test.ts` | Fresh binding keys create a new DID; old identifiers fail against the replacement document. Missing resources fail resolution. | No authenticated old-to-new continuity or recovery protocol is demonstrated. A missing resource cannot distinguish deactivation from outage or nonexistence. |
| Pairwise identifiers | `packages/sdk/src/utils/crypto.ts`; SDK `utils/did-pairwise.test.ts` | Domain-separated derivation is deterministic; different peers yield distinct paths and both key bindings in the tests. | Distinct outputs are not proof of system-wide unlinkability. Domain, host logs, network metadata, service endpoints, and credential reuse can correlate relationships. |
| Cross-package consistency | `packages/shared/src/identity/__tests__/did-atp-equivalence.test.ts`; SDK `utils/did-vectors.test.ts` | Existing SDK/shared construction agrees with known-answer fixtures. | The SDK has not yet migrated to the new standalone parser. External implementations require separate evidence. |

### Verification performed for this review

Eight existing suites passed, 142 tests total, on Node 24 after a clean root
lockfile installation using `npm ci --include=dev --ignore-scripts --no-audit
--no-fund`. Dependency lifecycle scripts were disabled; the focused suites do
not require native build outputs. No tests or production code were changed in
this review. Reproduction with the repository's current Jest version:

```bash
npm ci --include=dev --ignore-scripts --no-audit --no-fund
npm test -- --runInBand --testPathPatterns '(did-atp-equivalence|did-v2|crypto-v2|did-vectors|did-pairwise|operations|resolver|did)\.test\.ts$'
```

This clean-install run replaces the earlier cached-dependency qualification.
It is a focused result, not a full-repository local test run. The five GitHub
workflow runs on the #213 merge separately passed. At the review checkpoint,
#214 had five successful workflow runs and no review submissions, conversation
comments, or inline review threads. Passing automation is not independent human
review. npm's latest-version query still returned 0.1.1; merge of #213 did not
publish 0.2.0. These are timestamped observations, not continuously updated status.

## Is a specialized method necessary?

The distinctive implemented mechanism is an identifier containing fingerprints
of both binding keys, paired with mandatory dual-proof document verification in
the SDK. This makes either key substitution or proof removal locally testable.
Pairwise identifiers, signed documents, and authorization are broader patterns;
this review does not establish that another method plus a profile cannot supply
the required properties.

The comparison still needed is against an existing-method deployment with an
explicit hybrid verification profile. Hold the action, key material, attacker
capabilities, and required verifier behavior constant. Measure equivalent
security outcomes, extra integration code, failure behavior, document and
signature sizes, resolution latency, rotation disruption, and operating cost.
Do not infer superiority from different defaults or missing configuration in a
baseline. Define both configurations and publish fixtures before claiming a win.

## Next gates and completion evidence

| Gate | Work | Evidence required to close |
| --- | --- | --- |
| G1: release | PR #213 is merged and main CI passed; publish 0.2.0 using trusted publishing. | Registry version, provenance, exact tarball integrity, and clean-consumer checks against the downloaded registry artifact. Publication and registry verification remain pending. |
| G2: SDK adoption | Pin released 0.2.0 and delegate path parsing while preserving the SDK's root-DID, fragment, and null-on-invalid behavior. | Lockfile and package build plus positive/negative compatibility tests; malformed input cannot gain acceptance silently. |
| G3: network boundary | Review resolver transport and run controlled real-HTTP/TLS fixtures. | Reject unsafe redirect targets before following them; test hop limits, timeout/abort, incremental body limits, private-address/egress policy, and URL path normalization. These are evaluation requirements, not implemented claims. |
| G4: independent interoperability | Have a separately maintained implementation consume the fixed identifiers and signed documents. | Versioned producer/verifier matrix, exact fixture bytes, expected failures, tool versions, and independently posted output. Until then the result is same-project compatibility. |
| G5: lifecycle and privacy | Define continuity/recovery semantics separately from key replacement; test pairwise metadata exposure. | Rejection of unauthorized migration, stale keys and cached documents; documented outage/deactivation ambiguity and correlation threat model. |
| G6: specialization comparison | Compare the same threat model against an existing method plus a hybrid profile. | Reproducible results covering security outcomes and integration/operating costs; record tradeoffs and unresolved differences. |

Transport observations motivating G3 come from source review: `fetchDidJson`
follows redirects automatically and checks the final scheme afterward; its
actual-size limit is checked after `response.text()` buffers the body. There is
no built-in timeout in `ResolveOptions`. Thus the existing tests demonstrate
rejection outcomes, not prevention of every unsafe network request or bounded
memory use during receipt. These observations are not results of live exploit
tests. The review also leaves strict path-to-URL normalization for testing rather
than assuming identifier syntax validation protects the transport mapping.

## Position to use in future technical discussion

ATP has local implementation evidence for dual-key identifier binding and
mandatory dual-proof document checks. Its identifier package is intentionally
small, and authorization remains separate. We are preparing a versioned release
and seeking independent interoperability and lifecycle evidence before making
broader claims about specialization. Discussion of these properties does not
imply W3C standardization or endorsement.

## Concrete acceptance cases for the next implementation work

These are planned fixtures, not tests executed by this documentation review.
Use controlled loopback servers and generated test keys; no production service
or credential is required for the transport cases. Transport/privacy work can
proceed alongside release; SDK dependency adoption waits for the registry artifact.

| Case | Input or event | Required observable outcome |
| --- | --- | --- |
| SDK-01 | Existing root, path, pairwise, fragment-bearing, and invalid SDK input corpus | New delegation preserves old return values and errors at the public SDK boundary; a bare-path parser is not substituted for the whole SDK parser. |
| SDK-02 | Clean SDK install after pinning the published package | Installed dependency integrity matches the lockfile; package build resolves all new exports without monorepo source aliases. |
| NET-01 | HTTPS server redirects to HTTP | Resolver rejects the redirect before any request reaches the HTTP target; assert the target request counter remains zero. |
| NET-02 | Redirect loop or redirect chain beyond the configured hop limit | Resolver stops within its limit, reports a stable failure, and releases response resources. |
| NET-03 | Missing or false Content-Length with a response exceeding the byte cap | Resolver cancels the body while receiving it when the cap is exceeded; measure bytes consumed rather than only final rejection. |
| NET-04 | Server stalls before headers or during body delivery | Configured deadline aborts the operation and cleans up streams/listeners. Test both phases. |
| NET-05 | Identifier path contains dot segments or a redirect changes destination | Resolve URL normalization and destination policy explicitly before dispatch; tests demonstrate the approved resource is fetched. Do not silently change DID syntax in a transport fix. |
| NET-06 | A server-side caller resolves an attacker-selected host or redirect | Deployment egress policy is enforced on every hop, including resolved addresses; a localhost-enabled test policy must not become a production default. DNS rebinding resistance needs a connection-level design, not only hostname parsing. |
| LIFE-01 | Old DID, replacement keys, cached old document, or unavailable host | Keep key mismatch, current resolution, and historical verification distinct. Do not infer a signed migration or confirmed revocation from a replacement or 404. |
| PRIV-01 | Two peer-specific identifiers share a domain, service endpoint, or credential | Report those observable links; distinct keys alone cannot close the privacy gate. |
| INT-01 | Independent verifier consumes exact valid, tampered, and proof-stripped fixtures | Publish verifier identity/version and raw outcomes. A second wrapper around the same ATP implementation does not count as independent evidence. |
| CMP-01 | ATP and an existing method with an explicit hybrid profile face the same key-substitution and proof-stripping inputs | State both profiles, measure security outcomes and integration costs, and publish disagreements. A benefit or disadvantage remains an observation until reproduced. |

For each implemented fixture, record the case ID, commit, environment, command,
expected outcome, actual outcome, and evidence location. A gate closes only when
its required cases and evidence are complete. Do not convert this matrix into a
pass score based on how many rows have tests; an untested mandatory failure path
remains open.

## Follow-up: NET-01 through NET-04 implementation candidate

The resolver transport follow-up adds manual HTTPS redirects with a configurable
hop cap, a single transport deadline and caller abort signal, and incremental
byte accounting/cancellation at 256 KiB. The deadline covers transport, not the
subsequent cryptographic verification step. It rejects URL credentials and
cancels redirect/error bodies. New error codes are `redirectLimit`, `timeout`,
and `aborted`. Fetch overrides must support Response byte streams; text-only
doubles are no longer sufficient.

Evidence is in `packages/sdk/src/__tests__/utils/resolver-transport.test.ts` and
`resolver-https.test.ts`. The HTTPS suite generates a temporary certificate,
verifies it through a test-only Node HTTPS fetch adapter, uses loopback ports,
and checks that the HTTP downgrade target receives zero requests. It also
covers a redirect loop, a real chunked oversized body, and stalls before headers
and during the body. Test-only certificate trust is scoped to the fixture client;
TLS verification is not globally disabled. Deterministic byte-stream tests count
bytes consumed beyond the cap and confirm cancellation and reader-lock release.

These tests are same-project controlled transport evidence. They do not close
G3 as a whole: NET-05 path/destination policy and NET-06 deployment egress remain
open, as do native-fetch/browser interoperability, independent verification,
and the lifecycle/privacy/comparison gates. No package publication is performed
by the transport change.

Validation checkpoint for this implementation candidate (Node 24): the full SDK
suite passed 27 suites / 636 tests after a clean SDK lockfile installation with
dependency lifecycle scripts disabled. The focused root identity/transport run
separately passed 10 suites / 167 tests. These overlap and must not be added
together. The SDK TypeScript build passed. This is local candidate evidence;
GitHub CI and main-branch merge remain separate checkpoints.

## Follow-up: NET-05 path and destination implementation candidate

Building on merged PR #215, the next candidate checks the DID-to-URL mapping
before I/O and rejects hostname/pathname rewriting and invalid ports. Literal
dot segments can still be valid identifier syntax but are not resolved; no DID
grammar or key-fingerprint algorithm changes. Canonical IPv4, dev ports, and
ordinary dot-containing segment names remain usable.

Redirects default to the initial HTTPS origin. Additional origins require
`allowedRedirectOrigins`; the resolver snapshots the validated configuration
and checks each redirect target before issuing its request. Same-origin path
redirects remain possible; this is an origin policy, not a path allowlist or a
private-address filter. URL fragments are not sent. Full `resolve` still checks
that the returned document ID equals the requested DID before hybrid verification.

Evidence: `packages/sdk/src/__tests__/utils/resolver-destinations.test.ts` covers
normalization rejection with zero fetch calls, preserved valid mapping,
per-hop origin enforcement, configuration validation, an immutable in-flight
policy, and document mismatch after an approved origin redirect. The controlled
TLS fixture in `resolver-https.test.ts` counts requests at a second HTTPS origin:
zero when unlisted, one when explicitly allowed. It also checks an ordinary
relative same-origin redirect. Certificate verification remains enabled through
the test-only adapter described above.

This is local candidate evidence, not native-fetch/browser or independent
implementation certification. NET-06 egress/address binding, lifecycle/privacy,
and independent specialization comparison remain open. NET-05 implementation
requires successful PR review and CI before its main-branch checkpoint closes.

NET-05 local validation checkpoint (Node 24): clean SDK lockfile installation
with lifecycle scripts disabled; SDK TypeScript build; all 28 SDK suites / 670
tests; all five offline examples. The focused root identity/transport run
separately passed 11 suites / 200 tests; these overlap the SDK tests. The HTTPS
request counters and byte-stream cases are same-project evidence, not independent
certification. No package release or deployment is part of this candidate.

## Follow-up: NET-06 Node address enforcement candidate

The new `atp-sdk/node` entry point exposes `resolveDidWithNodeEgress`, which
selects a Node-only address-checking transport by default. The generic resolver's
default fetch is unchanged. This limits the claim to callers using the protected
Node entry point or explicitly composing `createNodeDidFetch`.

The transport validates every DNS answer, rejects mixed permitted/disallowed
sets, and pins one validated address directly into a fresh HTTPS connection.
There is no second hostname lookup, automatic fallback, connection pooling, or
proxy. The original hostname still controls TLS certificate verification, SNI
for DNS names, and HTTP Host. Each redirect repeats the address check, in addition
to NET-05's origin policy. Caller-approved private exceptions are scoped to an
exact HTTPS origin and explicit IP addresses, snapshotted, and absent by default.

`node-did-fetch.test.ts` covers the conservative address ranges and malformed
DNS/configuration cases. `node-did-egress.test.ts` exercises the production
transport on a local TLS server. It checks zero sockets for blocked destinations,
connection pinning with one DNS snapshot, changed-address rejection on a later
hop, private exception isolation, original-host certificate rejection, default
certificate trust, DNS cancellation, and stream/deadline cleanup. The valid
end-to-end case verifies a real hybrid-signed DID document through the protected
Node entry point. Local TLS uses explicit loopback exceptions and a test CA;
certificate verification is never disabled.

The address policy is static and conservative; README links the reviewed IANA
registries and Azure platform endpoint documentation. No claim is made about
arbitrary network routing/NAT, every platform-specific endpoint, DNS authenticity,
external interoperability, browsers, or independent review. G3's Node transport
cases now have an implementation candidate; broader deployment and independent
verification evidence remain separate. SDK parser migration and registry release
are not part of this transport change.

NET-06 local validation checkpoint (Node 24): clean SDK lockfile installation
with lifecycle scripts disabled; SDK TypeScript build; 30 SDK suites / 757 tests;
all six offline examples. The focused root identity/transport run separately
passed 13 suites / 285 tests (overlapping the SDK count). A packed SDK installed
in a clean consumer contained the Node JS/type exports and successfully ran the
public-subpath offline example, which blocked loopback. Late DNS answers after
timeout and injected fetch overrides of the protected entry point are covered.
No new runtime dependencies were added. PR/main CI, independent review, deployment
adoption of the protected entry point, and publication remain separate checkpoints.
