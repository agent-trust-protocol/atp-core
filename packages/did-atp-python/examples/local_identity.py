"""Local identity demonstration; no resolver, network registration or authorization."""
import argparse
import getpass

from atp_did import build_atp_v2_did, verify_atp_v2_key_bindings
from atp_did.crypto import generate_hybrid_key_pair, sign_hybrid, verify_hybrid
from atp_did.keyfile import load_key_file, save_key_file


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('keyfile', help='new encrypted key file (existing files are refused)')
    parser.add_argument('--domain', default='example.com')
    parser.add_argument('--agent', default='demo')
    args = parser.parse_args()
    passphrase = getpass.getpass('New key file passphrase: ')
    if len(passphrase) < 16:
        parser.error('use a passphrase of at least 16 characters')
    keys = generate_hybrid_key_pair()
    save_key_file(args.keyfile, keys, passphrase)
    loaded = load_key_file(args.keyfile, passphrase)
    public = loaded.public_keys
    did = build_atp_v2_did(args.domain, ['agents', args.agent], public.ed25519, public.ml_dsa65)
    challenge = b'local demo only; no authority or replay protection'
    proof = sign_hybrid(challenge, loaded)
    assert verify_atp_v2_key_bindings(did, public.ed25519, public.ml_dsa65)
    assert verify_hybrid(challenge, proof, public)
    assert not verify_hybrid(challenge + b'!', proof, public)
    print('Local DID:', did)
    print('Encrypted key file:', args.keyfile)
    print('Local signature round trip: verified (not an authorization check)')


if __name__ == '__main__':
    main()
