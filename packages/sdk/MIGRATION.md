# Migrating from atp-sdk 1.x to 2.0.0

## did:atp v1 identifiers are not compatible with v2

**v1 format:** `did:atp:<network>:<fingerprint>` (e.g. `did:atp:mainnet:abc123…`)

**v2 format:** `did:atp:<host>[:<path>…]:e1_<thumbprint>:pq1_<thumbprint>`
(e.g. `did:atp:example.com:agents:alice:e1_…:pq1_…`)

Version 2.0.0 aligns the SDK with the finalized did:atp specification:

- The first segment is now a DNS host (did:web-style, with `%3A`-encoded port),
  not a network label like `mainnet`.
- The identifier carries **two** key fingerprints — `e1_` (Ed25519) and `pq1_`
  (ML-DSA-65) — each an RFC 7638 JWK SHA-256 thumbprint (43 base64url chars).
- The hybrid key pair is a split pair (`{ ed25519, mlDsa65 }`), not a composite
  blob; ML-DSA-65 signatures are 3309 bytes per FIPS 204.

## There is no conversion path

v1 fingerprints were not RFC 7638 JWK thumbprints, so a v1 identifier cannot be
rewritten into a valid v2 identifier. **v1 users must generate new identifiers**
with `DidAtp.generate()` (or `DidAtp.fromPublicKeys()` for existing key
material) and re-register. `DidAtp.parse()` rejects v1-form strings.
