/**
 * Lunary → ATP Exporter
 *
 * Streams observability metrics from Lunary into ATP trust engine
 */

import type { ATPClient } from 'atp-sdk';
import type { LunaryMetrics } from './types.js';

export interface LunaryExporterConfig {
  /** Lunary API key */
  apiKey?: string;

  /** Lunary API endpoint */
  endpoint?: string;

  /** Export interval (ms) */
  interval?: number;

  /** Agent DID mapping */
  agentMapping?: Record<string, string>;

  /** Enable automatic trust updates */
  autoUpdateTrust?: boolean;
}

export class ATPLunaryExporter {
  private atpClient: ATPClient;
  private config: LunaryExporterConfig;
  private intervalId?: NodeJS.Timeout;

  constructor(atpClient: ATPClient, config: LunaryExporterConfig = {}) {
    this.atpClient = atpClient;
    this.config = {
      endpoint: config.endpoint || process.env.LUNARY_API_URL,
      apiKey: config.apiKey || process.env.LUNARY_API_KEY,
      interval: config.interval || 60000, // 1 minute default
      agentMapping: config.agentMapping || {},
      autoUpdateTrust: config.autoUpdateTrust ?? true
    };
  }

  /**
   * Start periodic export
   */
  start(): void {
    if (this.intervalId) {
      console.warn('Lunary exporter already running');
      return;
    }

    console.log(`🔄 Starting Lunary → ATP export (interval: ${this.config.interval}ms)`);

    // Run immediately
    this.export().catch(console.error);

    // Then run periodically
    this.intervalId = setInterval(() => {
      this.export().catch(console.error);
    }, this.config.interval);
  }

  /**
   * Stop periodic export
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      console.log('⏹  Stopped Lunary → ATP export');
    }
  }

  /**
   * Export metrics once
   */
  async export(): Promise<void> {
    try {
      // Fetch metrics from Lunary
      const metrics = await this.fetchLunaryMetrics();

      for (const metric of metrics) {
        await this.processMetric(metric);
      }

      console.log(`✅ Exported ${metrics.length} metrics to ATP`);
    } catch (error) {
      console.error('❌ Lunary export error:', error);
    }
  }

  /**
   * Fetch metrics from Lunary API
   */
  private async fetchLunaryMetrics(): Promise<LunaryMetrics[]> {
    if (!this.config.endpoint || !this.config.apiKey) {
      console.warn('Lunary API not configured, using mock data');
      return this.getMockMetrics();
    }

    // In real implementation, call Lunary API
    // const response = await fetch(`${this.config.endpoint}/metrics`, {
    //   headers: { 'Authorization': `Bearer ${this.config.apiKey}` }
    // });
    // return await response.json();

    return this.getMockMetrics();
  }

  /**
   * Process a single metric
   */
  private async processMetric(metric: LunaryMetrics): Promise<void> {
    // Map Lunary agent to ATP DID
    const agentDid = this.config.agentMapping?.[metric.agent];

    if (!agentDid) {
      console.warn(`No ATP DID mapping for Lunary agent: ${metric.agent}`);
      return;
    }

    // Calculate error rate
    const errorRate = metric.requests > 0 ? metric.errors / metric.requests : 0;

    // Store behavior metrics in ATP
    await this.atpClient.audit.log({
      eventType: 'lunary-metrics-import',
      agentDid,
      severity: 'info',
      metadata: {
        source: 'lunary',
        requests: metric.requests,
        errors: metric.errors,
        errorRate,
        latency: metric.latency,
        tokens: metric.tokens,
        cost: metric.cost,
        period: metric.period
      }
    });

    // Update trust score if enabled
    if (this.config.autoUpdateTrust) {
      await this.updateTrustFromMetrics(agentDid, metric);
    }
  }

  /**
   * Update agent trust score based on metrics
   */
  private async updateTrustFromMetrics(agentDid: string, metric: LunaryMetrics): Promise<void> {
    let trustDelta = 0;
    const reasons: string[] = [];

    // Calculate trust delta based on error rate
    const errorRate = metric.requests > 0 ? metric.errors / metric.requests : 0;

    if (errorRate > 0.3) {
      trustDelta -= 0.02;
      reasons.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
    } else if (errorRate < 0.05 && metric.requests > 10) {
      trustDelta += 0.005;
      reasons.push(`Low error rate: ${(errorRate * 100).toFixed(1)}%`);
    }

    // Factor in latency
    if (metric.latency > 5000) {
      trustDelta -= 0.005;
      reasons.push(`High latency: ${metric.latency}ms`);
    }

    // Apply trust update if significant
    if (Math.abs(trustDelta) >= 0.001) {
      try {
        await this.atpClient.identity.updateTrustLevel({
          did: agentDid,
          delta: trustDelta,
          reason: `Lunary metrics: ${reasons.join(', ')}`,
          evidence: {
            requests: metric.requests,
            errors: metric.errors,
            errorRate,
            latency: metric.latency
          }
        });

        console.log(`📊 Trust updated for ${agentDid}: ${trustDelta > 0 ? '+' : ''}${trustDelta.toFixed(3)}`);
      } catch (error) {
        console.error(`Failed to update trust for ${agentDid}:`, error);
      }
    }
  }

  /**
   * Get mock metrics for testing
   */
  private getMockMetrics(): LunaryMetrics[] {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);

    return [
      {
        agent: 'market-researcher',
        requests: 45,
        errors: 2,
        latency: 234,
        tokens: 12500,
        cost: 0.15,
        period: { start: oneHourAgo, end: now }
      },
      {
        agent: 'trader',
        requests: 12,
        errors: 0,
        latency: 189,
        tokens: 3200,
        cost: 0.04,
        period: { start: oneHourAgo, end: now }
      }
    ];
  }
}
