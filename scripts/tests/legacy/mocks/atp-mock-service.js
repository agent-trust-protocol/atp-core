#!/usr/bin/env node
/**
 * ATP™ Mock Service - Demonstrates Live Deployment
 * This simulates the ATP™ services running in staging
 */

import express from 'express';
import { createServer } from 'http';

const app = express();
app.use(express.json());

// CORS for all origins in staging
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Service configuration
const services = {
  identity: { port: 3001, name: 'ATP™ Identity Service' },
  vc: { port: 3002, name: 'ATP™ VC Service' },
  permission: { port: 3003, name: 'ATP™ Permission Service' },
  gateway: { port: 3000, name: 'ATP™ RPC Gateway' },
  audit: { port: 3005, name: 'ATP™ Audit Logger' },
  protocols: { port: 3006, name: 'ATP™ Protocol Integrations' }
};

// Mock data storage
const mockData = {
  identities: [
    {
      did: 'did:atp:staging:agent-001',
      publicKey: 'mock-public-key-001',
      trustLevel: 'VERIFIED',
      metadata: { name: 'Demo Agent 1', type: 'assistant' }
    },
    {
      did: 'did:atp:staging:agent-002', 
      publicKey: 'mock-public-key-002',
      trustLevel: 'BASIC',
      metadata: { name: 'Demo Agent 2', type: 'analyzer' }
    }
  ],
  auditEvents: [],
  credentials: [],
  permissions: []
};

// Start a service on a specific port
function startService(serviceKey, config) {
  const serviceApp = express();
  serviceApp.use(express.json());
  
  // Health endpoint
  serviceApp.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: config.name,
      version: '0.1.0',
      environment: 'staging',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Service-specific endpoints
  if (serviceKey === 'identity') {
    serviceApp.get('/identity', (req, res) => {
      res.json({
        success: true,
        data: mockData.identities,
        total: mockData.identities.length
      });
    });

    serviceApp.post('/identity/register', (req, res) => {
      const { publicKey, metadata } = req.body;
      const did = `did:atp:staging:agent-${Date.now()}`;
      
      const newIdentity = {
        did,
        publicKey: publicKey || `mock-key-${Date.now()}`,
        trustLevel: 'BASIC',
        metadata: metadata || { name: 'New Agent' }
      };
      
      mockData.identities.push(newIdentity);
      
      res.json({
        success: true,
        data: newIdentity
      });
    });

    serviceApp.get('/identity/:did', (req, res) => {
      const identity = mockData.identities.find(i => i.did === req.params.did);
      if (identity) {
        res.json({ success: true, data: identity });
      } else {
        res.status(404).json({ success: false, error: 'Identity not found' });
      }
    });

    serviceApp.post('/identity/:did/trust-level', (req, res) => {
      const { trustLevel } = req.body;
      const identity = mockData.identities.find(i => i.did === req.params.did);
      
      if (identity) {
        identity.trustLevel = trustLevel;
        res.json({ success: true, data: identity });
      } else {
        res.status(404).json({ success: false, error: 'Identity not found' });
      }
    });

    serviceApp.get('/identity/:did/trust-info', (req, res) => {
      const identity = mockData.identities.find(i => i.did === req.params.did);
      
      if (identity) {
        res.json({
          success: true,
          data: {
            did: identity.did,
            trustLevel: identity.trustLevel,
            capabilities: getTrustCapabilities(identity.trustLevel)
          }
        });
      } else {
        res.status(404).json({ success: false, error: 'Identity not found' });
      }
    });
  }

  if (serviceKey === 'gateway') {
    serviceApp.get('/services', (req, res) => {
      res.json({
        success: true,
        data: {
          identity: { status: 'healthy', url: 'http://localhost:3001' },
          vc: { status: 'healthy', url: 'http://localhost:3002' },
          permission: { status: 'healthy', url: 'http://localhost:3003' },
          audit: { status: 'healthy', url: 'http://localhost:3005' },
          protocols: { status: 'healthy', url: 'http://localhost:3006' }
        }
      });
    });

    serviceApp.post('/auth/challenge', (req, res) => {
      const { did } = req.body;
      if (!did) {
        return res.status(400).json({
          success: false,
          error: 'DID is required'
        });
      }

      res.json({
        success: true,
        challenge: `atp-challenge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });
    });

    serviceApp.get('/certificates/ca', (req, res) => {
      res.json({
        success: true,
        certificate: {
          issuer: 'did:atp:staging:ca',
          publicKey: 'mock-ca-public-key',
          trustLevel: 'ENTERPRISE',
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      });
    });

    serviceApp.get('/certificates/crl', (req, res) => {
      res.json({
        success: true,
        revocationList: {
          issuer: 'did:atp:staging:ca',
          revokedCertificates: [],
          lastUpdate: new Date().toISOString()
        }
      });
    });
  }

  if (serviceKey === 'audit') {
    serviceApp.get('/audit/events', (req, res) => {
      res.json({
        success: true,
        events: mockData.auditEvents,
        total: mockData.auditEvents.length
      });
    });

    serviceApp.post('/audit/log', (req, res) => {
      const event = {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...req.body,
        hash: `hash-${Math.random().toString(36).substr(2, 16)}`,
        signature: `sig-${Math.random().toString(36).substr(2, 16)}`
      };

      mockData.auditEvents.push(event);
      
      res.json({
        success: true,
        event
      });
    });
  }

  if (serviceKey === 'protocols') {
    serviceApp.get('/mcp/tools', (req, res) => {
      res.json({
        success: true,
        tools: [
          { name: 'file-reader', trustLevel: 'BASIC' },
          { name: 'web-search', trustLevel: 'VERIFIED' },
          { name: 'code-analyzer', trustLevel: 'PREMIUM' }
        ]
      });
    });

    serviceApp.get('/a2a/agents', (req, res) => {
      res.json({
        success: true,
        agents: mockData.identities.map(i => ({
          did: i.did,
          name: i.metadata.name,
          type: i.metadata.type,
          trustLevel: i.trustLevel
        }))
      });
    });
  }

  // Generic endpoints for other services
  serviceApp.get('/', (req, res) => {
    res.json({
      service: config.name,
      version: '0.1.0',
      environment: 'staging',
      status: 'running',
      endpoints: {
        health: '/health',
        docs: '/docs'
      }
    });
  });

  // Start the service
  const server = createServer(serviceApp);
  server.listen(config.port, () => {
    console.log(`✅ ${config.name} running on port ${config.port}`);
  });

  return server;
}

function getTrustCapabilities(trustLevel) {
  const capabilities = {
    UNTRUSTED: [],
    BASIC: ['read-public'],
    VERIFIED: ['read-public', 'read-protected', 'write-basic'],
    PREMIUM: ['read-public', 'read-protected', 'write-basic', 'write-advanced', 'execute-tools'],
    ENTERPRISE: ['*']
  };
  
  return capabilities[trustLevel] || capabilities.BASIC;
}

// Start all services
console.log('🚀 Starting ATP™ Mock Services...');
console.log('=================================');

const servers = Object.entries(services).map(([key, config]) => {
  return startService(key, config);
});

console.log('');
console.log('🎉 All ATP™ Services Started Successfully!');
console.log('');
console.log('📋 Service URLs:');
Object.entries(services).forEach(([key, config]) => {
  console.log(`• ${config.name}: http://localhost:${config.port}`);
});
console.log('');
console.log('🔍 Test endpoints:');
console.log('• Health: curl http://localhost:3001/health');
console.log('• Identities: curl http://localhost:3001/identity');
console.log('• Gateway: curl http://localhost:3000/services');
console.log('• Audit: curl http://localhost:3005/audit/events');
console.log('');
console.log('🏆 ATP™ Staging Environment is LIVE!');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 Shutting down ATP™ services...');
  servers.forEach(server => server.close());
  process.exit(0);
});

export default app;