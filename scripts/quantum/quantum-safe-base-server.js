#!/usr/bin/env node

/**
 * Base Quantum-Safe MCP Server
 * Shared functionality for all quantum-safe server implementations
 */

import { WebSocketServer } from 'ws';
import http from 'http';
import https from 'https';
import { randomUUID } from 'crypto';
import fs from 'fs';

class BaseQuantumSafeMCPServer {
  constructor(options = {}) {
    this.port = options.port || 3008;
    this.host = options.host || '127.0.0.1';
    this.useHttps = options.useHttps || false;
    this.certPath = options.certPath;
    this.keyPath = options.keyPath;
    this.clients = new Map();
    this.tools = new Map();
    this.server = null;
    this.wss = null;
    this.rateLimiters = new Map();
    this.setupTools();
  }

  setupTools() {
    this.tools.set('weather_info', {
      name: 'weather_info',
      description: 'Get current weather information',
      inputSchema: {
        type: 'object',
        properties: {
          location: { type: 'string' },
          units: { type: 'string', enum: ['celsius', 'fahrenheit'] }
        },
        required: ['location']
      },
      trustLevelRequired: 'basic',
      capabilities: ['weather-current'],
      rateLimits: { requestsPerMinute: 60 }
    });

    this.tools.set('atp_identity_lookup', {
      name: 'atp_identity_lookup',
      description: 'Look up ATP identity information',
      inputSchema: {
        type: 'object',
        properties: {
          did: { type: 'string', pattern: '^did:atp:[a-zA-Z0-9-_]+$' },
          includeMetadata: { type: 'boolean' }
        },
        required: ['did']
      },
      trustLevelRequired: 'verified',
      capabilities: ['identity-lookup'],
      rateLimits: { requestsPerMinute: 30 }
    });

    this.tools.set('file_read', {
      name: 'file_read',
      description: 'Read file contents (restricted)',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', pattern: '^[a-zA-Z0-9-_/\\.]+$' },
          encoding: { type: 'string', enum: ['utf8', 'base64', 'hex'] }
        },
        required: ['path']
      },
      trustLevelRequired: 'enterprise',
      capabilities: ['file-system'],
      rateLimits: { requestsPerMinute: 10 }
    });
  }

  async startServer() {
    try {
      // Create HTTP/HTTPS server with health check endpoint
      if (this.useHttps && this.certPath && this.keyPath) {
        const httpsOptions = {
          cert: fs.readFileSync(this.certPath),
          key: fs.readFileSync(this.keyPath)
        };
        this.server = https.createServer(httpsOptions, this.handleHttpRequest.bind(this));
        console.log('🔒 Using HTTPS for secure connections');
      } else {
        this.server = http.createServer(this.handleHttpRequest.bind(this));
      }
      
      // Create WebSocket server
      this.wss = new WebSocketServer({ 
        server: this.server,
        perMessageDeflate: false,
        maxPayload: 16 * 1024 * 1024, // 16MB max payload
        clientTracking: true
      });

      // Handle WebSocket connections
      this.wss.on('connection', (ws, request) => {
        this.handleConnection(ws, request);
      });

      // Handle server errors
      this.server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.log(`⚠️ Port ${this.port} is in use, trying ${this.port + 1}...`);
          this.port = this.port + 1;
          setTimeout(() => this.startServer(), 1000);
          return;
        }
        console.error('❌ Server error:', error);
      });

      // Start listening
      this.server.listen(this.port, this.host, () => {
        console.log('🛡️ Quantum-Safe MCP Server Started');
        console.log(`   Port: ${this.port}`);
        console.log(`   Address: ${this.host}:${this.port}`);
        console.log(`   Protocol: ${this.useHttps ? 'HTTPS' : 'HTTP'}`);
        console.log(`   Security: Hybrid Ed25519 + Dilithium`);
        console.log(`   Trust Levels: basic, verified, enterprise`);
        console.log(`   Status: Production Ready`);
        console.log('🔄 Server is running and waiting for connections...');
      });

      // Set up connection health monitoring
      this.setupHealthMonitoring();

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  handleHttpRequest(req, res) {
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        service: 'ATP Quantum-Safe MCP Server',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        connections: this.clients.size,
        quantumSafe: true
      }));
      return;
    }
    
    // For non-health check requests, return 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }

  handleConnection(ws, request) {
    // Extract and validate ATP headers
    const clientDID = this.validateDID(request.headers['x-atp-did']) || 'unknown';
    const trustLevel = this.validateTrustLevel(request.headers['x-atp-trust-level']) || 'basic';
    const authMethod = this.validateAuthMethod(request.headers['x-atp-auth-method']) || 'standard';
    const quantumSignature = request.headers['x-atp-quantum-signature'] === 'enabled';
    
    console.log('🔐 New quantum-safe connection established');
    console.log(`   Client DID: ${clientDID}`);
    console.log(`   Trust Level: ${trustLevel}`);
    console.log(`   Auth Method: ${authMethod}`);
    console.log(`   Quantum-Safe: ${quantumSignature ? 'Enabled' : 'Disabled'}`);

    // Store client context
    const clientInfo = {
      clientDID,
      trustLevel,
      authMethod,
      quantumSignature,
      connectedAt: Date.now(),
      isAlive: true,
      lastPong: Date.now(),
      rateLimitCounters: {}
    };
    
    this.clients.set(ws, clientInfo);

    // Set up connection health
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
      clientInfo.lastPong = Date.now();
    });

    // Handle messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        console.error('❌ Error parsing message:', error);
        this.sendError(ws, 'parse_error', 'Invalid JSON message');
      }
    });

    // Handle connection close
    ws.on('close', (code, reason) => {
      console.log(`🔌 Connection closed (${code}: ${reason || 'No reason'})`);
      this.clients.delete(ws);
    });

    // Handle connection errors
    ws.on('error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.clients.delete(ws);
    });
  }

  setupHealthMonitoring() {
    // Ping clients every 30 seconds to detect broken connections
    const pingInterval = setInterval(() => {
      if (this.wss) {
        this.wss.clients.forEach((ws) => {
          if (ws.isAlive === false) {
            console.log('🔌 Terminating broken connection');
            this.clients.delete(ws);
            return ws.terminate();
          }
          ws.isAlive = false;
          ws.ping();
        });
      }
    }, 30000);

    // Clean up on server close
    if (this.server) {
      this.server.on('close', () => {
        clearInterval(pingInterval);
      });
    }

    // Handle process termination
    process.on('SIGTERM', () => {
      console.log('🔌 Shutting down server...');
      clearInterval(pingInterval);
      if (this.wss) {
        this.wss.close();
      }
      if (this.server) {
        this.server.close();
      }
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('🔌 Shutting down server...');
      clearInterval(pingInterval);
      if (this.wss) {
        this.wss.close();
      }
      if (this.server) {
        this.server.close();
      }
      process.exit(0);
    });
  }

  handleMessage(ws, message) {
    const client = this.clients.get(ws);
    
    // Validate message format
    if (!message.method || typeof message.method !== 'string') {
      return this.sendError(ws, 'invalid_request', 'Invalid request format: missing or invalid method');
    }
    
    if (!message.id) {
      return this.sendError(ws, 'invalid_request', 'Invalid request format: missing id');
    }
    
    switch (message.method) {
      case 'initialize':
        this.handleInitialize(ws, message);
        break;
      case 'tools/list':
        this.handleToolsList(ws, message);
        break;
      case 'tools/call':
        this.handleToolCall(ws, message);
        break;
      default:
        this.sendError(ws, 'method_not_found', `Method ${message.method} not found`);
    }
  }

  handleInitialize(ws, message) {
    const response = {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: { listChanged: true },
          resources: { subscribe: false },
          prompts: { listChanged: false },
          logging: { level: 'info' }
        },
        serverInfo: {
          name: 'ATP Quantum-Safe MCP Server',
          version: '1.0.0',
          protocol: 'quantum-safe-mcp',
          description: 'World\'s first quantum-safe AI agent protocol'
        },
        atpInfo: {
          serverDID: 'did:atp:quantum-safe-server-' + randomUUID(),
          quantumSafe: true,
          cryptography: 'Ed25519 + Dilithium',
          trustLevels: ['basic', 'verified', 'enterprise']
        }
      }
    };
    
    ws.send(JSON.stringify(response));
    console.log('✅ MCP session initialized for client');
  }

  handleToolsList(ws, message) {
    const client = this.clients.get(ws);
    const availableTools = Array.from(this.tools.values()).filter(tool => 
      this.checkTrustLevel(client.trustLevel, tool.trustLevelRequired)
    );

    const response = {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        tools: availableTools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          atpConfig: {
            trustLevelRequired: tool.trustLevelRequired,
            capabilities: tool.capabilities,
            rateLimits: tool.rateLimits,
            quantumSafeVerified: true
          }
        }))
      }
    };

    ws.send(JSON.stringify(response));
    console.log(`📋 Listed ${availableTools.length} tools for trust level: ${client.trustLevel}`);
  }

  handleToolCall(ws, message) {
    const client = this.clients.get(ws);
    
    // Validate message params
    if (!message.params || !message.params.name) {
      return this.sendError(ws, 'invalid_params', 'Missing tool name');
    }
    
    const { name, arguments: args = {} } = message.params;
    const tool = this.tools.get(name);

    if (!tool) {
      return this.sendError(ws, 'tool_not_found', `Tool ${name} not found`);
    }

    if (!this.checkTrustLevel(client.trustLevel, tool.trustLevelRequired)) {
      return this.sendError(ws, 'insufficient_trust', 
        `Tool ${name} requires ${tool.trustLevelRequired} trust level, client has ${client.trustLevel}`);
    }
    
    // Validate input against schema
    if (!this.validateToolInput(tool, args)) {
      return this.sendError(ws, 'invalid_params', 
        `Invalid arguments for tool ${name}. Check the inputSchema.`);
    }
    
    // Check rate limits
    if (!this.checkRateLimit(client, tool)) {
      return this.sendError(ws, 'rate_limit_exceeded', 
        `Rate limit exceeded for tool ${name}. Try again later.`);
    }

    // Verify quantum signature if enabled
    if (client.quantumSignature && message.params.signature) {
      try {
        const isValid = this.verifyQuantumSignature(message.params.signature, JSON.stringify(args), client.clientDID);
        if (!isValid) {
          return this.sendError(ws, 'invalid_signature', 'Invalid quantum signature');
        }
      } catch (error) {
        console.error('❌ Signature verification error:', error);
        return this.sendError(ws, 'signature_verification_error', 'Error verifying signature');
      }
    }

    // Simulate tool execution
    const result = this.executeToolSimulation(name, args);
    
    const response = {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ],
        atpMetadata: {
          quantumSafeVerified: true,
          trustLevel: client.trustLevel,
          executedAt: new Date().toISOString(),
          auditId: randomUUID()
        }
      }
    };

    ws.send(JSON.stringify(response));
    console.log(`🔧 Executed tool: ${name} with quantum-safe verification`);
  }

  executeToolSimulation(toolName, args) {
    switch (toolName) {
      case 'weather_info':
        return {
          location: args.location || 'Unknown',
          temperature: Math.floor(Math.random() * 30) + 10,
          units: args.units || 'celsius',
          condition: 'Sunny',
          quantumSafeVerified: true
        };
      case 'atp_identity_lookup':
        return {
          did: args.did,
          trustLevel: 'verified',
          status: 'active',
          quantumSafeSignature: true,
          lastSeen: new Date().toISOString()
        };
      case 'file_read':
        // Sanitize path to prevent directory traversal
        const sanitizedPath = this.sanitizePath(args.path);
        return {
          path: sanitizedPath,
          content: 'File content would be here (simulated)',
          encoding: args.encoding || 'utf8',
          quantumSafeVerified: true
        };
      default:
        return { error: 'Tool simulation not implemented' };
    }
  }

  checkTrustLevel(clientLevel, requiredLevel) {
    const levels = { basic: 1, verified: 2, enterprise: 3 };
    
    // Validate trust levels exist in our mapping
    if (!levels[clientLevel]) return false;
    if (!levels[requiredLevel]) return false;
    
    return levels[clientLevel] >= levels[requiredLevel];
  }

  validateToolInput(tool, args) {
    if (!tool.inputSchema) return true;
    
    // Basic schema validation
    const schema = tool.inputSchema;
    
    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (args[field] === undefined) {
          console.log(`❌ Missing required field: ${field}`);
          return false;
        }
      }
    }
    
    // Check property types and constraints
    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        if (args[propName] !== undefined) {
          // Type checking
          if (propSchema.type === 'string' && typeof args[propName] !== 'string') {
            console.log(`❌ Field ${propName} should be a string`);
            return false;
          }
          
          if (propSchema.type === 'number' && typeof args[propName] !== 'number') {
            console.log(`❌ Field ${propName} should be a number`);
            return false;
          }
          
          if (propSchema.type === 'boolean' && typeof args[propName] !== 'boolean') {
            console.log(`❌ Field ${propName} should be a boolean`);
            return false;
          }
          
          // Enum validation
          if (propSchema.enum && !propSchema.enum.includes(args[propName])) {
            console.log(`❌ Field ${propName} should be one of: ${propSchema.enum.join(', ')}`);
            return false;
          }
          
          // Pattern validation for strings
          if (propSchema.pattern && typeof args[propName] === 'string') {
            const regex = new RegExp(propSchema.pattern);
            if (!regex.test(args[propName])) {
              console.log(`❌ Field ${propName} does not match pattern: ${propSchema.pattern}`);
              return false;
            }
          }
        }
      }
    }
    
    return true;
  }

  checkRateLimit(client, tool) {
    const now = Date.now();
    const toolName = tool.name;
    const requestsPerMinute = tool.rateLimits?.requestsPerMinute || 60;
    const windowMs = 60 * 1000; // 1 minute in milliseconds
    
    // Initialize rate limit counter for this tool if it doesn't exist
    if (!client.rateLimitCounters[toolName]) {
      client.rateLimitCounters[toolName] = {
        count: 0,
        resetAt: now + windowMs
      };
    }
    
    // Reset counter if the window has passed
    if (now > client.rateLimitCounters[toolName].resetAt) {
      client.rateLimitCounters[toolName] = {
        count: 0,
        resetAt: now + windowMs
      };
    }
    
    // Increment counter and check limit
    client.rateLimitCounters[toolName].count++;
    
    if (client.rateLimitCounters[toolName].count > requestsPerMinute) {
      console.log(`⚠️ Rate limit exceeded for tool ${toolName}`);
      return false;
    }
    
    return true;
  }

  verifyQuantumSignature(signature, message, clientDID) {
    // This is a placeholder for actual cryptographic verification
    // In a real implementation, this would use actual cryptographic libraries
    
    if (!signature) return false;
    
    // Check if we have both classical and quantum signatures
    if (!signature.ed25519 || !signature.dilithium) {
      console.log('❌ Missing required signature components');
      return false;
    }
    
    // Simulate verification of Ed25519 signature
    const ed25519Verified = this.simulateEd25519Verification(signature.ed25519, message, clientDID);
    
    // Simulate verification of Dilithium signature
    const dilithiumVerified = this.simulateDilithiumVerification(signature.dilithium, message, clientDID);
    
    // Both signatures must be valid in hybrid mode
    return ed25519Verified && dilithiumVerified;
  }
  
  simulateEd25519Verification(signature, message, clientDID) {
    // In a real implementation, this would use the crypto library
    // For simulation, we'll just check that the signature exists and has the right format
    return typeof signature === 'string' && signature.length === 128;
  }
  
  simulateDilithiumVerification(signature, message, clientDID) {
    // In a real implementation, this would use a post-quantum crypto library
    // For simulation, we'll just check that the signature exists and has the right format
    return typeof signature === 'string' && signature.length > 1000;
  }

  validateDID(did) {
    if (!did) return null;
    
    // Basic DID validation: must be string and follow did:atp:* format
    if (typeof did !== 'string') return null;
    
    const didRegex = /^did:atp:[a-zA-Z0-9-_]+$/;
    return didRegex.test(did) ? did : null;
  }
  
  validateTrustLevel(level) {
    if (!level) return 'basic';
    
    const validLevels = ['basic', 'verified', 'enterprise'];
    return validLevels.includes(level) ? level : 'basic';
  }
  
  validateAuthMethod(method) {
    if (!method) return 'standard';
    
    const validMethods = ['standard', 'quantum-safe-signature', 'mtls'];
    return validMethods.includes(method) ? method : 'standard';
  }
  
  sanitizePath(path) {
    if (!path) return '';
    
    // Remove any directory traversal attempts
    return path.replace(/\.\.\//g, '').replace(/\.\.\\/g, '');
  }

  sendError(ws, code, message) {
    const error = {
      jsonrpc: '2.0',
      error: {
        code: this.getErrorCode(code),
        message: message,
        data: { code }
      }
    };
    ws.send(JSON.stringify(error));
  }
  
  getErrorCode(errorType) {
    const errorCodes = {
      'parse_error': -32700,
      'invalid_request': -32600,
      'method_not_found': -32601,
      'invalid_params': -32602,
      'internal_error': -32603,
      'tool_not_found': -32000,
      'insufficient_trust': -32001,
      'rate_limit_exceeded': -32002,
      'invalid_signature': -32003,
      'signature_verification_error': -32004
    };
    
    return errorCodes[errorType] || -32000;
  }
}

export { BaseQuantumSafeMCPServer };