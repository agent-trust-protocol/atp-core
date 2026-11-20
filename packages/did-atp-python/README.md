# ATP DID primitives for Python (experimental)

Python counterpart of `@atpdeveloper/did-atp`, with optional document verification
and public HTTPS retrieval in unreleased source. The distribution name
is `atp-did`; check PyPI for release availability. This module is experimental.
Python 3.9+ for base primitives; no base runtime dependencies. Optional signing
is experimental and currently exercised on Linux/Python 3.12. This is not the
full Python identity SDK.

From the repository root:

```sh
python -m pip install ./packages/did-atp-python
```

```python
from atp_did import build_atp_v2_did, parse_atp_v2_path_did, verify_atp_v2_key_bindings

# Format demonstration only. Supply real public keys in an application.
ed, pq = bytes(32), bytes(1952)
did = build_atp_v2_did('example.com', ['agents', 'demo'], ed, pq)
assert parse_atp_v2_path_did(did).path == ('agents', 'demo')
assert verify_atp_v2_key_bindings(did, ed, pq)
```

The public functions use snake_case equivalents of the TypeScript primitives:
`atp_base64_url`, `atp_jwk_thumbprint`, `atp_e1_fingerprint`,
`atp_pq1_fingerprint`, `build_atp_v2_did`, `parse_atp_v2_path_did`,
`is_atp_v2_path_did`, and `verify_atp_v2_key_bindings`.
Parsed results are immutable dataclasses, with a tuple path. Parse errors carry
`invalid_format`, `invalid_domain`, `invalid_path` or `invalid_bindings` in `code`.
Builders reject malformed inputs; binding checks throw on malformed DIDs/keys
and return false on a valid identifier with mismatching keys. JWK thumbprints
select required public members and ignore optional/private members.

A matching fingerprint does not prove key possession, cryptographic signature
validity, trust, current status or authorization. The base module has no key generation or
signing. Published 0.1.0 has no network resolver, production keystore, mandate verifier, sandbox or
host adapter. The optional crypto module below adds key generation and signing.
No W3C certification or full SDK parity is claimed. Community Group drafts and
implementation releases have separate lifecycles.

Tests reuse the existing canonical vectors and shared malformed-identifier cases:

```sh
PYTHONPATH=packages/did-atp-python/src python -m unittest discover -s packages/did-atp-python/tests
npm ci --prefix packages/did-atp
npm test --prefix packages/did-atp
```

## Optional signing (experimental)

```sh
python -m pip install './packages/did-atp-python[crypto]'
```

```python
from atp_did import build_atp_v2_did
from atp_did.crypto import generate_hybrid_key_pair, sign_hybrid, verify_hybrid

keys = generate_hybrid_key_pair()
did = build_atp_v2_did('example.com', ['agents', 'demo'],
                       keys.public_keys.ed25519, keys.public_keys.ml_dsa65)
message = b'example challenge bytes'
signature = sign_hybrid(message, keys)
assert verify_hybrid(message, signature, keys.public_keys)
assert not verify_hybrid(message + b'!', signature, keys.public_keys)
```

`sign_ed25519` / `verify_ed25519` and `sign_ml_dsa65` / `verify_ml_dsa65`
use raw key/signature bytes. Strings are encoded as UTF-8 without normalization;
objects are not implicitly JSON-serialized. Signing rejects bad key sizes;
verification returns false for malformed inputs or invalid signatures.
`verify_hybrid` requires BOTH signatures over identical bytes. Its dataclass
is a local helper, not a new interoperable ATP proof-envelope specification.
The SDK's individual algorithm methods are the interoperability reference.

Backends: cryptography (Ed25519) and pinned pqcrypto 0.3.4 (PQClean ML-DSA-65).
The latter is pinned because its tested API differs from pqcrypto 1.x. This is
pure ML-DSA with an empty FIPS 204 context, not a prehashed variant. Public keys
are 32/1952 bytes; signatures are 64/3309 bytes. No custom signature algorithm
is implemented. Backend error conditions are not a reason to downgrade.

Key generation uses backend cryptographic randomness. Secret fields are omitted
from repr, but raw keys remain in process memory: there is no secure keystore,
encrypted export, guaranteed zeroization or key rotation in this milestone.
Never log or persist the KeyPair. Callers must bind messages to their own
challenge, audience, action, nonce and expiry and enforce replay protection;
a valid signature alone grants no authority. No blanket adversarial equivalence
between Ed25519 backends or security certification is claimed.

The optional suite checks both directions against published `atp-sdk@6.0.2`,
using ephemeral random keys and public signatures only (no secret fixture files).
CI installs that version in an isolated temporary directory and sets
`ATP_SDK_MODULE` to its module URL, then runs with `ATP_TEST_CRYPTO=1`.
The base matrix still runs without optional dependencies. Broader crypto
platform/Python support must be verified before promotion or publication.

## Local encrypted key file and onboarding example

From the repository root, install the optional extra and run:

```sh
python -m pip install './packages/did-atp-python[crypto]'
python packages/did-atp-python/examples/local_identity.py ./my-agent.keys.json --domain example.com --agent demo
```

The example prompts for a passphrase (at least 16 characters), generates fresh
Ed25519 and ML-DSA-65 keys, creates an encrypted file with exclusive creation
and mode 0600, reloads it, builds the DID from its public keys and checks a
local signature round trip. It refuses to overwrite an existing file. Keep the
passphrase in a separate password manager; losing it loses access to the keys.
The example uses `example.com` as a format placeholder and does not register
or publish a DID, establish domain control, prove third-party trust, or grant
permission. Never commit the key file or use the demo challenge for a real request.

`atp_did.keyfile.save_key_file(path, key_pair, passphrase)` and
`load_key_file(path, passphrase)` use scrypt (N=131072, r=8, p=1) and
AES-256-GCM with random salt and nonce and a versioned authenticated envelope.
Reading rejects symlinks on supported Unix systems, group/world-accessible
files, oversized files, bad passphrases, tampering and mismatched key pairs.
This is application-level encryption, not OS keychain or HSM protection:
passphrases and raw secrets are present in process memory without guaranteed
zeroization, and host compromise can expose them. There is no key rotation,
recovery, migration, or cross-device synchronization. Use a managed keystore
for production deployments and design scoped challenge and replay checks
before using signatures for actions.

## Offline DID document verification (unreleased)

This source milestone adds the verification step needed before network
resolution. It is not included in the published `atp-did==0.1.0` artifact.
From this checkout:

```sh
python -m pip install './packages/did-atp-python[document]'
```

```python
from pathlib import Path
from atp_did.document import verify_did_document, DocumentVerificationError

# Obtain this DID from the relying application's trusted request context.
# Never let the document choose which DID you intended to check.
expected_did = 'did:atp:...'  # Replace with a complete path DID.
try:
    public_keys = verify_did_document(expected_did, Path('did.json').read_bytes())
except DocumentVerificationError:
    raise SystemExit('Reject identity document')
```

The verifier accepts at most 64 KiB of UTF-8 JSON and returns immutable
public keys only after the requested DID, both key fingerprints, authentication
references, Ed25519 Data Integrity proof and ML-DSA-65 JWS all pass. There is no
single-signature fallback. Duplicate JSON members, noncanonical key/signature
encodings and unsupported JWS headers are rejected. Canonicalization uses
RFC 8785 via `rfc8785`; JSON numbers are interpreted as IEEE-754 binary64 to
match the JavaScript reference. Use strings for exact large-integer data.
`base58` handles the SDK's multibase key and signature encoding.

This is a deliberately narrow profile of SDK-generated path DID documents:
exactly two methods with the SDK's `key-ed25519` and `key-mldsa65` fragments,
both listed in authentication, and both proof timestamps equal. This is stricter
than the SDK verifier's acceptance of arbitrary document shapes; it does not
claim support for every DID Core document or generic JSON-LD verification.
Contexts are checked as identifiers and never downloaded. The PQ proof's outer
metadata is not covered by its JWS; method, purpose and timestamp are therefore
constrained to the expected methods and classical signed timestamp.

A verified saved document can be old. Signature validity does not establish
current publication, domain control, a live agent, revocation status or action
permission. `created` is integrity-checked, not used as a freshness policy.
The verifier itself makes no network request. The optional resolver below adds
HTTPS retrieval; challenge expiry/replay storage and mandate authorization remain
separate work.

Run the installed-wheel suite with `ATP_TEST_CRYPTO=1 ATP_TEST_DOCUMENT=1` and
`ATP_SDK_MODULE` pointing to published `atp-sdk@6.0.2`. It uses ephemeral
SDK-signed documents with Unicode and numeric service data, then tests tampered
proofs, keys, metadata, document IDs, JSON and JWS headers.

## Public HTTPS resolution (unreleased)

The same source-only `[document]` extra enables the resolver; no additional
network dependency is required. This API is not in PyPI version 0.1.0.

```python
from atp_did.resolver import resolve_did, DidResolutionError

try:
    identity = resolve_did(expected_did, timeout=10, max_redirects=3)
except DidResolutionError as error:
    print(error.code)  # Reject the identity; never fall back to one signature.
else:
    print(identity.did, identity.document_url)
    # identity.public_keys is immutable and has passed both document proofs.
```

`did_document_url(did)` maps a bound path DID to
`https://<domain>/<path>/did.json`; encoded domain ports are supported. It makes
no network request. Root/unbound identifiers, invalid ports, dot path segments
and URLs longer than 8 KiB are refused. `resolve_did` fetches that URL and verifies the exact requested DID
using the preceding offline verifier before returning immutable public keys.
`document_url` is the initial DID-derived URL; redirects do not alter the DID.

Retrieval policy:

- TLS certificates and hostnames use Python's default trusted certificate store.
- Every DNS answer must be a public unicast address. Private, loopback,
  link-local, reserved, multicast and IPv4-mapped private addresses are blocked.
  Connections use the checked numeric address with the original TLS hostname,
  preventing a second DNS lookup from changing the destination.
- Only same-origin HTTPS redirects are accepted, at most three by default
  (configurable from zero to five). Each hop resolves and checks DNS again.
  URL credentials, query strings, fragments, backslashes and whitespace are
  rejected. No browser cookies, authorization headers or environment proxies
  are sent. There is no private-network or certificate-verification bypass.
- Responses must be HTTP 200 and uncompressed. Both advertised and actual
  bodies are bounded to 64 KiB, matching the document verifier. Ambiguous
  framing, truncated bodies, invalid JSON and either invalid proof fail closed.
- A short-lived isolated Python interpreter performs transport. The parent
  terminates and reaps it when the deadline expires, including DNS, TLS,
  redirects and stalled headers/body reads. The timeout defaults to 10 seconds
  (greater than zero and at most 60); process creation overhead and subsequent
  cryptographic verification are outside that budget. No shell is invoked.

This strict transport currently tries the first validated DNS address and does
not retry other addresses or cache results. Process creation adds overhead and
requires a normal Python runtime that permits subprocesses; this is not an
in-process async or high-throughput resolver. The tested crypto/resolution target
remains Linux/Python 3.12. Network tests use mocked sockets/responses, a real
isolated-worker private-IP rejection, and a real deadline-terminated process;
they do not claim a successful live public DID deployment.

Stable failure codes are `invalid_did`, `insecure_url`,
`destination_not_allowed`, `redirect_limit`, `not_found`, `invalid_response`,
`response_too_large`, `transport_failed`, `timeout` and `verification_failed`.
Invalid timeout/redirect configuration raises `ValueError` before launching
transport. A TLS failure is `transport_failed`, never a reason to retry without
certificate validation.

Successful retrieval and signatures do not prove who owns the domain or grant
permission for an action. There is no cache-based revocation guarantee or
challenge-response protocol here. Next is a scoped, expiring challenge with
atomic one-time consumption, then a separately tested mandate authorization
boundary.
