/**
 * ATP™ SDK - Agent Trust Protocol SDK
 *
 * The first quantum-safe AI agent SDK with zero-knowledge proof authentication.
 * Build secure, verifiable, and trustworthy AI agent applications.
 *
 * Features:
 * - Quantum-Safe Cryptography (ML-DSA + Ed25519 hybrid) - enabled by default
 * - Zero-Knowledge Proof Authentication - prove identity without revealing secrets
 * - Decentralized Identity (DID) management
 * - Verifiable Credentials
 * - Policy-based access control
 * - Blockchain-anchored audit trails
 *
 * @version 1.2.0
 * @author Agent Trust Protocol™ Team
 * @license Apache-2.0
 */

// Simplified Agent API (3-line quick start!)
export { Agent, type SimpleAgentOptions } from './simple-agent.js';
export { Agent as default } from './simple-agent.js';

// Main ATP Client
export { ATPClient } from './client/atp.js';

// Service Clients
export { BaseClient } from './client/base.js';
export { IdentityClient } from './client/identity.js';
export { CredentialsClient } from './client/credentials.js';
export { PermissionsClient } from './client/permissions.js';
export { AuditClient } from './client/audit.js';
export { GatewayClient } from './client/gateway.js';
export { PaymentsClient } from './client/payments.js';

// Multi-Protocol Support (NEW in v1.1.0)
export {
  Protocol,
  ProtocolDetector,
  BaseProtocolAdapter,
  MCPAdapter
} from './protocols/index.js';

export { UniversalMonitor, SecurityEnforcer } from './monitoring/index.js';

// Utility Classes
export { CryptoUtils } from './utils/crypto.js';
export { DIDUtils } from './utils/did.js';
export { JWTUtils } from './utils/jwt.js';
export { VersionManager, versionManager } from './utils/version-manager.js';
export type { ProtocolVersion, AgentVersion, SDKCompatibility } from './utils/version-manager.js';

// ZKP Authentication Utilities (NEW - Agent-to-Agent Auth)
export {
  // Core ZKP Functions
  generatePedersenCommitment,
  generateRandomBlinding,
  generateNonce,
  generateChallengeHash,
  createChallenge,
  isChallengeExpired,
  // Proof Generation
  createTrustLevelProof,
  createCredentialProof,
  createIdentityProof,
  createBehaviorCommitment,
  createBehaviorProof,
  // Proof Verification
  verifyTrustLevelProof,
  verifyCredentialProof,
  verifyIdentityProof,
  verifyBehaviorProof,
  // Auth Flow
  generateAuthResponse,
  verifyAuthResponse,
  // Behavior Tracking
  BehaviorMerkleTree
} from './utils/zkp.js';

// ZKP Proof Type Enum (exported as value for use in comparisons)
export { ZKProofType } from './types.js';

// Types and Interfaces
export type {
  // Core Configuration
  ATPConfig,
  ATPResponse,
  ATPError,
  ATPNetworkError,
  ATPAuthenticationError,
  ATPAuthorizationError,
  ATPValidationError,
  ATPServiceError,

  // ZKP Authentication Types (NEW)
  ZKPChallenge,
  ZKPRequirement,
  ZKPProof,
  ZKPAuthRequest,
  ZKPAuthResult,
  BehaviorCommitment,
  BehaviorProofRequest,
  BehaviorProof,

  // Identity Types
  DIDDocument,
  VerificationMethod,
  Service,
  TrustLevel,
  MFAMethod,

  // Credentials Types
  VerifiableCredential,
  VerifiablePresentation,
  CredentialSchema,
  CredentialStatus,
  ProofOptions,
  RevocationList,

  // Permissions Types
  Permission,
  PermissionGrant,
  PermissionPolicy,
  PolicyCondition,
  AccessDecision,
  CapabilityToken,

  // Audit Types
  AuditEvent,
  ATPEvent,
  ATPEventHandler,

  // WebSocket Events
  WebSocketMessage,

  // Payment Protocol Types (AP2 & ACP)
  PaymentMandate,
  IntentMandate,
  CartMandate,
  CartItem,
  PaymentMethod,
  PaymentMethodDetails,
  PaymentTransaction,
  PaymentResult,
  ACPCheckoutSession,
  Address,
  PaymentPolicy,
  AP2MandateRequest,
  PaymentWallet,
  PaymentEventType,
  PaymentEvent,

  // Multi-Protocol Support Types (NEW in v1.1.0)
  ProtocolInfo,
  ProtocolAdapter,
  Agent as ProtocolAgent,
  AgentEvent,
  Message,
  SecuredMessage,
  VerificationResult,
  ProtocolAuditEntry,
  Observable,
  MonitoringStream
} from './types.js';

// Re-export protocol types
export type {
  ProtocolAdapterConfig,
  DetectionResult,
  UniversalMonitorConfig,
  SecurityConfig
} from './protocols/index.js';

// Re-export specific interfaces for easier access
export type {
  // Client-specific types from service files
  DIDRegistrationRequest,
  MFASetupRequest,
  TrustLevelUpdateRequest,
  MFAVerificationRequest
} from './client/identity.js';

export type {
  CredentialIssuanceRequest,
  CredentialVerificationRequest,
  PresentationRequest
} from './client/credentials.js';

export type {
  PermissionRequest,
  AccessRequest,
  PolicyRule,
  PermissionQuery
} from './client/permissions.js';

export type {
  AuditLogRequest,
  AuditQuery,
  IntegrityVerification,
  AuditStats,
  BlockchainAnchor
} from './client/audit.js';

export type {
  GatewayStatus,
  RouteInfo,
  ConnectionStats,
  SecurityEvent
} from './client/gateway.js';

// Version information
export const VERSION = '1.2.0';
export const PROTOCOL_VERSION = '1.0';

// Constants
export const ATP_CONSTANTS = {
  DEFAULT_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  DEFAULT_JWT_EXPIRY: '1h',
  DEFAULT_REFRESH_TOKEN_EXPIRY: '30d',
  SUPPORTED_DID_METHODS: ['atp', 'key', 'web'],
  SUPPORTED_NETWORKS: ['mainnet', 'testnet', 'local'],
  DEFAULT_NETWORK: 'mainnet'
} as const;

// Re-import for function implementations
import { ATPClient } from './client/atp.js';
import type { ATPConfig } from './types.js';

// Helper functions for quick SDK setup
export function createATPClient(config: ATPConfig): ATPClient {
  return new ATPClient(config);
}

export function createQuickConfig(baseUrl: string, options?: {
  timeout?: number;
  retries?: number;
  auth?: {
    did?: string;
    privateKey?: string;
    token?: string;
  };
}): ATPConfig {
  return {
    baseUrl,
    timeout: options?.timeout || ATP_CONSTANTS.DEFAULT_TIMEOUT,
    retries: options?.retries || ATP_CONSTANTS.MAX_RETRIES,
    retryDelay: ATP_CONSTANTS.RETRY_DELAY,
    auth: options?.auth || {},
    services: {
      identity: process.env.ATP_IDENTITY_URL || `${baseUrl}:3001`,
      credentials: process.env.ATP_CREDENTIALS_URL || `${baseUrl}:3002`,
      permissions: process.env.ATP_PERMISSIONS_URL || `${baseUrl}:3003`,
      audit: process.env.ATP_AUDIT_URL || `${baseUrl}:3005`,
      gateway: process.env.ATP_GATEWAY_URL || `${baseUrl}:3000`
    }
  };
}

// SDK Metadata
export const SDK_INFO = {
  name: 'atp-sdk',
  version: VERSION,
  protocolVersion: PROTOCOL_VERSION,
  description: 'Official TypeScript SDK for Agent Trust Protocol™',
  repository: 'https://github.com/atp/sdk',
  documentation: 'https://docs.atp.protocol',
  support: 'https://support.atp.protocol'
} as const;
