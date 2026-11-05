/**
 * Protocol Adapter Interface
 *
 * Defines the contract that all protocol adapters must implement
 * to integrate with ATP's security and monitoring framework.
 */

import {
  ProtocolInfo,
  Agent,
  AgentEvent,
  Message,
  SecuredMessage,
  VerificationResult,
  ProtocolAuditEntry,
  Observable,
  ProtocolAdapterConfig
} from './types.js';

/**
 * Base Protocol Adapter Interface
 *
 * All protocol-specific adapters (MCP, Swarm, ADK, A2A) must implement this interface
 * to ensure consistent security, monitoring, and audit capabilities across protocols.
 */
export interface ProtocolAdapter {
  /**
   * Identify the protocol and its capabilities
   */
  identify(): ProtocolInfo;

  /**
   * Initialize the adapter with configuration
   */
  initialize(config: ProtocolAdapterConfig): Promise<void>;

  /**
   * Monitor agent activity and emit events
   * Returns an observable stream of agent events for real-time monitoring
   */
  monitor(agent: Agent): Observable<AgentEvent>;

  /**
   * Apply ATP security layer to a message
   * Adds quantum-safe signatures, encryption, and trust scoring
   */
  secure(message: Message): Promise<SecuredMessage>;

  /**
   * Verify a secured message
   * Validates signatures, checks trust levels, and verifies sender identity
   */
  verify(message: SecuredMessage): Promise<VerificationResult>;

  /**
   * Create audit entry for an event
   * Requires an implementation backed by a persistent audit service
   */
  audit(event: AgentEvent): Promise<ProtocolAuditEntry>;

  /**
   * Cleanup resources and close connections
   */
  cleanup(): Promise<void>;

  /**
   * Check if the adapter is initialized and ready
   */
  isReady(): boolean;

  /**
   * Get current configuration
   */
  getConfig(): ProtocolAdapterConfig;
}

/**
 * Extended Protocol Adapter with optional advanced features
 */
export interface ExtendedProtocolAdapter extends ProtocolAdapter {
  /**
   * Detect if an agent is using this protocol
   */
  detect?(agent: any): Promise<boolean>;

  /**
   * Bridge messages to another protocol
   */
  bridge?(message: Message, targetProtocol: string): Promise<Message>;

  /**
   * Get real-time statistics
   */
  getStats?(): Promise<ProtocolStats>;

  /**
   * Handle protocol-specific commands
   */
  handleCommand?(command: string, params?: any): Promise<any>;
}

/**
 * Protocol Statistics
 */
export interface ProtocolStats {
  protocol: string;
  messagesProcessed: number;
  activeAgents: number;
  averageLatency: number;
  securityEvents: number;
  lastUpdated: string;
  errors?: Array<{
    timestamp: string;
    error: string;
    count: number;
  }>;
}

/**
 * Abstract Base Adapter - Provides common functionality
 */
export abstract class BaseProtocolAdapter implements ProtocolAdapter {
  protected config?: ProtocolAdapterConfig;
  protected ready: boolean = false;

  abstract identify(): ProtocolInfo;
  abstract monitor(agent: Agent): Observable<AgentEvent>;

  async initialize(config: ProtocolAdapterConfig): Promise<void> {
    this.config = config;
    this.ready = true;
  }

  async secure(_message: Message): Promise<SecuredMessage> {
    if (!this.config || !this.ready) {
      throw new Error('Adapter not initialized');
    }

    throw new Error('Protocol adapter signing is not implemented');
  }

  async verify(_message: SecuredMessage): Promise<VerificationResult> {
    if (!this.config || !this.ready) throw new Error('Adapter not initialized');
    // Incoming claims are not verified identity or trust evidence.
    return {
      verified: false,
      trustScore: 0,
      verifiedAt: new Date().toISOString(),
      details: {
        signatureValid: false,
        senderVerified: false,
        trustLevel: 'UNVERIFIED',
        issues: ['Protocol adapter verification is not implemented']
      }
    };
  }

  async audit(_event: AgentEvent): Promise<ProtocolAuditEntry> {
    if (!this.config || !this.ready) throw new Error('Adapter not initialized');
    throw new Error('Protocol adapter audit persistence is not implemented');
  }

  async cleanup(): Promise<void> {
    this.ready = false;
    this.config = undefined;
  }

  isReady(): boolean {
    return this.ready;
  }

  getConfig(): ProtocolAdapterConfig {
    if (!this.config || !this.ready) {
      throw new Error('Adapter not initialized');
    }
    return this.config;
  }
}
