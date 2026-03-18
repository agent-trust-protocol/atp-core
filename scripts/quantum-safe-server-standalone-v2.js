#!/usr/bin/env node

/**
 * Standalone Quantum-Safe MCP Server for Testing (v2)
 * World's First Quantum-Safe AI Agent Protocol Implementation
 * Simplified version for testing and demonstrations
 */

import { BaseQuantumSafeMCPServer } from './quantum-safe-base-server.js';

class StandaloneQuantumSafeMCPServer extends BaseQuantumSafeMCPServer {
  constructor(options = {}) {
    super(options);
    
    // Override host to listen on all interfaces for demo purposes
    this.host = '0.0.0.0';
    
    // Simplified tool set for demos
    this.tools.clear();
    this.setupSimplifiedTools();
    
    // Start the server
    this.startServer();
  }
  
  setupSimplifiedTools() {
    // Add only the basic demo tools
    this.tools.set('weather_info', {
      name: 'weather_info',
      description: 'Get weather information for a location',
      inputSchema: {
        type: 'object',
        properties: {
          location: { type: 'string' },
          units: { type: 'string', enum: ['celsius', 'fahrenheit'] }
        },
        required: ['location']
      },
      trustLevelRequired: 'basic',
      capabilities: ['read'],
      rateLimits: { requestsPerMinute: 60 }
    });

    this.tools.set('atp_identity_lookup', {
      name: 'atp_identity_lookup',
      description: 'Look up ATP agent identity information',
      inputSchema: {
        type: 'object',
        properties: {
          did: { type: 'string', pattern: '^did:atp:[a-zA-Z0-9-_]+$' }
        },
        required: ['did']
      },
      trustLevelRequired: 'verified',
      capabilities: ['read'],
      rateLimits: { requestsPerMinute: 30 }
    });
  }
  
  // Override handleHttpRequest to add demo endpoints
  handleHttpRequest(req, res) {
    // First check if the parent class can handle this request
    if (req.url === '/health') {
      return super.handleHttpRequest(req, res);
    }
    
    // Add demo-specific endpoints
    if (req.url === '/demo' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <head>
            <title>ATP Quantum-Safe Demo</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              h1 { color: #2c3e50; }
              pre { background: #f8f9fa; padding: 10px; border-radius: 5px; }
              .badge { background: #3498db; color: white; padding: 3px 8px; border-radius: 3px; font-size: 12px; }
            </style>
          </head>
          <body>
            <h1>🛡️ ATP Quantum-Safe MCP Demo</h1>
            <p><span class="badge">WORLD'S FIRST</span> Quantum-Safe AI Agent Protocol</p>
            <p>This server is running on port ${this.port} and ready for WebSocket connections.</p>
            <h2>Connection Details</h2>
            <pre>WebSocket URL: ws://${req.headers.host}</pre>
            <h2>Available Tools</h2>
            <ul>
              ${Array.from(this.tools.values()).map(tool => `
                <li>
                  <strong>${tool.name}</strong> - ${tool.description}<br>
                  <small>Trust Level: ${tool.trustLevelRequired}</small>
                </li>
              `).join('')}
            </ul>
            <h2>Try It Out</h2>
            <p>Run the following command to test the connection:</p>
            <pre>node claude-atp-client.js</pre>
          </body>
        </html>
      `);
      return;
    }
    
    // For other requests, return 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
  
  // Simplified executeToolSimulation for demos
  executeToolSimulation(toolName, args) {
    switch (toolName) {
      case 'weather_info':
        return {
          location: args.location || 'Unknown',
          temperature: Math.floor(Math.random() * 30) + 10,
          units: args.units || 'celsius',
          condition: 'Sunny',
          quantumSafeVerified: true,
          timestamp: new Date().toISOString()
        };
        
      case 'atp_identity_lookup':
        return {
          did: args.did,
          trustLevel: 'verified',
          status: 'active',
          quantumSafeSignature: true,
          lastSeen: new Date().toISOString(),
          capabilities: ['weather-current', 'identity-lookup']
        };
        
      default:
        return { error: 'Tool not available in demo mode' };
    }
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new StandaloneQuantumSafeMCPServer({
    port: process.env.PORT || 3008
  });
  console.log('🔄 Demo server is running and waiting for connections...');
}

export { StandaloneQuantumSafeMCPServer };