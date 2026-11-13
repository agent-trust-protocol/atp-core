# ATP DID primitives for Python (experimental)

Offline Python counterpart of `@atpdeveloper/did-atp`. The distribution name
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
signing. There is no network resolver, keystore, mandate verifier, sandbox or
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
