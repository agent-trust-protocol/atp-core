/**
 * Agent Coordinator - Manages inter-agent coordination and task orchestration
 */

import { EventEmitter } from 'events';
import { 
  AgentSpecialization, 
  CoordinationEvent, 
  CoordinationEventType,
  ProgressTracker,
  DevelopmentPhase,
  InterAgentMessageType,
  EventPriority
} from './types';
import { WorkspaceManager } from './workspace-manager';

export class AgentCoordinator extends EventEmitter {
  private workspaceManager: WorkspaceManager;
  private activeAgents: Set<AgentSpecialization> = new Set();
  private progressTrackers: Map<AgentSpecialization, ProgressTracker> = new Map();
  private developmentPhases: Map<string, DevelopmentPhase> = new Map();
  private eventHistory: CoordinationEvent[] = [];
  private messageHandlers: Map<InterAgentMessageType, Function[]> = new Map();

  constructor(workspaceManager: WorkspaceManager) {
    super();
    this.workspaceManager = workspaceManager;
    this.initializeDevelopmentPhases();
    this.setupEventHandlers();
  }

  private initializeDevelopmentPhases(): void {
    // Phase 1: Foundation Setup (Parallel)
    const foundationPhase: DevelopmentPhase = {
      phaseId: 'foundation',
      name: 'Foundation Setup',
      description: 'Set up basic infrastructure and type definitions',
      prerequisites: [],
      deliverables: [
        {
          deliverableId: 'mcp-types',
          name: 'MCP Type Definitions',
          type: 'type-definitions' as any,
          owner: AgentSpecialization.MCP_AGENT,
          dependencies: [],
          testRequirements: [],
          integrationPoints: []
        },
        {
          deliverableId: 'a2a-types',
          name: 'A2A Type Definitions', 
          type: 'type-definitions' as any,
          owner: AgentSpecialization.A2A_AGENT,
          dependencies: [],
          testRequirements: [],
          integrationPoints: []
        },
        {
          deliverableId: 'enterprise-types',
          name: 'Enterprise Protocol Types',
          type: 'type-definitions' as any,
          owner: AgentSpecialization.ENTERPRISE_AGENT,
          dependencies: [],
          testRequirements: [],
          integrationPoints: []
        },
        {
          deliverableId: 'federation-core',
          name: 'Federation Engine Core',
          type: 'federation-engine' as any,
          owner: AgentSpecialization.ANP_AGENT,
          dependencies: [],
          testRequirements: [],
          integrationPoints: []
        }
      ],
      dependencies: [],
      estimatedDuration: 16, // 2 days parallel work
      parallelizable: true
    };

    // Phase 2: Protocol Implementation (Dependent on Foundation)
    const protocolPhase: DevelopmentPhase = {
      phaseId: 'protocol-impl',
      name: 'Protocol Implementation',
      description: 'Implement core protocol adapters and bridges',
      prerequisites: ['foundation'],
      deliverables: [
        {
          deliverableId: 'mcp-adapter',
          name: 'MCP Protocol Adapter',
          type: 'protocol-adapter' as any,
          owner: AgentSpecialization.MCP_AGENT,
          dependencies: ['federation-core', 'mcp-types'],
          testRequirements: [],
          integrationPoints: []
        },
        {
          deliverableId: 'a2a-bridge',
          name: 'A2A Trust Bridge',
          type: 'bridge-implementation' as any,
          owner: AgentSpecialization.A2A_AGENT,
          dependencies: ['federation-core', 'a2a-types'],
          testRequirements: [],
          integrationPoints: []
        },
        {
          deliverableId: 'acp-bridge',
          name: 'ACP Enterprise Bridge',
          type: 'bridge-implementation' as any,
          owner: AgentSpecialization.ENTERPRISE_AGENT,
          dependencies: ['federation-core', 'enterprise-types'],
          testRequirements: [],
          integrationPoints: []
        },
        {
          deliverableId: 'agp-bridge', 
          name: 'AGP Enterprise Bridge',
          type: 'bridge-implementation' as any,
          owner: AgentSpecialization.ENTERPRISE_AGENT,
          dependencies: ['federation-core', 'enterprise-types'],
          testRequirements: [],
          integrationPoints: []
        }
      ],
      dependencies: [{ dependsOn: 'foundation', dependencyType: 'blocks' as any, criticalPath: true }],
      estimatedDuration: 32, // 4 days parallel work
      parallelizable: true
    };

    // Phase 3: Security Integration (Dependent on Protocol Implementation)
    const securityPhase: DevelopmentPhase = {
      phaseId: 'security-integration',
      name: 'Security Integration',
      description: 'Add security wrappers and authentication layers',
      prerequisites: ['protocol-impl'],
      deliverables: [
        {
          deliverableId: 'mcp-security',
          name: 'MCP Security Wrapper',
          type: 'security-wrapper' as any,
          owner: AgentSpecialization.MCP_AGENT,
          dependencies: ['mcp-adapter'],
          testRequirements: [],
          integrationPoints: []
        },
        {
          deliverableId: 'a2a-security',
          name: 'A2A Security Integration',
          type: 'security-wrapper' as any,
          owner: AgentSpecialization.A2A_AGENT,
          dependencies: ['a2a-bridge'],
          testRequirements: [],
          integrationPoints: []
        },
        {
          deliverableId: 'enterprise-security',
          name: 'Enterprise Security Layer',
          type: 'security-wrapper' as any,
          owner: AgentSpecialization.ENTERPRISE_AGENT,
          dependencies: ['acp-bridge', 'agp-bridge'],
          testRequirements: [],
          integrationPoints: []
        }
      ],
      dependencies: [{ dependsOn: 'protocol-impl', dependencyType: 'blocks' as any, criticalPath: true }],
      estimatedDuration: 24, // 3 days parallel work
      parallelizable: true
    };

    // Phase 4: Integration Testing (Dependent on Security)
    const integrationPhase: DevelopmentPhase = {
      phaseId: 'integration-testing',
      name: 'Integration Testing',
      description: 'Cross-protocol integration and end-to-end testing',
      prerequisites: ['security-integration'],
      deliverables: [
        {
          deliverableId: 'integration-tests',
          name: 'Cross-Protocol Integration Tests',
          type: 'test-suite' as any,
          owner: AgentSpecialization.ANP_AGENT,
          dependencies: ['mcp-security', 'a2a-security', 'enterprise-security'],
          testRequirements: [],
          integrationPoints: []
        }
      ],
      dependencies: [{ dependsOn: 'security-integration', dependencyType: 'blocks' as any, criticalPath: true }],
      estimatedDuration: 16, // 2 days coordinated testing
      parallelizable: false
    };

    this.developmentPhases.set('foundation', foundationPhase);
    this.developmentPhases.set('protocol-impl', protocolPhase);
    this.developmentPhases.set('security-integration', securityPhase);
    this.developmentPhases.set('integration-testing', integrationPhase);
  }

  private setupEventHandlers(): void {
    this.on('agent-started', this.handleAgentStarted.bind(this));
    this.on('agent-stopped', this.handleAgentStopped.bind(this));
    this.on('phase-completed', this.handlePhaseCompleted.bind(this));
    this.on('deliverable-ready', this.handleDeliverableReady.bind(this));
    this.on('conflict-detected', this.handleConflictDetected.bind(this));
  }

  registerAgent(agentId: AgentSpecialization): void {
    this.activeAgents.add(agentId);
    
    const progressTracker: ProgressTracker = {
      trackerId: `${agentId}-tracker`,
      agentId,
      currentPhase: 'foundation',
      completedDeliverables: [],
      blockedTasks: [],
      metrics: {
        completionPercentage: 0,
        velocityTrend: [],
        qualityMetrics: [],
        riskIndicators: []
      },
      lastUpdate: Date.now()
    };
    
    this.progressTrackers.set(agentId, progressTracker);
    
    this.emitCoordinationEvent({
      eventType: CoordinationEventType.AGENT_STARTED,
      sourceAgent: agentId,
      payload: { agentId, workspace: this.workspaceManager.getWorkspace(agentId) }
    });
  }

  unregisterAgent(agentId: AgentSpecialization): void {
    this.activeAgents.delete(agentId);
    this.progressTrackers.delete(agentId);
    
    this.emitCoordinationEvent({
      eventType: CoordinationEventType.AGENT_STOPPED,
      sourceAgent: agentId,
      payload: { agentId }
    });
  }

  requestResource(agentId: AgentSpecialization, resourceId: string, operation: 'read' | 'write'): boolean {
    // Validate access permissions
    const hasAccess = this.workspaceManager.validateWorkspaceAccess(agentId, resourceId, operation);
    
    if (!hasAccess) {
      this.emitCoordinationEvent({
        eventType: CoordinationEventType.CONFLICT_DETECTED,
        sourceAgent: agentId,
        payload: { 
          type: 'access-denied',
          resourceId,
          operation,
          reason: 'Insufficient permissions'
        },
        priority: EventPriority.HIGH
      });
      return false;
    }

    // For coordinated-write resources, check if other agents are writing
    const resource = this.workspaceManager.getSharedResource(resourceId);
    if (resource?.accessLevel === 'coordinated-write' && operation === 'write') {
      // Implement coordination logic here
      this.coordinateResourceAccess(agentId, resourceId, operation);
    }

    return true;
  }

  private coordinateResourceAccess(agentId: AgentSpecialization, resourceId: string, operation: string): void {
    // Send coordination request to other agents that might conflict
    const workspace = this.workspaceManager.getWorkspace(agentId);
    if (!workspace) return;

    for (const otherAgentId of this.activeAgents) {
      if (otherAgentId === agentId) continue;
      
      const otherWorkspace = this.workspaceManager.getWorkspace(otherAgentId);
      if (otherWorkspace?.sharedResources.some(r => r.resourceId === resourceId)) {
        this.sendInterAgentMessage({
          sourceAgent: agentId,
          targetAgent: otherAgentId,
          messageType: InterAgentMessageType.COORDINATION_REQUEST,
          payload: { resourceId, operation, requestor: agentId }
        });
      }
    }
  }

  private sendInterAgentMessage(message: any): void {
    this.emitCoordinationEvent({
      eventType: CoordinationEventType.INTEGRATION_REQUEST,
      sourceAgent: message.sourceAgent,
      targetAgent: message.targetAgent,
      payload: message,
      priority: EventPriority.NORMAL
    });
  }

  markDeliverableComplete(agentId: AgentSpecialization, deliverableId: string): void {
    const tracker = this.progressTrackers.get(agentId);
    if (!tracker) return;

    tracker.completedDeliverables.push(deliverableId);
    tracker.lastUpdate = Date.now();
    
    this.emitCoordinationEvent({
      eventType: CoordinationEventType.DELIVERABLE_READY,
      sourceAgent: agentId,
      payload: { deliverableId, agentId }
    });

    // Check if this enables other agents to proceed
    this.checkDependencyResolution(deliverableId);
  }

  private checkDependencyResolution(completedDeliverable: string): void {
    // Check all phases for deliverables that depend on this one
    for (const phase of this.developmentPhases.values()) {
      for (const deliverable of phase.deliverables) {
        if (deliverable.dependencies.includes(completedDeliverable)) {
          // Notify the owner agent that dependency is ready
          this.emitCoordinationEvent({
            eventType: CoordinationEventType.DEPENDENCY_READY,
            sourceAgent: AgentSpecialization.ANP_AGENT, // Coordinator
            targetAgent: deliverable.owner,
            payload: { 
              deliverableId: deliverable.deliverableId,
              readyDependency: completedDeliverable
            }
          });
        }
      }
    }
  }

  private emitCoordinationEvent(eventData: Partial<CoordinationEvent>): void {
    const event: CoordinationEvent = {
      eventId: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      priority: EventPriority.NORMAL,
      requiresResponse: false,
      ...eventData
    } as CoordinationEvent;

    this.eventHistory.push(event);
    this.emit(event.eventType, event);

    // Limit event history size
    if (this.eventHistory.length > 1000) {
      this.eventHistory.splice(0, 500);
    }
  }

  private handleAgentStarted(event: CoordinationEvent): void {
    console.log(`Agent ${event.sourceAgent} started and registered`);
  }

  private handleAgentStopped(event: CoordinationEvent): void {
    console.log(`Agent ${event.sourceAgent} stopped and unregistered`);
  }

  private handlePhaseCompleted(event: CoordinationEvent): void {
    console.log(`Phase completed by ${event.sourceAgent}:`, event.payload);
  }

  private handleDeliverableReady(event: CoordinationEvent): void {
    console.log(`Deliverable ready from ${event.sourceAgent}:`, event.payload.deliverableId);
  }

  private handleConflictDetected(event: CoordinationEvent): void {
    console.warn(`Conflict detected from ${event.sourceAgent}:`, event.payload);
    // Implement conflict resolution logic
  }

  getCoordinationStatus(): any {
    return {
      activeAgents: Array.from(this.activeAgents),
      totalEvents: this.eventHistory.length,
      phases: Array.from(this.developmentPhases.keys()),
      progressSummary: Array.from(this.progressTrackers.entries()).map(([agentId, tracker]) => ({
        agentId,
        currentPhase: tracker.currentPhase,
        completedDeliverables: tracker.completedDeliverables.length,
        completionPercentage: tracker.metrics.completionPercentage,
        blockedTasks: tracker.blockedTasks.length
      }))
    };
  }

  getDevelopmentPlan(): DevelopmentPhase[] {
    return Array.from(this.developmentPhases.values());
  }

  getEventHistory(limit: number = 50): CoordinationEvent[] {
    return this.eventHistory.slice(-limit);
  }
}