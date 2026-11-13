"""Optional crypto suite: run with ATP_TEST_CRYPTO=1 and the crypto extra installed."""
import json
import os
import pathlib
import subprocess
import unittest

@unittest.skipUnless(os.environ.get('ATP_TEST_CRYPTO') == '1', 'Optional crypto suite not requested')
class Crypto(unittest.TestCase):
    def test_roundtrip_rejection_and_no_downgrade(self):
        from atp_did.crypto import (generate_hybrid_key_pair, sign_hybrid, verify_hybrid,
            HybridSignature, verify_ed25519, verify_ml_dsa65, sign_ed25519, sign_ml_dsa65)
        keys, wrong = generate_hybrid_key_pair(), generate_hybrid_key_pair()
        message = b'ATP signed challenge\x00\xff'
        sig = sign_hybrid(message, keys)
        self.assertTrue(verify_hybrid(message, sig, keys.public_keys))
        self.assertFalse(verify_hybrid(message+b'!', sig, keys.public_keys))
        self.assertFalse(verify_hybrid(message, sig, wrong.public_keys))
        self.assertFalse(verify_hybrid(message, None, keys.public_keys))
        for bad in [b'', b'\x00', bytes(3309)]:
            self.assertFalse(verify_hybrid(message, HybridSignature(bad, sig.ml_dsa65), keys.public_keys))
        for bad in [b'', b'\x00', bytes(64), bytes(3309)]:
            self.assertFalse(verify_hybrid(message, HybridSignature(sig.ed25519, bad), keys.public_keys))
        self.assertFalse(verify_ed25519(message, sig.ml_dsa65, keys.public_keys.ed25519))
        self.assertFalse(verify_ml_dsa65(message, sig.ed25519, keys.public_keys.ml_dsa65))
        for f in [sign_ed25519, sign_ml_dsa65]:
            with self.assertRaises(ValueError): f(message, b'')
        self.assertNotIn(keys.ed25519_secret.hex(), repr(keys))
        self.assertNotIn(repr(keys.ed25519_secret), repr(keys))
        self.assertNotIn(repr(keys.ml_dsa65_secret), repr(keys))

    def test_published_javascript_sdk_both_directions(self):
        from atp_did import build_atp_v2_did, verify_atp_v2_key_bindings
        from atp_did.crypto import generate_hybrid_key_pair, sign_hybrid, verify_hybrid, HybridSignature, PublicKeys
        messages = [b'', b'ATP challenge', 'agent \U0001f916 caf\u00e9'.encode(), bytes(range(256))]
        payloads = []
        for message in messages:
            k = generate_hybrid_key_pair()
            sig = sign_hybrid(message, k)
            self.assertTrue(verify_atp_v2_key_bindings(build_atp_v2_did('example.com', ['agent'],
                k.public_keys.ed25519, k.public_keys.ml_dsa65), k.public_keys.ed25519, k.public_keys.ml_dsa65))
            payloads.append(dict(message=message.hex(), edPublic=k.public_keys.ed25519.hex(),
                pqPublic=k.public_keys.ml_dsa65.hex(), edSignature=sig.ed25519.hex(), pqSignature=sig.ml_dsa65.hex()))
        bridge = pathlib.Path(__file__).with_name('crypto_bridge.mjs')
        response = subprocess.run(['node', str(bridge)], input=json.dumps(payloads), text=True,
                                  capture_output=True, check=True, timeout=90)
        results = json.loads(response.stdout)
        self.assertEqual(len(results), len(messages))
        for message, result in zip(messages, results):
            self.assertTrue(result['verified'], 'Published SDK must verify Python signatures')
            self.assertFalse(result['tamperedEd'])
            self.assertFalse(result['tamperedPq'])
            sig = HybridSignature(bytes.fromhex(result['edSignature']), bytes.fromhex(result['pqSignature']))
            public = PublicKeys(bytes.fromhex(result['edPublic']), bytes.fromhex(result['pqPublic']))
            self.assertTrue(verify_hybrid(message, sig, public), 'Python must verify published SDK signatures')
            self.assertFalse(verify_hybrid(message+b'!', sig, public))

    def test_utf8_signing_and_fixed_sizes(self):
        from atp_did.crypto import generate_hybrid_key_pair, sign_ed25519, sign_ml_dsa65, verify_ml_dsa65
        k = generate_hybrid_key_pair()
        self.assertEqual(sign_ed25519('caf\u00e9', k.ed25519_secret), sign_ed25519('caf\u00e9'.encode(), k.ed25519_secret))
        sig = sign_ml_dsa65('caf\u00e9', k.ml_dsa65_secret)
        self.assertEqual(len(sig), 3309)
        self.assertTrue(verify_ml_dsa65('caf\u00e9'.encode(), sig, k.public_keys.ml_dsa65))
