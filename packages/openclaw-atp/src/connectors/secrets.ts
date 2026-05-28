/**
 * ATP Secret Manager
 * 
 * Manages short-lived, scoped credentials for external services
 */

import type { ATPClient } from 'atp-sdk';
import type { CredentialScope } from './types.js';

export class ATPSecretManager {
  private atpClient: ATPClient;
  private secretCache: Map<string, { value: string; expiresAt: Date }> = new Map();

  constructor(atpClient: ATPClient) {
    this.atpClient = atpClient;
  }

  /**
   * Get a scoped credential for an agent
   */
  async getCredential(
    agentDid: string,
    serviceName: string,
    scope: CredentialScope
  ): Promise<string> {
    const cacheKey = `${agentDid}:${serviceName}:${scope.resource}`;

    // Check cache
    const cached = this.secretCache.get(cacheKey);
    if (cached && cached.expiresAt > new Date()) {
      return cached.value;
    }

    // Request new credential from ATP
    // In real implementation, this would call ATP's credential service
    const credential = await this.requestCredential(agentDid, serviceName, scope);

    // Cache it
    const expiresAt = scope.expiresAt || new Date(Date.now() + 3600000); // 1 hour default
    this.secretCache.set(cacheKey, { value: credential, expiresAt });

    // Log credential issuance
    await this.atpClient.audit.log({
      eventType: 'credential-issued',
      agentDid,
      severity: 'info',
      metadata: {
        serviceName,
        scope: scope.resource,
        expiresAt
      }
    });

    return credential;
  }

  /**
   * Revoke credentials for an agent
   */
  async revokeCredentials(agentDid: string): Promise<void> {
    // Remove from cache
    for (const key of this.secretCache.keys()) {
      if (key.startsWith(`${agentDid}:`)) {
        this.secretCache.delete(key);
      }
    }

    // Log revocation
    await this.atpClient.audit.log({
      eventType: 'credentials-revoked',
      agentDid,
      severity: 'warning',
      metadata: {
        reason: 'manual-revocation'
      }
    });
  }

  /**
   * Request a scoped credential from the ATP credential service.
   *
   * The mock-token path used to silently issue a predictable
   * `atp-token-${did}-${timestamp}` string regardless of environment, which
   * meant any caller that reached this branch in production would walk away
   * with a forgeable bearer credential. We now fail-closed unless explicitly
   * running under the test harness; the real wiring should be supplied by
   * `ATPCredentialService` in production builds.
   */
  private async requestCredential(
    agentDid: string,
    serviceName: string,
    scope: CredentialScope
  ): Promise<string> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error(
        'SecretManager.requestCredential is not wired to the ATP credential service. ' +
        'Refusing to issue a mock token in a non-test environment.'
      );
    }
    return `atp-token-${agentDid.slice(0, 8)}-${Date.now()}`;
  }
}
