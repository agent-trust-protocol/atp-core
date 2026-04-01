/**
 * Tool Security Types
 */

import type { AgentContext } from '../agent/types.js';

export interface ToolSecurityConfig {
  /** Minimum trust score required (0.0 - 1.0) */
  minTrustScore?: number;
  
  /** Required policy set */
  requiredPolicy?: string;

  /** ATP action type for profile-based evaluation */
  actionType?: "shell" | "filesystem" | "network" | "credentials" | "messaging";
  
  /** Enable audit logging */
  auditRequired?: boolean;
  
  /** Rate limit (calls per minute) */
  rateLimit?: number;
  
  /** Allowed data classifications */
  allowedDataTypes?: string[];
  
  /** Enable DLP (Data Loss Prevention) checks */
  dlpEnabled?: boolean;
  
  /** Custom security validator */
  customValidator?: (context: AgentContext, args: any) => Promise<boolean>;
}

export interface ToolCallContext {
  /** Agent context */
  agentContext: AgentContext;
  
  /** Tool name */
  toolName: string;
  
  /** Tool arguments */
  arguments: Record<string, any>;
  
  /** Request ID */
  requestId: string;
  
  /** Call timestamp */
  timestamp: Date;
  
  /** Parent tool call (for nested calls) */
  parentCall?: string;
}

export interface ToolCallDecision {
  /** Is call allowed? */
  allowed: boolean;
  
  /** Reason if blocked */
  reason?: string;
  
  /** Security warnings (non-blocking) */
  warnings?: string[];
  
  /** Applied policy */
  appliedPolicy?: string;
  
  /** Trust check passed */
  trustCheckPassed: boolean;
  
  /** Permission check passed */
  permissionCheckPassed: boolean;
}

export interface ToolExecutionResult {
  /** Tool call was successful */
  success: boolean;
  
  /** Result data */
  result?: any;
  
  /** Error if failed */
  error?: Error;
  
  /** Execution time (ms) */
  executionTime: number;
  
  /** ATP metadata */
  atpMetadata: {
    /** Signature verified */
    signatureValid: boolean;
    
    /** Quantum-safe verified */
    quantumSafeVerified: boolean;
    
    /** Audit log ID */
    auditLogId?: string;
    
    /** Trust impact */
    trustImpact?: number;
  };
}

export interface RateLimitState {
  /** Tool name */
  toolName: string;
  
  /** Agent DID */
  agentDid: string;
  
  /** Call count in current window */
  callCount: number;
  
  /** Window start time */
  windowStart: Date;
  
  /** Window duration (ms) */
  windowDuration: number;
}
