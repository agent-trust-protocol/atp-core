/**
 * did:atp v2 Phase 4 — resolution tests.
 *
 * Covers the DID→URL transformation (did:wba/did:web rules), HTTPS-only
 * fetching, and end-to-end resolve+verify against a real Phase 3 signed
 * did.json served by a mocked fetch.
 */

import { CryptoUtils, HybridKeyPair } from '../../utils/crypto';
import { DidAtp } from '../../utils/did';
import { DidAtpDocument } from '../../utils/did-document';
import { DidAtpResolver, DidResolutionError } from '../../utils/resolver';
import { AtpDidDocument } from '../../types';

const FP = 'A'.repeat(43);

function mockFetch(
  body: unknown,
  init: { status?: number; url?: string } = {}
): typeof fetch {
  return jest.fn(async (input: any) => {
    const status = init.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      url: init.url ?? String(input),
      json: async () => {
        if (typeof body === 'string') return JSON.parse(body);
        return body;
      }
    } as Response;
  }) as unknown as typeof fetch;
}

describe('DidAtpResolver.didToUrl', () => {
  it('maps a root DID to /.well-known/did.json', () => {
    expect(DidAtpResolver.didToUrl('did:atp:example.com')).toBe(
      'https://example.com/.well-known/did.json'
    );
  });

  it('maps a single-path DID to /<path>/did.json without the fingerprints', () => {
    expect(DidAtpResolver.didToUrl(`did:atp:example.com:billing:e1_${FP}:pq1_${FP}`)).toBe(
      'https://example.com/billing/did.json'
    );
  });

  it('maps a multi-path DID to nested path segments', () => {
    expect(
      DidAtpResolver.didToUrl(`did:atp:agents.example.com:user:alice:agent-7:e1_${FP}:pq1_${FP}`)
    ).toBe('https://agents.example.com/user/alice/agent-7/did.json');
  });

  it('decodes a did:web-style %3A port into the URL authority', () => {
    expect(DidAtpResolver.didToUrl(`did:atp:localhost%3A8443:dev:e1_${FP}:pq1_${FP}`)).toBe(
      'https://localhost:8443/dev/did.json'
    );
  });

  it('throws invalidDid for non-did:atp input', () => {
    expect(() => DidAtpResolver.didToUrl('did:web:example.com')).toThrow(DidResolutionError);
    expect(() => DidAtpResolver.didToUrl('not a did')).toThrow(/not a valid did:atp/i);
  });
});

describe('DidAtpResolver.fetchDidJson', () => {
  it('rejects http:// URLs before any network I/O', async () => {
    const fetchSpy = mockFetch({});
    await expect(
      DidAtpResolver.fetchDidJson('http://example.com/did.json', { fetch: fetchSpy })
    ).rejects.toMatchObject({ code: 'insecureUrl' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects an https→http redirect via the response final URL', async () => {
    const doc = { id: 'did:atp:example.com' };
    await expect(
      DidAtpResolver.fetchDidJson('https://example.com/did.json', {
        fetch: mockFetch(doc, { url: 'http://example.com/did.json' })
      })
    ).rejects.toMatchObject({ code: 'insecureUrl' });
  });

  it('rejects non-2xx responses', async () => {
    await expect(
      DidAtpResolver.fetchDidJson('https://example.com/did.json', {
        fetch: mockFetch({}, { status: 404 })
      })
    ).rejects.toMatchObject({ code: 'notFound' });
  });

  it('rejects bodies that are not DID Documents', async () => {
    await expect(
      DidAtpResolver.fetchDidJson('https://example.com/did.json', {
        fetch: mockFetch({ hello: 'world' })
      })
    ).rejects.toMatchObject({ code: 'invalidDidDocument' });
  });
});

describe('DidAtpResolver.resolve (end-to-end with Phase 3 documents)', () => {
  let keyPair: HybridKeyPair;
  let did: string;
  let document: AtpDidDocument;

  beforeAll(async () => {
    keyPair = await CryptoUtils.generateHybridKeyPair();
    const created = await DidAtpDocument.create('agents.example.com', ['billing'], keyPair);
    did = created.did;
    document = created.document;
  });

  it('resolves and dual-verifies a valid signed did.json', async () => {
    const fetchSpy = mockFetch(document);
    const result = await DidAtpResolver.resolve(did, { fetch: fetchSpy });
    expect(result.did).toBe(did);
    expect(result.documentUrl).toBe('https://agents.example.com/billing/did.json');
    expect(result.document.id).toBe(did);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://agents.example.com/billing/did.json',
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  it('refuses to resolve root DIDs (no binding material)', async () => {
    await expect(
      DidAtpResolver.resolve('did:atp:example.com', { fetch: mockFetch(document) })
    ).rejects.toMatchObject({ code: 'invalidDid' });
  });

  it('fails when the served document id differs from the requested DID', async () => {
    const otherKeys = await CryptoUtils.generateHybridKeyPair();
    const requested = DidAtp.fromPublicKeys(
      'agents.example.com',
      ['billing'],
      otherKeys.ed25519.publicKey,
      otherKeys.mlDsa65.publicKey
    );
    // Same URL, but the host serves a document for a different DID.
    await expect(
      DidAtpResolver.resolve(requested, { fetch: mockFetch(document) })
    ).rejects.toMatchObject({ code: 'didMismatch' });
  });

  it('fails on fingerprint mismatch (substituted classical key)', async () => {
    const otherKeys = await CryptoUtils.generateHybridKeyPair();
    const tampered: AtpDidDocument = {
      ...document,
      verificationMethod: [
        {
          ...document.verificationMethod![0],
          publicKeyMultibase: DidAtpDocument.ed25519ToMultibase(otherKeys.ed25519.publicKey)
        },
        document.verificationMethod![1]
      ]
    };
    await expect(
      DidAtpResolver.resolve(did, { fetch: mockFetch(tampered) })
    ).rejects.toMatchObject({ code: 'verificationFailed' });
  });

  it('fails when either proof is invalid (tampered document content)', async () => {
    const tampered: AtpDidDocument = {
      ...document,
      service: [{ id: `${did}#evil`, type: 'Evil', serviceEndpoint: 'https://evil.example' }]
    };
    await expect(
      DidAtpResolver.resolve(did, { fetch: mockFetch(tampered) })
    ).rejects.toMatchObject({ code: 'verificationFailed' });
  });

  it('fails when the PQ proof is stripped (classical alone is insufficient)', async () => {
    const { atpPqProof: _pq, ...stripped } = document;
    await expect(
      DidAtpResolver.resolve(did, { fetch: mockFetch(stripped) })
    ).rejects.toMatchObject({ code: 'verificationFailed' });
  });
});
