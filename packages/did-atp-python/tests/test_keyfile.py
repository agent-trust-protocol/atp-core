import os
import stat
import tempfile
import unittest
from pathlib import Path

if os.getenv('ATP_TEST_CRYPTO') == '1':
    from atp_did.crypto import generate_hybrid_key_pair, sign_hybrid, verify_hybrid
    from atp_did.keyfile import load_key_file, save_key_file


@unittest.skipUnless(os.getenv('ATP_TEST_CRYPTO') == '1', 'optional crypto dependencies not installed')
class KeyFileTest(unittest.TestCase):
    def test_round_trip_and_rejection(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'keys.json'
            pair = generate_hybrid_key_pair()
            save_key_file(path, pair, 'a long example passphrase')
            self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o600)
            with self.assertRaises(FileExistsError):
                save_key_file(path, pair, 'a long example passphrase')
            self.assertNotIn(pair.ed25519_secret, path.read_bytes())
            self.assertNotIn(pair.ml_dsa65_secret, path.read_bytes())
            with self.assertRaises(ValueError):
                load_key_file(path, 'wrong passphrase')
            loaded = load_key_file(path, 'a long example passphrase')
            self.assertEqual(loaded, pair)
            self.assertTrue(verify_hybrid(b'test', sign_hybrid(b'test', loaded), loaded.public_keys))
            contents = bytearray(path.read_bytes())
            contents[-10] ^= 1
            path.write_bytes(contents)
            with self.assertRaises(ValueError):
                load_key_file(path, 'a long example passphrase')

    @unittest.skipUnless(os.name == 'posix', 'Unix file mode checks')
    def test_permissions_and_symlink(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'keys.json'
            save_key_file(path, generate_hybrid_key_pair(), 'a long example passphrase')
            path.chmod(0o644)
            with self.assertRaises(ValueError):
                load_key_file(path, 'a long example passphrase')
            link = Path(directory) / 'link'
            link.symlink_to(path)
            with self.assertRaises(OSError):
                load_key_file(link, 'a long example passphrase')
