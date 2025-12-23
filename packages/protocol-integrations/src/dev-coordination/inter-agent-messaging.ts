/**
 * Inter-Agent Messaging System
 * Enables structured communication between specialist agents
 */

import { EventEmitter } from 'events';
import { 
  AgentSpecialization,
  InterAgentMessageType,
  CommunicationProtocol,
  ReliabilityLevel,
  SecurityLevel,
  EventPriority
} from './types';

export interface InterAgentMessage {
  messageId: string;
  sourceAgent: AgentSpecialization;
  targetAgent: AgentSpecialization;
  messageType: InterAgentMessageType;
  payload: any;
  timestamp: number;
  priority: EventPriority;
  correlationId?: string;
  requiresResponse: boolean;
  security: MessageSecurity;
}

export interface MessageSecurity {
  level: SecurityLevel;
  signature?: string;
  encrypted: boolean;
  authToken?: string;
}

export interface MessageResponse {
  responseId: string;
  originalMessageId: string;
  sourceAgent: AgentSpecialization;
  targetAgent: AgentSpecialization;
  success: boolean;
  payload?: any;
  error?: string;
  timestamp: number;
}

export interface MessageHandler {
  messageType: InterAgentMessageType;
  handler: (message: InterAgentMessage) => Promise<MessageResponse | void>;
  priority: number;
}

export class InterAgentMessagingSystem extends EventEmitter {
  private messageHandlers: Map<AgentSpecialization, Map<InterAgentMessageType, MessageHandler[]>> = new Map();
  private messageQueue: Map<AgentSpecialization, InterAgentMessage[]> = new Map();
  private messageHistory: InterAgentMessage[] = [];
  private responseMap: Map<string, MessageResponse> = new Map();
  private communicationStats: Map<string, number> = new Map();

  constructor() {
    super();
    this.initializeDefaultHandlers();
  }

  private initializeDefaultHandlers(): void {
    // Initialize message queues for all agents
    Object.values(AgentSpecialization).forEach(agent => {
      this.messageQueue.set(agent, []);
      this.messageHandlers.set(agent, new Map());
    });
  }

  registerHandler(agentId: AgentSpecialization, handler: MessageHandler): void {
    const agentHandlers = this.messageHandlers.get(agentId) || new Map();
    const typeHandlers = agentHandlers.get(handler.messageType) || [];
    
    typeHandlers.push(handler);
    typeHandlers.sort((a, b) => b.priority - a.priority); // Higher priority first
    
    agentHandlers.set(handler.messageType, typeHandlers);
    this.messageHandlers.set(agentId, agentHandlers);
  }

  async sendMessage(
    sourceAgent: AgentSpecialization,
    targetAgent: AgentSpecialization,
    messageType: InterAgentMessageType,
    payload: any,
    options: {
      priority?: EventPriority;
      requiresResponse?: boolean;
      correlationId?: string;
      security?: Partial<MessageSecurity>;
    } = {}
  ): Promise<MessageResponse | void> {
    const message: InterAgentMessage = {
      messageId: this.generateMessageId(),
      sourceAgent,
      targetAgent,
      messageType,
      payload,
      timestamp: Date.now(),
      priority: options.priority || EventPriority.NORMAL,
      correlationId: options.correlationId,
      requiresResponse: options.requiresResponse || false,
      security: {
        level: SecurityLevel.TOKEN_BASED,
        encrypted: false,
        ...options.security
      }
    };

    // Log communication stats
    const statsKey = `${sourceAgent}->${targetAgent}-${messageType}`;
    this.communicationStats.set(statsKey, (this.communicationStats.get(statsKey) || 0) + 1);

    // Add to message history
    this.messageHistory.push(message);
    if (this.messageHistory.length > 1000) {
      this.messageHistory.splice(0, 500);
    }

    // Route message to target agent
    return this.routeMessage(message);
  }

  private async routeMessage(message: InterAgentMessage): Promise<MessageResponse | void> {
    // Add to target agent's message queue
    const targetQueue = this.messageQueue.get(message.targetAgent);
    if (targetQueue) {
      targetQueue.push(message);
      targetQueue.sort((a, b) => b.priority - a.priority); // Higher priority first
    }

    // Emit message event for external listeners
    this.emit('message-sent', message);

    // Process message immediately if handlers are available
    const response = await this.processMessage(message);
    
    if (response) {
      this.responseMap.set(message.messageId, response);
      this.emit('message-response', response);
    }

    return response;
  }

  private async processMessage(message: InterAgentMessage): Promise<MessageResponse | void> {
    const agentHandlers = this.messageHandlers.get(message.targetAgent);
    if (!agentHandlers) {
      return this.createErrorResponse(message, 'No handlers registered for target agent');
    }

    const typeHandlers = agentHandlers.get(message.messageType);
    if (!typeHandlers || typeHandlers.length === 0) {
      return this.createErrorResponse(message, `No handlers registered for message type: ${message.messageType}`);
    }

    // Process with highest priority handler
    const handler = typeHandlers[0];
    
    try {
      const response = await handler.handler(message);
      
      if (response) {
        return response;
      } else if (message.requiresResponse) {
        return this.createSuccessResponse(message, { processed: true });
      }
    } catch (error) {
      console.error(`Error processing message ${message.messageId}:`, error);
      return this.createErrorResponse(message, `Handler error: ${error.message}`);
    }
  }

  private createSuccessResponse(originalMessage: InterAgentMessage, payload: any): MessageResponse {
    return {
      responseId: this.generateMessageId(),
      originalMessageId: originalMessage.messageId,
      sourceAgent: originalMessage.targetAgent,
      targetAgent: originalMessage.sourceAgent,
      success: true,
      payload,
      timestamp: Date.now()
    };
  }

  private createErrorResponse(originalMessage: InterAgentMessage, error: string): MessageResponse {
    return {
      responseId: this.generateMessageId(),
      originalMessageId: originalMessage.messageId,
      sourceAgent: originalMessage.targetAgent,
      targetAgent: originalMessage.sourceAgent,
      success: false,
      error,
      timestamp: Date.now()
    };
  }

  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Convenience methods for common message types
  async requestCoordination(
    sourceAgent: AgentSpecialization,
    targetAgent: AgentSpecialization,
    coordinationRequest: any
  ): Promise<MessageResponse | void> {
    return this.sendMessage(
      sourceAgent,
      targetAgent,
      InterAgentMessageType.COORDINATION_REQUEST,
      coordinationRequest,
      { requiresResponse: true, priority: EventPriority.HIGH }
    );
  }

  async requestResourceLock(
    sourceAgent: AgentSpecialization,
    targetAgent: AgentSpecialization,
    resourceId: string
  ): Promise<MessageResponse | void> {
    return this.sendMessage(
      sourceAgent,
      targetAgent,
      InterAgentMessageType.RESOURCE_LOCK_REQUEST,
      { resourceId, requestor: sourceAgent },
      { requiresResponse: true, priority: EventPriority.HIGH }
    );
  }

  async releaseResourceLock(
    sourceAgent: AgentSpecialization,
    targetAgent: AgentSpecialization,
    resourceId: string
  ): Promise<MessageResponse | void> {
    return this.sendMessage(
      sourceAgent,
      targetAgent,
      InterAgentMessageType.RESOURCE_LOCK_RELEASE,
      { resourceId, releaser: sourceAgent },
      { requiresResponse: false, priority: EventPriority.NORMAL }
    );
  }

  async notifyConflict(
    sourceAgent: AgentSpecialization,
    conflictDetails: any,
    targetAgents?: AgentSpecialization[]
  ): Promise<void> {
    const targets = targetAgents || Object.values(AgentSpecialization).filter(a => a !== sourceAgent);
    
    const promises = targets.map(targetAgent => 
      this.sendMessage(
        sourceAgent,
        targetAgent,
        InterAgentMessageType.CONFLICT_NOTIFICATION,
        conflictDetails,
        { priority: EventPriority.CRITICAL }
      )
    );

    await Promise.all(promises);
  }

  async updateProgress(
    sourceAgent: AgentSpecialization,
    progressUpdate: any,
    targetAgents?: AgentSpecialization[]
  ): Promise<void> {
    const targets = targetAgents || Object.values(AgentSpecialization).filter(a => a !== sourceAgent);
    
    const promises = targets.map(targetAgent => 
      this.sendMessage(
        sourceAgent,
        targetAgent,
        InterAgentMessageType.PROGRESS_UPDATE,
        progressUpdate,
        { priority: EventPriority.LOW }
      )
    );

    await Promise.all(promises);
  }

  async signalDependencyReady(
    sourceAgent: AgentSpecialization,
    targetAgent: AgentSpecialization,
    dependencyInfo: any
  ): Promise<void> {
    await this.sendMessage(
      sourceAgent,
      targetAgent,
      InterAgentMessageType.DEPENDENCY_READY,
      dependencyInfo,
      { priority: EventPriority.HIGH }
    );
  }

  async requestIntegrationTest(
    sourceAgent: AgentSpecialization,
    testRequest: any,
    targetAgents?: AgentSpecialization[]
  ): Promise<MessageResponse[]> {
    const targets = targetAgents || [AgentSpecialization.ANP_AGENT]; // Default to ANP agent for coordination
    
    const promises = targets.map(targetAgent => 
      this.sendMessage(
        sourceAgent,
        targetAgent,
        InterAgentMessageType.INTEGRATION_TEST_REQUEST,
        testRequest,
        { requiresResponse: true, priority: EventPriority.HIGH }
      )
    );

    const responses = await Promise.all(promises);
    return responses.filter(r => r !== undefined) as MessageResponse[];
  }

  async syncRequest(
    sourceAgent: AgentSpecialization,
    targetAgent: AgentSpecialization,
    syncData: any
  ): Promise<MessageResponse | void> {
    return this.sendMessage(
      sourceAgent,
      targetAgent,
      InterAgentMessageType.SYNC_REQUEST,
      syncData,
      { requiresResponse: true, priority: EventPriority.NORMAL }
    );
  }

  async handoffRequest(
    sourceAgent: AgentSpecialization,
    targetAgent: AgentSpecialization,
    handoffData: any
  ): Promise<MessageResponse | void> {
    return this.sendMessage(
      sourceAgent,
      targetAgent,
      InterAgentMessageType.HANDOFF_REQUEST,
      handoffData,
      { requiresResponse: true, priority: EventPriority.HIGH }
    );
  }

  // Queue management
  getMessageQueue(agentId: AgentSpecialization): InterAgentMessage[] {
    return this.messageQueue.get(agentId) || [];
  }

  processQueue(agentId: AgentSpecialization): Promise<void> {
    const queue = this.messageQueue.get(agentId);
    if (!queue || queue.length === 0) {
      return Promise.resolve();
    }

    const promises = queue.map(message => this.processMessage(message));
    queue.length = 0; // Clear queue

    return Promise.all(promises).then(() => {});
  }

  // Statistics and monitoring
  getCommunicationStats(): Record<string, number> {
    return Object.fromEntries(this.communicationStats.entries());
  }

  getMessageHistory(limit: number = 50): InterAgentMessage[] {
    return this.messageHistory.slice(-limit);
  }

  getSystemStatus(): any {
    return {
      totalMessages: this.messageHistory.length,
      queueSizes: Object.fromEntries(
        Array.from(this.messageQueue.entries()).map(([agent, queue]) => [agent, queue.length])
      ),
      communicationStats: this.getCommunicationStats(),
      activeHandlers: Object.fromEntries(
        Array.from(this.messageHandlers.entries()).map(([agent, handlers]) => [
          agent,
          handlers.size
        ])
      )
    };
  }
}