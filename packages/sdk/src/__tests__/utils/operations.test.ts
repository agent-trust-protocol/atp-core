/**
 * did:atp v2 Phase 5 — method operations tests.
 *
 * Update (rotation): rotating either binding key changes the DID — the old
 * identifier is never updated in place. Deactivate (did:wba convention):
 * the controller stops serving did.json, so resolution fails with
 * DidResolutionError('notFound').
 */

import { CryptoUtils, HybridKeyPair } from '../../utils/crypto';
import { DidAtp } from '../../utils/did';
import { DidAtpDocument } from '../../utils/did-document';
import { DidAtpResolver } from '../../utils/resolver';

function mockFetch(
  body: unknown,
  init: { status?: number; url?: string } = {}
): typeof fetch {
  return jest.fn(async (input: any) => {
    const status = init.status ?? 200;
    const bodyText = typeof body === 'string' ? body : JSON.stringify(body);
    return {
      ok: status >= 200 && status < 300,
      status,
      url: init.url ?? String(input),
      headers: new Headers({ 'content-length': String(Buffer.byteLength(bodyText, 'utf8')) }),
      text: async () => bodyText,
      json: async () => body
    } as Response;
  }) as unknown as typeof fetch;
}

describe('DidAtpDocument.rotate (Update: rotation changes the DID)', () => {
  let oldKeyPair: HybridKeyPair;
  let newKeyPair: HybridKeyPair;
  let oldDid: string;

  beforeAll(async () => {
    oldKeyPair = await CryptoUtils.generateHybridKeyPair();
    newKeyPair = await CryptoUtils.generateHybridKeyPair();
    const created = await DidAtpDocument.create('agents.example.com', ['user', 'alice'], oldKeyPair);
    oldDid = created.did;
  });

  it('produces a NEW DID with the same domain and path — never in place', async () => {
    const rotated = await DidAtpDocument.rotate(oldDid, newKeyPair);
    expect(rotated.previousDid).toBe(oldDid);
    expect(rotated.did).not.toBe(oldDid);

    const parsedOld = DidAtp.parse(oldDid)!;
    const parsedNew = DidAtp.parse(rotated.did)!;
    expect(parsedNew.domain).toBe(parsedOld.domain);
    expect(parsedNew.path).toEqual(parsedOld.path);
    expect(parsedNew.e1).not.toBe(parsedOld.e1);
    expect(parsedNew.pq1).not.toBe(parsedOld.pq1);
  });

  it('produces a freshly dual-signed document that passes full verification', async () => {
    const rotated = await DidAtpDocument.rotate(oldDid, newKeyPair);
    expect(rotated.document.id).toBe(rotated.did);
    const { valid, errors } = await DidAtpDocument.verify(rotated.document);
    expect(errors).toEqual([]);
    expect(valid).toBe(true);
  });

  it('old DID no longer matches the new keys (and vice versa)', async () => {
    const rotated = await DidAtpDocument.rotate(oldDid, newKeyPair);
    expect(
      DidAtp.matchesPublicKeys(oldDid, newKeyPair.ed25519.publicKey, newKeyPair.mlDsa65.publicKey)
    ).toBe(false);
    expect(
      DidAtp.matchesPublicKeys(rotated.did, oldKeyPair.ed25519.publicKey, oldKeyPair.mlDsa65.publicKey)
    ).toBe(false);
    expect(
      DidAtp.matchesPublicKeys(rotated.did, newKeyPair.ed25519.publicKey, newKeyPair.mlDsa65.publicKey)
    ).toBe(true);
  });

  it('rejects rotation to the same key material (same DID)', async () => {
    await expect(DidAtpDocument.rotate(oldDid, oldKeyPair)).rejects.toThrow(
      /same DID/
    );
  });

  it('rejects rotation of root or invalid DIDs', async () => {
    await expect(DidAtpDocument.rotate('did:atp:example.com', newKeyPair)).rejects.toThrow(
      /path-type/
    );
    await expect(DidAtpDocument.rotate('did:web:example.com', newKeyPair)).rejects.toThrow(
      /path-type/
    );
  });

  it('resolving the OLD DID against the rotated did.json fails', async () => {
    const rotated = await DidAtpDocument.rotate(oldDid, newKeyPair);
    // The controller now serves the rotated document at the same path.
    const fetch = mockFetch(rotated.document);
    await expect(DidAtpResolver.resolve(oldDid, { fetch })).rejects.toMatchObject({
      name: 'DidResolutionError',
      code: 'didMismatch'
    });
    // The new DID resolves fine against the same served document.
    const result = await DidAtpResolver.resolve(rotated.did, { fetch });
    expect(result.document.id).toBe(rotated.did);
  });
});

describe('Deactivate (did:wba convention: stop serving did.json)', () => {
  it('a deactivated DID (did.json now 404) fails resolution with notFound', async () => {
    const keyPair = await CryptoUtils.generateHybridKeyPair();
    const { did } = await DidAtpDocument.create('agents.example.com', ['user', 'bob'], keyPair);

    const fetch = mockFetch({ error: 'not found' }, { status: 404 });
    await expect(DidAtpResolver.resolve(did, { fetch })).rejects.toMatchObject({
      name: 'DidResolutionError',
      code: 'notFound'
    });
  });

  it('notFound is also the outcome for a network-unreachable host', async () => {
    const keyPair = await CryptoUtils.generateHybridKeyPair();
    const { did } = await DidAtpDocument.create('gone.example.com', ['agent'], keyPair);

    const failingFetch = jest.fn(async () => {
      throw new Error('getaddrinfo ENOTFOUND gone.example.com');
    }) as unknown as typeof fetch;
    await expect(DidAtpResolver.resolve(did, { fetch: failingFetch })).rejects.toMatchObject({
      code: 'notFound'
    });
  });
});

describe('Verify hardening (malformed verification methods are reported, not thrown)', () => {
  it('a wrong-length ML-DSA-65 public key returns { valid: false } instead of throwing', async () => {
    const keyPair = await CryptoUtils.generateHybridKeyPair();
    const { document } = await DidAtpDocument.create('agents.example.com', ['user', 'eve'], keyPair);

    // Corrupt the post-quantum AKP JWK with a public key that base64url-decodes
    // to far fewer than the required 1952 bytes. This previously made
    // pq1Fingerprint() throw an unguarded Error out of verify().
    const tampered = JSON.parse(JSON.stringify(document));
    const pqVm = tampered.verificationMethod.find((vm: any) => vm.type === 'JsonWebKey');
    pqVm.publicKeyJwk.pub = Buffer.from([1, 2, 3]).toString('base64url');

    const result = await DidAtpDocument.verify(tampered);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /invalid ML-DSA-65 public key/i.test(e))).toBe(true);
  });

  it('resolve() surfaces the same malformed key as a DidResolutionError, not a raw throw', async () => {
    const keyPair = await CryptoUtils.generateHybridKeyPair();
    const { did, document } = await DidAtpDocument.create('agents.example.com', ['user', 'mallory'], keyPair);

    const tampered = JSON.parse(JSON.stringify(document));
    const pqVm = tampered.verificationMethod.find((vm: any) => vm.type === 'JsonWebKey');
    pqVm.publicKeyJwk.pub = Buffer.from([9, 9, 9, 9]).toString('base64url');

    const fetch = mockFetch(tampered);
    await expect(DidAtpResolver.resolve(did, { fetch })).rejects.toMatchObject({
      name: 'DidResolutionError',
      code: 'verificationFailed'
    });
  });
});
