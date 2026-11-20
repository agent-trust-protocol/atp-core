"""Public HTTPS DID resolution with mandatory dual-proof verification."""
from dataclasses import dataclass
import json
import math
from pathlib import Path
import subprocess
import sys

from . import parse_atp_v2_path_did
from .crypto import PublicKeys
from .document import DocumentVerificationError, verify_did_document
from ._https_fetch import MAX_BYTES, checked_url

_WORKER = str(Path(__file__).with_name('_https_fetch.py').resolve())


class DidResolutionError(ValueError):
    def __init__(self, code, message):
        super().__init__(message)
        self.code = code


@dataclass(frozen=True)
class ResolvedIdentity:
    did: str
    document_url: str
    public_keys: PublicKeys


def did_document_url(did):
    """Map a bound path DID to its HTTPS did.json URL; make no network request."""
    try:
        parsed = parse_atp_v2_path_did(did)
        if any(segment in ('.', '..') for segment in parsed.path):
            raise ValueError('Dot path segments cannot be resolved')
        authority = parsed.domain.replace('%3A', ':').replace('%3a', ':')
        url = 'https://' + authority + '/' + '/'.join(parsed.path) + '/did.json'
        checked_url(url)
        return url
    except (ValueError, TypeError) as error:
        raise DidResolutionError('invalid_did', 'DID cannot map safely to HTTPS') from error


def resolve_did(did, *, timeout=10.0, max_redirects=3):
    """Fetch public HTTPS did.json and return keys only after both proofs pass.

    A short-lived interpreter process bounds DNS and all transport reads by the
    timeout; it is killed and reaped on expiry. No shell, environment proxies,
    caller credentials, arbitrary URL override or private-network opt-out.
    Timeout excludes cryptographic verification and process creation overhead.
    No cache, domain ownership claim, challenge or action authorization.
    """
    url = did_document_url(did)
    if (isinstance(timeout, bool) or not isinstance(timeout, (float, int))
            or not math.isfinite(timeout) or not 0 < timeout <= 60):
        raise ValueError('timeout must be finite, greater than zero and at most 60 seconds')
    if type(max_redirects) is not int or not 0 <= max_redirects <= 5:
        raise ValueError('max_redirects must be an integer from zero to five')
    request = json.dumps({'url': url, 'timeout': timeout, 'max_redirects': max_redirects}).encode('ascii')
    try:
        result = subprocess.run([sys.executable, '-I', _WORKER],
                                input=request, capture_output=True, timeout=timeout, check=False)
    except subprocess.TimeoutExpired as error:
        raise DidResolutionError('timeout', 'DID HTTPS transport deadline exceeded') from error
    except OSError as error:
        raise DidResolutionError('transport_failed', 'Cannot start HTTPS transport') from error
    if result.returncode != 0:
        code = 'transport_failed'
        try:
            reported = json.loads(result.stderr).get('code')
            if reported in {'destination_not_allowed', 'insecure_url', 'redirect_limit',
                            'not_found', 'invalid_response', 'response_too_large', 'transport_failed'}:
                code = reported
        except (ValueError, AttributeError, TypeError):
            # Malformed worker output must retain a generic failure without leaking details.
            code = 'transport_failed'
        raise DidResolutionError(code, 'DID HTTPS retrieval failed: ' + code)
    if len(result.stdout) > MAX_BYTES:
        raise DidResolutionError('response_too_large', 'DID response exceeds 64 KiB')
    try:
        keys = verify_did_document(did, result.stdout)
    except DocumentVerificationError as error:
        raise DidResolutionError('verification_failed', 'DID document verification failed') from error
    return ResolvedIdentity(did, url, keys)
