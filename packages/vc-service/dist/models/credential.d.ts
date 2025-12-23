import { z } from 'zod';
export declare const CredentialSubjectSchema: z.ZodRecord<z.ZodString, z.ZodAny>;
export declare const CredentialStatusSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    statusListIndex: z.ZodOptional<z.ZodString>;
    statusListCredential: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    id: string;
    statusListIndex?: string | undefined;
    statusListCredential?: string | undefined;
}, {
    type: string;
    id: string;
    statusListIndex?: string | undefined;
    statusListCredential?: string | undefined;
}>;
export declare const ProofSchema: z.ZodObject<{
    type: z.ZodString;
    created: z.ZodString;
    verificationMethod: z.ZodString;
    proofPurpose: z.ZodString;
    proofValue: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
}, {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
}>;
export declare const VerifiableCredentialSchema: z.ZodObject<{
    '@context': z.ZodArray<z.ZodString, "many">;
    id: z.ZodString;
    type: z.ZodArray<z.ZodString, "many">;
    issuer: z.ZodUnion<[z.ZodString, z.ZodObject<{
        id: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name?: string | undefined;
    }, {
        id: string;
        name?: string | undefined;
    }>]>;
    issuanceDate: z.ZodString;
    expirationDate: z.ZodOptional<z.ZodString>;
    credentialSubject: z.ZodRecord<z.ZodString, z.ZodAny>;
    credentialStatus: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        statusListIndex: z.ZodOptional<z.ZodString>;
        statusListCredential: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        id: string;
        statusListIndex?: string | undefined;
        statusListCredential?: string | undefined;
    }, {
        type: string;
        id: string;
        statusListIndex?: string | undefined;
        statusListCredential?: string | undefined;
    }>>;
    proof: z.ZodOptional<z.ZodObject<{
        type: z.ZodString;
        created: z.ZodString;
        verificationMethod: z.ZodString;
        proofPurpose: z.ZodString;
        proofValue: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: string;
        created: string;
        verificationMethod: string;
        proofPurpose: string;
        proofValue: string;
    }, {
        type: string;
        created: string;
        verificationMethod: string;
        proofPurpose: string;
        proofValue: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: string[];
    id: string;
    '@context': string[];
    issuer: string | {
        id: string;
        name?: string | undefined;
    };
    issuanceDate: string;
    credentialSubject: Record<string, any>;
    expirationDate?: string | undefined;
    credentialStatus?: {
        type: string;
        id: string;
        statusListIndex?: string | undefined;
        statusListCredential?: string | undefined;
    } | undefined;
    proof?: {
        type: string;
        created: string;
        verificationMethod: string;
        proofPurpose: string;
        proofValue: string;
    } | undefined;
}, {
    type: string[];
    id: string;
    '@context': string[];
    issuer: string | {
        id: string;
        name?: string | undefined;
    };
    issuanceDate: string;
    credentialSubject: Record<string, any>;
    expirationDate?: string | undefined;
    credentialStatus?: {
        type: string;
        id: string;
        statusListIndex?: string | undefined;
        statusListCredential?: string | undefined;
    } | undefined;
    proof?: {
        type: string;
        created: string;
        verificationMethod: string;
        proofPurpose: string;
        proofValue: string;
    } | undefined;
}>;
export declare const CredentialSchemaDefinition: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    version: z.ZodString;
    properties: z.ZodRecord<z.ZodString, z.ZodObject<{
        type: z.ZodString;
        description: z.ZodString;
        required: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        description: string;
        required?: boolean | undefined;
    }, {
        type: string;
        description: string;
        required?: boolean | undefined;
    }>>;
    required: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    description: string;
    version: string;
    properties: Record<string, {
        type: string;
        description: string;
        required?: boolean | undefined;
    }>;
    required?: string[] | undefined;
}, {
    id: string;
    name: string;
    description: string;
    version: string;
    properties: Record<string, {
        type: string;
        description: string;
        required?: boolean | undefined;
    }>;
    required?: string[] | undefined;
}>;
export declare const CredentialIssuanceRequest: z.ZodObject<{
    schemaId: z.ZodString;
    subject: z.ZodString;
    claims: z.ZodRecord<z.ZodString, z.ZodAny>;
    expirationDate: z.ZodOptional<z.ZodString>;
    issuerDid: z.ZodString;
    issuerPrivateKey: z.ZodString;
}, "strip", z.ZodTypeAny, {
    schemaId: string;
    subject: string;
    claims: Record<string, any>;
    issuerDid: string;
    issuerPrivateKey: string;
    expirationDate?: string | undefined;
}, {
    schemaId: string;
    subject: string;
    claims: Record<string, any>;
    issuerDid: string;
    issuerPrivateKey: string;
    expirationDate?: string | undefined;
}>;
export declare const CredentialVerificationRequest: z.ZodObject<{
    credential: z.ZodObject<{
        '@context': z.ZodArray<z.ZodString, "many">;
        id: z.ZodString;
        type: z.ZodArray<z.ZodString, "many">;
        issuer: z.ZodUnion<[z.ZodString, z.ZodObject<{
            id: z.ZodString;
            name: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name?: string | undefined;
        }, {
            id: string;
            name?: string | undefined;
        }>]>;
        issuanceDate: z.ZodString;
        expirationDate: z.ZodOptional<z.ZodString>;
        credentialSubject: z.ZodRecord<z.ZodString, z.ZodAny>;
        credentialStatus: z.ZodOptional<z.ZodObject<{
            id: z.ZodString;
            type: z.ZodString;
            statusListIndex: z.ZodOptional<z.ZodString>;
            statusListCredential: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            id: string;
            statusListIndex?: string | undefined;
            statusListCredential?: string | undefined;
        }, {
            type: string;
            id: string;
            statusListIndex?: string | undefined;
            statusListCredential?: string | undefined;
        }>>;
        proof: z.ZodOptional<z.ZodObject<{
            type: z.ZodString;
            created: z.ZodString;
            verificationMethod: z.ZodString;
            proofPurpose: z.ZodString;
            proofValue: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: string;
            created: string;
            verificationMethod: string;
            proofPurpose: string;
            proofValue: string;
        }, {
            type: string;
            created: string;
            verificationMethod: string;
            proofPurpose: string;
            proofValue: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        type: string[];
        id: string;
        '@context': string[];
        issuer: string | {
            id: string;
            name?: string | undefined;
        };
        issuanceDate: string;
        credentialSubject: Record<string, any>;
        expirationDate?: string | undefined;
        credentialStatus?: {
            type: string;
            id: string;
            statusListIndex?: string | undefined;
            statusListCredential?: string | undefined;
        } | undefined;
        proof?: {
            type: string;
            created: string;
            verificationMethod: string;
            proofPurpose: string;
            proofValue: string;
        } | undefined;
    }, {
        type: string[];
        id: string;
        '@context': string[];
        issuer: string | {
            id: string;
            name?: string | undefined;
        };
        issuanceDate: string;
        credentialSubject: Record<string, any>;
        expirationDate?: string | undefined;
        credentialStatus?: {
            type: string;
            id: string;
            statusListIndex?: string | undefined;
            statusListCredential?: string | undefined;
        } | undefined;
        proof?: {
            type: string;
            created: string;
            verificationMethod: string;
            proofPurpose: string;
            proofValue: string;
        } | undefined;
    }>;
    challenge: z.ZodOptional<z.ZodString>;
    domain: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    credential: {
        type: string[];
        id: string;
        '@context': string[];
        issuer: string | {
            id: string;
            name?: string | undefined;
        };
        issuanceDate: string;
        credentialSubject: Record<string, any>;
        expirationDate?: string | undefined;
        credentialStatus?: {
            type: string;
            id: string;
            statusListIndex?: string | undefined;
            statusListCredential?: string | undefined;
        } | undefined;
        proof?: {
            type: string;
            created: string;
            verificationMethod: string;
            proofPurpose: string;
            proofValue: string;
        } | undefined;
    };
    challenge?: string | undefined;
    domain?: string | undefined;
}, {
    credential: {
        type: string[];
        id: string;
        '@context': string[];
        issuer: string | {
            id: string;
            name?: string | undefined;
        };
        issuanceDate: string;
        credentialSubject: Record<string, any>;
        expirationDate?: string | undefined;
        credentialStatus?: {
            type: string;
            id: string;
            statusListIndex?: string | undefined;
            statusListCredential?: string | undefined;
        } | undefined;
        proof?: {
            type: string;
            created: string;
            verificationMethod: string;
            proofPurpose: string;
            proofValue: string;
        } | undefined;
    };
    challenge?: string | undefined;
    domain?: string | undefined;
}>;
export type CredentialSubject = z.infer<typeof CredentialSubjectSchema>;
export type CredentialStatus = z.infer<typeof CredentialStatusSchema>;
export type Proof = z.infer<typeof ProofSchema>;
export type VerifiableCredential = z.infer<typeof VerifiableCredentialSchema>;
export type CredentialSchema = z.infer<typeof CredentialSchemaDefinition>;
export type CredentialIssuanceRequest = z.infer<typeof CredentialIssuanceRequest>;
export type CredentialVerificationRequest = z.infer<typeof CredentialVerificationRequest>;
export interface VerificationResult {
    valid: boolean;
    error?: string;
    checks: {
        signature: boolean;
        expiration: boolean;
        revocation: boolean;
        schema: boolean;
    };
}
//# sourceMappingURL=credential.d.ts.map