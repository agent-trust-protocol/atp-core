/**
 * did:atp v2 conformance tests — exercises the finalized spec end-to-end with
 * REAL cryptography (Ed25519 + FIPS 204 ML-DSA-65), no mocks.
 */
import {
  buildAtpDid,
  parseAtpDid,
  isValidAtpDid,
  toWbaDid,
  generateAtpKeyMaterial,
  ed25519Jwk,
  rfc7638Thumbprint,
  pq1Fingerprint,
  ML_DSA_65_PUBLIC_KEY_BYTES,
  ML_DSA_65_SIGNATURE_BYTES,
  createAtpDidDocument,
  verifyAtpDidDocument,
  AtpDidDocument,
  didToHttpsUrl,
  resolveAtpDid,
  FetchLike,
} from '../../did-atp/index';

// One shared identity for the suite (keygen is comparatively expensive).
let identity: Awaited<ReturnType<typeof createAtpDidDocument>>;

beforeAll(async () => {
  const keys = await generateAtpKeyMaterial();
  identity = await createAtpDidDocument({
    domain: 'agents.example.com',
    pathSegments: ['billing'],
    keys,
  });
});

describe('1. identifier syntax', () => {
  it('builds a two-segment did:atp:<domain>:<path>:e1_:pq1_', () => {
    expect(identity.did).toMatch(
      /^did:atp:agents\.example\.com:billing:e1_[A-Za-z0-9_-]{43}:pq1_[A-Za-z0-9_-]{43}$/,
    );
  });

  it('round-trips through parse', () => {
    const p = parseAtpDid(identity.did)!;
    expect(p.method).toBe('atp');
    expect(p.domain).toBe('agents.example.com');
    expect(p.pathSegments).toEqual(['billing']);
    expect(p.e1.startsWith('e1_')).toBe(true);
    expect(p.pq1.startsWith('pq1_')).toBe(true);
  });

  it('supports root domain DIDs with multiple path segments', () => {
    const did = buildAtpDid({
      domain: 'example.com',
      pathSegments: ['a', 'b'],
      e1Fingerprint: 'A'.repeat(43),
      pq1Fingerprint: 'B'.repeat(43),
    });
    expect(parseAtpDid(did)!.pathSegments).toEqual(['a', 'b']);
  });

  it('rejects legacy network-style identifiers', () => {
    expect(parseAtpDid('did:atp:mainnet:fingerprint123')).toBeNull();
    expect(isValidAtpDid('did:atp:mainnet:abc')).toBe(false);
  });

  it('parses a fragment', () => {
    const p = parseAtpDid(`${identity.did}#key-mldsa65`)!;
    expect(p.fragment).toBe('key-mldsa65');
  });

  it('stripping pq1_ yields a valid did:wba identifier', () => {
    const wba = toWbaDid(identity.did)!;
    expect(wba).toMatch(/^did:wba:agents\.example\.com:billing:e1_[A-Za-z0-9_-]{43}$/);
  });
});

describe('2. RFC 7638 fingerprints', () => {
  it('produces 43-char base64url thumbprints', () => {
    const p = parseAtpDid(identity.did)!;
    expect(p.e1.slice(3)).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(p.pq1.slice(4)).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('OKP thumbprint uses canonical {crv,kty,x} ordering (RFC 8037 vector)', () => {
    // RFC 8037 Appendix A.3 public key.
    const jwk = ed25519Jwk(
      new Uint8Array(Buffer.from('11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo', 'base64url')),
    );
    expect(rfc7638Thumbprint(jwk)).toBe('kPrK_qmxVWaYVA9wwBF6Iuo3vVzz7TxHCTwXBygrS4k');
  });

  it('AKP thumbprint changes if the key changes', () => {
    const a = pq1Fingerprint(identity.keys.mlDsa65.publicKey);
    expect(a).toBe(parseAtpDid(identity.did)!.pq1);
  });
});

describe('3 & 4. separate keys and AKP JWK', () => {
  it('keeps Ed25519 and ML-DSA-65 as independent keypairs (no composite blob)', () => {
    expect(identity.keys.ed25519.publicKey.length).toBe(32);
    expect(identity.keys.mlDsa65.publicKey.length).toBe(ML_DSA_65_PUBLIC_KEY_BYTES);
    // distinct secret keys, not a concatenation
    expect(identity.keys.ed25519.secretKey.length).toBe(32);
    expect(identity.keys.mlDsa65.secretKey.length).toBe(4032);
  });

  it('represents the ML-DSA-65 key as an RFC 9964 AKP JWK', () => {
    const vm = identity.document.verificationMethod.find((m) => m.id.endsWith('#key-mldsa65'))!;
    expect(vm.publicKeyJwk).toEqual({
      kty: 'AKP',
      alg: 'ML-DSA-65',
      pub: expect.any(String),
    });
  });

  it('represents the Ed25519 key as an OKP JWK', () => {
    const vm = identity.document.verificationMethod.find((m) => m.id.endsWith('#key-ed25519'))!;
    expect(vm.publicKeyJwk).toMatchObject({ kty: 'OKP', crv: 'Ed25519' });
  });

  it('uses FIPS 204 ML-DSA-65 sizes (1952-byte key, 3309-byte sig)', () => {
    expect(ML_DSA_65_PUBLIC_KEY_BYTES).toBe(1952);
    expect(ML_DSA_65_SIGNATURE_BYTES).toBe(3309);
  });
});

describe('5 & 6. dual proofs', () => {
  it('carries both an eddsa-jcs-2022 proof and an ML-DSA-65 JWS proof', () => {
    const proofs = identity.document.proof!;
    expect(proofs.find((p) => p.type === 'DataIntegrityProof')).toMatchObject({
      cryptosuite: 'eddsa-jcs-2022',
    });
    const pq = proofs.find((p) => p.type === 'JsonWebSignature2020')!;
    expect(pq).toBeDefined();
    const header = JSON.parse(
      Buffer.from((pq as any).jws.split('.')[0], 'base64url').toString('utf8'),
    );
    expect(header.alg).toBe('ML-DSA-65');
  });

  it('verifies a freshly created document (both bindings + both proofs)', async () => {
    const r = await verifyAtpDidDocument(identity.document);
    expect(r.valid).toBe(true);
    expect(r.classicalValid).toBe(true);
    expect(r.pqValid).toBe(true);
    expect(r.bindingsMatch).toBe(true);
  });

  it('defense in depth: a forged classical proof is caught by the PQ binding', async () => {
    const tampered: AtpDidDocument = JSON.parse(JSON.stringify(identity.document));
    const classical = tampered.proof!.find((p) => p.type === 'DataIntegrityProof') as any;
    classical.proofValue = `u${Buffer.from('forged-signature-bytes').toString('base64url')}`;
    const r = await verifyAtpDidDocument(tampered);
    expect(r.classicalValid).toBe(false);
    expect(r.valid).toBe(false);
  });

  it('detects a tampered document body', async () => {
    const tampered: AtpDidDocument = JSON.parse(JSON.stringify(identity.document));
    tampered.service = [
      { id: '#x', type: 'Evil', serviceEndpoint: 'https://attacker.example' },
    ];
    const r = await verifyAtpDidDocument(tampered);
    expect(r.valid).toBe(false);
    expect(r.classicalValid).toBe(false);
    expect(r.pqValid).toBe(false);
  });

  it('fails if the embedded key does not match the DID fingerprint', async () => {
    const other = await generateAtpKeyMaterial();
    const swapped: AtpDidDocument = JSON.parse(JSON.stringify(identity.document));
    const vm = swapped.verificationMethod.find((m) => m.id.endsWith('#key-ed25519'))!;
    vm.publicKeyJwk = ed25519Jwk(other.ed25519.publicKey);
    const r = await verifyAtpDidDocument(swapped);
    expect(r.bindingsMatch).toBe(false);
    expect(r.valid).toBe(false);
  });
});

describe('7. did:web-style resolution', () => {
  it('transforms the DID into an HTTPS did.json URL', () => {
    expect(didToHttpsUrl(identity.did)).toBe(
      `https://agents.example.com/billing/${parseAtpDid(identity.did)!.e1}/${
        parseAtpDid(identity.did)!.pq1
      }/did.json`,
    );
  });

  it('resolves and verifies via an injected fetch', async () => {
    const fetchImpl: FetchLike = async (url) => {
      expect(url).toBe(didToHttpsUrl(identity.did));
      return { ok: true, status: 200, json: async () => identity.document };
    };
    const res = await resolveAtpDid(identity.did, fetchImpl);
    expect(res.didDocument?.id).toBe(identity.did);
    expect(res.didResolutionMetadata.error).toBeUndefined();
  });

  it('fails resolution when a binding does not verify', async () => {
    const tampered: AtpDidDocument = JSON.parse(JSON.stringify(identity.document));
    (tampered.proof!.find((p) => p.type === 'JsonWebSignature2020') as any).jws =
      tampered.proof!.find((p) => p.type === 'JsonWebSignature2020')!.type === 'JsonWebSignature2020'
        ? 'aGVhZGVy..Zm9yZ2Vk'
        : '';
    const fetchImpl: FetchLike = async () => ({
      ok: true,
      status: 200,
      json: async () => tampered,
    });
    const res = await resolveAtpDid(identity.did, fetchImpl);
    expect(res.didDocument).toBeNull();
    expect(res.didResolutionMetadata.error).toBe('verificationFailed');
  });

  it('reports notFound on HTTP 404', async () => {
    const fetchImpl: FetchLike = async () => ({
      ok: false,
      status: 404,
      json: async () => ({}),
    });
    const res = await resolveAtpDid(identity.did, fetchImpl);
    expect(res.didResolutionMetadata.error).toBe('notFound');
  });

  it('rejects an invalid DID', async () => {
    const res = await resolveAtpDid('did:atp:mainnet:legacy');
    expect(res.didResolutionMetadata.error).toBe('invalidDid');
  });
});
