"""Internal public-HTTPS worker. No keys, credentials, proxies or crypto imports.

The parent kills this process on deadline, including blocked DNS/header reads.
Run only via resolver.resolve_did; this is not a supported command-line API.
"""
import http.client
import ipaddress
import json
import socket
import ssl
import sys
from urllib.parse import urljoin, urlsplit

MAX_BYTES = 65536


class FetchError(ValueError):
    def __init__(self, code, message):
        super().__init__(message)
        self.code = code


def checked_url(url):
    if (not isinstance(url, str) or not url or len(url) > 8192 or '\\' in url
            or any(ord(c) <= 32 or ord(c) >= 127 for c in url)):
        raise FetchError('insecure_url', 'URL must be ASCII HTTPS without whitespace or backslashes')
    try:
        parsed = urlsplit(url)
        port = parsed.port if parsed.port is not None else 443
        if (parsed.scheme != 'https' or not parsed.hostname or parsed.username is not None
                or parsed.password is not None or parsed.fragment or parsed.query
                or '%' in parsed.netloc or not 1 <= port <= 65535):
            raise ValueError('Unsupported HTTPS URL')
        if any(part in ('.', '..') for part in parsed.path.split('/')):
            raise ValueError('Dot path segments are not supported')
        return parsed, (parsed.hostname, port)
    except ValueError as error:
        raise FetchError('insecure_url', 'Invalid HTTPS destination') from error


def public_addresses(host, port):
    addresses = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    if not addresses:
        raise FetchError('destination_not_allowed', 'Destination has no addresses')
    for family, kind, protocol, _, address in addresses:
        if family not in (socket.AF_INET, socket.AF_INET6):
            raise FetchError('destination_not_allowed', 'Unsupported address family')
        ip = ipaddress.ip_address(address[0])
        ip = getattr(ip, 'ipv4_mapped', None) or ip
        if (not ip.is_global or ip.is_multicast or ip.is_reserved
                or getattr(ip, 'is_site_local', False)):
            raise FetchError('destination_not_allowed', 'All DNS answers must be public unicast addresses')
    return addresses


class PinnedHTTPSConnection(http.client.HTTPSConnection):
    """Connect to a validated numeric address; verify TLS against original host."""
    def __init__(self, host, port, address, timeout):
        super().__init__(host, port, timeout=timeout, context=ssl.create_default_context())
        self._address = address

    def connect(self):
        family, kind, protocol, _, address = self._address
        sock = socket.socket(family, kind, protocol)
        try:
            sock.settimeout(self.timeout)
            # Numeric address from the checked DNS answer: no second host lookup.
            sock.connect(address)
            self.sock = self._context.wrap_socket(sock, server_hostname=self.host)
        except BaseException:
            sock.close()
            raise


def fetch(url, timeout, max_redirects):
    _, origin = checked_url(url)
    for hop in range(max_redirects + 1):
        parsed, destination = checked_url(url)
        if destination != origin:
            raise FetchError('destination_not_allowed', 'Cross-origin redirects are not allowed')
        addresses = public_addresses(*destination)
        # Fail closed on connection failure; no implicit alternative destinations.
        connection = PinnedHTTPSConnection(*destination, addresses[0], timeout)
        try:
            connection.request('GET', parsed.path or '/', headers={
                'Accept': 'application/did+json, application/json',
                'Accept-Encoding': 'identity', 'Connection': 'close',
            })
            response = connection.getresponse()
            if response.status in (301, 302, 303, 307, 308):
                locations = response.headers.get_all('Location', [])
                if len(locations) != 1:
                    raise FetchError('insecure_url', 'Redirect requires exactly one Location')
                if hop == max_redirects:
                    raise FetchError('redirect_limit', 'DID redirect limit exceeded')
                if ('\\' in locations[0] or not locations[0]
                        or any(ord(c) <= 32 or ord(c) >= 127 for c in locations[0])):
                    raise FetchError('insecure_url', 'Invalid redirect Location')
                url = urljoin(url, locations[0])
                _, target = checked_url(url)
                if target != origin:
                    raise FetchError('destination_not_allowed', 'Cross-origin redirects are not allowed')
                continue
            if response.status != 200:
                raise FetchError('not_found', 'DID fetch did not return HTTP 200')
            if response.headers.get('Content-Encoding', 'identity').lower() != 'identity':
                raise FetchError('invalid_response', 'Compressed responses are not accepted')
            lengths = response.headers.get_all('Content-Length', [])
            encodings = response.headers.get_all('Transfer-Encoding', [])
            if len(lengths) > 1 or len(encodings) > 1 or (lengths and encodings):
                raise FetchError('invalid_response', 'Ambiguous HTTP framing')
            if encodings and encodings[0].lower() != 'chunked':
                raise FetchError('invalid_response', 'Unsupported transfer encoding')
            expected = None
            if lengths:
                if not lengths[0].isascii() or not lengths[0].isdigit():
                    raise FetchError('invalid_response', 'Invalid Content-Length')
                expected = int(lengths[0])
                if expected > MAX_BYTES:
                    raise FetchError('response_too_large', 'DID response exceeds 64 KiB')
            content = response.read(MAX_BYTES + 1)
            if len(content) > MAX_BYTES:
                raise FetchError('response_too_large', 'DID response exceeds 64 KiB')
            if expected is not None and len(content) != expected:
                raise FetchError('invalid_response', 'Truncated response')
            return content
        finally:
            connection.close()
    raise FetchError('redirect_limit', 'DID redirect limit exceeded')


def main():
    try:
        config = json.loads(sys.stdin.buffer.read(16384))
        content = fetch(config['url'], config['timeout'], config['max_redirects'])
        sys.stdout.buffer.write(content)
    except FetchError as error:
        sys.stderr.write(json.dumps({'code': error.code}))
        return 1
    except (OSError, ValueError, KeyError, http.client.HTTPException):
        # No response bodies, exception messages or tracebacks in the protocol.
        sys.stderr.write(json.dumps({'code': 'transport_failed'}))
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
