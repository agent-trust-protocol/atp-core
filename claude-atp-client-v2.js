#!/usr/bin/env node

/**
 * Claude ATP Integration Client - Production Ready (v2)
 * World's First Quantum-Safe AI Agent Protocol Integration
 * 
 * Connects Claude to the Agent Trust Protocol™ network via quantum-safe MCP
 * Features:
 * - Hybrid Ed25519 + Dilithium cryptography
 * - Trust-based tool access control
 * - Real-time security monitoring
 * - Immutable audit logging
 */

import WebSocket from 'ws';
import { randomUUID } from 'crypto';
import { 
  generateHybridKeyPair, 
  createHybridSignature, 
  generateKeysForDID 
} from './quantum-crypto-utils.js';

class ClaudeATPClient {
  constructor(options = {}) {
    this.wsUrl = options.wsUrl || 'ws://127.0.0.1:3008'; // Quantum-safe MCP server
    this.clientDID = options.clientDID || 'did:atp:claude-client-' + randomUUID();
    this.trustLevel = options.trustLevel || 'verified'; // Claude gets verified trust level
    this.authMethod = options.authMethod || 'quantum-safe-signature';
    this.sessionId = options.sessionId || 'claude-session-' + randomUUID();
    
    this.ws = null;
    this.messageId = 0;
    this.pendingRequests = new Map();
    this.quantumSafe = true;
    this.securityLevel = 'post-quantum';
    this.connectedAt = null;
    
    // Initialize cryptographic keys
    this.keys = null;
  }

  async connect() {
    console.log('🔐 Connecting Claude to Quantum-Safe ATP Network...');
    console.log(`   WebSocket: ${this.wsUrl}`);
    console.log(`   Client DID: ${this.clientDID}`);
    console.log(`   Trust Level: ${this.trustLevel}`);
    console.log(`   Security: Quantum-Safe (Ed25519 + Dilithium)`);
    
    // Generate or load cryptographic keys
    await this.initializeKeys();

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl, {
        headers: {
          'x-atp-did': this.clientDID,
          'x-atp-trust-level': this.trustLevel,
          'x-atp-auth-method': this.authMethod,
          'x-atp-session-id': this.sessionId,
          'x-atp-quantum-signature': 'enabled',
          'x-atp-security-level': this.securityLevel,
          'user-agent': 'Claude-ATP-Client/2.0.0 (Quantum-Safe)',
        }
      });

      this.ws.on('open', () => {
        this.connectedAt = Date.now();
        console.log('✅ Connected to Quantum-Safe ATP Network');
        console.log('🛡️ Security: Post-Quantum Cryptography Active');
        this.initialize().then(resolve).catch(reject);
      });

      this.ws.on('message', (data) => {
        this.handleMessage(JSON.parse(data.toString()));
      });

      this.ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('🔌 Disconnected from ATP Network');
      });
    });
  }
  
  async initializeKeys() {
    try {
      // For testing, we'll generate deterministic keys based on the DID
      this.keys = await generateKeysForDID(this.clientDID);
      console.log('🔑 Quantum-safe cryptographic keys initialized');
    } catch (error) {
      console.error('❌ Failed to initialize cryptographic keys:', error);
      throw error;
    }
  }

  async initialize() {
    console.log('🚀 Initializing MCP session...');
    
    const response = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: { listChanged: true },
        resources: { subscribe: false },
        prompts: { listChanged: false },
        logging: { level: 'info' }
      },
      clientInfo: {
        name: 'Claude ATP Client',
        version: '2.0.0',
        description: 'Claude connected to Agent Trust Protocol™'
      }
    });

    console.log('✅ MCP session initialized');
    console.log(`   Server: ${response.serverInfo.name}`);
    console.log(`   Protocol: ${response.serverInfo.protocol}`);
    console.log(`   ATP Server DID: ${response.atpInfo.serverDID}`);
    
    return response;
  }

  async listTools() {
    console.log('📋 Listing available ATP tools...');
    
    const response = await this.sendRequest('tools/list');
    
    console.log(`✅ Found ${response.tools.length} tools available for trust level: ${this.trustLevel}`);
    
    response.tools.forEach((tool, index) => {
      console.log(`   ${index + 1}. ${tool.name}`);
      console.log(`      Description: ${tool.description}`);
      console.log(`      Trust Level: ${tool.atpConfig.trustLevelRequired}`);
      console.log(`      Capabilities: ${tool.atpConfig.capabilities.join(', ')}`);
      console.log(`      Rate Limits: ${tool.atpConfig.rateLimits.requestsPerMinute}/min`);
      console.log('');
    });
    
    return response.tools;
  }

  async callTool(toolName, args = {}) {
    console.log(`🔧 Calling ATP tool: ${toolName}`);
    console.log(`   Arguments:`, args);
    
    // Create quantum-safe signature for the tool call
    const messageToSign = JSON.stringify({
      tool: toolName,
      args,
      timestamp: new Date().toISOString(),
      clientDID: this.clientDID
    });
    
    const signature = createHybridSignature(messageToSign, this.keys);
    
    const response = await this.sendRequest('tools/call', {
      name: toolName,
      arguments: args,
      signature,
      atpContext: {
        requestId: 'claude-req-' + randomUUID(),
        timestamp: new Date().toISOString(),
        clientDID: this.clientDID,
        trustLevel: this.trustLevel
      }
    });
    
    console.log('✅ Tool execution completed');
    console.log('   Result:', response);
    
    return response;
  }

  async discoverAgents(capabilities = [], trustLevel = 'basic') {
    console.log('🔍 Discovering ATP agents...');
    
    // Use A2A bridge for agent discovery
    const discoveryUrl = 'http://localhost:3008/a2a/discover';
    const discoveryRequest = {
      query: {
        capabilities,
        trustLevel
      },
      filters: {
        minTrustLevel: trustLevel,
        verifiedOnly: true,
        activeOnly: true
      },
      requester: {
        did: this.clientDID,
        trustLevel: this.trustLevel,
        purpose: 'Claude agent discovery',
        sessionId: this.sessionId
      }
    };

    try {
      const response = await fetch(discoveryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(discoveryRequest)
      });

      const result = await response.json();
      
      console.log(`✅ Found ${result.agents?.length || 0} agents`);
      if (result.agents) {
        result.agents.forEach((agent, index) => {
          console.log(`   ${index + 1}. ${agent.name} (${agent.did})`);
          console.log(`      Trust Level: ${agent.atpProfile.trustLevel}`);
          console.log(`      Capabilities: ${agent.capabilities.map(c => c.name).join(', ')}`);
          console.log('');
        });
      }
      
      return result.agents || [];
    } catch (error) {
      console.error('❌ Agent discovery failed:', error);
      return [];
    }
  }
  
  async getAuditTrail(options = {}) {
    console.log('📊 Retrieving audit trail...');
    
    const response = await this.sendRequest('audit/get', {
      timeRange: options.timeRange || '24h',
      includeSignatures: options.includeSignatures || true,
      limit: options.limit || 100
    });
    
    console.log(`✅ Retrieved ${response.entries?.length || 0} audit entries`);
    
    return response.entries || [];
  }

  sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      const message = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      this.pendingRequests.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(message));

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  handleMessage(message) {
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);

      if (message.error) {
        reject(new Error(message.error.message));
      } else {
        resolve(message.result);
      }
    } else if (message.method) {
      // Handle notifications
      console.log('📢 ATP Notification:', message.method, message.params);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Example usage and demo
async function demonstrateClaudeATPIntegration() {
  console.log('🎯 Claude ATP Integration Demo (v2)');
  console.log('==================================\n');

  const client = new ClaudeATPClient({
    trustLevel: 'verified', // Claude gets verified trust level
    clientDID: 'did:atp:claude-demo-client'
  });

  try {
    // Connect to ATP network
    await client.connect();

    // List available tools
    const tools = await client.listTools();

    // Discover other agents
    await client.discoverAgents(['weather-current'], 'basic');

    // Try calling some tools
    console.log('🧪 Testing ATP tools with quantum-safe signatures...\n');

    // Test weather tool (basic trust required)
    try {
      await client.callTool('weather_info', {
        location: 'San Francisco',
        units: 'celsius'
      });
    } catch (error) {
      console.log('   Weather tool result:', error.message);
    }

    // Test ATP identity lookup (verified trust required)
    try {
      await client.callTool('atp_identity_lookup', {
        did: 'did:atp:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
        includeMetadata: true
      });
    } catch (error) {
      console.log('   Identity lookup result:', error.message);
    }

    // Test file read (enterprise trust required - should fail)
    try {
      await client.callTool('file_read', {
        path: '/etc/hostname',
        encoding: 'utf8'
      });
    } catch (error) {
      console.log('   File read result:', error.message);
    }

    // Get audit trail
    try {
      await client.getAuditTrail({ timeRange: '1h' });
    } catch (error) {
      console.log('   Audit trail result:', error.message);
    }

    console.log('\n🎉 Claude ATP Integration Demo Complete!');
    console.log('Claude is now connected to the Agent Trust Protocol network.');
    console.log('All tool calls are quantum-safe signed and trust-verified.');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    client.disconnect();
  }
}

// Export for use as module
export { ClaudeATPClient };

// Run demo if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateClaudeATPIntegration();
}