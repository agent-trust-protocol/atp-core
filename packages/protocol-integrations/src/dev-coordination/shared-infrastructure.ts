/**
 * Shared Infrastructure - Core services for development coordination
 */

import { EventEmitter } from 'events';
import { AgentSpecialization } from './types';
import { WorkspaceManager } from './workspace-manager';
import { AgentCoordinator } from './agent-coordinator';
import { InterAgentMessagingSystem } from './inter-agent-messaging';
import { ProtocolRegistry } from './protocol-registry';

export interface CoordinationConfig {
  enableHealthChecking: boolean;
  healthCheckInterval: number;
  enableMetrics: boolean;
  metricsRetentionHours: number;
  enableConflictDetection: boolean;
  autoConflictResolution: boolean;
  messagingConfig: {
    queueSizeLimit: number;
    messageRetentionHours: number;
    enablePersistence: boolean;
  };
}

export interface SystemMetrics {
  uptime: number;
  activeAgents: number;
  messagesThroughput: number;
  protocolsActive: number;
  conflictsResolved: number;
  resourceLockRequests: number;
  averageResponseTime: number;
  errorRate: number;
}

export class SharedInfrastructure extends EventEmitter {
  private workspaceManager: WorkspaceManager;
  private agentCoordinator: AgentCoordinator;
  private messagingSystem: InterAgentMessagingSystem;
  private protocolRegistry: ProtocolRegistry;
  private config: CoordinationConfig;
  private startTime: number;
  private metrics: SystemMetrics;
  private metricsHistory: SystemMetrics[] = [];
  private isRunning: boolean = false;

  constructor(config: Partial<CoordinationConfig> = {}) {
    super();
    
    this.config = {
      enableHealthChecking: true,
      healthCheckInterval: 30000,
      enableMetrics: true,
      metricsRetentionHours: 24,
      enableConflictDetection: true,
      autoConflictResolution: false,
      messagingConfig: {
        queueSizeLimit: 1000,
        messageRetentionHours: 6,
        enablePersistence: false
      },
      ...config
    };

    this.startTime = Date.now();
    this.initializeMetrics();
    this.initializeComponents();
    this.setupEventHandlers();
  }

  private initializeMetrics(): void {
    this.metrics = {
      uptime: 0,
      activeAgents: 0,
      messagesThroughput: 0,
      protocolsActive: 0,
      conflictsResolved: 0,
      resourceLockRequests: 0,
      averageResponseTime: 0,
      errorRate: 0
    };
  }

  private initializeComponents(): void {
    // Initialize core components
    this.workspaceManager = new WorkspaceManager();
    this.protocolRegistry = new ProtocolRegistry();
    this.messagingSystem = new InterAgentMessagingSystem();
    this.agentCoordinator = new AgentCoordinator(this.workspaceManager);

    console.log('ATP Protocol Integration Development Coordination initialized');
    console.log('- Workspace Manager: Ready');
    console.log('- Protocol Registry: Ready');
    console.log('- Messaging System: Ready');
    console.log('- Agent Coordinator: Ready');
  }

  private setupEventHandlers(): void {
    // Workspace Manager events
    this.workspaceManager.on?.('resource-conflict', this.handleResourceConflict.bind(this));
    
    // Agent Coordinator events
    this.agentCoordinator.on('conflict-detected', this.handleConflictDetection.bind(this));
    this.agentCoordinator.on('agent-started', this.handleAgentStarted.bind(this));
    this.agentCoordinator.on('agent-stopped', this.handleAgentStopped.bind(this));
    
    // Messaging System events
    this.messagingSystem.on('message-sent', this.handleMessageSent.bind(this));
    this.messagingSystem.on('message-response', this.handleMessageResponse.bind(this));
    
    // Protocol Registry events - if it extends EventEmitter
    // this.protocolRegistry.on?.('protocol-registered', this.handleProtocolRegistered.bind(this));
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Coordination infrastructure already running');
    }

    try {
      console.log('Starting ATP Protocol Integration Development Coordination...');
      
      // Start metrics collection if enabled
      if (this.config.enableMetrics) {
        this.startMetricsCollection();
      }
      
      this.isRunning = true;
      console.log('Development coordination infrastructure started successfully');
      
      // Emit startup event
      this.emit('infrastructure-started', {
        timestamp: Date.now(),
        config: this.config
      });
      
    } catch (error) {
      console.error('Failed to start coordination infrastructure:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      console.log('Stopping ATP Protocol Integration Development Coordination...');
      
      // Clean up components
      this.protocolRegistry.cleanup();
      
      this.isRunning = false;
      console.log('Development coordination infrastructure stopped');
      
      // Emit shutdown event
      this.emit('infrastructure-stopped', {
        timestamp: Date.now(),
        uptime: Date.now() - this.startTime
      });
      
    } catch (error) {
      console.error('Error during shutdown:', error);
      throw error;
    }
  }

  // Component access methods
  getWorkspaceManager(): WorkspaceManager {
    return this.workspaceManager;
  }

  getAgentCoordinator(): AgentCoordinator {
    return this.agentCoordinator;
  }

  getMessagingSystem(): InterAgentMessagingSystem {
    return this.messagingSystem;
  }

  getProtocolRegistry(): ProtocolRegistry {
    return this.protocolRegistry;
  }

  // Agent lifecycle management
  async registerAgent(agentId: AgentSpecialization, capabilities?: any): Promise<void> {
    console.log(`Registering agent: ${agentId}`);
    
    // Register with coordinator
    this.agentCoordinator.registerAgent(agentId);
    
    // Set up default message handlers
    this.setupDefaultMessageHandlers(agentId);
    
    console.log(`Agent ${agentId} registered successfully`);
  }

  async unregisterAgent(agentId: AgentSpecialization): Promise<void> {
    console.log(`Unregistering agent: ${agentId}`);
    
    // Unregister from coordinator
    this.agentCoordinator.unregisterAgent(agentId);
    
    console.log(`Agent ${agentId} unregistered successfully`);
  }

  private setupDefaultMessageHandlers(agentId: AgentSpecialization): void {
    // Register default coordination message handlers
    this.messagingSystem.registerHandler(agentId, {
      messageType: 'coordination-request' as any,
      handler: async (message) => {
        console.log(`${agentId} received coordination request:`, message.payload);
        return {
          responseId: `resp-${Date.now()}`,
          originalMessageId: message.messageId,
          sourceAgent: message.targetAgent,
          targetAgent: message.sourceAgent,
          success: true,
          payload: { acknowledged: true },
          timestamp: Date.now()
        };
      },
      priority: 5
    });

    this.messagingSystem.registerHandler(agentId, {
      messageType: 'resource-lock-request' as any,
      handler: async (message) => {
        console.log(`${agentId} received resource lock request:`, message.payload);
        // Default: grant lock request (agents should override this)
        return {
          responseId: `resp-${Date.now()}`,
          originalMessageId: message.messageId,
          sourceAgent: message.targetAgent,
          targetAgent: message.sourceAgent,
          success: true,
          payload: { lockGranted: true, resourceId: message.payload.resourceId },
          timestamp: Date.now()
        };
      },
      priority: 8
    });

    this.messagingSystem.registerHandler(agentId, {
      messageType: 'dependency-ready' as any,
      handler: async (message) => {
        console.log(`${agentId} notified of ready dependency:`, message.payload);
        // No response needed for notifications
      },
      priority: 3
    });
  }

  // Event handlers
  private handleResourceConflict(event: any): void {
    console.warn('Resource conflict detected:', event);
    
    if (this.config.enableConflictDetection) {
      this.emit('conflict-detected', {
        type: 'resource-conflict',
        details: event,
        timestamp: Date.now()
      });
      
      if (this.config.autoConflictResolution) {
        this.attemptConflictResolution(event);
      }
    }
  }

  private handleConflictDetection(event: any): void {
    console.warn('Agent conflict detected:', event);
    this.metrics.conflictsResolved++;
  }

  private handleAgentStarted(event: any): void {
    console.log('Agent started:', event.sourceAgent);
    this.updateMetrics();
  }

  private handleAgentStopped(event: any): void {
    console.log('Agent stopped:', event.sourceAgent);
    this.updateMetrics();
  }

  private handleMessageSent(message: any): void {
    // Update message throughput metrics
    this.metrics.messagesThroughput++;
  }

  private handleMessageResponse(response: any): void {
    // Update response time metrics
    if (!response.success) {
      this.metrics.errorRate++;
    }
  }

  private attemptConflictResolution(conflict: any): void {
    // Basic conflict resolution strategies
    console.log('Attempting automatic conflict resolution for:', conflict);
    
    // Implementation depends on conflict type
    switch (conflict.type) {
      case 'resource-conflict':
        this.resolveResourceConflict(conflict);
        break;
      case 'integration-conflict':
        this.resolveIntegrationConflict(conflict);
        break;
      default:
        console.log('No automatic resolution available for conflict type:', conflict.type);
    }
  }

  private resolveResourceConflict(conflict: any): void {
    // Simple resolution: notify all conflicting agents
    console.log('Resolving resource conflict:', conflict);
    
    // This would typically involve more sophisticated logic
    this.emit('conflict-resolved', {
      type: 'resource-conflict',
      originalConflict: conflict,
      resolution: 'notification-sent',
      timestamp: Date.now()
    });
  }

  private resolveIntegrationConflict(conflict: any): void {
    console.log('Resolving integration conflict:', conflict);
    
    // This would involve coordination between agents
    this.emit('conflict-resolved', {
      type: 'integration-conflict', 
      originalConflict: conflict,
      resolution: 'coordination-requested',
      timestamp: Date.now()
    });
  }

  // Metrics and monitoring
  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateMetrics();
      this.collectMetricsSnapshot();
    }, 60000); // Every minute
  }

  private updateMetrics(): void {
    this.metrics.uptime = Date.now() - this.startTime;
    this.metrics.activeAgents = this.agentCoordinator.getCoordinationStatus().activeAgents.length;
    this.metrics.protocolsActive = this.protocolRegistry.getActiveProtocols().length;
    
    // Reset counters that accumulate over time
    // (These would typically be calculated as rates)
  }

  private collectMetricsSnapshot(): void {
    const snapshot = { ...this.metrics };
    this.metricsHistory.push(snapshot);
    
    // Trim history based on retention policy
    const retentionLimit = this.config.metricsRetentionHours * 60; // minutes
    if (this.metricsHistory.length > retentionLimit) {
      this.metricsHistory.splice(0, this.metricsHistory.length - retentionLimit);
    }
  }

  getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  getMetricsHistory(hours: number = 1): SystemMetrics[] {
    const limit = hours * 60; // Convert to minutes
    return this.metricsHistory.slice(-limit);
  }

  // System status and diagnostics
  getSystemStatus(): any {
    return {
      isRunning: this.isRunning,
      uptime: Date.now() - this.startTime,
      config: this.config,
      metrics: this.getMetrics(),
      components: {
        workspaceManager: this.workspaceManager.getWorkspaceSummary(),
        agentCoordinator: this.agentCoordinator.getCoordinationStatus(),
        messagingSystem: this.messagingSystem.getSystemStatus(),
        protocolRegistry: this.protocolRegistry.getRegistryStatus()
      }
    };
  }

  // Development workflow helpers
  async initializeAgentWorkspace(agentId: AgentSpecialization): Promise<any> {
    const workspace = this.workspaceManager.getWorkspace(agentId);
    if (!workspace) {
      throw new Error(`No workspace configuration found for agent: ${agentId}`);
    }

    console.log(`Initializing workspace for ${agentId}:`);
    console.log(`- Directory: ${workspace.workspaceDirectory}`);
    console.log(`- Protocols: ${workspace.protocols.join(', ')}`);
    console.log(`- Dependencies: ${workspace.dependencies.join(', ')}`);
    console.log(`- Shared Resources: ${workspace.sharedResources.length}`);

    return {
      workspace,
      developmentPlan: this.agentCoordinator.getDevelopmentPlan(),
      communicationPatterns: workspace.communicationPatterns
    };
  }

  generateAgentStartupScript(agentId: AgentSpecialization): string {
    const workspace = this.workspaceManager.getWorkspace(agentId);
    if (!workspace) {
      throw new Error(`No workspace found for agent: ${agentId}`);
    }

    return `
#!/bin/bash
# ATP Protocol Integration - ${workspace.name} Startup Script
# Auto-generated by Development Coordination Framework

echo "Starting ${workspace.name}..."
echo "Workspace: ${workspace.workspaceDirectory}"
echo "Protocols: ${workspace.protocols.join(', ')}"

# Register agent with coordination infrastructure
npm run register-agent -- --agent=${agentId}

# Start agent-specific services
npm run start:${agentId}

echo "${workspace.name} started successfully"
`;
  }
}