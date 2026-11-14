"""Offline verification of SDK-compatible path DID documents.

No network, JSON-LD context fetching, freshness, revocation or authorization.
The caller must supply the expected DID independently of the document.
"""
import base64
import hashlib
import json
import re

import base58
import rfc8785

from . import atp_base64_url, parse_atp_v2_path_did, verify_atp_v2_key_bindings
from .crypto import PublicKeys, verify_ed25519, verify_ml_dsa65

MAX_DOCUMENT_BYTES = 65536
_CONTEXTS = {
    'https://www.w3.org/ns/did/v1',
    'https://w3id.org/security/data-integrity/v2',
    'https://w3id.org/security/multikey/v1',
    'https://w3id.org/security/jwk/v1',
}


class DocumentVerificationError(ValueError):
    """Untrusted input failed verification; no keys should be used."""
    code = 'invalid_did_document'


def _require(condition, message):
    if not condition:
        raise DocumentVerificationError(message)


def _object_pairs(pairs):
    result = {}
    for key, value in pairs:
        _require(key not in result, 'Duplicate JSON member')
        result[key] = value
    return result


def _b64(value):
    _require(isinstance(value, str) and re.fullmatch(r'[A-Za-z0-9_-]+', value),
             'Expected unpadded base64url')
    raw = base64.b64decode(value + '=' * (-len(value) % 4), altchars=b'-_', validate=True)
    _require(atp_base64_url(raw) == value, 'Noncanonical base64url')
    return raw


def _json(raw):
    # JCS uses ECMAScript binary64 numbers, including integer-looking tokens.
    return json.loads(raw, object_pairs_hook=_object_pairs, parse_int=float,
                      parse_constant=lambda _: _require(False, 'Nonfinite JSON number'))


def verify_did_document(expected_did, document_json):
    """Return immutable public keys only after BOTH bindings and proofs pass.

    Accept UTF-8 JSON bytes or text, at most 64 KiB. Requires the SDK's two
    authentication methods, eddsa-jcs-2022 and ML-DSA-65 JWS. Raises
    DocumentVerificationError on malformed or cryptographically invalid input.
    Optional crypto/document dependencies must be installed. A successful check
    does not prove domain control, current publication, freshness or permission.
    """
    try:
        parse_atp_v2_path_did(expected_did)
        _require(isinstance(document_json, (str, bytes)), 'Expected JSON text or bytes')
        raw = document_json.encode('utf-8') if isinstance(document_json, str) else document_json
        _require(len(raw) <= MAX_DOCUMENT_BYTES, 'DID document exceeds size limit')
        doc = _json(raw.decode('utf-8'))
        _require(isinstance(doc, dict) and doc.get('id') == expected_did,
                 'Document does not match requested DID')
        contexts = doc.get('@context')
        _require(isinstance(contexts, list) and all(isinstance(c, str) for c in contexts)
                 and _CONTEXTS.issubset(contexts), 'Missing required contexts')
        methods = doc.get('verificationMethod')
        _require(isinstance(methods, list) and len(methods) == 2
                 and all(isinstance(vm, dict) for vm in methods),
                 'Expected exactly two verification methods')
        ed_id, pq_id = expected_did + '#key-ed25519', expected_did + '#key-mldsa65'
        by_id = {vm.get('id'): vm for vm in methods}
        _require(set(by_id) == {ed_id, pq_id}, 'Invalid or duplicate method identifiers')
        ed_vm, pq_vm = by_id[ed_id], by_id[pq_id]
        _require(all(vm.get('controller') == expected_did for vm in methods),
                 'Method controller mismatch')
        auth = doc.get('authentication')
        _require(isinstance(auth, list) and len(auth) == 2 and set(auth) == {ed_id, pq_id},
                 'Both methods must be authentication references')
        _require(ed_vm.get('type') == 'Multikey' and pq_vm.get('type') == 'JsonWebKey',
                 'Unexpected verification method type')
        multibase = ed_vm.get('publicKeyMultibase')
        _require(isinstance(multibase, str) and multibase.startswith('z'), 'Expected base58btc Multikey')
        decoded = base58.b58decode(multibase[1:])
        _require('z' + base58.b58encode(decoded).decode('ascii') == multibase,
                 'Noncanonical Multikey encoding')
        _require(len(decoded) == 34 and decoded[:2] == b'\xed\x01', 'Invalid Ed25519 multicodec')
        jwk = pq_vm.get('publicKeyJwk')
        _require(isinstance(jwk, dict) and jwk.get('kty') == 'AKP'
                 and jwk.get('alg') == 'ML-DSA-65' and 'priv' not in jwk and 'd' not in jwk,
                 'Expected public ML-DSA-65 AKP key')
        keys = PublicKeys(decoded[2:], _b64(jwk.get('pub')))
        _require(verify_atp_v2_key_bindings(expected_did, keys.ed25519, keys.ml_dsa65),
                 'DID key binding mismatch')
        proof, pq_proof = doc.get('proof'), doc.get('atpPqProof')
        _require(isinstance(proof, dict) and isinstance(pq_proof, dict), 'Both proofs required')
        _require(proof.get('type') == 'DataIntegrityProof'
                 and proof.get('cryptosuite') == 'eddsa-jcs-2022'
                 and proof.get('verificationMethod') == ed_id
                 and proof.get('proofPurpose') == 'authentication'
                 and isinstance(proof.get('created'), str) and bool(proof['created']),
                 'Invalid classical proof configuration')
        _require(pq_proof.get('type') == 'AtpPqProof'
                 and pq_proof.get('verificationMethod') == pq_id
                 and pq_proof.get('proofPurpose') == 'authentication'
                 and pq_proof.get('created') == proof['created'], 'Invalid PQ proof configuration')
        unsigned = {k: v for k, v in doc.items() if k not in ('proof', 'atpPqProof')}
        canonical = rfc8785.dumps(unsigned)
        config = {k: v for k, v in proof.items() if k != 'proofValue'}
        config['@context'] = contexts
        hash_data = hashlib.sha256(rfc8785.dumps(config)).digest() + hashlib.sha256(canonical).digest()
        proof_value = proof.get('proofValue')
        _require(isinstance(proof_value, str) and proof_value.startswith('z'), 'Invalid classical signature encoding')
        _require(verify_ed25519(hash_data, base58.b58decode(proof_value[1:]), keys.ed25519),
                 'Classical signature failed')
        jws = pq_proof.get('jws')
        _require(isinstance(jws, str) and len(jws.split('.')) == 3, 'Invalid compact JWS')
        header, payload, signature = jws.split('.')
        _require(_json(_b64(header).decode('utf-8')) == {'alg': 'ML-DSA-65', 'typ': 'JOSE'},
                 'Unsupported JWS header')
        _require(_b64(payload) == canonical, 'JWS payload mismatch')
        _require(verify_ml_dsa65((header + '.' + payload).encode('ascii'), _b64(signature), keys.ml_dsa65),
                 'PQ signature failed')
        return keys
    except DocumentVerificationError:
        raise
    except (ValueError, TypeError, KeyError, RecursionError, OverflowError) as error:
        raise DocumentVerificationError('Malformed or unsupported DID document') from error
