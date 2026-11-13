# ATP DID primitives for Python (experimental, unpublished)

Offline Python counterpart of `@atpdeveloper/did-atp`. The proposed distribution
name is `atp-did`; registry name availability and publication are not established.
Python 3.9+; no runtime dependencies. This is not the full Python identity SDK.

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
validity, trust, current status or authorization. There is no key generation,
signing, network resolver, keystore, mandate verifier, sandbox or host adapter.
No W3C certification or full SDK parity is claimed. Community Group drafts and
implementation releases have separate lifecycles.

Tests reuse the existing canonical vectors and shared malformed-identifier cases:

```sh
PYTHONPATH=packages/did-atp-python/src python -m unittest discover -s packages/did-atp-python/tests
npm ci --prefix packages/did-atp
npm test --prefix packages/did-atp
```
