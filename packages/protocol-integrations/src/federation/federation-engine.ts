/**
 * Protocol Federation Engine
 * Core engine for managing cross-protocol communication and federation
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import {
  UniversalMessage,
  SupportedProtocol,
  ProtocolAdapter,
  BridgeConfiguration,
  FederationMetrics,
  FederationEvent,
  FederationEventType,
  EventSeverity,
  UniversalMessageType,
  MessagePriority
} from './types';

// Re-export types for other modules to use
export {
  UniversalMessage,
  SupportedProtocol,
  UniversalMessageType,
  ProtocolAdapter,
  BridgeConfiguration,
  FederationMetrics,
  FederationEvent,
  FederationEventType,
  EventSeverity,
  MessagePriority
} from './types';

export class ProtocolFederationEngine extends EventEmitter {
  private adapters: Map<SupportedProtocol, ProtocolAdapter> = new Map();
  private bridges: Map<string, BridgeConfiguration> = new Map();
  private messageQueue: Map<string, UniversalMessage[]> = new Map();
  private metrics: FederationMetrics = {
    totalMessages: 0,
    messagesByProtocol: {} as Record<SupportedProtocol, number>,
    messagesByType: {} as Record<UniversalMessageType, number>,
    averageLatency: 0,
    errorRate: 0,
    throughput: 0,
    activeBridges: 0,
    failedTransformations: 0,
    securityViolations: 0
  };
  private routingTable: Map<string, string[]> = new Map();

  constructor() {
    super();
    this.initializeEngine();
  }

  /**
   * Register a protocol adapter
   */
  registerAdapter(adapter: ProtocolAdapter): void {
    this.adapters.set(adapter.protocolType, adapter);
    this.initializeProtocolMetrics(adapter.protocolType);
    
    this.emit('adapterRegistered', {
      protocol: adapter.protocolType,
      version: adapter.version,
      capabilities: adapter.capabilities
    });
  }

  /**
   * Create a bridge between two protocols
   */
  createBridge(config: BridgeConfiguration): void {
    // Validate bridge configuration
    if (!this.adapters.has(config.sourceProtocol)) {
      throw new Error(`Source protocol ${config.sourceProtocol} not registered`);
    }
    if (!this.adapters.has(config.targetProtocol)) {
      throw new Error(`Target protocol ${config.targetProtocol} not registered`);
    }

    this.bridges.set(config.bridgeId, config);
    this.metrics.activeBridges++;

    // Update routing table
    this.updateRoutingTable(config);

    this.emitEvent({
      eventType: FederationEventType.BRIDGE_CONNECTED,
      bridgeId: config.bridgeId,
      details: {
        sourceProtocol: config.sourceProtocol,
        targetProtocol: config.targetProtocol
      },
      severity: EventSeverity.MEDIUM
    });
  }

  /**
   * Remove a bridge
   */
  removeBridge(bridgeId: string): void {
    const bridge = this.bridges.get(bridgeId);
    if (bridge) {
      this.bridges.delete(bridgeId);
      this.metrics.activeBridges--;
      
      this.emitEvent({
        eventType: FederationEventType.BRIDGE_DISCONNECTED,
        bridgeId,
        details: { removed: true },
        severity: EventSeverity.MEDIUM
      });
    }
  }

  /**
   * Send a universal message through the federation
   */
  async sendMessage(
    sourceProtocol: SupportedProtocol,
    targetProtocol: SupportedProtocol,
    sourceAgent: string,
    targetAgent: string,
    messageType: UniversalMessageType,
    payload: any,
    options: {
      priority?: MessagePriority;
      timeout?: number;
      conversationId?: string;
      requireEncryption?: boolean;
    } = {}
  ): Promise<string> {
    try {
      const messageId = this.generateMessageId();
      
      // Create universal message
      const universalMessage: UniversalMessage = {
        messageId,
        sourceProtocol,
        targetProtocol,
        sourceAgent,
        targetAgent,
        messageType,
        payload,
        metadata: {
          conversationId: options.conversationId,
          priority: options.priority || MessagePriority.NORMAL,
          timeout: options.timeout,
          encoding: 'json',
          routing: {
            hops: [],
            maxHops: 10,
            routingStrategy: 'best-effort' as any,
            fallbackRoutes: []
          }
        },
        securityContext: {
          authenticated: true,
          trustLevel: 'verified',
          permissions: ['send', 'receive']
        },
        federationHeaders: {
          federationVersion: '1.0.0',
          bridgeId: this.findBridge(sourceProtocol, targetProtocol),
          transformationChain: [],
          qualityOfService: {
            reliability: 'at-least-once' as any,
            latency: { maxLatency: 5000, preferredLatency: 1000 },
            throughput: { minThroughput: 1, maxThroughput: 1000 },
            durability: false,
            ordering: 'none' as any
          },
          compliance: {
            dataClassification: 'internal' as any,
            requiredCompliance: [],
            dataResidency: [],
            auditRequired: false
          }
        },
        timestamp: Date.now()
      };

      // Route the message
      await this.routeMessage(universalMessage);

      // Update metrics
      this.updateMetrics(universalMessage);

      this.emitEvent({
        eventType: FederationEventType.MESSAGE_RECEIVED,
        messageId,
        sourceProtocol,
        targetProtocol,
        details: { messageType, sourceAgent, targetAgent },
        severity: EventSeverity.LOW
      });

      return messageId;

    } catch (error) {
      this.metrics.errorRate++;
      this.emitEvent({
        eventType: FederationEventType.MESSAGE_FAILED,
        details: { error: error instanceof Error ? error.message : String(error) },
        severity: EventSeverity.HIGH
      });
      throw error;
    }
  }

  /**
   * Route a universal message to its destination
   */
  private async routeMessage(message: UniversalMessage): Promise<void> {
    try {
      // Find the best route
      const route = this.findBestRoute(message.sourceProtocol, message.targetProtocol);
      if (!route) {
        throw new Error(`No route found from ${message.sourceProtocol} to ${message.targetProtocol}`);
      }

      // If direct connection, transform and send
      if (message.sourceProtocol === message.targetProtocol) {
        await this.directDeliver(message);
        return;
      }

      // Otherwise, use bridge
      const bridgeId = this.findBridge(message.sourceProtocol, message.targetProtocol);
      if (!bridgeId) {
        throw new Error(`No bridge found for ${message.sourceProtocol} -> ${message.targetProtocol}`);
      }

      await this.bridgeMessage(message, bridgeId);

    } catch (error) {
      this.emitEvent({
        eventType: FederationEventType.MESSAGE_FAILED,
        messageId: message.messageId,
        details: { error: error instanceof Error ? error.message : String(error), routing: true },
        severity: EventSeverity.HIGH
      });
      throw error;
    }
  }

  /**
   * Bridge a message through protocol transformation
   */
  private async bridgeMessage(message: UniversalMessage, bridgeId: string): Promise<void> {
    const bridge = this.bridges.get(bridgeId);
    if (!bridge) {
      throw new Error(`Bridge ${bridgeId} not found`);
    }

    const sourceAdapter = this.adapters.get(message.sourceProtocol);
    const targetAdapter = this.adapters.get(message.targetProtocol);

    if (!sourceAdapter || !targetAdapter) {
      throw new Error('Required adapters not available');
    }

    try {
      // Apply transformation rules
      const transformedMessage = await this.applyTransformations(message, bridge);

      // Validate security policy
      if (!this.validateSecurityPolicy(transformedMessage, bridge)) {
        this.metrics.securityViolations++;
        throw new Error('Security policy violation');
      }

      // Transform to target protocol format
      const targetMessage = await targetAdapter.transformFromUniversal(transformedMessage);

      // Validate target message
      if (!targetAdapter.validateMessage(targetMessage)) {
        this.metrics.failedTransformations++;
        throw new Error('Target message validation failed');
      }

      // Deliver the message
      await this.deliverMessage(targetMessage, targetAdapter);

      this.emitEvent({
        eventType: FederationEventType.MESSAGE_TRANSFORMED,
        messageId: message.messageId,
        bridgeId,
        details: { 
          sourceProtocol: message.sourceProtocol,
          targetProtocol: message.targetProtocol,
          transformations: bridge.transformationRules.length
        },
        severity: EventSeverity.LOW
      });

    } catch (error) {
      this.metrics.failedTransformations++;
      this.emitEvent({
        eventType: FederationEventType.MESSAGE_FAILED,
        messageId: message.messageId,
        bridgeId,
        details: { error: error instanceof Error ? error.message : String(error), stage: 'transformation' },
        severity: EventSeverity.HIGH
      });
      throw error;
    }
  }

  /**
   * Deliver message directly without protocol transformation
   */
  private async directDeliver(message: UniversalMessage): Promise<void> {
    const adapter = this.adapters.get(message.targetProtocol);
    if (!adapter) {
      throw new Error(`Adapter for ${message.targetProtocol} not found`);
    }

    const nativeMessage = await adapter.transformFromUniversal(message);
    await this.deliverMessage(nativeMessage, adapter);

    this.emitEvent({
      eventType: FederationEventType.MESSAGE_DELIVERED,
      messageId: message.messageId,
      details: { direct: true },
      severity: EventSeverity.LOW
    });
  }

  /**
   * Final message delivery to the target protocol
   */
  private async deliverMessage(message: any, adapter: ProtocolAdapter): Promise<void> {
    // In a real implementation, this would send the message through the adapter
    // For now, we'll emit an event to simulate delivery
    this.emit('messageDelivered', {
      protocol: adapter.protocolType,
      message,
      timestamp: Date.now()
    });
  }

  /**
   * Apply transformation rules from bridge configuration
   */
  private async applyTransformations(
    message: UniversalMessage, 
    bridge: BridgeConfiguration
  ): Promise<UniversalMessage> {
    let transformedMessage = { ...message };

    for (const rule of bridge.transformationRules) {
      // Check conditions
      if (!this.evaluateConditions(rule.conditions, transformedMessage)) {
        continue;
      }

      // Apply transformation
      transformedMessage = this.applyTransformationRule(transformedMessage, rule);
      
      // Track transformation in headers
      transformedMessage.federationHeaders.transformationChain.push(rule.ruleId);
    }

    return transformedMessage;
  }

  /**
   * Apply a single transformation rule
   */
  private applyTransformationRule(message: UniversalMessage, rule: any): UniversalMessage {
    // Simplified transformation - in practice would use JSONPath or custom functions
    const transformed = { ...message };
    
    // Update message type if specified
    if (rule.targetMessageType && rule.targetMessageType !== rule.sourceMessageType) {
      transformed.messageType = rule.targetMessageType;
    }

    return transformed;
  }

  /**
   * Evaluate rule conditions
   */
  private evaluateConditions(conditions: any[], message: UniversalMessage): boolean {
    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(message, condition.field);
      
      switch (condition.operator) {
        case 'eq':
          if (fieldValue !== condition.value) return false;
          break;
        case 'ne':
          if (fieldValue === condition.value) return false;
          break;
        case 'contains':
          if (!String(fieldValue).includes(condition.value)) return false;
          break;
        // Add more operators as needed
      }
    }
    return true;
  }

  /**
   * Get field value from message using dot notation
   */
  private getFieldValue(obj: any, field: string): any {
    return field.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Validate security policy for a message
   */
  private validateSecurityPolicy(message: UniversalMessage, bridge: BridgeConfiguration): boolean {
    const policy = bridge.securityPolicy;

    // Check authentication requirement
    if (policy.requireAuthentication && !message.securityContext.authenticated) {
      return false;
    }

    // Check allowed sources
    if (policy.allowedSources.length > 0 && 
        !policy.allowedSources.includes(message.sourceAgent)) {
      return false;
    }

    // Check allowed targets
    if (policy.allowedTargets.length > 0 && 
        !policy.allowedTargets.includes(message.targetAgent)) {
      return false;
    }

    // Check encryption requirement
    if (policy.encryptionRequired && !message.securityContext.encryptionKey) {
      return false;
    }

    return true;
  }

  /**
   * Find the best route between protocols
   */
  private findBestRoute(source: SupportedProtocol, target: SupportedProtocol): string[] | null {
    const routes = this.routingTable.get(`${source}->${target}`);
    return routes && routes.length > 0 ? routes : null;
  }

  /**
   * Find a bridge between two protocols
   */
  private findBridge(source: SupportedProtocol, target: SupportedProtocol): string {
    for (const [bridgeId, bridge] of this.bridges) {
      if (bridge.sourceProtocol === source && bridge.targetProtocol === target) {
        return bridgeId;
      }
    }
    return '';
  }

  /**
   * Update routing table when a bridge is created
   */
  private updateRoutingTable(bridge: BridgeConfiguration): void {
    const routeKey = `${bridge.sourceProtocol}->${bridge.targetProtocol}`;
    
    if (!this.routingTable.has(routeKey)) {
      this.routingTable.set(routeKey, []);
    }
    
    this.routingTable.get(routeKey)!.push(bridge.bridgeId);
  }

  /**
   * Update federation metrics
   */
  private updateMetrics(message: UniversalMessage): void {
    this.metrics.totalMessages++;
    
    // Update protocol metrics
    this.metrics.messagesByProtocol[message.sourceProtocol] = 
      (this.metrics.messagesByProtocol[message.sourceProtocol] || 0) + 1;
    
    // Update message type metrics
    this.metrics.messagesByType[message.messageType] = 
      (this.metrics.messagesByType[message.messageType] || 0) + 1;

    // Calculate throughput (messages per second over last minute)
    this.metrics.throughput = this.calculateThroughput();
  }

  /**
   * Calculate current throughput
   */
  private calculateThroughput(): number {
    // Simplified calculation - in practice would use a rolling window
    return this.metrics.totalMessages / Math.max(1, Date.now() / 1000 - (this.startTime || 0));
  }

  /**
   * Get federation metrics
   */
  getMetrics(): FederationMetrics {
    return { ...this.metrics };
  }

  /**
   * Get active bridges
   */
  getBridges(): BridgeConfiguration[] {
    return Array.from(this.bridges.values());
  }

  /**
   * Get registered adapters
   */
  getAdapters(): ProtocolAdapter[] {
    return Array.from(this.adapters.values());
  }

  private initializeEngine(): void {
    this.startTime = Date.now() / 1000;
    
    // Initialize protocol metrics for all supported protocols
    Object.values(SupportedProtocol).forEach(protocol => {
      this.initializeProtocolMetrics(protocol);
    });

    // Initialize message type metrics
    Object.values(UniversalMessageType).forEach(type => {
      this.metrics.messagesByType[type] = 0;
    });
  }

  private initializeProtocolMetrics(protocol: SupportedProtocol): void {
    if (!this.metrics.messagesByProtocol[protocol]) {
      this.metrics.messagesByProtocol[protocol] = 0;
    }
  }

  private generateMessageId(): string {
    return `fed-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  private emitEvent(eventData: Partial<FederationEvent>): void {
    const event: FederationEvent = {
      eventId: this.generateEventId(),
      timestamp: Date.now(),
      eventType: eventData.eventType!,
      bridgeId: eventData.bridgeId,
      messageId: eventData.messageId,
      sourceProtocol: eventData.sourceProtocol,
      targetProtocol: eventData.targetProtocol,
      details: eventData.details || {},
      severity: eventData.severity || EventSeverity.LOW
    };

    this.emit('federationEvent', event);
  }

  private generateEventId(): string {
    return `evt-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }

  private startTime: number = 0;
}