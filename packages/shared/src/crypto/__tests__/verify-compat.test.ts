import * as ed25519 from '@noble/ed25519';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { randomBytes } from 'crypto';
import { initializeCrypto } from '../../crypto-setup.js';
import {
  verifySignatureCompat,
  detectSignatureAlgorithm,
  ED25519_SIGNATURE_BYTES,
  ML_DSA_65_SIGNATURE_BYTES,
} from '../verify-compat.js';

initializeCrypto();

const MESSAGE = 'agent-trust-protocol did:atp v2 rollout';

async function makeEd25519() {
  const sk = ed25519.utils.randomPrivateKey();
  const pk = await ed25519.getPublicKeyAsync(sk);
  const sig = await ed25519.signAsync(Buffer.from(MESSAGE, 'utf8'), sk);
  return {
    publicKeyHex: Buffer.from(pk).toString('hex'),
    signatureHex: Buffer.from(sig).toString('hex'),
  };
}

function makeMlDsa65() {
  const kp = ml_dsa65.keygen(randomBytes(32));
  const sig = ml_dsa65.sign(Buffer.from(MESSAGE, 'utf8'), kp.secretKey);
  return {
    publicKeyHex: Buffer.from(kp.publicKey).toString('hex'),
    signatureHex: Buffer.from(sig).toString('hex'),
  };
}

describe('detectSignatureAlgorithm', () => {
  it('classifies by signature byte length', async () => {
    const ed = await makeEd25519();
    const pq = makeMlDsa65();
    expect(Buffer.from(ed.signatureHex, 'hex').length).toBe(ED25519_SIGNATURE_BYTES);
    expect(Buffer.from(pq.signatureHex, 'hex').length).toBe(ML_DSA_65_SIGNATURE_BYTES);
    expect(detectSignatureAlgorithm(ed.signatureHex)).toBe('ed25519');
    expect(detectSignatureAlgorithm(pq.signatureHex)).toBe('ml-dsa-65');
    expect(detectSignatureAlgorithm('abcd')).toBeNull();
  });
});

describe('verifySignatureCompat — legacy Ed25519 (backward compatibility)', () => {
  it('verifies a valid Ed25519 signature and reports the algorithm', async () => {
    const ed = await makeEd25519();
    const res = await verifySignatureCompat(MESSAGE, ed.signatureHex, { ed25519PublicKeyHex: ed.publicKeyHex });
    expect(res).toEqual({ valid: true, algorithm: 'ed25519' });
  });

  it('rejects a tampered message', async () => {
    const ed = await makeEd25519();
    const res = await verifySignatureCompat('tampered', ed.signatureHex, { ed25519PublicKeyHex: ed.publicKeyHex });
    expect(res.valid).toBe(false);
  });

  it('rejects a signature from a different key', async () => {
    const a = await makeEd25519();
    const b = await makeEd25519();
    const res = await verifySignatureCompat(MESSAGE, a.signatureHex, { ed25519PublicKeyHex: b.publicKeyHex });
    expect(res.valid).toBe(false);
  });
});

describe('verifySignatureCompat — v2 ML-DSA-65 (post-quantum)', () => {
  it('verifies a valid ML-DSA-65 signature and reports the algorithm', async () => {
    const pq = makeMlDsa65();
    const res = await verifySignatureCompat(MESSAGE, pq.signatureHex, { mlDsa65PublicKeyHex: pq.publicKeyHex });
    expect(res).toEqual({ valid: true, algorithm: 'ml-dsa-65' });
  });

  it('rejects a tampered message', async () => {
    const pq = makeMlDsa65();
    const res = await verifySignatureCompat('tampered', pq.signatureHex, { mlDsa65PublicKeyHex: pq.publicKeyHex });
    expect(res.valid).toBe(false);
  });
});

describe('verifySignatureCompat — hybrid key availability', () => {
  it('picks the right algorithm when both keys are supplied (Ed25519 input)', async () => {
    const ed = await makeEd25519();
    const pq = makeMlDsa65();
    const res = await verifySignatureCompat(MESSAGE, ed.signatureHex, {
      ed25519PublicKeyHex: ed.publicKeyHex,
      mlDsa65PublicKeyHex: pq.publicKeyHex,
    });
    expect(res).toEqual({ valid: true, algorithm: 'ed25519' });
  });

  it('picks the right algorithm when both keys are supplied (ML-DSA-65 input)', async () => {
    const ed = await makeEd25519();
    const pq = makeMlDsa65();
    const res = await verifySignatureCompat(MESSAGE, pq.signatureHex, {
      ed25519PublicKeyHex: ed.publicKeyHex,
      mlDsa65PublicKeyHex: pq.publicKeyHex,
    });
    expect(res).toEqual({ valid: true, algorithm: 'ml-dsa-65' });
  });

  it('returns invalid when no matching key is available', async () => {
    const ed = await makeEd25519();
    const res = await verifySignatureCompat(MESSAGE, ed.signatureHex, {});
    expect(res).toEqual({ valid: false, algorithm: null });
  });

  it('returns invalid for an ML-DSA-65 signature when only an Ed25519 key is supplied', async () => {
    const ed = await makeEd25519();
    const pq = makeMlDsa65();
    const res = await verifySignatureCompat(MESSAGE, pq.signatureHex, { ed25519PublicKeyHex: ed.publicKeyHex });
    expect(res).toEqual({ valid: false, algorithm: null });
  });

  it('returns invalid for an Ed25519 signature when only an ML-DSA-65 key is supplied', async () => {
    const ed = await makeEd25519();
    const pq = makeMlDsa65();
    const res = await verifySignatureCompat(MESSAGE, ed.signatureHex, { mlDsa65PublicKeyHex: pq.publicKeyHex });
    expect(res).toEqual({ valid: false, algorithm: null });
  });

  it('does not throw on malformed signature hex', async () => {
    const ed = await makeEd25519();
    const res = await verifySignatureCompat(MESSAGE, 'zzzz', { ed25519PublicKeyHex: ed.publicKeyHex });
    expect(res.valid).toBe(false);
  });
});
