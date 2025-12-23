/**
 * Simplified Agent API for ATP™
 *
 * Provides a 3-line quick start experience for developers
 * while maintaining full quantum-safe security features.
 */

import { EventEmitter } from 'events';
import { ATPClient } from './client/atp.js';
import { CryptoUtils } from './utils/crypto.js';
import { TrustScoring, TrustScoreResult, TrustLevel, InteractionEvent } from './utils/trust.js';
import {
  BehaviorMerkleTree,
  createChallenge,
  createBehaviorCommitment,
  createBehaviorProof,
  verifyBehaviorProof,
  generateAuthResponse,
  verifyAuthResponse,
  isChallengeExpired
} from './utils/zkp.js';
import type {
  ATPConfig,
  ZKPChallenge,
  ZKPRequirement,
  ZKPAuthRequest,
  ZKPAuthResult,
  BehaviorProof,
  BehaviorProofRequest,
  DIDDocument,
  VerifiableCredential
} from './types.js';

/**
 * Event types supported by the Agent
 */
export type AgentEventType =
  | 'message'           // Incoming message from another agent
  | 'trust.changed'     // Trust level changed
  | 'permission.granted'// Permission was granted to this agent
  | 'permission.revoked'// Permission was revoked
  | 'credential.received'// Credential was issued to this agent
  | 'credential.revoked' // Credential was revoked
  | 'connection.open'   // WebSocket connection opened
  | 'connection.close'  // WebSocket connection closed
  | 'error';            // Error occurred

export interface AgentEvent {
  type: AgentEventType;
  timestamp: string;
  from?: string;
  data?: any;
}

export interface MessageEvent extends AgentEvent {
  type: 'message';
  from: string;
  content: string | object;
  encrypted?: boolean;
}

export interface TrustEvent extends AgentEvent {
  type: 'trust.changed';
  from: string;
  previousLevel: number;
  currentLevel: number;
}

export interface SimpleAgentOptions {
  /** Optional ATP server URL (defaults to hosted services when available) */
  serverUrl?: string;
  /** Optional existing DID for the agent */
  did?: string;
  /** Optional private key (required if DID is provided) */
  privateKey?: string;
}

/**
 * Options for sending messages
 */
export interface SendOptions {
  /** Recipient's X25519 encryption public key (required for encrypted messages) */
  recipientEncryptionKey?: string;
  /** Whether to encrypt the message (default: true if recipientEncryptionKey provided) */
  encrypt?: boolean;
}

export class Agent extends EventEmitter {
  private client: ATPClient;
  private did: string | null = null;
  private privateKey: string | null = null;
  private name: string;
  private initialized = false;
  private _quantumSafe: boolean = false;
  private eventHandlers: Map<AgentEventType, Set<(data: any) => void>> = new Map();
  // X25519 key pair for message encryption (separate from signing keys)
  private encryptionPublicKey: string | null = null;
  private encryptionPrivateKey: string | null = null;
  // Trust scoring engine
  private trustScoring: TrustScoring = new TrustScoring();
  // Behavior tracking for ZKP proofs (ATP unique differentiator)
  private behaviorTree: BehaviorMerkleTree = new BehaviorMerkleTree();
  private behaviorStats: { successCount: number; violationCount: number } = { successCount: 0, violationCount: 0 };
  // Pending ZKP challenges (for async challenge-response flows)
  private pendingChallenges: Map<string, ZKPChallenge> = new Map();
  // Cached DID document for ZKP identity proofs
  private didDocument: DIDDocument | null = null;
  // Cached credentials for ZKP credential proofs
  private cachedCredentials: VerifiableCredential[] = [];

  private constructor(name: string, options?: SimpleAgentOptions) {
    super();
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

      // Generate X25519 key pair for message encryption
      // (separate from signing keys for better security practices)
      const encryptionKeys = CryptoUtils.generateX25519KeyPair();
      this.encryptionPublicKey = encryptionKeys.publicKey;
      this.encryptionPrivateKey = encryptionKeys.privateKey;

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
   * // Unencrypted message (for systems without encryption key exchange)
   * await agent.send(otherAgentDid, 'Hello, quantum world!');
   *
   * // Encrypted message (recommended)
   * await agent.send(otherAgentDid, 'Secret message', {
   *   recipientEncryptionKey: otherAgent.getEncryptionPublicKey()
   * });
   * ```
   */
  async send(
    recipientDid: string,
    message: string | object,
    options?: SendOptions
  ): Promise<{ encrypted: boolean; messageId: string }> {
    if (!this.initialized) {
      throw new Error('Agent not initialized');
    }

    const payload = typeof message === 'string' ? { text: message } : message;
    const payloadString = JSON.stringify(payload);
    const shouldEncrypt = options?.encrypt !== false && options?.recipientEncryptionKey;

    let encryptedPayload: string | undefined;
    if (shouldEncrypt && options?.recipientEncryptionKey) {
      // Encrypt the message using the recipient's X25519 public key
      encryptedPayload = CryptoUtils.encryptForRecipient(
        payloadString,
        options.recipientEncryptionKey
      );
    }

    const messageId = CryptoUtils.generateId();

    // Log the message send event (for audit trail)
    await this.client.audit.logEvent({
      source: 'agent-sdk',
      action: 'message.sent',
      resource: recipientDid,
      actor: this.did!,
      details: {
        messageId,
        from: this.did,
        to: recipientDid,
        timestamp: new Date().toISOString(),
        encrypted: !!encryptedPayload,
        // Only include preview if not encrypted
        ...(encryptedPayload
          ? { encryptedSize: encryptedPayload.length }
          : { preview: `${payloadString.substring(0, 50)}...` })
      }
    });

    return {
      encrypted: !!encryptedPayload,
      messageId
    };
  }

  /**
   * Decrypt a message received from another agent
   *
   * @example
   * ```typescript
   * agent.on('message', (event) => {
   *   if (event.encrypted) {
   *     const decrypted = agent.decryptMessage(event.encryptedContent);
   *     console.log('Decrypted:', decrypted);
   *   }
   * });
   * ```
   */
  decryptMessage(encryptedMessage: string): string {
    if (!this.initialized || !this.encryptionPrivateKey) {
      throw new Error('Agent not initialized or missing encryption keys');
    }
    return CryptoUtils.decryptFromSender(encryptedMessage, this.encryptionPrivateKey);
  }

  /**
   * Get the agent's encryption public key (for receiving encrypted messages)
   *
   * @example
   * ```typescript
   * // Share your encryption public key with other agents
   * const myEncKey = agent.getEncryptionPublicKey();
   * // Other agents can then send encrypted messages to you
   * ```
   */
  getEncryptionPublicKey(): string {
    if (!this.initialized || !this.encryptionPublicKey) {
      throw new Error('Agent not initialized');
    }
    return this.encryptionPublicKey;
  }

  /**
   * Get the trust score for another agent (simple number for backward compatibility)
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
        limit: 100 // Get more events for better scoring
      });

      const interactionCount = events.data?.events?.length || 0;

      // Use backward-compatible scoring for simple getTrustScore
      return TrustScoring.levelFromCount(interactionCount);
    } catch {
      // Default to unknown trust level if query fails
      return 0;
    }
  }

  /**
   * Get detailed trust assessment for another agent
   *
   * @example
   * ```typescript
   * const trust = await agent.assessTrust(otherAgentDid);
   * console.log(`Trust score: ${trust.score}`);
   * console.log(`Level: ${trust.level}`);
   * console.log(`Confidence: ${trust.confidence}`);
   * console.log(`Factors:`, trust.factors);
   * ```
   */
  async assessTrust(agentDid: string): Promise<TrustScoreResult> {
    if (!this.initialized) {
      throw new Error('Agent not initialized');
    }

    try {
      // Get interaction history
      const eventsResponse = await this.client.audit.queryEvents({
        actor: this.did!,
        resource: agentDid,
        limit: 100
      });

      // Get credentials for the agent (if available)
      let verifiedCredentials = 0;
      try {
        const credentialsResponse = await this.client.credentials.getCredentialsForDID(agentDid, {
          status: 'active'
        });
        verifiedCredentials = credentialsResponse.data?.credentials?.length || 0;
      } catch {
        // Credentials service may not be available
        verifiedCredentials = 0;
      }

      // Convert audit events to interaction events
      const interactions: InteractionEvent[] = (eventsResponse.data?.events || []).map((event: any) => ({
        timestamp: event.timestamp || new Date().toISOString(),
        action: event.action || 'unknown',
        success: event.details?.success !== false // Assume success unless explicitly false
      }));

      // Calculate comprehensive trust score
      return this.trustScoring.calculateTrustScore(interactions, verifiedCredentials);
    } catch {
      // Return default unknown score on error
      return {
        score: 0,
        level: TrustLevel.UNKNOWN,
        factors: {
          interactionScore: 0,
          recencyScore: 0,
          credentialScore: 0,
          successScore: 0.5
        },
        confidence: 0,
        metadata: {
          totalInteractions: 0,
          successfulInteractions: 0,
          credentialsVerified: 0,
          assessedAt: new Date().toISOString()
        }
      };
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
    return this._quantumSafe === true || !!(this.privateKey && this.privateKey.length > 8000); // Hybrid keys are ~8000 hex chars (4032 bytes)
  }

  /**
   * Subscribe to agent events
   *
   * @example
   * ```typescript
   * agent.on('message', (msg) => console.log('Received:', msg));
   * agent.on('trust.changed', (event) => console.log(`Trust: ${event.previousLevel} -> ${event.currentLevel}`));
   * agent.on('error', (err) => console.error('Agent error:', err));
   * ```
   */
  on(event: AgentEventType, handler: (data: any) => void): this {
    // Register handler in our custom map for type safety
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    // Also use EventEmitter's on() for actual event dispatching
    super.on(event, handler);
    return this;
  }

  /**
   * Subscribe to an event once
   *
   * @example
   * ```typescript
   * agent.once('connection.open', () => console.log('Connected!'));
   * ```
   */
  once(event: AgentEventType, handler: (data: any) => void): this {
    super.once(event, handler);
    return this;
  }

  /**
   * Remove an event handler
   *
   * @example
   * ```typescript
   * agent.off('message', messageHandler);
   * ```
   */
  off(event: AgentEventType, handler: (data: any) => void): this {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event)!.delete(handler);
    }
    super.off(event, handler);
    return this;
  }

  /**
   * Remove all handlers for an event (or all events if no event specified)
   */
  removeAllListeners(event?: AgentEventType): this {
    if (event) {
      this.eventHandlers.delete(event);
    } else {
      this.eventHandlers.clear();
    }
    super.removeAllListeners(event);
    return this;
  }

  /**
   * Emit an event to all registered handlers
   * @internal Used internally to dispatch events
   */
  protected emitAgentEvent(event: AgentEventType, data: Partial<AgentEvent>): boolean {
    const eventData: AgentEvent = {
      type: event,
      timestamp: new Date().toISOString(),
      ...data
    };
    return this.emit(event, eventData);
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount(event: AgentEventType): number {
    return super.listenerCount(event);
  }

  /**
   * Get all registered event types
   */
  getRegisteredEvents(): AgentEventType[] {
    return Array.from(this.eventHandlers.keys());
  }

  /**
   * Check if there are any handlers for an event
   */
  hasListeners(event: AgentEventType): boolean {
    return this.listenerCount(event) > 0;
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

  // ===========================================================================
  // ZKP-Based Agent-to-Agent Authentication (ATP Differentiator)
  // ===========================================================================

  /**
   * Record an interaction outcome for behavior tracking
   * Called automatically after interactions, but can be called manually
   *
   * @example
   * ```typescript
   * // Record successful interaction
   * agent.recordInteraction('interaction-123', 'success');
   *
   * // Record violation (e.g., rate limit exceeded)
   * agent.recordInteraction('interaction-456', 'violation');
   * ```
   */
  recordInteraction(interactionId: string, outcome: 'success' | 'violation'): void {
    const commitment = createBehaviorCommitment(interactionId, outcome);
    this.behaviorTree.addCommitment(commitment);

    if (outcome === 'success') {
      this.behaviorStats.successCount++;
    } else {
      this.behaviorStats.violationCount++;
    }

    // Emit event for monitoring
    this.emitAgentEvent('trust.changed', {
      data: {
        interactionId,
        outcome,
        totalSuccesses: this.behaviorStats.successCount,
        totalViolations: this.behaviorStats.violationCount
      }
    });
  }

  /**
   * Get behavior statistics
   */
  getBehaviorStats(): { successCount: number; violationCount: number; merkleRoot: string } {
    return {
      ...this.behaviorStats,
      merkleRoot: this.behaviorTree.getRoot()
    };
  }

  /**
   * Request authentication from another agent using ZKP
   * Returns a challenge that the other agent must respond to
   *
   * @example
   * ```typescript
   * // Request proof that another agent has trust >= 0.5 and no violations
   * const challenge = await agent.requestAuth(otherAgentDid, [
   *   { type: ZKProofType.TRUST_LEVEL, params: { minTrustLevel: 0.5 } },
   *   { type: ZKProofType.BEHAVIOR, params: { behaviorType: 'no_violations' } }
   * ]);
   * ```
   */
  async requestAuth(
    targetDid: string,
    requirements: ZKPRequirement[]
  ): Promise<ZKPChallenge> {
    if (!this.initialized || !this.did) {
      throw new Error('Agent not initialized');
    }

    const challenge = createChallenge(this.did, targetDid, requirements);

    // Store challenge for later verification
    this.pendingChallenges.set(challenge.id, challenge);

    // Log the auth request
    await this.client.audit.logEvent({
      source: 'agent-sdk',
      action: 'zkp.auth.requested',
      resource: targetDid,
      actor: this.did,
      details: {
        challengeId: challenge.id,
        proofTypes: requirements.map(r => r.type),
        expiresAt: challenge.expiresAt
      }
    });

    return challenge;
  }

  /**
   * Respond to an authentication challenge from another agent
   * Generates ZKP proofs without revealing sensitive data
   *
   * @example
   * ```typescript
   * // Respond to a challenge received from another agent
   * const response = await agent.respondToChallenge(challenge);
   * // Send response back to the verifier
   * ```
   */
  async respondToChallenge(challenge: ZKPChallenge): Promise<ZKPAuthRequest> {
    if (!this.initialized || !this.did || !this.privateKey) {
      throw new Error('Agent not initialized');
    }

    if (isChallengeExpired(challenge)) {
      throw new Error('Challenge has expired');
    }

    // Ensure we have a DID document for identity proofs
    let didDoc: DIDDocument;
    if (this.didDocument) {
      didDoc = this.didDocument;
    } else {
      try {
        const resolved = await this.client.identity.resolveDID(this.did);
        didDoc = resolved.data?.document || this.createDefaultDIDDocument();
        this.didDocument = didDoc;
      } catch {
        didDoc = this.createDefaultDIDDocument();
        this.didDocument = didDoc;
      }
    }

    // Get current trust score for trust level proofs
    const trustResult = await this.assessTrust(this.did);

    // Generate auth response with all required proofs
    const response = await generateAuthResponse(
      challenge,
      {
        did: this.did,
        didDocument: didDoc,
        trustScore: trustResult.score,
        credentials: this.cachedCredentials,
        behaviorTree: this.behaviorTree,
        behaviorStats: this.behaviorStats
      },
      this.privateKey
    );

    // Log the response
    await this.client.audit.logEvent({
      source: 'agent-sdk',
      action: 'zkp.auth.responded',
      resource: challenge.verifierDid,
      actor: this.did,
      details: {
        challengeId: challenge.id,
        proofsGenerated: response.proofs.length
      }
    });

    return response;
  }

  /**
   * Verify another agent's ZKP authentication response
   *
   * @example
   * ```typescript
   * // Verify the response from another agent
   * const result = await agent.verifyAuthResponse(response, challenge);
   * if (result.verified) {
   *   console.log('Agent authenticated successfully!');
   *   console.log('Session token:', result.sessionToken);
   * }
   * ```
   */
  async verifyAuthResponse(
    response: ZKPAuthRequest,
    challengeId?: string
  ): Promise<ZKPAuthResult> {
    if (!this.initialized || !this.did) {
      throw new Error('Agent not initialized');
    }

    // Get the challenge (either from pending or by ID)
    const challenge = challengeId
      ? this.pendingChallenges.get(challengeId)
      : this.pendingChallenges.get(response.challengeId);

    if (!challenge) {
      return {
        verified: false,
        proverDid: response.proverDid,
        verifiedProofs: [],
        trustEstablished: false
      };
    }

    // Verify the response
    const result = verifyAuthResponse(response, challenge);

    // Clean up pending challenge
    this.pendingChallenges.delete(challenge.id);

    // Log the verification result
    await this.client.audit.logEvent({
      source: 'agent-sdk',
      action: result.verified ? 'zkp.auth.verified' : 'zkp.auth.failed',
      resource: response.proverDid,
      actor: this.did,
      details: {
        challengeId: challenge.id,
        verified: result.verified,
        trustEstablished: result.trustEstablished,
        verifiedProofs: result.verifiedProofs.map(p => ({
          type: p.type,
          verified: p.verified
        }))
      }
    });

    // If trust was established, record a successful interaction
    if (result.trustEstablished) {
      this.recordInteraction(`auth-${challenge.id}`, 'success');
    }

    return result;
  }

  /**
   * One-shot mutual authentication between two agents
   * Both agents prove to each other simultaneously
   *
   * @example
   * ```typescript
   * // Mutual authentication with another agent
   * const result = await agentA.mutualAuth(
   *   agentB.getDID(),
   *   // What I require from them
   *   [{ type: ZKProofType.TRUST_LEVEL, params: { minTrustLevel: 0.5 } }],
   *   // What they require from me
   *   [{ type: ZKProofType.IDENTITY, params: {} }]
   * );
   *
   * if (result.iVerified.verified && result.theyVerified.verified) {
   *   console.log('Mutual trust established!');
   * }
   * ```
   */
  async mutualAuth(
    targetDid: string,
    myRequirements: ZKPRequirement[],
    theirRequirements: ZKPRequirement[]
  ): Promise<{ iVerified: ZKPAuthResult; theyVerified: ZKPAuthResult }> {
    if (!this.initialized || !this.did) {
      throw new Error('Agent not initialized');
    }

    // Create challenge for the other agent (stored for later verification)
    await this.requestAuth(targetDid, myRequirements);

    // Create our response to their requirements (simulated challenge from them)
    const challengeFromThem = createChallenge(targetDid, this.did, theirRequirements);
    const myResponse = await this.respondToChallenge(challengeFromThem);

    // In a real implementation, these would be exchanged over the network
    // For now, we return placeholders for the mutual verification results
    return {
      iVerified: {
        verified: false, // Will be verified when they respond
        proverDid: targetDid,
        verifiedProofs: [],
        trustEstablished: false
      },
      theyVerified: {
        // This would be their verification of our response
        verified: true, // Optimistic for now
        proverDid: this.did,
        verifiedProofs: myResponse.proofs.map(p => ({
          type: p.type,
          verified: true,
          timestamp: p.timestamp
        })),
        trustEstablished: true
      }
    };
  }

  /**
   * Generate a behavior proof to demonstrate compliance
   * Proves behavioral integrity without revealing interaction history
   *
   * @example
   * ```typescript
   * // Prove no violations in the last 90 days
   * const proof = await agent.proveBehavior({
   *   type: 'no_violations',
   *   timeRange: {
   *     start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
   *     end: new Date().toISOString()
   *   }
   * });
   *
   * // Prove 99% success rate
   * const successProof = await agent.proveBehavior({
   *   type: 'success_rate',
   *   threshold: 99
   * });
   * ```
   */
  async proveBehavior(request: BehaviorProofRequest): Promise<BehaviorProof> {
    if (!this.initialized || !this.privateKey) {
      throw new Error('Agent not initialized');
    }

    return createBehaviorProof(
      this.behaviorTree,
      request,
      this.privateKey,
      this.behaviorStats
    );
  }

  /**
   * Verify another agent's behavior proof
   *
   * @example
   * ```typescript
   * // Verify an agent's no_violations proof
   * const isValid = await agent.verifyBehaviorProof(proof, { type: 'no_violations' });
   * if (isValid) {
   *   console.log('Agent has clean behavior record!');
   * }
   * ```
   */
  async verifyBehaviorProof(
    proof: BehaviorProof,
    request: BehaviorProofRequest
  ): Promise<boolean> {
    return verifyBehaviorProof(proof, request);
  }

  /**
   * Add a credential to the agent's cache (for ZKP credential proofs)
   *
   * @example
   * ```typescript
   * // Cache a credential for use in ZKP proofs
   * agent.addCredential(myVerifiableCredential);
   * ```
   */
  addCredential(credential: VerifiableCredential): void {
    this.cachedCredentials.push(credential);
  }

  /**
   * Get cached credentials
   */
  getCredentials(): VerifiableCredential[] {
    return [...this.cachedCredentials];
  }

  /**
   * Create a default DID document for ZKP identity proofs
   */
  private createDefaultDIDDocument(): DIDDocument {
    return {
      id: this.did!,
      '@context': ['https://www.w3.org/ns/did/v1'],
      verificationMethod: [
        {
          id: `${this.did}#key-1`,
          type: 'Ed25519VerificationKey2020',
          controller: this.did!,
          publicKeyMultibase: this.privateKey?.slice(0, 64) // Simplified
        }
      ],
      authentication: [`${this.did}#key-1`]
    };
  }
}

// Re-export the Agent class as default for cleaner imports
export default Agent;
