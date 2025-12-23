import { CryptoUtils } from '../utils/crypto.js';
import { TrustLevel, TrustLevelManager, PQCAlgorithm } from '@atp/shared';
export class IdentityService {
    storage;
    constructor(storage) {
        this.storage = storage;
    }
    async registerDID(request = {}) {
        // Determine if quantum-safe keys should be generated
        const useQuantumSafe = request.quantumSafe ?? true; // Default to quantum-safe
        let keyPair;
        if (request.publicKey) {
            // Use provided public key (classical mode)
            keyPair = {
                publicKey: request.publicKey,
                privateKey: '',
                algorithm: PQCAlgorithm.ED25519,
                isQuantumSafe: false,
                hybridMode: false
            };
        }
        else {
            // Generate new quantum-safe keys
            keyPair = await CryptoUtils.generateQuantumSafeKeyPair(useQuantumSafe);
        }
        const did = CryptoUtils.generateQuantumSafeDID(keyPair);
        const now = new Date().toISOString();
        const verificationMethodId = `${did}#key-1`;
        const pqcVerificationMethodId = `${did}#pqc-key-1`;
        // Create verification methods based on key type
        const verificationMethods = [];
        // Classical Ed25519 verification method (for backward compatibility)
        verificationMethods.push({
            id: verificationMethodId,
            type: 'Ed25519VerificationKey2020',
            controller: did,
            publicKeyMultibase: CryptoUtils.encodeMultibase(Buffer.from(keyPair.publicKey, 'hex')),
        });
        // Add quantum-safe verification method if available
        if (keyPair.isQuantumSafe && keyPair.pqcPublicKey) {
            verificationMethods.push({
                id: pqcVerificationMethodId,
                type: 'DilithiumVerificationKey2023',
                controller: did,
                publicKeyMultibase: CryptoUtils.encodeMultibase(Buffer.from(keyPair.pqcPublicKey, 'hex')),
            });
        }
        const document = {
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
                version: '1.0.0',
                trustLevel: TrustLevel.UNTRUSTED,
                additionalInfo: {
                    createdBy: 'ATP Identity Service',
                    initialTrustLevel: TrustLevel.UNTRUSTED,
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
    async resolveDID(did) {
        return await this.storage.getDIDDocument(did);
    }
    async rotateKeys(did) {
        const existingDoc = await this.storage.getDIDDocument(did);
        if (!existingDoc) {
            return null;
        }
        const newKeyPair = await this.storage.rotateKey(did);
        const now = new Date().toISOString();
        const verificationMethodId = `${did}#key-1`;
        const updatedDocument = {
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
    async addService(did, service) {
        const existingDoc = await this.storage.getDIDDocument(did);
        if (!existingDoc) {
            return null;
        }
        const updatedDocument = {
            ...existingDoc,
            service: [...existingDoc.service, service],
            updated: new Date().toISOString(),
        };
        await this.storage.storeDIDDocument(updatedDocument);
        return updatedDocument;
    }
    async listDIDs() {
        return await this.storage.listDIDs();
    }
    async updateTrustLevel(did, trustLevel) {
        const existingDoc = await this.storage.getDIDDocument(did);
        if (!existingDoc) {
            return null;
        }
        // Validate trust level
        if (!TrustLevelManager.validateTrustLevel(trustLevel)) {
            throw new Error(`Invalid trust level: ${trustLevel}`);
        }
        const updatedDocument = {
            ...existingDoc,
            metadata: {
                ...(existingDoc.metadata || {
                    protocol: 'Agent Trust Protocol™',
                    version: '1.0.0',
                }),
                trustLevel: trustLevel,
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
    async getTrustLevelInfo(did) {
        const document = await this.storage.getDIDDocument(did);
        if (!document || !document.metadata?.trustLevel) {
            return null;
        }
        const currentLevel = document.metadata.trustLevel;
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
