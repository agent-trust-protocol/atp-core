import { VerifiableCredential, CredentialIssuanceRequest, CredentialVerificationRequest, VerificationResult, CredentialSchema } from '../models/credential.js';
import { StorageService } from './storage.js';
export declare class CredentialService {
    private storage;
    constructor(storage: StorageService);
    issueCredential(request: CredentialIssuanceRequest): Promise<VerifiableCredential>;
    verifyCredential(request: CredentialVerificationRequest): Promise<VerificationResult>;
    revokeCredential(credentialId: string, issuerDid: string): Promise<void>;
    registerSchema(schema: CredentialSchema): Promise<void>;
    getSchema(schemaId: string): Promise<CredentialSchema | null>;
    listSchemas(): Promise<CredentialSchema[]>;
    private signCredential;
    private verifySignature;
    private checkExpiration;
    private checkRevocation;
    private validateCredentialSchema;
    private validateClaims;
    private validatePropertyType;
    private canonicalizeCredential;
    private getPublicKeyForDID;
}
//# sourceMappingURL=credential.d.ts.map