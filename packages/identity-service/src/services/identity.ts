import { DIDDocument, DIDRegistrationRequest, DIDRegistrationResponse, Service } from '../models/did.js';
import { CryptoUtils, QuantumSafeKeyPair } from '../utils/crypto.js';
import { StorageService } from './storage.js';
import { TrustLevel, TrustLevelManager, PQCAlgorithm } from '@atp/shared';

export class IdentityService {
  constructor(private storage: StorageService) {}

  async registerDID(request: DIDRegistrationRequest = {}): Promise<DIDRegistrationResponse> {
    // Determine if quantum-safe keys should be generated
    const useQuantumSafe = request.quantumSafe ?? true; // Default to quantum-safe
    
    let keyPair: QuantumSafeKeyPair;
    
    if (request.publicKey) {
      // Use provided public key (classical mode)
      keyPair = {
        publicKey: request.publicKey,
        privateKey: '',
        algorithm: PQCAlgorithm.ED25519,
        isQuantumSafe: false,
        hybridMode: false
      };
    } else {
      // Generate new quantum-safe keys
      keyPair = await CryptoUtils.generateQuantumSafeKeyPair(useQuantumSafe);
    }
    
    // Emit a spec-v2 did:atp identifier (docs/specs/did-atp/index.html): for a
    // hybrid keypair this is a path-type DID carrying both the classical e1_
    // and post-quantum pq1_ binding fingerprints; classical-only keys fall back
    // to the legacy v1 form.
    const binding = CryptoUtils.extractBindingPublicKeys(keyPair);
    const did = CryptoUtils.generateQuantumSafeDID(keyPair, { binding });
    const now = new Date().toISOString();

    const verificationMethodId = `${did}#key-ed25519`;
    const pqcVerificationMethodId = `${did}#key-mldsa65`;

    // Create verification methods based on key type
    const verificationMethods = [];

    // Classical Ed25519 verification method (the did:wba e1_ binding).
    verificationMethods.push({
      id: verificationMethodId,
      type: 'Ed25519VerificationKey2020',
      controller: did,
      publicKeyMultibase: CryptoUtils.encodeMultibase(Buffer.from(keyPair.publicKey, 'hex')),
    });

    // Add the post-quantum ML-DSA-65 binding as an RFC 9964 AKP JWK, so the
    // verification method's RFC 7638 thumbprint matches the pq1_ segment of
    // the v2 identifier.
    if (binding) {
      verificationMethods.push({
        id: pqcVerificationMethodId,
        type: 'JsonWebKey',
        controller: did,
        publicKeyJwk: {
          kty: 'AKP',
          alg: 'ML-DSA-65',
          pub: CryptoUtils.base64url(binding.mlDsa65PublicKey),
        },
      });
    } else if (keyPair.isQuantumSafe && keyPair.pqcPublicKey) {
      // Defensive fallback for any non-standard hybrid encoding.
      verificationMethods.push({
        id: pqcVerificationMethodId,
        type: 'DilithiumVerificationKey2023',
        controller: did,
        publicKeyMultibase: CryptoUtils.encodeMultibase(Buffer.from(keyPair.pqcPublicKey, 'hex')),
      });
    }
    
    const document: DIDDocument = {
      '@context': [
        'https://www.w3.org/ns/did/v1', 
        'https://w3id.org/security/suites/ed25519-2020/v1',
        ...(keyPair.isQuantumSafe ? ['https://w3id.org/security/suites/dilithium-2023/v1'] : [])
      ],
      id: did,
      verificationMethod: verificationMethods,
      authentication: [
        verificationMethodId,
        ...(keyPair.isQuantumSafe ? [pqcVerificationMethodId] : [])
      ],
      assertionMethod: [
        verificationMethodId,
        ...(keyPair.isQuantumSafe ? [pqcVerificationMethodId] : [])
      ],
      keyAgreement: [verificationMethodId],
      capabilityInvocation: [
        verificationMethodId,
        ...(keyPair.isQuantumSafe ? [pqcVerificationMethodId] : [])
      ],
      capabilityDelegation: [
        verificationMethodId,
        ...(keyPair.isQuantumSafe ? [pqcVerificationMethodId] : [])
      ],
      service: request.services || [],
      created: now,
      updated: now,
      metadata: {
        protocol: 'Agent Trust Protocol™',
        version: '2.0.0',
        trustLevel: TrustLevel.UNTRUSTED,
        additionalInfo: {
          createdBy: 'ATP Identity Service',
          initialTrustLevel: TrustLevel.UNTRUSTED,
          // did:atp identifier syntax version: 'v2' = spec path-type DID with
          // e1_/pq1_ binding fingerprints; 'v1' = legacy did:atp:<multibase>.
          didMethodVersion: binding ? 'v2' : 'v1',
          // Quantum-safe metadata
          algorithm: keyPair.algorithm,
          isQuantumSafe: keyPair.isQuantumSafe,
          hybridMode: keyPair.hybridMode,
          supportedAlgorithms: keyPair.isQuantumSafe 
            ? [PQCAlgorithm.ED25519, PQCAlgorithm.CRYSTALS_DILITHIUM]
            : [PQCAlgorithm.ED25519]
        },
      },
    };

    await this.storage.storeDIDDocument(document);
    
    if (!request.publicKey) {
      await this.storage.storeKeyPair({
        did,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        created: now,
      });
    }

    return {
      did,
      document,
      privateKey: request.publicKey ? undefined : keyPair.privateKey,
      // Quantum-safe response fields
      pqcPrivateKey: request.publicKey ? undefined : keyPair.pqcPrivateKey,
      algorithm: keyPair.algorithm,
      isQuantumSafe: keyPair.isQuantumSafe,
      hybridMode: keyPair.hybridMode,
    };
  }

  async resolveDID(did: string): Promise<DIDDocument | null> {
    // 1. Always check local storage first (covers did:atp: DIDs and cached externals)
    const local = await this.storage.getDIDDocument(did);
    if (local) return local;

    // 2. For non-ATP DIDs, try the universal resolver or a configured external resolver
    if (!did.startsWith('did:atp:')) {
      return this.resolveExternalDID(did);
    }

    return null;
  }

  private async resolveExternalDID(did: string): Promise<DIDDocument | null> {
    const resolverUrl = process.env.DID_UNIVERSAL_RESOLVER_URL;
    if (!resolverUrl) {
      console.warn('[IdentityService] DID_UNIVERSAL_RESOLVER_URL not configured; refusing to resolve external DIDs');
      return null;
    }

    let parsed: URL;
    try {
      parsed = new URL(resolverUrl);
    } catch {
      console.warn('[IdentityService] DID_UNIVERSAL_RESOLVER_URL is not a valid URL');
      return null;
    }
    // Require HTTPS for any non-localhost resolver to prevent MITM-injected
    // DID documents from being cached and trusted.
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
      console.warn('[IdentityService] external DID resolver must use HTTPS');
      return null;
    }

    try {
      const response = await fetch(
        `${resolverUrl.replace(/\/+$/, '')}/1.0/identifiers/${encodeURIComponent(did)}`,
        {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(5000),
        }
      );
      if (!response.ok) return null;

      const body = await response.json() as { didDocument?: DIDDocument };
      const doc = body.didDocument;
      if (!doc) return null;

      // Trust boundary: the resolver is external and may be malicious. At a
      // minimum, require the returned document to identify itself as the
      // DID we asked about. Until the resolver response is itself
      // cryptographically verified (e.g. DNSSEC or blockchain anchor), tag
      // the cached document as unverified so callers can decide whether to
      // trust it for signature verification.
      if (doc.id !== did) {
        console.warn(`[IdentityService] resolver returned mismatched DID: expected ${did}, got ${doc.id}`);
        return null;
      }

      const taggedDoc: DIDDocument & { _verification?: string } = {
        ...doc,
        _verification: 'unverified-external',
      };
      await this.storage.storeDIDDocument(taggedDoc);
      return taggedDoc;
    } catch (error) {
      console.warn(`[IdentityService] External DID resolution failed for ${did}:`, (error as Error).message);
      return null;
    }
  }

  async rotateKeys(did: string): Promise<DIDDocument | null> {
    const existingDoc = await this.storage.getDIDDocument(did);
    if (!existingDoc) {
      return null;
    }

    const newKeyPair = await this.storage.rotateKey(did);
    const now = new Date().toISOString();
    
    const verificationMethodId = `${did}#key-1`;
    
    const updatedDocument: DIDDocument = {
      ...existingDoc,
      verificationMethod: [{
        id: verificationMethodId,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase: CryptoUtils.encodeMultibase(Buffer.from(newKeyPair.publicKey, 'hex')),
      }],
      updated: now,
    };

    await this.storage.storeDIDDocument(updatedDocument);
    return updatedDocument;
  }

  async addService(did: string, service: Service): Promise<DIDDocument | null> {
    const existingDoc = await this.storage.getDIDDocument(did);
    if (!existingDoc) {
      return null;
    }

    const updatedDocument: DIDDocument = {
      ...existingDoc,
      service: [...existingDoc.service, service],
      updated: new Date().toISOString(),
    };

    await this.storage.storeDIDDocument(updatedDocument);
    return updatedDocument;
  }

  async listDIDs(): Promise<string[]> {
    return await this.storage.listDIDs();
  }

  async updateTrustLevel(did: string, trustLevel: string): Promise<DIDDocument | null> {
    const existingDoc = await this.storage.getDIDDocument(did);
    if (!existingDoc) {
      return null;
    }

    // Validate trust level
    if (!TrustLevelManager.validateTrustLevel(trustLevel)) {
      throw new Error(`Invalid trust level: ${trustLevel}`);
    }

    const updatedDocument: DIDDocument = {
      ...existingDoc,
      metadata: {
        ...(existingDoc.metadata || {
          protocol: 'Agent Trust Protocol™',
          version: '1.0.0',
        }),
        trustLevel: trustLevel as TrustLevel,
        additionalInfo: {
          ...existingDoc.metadata?.additionalInfo,
          lastTrustLevelUpdate: new Date().toISOString(),
          previousTrustLevel: existingDoc.metadata?.trustLevel,
        },
      },
      updated: new Date().toISOString(),
    };

    await this.storage.storeDIDDocument(updatedDocument);
    return updatedDocument;
  }

  async getTrustLevelInfo(did: string): Promise<{
    currentLevel: TrustLevel;
    capabilities: string[];
    nextLevel: TrustLevel | null;
    upgradeRequirements: string[];
  } | null> {
    const document = await this.storage.getDIDDocument(did);
    if (!document || !document.metadata?.trustLevel) {
      return null;
    }

    const currentLevel = document.metadata.trustLevel as TrustLevel;
    const nextLevel = TrustLevelManager.getNextLevel(currentLevel);
    const upgradeRequirements = nextLevel 
      ? TrustLevelManager.getUpgradeRequirements(currentLevel, nextLevel)
      : [];

    return {
      currentLevel,
      capabilities: TrustLevelManager.hasCapability(currentLevel, 'read-public') ? ['read-public'] : [],
      nextLevel,
      upgradeRequirements,
    };
  }
}