"""Document verification against the published SDK; opt-in dependency suite."""
import copy
import json
import os
import pathlib
import subprocess
import unittest


@unittest.skipUnless(os.environ.get('ATP_TEST_DOCUMENT') == '1', 'Optional document suite not requested')
class Document(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        bridge = pathlib.Path(__file__).with_name('document_bridge.mjs')
        result = subprocess.run(['node', str(bridge)], input='[]', text=True,
                                capture_output=True, check=True, timeout=90)
        cls.reference = json.loads(result.stdout)

    def check(self, document, did=None):
        from atp_did.document import verify_did_document
        return verify_did_document(did or self.reference['did'], json.dumps(document, ensure_ascii=False))

    def test_sdk_document_and_immutable_keys(self):
        from atp_did import verify_atp_v2_key_bindings
        from atp_did.document import verify_did_document
        self.assertTrue(self.reference['verified']['valid'])
        keys = self.check(self.reference['document'])
        self.assertEqual(keys, verify_did_document(self.reference['did'],
                         json.dumps(self.reference['document']).encode('utf-8')))
        self.assertTrue(verify_atp_v2_key_bindings(self.reference['did'], keys.ed25519, keys.ml_dsa65))
        with self.assertRaises(AttributeError):
            keys.ed25519 = b''

    def test_tamper_binding_and_no_single_proof_fallback(self):
        from atp_did.document import DocumentVerificationError
        original = self.reference['document']
        mutations = [
            lambda d: d.pop('proof'), lambda d: d.pop('atpPqProof'),
            lambda d: d['proof'].update(proofValue='z' + '1' * 64),
            lambda d: d['atpPqProof'].update(jws=d['atpPqProof']['jws'][:-10] + 'AAAAAAAAAA'),
            lambda d: d['verificationMethod'][0].update(publicKeyMultibase='z' + '1' * 34),
            lambda d: d['verificationMethod'][1]['publicKeyJwk'].update(pub='A' * 2603),
            lambda d: d['verificationMethod'][0].update(controller='did:example:attacker'),
            lambda d: d.update(authentication=[d['authentication'][0]]),
            lambda d: d['proof'].update(proofPurpose='assertionMethod'),
            lambda d: d['atpPqProof'].update(verificationMethod='did:example:attacker#key'),
            lambda d: d['atpPqProof'].update(created='2099-01-01'),
            lambda d: d['service'][0].update(serviceEndpoint='https://attacker.example'),
            lambda d: d.update(verificationMethod=d['verificationMethod'] * 2),
            lambda d: d.update(id=d['id'].replace('example.com', 'attacker.example')),
        ]
        for index, mutate in enumerate(mutations):
            with self.subTest(case=index):
                doc = copy.deepcopy(original)
                mutate(doc)
                with self.assertRaises(DocumentVerificationError): self.check(doc)

    def test_malformed_json_and_size(self):
        from atp_did.document import verify_did_document, DocumentVerificationError
        for raw in [None, {}, b'\xff', '[]', 'null', '{', '{"id":1,"id":2}',
                    '{"value":NaN}', ' ' * 65537]:
            with self.subTest(raw=repr(raw)[:40]):
                with self.assertRaises(DocumentVerificationError):
                    verify_did_document(self.reference['did'], raw)
        with self.assertRaises(DocumentVerificationError):
            verify_did_document('did:example:bad', '{}')

    def test_jws_header_and_encoding_rejections(self):
        from atp_did import atp_base64_url
        from atp_did.document import DocumentVerificationError
        for header in [{'alg': 'none', 'typ': 'JOSE'},
                       {'alg': 'ML-DSA-65', 'typ': 'JOSE', 'crit': ['unknown']},
                       {'alg': 'ML-DSA-65', 'typ': 'JOSE', 'b64': False}]:
            doc = copy.deepcopy(self.reference['document'])
            parts = doc['atpPqProof']['jws'].split('.')
            parts[0] = atp_base64_url(json.dumps(header).encode())
            doc['atpPqProof']['jws'] = '.'.join(parts)
            with self.assertRaises(DocumentVerificationError): self.check(doc)
        for index in range(3):
            doc = copy.deepcopy(self.reference['document'])
            parts = doc['atpPqProof']['jws'].split('.')
            parts[index] += '='
            doc['atpPqProof']['jws'] = '.'.join(parts)
            with self.assertRaises(DocumentVerificationError): self.check(doc)
