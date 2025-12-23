/**
 * Unit Tests for Quantum-Safe MCP Server
 */

import { BaseQuantumSafeMCPServer } from '../quantum-safe-base-server.js';
import { ImprovedQuantumSafeMCPServer } from '../quantum-safe-server-improved-v2.js';
import { StandaloneQuantumSafeMCPServer } from '../quantum-safe-server-standalone-v2.js';
import WebSocket from 'ws';
import http from 'http';

// Mock WebSocket and HTTP
jest.mock('ws');
jest.mock('http');

describe('BaseQuantumSafeMCPServer', () => {
  let server;
  
  beforeEach(() => {
    // Reset mocks
    WebSocket.mockClear();
    http.createServer.mockClear();
    http.createServer.mockImplementation(() => ({
      listen: jest.fn((port, host, callback) => {
        if (callback) callback();
        return {
          on: jest.fn()
        };
      }),
      on: jest.fn()
    }));
    
    // Create server instance
    server = new BaseQuantumSafeMCPServer({
      port: 3008,
      host: '127.0.0.1'
    });
    
    // Mock WebSocketServer
    WebSocket.WebSocketServer.mockImplementation(() => ({
      on: jest.fn(),
      clients: new Set()
    }));
  });
  
  test('should initialize with default tools', () => {
    expect(server.tools.size).toBeGreaterThan(0);
    expect(server.tools.has('weather_info')).toBe(true);
    expect(server.tools.has('atp_identity_lookup')).toBe(true);
    expect(server.tools.has('file_read')).toBe(true);
  });
  
  test('should validate trust levels correctly', () => {
    // Valid trust level checks
    expect(server.checkTrustLevel('basic', 'basic')).toBe(true);
    expect(server.checkTrustLevel('verified', 'basic')).toBe(true);
    expect(server.checkTrustLevel('enterprise', 'basic')).toBe(true);
    expect(server.checkTrustLevel('enterprise', 'verified')).toBe(true);
    
    // Invalid trust level checks
    expect(server.checkTrustLevel('basic', 'verified')).toBe(false);
    expect(server.checkTrustLevel('basic', 'enterprise')).toBe(false);
    expect(server.checkTrustLevel('verified', 'enterprise')).toBe(false);
    
    // Invalid trust level names
    expect(server.checkTrustLevel('invalid', 'basic')).toBe(false);
    expect(server.checkTrustLevel('basic', 'invalid')).toBe(false);
  });
  
  test('should validate tool input correctly', () => {
    const weatherTool = server.tools.get('weather_info');
    
    // Valid inputs
    expect(server.validateToolInput(weatherTool, { location: 'San Francisco' })).toBe(true);
    expect(server.validateToolInput(weatherTool, { 
      location: 'San Francisco', 
      units: 'celsius' 
    })).toBe(true);
    
    // Invalid inputs
    expect(server.validateToolInput(weatherTool, {})).toBe(false); // Missing required field
    expect(server.validateToolInput(weatherTool, { 
      location: 'San Francisco', 
      units: 'kelvin' // Not in enum
    })).toBe(false);
    
    // Test pattern validation
    const identityTool = server.tools.get('atp_identity_lookup');
    expect(server.validateToolInput(identityTool, { 
      did: 'did:atp:valid-did' 
    })).toBe(true);
    expect(server.validateToolInput(identityTool, { 
      did: 'invalid-did-format' 
    })).toBe(false);
  });
  
  test('should enforce rate limits correctly', () => {
    const client = {
      clientDID: 'did:atp:test-client',
      trustLevel: 'verified',
      rateLimitCounters: {}
    };
    
    const weatherTool = server.tools.get('weather_info');
    
    // First request should pass
    expect(server.checkRateLimit(client, weatherTool)).toBe(true);
    
    // Simulate hitting the rate limit
    client.rateLimitCounters[weatherTool.name] = {
      count: weatherTool.rateLimits.requestsPerMinute + 1,
      resetAt: Date.now() + 60000
    };
    
    // Request should be rejected due to rate limit
    expect(server.checkRateLimit(client, weatherTool)).toBe(false);
    
    // Simulate rate limit window passing
    client.rateLimitCounters[weatherTool.name] = {
      count: 0,
      resetAt: Date.now() - 1000
    };
    
    // Request should pass again
    expect(server.checkRateLimit(client, weatherTool)).toBe(true);
  });
  
  test('should sanitize file paths correctly', () => {
    // Test directory traversal prevention
    expect(server.sanitizePath('/etc/passwd')).toBe('/etc/passwd');
    expect(server.sanitizePath('../../../etc/passwd')).toBe('etc/passwd');
    expect(server.sanitizePath('..\\..\\Windows\\System32')).toBe('WindowsSystem32');
    
    // Test null/undefined handling
    expect(server.sanitizePath(null)).toBe('');
    expect(server.sanitizePath(undefined)).toBe('');
  });
  
  test('should validate DIDs correctly', () => {
    // Valid DIDs
    expect(server.validateDID('did:atp:valid-did')).toBe('did:atp:valid-did');
    expect(server.validateDID('did:atp:123456789')).toBe('did:atp:123456789');
    
    // Invalid DIDs
    expect(server.validateDID('invalid-did')).toBeNull();
    expect(server.validateDID('did:other:valid-did')).toBeNull();
    expect(server.validateDID(null)).toBeNull();
    expect(server.validateDID(123)).toBeNull(); // Not a string
  });
  
  test('should return appropriate error codes', () => {
    expect(server.getErrorCode('parse_error')).toBe(-32700);
    expect(server.getErrorCode('invalid_request')).toBe(-32600);
    expect(server.getErrorCode('method_not_found')).toBe(-32601);
    expect(server.getErrorCode('invalid_params')).toBe(-32602);
    expect(server.getErrorCode('tool_not_found')).toBe(-32000);
    expect(server.getErrorCode('unknown_error')).toBe(-32000); // Default
  });
});

describe('ImprovedQuantumSafeMCPServer', () => {
  let server;
  
  beforeEach(() => {
    // Reset mocks
    WebSocket.mockClear();
    http.createServer.mockClear();
    http.createServer.mockImplementation(() => ({
      listen: jest.fn((port, host, callback) => {
        if (callback) callback();
        return {
          on: jest.fn()
        };
      }),
      on: jest.fn()
    }));
    
    // Create server instance
    server = new ImprovedQuantumSafeMCPServer({
      port: 3008,
      host: '127.0.0.1',
      auditLogPath: './test-audit.log'
    });
    
    // Mock WebSocketServer
    WebSocket.WebSocketServer.mockImplementation(() => ({
      on: jest.fn(),
      clients: new Set()
    }));
    
    // Mock fs.appendFileSync
    jest.spyOn(require('fs'), 'appendFileSync').mockImplementation(() => {});
  });
  
  test('should initialize with additional tools', () => {
    expect(server.tools.size).toBeGreaterThan(3); // Base tools + additional tools
    expect(server.tools.has('secure_storage')).toBe(true);
    expect(server.tools.has('secure_retrieve')).toBe(true);
  });
  
  test('should handle additional tool simulations', () => {
    // Test secure_storage tool
    const storageResult = server.executeToolSimulation('secure_storage', {
      key: 'test-key',
      value: 'test-value'
    });
    
    expect(storageResult).toHaveProperty('key', 'test-key');
    expect(storageResult).toHaveProperty('stored', true);
    expect(storageResult).toHaveProperty('quantumSafeEncryption', true);
    
    // Test secure_retrieve tool
    const retrieveResult = server.executeToolSimulation('secure_retrieve', {
      key: 'test-key'
    });
    
    expect(retrieveResult).toHaveProperty('key', 'test-key');
    expect(retrieveResult).toHaveProperty('value');
    expect(retrieveResult).toHaveProperty('quantumSafeDecryption', true);
  });
  
  test('should write audit logs', () => {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      clientDID: 'did:atp:test-client',
      toolName: 'weather_info'
    };
    
    server.writeAuditLog(auditEntry);
    
    expect(require('fs').appendFileSync).toHaveBeenCalled();
  });
  
  test('should filter audit logs correctly', () => {
    // Add some test audit entries
    server.auditLog = [
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        clientDID: 'did:atp:client1',
        toolName: 'weather_info'
      },
      {
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        clientDID: 'did:atp:client2',
        toolName: 'atp_identity_lookup'
      },
      {
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        clientDID: 'did:atp:client1',
        toolName: 'file_read'
      }
    ];
    
    // Test filtering by client DID
    const clientLogs = server.getAuditLogs({ clientDID: 'did:atp:client1' });
    expect(clientLogs.length).toBe(2);
    expect(clientLogs[0].clientDID).toBe('did:atp:client1');
    expect(clientLogs[1].clientDID).toBe('did:atp:client1');
    
    // Test filtering by tool name
    const toolLogs = server.getAuditLogs({ toolName: 'weather_info' });
    expect(toolLogs.length).toBe(1);
    expect(toolLogs[0].toolName).toBe('weather_info');
    
    // Test filtering by time range
    const recentLogs = server.getAuditLogs({ timeRange: '2h' });
    expect(recentLogs.length).toBe(1);
    
    // Test combined filters
    const combinedLogs = server.getAuditLogs({
      clientDID: 'did:atp:client1',
      timeRange: '12h'
    });
    expect(combinedLogs.length).toBe(1);
    expect(combinedLogs[0].clientDID).toBe('did:atp:client1');
    expect(combinedLogs[0].toolName).toBe('weather_info');
  });
  
  test('should parse time ranges correctly', () => {
    expect(server.parseTimeRange('1m')).toBe(60 * 1000);
    expect(server.parseTimeRange('2h')).toBe(2 * 60 * 60 * 1000);
    expect(server.parseTimeRange('3d')).toBe(3 * 24 * 60 * 60 * 1000);
    
    // Invalid formats
    expect(server.parseTimeRange('invalid')).toBeNull();
    expect(server.parseTimeRange('1x')).toBeNull();
  });
});

describe('StandaloneQuantumSafeMCPServer', () => {
  let server;
  
  beforeEach(() => {
    // Reset mocks
    WebSocket.mockClear();
    http.createServer.mockClear();
    http.createServer.mockImplementation(() => ({
      listen: jest.fn((port, host, callback) => {
        if (callback) callback();
        return {
          on: jest.fn()
        };
      }),
      on: jest.fn()
    }));
    
    // Create server instance
    server = new StandaloneQuantumSafeMCPServer({
      port: 3008
    });
    
    // Mock WebSocketServer
    WebSocket.WebSocketServer.mockImplementation(() => ({
      on: jest.fn(),
      clients: new Set()
    }));
  });
  
  test('should initialize with simplified tools', () => {
    expect(server.tools.size).toBe(2); // Only the demo tools
    expect(server.tools.has('weather_info')).toBe(true);
    expect(server.tools.has('atp_identity_lookup')).toBe(true);
    expect(server.tools.has('file_read')).toBe(false); // Not included in demo
  });
  
  test('should handle HTTP demo endpoint', () => {
    const req = {
      url: '/demo',
      method: 'GET',
      headers: {
        host: 'localhost:3008'
      }
    };
    
    const res = {
      writeHead: jest.fn(),
      end: jest.fn()
    };
    
    server.handleHttpRequest(req, res);
    
    expect(res.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'text/html' });
    expect(res.end).toHaveBeenCalled();
    expect(res.end.mock.calls[0][0]).toContain('ATP Quantum-Safe MCP Demo');
  });
  
  test('should handle tool simulations with additional metadata', () => {
    // Test weather_info tool
    const weatherResult = server.executeToolSimulation('weather_info', {
      location: 'San Francisco'
    });
    
    expect(weatherResult).toHaveProperty('location', 'San Francisco');
    expect(weatherResult).toHaveProperty('temperature');
    expect(weatherResult).toHaveProperty('condition');
    expect(weatherResult).toHaveProperty('quantumSafeVerified', true);
    expect(weatherResult).toHaveProperty('timestamp'); // Additional metadata
    
    // Test atp_identity_lookup tool
    const identityResult = server.executeToolSimulation('atp_identity_lookup', {
      did: 'did:atp:test-did'
    });
    
    expect(identityResult).toHaveProperty('did', 'did:atp:test-did');
    expect(identityResult).toHaveProperty('trustLevel');
    expect(identityResult).toHaveProperty('status');
    expect(identityResult).toHaveProperty('capabilities'); // Additional metadata
  });
  
  test('should handle unknown tools gracefully', () => {
    const result = server.executeToolSimulation('unknown_tool', {});
    
    expect(result).toHaveProperty('error');
    expect(result.error).toContain('not available in demo mode');
  });
});