const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3008;

// Root endpoint - API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'Agent Trust Protocol™ API Services',
    version: '1.0.0',
    status: 'running',
    port: PORT,
    documentation: 'Available endpoints are listed below',
    endpoints: {
      identity: {
        register: 'POST /api/identity/register',
        authenticate: 'POST /api/identity/authenticate'
      },
      permissions: {
        grant: 'POST /api/permissions/grant',
        list: 'GET /api/permissions/:agentId'
      },
      audit: {
        log: 'POST /api/audit/log',
        getLogs: 'GET /api/audit/logs/:agentId'
      },
      trust: {
        getScore: 'GET /api/trust/:agentId'
      },
      health: {
        check: 'GET /api/health'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Mock Identity Service endpoints
app.post('/api/identity/register', (req, res) => {
  res.json({ 
    success: true, 
    agentId: 'agent_' + Date.now(),
    did: 'did:atp:' + Math.random().toString(36).substr(2, 9)
  });
});

app.post('/api/identity/authenticate', (req, res) => {
  res.json({ 
    success: true, 
    token: 'mock_jwt_token_' + Date.now(),
    agentId: req.body.agentId 
  });
});

// Mock Permission Service endpoints
app.post('/api/permissions/grant', (req, res) => {
  res.json({ 
    success: true, 
    permissionId: 'perm_' + Date.now(),
    message: 'Permission granted successfully' 
  });
});

app.get('/api/permissions/:agentId', (req, res) => {
  res.json({ 
    permissions: [
      { resource: 'data', action: 'read', granted: true },
      { resource: 'api', action: 'call', granted: true }
    ]
  });
});

// Mock Audit Service endpoints
app.post('/api/audit/log', (req, res) => {
  res.json({ 
    success: true, 
    auditId: 'audit_' + Date.now(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/audit/logs/:agentId', (req, res) => {
  res.json({ 
    logs: [
      {
        id: 'audit_1',
        action: 'authentication',
        timestamp: new Date().toISOString(),
        status: 'success'
      }
    ]
  });
});

// Health check endpoints
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    services: {
      identity: 'running',
      permissions: 'running',
      audit: 'running'
    },
    timestamp: new Date().toISOString()
  });
});

// Mock Trust Score endpoint
app.get('/api/trust/:agentId', (req, res) => {
  res.json({
    agentId: req.params.agentId,
    trustScore: 0.95,
    reputation: 'excellent',
    verificationLevel: 'verified'
  });
});

app.listen(PORT, () => {
  console.log(`Mock ATP Services running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  - POST /api/identity/register`);
  console.log(`  - POST /api/identity/authenticate`);
  console.log(`  - POST /api/permissions/grant`);
  console.log(`  - GET  /api/permissions/:agentId`);
  console.log(`  - POST /api/audit/log`);
  console.log(`  - GET  /api/audit/logs/:agentId`);
  console.log(`  - GET  /api/trust/:agentId`);
  console.log(`  - GET  /api/health`);
});