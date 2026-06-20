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

// --- Adversarial hardening added by conformance loop -------------------------

describe('detectSignatureAlgorithm — length boundaries', () => {
  it('rejects near-miss lengths around both schemes', () => {
    const ed63 = Buffer.alloc(ED25519_SIGNATURE_BYTES - 1).toString('hex');
    const ed65 = Buffer.alloc(ED25519_SIGNATURE_BYTES + 1).toString('hex');
    const pq3308 = Buffer.alloc(ML_DSA_65_SIGNATURE_BYTES - 1).toString('hex');
    const pq3310 = Buffer.alloc(ML_DSA_65_SIGNATURE_BYTES + 1).toString('hex');
    expect(detectSignatureAlgorithm(ed63)).toBeNull();
    expect(detectSignatureAlgorithm(ed65)).toBeNull();
    expect(detectSignatureAlgorithm(pq3308)).toBeNull();
    expect(detectSignatureAlgorithm(pq3310)).toBeNull();
  });

  it('classifies exactly at each boundary length', () => {
    expect(detectSignatureAlgorithm(Buffer.alloc(ED25519_SIGNATURE_BYTES).toString('hex'))).toBe('ed25519');
    expect(detectSignatureAlgorithm(Buffer.alloc(ML_DSA_65_SIGNATURE_BYTES).toString('hex'))).toBe('ml-dsa-65');
    expect(detectSignatureAlgorithm('')).toBeNull();
  });
});

describe('verifySignatureCompat — opts.algorithm override', () => {
  it('honors a forced ml-dsa-65 algorithm and uses the ML-DSA key path', async () => {
    const pq = makeMlDsa65();
    const res = await verifySignatureCompat(MESSAGE, pq.signatureHex, { mlDsa65PublicKeyHex: pq.publicKeyHex }, {
      algorithm: 'ml-dsa-65',
    });
    expect(res).toEqual({ valid: true, algorithm: 'ml-dsa-65' });
  });

  it('honors a forced ed25519 algorithm and uses the Ed25519 key path', async () => {
    const ed = await makeEd25519();
    const res = await verifySignatureCompat(MESSAGE, ed.signatureHex, { ed25519PublicKeyHex: ed.publicKeyHex }, {
      algorithm: 'ed25519',
    });
    expect(res).toEqual({ valid: true, algorithm: 'ed25519' });
  });

  it('a forced ed25519 algorithm with only an ML-DSA key present falls through and tries ML-DSA', async () => {
    // The Ed25519 fast-path is skipped (its key is absent); the fallback then
    // tries the ML-DSA key. The ML-DSA signature must still verify under it.
    const pq = makeMlDsa65();
    const res = await verifySignatureCompat(MESSAGE, pq.signatureHex, { mlDsa65PublicKeyHex: pq.publicKeyHex }, {
      algorithm: 'ed25519',
    });
    expect(res).toEqual({ valid: true, algorithm: 'ml-dsa-65' });
  });

  it('the override actually overrides detection: forcing ed25519 on an ML-DSA sig (both keys present) routes to the ed path and fails', async () => {
    // Detection of this signature would yield ml-dsa-65 and verify true. By
    // forcing ed25519 with the ed key present, the ed fast-path runs instead,
    // ed-verifies a 3309-byte signature, fails, and is attributed to ed25519.
    // This is observably different from ignoring opts.algorithm (which would
    // detect ml-dsa-65 and return { valid: true, algorithm: 'ml-dsa-65' }).
    const ed = await makeEd25519();
    const pq = makeMlDsa65();
    const res = await verifySignatureCompat(MESSAGE, pq.signatureHex, {
      ed25519PublicKeyHex: ed.publicKeyHex,
      mlDsa65PublicKeyHex: pq.publicKeyHex,
    }, { algorithm: 'ed25519' });
    expect(res).toEqual({ valid: false, algorithm: 'ed25519' });
  });

  it('a forced ml-dsa-65 algorithm with only an Ed25519 key + Ed25519 sig falls back to Ed25519', async () => {
    // Ed25519 signature, but caller forces ml-dsa-65 with only an Ed25519 key
    // available. The ml-dsa fast-path is skipped (no ml-dsa key); the fallback
    // ml-dsa attempt is absent; the ed fallback verifies the real ed signature.
    const ed = await makeEd25519();
    const res = await verifySignatureCompat(MESSAGE, ed.signatureHex, { ed25519PublicKeyHex: ed.publicKeyHex }, {
      algorithm: 'ml-dsa-65',
    });
    expect(res).toEqual({ valid: true, algorithm: 'ed25519' });
  });
});

describe('verifySignatureCompat — fast-path is decisive (no silent fall-through)', () => {
  // When the algorithm is detected AND the matching key is present, the
  // fast-path's verify result is returned directly — a failed verify reports
  // { valid: false, algorithm: <the detected scheme> } (NOT algorithm: null).
  // This pins that detection routes to exactly one scheme and does not retry.
  it('detected ed25519 with an Ed25519 key: tampered message fails, attributed to ed25519', async () => {
    const ed = await makeEd25519();
    const res = await verifySignatureCompat('not the signed message', ed.signatureHex, {
      ed25519PublicKeyHex: ed.publicKeyHex,
    });
    expect(res).toEqual({ valid: false, algorithm: 'ed25519' });
  });

  it('detected ml-dsa-65 with an ML-DSA key: tampered message fails, attributed to ml-dsa-65', async () => {
    const pq = makeMlDsa65();
    const res = await verifySignatureCompat('not the signed message', pq.signatureHex, {
      mlDsa65PublicKeyHex: pq.publicKeyHex,
    });
    expect(res).toEqual({ valid: false, algorithm: 'ml-dsa-65' });
  });

  it('a valid ed25519 signature is NOT re-attributed to ml-dsa-65 even when the ML-DSA key is also present', async () => {
    // Detection -> ed25519, ed key present -> ed fast-path returns valid:true.
    // The presence of an ML-DSA key must not change attribution.
    const ed = await makeEd25519();
    const pq = makeMlDsa65();
    const res = await verifySignatureCompat(MESSAGE, ed.signatureHex, {
      ed25519PublicKeyHex: ed.publicKeyHex,
      mlDsa65PublicKeyHex: pq.publicKeyHex,
    });
    expect(res).toEqual({ valid: true, algorithm: 'ed25519' });
  });
});

describe('verifySignatureCompat — fallback path (matching key absent)', () => {
  // The fallback loop runs only when the fast-path branch is skipped, i.e. the
  // detected scheme's key is missing. ML-DSA is tried first in that loop.
  it('ML-DSA sig detected as ml-dsa-65 but only an Ed25519 key supplied -> invalid (no ed mis-accept)', async () => {
    const ed = await makeEd25519();
    const pq = makeMlDsa65();
    const res = await verifySignatureCompat(MESSAGE, pq.signatureHex, { ed25519PublicKeyHex: ed.publicKeyHex });
    expect(res).toEqual({ valid: false, algorithm: null });
  });

  it('forcing ed25519 on an ML-DSA sig with only the ML-DSA key present falls back and verifies as ml-dsa-65', async () => {
    // Forced algorithm ed25519, but ed key absent so the ed fast-path is
    // skipped; the fallback loop tries the ML-DSA key (PQ-first) and succeeds.
    const pq = makeMlDsa65();
    const res = await verifySignatureCompat(MESSAGE, pq.signatureHex, { mlDsa65PublicKeyHex: pq.publicKeyHex }, {
      algorithm: 'ed25519',
    });
    expect(res).toEqual({ valid: true, algorithm: 'ml-dsa-65' });
  });
});

describe('verifySignatureCompat — robustness', () => {
  it('does not throw on an empty signature and reports invalid', async () => {
    const ed = await makeEd25519();
    const res = await verifySignatureCompat(MESSAGE, '', { ed25519PublicKeyHex: ed.publicKeyHex });
    expect(res).toEqual({ valid: false, algorithm: null });
  });

  it('does not throw when the public key hex is malformed', async () => {
    const ed = await makeEd25519();
    const res = await verifySignatureCompat(MESSAGE, ed.signatureHex, { ed25519PublicKeyHex: 'zz' });
    expect(res.valid).toBe(false);
  });

  it('an Ed25519-length signature does not verify against an ML-DSA key (no scheme confusion)', async () => {
    const ed = await makeEd25519();
    const pq = makeMlDsa65();
    const res = await verifySignatureCompat(MESSAGE, ed.signatureHex, { mlDsa65PublicKeyHex: pq.publicKeyHex });
    expect(res).toEqual({ valid: false, algorithm: null });
  });
});
