/**
 * Motleycrew ATP Integration - Main Client
 * 
 * Simplified client for Motleycrew + ATP integration
 */

import type { ATPClient } from 'atp-sdk';
import { registerAgentWithAtp } from './agent/registration.js';
import { secureTools } from './tools/wrapper.js';
import { ATPGraphValidator } from './graph/validator.js';
import { ATPMonitor } from './observability/monitor.js';
import type { AgentRegistrationOptions } from './agent/types.js';
import type { ToolSecurityConfig } from './tools/types.js';
import type { InterAgentPolicy, WorkflowConstraints } from './graph/types.js';

export interface MotleycrewIntegrationConfig {
  /** ATP client instance */
  atpClient: ATPClient;
  
  /** Default tool security config */
  defaultToolSecurity?: ToolSecurityConfig;
  
  /** Inter-agent policies */
  interAgentPolicies?: InterAgentPolicy[];
  
  /** Workflow constraints */
  workflowConstraints?: WorkflowConstraints;
  
  /** Enable monitoring */
  enableMonitoring?: boolean;
}

/**
 * Simplified Motleycrew ATP Client
 * 
 * Provides high-level API for integrating ATP with Motleycrew
 */
export class MotleycrewATPClient {
  public readonly atp: ATPClient;
  public readonly monitor?: ATPMonitor;
  private graphValidator?: ATPGraphValidator;
  private config: MotleycrewIntegrationConfig;

  constructor(config: MotleycrewIntegrationConfig) {
    this.config = config;
    this.atp = config.atpClient;

    if (config.enableMonitoring) {
      this.monitor = new ATPMonitor(this.atp);
    }

    if (config.interAgentPolicies || config.workflowConstraints) {
      this.graphValidator = new ATPGraphValidator(
        this.atp,
        config.interAgentPolicies,
        config.workflowConstraints
      );
    }
  }

  /**
   * Register an agent with ATP
   */
  async registerAgent(options: AgentRegistrationOptions) {
    return await registerAgentWithAtp(this.atp, options);
  }

  /**
   * Secure tools with ATP
   */
  secureTools(tools: any[], config?: ToolSecurityConfig) {
    return secureTools(tools, this.atp, {
      ...this.config.defaultToolSecurity,
      ...config
    });
  }

  /**
   * Validate agent graph
   */
  async validateGraph(nodes: any[], edges: any[]) {
    if (!this.graphValidator) {
      throw new Error('Graph validator not configured. Provide interAgentPolicies or workflowConstraints.');
    }

    return await this.graphValidator.validateGraph(nodes, edges);
  }

  /**
   * Get agent trust scores
   */
  async getTrustScores() {
    if (!this.monitor) {
      throw new Error('Monitoring not enabled');
    }

    return await this.monitor.getAgentTrustScores();
  }

  /**
   * Get behavior metrics for an agent
   */
  async getMetrics(agentDid: string) {
    if (!this.monitor) {
      throw new Error('Monitoring not enabled');
    }

    return await this.monitor.getBehaviorMetrics(agentDid);
  }

  /**
   * Detect anomalies
   */
  async detectAnomalies(agentDid: string) {
    if (!this.monitor) {
      throw new Error('Monitoring not enabled');
    }

    return await this.monitor.detectAnomalies(agentDid);
  }
}
