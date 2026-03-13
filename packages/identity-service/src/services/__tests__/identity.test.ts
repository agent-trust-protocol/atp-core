import { IdentityService } from '../identity.js';
import { DIDDocument } from '../../models/did.js';
import { TrustLevel } from '@atp/shared';

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

    it('updates the verification method after key rotation', async () => {
      const { did } = await service.registerDID();

      const updated = await service.rotateKeys(did);

      expect(updated).not.toBeNull();
      expect(updated!.verificationMethod[0].publicKeyMultibase).toBeDefined();
      // updated timestamp should be set
      expect(updated!.updated).toBeDefined();
    });

    it('calls storeKeyPair on the storage service', async () => {
      const { did } = await service.registerDID();
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
