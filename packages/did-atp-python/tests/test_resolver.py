"""Hermetic transport, SSRF and real installed-worker deadline checks."""
import copy
from email.message import Message
import json
import os
import pathlib
import socket
import subprocess
import tempfile
import time
import unittest
from unittest.mock import Mock, patch


@unittest.skipUnless(os.environ.get('ATP_TEST_DOCUMENT') == '1', 'Optional document suite not requested')
class Resolver(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        bridge = pathlib.Path(__file__).with_name('document_bridge.mjs')
        result = subprocess.run(['node', str(bridge)], input='[]', text=True,
                                capture_output=True, check=True, timeout=90)
        cls.reference = json.loads(result.stdout)
        cls.did = cls.reference['did']

    def response(self, status=200, body=b'{}', headers=()):
        response = Mock(status=status)
        response.headers = Message()
        for key, value in headers: response.headers[key] = value
        response.read.return_value = body
        return response

    def connection(self, responses):
        connections = []
        for response in responses:
            connection = Mock()
            connection.getresponse.return_value = response
            connections.append(connection)
        return connections

    def test_did_url_and_options(self):
        from atp_did import build_atp_v2_did
        from atp_did.resolver import did_document_url, resolve_did, DidResolutionError
        self.assertEqual(did_document_url(self.did), 'https://example.com/agents/python/did.json')
        for domain in ['example.com%3A8443', 'example.com%3a8443']:
            did = build_atp_v2_did(domain, ['agent'], bytes(32), bytes(1952))
            self.assertEqual(did_document_url(did), 'https://example.com:8443/agent/did.json')
        for domain, path in [('example.com%3A0', ['agent']), ('example.com%3A99999', ['agent']),
                             ('example.com', ['..']), ('example.com', ['.']),
                             ('example.com', ['a' * 8192])]:
            did = build_atp_v2_did(domain, path, bytes(32), bytes(1952))
            with self.assertRaises(DidResolutionError): did_document_url(did)
        with patch('atp_did.resolver.subprocess.run') as run:
            for timeout in [0, -1, True, float('inf'), float('nan'), 61, '1']:
                with self.assertRaises(ValueError): resolve_did(self.did, timeout=timeout)
            for hops in [-1, 6, True, 1.5]:
                with self.assertRaises(ValueError): resolve_did(self.did, max_redirects=hops)
            run.assert_not_called()

    def test_public_dns_and_mixed_answer_rejection(self):
        from atp_did._https_fetch import public_addresses, FetchError
        def answer(ip):
            family = socket.AF_INET6 if ':' in ip else socket.AF_INET
            return (family, socket.SOCK_STREAM, 6, '', (ip, 443))
        for ip in ['127.0.0.1', '10.1.2.3', '169.254.169.254', '0.0.0.0', '192.0.2.1',
                   '224.0.0.1', '::1', 'fe80::1', 'fc00::1', '::ffff:127.0.0.1', 'fec0::1']:
            with self.subTest(ip=ip), patch('atp_did._https_fetch.socket.getaddrinfo',
                                          return_value=[answer('8.8.8.8'), answer(ip)]):
                with self.assertRaises(FetchError): public_addresses('example.com', 443)
        with patch('atp_did._https_fetch.socket.getaddrinfo', return_value=[answer('8.8.8.8')]):
            self.assertEqual(public_addresses('example.com', 443), [answer('8.8.8.8')])

    def test_pinned_socket_and_hostname_verification(self):
        from atp_did._https_fetch import PinnedHTTPSConnection
        address = (socket.AF_INET, socket.SOCK_STREAM, 6, '', ('8.8.8.8', 443))
        with patch('atp_did._https_fetch.socket.socket') as factory:
            connection = PinnedHTTPSConnection('example.com', 443, address, 2)
            self.assertTrue(connection._context.check_hostname)
            import ssl
            self.assertEqual(connection._context.verify_mode, ssl.CERT_REQUIRED)
            with patch.object(connection._context, 'wrap_socket') as wrap:
                connection.connect()
                factory.return_value.connect.assert_called_once_with(('8.8.8.8', 443))
                wrap.assert_called_once_with(factory.return_value, server_hostname='example.com')
        with patch('atp_did._https_fetch.socket.socket') as factory:
            connection = PinnedHTTPSConnection('example.com', 443, address, 2)
            with patch.object(connection._context, 'wrap_socket', side_effect=ssl.SSLError('bad cert')):
                with self.assertRaises(ssl.SSLError): connection.connect()
                factory.return_value.close.assert_called_once()

    def test_redirect_policy_and_cleanup(self):
        from atp_did._https_fetch import fetch, FetchError
        url = 'https://example.com/agents/python/did.json'
        connections = self.connection([self.response(302, headers=[('Location', '/next/did.json')]),
                                       self.response(body=b'valid')])
        with patch('atp_did._https_fetch.public_addresses', return_value=[('pinned',)]) as dns, \
             patch('atp_did._https_fetch.PinnedHTTPSConnection', side_effect=connections):
            self.assertEqual(fetch(url, 1, 3), b'valid')
            self.assertEqual(dns.call_count, 2)
            connections[1].request.assert_called_once_with('GET', '/next/did.json', headers={
                'Accept': 'application/did+json, application/json',
                'Accept-Encoding': 'identity', 'Connection': 'close'})
            for connection in connections: connection.close.assert_called_once()
        for location in ['https://other.example/doc', 'http://example.com/doc', '//127.0.0.1/doc',
                         'https://user@example.com/doc', '/doc?secret=1', '/doc#part',
                         ' /doc', '/a\\b', '/a\nb']:
            connection = self.connection([self.response(302, headers=[('Location', location)])])[0]
            with self.subTest(location=location), \
                 patch('atp_did._https_fetch.public_addresses', return_value=[('pinned',)]), \
                 patch('atp_did._https_fetch.PinnedHTTPSConnection', return_value=connection):
                with self.assertRaises(FetchError): fetch(url, 1, 3)
                connection.close.assert_called_once()
        connection = self.connection([self.response(302, headers=[('Location', '/loop')])])[0]
        with patch('atp_did._https_fetch.public_addresses', return_value=[('pinned',)]), \
             patch('atp_did._https_fetch.PinnedHTTPSConnection', return_value=connection):
            with self.assertRaises(FetchError) as result: fetch(url, 1, 0)
            self.assertEqual(result.exception.code, 'redirect_limit')

    def test_response_limits_and_bad_framing(self):
        from atp_did._https_fetch import fetch, FetchError
        cases = [self.response(404), self.response(410),
                 self.response(headers=[('Content-Encoding', 'gzip')]),
                 self.response(headers=[('Content-Length', '65537')]),
                 self.response(body=b'x' * 65537),
                 self.response(body=b'xx', headers=[('Content-Length', '3')]),
                 self.response(headers=[('Content-Length', '-1')]),
                 self.response(headers=[('Content-Length', '1'), ('Content-Length', '1')]),
                 self.response(headers=[('Transfer-Encoding', 'gzip')]),
                 self.response(headers=[('Transfer-Encoding', 'chunked'), ('Content-Length', '2')])]
        for response in cases:
            connection = self.connection([response])[0]
            with patch('atp_did._https_fetch.public_addresses', return_value=[('pinned',)]), \
                 patch('atp_did._https_fetch.PinnedHTTPSConnection', return_value=connection):
                with self.assertRaises(FetchError): fetch('https://example.com/did.json', 1, 0)
                connection.close.assert_called_once()
        for headers in [[], [('Transfer-Encoding', 'chunked')], [('Content-Length', '65536')]]:
            response = self.response(body=b'x' * 65536, headers=headers)
            connection = self.connection([response])[0]
            with patch('atp_did._https_fetch.public_addresses', return_value=[('pinned',)]), \
                 patch('atp_did._https_fetch.PinnedHTTPSConnection', return_value=connection):
                self.assertEqual(len(fetch('https://example.com/did.json', 1, 0)), 65536)
                response.read.assert_called_once_with(65537)

    def test_resolver_requires_verified_document(self):
        from atp_did.resolver import resolve_did, DidResolutionError
        valid = json.dumps(self.reference['document']).encode()
        with patch('atp_did.resolver.subprocess.run', return_value=Mock(returncode=0, stdout=valid)) as run:
            resolved = resolve_did(self.did)
            self.assertEqual(resolved.did, self.did)
            self.assertEqual(len(resolved.public_keys.ml_dsa65), 1952)
            self.assertEqual(run.call_args.args[0][1], '-I')
        invalid = copy.deepcopy(self.reference['document'])
        invalid.pop('atpPqProof')
        for body in [b'<html>bad</html>', json.dumps(invalid).encode(),
                     valid.replace(b'example.com', b'attacker.example'), b'x' * 65537]:
            with patch('atp_did.resolver.subprocess.run', return_value=Mock(returncode=0, stdout=body)):
                with self.assertRaises(DidResolutionError): resolve_did(self.did)
        for stderr in [b'{"code":"destination_not_allowed"}', b'invalid', b'[]']:
            with patch('atp_did.resolver.subprocess.run',
                       return_value=Mock(returncode=1, stdout=b'', stderr=stderr)):
                with self.assertRaises(DidResolutionError): resolve_did(self.did)

    def test_real_worker_launch_and_deadline(self):
        from atp_did import build_atp_v2_did
        from atp_did.resolver import resolve_did, DidResolutionError
        # Exercise the actual packaged worker without any external service.
        private_did = build_atp_v2_did('127.0.0.1', ['agent'], bytes(32), bytes(1952))
        with self.assertRaises(DidResolutionError) as result:
            resolve_did(private_did)
        self.assertEqual(result.exception.code, 'destination_not_allowed')
        # A genuine isolated interpreter executes the worker protocol and the
        # parent verifies the resulting SDK document, with no network dependency.
        with tempfile.TemporaryDirectory() as directory:
            worker = pathlib.Path(directory) / 'worker.py'
            worker.write_text('import sys\nsys.stdout.buffer.write(' +
                              repr(json.dumps(self.reference['document']).encode()) + ')\n')
            with patch('atp_did.resolver._WORKER', str(worker)):
                self.assertEqual(resolve_did(self.did).did, self.did)
            worker.write_text('import time\ntime.sleep(30)\n')
            start = time.monotonic()
            with patch('atp_did.resolver._WORKER', str(worker)):
                with self.assertRaises(DidResolutionError) as result:
                    resolve_did(self.did, timeout=0.1)
                self.assertEqual(result.exception.code, 'timeout')
            self.assertLess(time.monotonic() - start, 5)
