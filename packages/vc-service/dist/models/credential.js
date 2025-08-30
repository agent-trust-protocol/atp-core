import { z } from 'zod';
export const CredentialSubjectSchema = z.record(z.any());
export const CredentialStatusSchema = z.object({
    id: z.string(),
    type: z.string(),
    statusListIndex: z.string().optional(),
    statusListCredential: z.string().optional(),
});
export const ProofSchema = z.object({
    type: z.string(),
    created: z.string(),
    verificationMethod: z.string(),
    proofPurpose: z.string(),
    proofValue: z.string(),
});
export const VerifiableCredentialSchema = z.object({
    '@context': z.array(z.string()),
    id: z.string(),
    type: z.array(z.string()),
    issuer: z.union([z.string(), z.object({
            id: z.string(),
            name: z.string().optional(),
        })]),
    issuanceDate: z.string(),
    expirationDate: z.string().optional(),
    credentialSubject: CredentialSubjectSchema,
    credentialStatus: CredentialStatusSchema.optional(),
    proof: ProofSchema.optional(),
});
export const CredentialSchemaDefinition = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    version: z.string(),
    properties: z.record(z.object({
        type: z.string(),
        description: z.string(),
        required: z.boolean().optional(),
    })),
    required: z.array(z.string()).optional(),
});
export const CredentialIssuanceRequest = z.object({
    schemaId: z.string(),
    subject: z.string(),
    claims: z.record(z.any()),
    expirationDate: z.string().optional(),
    issuerDid: z.string(),
    issuerPrivateKey: z.string(),
});
export const CredentialVerificationRequest = z.object({
    credential: VerifiableCredentialSchema,
    challenge: z.string().optional(),
    domain: z.string().optional(),
});
