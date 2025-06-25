import { z } from 'zod';

export const VerificationMethodSchema = z.object({
  id: z.string(),
  type: z.string(),
  controller: z.string(),
  publicKeyMultibase: z.string().optional(),
  publicKeyJwk: z.record(z.any()).optional(),
});

export const ServiceSchema = z.object({
  id: z.string(),
  type: z.string(),
  serviceEndpoint: z.string(),
});

export const MetadataSchema = z.object({
  protocol: z.string(),
  version: z.string(),
  trustLevel: z.string(),
  additionalInfo: z.record(z.any()).optional(),
});

export const DIDDocumentSchema = z.object({
  '@context': z.array(z.string()).default(['https://www.w3.org/ns/did/v1']),
  id: z.string(),
  verificationMethod: z.array(VerificationMethodSchema).default([]),
  authentication: z.array(z.string()).default([]),
  assertionMethod: z.array(z.string()).default([]),
  keyAgreement: z.array(z.string()).default([]),
  capabilityInvocation: z.array(z.string()).default([]),
  capabilityDelegation: z.array(z.string()).default([]),
  service: z.array(ServiceSchema).default([]),
  created: z.string(),
  updated: z.string(),
  metadata: MetadataSchema.optional(),
});

export const KeyPairSchema = z.object({
  did: z.string(),
  publicKey: z.string(),
  privateKey: z.string(),
  created: z.string(),
  rotated: z.string().optional(),
});

export type VerificationMethod = z.infer<typeof VerificationMethodSchema>;
export type Service = z.infer<typeof ServiceSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;
export type DIDDocument = z.infer<typeof DIDDocumentSchema>;
export type KeyPair = z.infer<typeof KeyPairSchema>;

export interface DIDRegistrationRequest {
  publicKey?: string;
  services?: Service[];
}

export interface DIDRegistrationResponse {
  did: string;
  document: DIDDocument;
  privateKey?: string;
}