import { CryptoUtils } from '../crypto.js';

// Regression coverage for the did:atp v2 hybrid keypair: signQuantumSafe /
// verifyQuantumSafe must operate on the post-quantum ML-DSA-65 binding, which
// lives in the tail of the combined pqcPrivateKey/pqcPublicKey (after the
// 32-byte Ed25519 prefix). Before the fix these passed the whole combined
// buffer to the Ed25519 provider and threw at runtime.
describe('CryptoUtils quantum-safe signing (did:atp v2 hybrid keypair)', () => {
  it('round-trips a post-quantum signature with the real ML-DSA-65 binding', async () => {
    const keyPair = await CryptoUtils.generateQuantumSafeKeyPair(true);
    expect(keyPair.isQuantumSafe).toBe(true);

    const message = 'attestation: agent did:atp:agents.example.com:billing';
    const { signature, isQuantumSafe } = await CryptoUtils.signQuantumSafe(message, keyPair);

    expect(isQuantumSafe).toBe(true);
    expect(signature.length).toBeGreaterThan(0);

    const ok = await CryptoUtils.verifyQuantumSafe(message, signature, keyPair);
    expect(ok).toBe(true);
  });

  it('rejects a tampered message', async () => {
    const keyPair = await CryptoUtils.generateQuantumSafeKeyPair(true);
    const { signature } = await CryptoUtils.signQuantumSafe('original', keyPair);

    const ok = await CryptoUtils.verifyQuantumSafe('tampered', signature, keyPair);
    expect(ok).toBe(false);
  });

  it('falls back to classical Ed25519 for a non-quantum keypair', async () => {
    const keyPair = await CryptoUtils.generateQuantumSafeKeyPair(false);
    expect(keyPair.isQuantumSafe).toBe(false);

    const message = 'classical path';
    const { signature, isQuantumSafe } = await CryptoUtils.signQuantumSafe(message, keyPair);

    expect(isQuantumSafe).toBe(false);
    expect(await CryptoUtils.verifyQuantumSafe(message, signature, keyPair)).toBe(true);
  });
});
