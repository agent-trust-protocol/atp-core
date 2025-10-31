/**
 * Universal Monitoring System
 *
 * Provides unified monitoring across all supported AI agent protocols
 * with ATP security, trust scoring, and audit capabilities.
 */

import { ProtocolAdapter } from '../protocols/base/adapter.js';
import {
  Protocol,
  Agent,
  AgentEvent,
  MonitoringStream,
  Observable,
  Observer,
  Subscription,
  EventFilter
} from '../protocols/base/types.js';
import { ProtocolDetector } from '../protocols/base/detector.js';

/**
 * Universal Monitor Configuration
 */
export interface UniversalMonitorConfig {
  /** Minimum trust level required for events (0-100) */
  minTrustLevel?: number;
  /** Enable automatic event signing */
  enableSigning?: boolean;
  /** Enable audit trail recording */
  enableAudit?: boolean;
  /** Maximum events to buffer */
  bufferSize?: number;
  /** Event filters */
  filters?: EventFilter[];
}

/**
 * Security Enforcer Configuration
 */
export interface SecurityConfig {
  minTrustLevel: number;
  requireSignatures: boolean;
  requirePermissions: boolean;
  quantumSafe: boolean;
}

/**
 * Policy Result
 */
export type PolicyResult = 'ALLOW' | 'DENY' | 'WARN';

/**
 * Universal Monitor
 *
 * Monitors agents across all protocols with unified security and auditing
 */
export class UniversalMonitor {
  private adapters: Map<Protocol, ProtocolAdapter>;
  private activeMonitors: Map<string, MonitoringStream>;
  private config: UniversalMonitorConfig;

  constructor(config: UniversalMonitorConfig = {}) {
    this.adapters = new Map();
    this.activeMonitors = new Map();
    this.config = {
      minTrustLevel: config.minTrustLevel ?? 0,
      enableSigning: config.enableSigning ?? true,
      enableAudit: config.enableAudit ?? true,
      bufferSize: config.bufferSize ?? 1000,
      filters: config.filters ?? []
    };
  }

  /**
   * Register a protocol adapter
   */
  registerAdapter(protocol: Protocol, adapter: ProtocolAdapter): void {
    if (!adapter.isReady()) {
      throw new Error(`Adapter for protocol ${protocol} is not initialized`);
    }
    this.adapters.set(protocol, adapter);
  }

  /**
   * Unregister a protocol adapter
   */
  unregisterAdapter(protocol: Protocol): void {
    this.adapters.delete(protocol);
  }

  /**
   * Monitor an agent with automatic protocol detection
   */
  async monitor(agent: Agent): Promise<MonitoringStream> {
    // Detect protocol if not specified
    let protocol = agent.protocol;
    if (!protocol || protocol === Protocol.UNKNOWN) {
      const detection = await ProtocolDetector.detect(agent);
      protocol = detection.protocol;

      if (protocol === Protocol.UNKNOWN) {
        throw new Error('Unable to detect agent protocol');
      }
    }

    // Get appropriate adapter
    const adapter = this.adapters.get(protocol);
    if (!adapter) {
      throw new Error(`No adapter registered for protocol: ${protocol}`);
    }

    // Create monitoring stream
    const baseStream = adapter.monitor(agent);
    const securedStream = this.createSecuredStream(baseStream, adapter);

    // Store active monitor
    this.activeMonitors.set(agent.did, securedStream);

    return securedStream;
  }

  /**
   * Create secured monitoring stream with ATP security layer
   */
  private createSecuredStream(
    baseStream: Observable<AgentEvent>,
    adapter: ProtocolAdapter
  ): MonitoringStream {
    const self = this;

    const securedObservable: Observable<AgentEvent> = {
      subscribe(observer: Observer<AgentEvent>): Subscription {
        return baseStream.subscribe({
          next: async (event) => {
            try {
              // Apply security transformations
              const securedEvent = await self.securitize(event, adapter);

              // Apply filters
              if (self.applyFilters(securedEvent)) {
                observer.next(securedEvent);
              }
            } catch (error) {
              if (observer.error) {
                observer.error(error as Error);
              }
            }
          },
          error: observer.error,
          complete: observer.complete
        });
      },

      pipe(...operations: any[]): Observable<any> {
        let result: Observable<any> = this;
        for (const operation of operations) {
          result = operation(result);
        }
        return result;
      }
    };

    return Object.assign(securedObservable, {
      protocol: adapter.identify().protocol,
      agentDid: '', // Will be set by caller
      startTime: new Date().toISOString(),
      filters: this.config.filters
    }) as MonitoringStream;
  }

  /**
   * Apply ATP security layer to event
   */
  private async securitize(event: AgentEvent, adapter: ProtocolAdapter): Promise<AgentEvent> {
    // Add quantum-safe signature if enabled
    if (this.config.enableSigning) {
      const signature = await this.signEvent(event);
      event.signature = signature;
    }

    // Add trust score if not present
    if (event.trustScore === undefined) {
      event.trustScore = await this.calculateTrustScore(event);
    }

    // Record in audit trail if enabled
    if (this.config.enableAudit) {
      await adapter.audit(event);
    }

    return event;
  }

  /**
   * Sign event with quantum-safe signature
   */
  private async signEvent(event: AgentEvent): Promise<string> {
    // TODO: Implement actual quantum-safe signing
    // For now, return placeholder
    const data = JSON.stringify({
      id: event.id,
      type: event.type,
      timestamp: event.timestamp,
      source: event.source
    });
    return Buffer.from(data).toString('base64');
  }

  /**
   * Calculate trust score for event
   */
  private async calculateTrustScore(event: AgentEvent): Promise<number> {
    // TODO: Implement actual trust scoring algorithm
    // For now, return default score
    return 50;
  }

  /**
   * Apply event filters
   */
  private applyFilters(event: AgentEvent): boolean {
    if (!this.config.filters || this.config.filters.length === 0) {
      return true;
    }

    return this.config.filters.every(filter => {
      const value = this.getEventField(event, filter.field);
      return this.evaluateFilter(value, filter.operator, filter.value);
    });
  }

  /**
   * Get event field value by path
   */
  private getEventField(event: AgentEvent, field: string): any {
    const parts = field.split('.');
    let value: any = event;
    for (const part of parts) {
      value = value?.[part];
    }
    return value;
  }

  /**
   * Evaluate filter condition
   */
  private evaluateFilter(value: any, operator: string, filterValue: any): boolean {
    switch (operator) {
      case 'eq':
        return value === filterValue;
      case 'ne':
        return value !== filterValue;
      case 'gt':
        return value > filterValue;
      case 'lt':
        return value < filterValue;
      case 'contains':
        return String(value).includes(String(filterValue));
      default:
        return true;
    }
  }

  /**
   * Stop monitoring an agent
   */
  stopMonitoring(agentDid: string): void {
    this.activeMonitors.delete(agentDid);
  }

  /**
   * Get active monitoring streams
   */
  getActiveMonitors(): Map<string, MonitoringStream> {
    return new Map(this.activeMonitors);
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    this.activeMonitors.clear();

    const adapters = Array.from(this.adapters.values());
    for (const adapter of adapters) {
      await adapter.cleanup();
    }

    this.adapters.clear();
  }
}

/**
 * Security Enforcer
 *
 * Enforces security policies on agent events
 */
export class SecurityEnforcer {
  private config: SecurityConfig;

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  /**
   * Enforce security policy on event
   */
  enforcePolicy(event: AgentEvent): PolicyResult {
    // Check trust level
    if (event.trustScore !== undefined && event.trustScore < this.config.minTrustLevel) {
      return 'DENY';
    }

    // Verify signature if required
    if (this.config.requireSignatures && !event.signature) {
      return 'DENY';
    }

    if (this.config.requireSignatures && event.signature) {
      const signatureValid = this.verifySignature(event);
      if (!signatureValid) {
        return 'DENY';
      }
    }

    // Check permissions if required
    if (this.config.requirePermissions) {
      const hasPermission = this.checkPermission(event);
      if (!hasPermission) {
        return 'DENY';
      }
    }

    return 'ALLOW';
  }

  /**
   * Verify event signature
   */
  private verifySignature(event: AgentEvent): boolean {
    // TODO: Implement actual signature verification
    return !!event.signature;
  }

  /**
   * Check event permissions
   */
  private checkPermission(event: AgentEvent): boolean {
    // TODO: Implement actual permission checking
    return true;
  }

  /**
   * Update security configuration
   */
  updateConfig(updates: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current configuration
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }
}
