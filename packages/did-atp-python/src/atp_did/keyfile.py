"""Encrypted local development key file. Not a hardware-backed keystore."""
import base64
import json
import os
import stat
from pathlib import Path

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt

from .crypto import KeyPair, PublicKeys, sign_hybrid, verify_hybrid

_N = 1 << 17
_MAX_FILE = 16384


def _key(passphrase, salt):
    if not isinstance(passphrase, str) or not passphrase:
        raise ValueError('A nonempty passphrase is required')
    return Scrypt(salt=salt, length=32, n=_N, r=8, p=1).derive(passphrase.encode('utf-8'))


def _encode(data):
    return base64.urlsafe_b64encode(data).decode('ascii')


def _decode(data):
    if not isinstance(data, str):
        raise ValueError('Invalid key file')
    return base64.b64decode(data, altchars=b'-_', validate=True)


def save_key_file(path, key_pair, passphrase):
    """Create a new 0600 file exclusively; never replace an existing key file."""
    if not isinstance(key_pair, KeyPair):
        raise TypeError('Expected KeyPair')
    destination = Path(path)
    salt, nonce = os.urandom(16), os.urandom(12)
    payload = json.dumps({
        'ed_public': _encode(key_pair.public_keys.ed25519),
        'pq_public': _encode(key_pair.public_keys.ml_dsa65),
        'ed_secret': _encode(key_pair.ed25519_secret),
        'pq_secret': _encode(key_pair.ml_dsa65_secret),
    }, separators=(',', ':')).encode('utf-8')
    ciphertext = AESGCM(_key(passphrase, salt)).encrypt(nonce, payload, b'atp-did-keyfile-v1')
    envelope = json.dumps({'version': 1, 'kdf': 'scrypt', 'salt': _encode(salt),
                           'nonce': _encode(nonce), 'ciphertext': _encode(ciphertext)},
                          separators=(',', ':')).encode('utf-8')
    fd = os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, 'O_NOFOLLOW', 0), 0o600)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(envelope)
    except BaseException:
        destination.unlink(missing_ok=True)
        raise


def load_key_file(path, passphrase):
    """Reject symlinks, permissive Unix modes, oversized and invalid files."""
    p = Path(path)
    fd = os.open(p, os.O_RDONLY | getattr(os, 'O_NOFOLLOW', 0))
    with os.fdopen(fd, 'rb') as stream:
        metadata = os.fstat(stream.fileno())
        if not stat.S_ISREG(metadata.st_mode) or metadata.st_size > _MAX_FILE or (os.name == 'posix' and metadata.st_mode & 0o077):
            raise ValueError('Key file must be a private regular file under 16 KiB')
        raw = stream.read(_MAX_FILE + 1)
    try:
        document = json.loads(raw)
        if set(document) != {'version', 'kdf', 'salt', 'nonce', 'ciphertext'} or document['version'] != 1 or document['kdf'] != 'scrypt':
            raise ValueError('Unsupported key file')
        salt, nonce, ciphertext = (_decode(document[name]) for name in ('salt', 'nonce', 'ciphertext'))
        if len(salt) != 16 or len(nonce) != 12:
            raise ValueError('Invalid key file')
        data = json.loads(AESGCM(_key(passphrase, salt)).decrypt(nonce, ciphertext, b'atp-did-keyfile-v1'))
        if set(data) != {'ed_public', 'pq_public', 'ed_secret', 'pq_secret'}:
            raise ValueError('Invalid key file')
        keys = KeyPair(PublicKeys(_decode(data['ed_public']), _decode(data['pq_public'])),
                       _decode(data['ed_secret']), _decode(data['pq_secret']))
        if tuple(map(len, (keys.public_keys.ed25519, keys.public_keys.ml_dsa65,
                           keys.ed25519_secret, keys.ml_dsa65_secret))) != (32, 1952, 32, 4032):
            raise ValueError('Invalid key lengths')
        probe = b'atp-did-keyfile-v1 key consistency'
        if not verify_hybrid(probe, sign_hybrid(probe, keys), keys.public_keys):
            raise ValueError('Key file contains mismatched public and secret keys')
        return keys
    except (InvalidTag, KeyError, TypeError, UnicodeError, json.JSONDecodeError) as exc:
        raise ValueError('Invalid key file or passphrase') from exc
