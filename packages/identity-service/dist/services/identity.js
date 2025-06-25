import { CryptoUtils } from '../utils/crypto.js';
import { TrustLevel, TrustLevelManager } from '@atp/shared';
export class IdentityService {
    storage;
    constructor(storage) {
        this.storage = storage;
    }
    async registerDID(request = {}) {
        const keyPair = request.publicKey
            ? { publicKey: request.publicKey, privateKey: '' }
            : await CryptoUtils.generateKeyPair();
        const did = CryptoUtils.generateDID(keyPair.publicKey);
        const now = new Date().toISOString();
        const verificationMethodId = `${did}#key-1`;
        const document = {
            '@context': [
                'https://www.w3.org/ns/did/v1',
                'https://w3id.org/security/suites/ed25519-2020/v1'
            ],
            id: did,
            verificationMethod: [{
                    id: verificationMethodId,
                    type: 'Ed25519VerificationKey2020',
                    controller: did,
                    publicKeyMultibase: CryptoUtils.encodeMultibase(Buffer.from(keyPair.publicKey, 'hex')),
                }],
            authentication: [verificationMethodId],
            assertionMethod: [verificationMethodId],
            keyAgreement: [verificationMethodId],
            capabilityInvocation: [verificationMethodId],
            capabilityDelegation: [verificationMethodId],
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
