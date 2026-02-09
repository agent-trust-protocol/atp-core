/**
 * Task Security Types
 */

export interface TaskSecurityMetadata {
  /** Minimum trust score required to execute this task */
  requiredTrust: number;
  
  /** Required policy set name */
  policy: string;
  
  /** Data classification (public, internal, confidential, pii, financial) */
  dataClassification: 'public' | 'internal' | 'confidential' | 'pii' | 'financial';
  
  /** Sensitivity level */
  sensitivityLevel: 'low' | 'medium' | 'high' | 'critical';
  
  /** Enable enhanced audit logging */
  enhancedAudit?: boolean;
  
  /** Require MFA for this task */
  requireMFA?: boolean;
  
  /** Maximum execution time (ms) */
  maxExecutionTime?: number;
  
  /** Allowed agent roles */
  allowedRoles?: string[];
  
  /** Custom validators */
  validators?: Array<(context: any) => Promise<boolean>>;
}

export interface TaskValidationResult {
  /** Is task allowed to execute? */
  allowed: boolean;
  
  /** Validation errors */
  errors: string[];
  
  /** Validation warnings */
  warnings: string[];
  
  /** Applied policies */
  appliedPolicies: string[];
  
  /** Trust check results */
  trustCheck: {
    currentScore: number;
    requiredScore: number;
    passed: boolean;
  };
  
  /** Permission check results */
  permissionCheck: {
    passed: boolean;
    missingPermissions?: string[];
  };
}

export interface TaskExecutionContext {
  /** Task ID */
  taskId: string;
  
  /** Task name */
  taskName: string;
  
  /** Assigned agent DID */
  agentDid: string;
  
  /** Security metadata */
  security: TaskSecurityMetadata;
  
  /** Task inputs */
  inputs: Record<string, any>;
  
  /** Execution start time */
  startTime: Date;
  
  /** Parent task (if subtask) */
  parentTaskId?: string;
}
