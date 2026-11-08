# did:atp specialization: evidence and next gates

Review date: 2026-11-08. Implementation baseline: ATP Core commit
`2639c0f7dfe303328e1350b7bd3b00de88a10834` (merged PR #212).

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

Eight existing suites passed, 142 tests total, on Node 24 using an existing local
root dependency installation. No tests or production code were changed in this
review. Reproduction with the repository's current CI Jest version:

```bash
npm ci --include=dev
npm test -- --runInBand --testPathPatterns '(did-atp-equivalence|did-v2|crypto-v2|did-vectors|did-pairwise|operations|resolver|did)\.test\.ts$'
```

The local cached Jest version used singular `--testPathPattern`; this is a
focused local result, not a new clean-install or full-repository CI run. PR #212's
merged commit separately passed all five recorded GitHub workflow runs. PR #213,
which prepares package 0.2.0, separately passed all six recorded PR workflow runs
at review time and remained open.

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
| G1: release | Merge PR #213 after review, pass main CI, publish 0.2.0 using trusted publishing. | Registry version, provenance, exact tarball integrity, and clean-consumer checks against the downloaded registry artifact. Currently pending. |
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
