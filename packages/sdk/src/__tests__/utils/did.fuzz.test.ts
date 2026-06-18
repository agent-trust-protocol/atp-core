/**
 * Property-based / fuzz + adversarial tests for DIDUtils.
 *
 * NOTE: did.test.ts mocks CryptoUtils. This suite deliberately does NOT mock
 * crypto — it exercises the real parse/validate logic and a real
 * generate -> sign -> verify round trip, so the assertions reflect actual
 * cryptographic behaviour.
 */

import fc from 'fast-check';
import { DIDUtils } from '../../utils/did';

jest.setTimeout(60000);

// The parser regex (mirrored from did.ts for reference):
//   /^did:([^:]+):([^:]+):([^#]+)(?:#(.+))?$/
// Segment chars that are always safe (no ':' and no '#'), printable ASCII.
const segChar = fc
  .integer({ min: 0x21, max: 0x7e })
  .map((c) => String.fromCharCode(c))
  .filter((c) => c !== ':' && c !== '#');

const segment = fc.array(segChar, { minLength: 1, maxLength: 12 }).map((cs) => cs.join(''));

describe('DIDUtils.parseDID — total function (never throws)', () => {
  it('returns an object or null for arbitrary unicode / garbage, never throws', () => {
    fc.assert(
      fc.property(fc.fullUnicodeString(), (s) => {
        const result = DIDUtils.parseDID(s);
        return result === null || (typeof result === 'object');
      }),
      { numRuns: 200 }
    );
  });

  it('isValidDID never throws and agrees with parseDID', () => {
    fc.assert(
      fc.property(fc.fullUnicodeString(), (s) => {
        return DIDUtils.isValidDID(s) === (DIDUtils.parseDID(s) !== null);
      }),
      { numRuns: 200 }
    );
  });
});

describe('DIDUtils.parseDID — round-trip on valid triples', () => {
  it('parses did:<m>:<n>:<id> into exactly those parts (no fragment)', () => {
    fc.assert(
      fc.property(segment, segment, segment, (m, n, id) => {
        const did = `did:${m}:${n}:${id}`;
        const parsed = DIDUtils.parseDID(did);
        if (parsed === null) return false;
        return (
          parsed.method === m &&
          parsed.network === n &&
          parsed.identifier === id &&
          parsed.fragment === undefined &&
          DIDUtils.isValidDID(did) === true
        );
      }),
      { numRuns: 100 }
    );
  });

  it('parses a fragment after # correctly', () => {
    fc.assert(
      fc.property(segment, segment, segment, fc.string({ minLength: 1 }).filter((f) => !f.includes('\n')), (m, n, id, frag) => {
        const did = `did:${m}:${n}:${id}#${frag}`;
        const parsed = DIDUtils.parseDID(did);
        if (parsed === null) {
          // The identifier group is [^#]+, so any '#' in id terminates it; a fragment
          // with characters is matched by (?:#(.+)). With our constraints this should parse.
          return false;
        }
        return parsed.method === m && parsed.network === n && parsed.identifier === id && parsed.fragment === frag;
      }),
      { numRuns: 100 }
    );
  });
});

describe('DIDUtils.parseDID — adversarial / malformed inputs', () => {
  it('rejects strings without the did: prefix', () => {
    fc.assert(
      fc.property(segment, segment, segment, (m, n, id) => {
        // Replace the literal "did" method with something else and drop prefix.
        return DIDUtils.parseDID(`xid:${m}:${n}:${id}`) === null;
      }),
      { numRuns: 50 }
    );
  });

  it('rejects empty method segment (did::network:id)', () => {
    fc.assert(
      fc.property(segment, segment, (n, id) => {
        // method group is [^:]+ so empty method must fail.
        return DIDUtils.parseDID(`did::${n}:${id}`) === null;
      }),
      { numRuns: 50 }
    );
  });

  it('rejects missing identifier segment (did:method:network)', () => {
    fc.assert(
      fc.property(segment, segment, (m, n) => {
        return DIDUtils.parseDID(`did:${m}:${n}`) === null;
      }),
      { numRuns: 50 }
    );
  });

  it('handles an extra colon: it becomes part of the identifier group ([^#]+ allows ":")', () => {
    fc.assert(
      fc.property(segment, segment, segment, segment, (m, n, a, b) => {
        // did:m:n:a:b  -> method=m, network=n, identifier="a:b" (greedy [^#]+).
        const parsed = DIDUtils.parseDID(`did:${m}:${n}:${a}:${b}`);
        if (parsed === null) return false;
        return parsed.method === m && parsed.network === n && parsed.identifier === `${a}:${b}`;
      }),
      { numRuns: 50 }
    );
  });

  it('rejects fully empty / prefix-only strings', () => {
    expect(DIDUtils.parseDID('')).toBeNull();
    expect(DIDUtils.parseDID('did:')).toBeNull();
    expect(DIDUtils.parseDID('did:atp')).toBeNull();
    expect(DIDUtils.parseDID('did:atp:')).toBeNull();
    expect(DIDUtils.parseDID('did:atp:mainnet')).toBeNull();
    expect(DIDUtils.parseDID('did:atp:mainnet:')).toBeNull(); // identifier group [^#]+ requires >=1 char
  });
});

describe('DIDUtils.validateDIDDocument — adversarial structure checks', () => {
  const baseDoc = () => ({
    id: 'did:atp:mainnet:abc123',
    '@context': ['https://www.w3.org/ns/did/v1'],
    verificationMethod: [
      {
        id: 'did:atp:mainnet:abc123#key-1',
        type: 'Ed25519VerificationKey2020',
        controller: 'did:atp:mainnet:abc123',
        publicKeyMultibase: 'zABC'
      }
    ],
    authentication: ['did:atp:mainnet:abc123#key-1']
  });

  it('a complete document is valid with no errors', () => {
    const res = DIDUtils.validateDIDDocument(baseDoc());
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it('reports missing id', () => {
    const doc: any = baseDoc();
    delete doc.id;
    const res = DIDUtils.validateDIDDocument(doc);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Missing or invalid id');
  });

  it('reports missing / non-array @context', () => {
    const doc: any = baseDoc();
    doc['@context'] = 'not-an-array';
    const res = DIDUtils.validateDIDDocument(doc);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Missing or invalid @context');
  });

  it('reports missing verificationMethod', () => {
    const doc: any = baseDoc();
    delete doc.verificationMethod;
    const res = DIDUtils.validateDIDDocument(doc);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Missing or invalid verificationMethod');
  });

  it('reports missing authentication', () => {
    const doc: any = baseDoc();
    delete doc.authentication;
    const res = DIDUtils.validateDIDDocument(doc);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Missing or invalid authentication');
  });

  it('reports a malformed verification method (missing id/type/controller)', () => {
    const doc: any = baseDoc();
    doc.verificationMethod = [{ publicKeyMultibase: 'zABC' }];
    const res = DIDUtils.validateDIDDocument(doc);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Invalid verification method at index 0');
  });

  it('reports a verification method lacking any public key material', () => {
    const doc: any = baseDoc();
    doc.verificationMethod = [
      { id: 'x#key-1', type: 'Ed25519VerificationKey2020', controller: 'x' }
    ];
    const res = DIDUtils.validateDIDDocument(doc);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Missing public key in verification method at index 0');
  });

  it('never throws on arbitrary object-ish inputs and returns the expected shape', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.option(fc.string(), { nil: undefined }),
          '@context': fc.oneof(fc.constant(undefined), fc.array(fc.string()), fc.string()),
          verificationMethod: fc.oneof(fc.constant(undefined), fc.array(fc.object())),
          authentication: fc.oneof(fc.constant(undefined), fc.array(fc.string()))
        }),
        (doc) => {
          const res = DIDUtils.validateDIDDocument(doc as any);
          return typeof res.valid === 'boolean' && Array.isArray(res.errors);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('a freshly generated DID document is structurally valid', async () => {
    const { document } = await DIDUtils.generateDID();
    const res = DIDUtils.validateDIDDocument(document);
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
  });
});

describe('DIDUtils — generate -> sign -> verify round trip (real crypto)', () => {
  it('verifies a correctly signed document and rejects a mutated one', async () => {
    const { document, keyPair } = await DIDUtils.generateDID();
    const signed = await DIDUtils.signDIDDocument(document, keyPair.privateKey);

    expect(await DIDUtils.verifyDIDDocument(signed)).toBe(true);

    // Mutate the signed document body (not the proof) -> signature must no longer verify.
    const mutated = { ...signed, id: signed.id + '#tampered' } as any;
    expect(await DIDUtils.verifyDIDDocument(mutated)).toBe(false);
  });

  it('verify returns false when there is no proof', async () => {
    const { document } = await DIDUtils.generateDID();
    expect(await DIDUtils.verifyDIDDocument(document)).toBe(false);
  });

  it('verify returns false when the proofValue is tampered', async () => {
    const { document, keyPair } = await DIDUtils.generateDID();
    const signed: any = await DIDUtils.signDIDDocument(document, keyPair.privateKey);
    // Flip first hex char of the proof value.
    const pv: string = signed.proof.proofValue;
    signed.proof.proofValue = (pv[0] === '0' ? '1' : '0') + pv.slice(1);
    expect(await DIDUtils.verifyDIDDocument(signed)).toBe(false);
  });
});
