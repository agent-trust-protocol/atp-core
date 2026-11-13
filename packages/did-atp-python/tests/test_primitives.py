import base64
import json
import pathlib
import unittest
from atp_did import (atp_base64_url, atp_jwk_thumbprint, atp_e1_fingerprint,
    atp_pq1_fingerprint, build_atp_v2_did, parse_atp_v2_path_did,
    is_atp_v2_path_did, verify_atp_v2_key_bindings, AtpDidParseError)

ROOT = pathlib.Path(__file__).resolve().parents[3]
VECTORS = json.loads((ROOT / 'docs/specs/did-atp/test-vectors.json').read_text())['pathIdentifiers']
INVALID = json.loads((ROOT / 'packages/did-atp/test/python-interop-invalid.json').read_text())

class Primitives(unittest.TestCase):
    def test_canonical_vectors(self):
        for v in VECTORS:
            with self.subTest(did=v['did']):
                ed, pq = bytes.fromhex(v['ed25519PublicKeyHex']), bytes.fromhex(v['mlDsa65PublicKeyHex'])
                self.assertEqual(atp_e1_fingerprint(ed), v['e1'])
                self.assertEqual(atp_pq1_fingerprint(pq), v['pq1'])
                self.assertEqual(build_atp_v2_did(v['domain'], v['path'], ed, pq), v['did'])
                parsed = parse_atp_v2_path_did(v['did'])
                self.assertEqual((parsed.domain, parsed.path, parsed.e1, parsed.pq1),
                                 (v['domain'], tuple(v['path']), v['e1'], v['pq1']))
                self.assertTrue(verify_atp_v2_key_bindings(v['did'], ed, pq))
                self.assertFalse(verify_atp_v2_key_bindings(v['did'], bytes([ed[0] ^ 1])+ed[1:], pq))
                self.assertFalse(verify_atp_v2_key_bindings(v['did'], ed, bytes([pq[0] ^ 1])+pq[1:]))

    def test_shared_errors(self):
        for case in INVALID:
            with self.subTest(case=case):
                self.assertFalse(is_atp_v2_path_did(case['value']))
                with self.assertRaises(AtpDidParseError) as raised:
                    parse_atp_v2_path_did(case['value'])
                self.assertEqual(raised.exception.code, case['code'])

    def test_jwk_known_answer_and_metadata(self):
        jwk = dict(crv='Ed25519', kty='OKP', x='11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo')
        expected = 'kPrK_qmxVWaYVA9wwBF6Iuo3vVzz7TxHCTwXBygrS4k'
        self.assertEqual(atp_jwk_thumbprint(jwk), expected)
        self.assertEqual(atp_jwk_thumbprint(dict(jwk, kid='ignored', d='private')), expected)
        for bad in [None, [], {}, {'kty':'toString'}, {'kty':'OKP','crv':'Ed25519','x':''}]:
            with self.assertRaises(ValueError): atp_jwk_thumbprint(bad)

    def test_base64_all_byte_values_and_remainders(self):
        for length in range(260):
            data = bytes(i % 256 for i in range(length))
            self.assertEqual(atp_base64_url(data), base64.urlsafe_b64encode(data).decode().rstrip('='))

    def test_builder_and_binding_reject_bad_inputs(self):
        ed, pq = bytes(32), bytes(1952)
        for domain, path in [('BAD.DOMAIN',['agent']), ('example.com',[]), ('example.com',['a\n']),
                             ('example.com',['e1_'+'a'*43]), ('example.com',[None])]:
            with self.assertRaises(ValueError): build_atp_v2_did(domain,path,ed,pq)
        for size in [0,31,33]:
            with self.assertRaises(ValueError): atp_e1_fingerprint(bytes(size))
        for size in [0,1951,1953]:
            with self.assertRaises(ValueError): atp_pq1_fingerprint(bytes(size))
        with self.assertRaises(TypeError): atp_e1_fingerprint('x'*32)
        did = build_atp_v2_did('example.com',['agent'],ed,pq)
        # Both keys must be validated even when the first binding mismatches.
        with self.assertRaises(ValueError): verify_atp_v2_key_bindings(did,bytes([1])*32,b'')
        self.assertFalse(is_atp_v2_path_did(did+'\n'))

if __name__ == '__main__': unittest.main()
