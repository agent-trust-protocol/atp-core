/**
 * Development Coordination Server
 * Main entry point for ATP Protocol Integration development coordination
 */

import express from 'express';
import cors from 'cors';
import { SharedInfrastructure } from './shared-infrastructure';
import { AgentSpecialization } from './types';
import { SupportedProtocol } from '../federation/types';

const app = express();
const port = process.env.COORD_PORT || 3009;

app.use(cors());
app.use(express.json());

// Initialize coordination infrastructure
const coordination = new SharedInfrastructure({
  enableHealthChecking: true,
  enableMetrics: true,
  enableConflictDetection: true,
  autoConflictResolution: false // Manual resolution for development
});

// API Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'atp-protocol-integration-coordination',
    version: '0.1.0',
    uptime: Date.now() - coordination['startTime'],
    infrastructure: coordination.getSystemStatus()
  });
});

// Agent management routes
app.post('/agents/register', async (req, res) => {
  try {
    const { agentId, capabilities } = req.body;
    
    if (!Object.values(AgentSpecialization).includes(agentId)) {
      return res.status(400).json({
        success: false,
        error: `Invalid agent ID: ${agentId}. Must be one of: ${Object.values(AgentSpecialization).join(', ')}`
      });
    }
    
    await coordination.registerAgent(agentId, capabilities);
    const workspace = await coordination.initializeAgentWorkspace(agentId);
    
    res.json({
      success: true,
      data: {
        agentId,
        workspace: workspace.workspace,
        developmentPlan: workspace.developmentPlan,
        startupScript: coordination.generateAgentStartupScript(agentId)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.delete('/agents/:agentId', async (req, res) => {
  try {
    const agentId = req.params.agentId as AgentSpecialization;
    await coordination.unregisterAgent(agentId);
    
    res.json({
      success: true,
      message: `Agent ${agentId} unregistered successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Workspace management routes
app.get('/workspaces', (req, res) => {
  const workspaceManager = coordination.getWorkspaceManager();
  const workspaces = workspaceManager.getAllWorkspaces();
  
  res.json({
    success: true,
    data: workspaces.map(ws => ({
      agentId: ws.agentId,
      name: ws.name,
      description: ws.description,
      protocols: ws.protocols,
      workspaceDirectory: ws.workspaceDirectory,
      dependencies: ws.dependencies,
      sharedResourceCount: ws.sharedResources.length,
      conflictBoundaryCount: ws.conflictBoundaries.length
    }))
  });
});

app.get('/workspaces/:agentId', (req, res) => {
  try {
    const agentId = req.params.agentId as AgentSpecialization;
    const workspaceManager = coordination.getWorkspaceManager();
    const workspace = workspaceManager.getWorkspace(agentId);
    
    if (!workspace) {
      return res.status(404).json({
        success: false,
        error: `Workspace not found for agent: ${agentId}`
      });
    }
    
    res.json({
      success: true,
      data: workspace
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Protocol registry routes
app.get('/protocols', (req, res) => {
  const protocolRegistry = coordination.getProtocolRegistry();
  const status = protocolRegistry.getRegistryStatus();
  
  res.json({
    success: true,
    data: status
  });
});

app.get('/protocols/bridges', (req, res) => {
  const protocolRegistry = coordination.getProtocolRegistry();
  const bridges = protocolRegistry.getAllBridgeConfigurations();
  
  res.json({
    success: true,
    data: bridges.map(bridge => ({
      bridgeId: bridge.bridgeId,
      name: bridge.name,
      sourceProtocol: bridge.sourceProtocol,
      targetProtocol: bridge.targetProtocol,
      transformationRules: bridge.transformationRules.length,
      securityPolicy: bridge.securityPolicy,
      qosPolicy: bridge.qosPolicy
    }))
  });
});

// Coordination and messaging routes
app.get('/coordination/status', (req, res) => {
  const coordinator = coordination.getAgentCoordinator();
  const status = coordinator.getCoordinationStatus();
  
  res.json({
    success: true,
    data: status
  });
});

app.get('/coordination/plan', (req, res) => {
  const coordinator = coordination.getAgentCoordinator();
  const plan = coordinator.getDevelopmentPlan();
  
  res.json({
    success: true,
    data: plan
  });
});

app.get('/coordination/events', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const coordinator = coordination.getAgentCoordinator();
  const events = coordinator.getEventHistory(limit);
  
  res.json({
    success: true,
    data: events
  });
});

app.get('/messaging/status', (req, res) => {
  const messaging = coordination.getMessagingSystem();
  const status = messaging.getSystemStatus();
  
  res.json({
    success: true,
    data: status
  });
});

app.get('/messaging/stats', (req, res) => {
  const messaging = coordination.getMessagingSystem();
  const stats = messaging.getCommunicationStats();
  
  res.json({
    success: true,
    data: stats
  });
});

app.get('/messaging/history', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const messaging = coordination.getMessagingSystem();
  const history = messaging.getMessageHistory(limit);
  
  res.json({
    success: true,
    data: history
  });
});

// System metrics routes
app.get('/metrics', (req, res) => {
  const metrics = coordination.getMetrics();
  
  res.json({
    success: true,
    data: metrics
  });
});

app.get('/metrics/history', (req, res) => {
  const hours = parseInt(req.query.hours as string) || 1;
  const history = coordination.getMetricsHistory(hours);
  
  res.json({
    success: true,
    data: history
  });
});

// Development workflow routes
app.get('/workflow/agents/:agentId/startup-script', (req, res) => {
  try {
    const agentId = req.params.agentId as AgentSpecialization;
    const script = coordination.generateAgentStartupScript(agentId);
    
    res.setHeader('Content-Type', 'text/plain');
    res.send(script);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/workflow/dependencies/:agentId', (req, res) => {
  try {
    const agentId = req.params.agentId as AgentSpecialization;
    const workspaceManager = coordination.getWorkspaceManager();
    const dependencies = workspaceManager.getAgentDependencies(agentId);
    const dependents = workspaceManager.getDependentAgents(agentId);
    
    res.json({
      success: true,
      data: {
        agentId,
        dependencies,
        dependents,
        dependencyTree: {
          requires: dependencies,
          enablesAgents: dependents
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// System control routes
app.post('/system/start', async (req, res) => {
  try {
    await coordination.start();
    res.json({
      success: true,
      message: 'Coordination infrastructure started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/system/stop', async (req, res) => {
  try {
    await coordination.stop();
    res.json({
      success: true,
      message: 'Coordination infrastructure stopped'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Start the coordination server
async function startServer() {
  try {
    console.log('ATP Protocol Integration Development Coordination');
    console.log('=================================================');
    
    // Start coordination infrastructure
    await coordination.start();
    
    // Start HTTP server
    app.listen(port, () => {
      console.log(`\n🚀 Coordination Server running on port ${port}`);
      console.log(`\n📊 Dashboard: http://localhost:${port}/health`);
      console.log('\n🔧 Available Endpoints:');
      console.log('   • Agents: /agents/*');
      console.log('   • Workspaces: /workspaces/*');
      console.log('   • Protocols: /protocols/*');
      console.log('   • Coordination: /coordination/*');
      console.log('   • Messaging: /messaging/*');
      console.log('   • Metrics: /metrics/*');
      console.log('   • Workflow: /workflow/*');
      console.log('\n🤖 Ready for agent registration!');
      console.log('\nSupported Agents:');
      Object.values(AgentSpecialization).forEach(agent => {
        const workspace = coordination.getWorkspaceManager().getWorkspace(agent);
        console.log(`   • ${agent}: ${workspace?.name || 'Unknown'}`);
      });
    });
    
  } catch (error) {
    console.error('Failed to start coordination server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down coordination server...');
  try {
    await coordination.stop();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  try {
    await coordination.stop();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

export { app, coordination };