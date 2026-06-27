import { z } from 'zod';

export const VerificationMethodSchema = z.object({
  id: z.string(),
  type: z.string(),
  controller: z.string(),
  publicKeyMultibase: z.string().optional(),
  // Hex encoding of the same key material as publicKeyMultibase. Emitted for the
  // Ed25519 (e1_) method so consumers that verify with a hex public key (e.g. the
  // vc-service issuer-key lookup → verifySignatureCompat) can use it directly
  // without decoding multibase.
  publicKeyHex: z.string().optional(),
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
  // Quantum-safe options
  quantumSafe?: boolean;
  algorithm?: 'ed25519' | 'dilithium' | 'hybrid';
}

export interface DIDRegistrationResponse {
  did: string;
  document: DIDDocument;
  privateKey?: string;
  // Quantum-safe key information
  pqcPrivateKey?: string;
  algorithm?: string;
  isQuantumSafe?: boolean;
  hybridMode?: boolean;
  // Set only for pairwise registrations: the pseudonymous "p_<hex>" path
  // segment that makes this DID unlinkable to the agent's other DIDs.
  peerSegment?: string;
}

/**
 * Register a pairwise (per-peer, unlinkable) did:atp.
 *
 * The per-peer hybrid keypair and the pseudonymous "p_<hex>" path segment MUST
 * be derived client-side from the agent's master secret (e.g. via
 * `DidAtp.generatePairwise` in `atp-sdk`) — the master secret and the derived
 * private keys never leave the caller. The caller submits only the resulting
 * public key material plus a signature proving control of the corresponding
 * private keys; the service independently recomputes the DID from that public
 * material, verifies the proof, and persists only the public DID Document.
 * See docs/specs/did-atp/index.html § "Pairwise (Per-Peer, Unlinkable)
 * Identifiers".
 */
export interface PairwiseDIDRegistrationRequest {
  /** Peer (relying-party) identifier the pairwise DID is presented to. */
  peerId: string;
  /** Client-derived pseudonymous "p_<hex>" path segment for this peer. */
  peerSegment: string;
  /** Hex-encoded 32-byte Ed25519 public key, derived client-side for this peer. */
  ed25519PublicKey: string;
  /** Hex-encoded 1952-byte ML-DSA-65 public key, derived client-side for this peer. */
  mlDsa65PublicKey: string;
  /**
   * Hex-encoded signature over the recomputed did:atp identifier, proving
   * control of the private key(s) matching the submitted public keys. Either
   * an Ed25519 (64-byte) or ML-DSA-65 (3309-byte) signature is accepted.
   */
  proof: string;
  /** Optional resolution domain; defaults to ATP_DID_DOMAIN. */
  domain?: string;
  services?: Service[];
}