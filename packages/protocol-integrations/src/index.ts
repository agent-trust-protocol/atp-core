import express from 'express';
import cors from 'cors';
import { ATPMCPServer } from './mcp/server.js';
import { EXAMPLE_TOOLS } from './mcp/example-tools.js';
import { ATPMCPServerConfig } from './types/mcp.js';
import { A2ABridge } from './a2a/bridge.js';

const app = express();
const port = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());

// ATP™ MCP Server Configuration
const mcpConfig: ATPMCPServerConfig = {
  name: 'ATP™ MCP Integration Server',
  version: '0.1.0',
  description: 'Agent Trust Protocol™ enhanced Model Context Protocol server',
  capabilities: {
    tools: { listChanged: true },
    resources: { subscribe: false, listChanged: false },
    prompts: { listChanged: false },
    logging: { level: 'info' },
  },
  atpConfig: {
    serverDID: 'did:atp:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH', // Example DID
    trustLevel: 'verified',
    supportedAuthMethods: ['did-signature', 'did-jwt', 'mtls'],
    auditEndpoint: 'http://localhost:3005/audit/log',
    rateLimits: {
      globalRequestsPerMinute: 1000,
      perClientRequestsPerMinute: 100,
    },
  },
};

// Initialize MCP Server
const mcpServer = new ATPMCPServer(mcpConfig);

// Register example tools
EXAMPLE_TOOLS.forEach(tool => {
  mcpServer.registerTool(tool);
});

// Initialize A2A Bridge
const a2aBridge = new A2ABridge();

// HTTP API endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'protocol-integrations',
    version: '0.1.0',
    protocol: 'Agent Trust Protocol™',
    integrations: {
      mcp: {
        enabled: true,
        tools: EXAMPLE_TOOLS.length,
        server: mcpConfig.name,
      },
      a2a: {
        enabled: true,
        status: 'active',
        endpoint: 'http://localhost:3008',
      },
    },
    timestamp: Date.now(),
  });
});

app.get('/mcp/tools', (req, res) => {
  res.json({
    success: true,
    tools: EXAMPLE_TOOLS.map(tool => ({
      name: tool.name,
      description: tool.description,
      trustLevelRequired: tool.trustLevelRequired,
      capabilities: tool.capabilities,
      auditRequired: tool.auditRequired,
    })),
  });
});

// Start HTTP server
app.listen(port, () => {
  console.log(`Agent Trust Protocol™ - Protocol Integrations v0.1.0`);
  console.log(`HTTP server running on port ${port}`);
});

// Start MCP server
mcpServer.start(3007).then(() => {
  console.log('ATP™ MCP Server started successfully');
  console.log(`Tools registered: ${EXAMPLE_TOOLS.length}`);
  console.log('WebSocket endpoint: ws://localhost:3007');
}).catch(error => {
  console.error('Failed to start MCP server:', error);
});

// Start A2A Bridge
a2aBridge.start(3008).then(() => {
  console.log('ATP™ A2A Bridge started successfully');
  console.log('A2A endpoints: http://localhost:3008/a2a/*');
}).catch(error => {
  console.error('Failed to start A2A bridge:', error);
});

export { ATPMCPServer, ATPMCPAdapter } from './mcp/index.js';
export { A2ABridge, A2ADiscoveryService, A2ACommunicationService } from './a2a/index.js';
export { EXAMPLE_TOOLS } from './mcp/example-tools.js';