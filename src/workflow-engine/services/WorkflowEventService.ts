import { EventEmitter } from 'events';
import { WorkflowEngine } from '../core/WorkflowEngine';
import { NodeRegistry } from '../core/NodeRegistry';
import { workflowRepository } from '../database/repository';

interface EventHandler {
  id: string;
  workflowId: string;
  eventType: string;
  condition?: (eventData: any) => boolean;
  enabled: boolean;
  priority: number;
  lastTriggered?: Date;
  triggerCount: number;
}

interface WorkflowEvent {
  type: string;
  data: any;
  source: string;
  timestamp: Date;
  correlationId?: string;
}

export class WorkflowEventService extends EventEmitter {
  private workflowEngine: WorkflowEngine;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private isInitialized = false;
  private eventQueue: WorkflowEvent[] = [];
  private processingQueue = false;

  constructor() {
    super();
    const nodeRegistry = new NodeRegistry();
    this.workflowEngine = new WorkflowEngine(nodeRegistry);
  }

  async initialize() {
    if (this.isInitialized) {
      console.warn('WorkflowEventService already initialized');
      return;
    }

    try {
      console.log('Initializing workflow event service...');
      
      // Load event handlers from database
      await this.loadEventHandlers();
      
      // Start queue processing
      setInterval(() => this.processEventQueue(), 1000);
      
      this.isInitialized = true;
      console.log(`Event service initialized with ${this.getTotalHandlers()} event handlers`);
      
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize workflow event service:', error);
      throw error;
    }
  }

  private async loadEventHandlers() {
    try {
      // Get all workflows with event triggers
      const workflows = await workflowRepository.listWorkflows(1000, 0);
      
      for (const workflow of workflows) {
        const eventTriggers = workflow.triggers?.filter(
          trigger => trigger.type === 'event' && trigger.config?.eventName
        ) || [];

        for (const trigger of eventTriggers) {
          if (trigger.config?.eventName) {
            this.registerEventHandler({
              workflowId: workflow.id,
              eventType: trigger.config.eventName,
              condition: trigger.config.condition,
              enabled: trigger.enabled !== false,
              priority: trigger.config.priority || 0
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading event handlers:', error);
      throw error;
    }
  }

  registerEventHandler(handler: {
    workflowId: string;
    eventType: string;
    condition?: (eventData: any) => boolean;
    enabled?: boolean;
    priority?: number;
  }): string {
    const id = `handler-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const eventHandler: EventHandler = {
      id,
      workflowId: handler.workflowId,
      eventType: handler.eventType,
      condition: handler.condition,
      enabled: handler.enabled !== false,
      priority: handler.priority || 0,
      triggerCount: 0
    };

    // Add to handlers map
    if (!this.eventHandlers.has(handler.eventType)) {
      this.eventHandlers.set(handler.eventType, []);
    }
    
    const handlers = this.eventHandlers.get(handler.eventType)!;
    handlers.push(eventHandler);
    
    // Sort by priority (higher priority first)
    handlers.sort((a, b) => b.priority - a.priority);
    
    console.log(`Registered event handler for ${handler.eventType} -> workflow ${handler.workflowId}`);
    this.emit('handler:registered', eventHandler);
    
    return id;
  }

  unregisterEventHandler(handlerId: string): void {
    for (const [eventType, handlers] of this.eventHandlers) {
      const index = handlers.findIndex(h => h.id === handlerId);
      if (index !== -1) {
        const handler = handlers[index];
        handlers.splice(index, 1);
        
        console.log(`Unregistered event handler ${handlerId}`);
        this.emit('handler:unregistered', { handlerId, handler });
        return;
      }
    }
  }

  enableEventHandler(handlerId: string): void {
    const handler = this.findHandler(handlerId);
    if (handler) {
      handler.enabled = true;
      console.log(`Enabled event handler ${handlerId}`);
      this.emit('handler:enabled', { handlerId });
    }
  }

  disableEventHandler(handlerId: string): void {
    const handler = this.findHandler(handlerId);
    if (handler) {
      handler.enabled = false;
      console.log(`Disabled event handler ${handlerId}`);
      this.emit('handler:disabled', { handlerId });
    }
  }

  private findHandler(handlerId: string): EventHandler | null {
    for (const handlers of this.eventHandlers.values()) {
      const handler = handlers.find(h => h.id === handlerId);
      if (handler) return handler;
    }
    return null;
  }

  async publishEvent(event: {
    type: string;
    data: any;
    source: string;
    correlationId?: string;
  }): Promise<void> {
    const workflowEvent: WorkflowEvent = {
      type: event.type,
      data: event.data,
      source: event.source,
      timestamp: new Date(),
      correlationId: event.correlationId
    };

    console.log(`Publishing event: ${event.type} from ${event.source}`);
    
    // Add to queue for processing
    this.eventQueue.push(workflowEvent);
    
    // Emit event for real-time listeners
    this.emit('event:published', workflowEvent);
    
    // Process immediately if queue is not being processed
    if (!this.processingQueue) {
      await this.processEventQueue();
    }
  }

  private async processEventQueue(): Promise<void> {
    if (this.processingQueue || this.eventQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!;
        await this.processEvent(event);
      }
    } catch (error) {
      console.error('Error processing event queue:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  private async processEvent(event: WorkflowEvent): Promise<void> {
    const handlers = this.eventHandlers.get(event.type) || [];
    const triggeredHandlers: EventHandler[] = [];

    console.log(`Processing event ${event.type}, found ${handlers.length} handlers`);

    for (const handler of handlers) {
      if (!handler.enabled) {
        continue;
      }

      // Check condition if provided
      if (handler.condition) {
        try {
          const conditionMet = handler.condition(event.data);
          if (!conditionMet) {
            console.log(`Event ${event.type} condition not met for workflow ${handler.workflowId}`);
            continue;
          }
        } catch (error) {
          console.error(`Error evaluating condition for handler ${handler.id}:`, error);
          continue;
        }
      }

      triggeredHandlers.push(handler);
    }

    // Execute triggered workflows
    for (const handler of triggeredHandlers) {
      try {
        await this.executeTriggeredWorkflow(handler, event);
      } catch (error) {
        console.error(`Error executing workflow ${handler.workflowId} for event ${event.type}:`, error);
      }
    }

    if (triggeredHandlers.length > 0) {
      this.emit('event:processed', {
        event,
        triggeredWorkflows: triggeredHandlers.map(h => h.workflowId)
      });
    }
  }

  private async executeTriggeredWorkflow(handler: EventHandler, event: WorkflowEvent): Promise<void> {
    try {
      console.log(`Executing workflow ${handler.workflowId} triggered by event ${event.type}`);
      
      // Update handler statistics
      handler.lastTriggered = new Date();
      handler.triggerCount++;

      // Get workflow from database
      const workflow = await workflowRepository.getWorkflow(handler.workflowId);
      
      if (!workflow) {
        console.error(`Triggered workflow ${handler.workflowId} not found in database`);
        this.unregisterEventHandler(handler.id);
        return;
      }

      // Register and execute workflow
      await this.workflowEngine.registerWorkflow(workflow);
      
      const result = await this.workflowEngine.executeWorkflow(
        handler.workflowId,
        {
          event: event.data,
          eventType: event.type,
          eventSource: event.source,
          eventTimestamp: event.timestamp,
          correlationId: event.correlationId
        },
        {
          executionId: `event-${Date.now()}`,
          workflowId: handler.workflowId,
          startTime: new Date(),
          state: 'running' as any,
          currentNodeId: null,
          data: {},
          errors: [],
          completedNodes: [],
          user: {
            id: 'event-service',
            name: 'Event Service'
          }
        }
      );

      // Update statistics
      await workflowRepository.updateWorkflowStats(handler.workflowId, result);
      
      console.log(`Event-triggered workflow ${handler.workflowId} completed:`, result.success ? 'SUCCESS' : 'FAILED');
      
      this.emit('workflow:executed', {
        workflowId: handler.workflowId,
        eventType: event.type,
        result,
        trigger: 'event',
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error(`Error executing event-triggered workflow ${handler.workflowId}:`, error);
      
      this.emit('workflow:execution-failed', {
        workflowId: handler.workflowId,
        eventType: event.type,
        error: error instanceof Error ? error.message : 'Unknown error',
        trigger: 'event',
        timestamp: new Date()
      });
    }
  }

  // ATP-specific event publishers
  async publishPolicyEvent(eventType: 'policy-created' | 'policy-updated' | 'policy-deleted' | 'policy-violated', data: any): Promise<void> {
    await this.publishEvent({
      type: `atp.policy.${eventType}`,
      data,
      source: 'atp-policy-service'
    });
  }

  async publishTrustEvent(eventType: 'trust-changed' | 'risk-detected' | 'trust-evaluation-completed', data: any): Promise<void> {
    await this.publishEvent({
      type: `atp.trust.${eventType}`,
      data,
      source: 'atp-trust-service'
    });
  }

  async publishSecurityEvent(eventType: 'security-alert' | 'intrusion-detected' | 'authentication-failed', data: any): Promise<void> {
    await this.publishEvent({
      type: `atp.security.${eventType}`,
      data,
      source: 'atp-security-service'
    });
  }

  async publishComplianceEvent(eventType: 'compliance-check' | 'audit-completed' | 'violation-detected', data: any): Promise<void> {
    await this.publishEvent({
      type: `atp.compliance.${eventType}`,
      data,
      source: 'atp-compliance-service'
    });
  }

  getEventHandlers(eventType?: string): EventHandler[] {
    if (eventType) {
      return this.eventHandlers.get(eventType) || [];
    }

    const allHandlers: EventHandler[] = [];
    for (const handlers of this.eventHandlers.values()) {
      allHandlers.push(...handlers);
    }
    return allHandlers;
  }

  getEventTypes(): string[] {
    return Array.from(this.eventHandlers.keys());
  }

  private getTotalHandlers(): number {
    let total = 0;
    for (const handlers of this.eventHandlers.values()) {
      total += handlers.length;
    }
    return total;
  }

  getStatistics() {
    const handlers = this.getEventHandlers();
    const eventTypes = this.getEventTypes();
    
    return {
      totalHandlers: handlers.length,
      totalEventTypes: eventTypes.length,
      enabledHandlers: handlers.filter(h => h.enabled).length,
      disabledHandlers: handlers.filter(h => !h.enabled).length,
      totalTriggers: handlers.reduce((sum, h) => sum + h.triggerCount, 0),
      queueSize: this.eventQueue.length,
      processingQueue: this.processingQueue,
      eventTypeBreakdown: eventTypes.map(type => ({
        eventType: type,
        handlerCount: this.eventHandlers.get(type)?.length || 0,
        enabledCount: this.eventHandlers.get(type)?.filter(h => h.enabled).length || 0
      }))
    };
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down workflow event service...');
    
    // Process remaining events in queue
    if (this.eventQueue.length > 0) {
      console.log(`Processing ${this.eventQueue.length} remaining events...`);
      await this.processEventQueue();
    }
    
    // Clear all handlers
    this.eventHandlers.clear();
    this.isInitialized = false;
    
    this.emit('shutdown');
    console.log('Workflow event service shutdown complete');
  }

  // WebSocket/SSE support for real-time event streaming
  createEventStream() {
    const eventStream = new EventEmitter();
    
    const onEvent = (event: WorkflowEvent) => {
      eventStream.emit('event', event);
    };
    
    const onWorkflowExecuted = (data: any) => {
      eventStream.emit('workflow-executed', data);
    };
    
    const onWorkflowFailed = (data: any) => {
      eventStream.emit('workflow-failed', data);
    };
    
    this.on('event:published', onEvent);
    this.on('workflow:executed', onWorkflowExecuted);
    this.on('workflow:execution-failed', onWorkflowFailed);
    
    // Cleanup function
    eventStream.on('close', () => {
      this.off('event:published', onEvent);
      this.off('workflow:executed', onWorkflowExecuted);
      this.off('workflow:execution-failed', onWorkflowFailed);
    });
    
    return eventStream;
  }
}