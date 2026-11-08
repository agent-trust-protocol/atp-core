# @atpdeveloper/did-atp
### Canonical identifier primitives for the open trust layer

```bash
npm install @atpdeveloper/did-atp
```

Use this package when you need to construct or inspect a `did:atp` identifier from already available public keys. It provides identifier and fingerprint primitives; it does not generate keys, host a resolver, issue credentials, or establish trust by itself.

Canonical **did:atp v2** identifier and key-fingerprint primitives — the single
source of truth for the did:atp method across all ATP packages.

The SDK (`atp-sdk`), `@atp/shared`, and the identity service delegate to
these primitives. Cross-package tests and the public vectors check alignment
with the [did:atp Community Group draft](https://github.com/w3c-cg/atp).

A path-type did:atp v2 identifier is:

```
did:atp:<domain>:<path...>:e1_<thumbprint>:pq1_<thumbprint>
```

where `e1_` is the RFC 7638 JWK thumbprint of the Ed25519 (OKP) binding key and
`pq1_` is the RFC 7638 JWK thumbprint of the ML-DSA-65 (AKP, RFC 9964) binding
key. Only SHA-256 (from `@noble/hashes`) is used — no new crypto primitives.

## Exports

| Symbol | Purpose |
|---|---|
| `atpBase64Url(bytes)` | base64url without padding (RFC 4648 §5) |
| `atpJwkThumbprint(jwk)` | RFC 7638 JWK thumbprint |
| `atpE1Fingerprint(ed25519PublicKey)` | `e1_` classical fingerprint |
| `atpPq1Fingerprint(mlDsa65PublicKey)` | `pq1_` post-quantum fingerprint |
| `buildAtpV2Did(domain, path, edPub, mlPub)` | construct a path-type did:atp v2 identifier |
| `ATP_E1_RE` / `ATP_PQ1_RE` / `ATP_PATH_SEGMENT_RE` / `ATP_DOMAIN_RE` | identifier ABNF anchors |
| `ATP_THUMBPRINT_LENGTH` / `ATP_ED25519_PUBLIC_KEY_BYTES` / `ATP_ML_DSA_65_PUBLIC_KEY_BYTES` | size constants |

## Build with us

Help test cross-package compatibility by contributing identifier vectors, parser edge cases, or draft feedback. See the [ATP Core contribution guide](../../CONTRIBUTING.md) and the [Community Group drafts](https://w3c-cg.github.io/atp/specs/). Community Group drafts are not W3C Standards.

## License

Apache-2.0

## Inspect and check a path identifier

```ts
import {
  parseAtpV2PathDid,
  isAtpV2PathDid,
  verifyAtpV2KeyBindings,
} from '@atpdeveloper/did-atp';

if (isAtpV2PathDid(candidate)) {
  const { domain, path } = parseAtpV2PathDid(candidate);
  const matches = verifyAtpV2KeyBindings(candidate, edPublicKey, mlPublicKey);
}
```

`parseAtpV2PathDid` accepts bare path-type v2 identifiers, including pairwise
path identifiers. It rejects root DIDs and DID URLs (fragments, queries, or
resource paths). It throws `AtpDidParseError` with a stable `code`:
`invalid_format`, `invalid_domain`, `invalid_path`, or `invalid_bindings`.
`isAtpV2PathDid` is a syntax-only type guard accepting unknown input.

`verifyAtpV2KeyBindings` returns false if either key differs. Malformed
identifiers and incorrect key sizes throw. Matching fingerprints does not
prove possession of private keys, validate signatures, establish current
credential or mandate status, or authorize execution. Those checks belong to
verifiers and enforcing runtimes.

The thumbprint helper selects only the required public members for OKP, AKP,
EC, and RSA keys, in lexicographic order. Optional metadata and private
members are ignored; missing or empty required members and unsupported key
types are rejected. This helper computes a thumbprint, not cryptographic key
validity. Existing ATP fingerprint vectors are unchanged. The base64url
implementation does not require Node's global `Buffer`.

These APIs are source additions pending a package release. SDK parser migration
must follow publication of a version containing them, with root-DID and
fragment behavior preserved. This change does not modify the DID method syntax,
add network resolution, or publish a package.
