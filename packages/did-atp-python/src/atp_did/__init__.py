"""Offline did:atp v2 primitives. A key binding is not proof of authority."""
import base64
import hashlib
import json
import re
from dataclasses import dataclass

ATP_ED25519_PUBLIC_KEY_BYTES = 32
ATP_ML_DSA_65_PUBLIC_KEY_BYTES = 1952
ATP_THUMBPRINT_LENGTH = 43
_E1 = re.compile(r'e1_[A-Za-z0-9_-]{43}', re.ASCII)
_PQ1 = re.compile(r'pq1_[A-Za-z0-9_-]{43}', re.ASCII)
_PATH = re.compile(r'[A-Za-z0-9._-]+', re.ASCII)
_DOMAIN = re.compile(r'(?=.{1,253}(%3[aA]|$))[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*(%3[aA][0-9]{1,5})?', re.ASCII)


def _matches(pattern, value):
    return isinstance(value, str) and pattern.fullmatch(value) is not None


def _bytes(value):
    if not isinstance(value, (bytes, bytearray, memoryview)):
        raise TypeError('Expected public-key bytes')
    return bytes(value)


def atp_base64_url(value):
    return base64.urlsafe_b64encode(_bytes(value)).rstrip(b'=').decode('ascii')


def atp_jwk_thumbprint(jwk):
    members = {'OKP': ('crv', 'kty', 'x'), 'AKP': ('alg', 'kty', 'pub'),
               'EC': ('crv', 'kty', 'x', 'y'), 'RSA': ('e', 'kty', 'n')}
    if not isinstance(jwk, dict) or not isinstance(jwk.get('kty'), str):
        raise ValueError('Invalid JWK: expected a supported public key type')
    required = members.get(jwk['kty'])
    if required is None:
        raise ValueError('Unsupported JWK key type')
    if any(not isinstance(jwk.get(k), str) or not jwk[k] for k in required):
        raise ValueError('Invalid JWK: missing or invalid public member')
    public = {k: jwk[k] for k in required}
    canonical = json.dumps(public, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    return atp_base64_url(hashlib.sha256(canonical).digest())


def atp_e1_fingerprint(public_key):
    key = _bytes(public_key)
    if len(key) != ATP_ED25519_PUBLIC_KEY_BYTES:
        raise ValueError('Expected 32 Ed25519 public-key bytes')
    return 'e1_' + atp_jwk_thumbprint({'crv': 'Ed25519', 'kty': 'OKP', 'x': atp_base64_url(key)})


def atp_pq1_fingerprint(public_key):
    key = _bytes(public_key)
    if len(key) != ATP_ML_DSA_65_PUBLIC_KEY_BYTES:
        raise ValueError('Expected 1952 ML-DSA-65 public-key bytes')
    return 'pq1_' + atp_jwk_thumbprint({'alg': 'ML-DSA-65', 'kty': 'AKP', 'pub': atp_base64_url(key)})


def _valid_segment(segment):
    return _matches(_PATH, segment) and not _matches(_E1, segment) and not _matches(_PQ1, segment)


def build_atp_v2_did(domain, path, ed25519_public_key, ml_dsa65_public_key):
    if not _matches(_DOMAIN, domain):
        raise ValueError('Invalid did:atp domain')
    if not isinstance(path, (list, tuple)) or not path or not all(_valid_segment(s) for s in path):
        raise ValueError('Expected at least one valid, unambiguous path segment')
    return ':'.join(('did', 'atp', domain, *path, atp_e1_fingerprint(ed25519_public_key),
                     atp_pq1_fingerprint(ml_dsa65_public_key)))


class AtpDidParseError(ValueError):
    """Stable syntax error code matching the TypeScript primitives."""
    def __init__(self, code, message):
        super().__init__(message)
        self.code = code


@dataclass(frozen=True)
class AtpV2PathDid:
    domain: str
    path: tuple
    e1: str
    pq1: str


def parse_atp_v2_path_did(did):
    if not isinstance(did, str) or not did.startswith('did:atp:'):
        raise AtpDidParseError('invalid_format', 'Expected a bare did:atp path identifier')
    parts = did[8:].split(':')
    if len(parts) < 4:
        raise AtpDidParseError('invalid_format', 'Expected domain, path and both bindings')
    domain, e1, pq1 = parts[0], parts[-2], parts[-1]
    path = parts[1:-2]
    if not _matches(_DOMAIN, domain):
        raise AtpDidParseError('invalid_domain', 'Invalid did:atp domain')
    if not _matches(_E1, e1) or not _matches(_PQ1, pq1):
        raise AtpDidParseError('invalid_bindings', 'Expected trailing e1_ and pq1_ fingerprints')
    if not all(_valid_segment(segment) for segment in path):
        raise AtpDidParseError('invalid_path', 'Invalid or ambiguous did:atp path')
    return AtpV2PathDid(domain, tuple(path), e1, pq1)


def is_atp_v2_path_did(value):
    try:
        parse_atp_v2_path_did(value)
        return True
    except AtpDidParseError:
        return False


def verify_atp_v2_key_bindings(did, ed25519_public_key, ml_dsa65_public_key):
    """Check fingerprints only; does not verify possession, signatures or permission."""
    parsed = parse_atp_v2_path_did(did)
    e1 = atp_e1_fingerprint(ed25519_public_key)
    pq1 = atp_pq1_fingerprint(ml_dsa65_public_key)
    return parsed.e1 == e1 and parsed.pq1 == pq1
