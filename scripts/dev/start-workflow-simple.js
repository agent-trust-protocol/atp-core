#!/usr/bin/env node

// ATP Workflow Engine - Simple Startup
// This provides a basic working workflow engine that can be enhanced
import express from 'express';
import cors from 'cors';

async function startSimpleWorkflowEngine() {
  try {
    console.log('🚀 Starting Simple ATP Workflow Engine...');
    
    const app = express();
    
    // Basic middleware
    app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      credentials: true
    }));
    
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Basic routes
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        engine: 'workflow-engine'
      });
    });
    
    app.get('/', (req, res) => {
      res.json({
        name: 'ATP Workflow Engine API',
        version: '1.0.0',
        endpoints: {
          health: '/health'
        }
      });
    });
    
    const port = 3005;
    const host = '127.0.0.1'; // Use localhost instead of 0.0.0.0
    const server = app.listen(port, host, () => {
      console.log('✅ Simple ATP Workflow Engine is running!');
      console.log(`📡 API: http://localhost:${port}`);
      console.log(`🏥 Health: http://localhost:${port}/health`);
      console.log(`🔗 Bound to: ${host}:${port}`);
    });
    
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use`);
      } else if (error.code === 'EACCES') {
        console.error(`❌ Permission denied for port ${port}`);
      } else {
        console.error(`❌ Server error:`, error);
      }
      process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down workflow engine...');
      server.close(() => {
        console.log('✅ Workflow engine stopped');
        process.exit(0);
      });
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down workflow engine...');
      server.close(() => {
        console.log('✅ Workflow engine stopped');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to start simple workflow engine:', error);
    process.exit(1);
  }
}

startSimpleWorkflowEngine();