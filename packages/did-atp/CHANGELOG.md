# Changelog

## 0.2.0

- Add bare path-type identifier parsing, a syntax-only type guard, stable parse
  error codes, and verification of both embedded public-key fingerprints.
- Compute JWK thumbprints from required public members only. Optional metadata
  and private members no longer change the result. Supported key types are OKP,
  AKP, EC, and RSA; unsupported types and missing or empty required members throw.
- Remove the base64url encoder's dependency on Node's global Buffer.
- Preserve the existing public ATP identifier and fingerprint vectors.

### Compatibility and rollout

The stricter thumbprint helper changes behavior for callers that previously
hashed optional metadata, arbitrary JSON, or malformed JWKs. Valid ATP binding
key inputs retain their fingerprints and identifiers. Thumbprinting does not
validate cryptographic key validity.

The parser accepts bare path identifiers, including pairwise path identifiers.
Root DIDs and DID URLs are outside this API. Existing SDK root-DID and fragment
behavior must be preserved when its parser is migrated after publication.

Key-binding checks do not prove key possession, check revocation, validate a
mandate, or authorize an action. No network resolver is introduced.

Release order: merge the release preparation, pass main CI, publish 0.2.0 using
the trusted publishing workflow, verify the registry tarball, then update SDK
imports and its pinned dependency with compatibility tests. The package version
is distinct from the did:atp v2 identifier syntax version.
