/**
 * OpenClaw ATP Integration Types
 */

import type { ATPConfig } from 'atp-sdk';
import type { ToolSecurityConfig } from './tools/types.js';
import type { InterAgentPolicy, WorkflowConstraints } from './graph/types.js';

export interface OpenClawIntegrationConfig {
  /** ATP configuration */
  atpConfig: ATPConfig;
  
  /** Default tool security config */
  defaultToolSecurity?: ToolSecurityConfig;
  
  /** Inter-agent policies */
  interAgentPolicies?: InterAgentPolicy[];
  
  /** Workflow constraints */
  workflowConstraints?: WorkflowConstraints;
  
  /** Enable monitoring */
  enableMonitoring?: boolean;
  
  /** Enable Lunary integration */
  enableLunary?: boolean;
  
  /** Lunary configuration */
  lunaryConfig?: {
    apiKey?: string;
    endpoint?: string;
    agentMapping?: Record<string, string>;
  };
}
