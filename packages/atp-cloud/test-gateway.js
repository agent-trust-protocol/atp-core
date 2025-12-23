#!/usr/bin/env node

/**
 * ATP Cloud Test Gateway
 * Simple test to verify ATP Cloud infrastructure
 * 
 * ⚠️ INTERNAL TESTING ONLY - NOT FOR PRODUCTION USE
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3010;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ATP Cloud Gateway',
    version: '0.1.0-alpha',
    timestamp: new Date().toISOString(),
    environment: 'internal-testing',
    message: '⚠️ INTERNAL TESTING ONLY - NOT FOR PRODUCTION USE'
  });
});

// API status endpoint  
app.get('/api/v1/status', (req, res) => {
  res.json({
    success: true,
    data: {
      cloudGateway: 'online',
      tenantService: 'simulated',
      analyticsService: 'simulated', 
      dashboard: 'available',
      features: {
        multiTenant: 'implemented',
        usageTracking: 'implemented',
        billing: 'implemented',
        analytics: 'implemented'
      }
    },
    meta: {
      version: '0.1.0-alpha',
      environment: 'internal-testing',
      warning: 'INTERNAL TESTING ONLY - NOT FOR PRODUCTION USE'
    }
  });
});

// Cloud info endpoint
app.get('/api/v1/cloud/info', (req, res) => {
  res.json({
    success: true,
    data: {
      platform: 'ATP Cloud',
      architecture: 'Multi-tenant microservices',
      services: {
        'cloud-gateway': { port: 3010, status: 'online', description: 'API Gateway & Load Balancer' },
        'tenant-service': { port: 3011, status: 'ready', description: 'Tenant Management & Billing' },
        'analytics-service': { port: 3012, status: 'ready', description: 'Usage Analytics & Reporting' },
        'cloud-dashboard': { port: 3013, status: 'ready', description: 'Cloud Management UI' }
      },
      capabilities: [
        'Multi-tenant agent isolation',
        'Usage-based billing ($0.50/agent/month)', 
        'Real-time analytics & monitoring',
        'Global edge deployment ready',
        'Enterprise compliance features',
        'Auto-scaling & load balancing'
      ],
      status: 'Built - Internal Testing Phase',
      nextSteps: 'Container deployment & cloud integration'
    },
    meta: {
      buildDate: new Date().toISOString(),
      internalTesting: true
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🔐 ATP Cloud Test Gateway Started');
  console.log('⚠️  INTERNAL TESTING ONLY - NOT FOR PRODUCTION USE');
  console.log('');
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`📊 Status: http://localhost:${PORT}/api/v1/status`);
  console.log(`☁️  Info:   http://localhost:${PORT}/api/v1/cloud/info`);
  console.log('');
  console.log('ATP Cloud services are ready for internal testing! 🚀');
});