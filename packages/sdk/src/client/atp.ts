import { ATPConfig } from '../types.js';
import { IdentityClient } from './identity.js';
import { CredentialsClient } from './credentials.js';
import { PermissionsClient } from './permissions.js';
import { AuditClient } from './audit.js';
import { GatewayClient } from './gateway.js';
import { PaymentsClient } from './payments.js';
import { BUILTIN_PROFILES, AtpSecurityProfile } from '../profiles/index.js';

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
  public readonly payments: PaymentsClient;
  private profile?: AtpSecurityProfile;

  constructor(private config: ATPConfig) {
    this.identity = new IdentityClient(config);
    this.credentials = new CredentialsClient(config);
    this.permissions = new PermissionsClient(config);
    this.audit = new AuditClient(config);
    this.gateway = new GatewayClient(config);
    this.payments = new PaymentsClient(config);

    if (config.profileId) {
      this.profile = BUILTIN_PROFILES[config.profileId];
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
    this.payments.updateAuth(auth);
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
    const profile = BUILTIN_PROFILES[profileId];
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
  evaluateActionWithProfile(params: {
    profileId?: string;
    state?: string;
    actionType: string;
    metadata?: Record<string, unknown>;
  }): 'allow' | 'deny' | 'require_approval' {
    const profile = params.profileId
      ? BUILTIN_PROFILES[params.profileId]
      : this.profile;

    if (!profile) return 'allow';

    const { controls, state_policies } = profile;
    const { actionType, state } = params;

    // Basic control-level check
    const control = (controls as Record<string, any>)[actionType];
    if (control && control.allowed === false) {
      return control.require_approval ? 'require_approval' : 'deny';
    }

    // State-based overrides
    if (state && state_policies?.[state]) {
      const policy = state_policies[state];
      if (policy.restricted_tools?.includes(actionType)) {
        return 'deny';
      }
      if (policy.require_approval_for?.includes(actionType)) {
        return 'require_approval';
      }
    }

    return 'allow';
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.gateway.cleanup();
  }
}
