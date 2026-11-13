"""Optional signing primitives; raw signatures do not establish authorization.

Pure ML-DSA-65 uses the empty FIPS 204 context, matching atp-sdk 6.0.2.
No key serialization, persistence, algorithm guessing or single-key fallback.
"""
from dataclasses import dataclass, field
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
from cryptography.hazmat.primitives import serialization
from pqcrypto.sign import ml_dsa_65
from . import _bytes


@dataclass(frozen=True)
class PublicKeys:
    ed25519: bytes
    ml_dsa65: bytes


@dataclass(frozen=True)
class KeyPair:
    public_keys: PublicKeys
    ed25519_secret: bytes = field(repr=False)
    ml_dsa65_secret: bytes = field(repr=False)


@dataclass(frozen=True)
class HybridSignature:
    ed25519: bytes
    ml_dsa65: bytes


def _sized(value, length):
    raw = _bytes(value)
    if len(raw) != length:
        raise ValueError('Invalid key or signature length: expected %d bytes' % length)
    return raw


def _message(data):
    return data.encode('utf-8') if isinstance(data, str) else _bytes(data)


def generate_hybrid_key_pair():
    """Generate independent keys with the cryptographic backends' OS randomness."""
    ed = Ed25519PrivateKey.generate()
    pq_public, pq_secret = ml_dsa_65.generate_keypair()
    return KeyPair(PublicKeys(ed.public_key().public_bytes(
        serialization.Encoding.Raw, serialization.PublicFormat.Raw), _sized(pq_public, 1952)),
        ed.private_bytes(serialization.Encoding.Raw, serialization.PrivateFormat.Raw,
                         serialization.NoEncryption()), _sized(pq_secret, 4032))


def sign_ed25519(data, secret_key):
    return Ed25519PrivateKey.from_private_bytes(_sized(secret_key, 32)).sign(_message(data))


def verify_ed25519(data, signature, public_key):
    try:
        Ed25519PublicKey.from_public_bytes(_sized(public_key, 32)).verify(
            _sized(signature, 64), _message(data))
        return True
    except (ValueError, TypeError, InvalidSignature):
        return False


def sign_ml_dsa65(data, secret_key):
    return _sized(ml_dsa_65.sign(_sized(secret_key, 4032), _message(data)), 3309)


def verify_ml_dsa65(data, signature, public_key):
    try:
        return ml_dsa_65.verify(_sized(public_key, 1952), _message(data), _sized(signature, 3309))
    except (ValueError, TypeError):
        return False


def sign_hybrid(data, key_pair):
    if not isinstance(key_pair, KeyPair):
        raise TypeError('Expected KeyPair')
    return HybridSignature(sign_ed25519(data, key_pair.ed25519_secret),
                           sign_ml_dsa65(data, key_pair.ml_dsa65_secret))


def verify_hybrid(data, signature, public_keys):
    """Both independent signatures must verify. This is not a protocol envelope."""
    if not isinstance(signature, HybridSignature) or not isinstance(public_keys, PublicKeys):
        return False
    return (verify_ed25519(data, signature.ed25519, public_keys.ed25519)
            and verify_ml_dsa65(data, signature.ml_dsa65, public_keys.ml_dsa65))
