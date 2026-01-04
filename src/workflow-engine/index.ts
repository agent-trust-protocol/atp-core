// Main entry point for the ATP Workflow Engine

// Core components
export { WorkflowEngine } from './core/WorkflowEngine';
export { NodeRegistry } from './core/NodeRegistry';

// Type definitions
export * from './types/WorkflowTypes';

// Database components
export { dbConnection, getDb, healthCheck } from './database/connection';
export { workflowRepository } from './database/repository';
export * as schema from './database/schema';

// API components
export { default as WorkflowApiServer } from './api/server';

// Services
export { WorkflowScheduler } from './services/WorkflowScheduler';
export { WorkflowEventService } from './services/WorkflowEventService';

// Integration
export { ATPIntegration } from './integration/ATPIntegration';

// State management
export { 
  useWorkflowStore,
  useWorkflow,
  useWorkflows,
  useActiveExecutions,
  useWorkflowStatistics,
  useExecutionHistory
} from './store/WorkflowStore';

// Configuration
export { 
  configManager,
  ConfigManager,
  type WorkflowConfig
} from './config/WorkflowConfig';

// Error handling
export {
  WorkflowErrorHandler,
  globalErrorHandler,
  ErrorSeverity,
  ErrorCategory,
  createValidationError,
  createExecutionError,
  createNetworkError,
  createDatabaseError,
  createConfigurationError,
  type WorkflowError,
  type ErrorHandlerConfig
} from './utils/ErrorHandler';

// ATP-specific nodes
export { policyNodeDefinitions } from './nodes/atp/PolicyNodes';
export { trustNodeDefinitions } from './nodes/atp/TrustNodes';
export { monitoringNodeDefinitions } from './nodes/atp/MonitoringNodes';

// Initialize function for easy setup
export async function initializeWorkflowEngine(config?: {
  databaseUrl?: string;
  apiPort?: number;
  enableScheduler?: boolean;
  enableEvents?: boolean;
  enableATPIntegration?: boolean;
}) {
  const { WorkflowEngine } = await import('./core/WorkflowEngine');
  const { NodeRegistry } = await import('./core/NodeRegistry');
  const { dbConnection } = await import('./database/connection');
  const { WorkflowScheduler } = await import('./services/WorkflowScheduler');
  const { WorkflowEventService } = await import('./services/WorkflowEventService');
  const { ATPIntegration } = await import('./integration/ATPIntegration');
  const { policyNodeDefinitions } = await import('./nodes/atp/PolicyNodes');
  const { trustNodeDefinitions } = await import('./nodes/atp/TrustNodes');
  const { monitoringNodeDefinitions } = await import('./nodes/atp/MonitoringNodes');

  try {
    console.log('Initializing ATP Workflow Engine...');

    // Initialize database
    if (config?.databaseUrl) {
      process.env.DATABASE_URL = config.databaseUrl;
    }
    dbConnection.initializeFromEnv();
    const isConnected = await dbConnection.testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
    console.log('✓ Database connection established');

    // Initialize node registry and register ATP nodes
    const nodeRegistry = new NodeRegistry();
    const allNodes = [
      ...policyNodeDefinitions,
      ...trustNodeDefinitions,
      ...monitoringNodeDefinitions
    ];
    nodeRegistry.registerBulkNodes(allNodes);
    console.log(`✓ Registered ${allNodes.length} ATP nodes`);

    // Initialize workflow engine
    const workflowEngine = new WorkflowEngine(nodeRegistry);
    console.log('✓ Workflow engine initialized');

    // Initialize services
    const services: any = {};

    if (config?.enableScheduler !== false) {
      services.scheduler = new WorkflowScheduler();
      await services.scheduler.initialize();
      console.log('✓ Workflow scheduler initialized');
    }

    if (config?.enableEvents !== false) {
      services.eventService = new WorkflowEventService();
      await services.eventService.initialize();
      console.log('✓ Event service initialized');
    }

    if (config?.enableATPIntegration !== false) {
      services.atpIntegration = new ATPIntegration(
        services.eventService,
        services.scheduler
      );
      await services.atpIntegration.initialize();
      console.log('✓ ATP integration initialized');
    }

    // Start API server if requested
    if (config?.apiPort) {
      const { default: WorkflowApiServer } = await import('./api/server');
      const apiServer = new WorkflowApiServer();
      await apiServer.start(config.apiPort);
      services.apiServer = apiServer;
      console.log(`✓ API server started on port ${config.apiPort}`);
    }

    console.log('🚀 ATP Workflow Engine initialization complete!');

    return {
      workflowEngine,
      nodeRegistry,
      ...services
    };

  } catch (error) {
    console.error('❌ Failed to initialize ATP Workflow Engine:', error);
    throw error;
  }
}

// Convenience function for creating a basic workflow
export function createWorkflow(options: {
  name: string;
  description?: string;
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    config?: any;
    position?: { x: number; y: number };
    isStartNode?: boolean;
  }>;
  edges: Array<{
    sourceNodeId: string;
    targetNodeId: string;
    condition?: any;
  }>;
}) {
  return {
    id: `workflow-${Date.now()}`,
    name: options.name,
    description: options.description || '',
    version: '1.0.0',
    nodes: options.nodes.map(node => ({
      id: node.id,
      type: node.type,
      label: node.label,
      config: node.config || {},
      position: node.position || { x: 0, y: 0 },
      isStartNode: node.isStartNode
    })),
    edges: options.edges.map((edge, index) => ({
      id: `edge-${index + 1}`,
      sourceNodeId: edge.sourceNodeId,
      targetNodeId: edge.targetNodeId,
      condition: edge.condition
    })),
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date()
    }
  };
}

// Export version
export const version = '1.0.0';