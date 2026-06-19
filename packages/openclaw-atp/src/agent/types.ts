/**
 * ATP Agent Types
 */

import type { TrustLevel, DIDDocument } from 'atp-sdk';

export interface AgentMetadata {
  /** ATP-assigned agent DID */
  did: string;
  
  /** Agent's public key (Ed25519 + ML-DSA-65 hybrid) */
  publicKey: string;
  
  /** Agent's private key (encrypted at rest) */
  privateKey: string;
  
  /** Current trust score (0.0 - 1.0) */
  trustScore: number;
  
  /** Trust level classification */
  trustLevel: TrustLevel;
  
  /** Policy profile ID */
  policyProfileId: string;
  
  /** Agent role/purpose */
  role: string;
  
  /** Agent capabilities */
  capabilities: string[];
  
  /** Registration timestamp */
  registeredAt: Date;
  
  /** Last trust update timestamp */
  lastTrustUpdate: Date;
  
  /** Full DID document */
  didDocument?: DIDDocument;
}

export interface AgentRegistrationOptions {
  /** Agent name */
  name: string;
  
  /** Agent role (e.g., "content_writer", "trader", "researcher") */
  role: string;
  
  /** Initial trust level */
  trustLevel?: TrustLevel | 'basic' | 'verified' | 'elevated' | 'privileged';
  
  /** Agent capabilities */
  capabilities?: string[];
  
  /** Initial policy profile */
  policyProfile?: string;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
  
  /** Enable quantum-safe crypto (default: true) */
  quantumSafe?: boolean;
  
  /** Enable MFA for this agent */
  requireMFA?: boolean;
}

export interface AgentContext {
  /** Agent metadata */
  atp: AgentMetadata;
  
  /** Current task context */
  taskId?: string;
  
  /** Parent agent (if this is a sub-agent) */
  parentAgent?: string;
  
  /** Session ID */
  sessionId?: string;
  
  /** Additional context */
  [key: string]: any;
}

export interface TrustUpdateRequest {
  /** Agent DID */
  agentId: string;
  
  /** New trust score */
  trustScore?: number;
  
  /** Trust adjustment delta */
  delta?: number;
  
  /** Reason for update */
  reason: string;
  
  /** Supporting evidence */
  evidence?: {
    successfulActions?: number;
    failedActions?: number;
    policyViolations?: number;
    anomalyScore?: number;
  };
}
