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
