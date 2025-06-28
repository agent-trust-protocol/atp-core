/**
 * ATP™ SDK - Agent Trust Protocol SDK
 * 
 * A comprehensive TypeScript SDK for interacting with Agent Trust Protocol™ services
 * 
 * @version 1.0.0
 * @author Agent Trust Protocol™ Team
 * @license MIT
 */

// Main ATP Client
export { ATPClient } from './client/atp.js';

// Service Clients
export { BaseClient } from './client/base.js';
export { IdentityClient } from './client/identity.js';
export { CredentialsClient } from './client/credentials.js';
export { PermissionsClient } from './client/permissions.js';
export { AuditClient } from './client/audit.js';
export { GatewayClient } from './client/gateway.js';

// Utility Classes
export { CryptoUtils } from './utils/crypto.js';
export { DIDUtils } from './utils/did.js';
export { JWTUtils } from './utils/jwt.js';

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
  WebSocketMessage
} from './types.js';

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
export const VERSION = '1.0.0';
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
      identity: `${baseUrl}:3001`,
      credentials: `${baseUrl}:3002`, 
      permissions: `${baseUrl}:3003`,
      audit: `${baseUrl}:3004`,
      gateway: `${baseUrl}:3000`
    }
  };
}

// SDK Metadata
export const SDK_INFO = {
  name: '@atp/sdk',
  version: VERSION,
  protocolVersion: PROTOCOL_VERSION,
  description: 'Official TypeScript SDK for Agent Trust Protocol™',
  repository: 'https://github.com/atp/sdk',
  documentation: 'https://docs.atp.protocol',
  support: 'https://support.atp.protocol'
} as const;