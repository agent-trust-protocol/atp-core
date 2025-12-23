import { BaseStorage, DatabaseConfig } from '@atp/shared';
import { VerifiableCredential, CredentialSchema } from '../models/credential.js';
export declare class StorageService extends BaseStorage {
    constructor(config: DatabaseConfig);
    initialize(): Promise<void>;
    storeCredential(credential: VerifiableCredential): Promise<void>;
    getCredential(credentialId: string): Promise<VerifiableCredential | null>;
    revokeCredential(credentialId: string): Promise<void>;
    isCredentialRevoked(credentialId: string): Promise<boolean>;
    storeSchema(schema: CredentialSchema): Promise<void>;
    getSchema(schemaId: string): Promise<CredentialSchema | null>;
    getSchemaByName(name: string): Promise<CredentialSchema | null>;
    listSchemas(): Promise<CredentialSchema[]>;
}
//# sourceMappingURL=storage.d.ts.map