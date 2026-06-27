import {
  DIDDocument,
  DIDRegistrationRequest,
  DIDRegistrationResponse,
  PairwiseDIDRegistrationRequest,
  Service,
} from '../models/did.js';
import { CryptoUtils, QuantumSafeKeyPair } from '../utils/crypto.js';
import { StorageService } from './storage.js';
import { ValidationError } from '../errors.js';
import {
  TrustLevel,
  TrustLevelManager,
  PQCAlgorithm,
  verifySignatureCompat,
} from '@atp/shared';

/** Raw binding public keys split out of a hybrid keypair. */
type HybridBinding = { ed25519PublicKey: Uint8Array; mlDsa65PublicKey: Uint8Array } | null;

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

    const document = this.assembleDidDocument(did, keyPair, binding, request.services, now);

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

  /**
   * Register a pairwise (per-peer, unlinkable) did:atp.
   *
   * The per-peer hybrid keypair and the pseudonymous "p_<hex>" path segment
   * MUST be derived client-side (e.g. via `DidAtp.generatePairwise` in
   * `atp-sdk`) from the agent's master secret — the master secret and the
   * derived private keys never leave the caller and are never transmitted to
   * or seen by this service. The caller submits only the resulting public
   * keys plus a signature (`proof`) over the recomputed DID proving control
   * of the matching private key(s). This method independently recomputes the
   * did:atp identifier from the submitted public material, verifies the
   * proof against it (reusing `verifySignatureCompat` — no bespoke crypto),
   * and persists only the public DID Document.
   */
  async registerPairwiseDID(
    request: PairwiseDIDRegistrationRequest
  ): Promise<DIDRegistrationResponse> {
    if (typeof request.peerId !== 'string' || request.peerId.length === 0) {
      throw new ValidationError('peerId must be a non-empty string');
    }
    if (!/^p_[0-9a-fA-F]+$/.test(request.peerSegment || '')) {
      throw new ValidationError('peerSegment must be a "p_<hex>" pseudonym segment');
    }
    const edPub = this.decodeHex(request.ed25519PublicKey, 'ed25519PublicKey');
    if (edPub.length !== 32) {
      throw new ValidationError('ed25519PublicKey must decode to 32 bytes');
    }
    const mlPub = this.decodeHex(request.mlDsa65PublicKey, 'mlDsa65PublicKey');
    if (mlPub.length !== 1952) {
      throw new ValidationError('mlDsa65PublicKey must decode to 1952 bytes');
    }
    const proof = this.decodeHex(request.proof, 'proof');

    // Shape the submitted public bytes into the QuantumSafeKeyPair encoding
    // the rest of the service understands. No private key material is ever
    // present here.
    const keyPair: QuantumSafeKeyPair = {
      publicKey: Buffer.from(edPub).toString('hex'),
      privateKey: '',
      pqcPublicKey: Buffer.concat([Buffer.from(edPub), Buffer.from(mlPub)]).toString('hex'),
      algorithm: PQCAlgorithm.CRYSTALS_DILITHIUM,
      isQuantumSafe: true,
      hybridMode: true,
    };

    const binding = CryptoUtils.extractBindingPublicKeys(keyPair);
    // The pseudonym is the single path segment, so the DID is unlinkable.
    const did = CryptoUtils.generateQuantumSafeDID(keyPair, {
      domain: request.domain,
      path: [request.peerSegment],
      binding,
    });

    // Verify the caller controls the private key(s) matching the submitted
    // public keys by checking their signature over the recomputed DID.
    const verification = await verifySignatureCompat(did, Buffer.from(proof).toString('hex'), {
      ed25519PublicKeyHex: keyPair.publicKey,
      mlDsa65PublicKeyHex: mlPub.length ? Buffer.from(mlPub).toString('hex') : undefined,
    });
    if (!verification.valid) {
      throw new ValidationError('proof does not verify against the submitted public keys');
    }

    const now = new Date().toISOString();

    const document = this.assembleDidDocument(did, keyPair, binding, request.services, now, {
      pairwise: true,
      peerSegment: request.peerSegment,
    });

    // Persist only the public document — private keys are never seen here.
    await this.storage.storeDIDDocument(document);

    return {
      did,
      document,
      algorithm: keyPair.algorithm,
      isQuantumSafe: true,
      hybridMode: true,
      peerSegment: request.peerSegment,
    };
  }

  /** Strictly decode a hex string (even length, hex chars only). */
  private decodeHex(hex: string, field: string): Uint8Array {
    if (typeof hex !== 'string' || hex.length === 0 || hex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hex)) {
      throw new ValidationError(`${field} must be a non-empty, even-length hex string`);
    }
    return new Uint8Array(Buffer.from(hex, 'hex'));
  }

  /**
   * Assemble a did:atp DID Document for a (preferably hybrid) keypair. Shared by
   * standard and pairwise registration so the dual-binding verification-method
   * and proof structure has a single implementation. `extraInfo` is merged into
   * `metadata.additionalInfo` (used e.g. to flag pairwise DIDs).
   */
  private assembleDidDocument(
    did: string,
    keyPair: QuantumSafeKeyPair,
    binding: HybridBinding,
    services: Service[] | undefined,
    now: string,
    extraInfo: Record<string, unknown> = {}
  ): DIDDocument {
    const verificationMethodId = `${did}#key-ed25519`;
    const pqcVerificationMethodId = `${did}#key-mldsa65`;

    const verificationMethods = [];

    // Classical Ed25519 verification method (the did:wba e1_ binding).
    verificationMethods.push({
      id: verificationMethodId,
      type: 'Ed25519VerificationKey2020',
      controller: did,
      publicKeyMultibase: CryptoUtils.encodeMultibase(Buffer.from(keyPair.publicKey, 'hex')),
      // Same key in hex, so hex-verifying consumers need not decode multibase.
      publicKeyHex: keyPair.publicKey,
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

    return {
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
      service: services || [],
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
            : [PQCAlgorithm.ED25519],
          ...extraInfo,
        },
      },
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

    // A spec-v2 did:atp binds the identifier to its key fingerprints
    // (…:e1_<thumbprint>:pq1_<thumbprint>), so rotating a binding key changes
    // the DID itself (docs/specs/did-atp/index.html, "Method Operations"). An
    // in-place rotation that keeps the same DID would leave the document's keys
    // inconsistent with the identifier — and previously dropped the ML-DSA-65
    // verification method entirely. Reject it explicitly rather than emit a
    // broken dual-binding document; a v2 agent rotates by re-registering.
    if (/:e1_[A-Za-z0-9_-]+:pq1_[A-Za-z0-9_-]+$/.test(did)) {
      throw new Error(
        `Cannot rotate keys in place for spec-v2 did:atp identifier ${did}: ` +
          'rotating a binding key changes the DID. Re-register to obtain a new did:atp.'
      );
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
        // Same key in hex, so hex-verifying consumers need not decode multibase.
        publicKeyHex: newKeyPair.publicKey,
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