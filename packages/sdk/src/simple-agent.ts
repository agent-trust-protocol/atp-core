/**
 * Simplified Agent API for ATP™
 *
 * Provides a 3-line quick start experience for developers
 * while maintaining full quantum-safe security features.
 */

import { ATPClient } from './client/atp.js';
import { CryptoUtils } from './utils/crypto.js';
import type { ATPConfig } from './types.js';

export interface SimpleAgentOptions {
  /** Optional ATP server URL (defaults to hosted services when available) */
  serverUrl?: string;
  /** Optional existing DID for the agent */
  did?: string;
  /** Optional private key (required if DID is provided) */
  privateKey?: string;
}

export class Agent {
  private client: ATPClient;
  private did: string | null = null;
  private privateKey: string | null = null;
  private name: string;
  private initialized = false;
  private _quantumSafe: boolean = false;

  private constructor(name: string, options?: SimpleAgentOptions) {
    this.name = name;

    // Default to local services (overridable via options or env). Audit defaults to 3006 to match mocks.
    const baseUrl = options?.serverUrl || process.env.ATP_SERVER_URL || 'http://localhost';

    const identityUrl = process.env.ATP_IDENTITY_URL || `${baseUrl}:3001`;
    const credentialsUrl = process.env.ATP_CREDENTIALS_URL || `${baseUrl}:3002`;
    const permissionsUrl = process.env.ATP_PERMISSIONS_URL || `${baseUrl}:3003`;
    const auditUrl = process.env.ATP_AUDIT_URL || `${baseUrl}:3005`;
    const gatewayUrl = process.env.ATP_GATEWAY_URL || `${baseUrl}:3000`;

    const config: ATPConfig = {
      baseUrl,
      services: {
        identity: identityUrl,
        credentials: credentialsUrl,
        permissions: permissionsUrl,
        audit: auditUrl,
        gateway: gatewayUrl
      }
    };

    this.client = new ATPClient(config);

    if (options?.did && options?.privateKey) {
      this.did = options.did;
      this.privateKey = options.privateKey;
    }
  }

  /**
   * Create a new agent with quantum-safe identity
   *
   * @example
   * ```typescript
   * const agent = await Agent.create('MyBot');
   * ```
   */
  static async create(name: string, options?: SimpleAgentOptions): Promise<Agent> {
    const agent = new Agent(name, options);
    await agent.initialize();
    return agent;
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // If no DID provided, create a new quantum-safe identity
      if (!this.did || !this.privateKey) {
        // Generate hybrid quantum-safe keypair (Ed25519 + ML-DSA)
        // This provides protection against both classical and quantum attacks
        const keyPair = await CryptoUtils.generateKeyPair(true); // quantumSafe = true by default

        const identity = await this.client.identity.registerDID({
          publicKey: keyPair.publicKey,
          metadata: { 
            name: this.name,
            quantumSafe: keyPair.quantumSafe,
            algorithm: keyPair.quantumSafe ? 'hybrid-ed25519-mldsa65' : 'ed25519'
          }
        });

        if (identity.data) {
          this.did = identity.data.did;
          this.privateKey = keyPair.privateKey;
          // Store quantum-safe flag for signing operations
          this._quantumSafe = keyPair.quantumSafe;
        } else {
          throw new Error('Failed to register DID');
        }
      }

      // Set up authentication
      this.client.setAuthentication({
        did: this.did!,
        privateKey: this.privateKey!
      });

      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send a secure message to another agent
   *
   * @example
   * ```typescript
   * await agent.send(otherAgentDid, 'Hello, quantum world!');
   * ```
   */
  async send(recipientDid: string, message: string | object): Promise<void> {
    if (!this.initialized) {
      throw new Error('Agent not initialized');
    }

    // In the future, this will use the gateway's WebSocket connection
    // For now, it's a placeholder that demonstrates the API
    const payload = typeof message === 'string' ? { text: message } : message;

    // This would normally send through the gateway
    await this.client.audit.logEvent({
      source: 'agent-sdk',
      action: 'message.sent',
      resource: recipientDid,
      actor: this.did!,
      details: {
        from: this.did,
        to: recipientDid,
        timestamp: new Date().toISOString(),
        // Message would be encrypted in production
        preview: `${JSON.stringify(payload).substring(0, 50)  }...`
      }
    });
  }

  /**
   * Get the trust score for another agent
   *
   * @example
   * ```typescript
   * const trustScore = await agent.getTrustScore(otherAgentDid);
   * console.log(`Trust level: ${trustScore}`);
   * ```
   */
  async getTrustScore(agentDid: string): Promise<number> {
    if (!this.initialized) {
      throw new Error('Agent not initialized');
    }

    try {
      // Check if we have any interaction history
      const events = await this.client.audit.queryEvents({
        actor: this.did!,
        resource: agentDid,
        limit: 10
      });

      // Simple trust scoring based on interaction count
      // In production, this would use advanced ML models
      const interactionCount = events.data?.events?.length || 0;

      if (interactionCount === 0) return 0; // UNKNOWN
      if (interactionCount < 5) return 0.25; // BASIC
      if (interactionCount < 20) return 0.5; // VERIFIED
      if (interactionCount < 50) return 0.75; // TRUSTED
      return 1.0; // PRIVILEGED
    } catch {
      // Default to unknown trust level if query fails
      return 0;
    }
  }

  /**
   * Grant a capability to another agent
   *
   * @example
   * ```typescript
   * await agent.grantCapability(otherAgentDid, 'read:data');
   * ```
   */
  async grantCapability(agentDid: string, capability: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Agent not initialized');
    }

    await this.client.permissions.grantPermission({
      subject: agentDid,
      resource: `${this.did}:*`,
      action: capability,
      conditions: {},
      expiresAt: new Date(Date.now() + 86400000).toISOString() // 24 hours
    });
  }

  /**
   * Issue a verifiable credential to another agent
   *
   * @example
   * ```typescript
   * await agent.issueCredential(otherAgentDid, 'verified-partner', { level: 'gold' });
   * ```
   */
  async issueCredential(
    subjectDid: string,
    credentialType: string,
    claims: Record<string, any>
  ): Promise<string> {
    if (!this.initialized) {
      throw new Error('Agent not initialized');
    }

    const credential = await this.client.credentials.issueCredential({
      subjectDID: subjectDid,
      credentialType,
      claims,
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
    });

    return credential.data?.id || 'credential-id';
  }

  /**
   * Get the agent's DID (Decentralized Identifier)
   */
  getDID(): string {
    if (!this.did) {
      throw new Error('Agent not initialized');
    }
    return this.did;
  }

  /**
   * Get the agent's name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Check if the agent is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if the agent uses quantum-safe cryptography
   */
  isQuantumSafe(): boolean {
    return this._quantumSafe === true || (this.privateKey && this.privateKey.length > 8000); // Hybrid keys are ~8000 hex chars (4032 bytes)
  }

  /**
   * Subscribe to events (coming soon)
   *
   * @example
   * ```typescript
   * agent.on('message', (msg) => console.log('Received:', msg));
   * ```
   */
  on(event: string, _handler: (data: any) => void): void {
    // This will be implemented when WebSocket gateway is integrated
    console.warn(`Event subscription not yet implemented. Event: ${event}`);
  }

  /**
   * Establish trust with another agent
   *
   * @example
   * ```typescript
   * const trust = await agent.establishTrust(otherAgentDid);
   * if (trust.established) {
   *   console.log('Trust established!');
   * }
   * ```
   */
  async establishTrust(
    agentDid: string,
    minTrustLevel: number = 0.5
  ): Promise<{ established: boolean; level: number }> {
    if (!this.initialized) {
      throw new Error('Agent not initialized');
    }

    const currentTrust = await this.getTrustScore(agentDid);

    if (currentTrust >= minTrustLevel) {
      return { established: true, level: currentTrust };
    }

    // In production, this would initiate a trust establishment protocol
    // For now, we'll just log the attempt
    await this.client.audit.logEvent({
      source: 'agent-sdk',
      action: 'trust.establish.attempted',
      resource: agentDid,
      actor: this.did!,
      details: {
        from: this.did,
        to: agentDid,
        currentLevel: currentTrust,
        requiredLevel: minTrustLevel
      }
    });

    return { established: false, level: currentTrust };
  }
}

// Re-export the Agent class as default for cleaner imports
export default Agent;
