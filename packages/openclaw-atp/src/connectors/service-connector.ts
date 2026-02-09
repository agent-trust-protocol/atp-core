/**
 * ATP Service Connector
 * 
 * Secure connector for external services with ATP protection
 */

import type { ATPClient } from 'atp-sdk';
import type { ExternalServiceConfig } from './types.js';
import { ATPSecretManager } from './secrets.js';

export class ATPServiceConnector {
  private atpClient: ATPClient;
  private secretManager: ATPSecretManager;
  private config: ExternalServiceConfig;

  constructor(atpClient: ATPClient, config: ExternalServiceConfig) {
    this.atpClient = atpClient;
    this.secretManager = new ATPSecretManager(atpClient);
    this.config = config;
  }

  /**
   * Make a secure HTTP request
   */
  async request(
    agentDid: string,
    method: string,
    path: string,
    data?: any
  ): Promise<any> {
    // Check allow-list
    if (this.config.allowList) {
      const allowed = this.config.allowList.some(pattern => 
        this.matchPattern(path, pattern)
      );

      if (!allowed) {
        throw new Error(`Path ${path} not in allow-list`);
      }
    }

    // Get scoped credential
    const credential = await this.secretManager.getCredential(
      agentDid,
      this.config.name,
      {
        resource: path,
        actions: [method.toLowerCase()]
      }
    );

    // DLP scan if enabled
    if (this.config.dlpEnabled && data) {
      await this.dlpScan(data);
    }

    // Make request
    const url = `${this.config.url}${path}`;
    
    // Log request
    await this.atpClient.audit.log({
      eventType: 'external-service-request',
      agentDid,
      severity: 'info',
      metadata: {
        service: this.config.name,
        method,
        path,
        url
      }
    });

    // In real implementation, make actual HTTP request
    // For now, return mock response
    return { success: true, data: {} };
  }

  /**
   * Match path against pattern
   */
  private matchPattern(path: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(path);
  }

  /**
   * DLP scan for sensitive data
   */
  private async dlpScan(data: any): Promise<void> {
    const dataStr = JSON.stringify(data);

    // Simple PII detection patterns
    const patterns = [
      { name: 'SSN', regex: /\b\d{3}-\d{2}-\d{4}\b/ },
      { name: 'Credit Card', regex: /\b\d{16}\b/ },
      { name: 'Email', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ }
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(dataStr)) {
        await this.atpClient.audit.log({
          eventType: 'dlp-violation',
          severity: 'warning',
          metadata: {
            service: this.config.name,
            piiType: pattern.name,
            message: `Potential ${pattern.name} detected in request`
          }
        });

        throw new Error(`DLP violation: ${pattern.name} detected`);
      }
    }
  }
}
