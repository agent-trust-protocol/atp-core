#!/usr/bin/env node

// Start the ATP Workflow Engine
import { configManager } from './src/workflow-engine/config/WorkflowConfig.ts';
import WorkflowApiServer from './src/workflow-engine/api/server.ts';

async function startWorkflowEngine() {
  try {
    console.log('🚀 Starting ATP Workflow Engine...');
    
    // Load configuration
    const config = configManager.get();
    console.log(`📊 Environment: ${config.environment}`);
    console.log(`🗄️  Database: ${config.database.host}:${config.database.port}/${config.database.database}`);
    console.log(`🌐 API Port: ${config.api.port}`);
    
    // Start the API server
    const server = new WorkflowApiServer();
    await server.start(config.api.port);
    
    console.log('✅ ATP Workflow Engine is running!');
    console.log(`📡 API: http://localhost:${config.api.port}`);
    console.log(`🏥 Health: http://localhost:${config.api.port}/health`);
    console.log(`📚 Workflows: http://localhost:${config.api.port}/api/workflows`);
    
  } catch (error) {
    console.error('❌ Failed to start workflow engine:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down workflow engine...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down workflow engine...');
  process.exit(0);
});

startWorkflowEngine();