#!/usr/bin/env node

/**
 * Improved Quantum-Safe MCP Server (v2)
 * Enhanced stability, security, and connection handling
 * Extends the BaseQuantumSafeMCPServer with additional features
 */

import { BaseQuantumSafeMCPServer } from './quantum-safe-base-server.js';
import fs from 'fs';
import path from 'path';

class ImprovedQuantumSafeMCPServer extends BaseQuantumSafeMCPServer {
  constructor(options = {}) {
    super(options);
    
    // Add additional tools specific to this implementation
    this.setupAdditionalTools();
    
    // Add audit logging
    this.auditLog = [];
    this.auditLogPath = options.auditLogPath || './quantum-safe-audit.log';
    
    // Start the server
    this.startServer();
  }
  
  setupAdditionalTools() {
    // Add enterprise-specific tools
    this.tools.set('secure_storage', {
      name: 'secure_storage',
      description: 'Store data with quantum-safe encryption',
      inputSchema: {
        type: 'object',
        properties: {
          key: { type: 'string', pattern: '^[a-zA-Z0-9-_]+$' },
          value: { type: 'string' },
          ttl: { type: 'number', minimum: 0 }
        },
        required: ['key', 'value']
      },
      trustLevelRequired: 'enterprise',
      capabilities: ['storage-write'],
      rateLimits: { requestsPerMinute: 20 }
    });
    
    this.tools.set('secure_retrieve', {
      name: 'secure_retrieve',
      description: 'Retrieve data with quantum-safe decryption',
      inputSchema: {
        type: 'object',
        properties: {
          key: { type: 'string', pattern: '^[a-zA-Z0-9-_]+$' }
        },
        required: ['key']
      },
      trustLevelRequired: 'enterprise',
      capabilities: ['storage-read'],
      rateLimits: { requestsPerMinute: 30 }
    });
  }
  
  // Override handleToolCall to add audit logging
  async handleToolCall(ws, message) {
    const client = this.clients.get(ws);
    const startTime = Date.now();
    
    // Call the parent implementation
    await super.handleToolCall(ws, message);
    
    // Add audit log entry
    const auditEntry = {
      timestamp: new Date().toISOString(),
      clientDID: client.clientDID,
      trustLevel: client.trustLevel,
      toolName: message.params?.name,
      executionTime: Date.now() - startTime,
      quantumSafe: client.quantumSignature,
      requestId: message.id,
      status: 'success'
    };
    
    this.auditLog.push(auditEntry);
    this.writeAuditLog(auditEntry);
    
    // Periodically clean up old audit logs (keep last 1000 entries)
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }
  
  // Add HTTPS support with auto-generated self-signed certificates if needed
  async startServer() {
    // If HTTPS is enabled but no certificates provided, generate self-signed ones
    if (this.useHttps && (!this.certPath || !this.keyPath)) {
      console.log('🔒 Generating self-signed certificates for HTTPS...');
      
      // This is a placeholder - in a real implementation, you would use
      // a library like selfsigned or node-forge to generate certificates
      this.certPath = './server.crt';
      this.keyPath = './server.key';
      
      // For demo purposes, we'll just check if the files exist
      if (!fs.existsSync(this.certPath) || !fs.existsSync(this.keyPath)) {
        console.log('⚠️ Self-signed certificates not found, falling back to HTTP');
        this.useHttps = false;
      }
    }
    
    // Call the parent implementation
    await super.startServer();
  }
  
  // Add method to write audit logs to file
  writeAuditLog(entry) {
    try {
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.auditLogPath, logLine);
    } catch (error) {
      console.error('❌ Error writing audit log:', error);
    }
  }
  
  // Add method to get audit logs
  getAuditLogs(options = {}) {
    const { limit = 100, clientDID, toolName, timeRange } = options;
    
    let filteredLogs = [...this.auditLog];
    
    if (clientDID) {
      filteredLogs = filteredLogs.filter(entry => entry.clientDID === clientDID);
    }
    
    if (toolName) {
      filteredLogs = filteredLogs.filter(entry => entry.toolName === toolName);
    }
    
    if (timeRange) {
      const now = Date.now();
      const rangeMs = this.parseTimeRange(timeRange);
      if (rangeMs) {
        const cutoff = new Date(now - rangeMs).toISOString();
        filteredLogs = filteredLogs.filter(entry => entry.timestamp >= cutoff);
      }
    }
    
    // Return most recent logs first, limited to requested amount
    return filteredLogs.reverse().slice(0, limit);
  }
  
  parseTimeRange(timeRange) {
    const units = {
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000
    };
    
    const match = timeRange.match(/^(\d+)([mhd])$/);
    if (match) {
      const [, value, unit] = match;
      return parseInt(value) * units[unit];
    }
    
    return null;
  }
  
  // Override executeToolSimulation to add support for additional tools
  executeToolSimulation(toolName, args) {
    // First check if the parent class can handle this tool
    const parentResult = super.executeToolSimulation(toolName, args);
    if (!parentResult.error) {
      return parentResult;
    }
    
    // Handle additional tools
    switch (toolName) {
      case 'secure_storage':
        return {
          key: args.key,
          stored: true,
          ttl: args.ttl || 0,
          quantumSafeEncryption: true
        };
        
      case 'secure_retrieve':
        return {
          key: args.key,
          value: `Simulated value for ${args.key}`,
          quantumSafeDecryption: true
        };
        
      default:
        return { error: 'Tool simulation not implemented' };
    }
  }
}

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new ImprovedQuantumSafeMCPServer({
    port: 3008,
    useHttps: process.env.USE_HTTPS === 'true',
    certPath: process.env.CERT_PATH,
    keyPath: process.env.KEY_PATH,
    auditLogPath: process.env.AUDIT_LOG_PATH || './quantum-safe-audit.log'
  });
}

export { ImprovedQuantumSafeMCPServer };