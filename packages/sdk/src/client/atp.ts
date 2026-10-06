import { ATPConfig } from '../types.js';
import { IdentityClient } from './identity.js';
import { CredentialsClient } from './credentials.js';
import { PermissionsClient } from './permissions.js';
import { AuditClient } from './audit.js';
import { GatewayClient } from './gateway.js';
import { BUILTIN_PROFILES, evaluateActionWithProfile, type AtpSecurityProfile, type ProfileEvaluationContext } from 'atp-profiles';

/**
 * Main ATP™ SDK Client
 *
 * Provides a unified interface to all ATP services with convenient access
 * to identity, credentials, permissions, audit, and gateway functionality.
 */
export class ATPClient {
  public readonly identity: IdentityClient;
  public readonly credentials: CredentialsClient;
  public readonly permissions: PermissionsClient;
  public readonly audit: AuditClient;
  public readonly gateway: GatewayClient;
  private profile?: AtpSecurityProfile;

  constructor(private config: ATPConfig) {
    this.identity = new IdentityClient(config);
    this.credentials = new CredentialsClient(config);
    this.permissions = new PermissionsClient(config);
    this.audit = new AuditClient(config);
    this.gateway = new GatewayClient(config);

    if (config.profileId) {
      this.setProfile(config.profileId);
    }
  }

  /**
   * Update authentication for all service clients
   */
  setAuthentication(auth: {
    did?: string;
    privateKey?: string;
    token?: string;
  }): void {
    this.config.auth = { ...this.config.auth, ...auth };

    // Update auth for all clients
    this.identity.updateAuth(auth);
    this.credentials.updateAuth(auth);
    this.permissions.updateAuth(auth);
    this.audit.updateAuth(auth);
    this.gateway.updateAuth(auth);
  }

  /**
   * Get current configuration
   */
  getConfig(): ATPConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ATPConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Check if client is authenticated
   */
  isAuthenticated(): boolean {
    return !!(this.config.auth?.token || (this.config.auth?.did && this.config.auth?.privateKey));
  }

  /**
   * Test connectivity to all ATP services
   */
  async testConnectivity(): Promise<{
    identity: boolean;
    credentials: boolean;
    permissions: boolean;
    audit: boolean;
    gateway: boolean;
    overall: boolean;
  }> {
    const results = {
      identity: false,
      credentials: false,
      permissions: false,
      audit: false,
      gateway: false,
      overall: false
    };

    try {
      const healthChecks = await Promise.allSettled([
        this.identity.getHealth().then(() => true).catch(() => false),
        this.credentials.getHealth().then(() => true).catch(() => false),
        this.permissions.getHealth().then(() => true).catch(() => false),
        this.audit.getHealth().then(() => true).catch(() => false),
        this.gateway.getHealth().then(() => true).catch(() => false)
      ]);

      results.identity = healthChecks[0].status === 'fulfilled' && healthChecks[0].value;
      results.credentials = healthChecks[1].status === 'fulfilled' && healthChecks[1].value;
      results.permissions = healthChecks[2].status === 'fulfilled' && healthChecks[2].value;
      results.audit = healthChecks[3].status === 'fulfilled' && healthChecks[3].value;
      results.gateway = healthChecks[4].status === 'fulfilled' && healthChecks[4].value;

      results.overall = Object.values(results).slice(0, 5).every(status => status);
    } catch (error) {
      // All results remain false
    }

    return results;
  }

  /**
   * Set a security profile by ID
   */
  setProfile(profileId: string): void {
    const profile = Object.prototype.hasOwnProperty.call(BUILTIN_PROFILES, profileId) ? BUILTIN_PROFILES[profileId] : undefined;
    if (!profile) throw new Error(`Unknown ATP profile: ${profileId}`);
    this.profile = profile;
  }

  /**
   * Get the currently active security profile
   */
  getProfile(): AtpSecurityProfile | undefined {
    return this.profile;
  }

  /**
   * Evaluate whether an action is allowed under the active profile.
   * Returns "allow", "deny", or "require_approval".
   */
  evaluateActionWithProfile(params: ProfileEvaluationContext & { profileId?: string }): "allow" | "deny" | "require_approval" {
    const profile = params.profileId
      ? (Object.prototype.hasOwnProperty.call(BUILTIN_PROFILES, params.profileId) ? BUILTIN_PROFILES[params.profileId] : undefined)
      : this.profile;
    // An explicitly unknown profile must not silently disable policy enforcement.
    if (!profile) return params.profileId ? "deny" : "allow";
    return evaluateActionWithProfile(profile, params).decision;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.gateway.cleanup();
  }
}
