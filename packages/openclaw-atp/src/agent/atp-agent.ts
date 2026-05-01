/**
 * ATP OpenClaw Agent Wrapper
 *
 * Base class for OpenClaw agents with ATP identity and security
 */

import type { ATPClient } from 'atp-sdk';
import type { AgentMetadata, AgentContext } from './types.js';
import { registerAgentWithAtp, updateAgentTrust } from './registration.js';

export interface AtpOpenClawAgentConfig {
  /** Agent name */
  name: string;

  /** Agent role */
  role: string;

  /** ATP client */
  atpClient: ATPClient;

  /** Base agent configuration (for LangChain/CrewAI agents) */
  baseConfig?: any;

  /** Initial trust level */
  trustLevel?: string;

  /** Policy profile */
  policyProfile?: string;

  /** Enable auto trust updates */
  autoUpdateTrust?: boolean;
}

/**
 * ATP-enhanced OpenClaw Agent
 *
 * Wraps any OpenClaw agent (LangChain, CrewAI, etc.) with ATP identity and security
 */
export class AtpOpenClawAgent {
  public readonly name: string;
  public readonly role: string;
  public readonly atpClient: ATPClient;
  public agentMeta?: AgentMetadata;

  private baseConfig: any;
  private autoUpdateTrust: boolean;
  private taskHistory: Array<{ success: boolean; timestamp: Date }> = [];

  constructor(config: AtpOpenClawAgentConfig) {
    this.name = config.name;
    this.role = config.role;
    this.atpClient = config.atpClient;
    this.baseConfig = config.baseConfig || {};
    this.autoUpdateTrust = config.autoUpdateTrust ?? true;
  }

  /**
   * Initialize agent with ATP identity
   */
  async initialize(): Promise<void> {
    this.agentMeta = await registerAgentWithAtp(this.atpClient, {
      name: this.name,
      role: this.role,
      trustLevel: this.baseConfig.trustLevel || 'verified',
      capabilities: this.baseConfig.capabilities || [],
      policyProfile: this.baseConfig.policyProfile || 'default',
      quantumSafe: true
    });

    console.log(`🔐 ATP Agent initialized: ${this.name} (${this.agentMeta.did})`);
  }

  /**
   * Get agent context for task execution
   */
  getContext(taskId?: string): AgentContext {
    if (!this.agentMeta) {
      throw new Error('Agent not initialized. Call initialize() first.');
    }

    return {
      atp: this.agentMeta,
      taskId,
      sessionId: this.generateSessionId()
    };
  }

  /**
   * Record successful action
   */
  async recordSuccess(actionType: string, metadata?: Record<string, any>): Promise<void> {
    if (!this.agentMeta) return;

    this.taskHistory.push({ success: true, timestamp: new Date() });

    if (this.autoUpdateTrust && this.shouldUpdateTrust()) {
      const delta = this.calculateTrustDelta();
      if (delta !== 0) {
        this.agentMeta = await updateAgentTrust(
          this.atpClient,
          this.agentMeta,
          delta,
          `Automated trust update based on ${actionType}`,
          { actionType, ...metadata }
        );
      }
    }

    // Log action
    await this.atpClient.audit.log({
      eventType: 'agent-action-success',
      agentDid: this.agentMeta.did,
      severity: 'info',
      metadata: {
        actionType,
        trustScore: this.agentMeta.trustScore,
        ...metadata
      }
    });
  }

  /**
   * Record failed action
   */
  async recordFailure(actionType: string, error: Error, metadata?: Record<string, any>): Promise<void> {
    if (!this.agentMeta) return;

    this.taskHistory.push({ success: false, timestamp: new Date() });

    if (this.autoUpdateTrust && this.shouldUpdateTrust()) {
      const delta = this.calculateTrustDelta();
      if (delta < 0) {
        this.agentMeta = await updateAgentTrust(
          this.atpClient,
          this.agentMeta,
          delta,
          `Trust decreased due to failed ${actionType}: ${error.message}`,
          { actionType, error: error.message, ...metadata }
        );
      }
    }

    // Log failure
    await this.atpClient.audit.log({
      eventType: 'agent-action-failure',
      agentDid: this.agentMeta.did,
      severity: 'warning',
      metadata: {
        actionType,
        error: error.message,
        trustScore: this.agentMeta.trustScore,
        ...metadata
      }
    });
  }

  /**
   * Get current trust score
   */
  getTrustScore(): number {
    return this.agentMeta?.trustScore || 0;
  }

  /**
   * Get agent DID
   */
  getDID(): string {
    return this.agentMeta?.did || '';
  }

  /**
   * Check if agent has sufficient trust for an action
   */
  hasSufficientTrust(requiredTrust: number): boolean {
    const currentTrust = this.getTrustScore();
    return currentTrust >= requiredTrust;
  }

  /**
   * Calculate trust delta based on recent history
   */
  private calculateTrustDelta(): number {
    const recentActions = this.taskHistory.slice(-10);
    if (recentActions.length === 0) return 0;

    const successRate = recentActions.filter(a => a.success).length / recentActions.length;

    // Increase trust for high success rate
    if (successRate >= 0.9) return 0.01;
    if (successRate >= 0.8) return 0.005;

    // Decrease trust for low success rate
    if (successRate <= 0.5) return -0.02;
    if (successRate <= 0.7) return -0.01;

    return 0;
  }

  /**
   * Check if trust should be updated (throttle updates)
   */
  private shouldUpdateTrust(): boolean {
    if (!this.agentMeta) return false;

    const timeSinceLastUpdate = Date.now() - this.agentMeta.lastTrustUpdate.getTime();
    const minUpdateInterval = 60 * 1000; // 1 minute

    return timeSinceLastUpdate >= minUpdateInterval && this.taskHistory.length >= 5;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
