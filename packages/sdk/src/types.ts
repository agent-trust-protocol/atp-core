// Core types for ATP™ SDK

export interface ATPConfig {
  /** Base URL for ATP services */
  baseUrl: string;
  /** Individual service URLs (overrides baseUrl) */
  services?: {
    identity?: string;
    credentials?: string;
    permissions?: string;
    audit?: string;
    gateway?: string;
  };
  /** Authentication configuration */
  auth?: {
    /** DID for authentication */
    did?: string;
    /** Private key for signing */
    privateKey?: string;
    /** JWT token for API access */
    token?: string;
  };
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Number of retries for failed requests */
  retries?: number;
  /** Delay between retries in milliseconds */
  retryDelay?: number;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom headers for requests */
  headers?: Record<string, string>;
}

export interface ATPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

export interface DIDDocument {
  id: string;
  '@context': string[];
  verificationMethod: VerificationMethod[];
  authentication: string[];
  assertionMethod?: string[];
  keyAgreement?: string[];
  capabilityInvocation?: string[];
  capabilityDelegation?: string[];
  service?: Service[];
  proof?: Proof;
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase?: string;
  publicKeyJwk?: any;
}

export interface ServiceEndpoint {
  id: string;
  type: string;
  serviceEndpoint: string;
}

export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: any;
  proof: any;
}

export interface VerifiablePresentation {
  '@context': string[];
  id: string;
  type: string[];
  verifiableCredential: VerifiableCredential[];
  holder: string;
  proof: any;
}

export interface TrustLevel {
  level: 'UNKNOWN' | 'BASIC' | 'VERIFIED' | 'TRUSTED' | 'PRIVILEGED';
  score: number;
  lastUpdated: string;
  factors: string[];
}

export interface PermissionGrant {
  id: string;
  subject: string;
  resource: string;
  action: string;
  conditions?: any;
  expiresAt?: string;
  grantedAt: string;
  grantedBy: string;
  status: 'active' | 'revoked' | 'expired';
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  source: string;
  action: string;
  resource: string;
  actor?: string;
  details?: any;
  hash: string;
  previousHash?: string;
  signature?: string;
  ipfsHash?: string;
  blockNumber?: number;
}

export interface Agent {
  did: string;
  document: DIDDocument;
  trustLevel: TrustLevel;
  credentials: VerifiableCredential[];
  permissions: PermissionGrant[];
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'suspended' | 'revoked';
}

// MFA Types
export interface MFASetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface MFAStatus {
  enabled: boolean;
  methods: string[];
  backupCodesRemaining: number;
  lastUsed?: string;
  strength: number;
}

// Error types
export class ATPError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ATPError';
  }
}

export class ATPNetworkError extends ATPError {
  constructor(message: string, public cause?: Error) {
    super(message, 'NETWORK_ERROR');
    this.name = 'ATPNetworkError';
  }
}

export class ATPAuthenticationError extends ATPError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'ATPAuthenticationError';
  }
}

export class ATPAuthorizationError extends ATPError {
  constructor(message: string = 'Authorization failed') {
    super(message, 'AUTHZ_ERROR', 403);
    this.name = 'ATPAuthorizationError';
  }
}

export class ATPValidationError extends ATPError {
  constructor(message: string, public validationErrors?: any[], public field?: string, public value?: any) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ATPValidationError';
  }
}

export class ATPServiceError extends ATPError {
  constructor(message: string, public service: string, public operation?: string) {
    super(message, 'SERVICE_ERROR', 500);
    this.name = 'ATPServiceError';
  }
}

// Event types for real-time updates
export interface ATPEvent {
  type: string;
  data: any;
  timestamp: string;
  source: string;
}

export type ATPEventHandler = (event: ATPEvent) => void;

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireOnly<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Additional types referenced in exports
export interface Service {
  id: string;
  type: string;
  serviceEndpoint: string;
}

export interface Proof {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  proofValue: string;
}

export interface CredentialSchema {
  id: string;
  name: string;
  description?: string;
  version: string;
  schema: any;
  createdAt: string;
  updatedAt: string;
}

export interface CredentialStatus {
  id: string;
  type: string;
  revocationListIndex?: number;
  revocationListCredential?: string;
}

export interface ProofOptions {
  type: string;
  created?: string;
  challenge?: string;
  domain?: string;
}

export interface RevocationList {
  id: string;
  type: string;
  encodedList: string;
  length: number;
}

export interface Permission {
  id: string;
  action: string;
  resource: string;
  effect: 'allow' | 'deny';
  conditions?: any[];
}

export interface PermissionPolicy {
  id: string;
  name: string;
  description?: string;
  version: string;
  rules: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface PolicyCondition {
  attribute: string;
  operator: string;
  value: any;
}

export interface AccessDecision {
  decision: 'allow' | 'deny';
  reason?: string;
  obligations?: any[];
}

export interface CapabilityToken {
  id: string;
  token: string;
  capabilities: string[];
  restrictions?: any;
  expiresAt: string;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
  id?: string;
}

export type MFAMethod = 'totp' | 'sms' | 'email' | 'webauthn';