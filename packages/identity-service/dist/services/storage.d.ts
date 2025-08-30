import { BaseStorage, DatabaseConfig } from '@atp/shared';
import { DIDDocument, KeyPair } from '../models/did.js';
export declare class StorageService extends BaseStorage {
    constructor(config: DatabaseConfig);
    initialize(): Promise<void>;
    storeDIDDocument(document: DIDDocument): Promise<void>;
    getDIDDocument(did: string): Promise<DIDDocument | null>;
    storeKeyPair(keyPair: KeyPair): Promise<void>;
    getKeyPair(did: string): Promise<KeyPair | null>;
    rotateKey(did: string): Promise<{
        publicKey: string;
        privateKey: string;
    }>;
    listDIDs(): Promise<string[]>;
    /**
     * Migrates legacy unencrypted private key to encrypted storage
     * @private
     */
    private migrateLegacyPrivateKey;
}
//# sourceMappingURL=storage.d.ts.map