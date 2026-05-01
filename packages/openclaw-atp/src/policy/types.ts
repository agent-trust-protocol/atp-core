/**
 * ATP Policy Profile Types
 */

import type { InterAgentPolicy, WorkflowConstraints } from '../graph/types.js';

export type { WorkflowConstraints } from '../graph/types.js';

export interface PolicyRule {
  /** Rule ID */
  id: string;

  /** Rule name */
  name: string;

  /** Action (execute, read, write, delete) */
  action: string;

  /** Resource pattern */
  resource: string;

  /** Effect (allow, deny) */
  effect: 'allow' | 'deny';

  /** Conditions */
  conditions?: string[];

  /** Priority (higher wins) */
  priority?: number;
}

export interface PolicyProfileConfig {
  /** Profile name */
  name: string;

  /** Profile description */
  description?: string;

  /** Inter-agent policies */
  interAgentRules: InterAgentPolicy[];

  /** Workflow constraints */
  workflowConstraints: WorkflowConstraints;

  /** Tool-level rules */
  toolRules?: Record<string, {
    minTrustScore: number;
    allowedRoles?: string[];
    rateLimit?: number;
  }>;

  /** Data classification rules */
  dataClassificationRules?: PolicyRule[];
}
