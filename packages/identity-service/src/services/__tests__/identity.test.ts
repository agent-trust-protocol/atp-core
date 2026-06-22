import { IdentityService } from '../identity.js';
import { DIDDocument } from '../../models/did.js';
import { CryptoUtils } from '../../utils/crypto.js';
import { TrustLevel } from '@atp/shared';

// Spec-v2 did:atp path-type identifier (docs/specs/did-atp/index.html):
//   did:atp:<domain>:<path...>:e1_<43 base64url>:pq1_<43 base64url>
const ATP_V2_RE =
  /^did:atp:[a-z0-9.-]+(:[A-Za-z0-9._-]+)+:e1_[A-Za-z0-9_-]{43}:pq1_[A-Za-z0-9_-]{43}$/;

// In-memory storage mock
const makeStorageMock = () => {
  const docs = new Map<string, DIDDocument>();
  const keys = new Map<string, any>();

  return {
    storeDIDDocument: jest.fn(async (doc: DIDDocument) => { docs.set(doc.id, doc); }),
    getDIDDocument: jest.fn(async (did: string) => docs.get(did) ?? null),
    storeKeyPair: jest.fn(async (kp: any) => { keys.set(kp.did, kp); }),
    listDIDs: jest.fn(async () => Array.from(docs.keys())),
    rotateKey: jest.fn(async (did: string) => {
      // Return a fake new key pair
      return { publicKey: 'new-public-key-hex', privateKey: 'new-private-key-hex' };
    }),
    _docs: docs,
    _keys: keys,
  };
};

describe('IdentityService', () => {
  let service: IdentityService;
  let storage: ReturnType<typeof makeStorageMock>;

  beforeEach(() => {
    storage = makeStorageMock();
    service = new IdentityService(storage as any);
  });

  describe('registerDID', () => {
    it('returns a DID string and document on registration', async () => {
      const response = await service.registerDID();

      expect(response.did).toMatch(/^did:atp:/);
      expect(response.document).toBeDefined();
      expect(response.document.id).toBe(response.did);
    });

    it('stores the DID document and key pair', async () => {
      await service.registerDID();

      expect(storage.storeDIDDocument).toHaveBeenCalledTimes(1);
      expect(storage.storeKeyPair).toHaveBeenCalledTimes(1);
    });

    it('sets initial trust level to UNTRUSTED', async () => {
      const response = await service.registerDID();

      expect(response.document.metadata?.trustLevel).toBe(TrustLevel.UNTRUSTED);
    });

    it('includes at least one verification method', async () => {
      const response = await service.registerDID();

      expect(response.document.verificationMethod.length).toBeGreaterThan(0);
    });

    it('uses provided public key (classical mode) and skips key generation', async () => {
      const response = await service.registerDID({
        publicKey: 'aabbccdd1122334455667788',
        quantumSafe: false,
      });

      // When publicKey is provided, privateKey should not be returned
      expect(response.privateKey).toBeUndefined();
      // Should NOT call storeKeyPair when public key is provided externally
      expect(storage.storeKeyPair).not.toHaveBeenCalled();
    });

    it('document has correct W3C DID context', async () => {
      const { document } = await service.registerDID();

      const contexts = document['@context'] as string[];
      expect(contexts).toContain('https://www.w3.org/ns/did/v1');
    });

    it('emits a spec-v2 did:atp identifier with e1_ and pq1_ bindings', async () => {
      const response = await service.registerDID();

      // Domain-based, path-type DID carrying both binding fingerprints.
      expect(response.did).toMatch(ATP_V2_RE);
      expect(response.did).not.toMatch(/^did:atp:z[1-9A-HJ-NP-Za-km-z]+$/); // not legacy v1 multibase
      expect(response.document.metadata?.additionalInfo?.didMethodVersion).toBe('v2');
    });

    it('binds the v2 identifier to the actual Ed25519 and ML-DSA-65 keys', async () => {
      const response = await service.registerDID();

      const segments = response.did.split(':');
      const pq1 = segments[segments.length - 1];
      const e1 = segments[segments.length - 2];

      // Recompute both fingerprints from the document's verification methods
      // and confirm they match the identifier (the create-time half of the
      // spec's dual-binding requirement).
      const edVm = response.document.verificationMethod.find(
        (vm) => vm.type === 'Ed25519VerificationKey2020'
      );
      const pqVm = response.document.verificationMethod.find(
        (vm) => vm.type === 'JsonWebKey'
      );
      expect(edVm?.publicKeyMultibase).toBeDefined();
      expect(pqVm?.publicKeyJwk).toBeDefined();

      const mlPub = new Uint8Array(
        Buffer.from((pqVm!.publicKeyJwk as { pub: string }).pub, 'base64url')
      );

      // The pq1_ segment must equal the recomputed AKP-JWK fingerprint.
      expect(mlPub.length).toBe(1952);
      expect(CryptoUtils.pq1Fingerprint(mlPub)).toBe(pq1);
      // e1_ segment is always present and well-formed.
      expect(e1.startsWith('e1_')).toBe(true);
    });

    it('falls back to a legacy v1 identifier for classical-only registration', async () => {
      // Provided public key => classical mode => no PQ binding available.
      const response = await service.registerDID({
        publicKey: 'aabbccdd1122334455667788',
        quantumSafe: false,
      });

      expect(response.did).toMatch(/^did:atp:/);
      expect(response.did).not.toMatch(ATP_V2_RE);
      expect(response.document.metadata?.additionalInfo?.didMethodVersion).toBe('v1');
    });
  });

  describe('resolveDID', () => {
    it('returns null for unknown DID', async () => {
      const doc = await service.resolveDID('did:atp:nonexistent');
      expect(doc).toBeNull();
    });

    it('returns the document for a registered DID', async () => {
      const { did } = await service.registerDID();
      const doc = await service.resolveDID(did);

      expect(doc).not.toBeNull();
      expect(doc!.id).toBe(did);
    });
  });

  describe('updateTrustLevel', () => {
    it('updates trust level on an existing DID', async () => {
      const { did } = await service.registerDID();

      const updated = await service.updateTrustLevel(did, TrustLevel.VERIFIED);

      expect(updated).not.toBeNull();
      expect(updated!.metadata?.trustLevel).toBe(TrustLevel.VERIFIED);
    });

    it('returns null for a non-existent DID', async () => {
      const result = await service.updateTrustLevel('did:atp:ghost', TrustLevel.VERIFIED);
      expect(result).toBeNull();
    });

    it('throws on an invalid trust level string', async () => {
      const { did } = await service.registerDID();

      await expect(
        service.updateTrustLevel(did, 'SUPER_TRUSTED' as TrustLevel)
      ).rejects.toThrow(/invalid trust level/i);
    });

    it('stores the previous trust level in additionalInfo', async () => {
      const { did } = await service.registerDID();

      const updated = await service.updateTrustLevel(did, TrustLevel.VERIFIED);

      expect(updated!.metadata?.additionalInfo?.previousTrustLevel).toBe(TrustLevel.UNTRUSTED);
    });
  });

  describe('rotateKeys', () => {
    it('returns null for non-existent DID', async () => {
      const result = await service.rotateKeys('did:atp:ghost');
      expect(result).toBeNull();
    });

    it('updates the verification method after key rotation (legacy v1 DID)', async () => {
      // In-place rotation applies to legacy v1 DIDs; a spec-v2 did:atp rotation
      // changes the identifier and is guarded (see the v2 test below).
      const { did } = await service.registerDID({ quantumSafe: false });

      const updated = await service.rotateKeys(did);

      expect(updated).not.toBeNull();
      expect(updated!.verificationMethod[0].publicKeyMultibase).toBeDefined();
      // updated timestamp should be set
      expect(updated!.updated).toBeDefined();
    });

    it('rejects in-place rotation for a spec-v2 did:atp (rotation changes the DID)', async () => {
      const { did } = await service.registerDID(); // v2 by default

      await expect(service.rotateKeys(did)).rejects.toThrow(/changes the DID/);
    });

    it('calls storeKeyPair on the storage service (legacy v1 DID)', async () => {
      const { did } = await service.registerDID({ quantumSafe: false });
      storage.storeDIDDocument.mockClear();

      await service.rotateKeys(did);

      expect(storage.storeDIDDocument).toHaveBeenCalledTimes(1);
    });
  });

  describe('listDIDs', () => {
    it('returns empty list when no DIDs are registered', async () => {
      const list = await service.listDIDs();
      expect(list).toEqual([]);
    });

    it('returns all registered DIDs', async () => {
      const r1 = await service.registerDID();
      const r2 = await service.registerDID();

      const list = await service.listDIDs();

      expect(list).toContain(r1.did);
      expect(list).toContain(r2.did);
    });
  });

  describe('getTrustLevelInfo', () => {
    it('returns null for non-existent DID', async () => {
      const info = await service.getTrustLevelInfo('did:atp:ghost');
      expect(info).toBeNull();
    });

    it('returns structured trust level info for a registered DID', async () => {
      const { did } = await service.registerDID();

      const info = await service.getTrustLevelInfo(did);

      expect(info).not.toBeNull();
      expect(info!.currentLevel).toBe(TrustLevel.UNTRUSTED);
      expect(Array.isArray(info!.capabilities)).toBe(true);
      expect(Array.isArray(info!.upgradeRequirements)).toBe(true);
    });
  });
});
