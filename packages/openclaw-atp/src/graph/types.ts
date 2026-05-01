/**
 * Graph Validation Types
 */

export interface GraphValidationResult {
  /** Is the graph valid? */
  isValid: boolean;

  /** Validation errors */
  errors: Array<{
    type: 'agent' | 'edge' | 'task' | 'policy' | 'workflow';
    message: string;
    source?: string;
    target?: string;
    severity: 'error' | 'warning';
  }>;

  /** Warnings (non-blocking) */
  warnings: string[];

  /** Validated agents */
  validatedAgents: string[];

  /** Validated edges */
  validatedEdges: Array<{ from: string; to: string; allowed: boolean }>;

  /** Applied policies */
  appliedPolicies: string[];
}

export interface InterAgentPolicy {
  /** Source agent (name or role pattern) */
  from: string;

  /** Target agent (name or role pattern) */
  to: string;

  /** Is this connection allowed? */
  allowed: boolean;

  /** Allowed data types for this edge */
  allowedDataTypes?: string[];

  /** Required trust level for source agent */
  minTrustLevel?: number;

  /** Additional conditions */
  conditions?: Array<(fromAgent: any, toAgent: any) => boolean>;
}

export interface WorkflowConstraints {
  /** Maximum chain depth (A → B → C = depth 2) */
  maxChainDepth?: number;

  /** Maximum fan-out (one agent calling N others) */
  maxFanOut?: number;

  /** Are cycles allowed? */
  allowCycles?: boolean;

  /** Maximum execution time per workflow (ms) */
  maxWorkflowTime?: number;

  /** Minimum trust score for any agent in workflow */
  minWorkflowTrust?: number;

  /** Blacklisted agent pairs */
  forbiddenPairs?: Array<[string, string]>;
}

export interface GraphNode {
  /** Agent name */
  name: string;

  /** Agent role */
  role: string;

  /** Agent DID */
  did?: string;

  /** Trust score */
  trustScore?: number;

  /** Available tools */
  tools?: string[];

  /** Capabilities */
  capabilities?: string[];
}

export interface GraphEdge {
  /** Source agent name */
  from: string;

  /** Target agent name */
  to: string;

  /** Data flow type */
  dataType?: string;

  /** Edge metadata */
  metadata?: Record<string, any>;
}
