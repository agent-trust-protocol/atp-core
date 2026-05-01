/**
 * ATP Monitor
 *
 * Monitor agent behavior and security events
 */

import type { ATPClient } from 'atp-sdk';
import type { BehaviorMetrics, AnomalyDetection } from './types.js';

export class ATPMonitor {
  private atpClient: ATPClient;
  private metricsCache: Map<string, BehaviorMetrics> = new Map();
  private cacheExpiry = 60000; // 1 minute

  constructor(atpClient: ATPClient) {
    this.atpClient = atpClient;
  }

  /**
   * Get trust scores for all agents
   */
  async getAgentTrustScores(): Promise<Record<string, number>> {
    // Query ATP identity service for all agents
    // This is a simplified implementation
    const scores: Record<string, number> = {};

    // In real implementation, would query identity service
    // for (const agent of agents) {
    //   scores[agent.did] = agent.trustScore;
    // }

    return scores;
  }

  /**
   * Get policy violations for a time period
   */
  async getPolicyViolations(since?: string): Promise<any[]> {
    const query: any = {
      eventTypes: ['tool-execution-blocked', 'task-validation-failed', 'policy-violation'],
      severity: 'warning'
    };

    if (since) {
      query.since = this.parseTimeString(since);
    }

    const events = await this.atpClient.audit.query(query);
    return events.events || [];
  }

  /**
   * Get tool usage statistics
   */
  async getToolUsageStats(agentName?: string): Promise<Record<string, number>> {
    const query: any = {
      eventTypes: ['tool-execution-success', 'tool-execution-failure']
    };

    if (agentName) {
      query.agentName = agentName;
    }

    const events = await this.atpClient.audit.query(query);

    const usage: Record<string, number> = {};

    for (const event of events.events || []) {
      const toolName = event.metadata?.toolName;
      if (toolName) {
        usage[toolName] = (usage[toolName] || 0) + 1;
      }
    }

    return usage;
  }

  /**
   * Get security events
   */
  async getSecurityEvents(severity?: 'low' | 'medium' | 'high' | 'critical'): Promise<any[]> {
    const query: any = {
      eventTypes: [
        'security-alert',
        'authentication-failure',
        'unauthorized-access',
        'anomaly-detected'
      ]
    };

    if (severity) {
      query.severity = severity;
    }

    const events = await this.atpClient.audit.query(query);
    return events.events || [];
  }

  /**
   * Get behavior metrics for an agent
   */
  async getBehaviorMetrics(agentDid: string, forceRefresh = false): Promise<BehaviorMetrics> {
    // Check cache
    if (!forceRefresh && this.metricsCache.has(agentDid)) {
      const cached = this.metricsCache.get(agentDid)!;
      // Check if cache is still valid
      const cacheAge = Date.now() - (cached as any)._cachedAt;
      if (cacheAge < this.cacheExpiry) {
        return cached;
      }
    }

    // Query audit logs for agent
    const events = await this.atpClient.audit.query({
      agentDid,
      eventTypes: [
        'tool-execution-success',
        'tool-execution-failure',
        'policy-violation',
        'task-execution-success',
        'task-execution-failure'
      ],
      since: new Date(Date.now() - 86400000) // Last 24 hours
    });

    // Calculate metrics
    const metrics: BehaviorMetrics = this.calculateMetrics(agentDid, events.events || []);

    // Cache metrics
    (metrics as any)._cachedAt = Date.now();
    this.metricsCache.set(agentDid, metrics);

    return metrics;
  }

  /**
   * Detect anomalies in agent behavior
   */
  async detectAnomalies(agentDid: string): Promise<AnomalyDetection> {
    const metrics = await this.getBehaviorMetrics(agentDid);

    // Simple anomaly detection rules
    let score = 0;
    let type: any = undefined;
    let description = '';
    let recommendedAction: any = 'monitor';

    // Check error rate
    if (metrics.errorRate > 0.3) {
      score = Math.max(score, metrics.errorRate);
      type = 'error';
      description = `High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`;
      recommendedAction = 'investigate';
    }

    // Check policy violations
    if (metrics.policyViolations > 5) {
      score = Math.max(score, 0.7);
      type = 'security';
      description = `Multiple policy violations: ${metrics.policyViolations}`;
      recommendedAction = 'alert';
    }

    // Check success rate drop
    if (metrics.successRate < 0.7 && metrics.totalActions > 10) {
      score = Math.max(score, 0.6);
      type = 'pattern';
      description = `Low success rate: ${(metrics.successRate * 100).toFixed(1)}%`;
      recommendedAction = 'monitor';
    }

    const detected = score > 0.5;

    return {
      detected,
      score,
      type,
      description,
      recommendedAction,
      trustImpact: detected ? -0.05 * score : 0
    };
  }

  /**
   * Calculate metrics from events
   */
  private calculateMetrics(agentDid: string, events: any[]): BehaviorMetrics {
    let totalActions = 0;
    let successfulActions = 0;
    let failedActions = 0;
    let totalExecutionTime = 0;
    let policyViolations = 0;
    const toolUsage: Record<string, number> = {};
    const anomalies: any[] = [];

    for (const event of events) {
      const eventType = event.eventType;

      if (eventType.includes('success')) {
        successfulActions++;
        totalActions++;

        if (event.metadata?.executionTime) {
          totalExecutionTime += event.metadata.executionTime;
        }
      } else if (eventType.includes('failure')) {
        failedActions++;
        totalActions++;
      } else if (eventType.includes('violation') || eventType.includes('blocked')) {
        policyViolations++;
      }

      // Track tool usage
      if (event.metadata?.toolName) {
        const tool = event.metadata.toolName;
        toolUsage[tool] = (toolUsage[tool] || 0) + 1;
      }

      // Collect anomalies
      if (event.metadata?.anomaly) {
        anomalies.push({
          type: event.metadata.anomaly.type,
          severity: event.metadata.anomaly.score || 0.5,
          timestamp: new Date(event.timestamp),
          description: event.metadata.anomaly.description
        });
      }
    }

    return {
      agentDid,
      totalActions,
      successfulActions,
      failedActions,
      successRate: totalActions > 0 ? successfulActions / totalActions : 0,
      avgExecutionTime: totalActions > 0 ? totalExecutionTime / totalActions : 0,
      errorRate: totalActions > 0 ? failedActions / totalActions : 0,
      toolUsage,
      policyViolations,
      anomalies
    };
  }

  /**
   * Parse time string (e.g., "24h", "7d", "1w")
   */
  private parseTimeString(timeStr: string): Date {
    const match = timeStr.match(/^(\d+)([hdw])$/);

    if (!match) {
      throw new Error(`Invalid time string: ${timeStr}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const now = Date.now();
    let ms = 0;

    switch (unit) {
      case 'h': ms = value * 60 * 60 * 1000; break;
      case 'd': ms = value * 24 * 60 * 60 * 1000; break;
      case 'w': ms = value * 7 * 24 * 60 * 60 * 1000; break;
    }

    return new Date(now - ms);
  }
}
