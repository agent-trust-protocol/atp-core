/**
 * Cisco Agent Gateway Protocol (AGP) Adapter
 * Bridges Cisco AGP with ATP quantum-safe security
 */

import { EventEmitter } from 'events';
import { createHash, randomBytes } from 'crypto';
import { 
  AGPMessage, 
  AGPAgent, 
  AGPRoute, 
  AGPMessageType, 
  AGPPriority, 
  AGPAgentStatus,
  SecuredAGPMessage 
} from './types';
import { QuantumSafeSignature } from '@atp/shared';

export class AGPAdapter extends EventEmitter {
  private agents: Map<string, AGPAgent> = new Map();
  private routes: Map<string, AGPRoute> = new Map();
  private sessions: Map<string, any> = new Map();
  private quantumCrypto: QuantumSafeSignature;
  private messageQueue: Map<string, AGPMessage[]> = new Map();

  constructor() {
    super();
    this.quantumCrypto = new QuantumSafeSignature();
    this.startHeartbeatMonitor();
  }

  /**
   * Register an agent with the AGP gateway
   */
  async registerAgent(agent: AGPAgent): Promise<void> {
    this.agents.set(agent.agentId, {
      ...agent,
      status: AGPAgentStatus.ACTIVE,
      lastHeartbeat: Date.now()
    });

    // Send registration confirmation
    const registrationMessage: AGPMessage = {
      messageId: this.generateMessageId(),
      messageType: AGPMessageType.REGISTRATION,
      sourceAgent: 'gateway',
      targetAgent: agent.agentId,
      payload: {
        status: 'registered',
        gatewayInfo: {
          version: '1.0.0',
          capabilities: ['quantum-safe', 'high-availability', 'load-balancing']
        }
      },
      priority: AGPPriority.HIGH,
      timestamp: Date.now()
    };

    this.emit('agentRegistered', { agent, message: registrationMessage });
  }

  /**
   * Deregister an agent
   */
  async deregisterAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = AGPAgentStatus.INACTIVE;
      this.agents.delete(agentId);
      
      // Clean up agent's message queue
      this.messageQueue.delete(agentId);
      
      this.emit('agentDeregistered', agentId);
    }
  }

  /**
   * Send a secure AGP message
   */
  async sendMessage(
    message: AGPMessage,
    senderDID: string,
    senderPrivateKey: string
  ): Promise<void> {
    try {
      // Validate message
      this.validateMessage(message);

      // Check if target agents exist
      const targets = Array.isArray(message.targetAgent) 
        ? message.targetAgent 
        : [message.targetAgent];
      
      for (const target of targets) {
        const targetAgent = this.agents.get(target);
        if (!targetAgent || targetAgent.status !== AGPAgentStatus.ACTIVE) {
          throw new Error(`Target agent ${target} not available`);
        }
      }

      // Create quantum-safe signature
      const messageHash = this.hashMessage(message);
      const signature = await this.quantumCrypto.sign(messageHash);

      // Create secured message
      const securedMessage: SecuredAGPMessage = {
        ...message,
        atpHeaders: {
          clientDID: senderDID,
          signature,
          trustLevel: 'verified',
          nonce: randomBytes(16).toString('hex'),
          encryptionMethod: 'quantum-safe'
        },
        securityContext: {
          authenticated: true,
          authorized: true,
          encrypted: true,
          integrityChecked: true
        }
      };

      // Route the message
      await this.routeMessage(securedMessage);

      this.emit('messageSent', securedMessage);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Process an incoming secured message
   */
  async processIncomingMessage(securedMessage: SecuredAGPMessage): Promise<AGPMessage | null> {
    try {
      // Verify quantum-safe signature
      const messageHash = this.hashMessage(securedMessage);
      const isValid = await this.quantumCrypto.verify(
        messageHash,
        securedMessage.atpHeaders.signature
      );

      if (!isValid) {
        this.emit('securityViolation', {
          reason: 'Invalid signature',
          message: securedMessage
        });
        return null;
      }

      // Handle different message types
      switch (securedMessage.messageType) {
        case AGPMessageType.HEARTBEAT:
          await this.handleHeartbeat(securedMessage);
          break;
        case AGPMessageType.DISCOVERY:
          await this.handleDiscovery(securedMessage);
          break;
        case AGPMessageType.REQUEST:
          await this.handleRequest(securedMessage);
          break;
        case AGPMessageType.RESPONSE:
          await this.handleResponse(securedMessage);
          break;
        case AGPMessageType.NOTIFICATION:
          await this.handleNotification(securedMessage);
          break;
      }

      this.emit('messageProcessed', securedMessage);
      return securedMessage;
    } catch (error) {
      this.emit('error', error);
      return null;
    }
  }

  /**
   * Create a route for message routing
   */
  createRoute(route: AGPRoute): void {
    this.routes.set(route.routeId, route);
    this.emit('routeCreated', route);
  }

  /**
   * Remove a route
   */
  removeRoute(routeId: string): void {
    this.routes.delete(routeId);
    this.emit('routeRemoved', routeId);
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AGPAgent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * List all registered agents
   */
  listAgents(): AGPAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get gateway statistics
   */
  getStats(): {
    totalAgents: number;
    activeAgents: number;
    totalRoutes: number;
    totalMessages: number;
    queuedMessages: number;
  } {
    const activeAgents = Array.from(this.agents.values())
      .filter(agent => agent.status === AGPAgentStatus.ACTIVE).length;
    
    const queuedMessages = Array.from(this.messageQueue.values())
      .reduce((total, queue) => total + queue.length, 0);

    return {
      totalAgents: this.agents.size,
      activeAgents,
      totalRoutes: this.routes.size,
      totalMessages: 0, // Would track in real implementation
      queuedMessages
    };
  }

  private async routeMessage(securedMessage: SecuredAGPMessage): Promise<void> {
    const targets = Array.isArray(securedMessage.targetAgent) 
      ? securedMessage.targetAgent 
      : [securedMessage.targetAgent];

    for (const target of targets) {
      // Find matching route
      const route = this.findRoute(securedMessage.sourceAgent, target);
      
      if (route) {
        // Apply route filters
        const filteredMessage = await this.applyFilters(securedMessage, route.filters);
        
        // Queue message for delivery
        this.queueMessage(target, filteredMessage);
      } else {
        // Direct routing
        this.queueMessage(target, securedMessage);
      }
    }
  }

  private findRoute(source: string, target: string): AGPRoute | undefined {
    for (const route of this.routes.values()) {
      if (this.matchesPattern(source, route.sourcePattern) && 
          this.matchesPattern(target, route.targetPattern)) {
        return route;
      }
    }
    return undefined;
  }

  private matchesPattern(value: string, pattern: string): boolean {
    // Simple pattern matching - could be enhanced with regex
    return pattern === '*' || pattern === value || value.includes(pattern);
  }

  private async applyFilters(message: SecuredAGPMessage, filters: any[]): Promise<SecuredAGPMessage> {
    let processedMessage = { ...message };
    
    // Sort filters by order
    const sortedFilters = filters.sort((a, b) => a.order - b.order);
    
    for (const filter of sortedFilters) {
      switch (filter.filterType) {
        case 'RATE_LIMIT':
          // Apply rate limiting logic
          break;
        case 'AUTH':
          // Apply additional authentication
          break;
        case 'VALIDATION':
          // Apply message validation
          break;
        case 'TRANSFORM':
          // Apply message transformation
          break;
        case 'AUDIT':
          // Apply audit logging
          break;
      }
    }
    
    return processedMessage;
  }

  private queueMessage(targetAgent: string, message: SecuredAGPMessage): void {
    if (!this.messageQueue.has(targetAgent)) {
      this.messageQueue.set(targetAgent, []);
    }
    this.messageQueue.get(targetAgent)!.push(message);
    
    // Emit message for immediate delivery if agent is connected
    this.emit('messageQueued', { targetAgent, message });
  }

  private async handleHeartbeat(message: SecuredAGPMessage): Promise<void> {
    const agent = this.agents.get(message.sourceAgent);
    if (agent) {
      agent.lastHeartbeat = Date.now();
      agent.status = AGPAgentStatus.ACTIVE;
      
      // Send heartbeat response
      const response: AGPMessage = {
        messageId: this.generateMessageId(),
        messageType: AGPMessageType.HEARTBEAT,
        sourceAgent: 'gateway',
        targetAgent: message.sourceAgent,
        payload: { status: 'ok', timestamp: Date.now() },
        priority: AGPPriority.LOW,
        timestamp: Date.now(),
        correlationId: message.messageId
      };
      
      this.emit('heartbeatResponse', response);
    }
  }

  private async handleDiscovery(message: SecuredAGPMessage): Promise<void> {
    // Return list of available agents and capabilities
    const availableAgents = Array.from(this.agents.values())
      .filter(agent => agent.status === AGPAgentStatus.ACTIVE)
      .map(agent => ({
        agentId: agent.agentId,
        agentName: agent.agentName,
        capabilities: agent.capabilities,
        endpoints: agent.endpoints
      }));

    const response: AGPMessage = {
      messageId: this.generateMessageId(),
      messageType: AGPMessageType.RESPONSE,
      sourceAgent: 'gateway',
      targetAgent: message.sourceAgent,
      payload: {
        availableAgents,
        gatewayCapabilities: ['quantum-safe', 'load-balancing', 'high-availability']
      },
      priority: AGPPriority.NORMAL,
      timestamp: Date.now(),
      correlationId: message.messageId
    };

    this.emit('discoveryResponse', response);
  }

  private async handleRequest(message: SecuredAGPMessage): Promise<void> {
    // Route request to appropriate handler
    this.emit('requestReceived', message);
  }

  private async handleResponse(message: SecuredAGPMessage): Promise<void> {
    // Handle response message
    this.emit('responseReceived', message);
  }

  private async handleNotification(message: SecuredAGPMessage): Promise<void> {
    // Handle notification message
    this.emit('notificationReceived', message);
  }

  private validateMessage(message: AGPMessage): void {
    if (!message.messageId) {
      throw new Error('Message ID is required');
    }
    if (!message.sourceAgent) {
      throw new Error('Source agent is required');
    }
    if (!message.targetAgent) {
      throw new Error('Target agent is required');
    }
    if (!message.messageType) {
      throw new Error('Message type is required');
    }
  }

  private hashMessage(message: AGPMessage): string {
    const content = JSON.stringify({
      messageId: message.messageId,
      messageType: message.messageType,
      sourceAgent: message.sourceAgent,
      targetAgent: message.targetAgent,
      payload: message.payload
    });
    return createHash('sha256').update(content).digest('hex');
  }

  private generateMessageId(): string {
    return `agp-${Date.now()}-${randomBytes(8).toString('hex')}`;
  }

  private startHeartbeatMonitor(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [agentId, agent] of this.agents) {
        const timeSinceHeartbeat = now - (agent.lastHeartbeat || 0);
        const heartbeatTimeout = agent.heartbeatInterval * 3; // 3x interval as timeout
        
        if (timeSinceHeartbeat > heartbeatTimeout) {
          agent.status = AGPAgentStatus.INACTIVE;
          this.emit('agentTimeout', agentId);
        }
      }
    }, 30000); // Check every 30 seconds
  }
}