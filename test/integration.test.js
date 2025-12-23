/**
 * Integration Tests for Quantum-Safe ATP System
 */

import { StandaloneQuantumSafeMCPServer } from '../quantum-safe-server-standalone-v2.js';
import { ClaudeATPClient } from '../claude-atp-client-v2.js';
import { QuantumSafeIntegrationTest } from '../test-quantum-safe-integration.js';
import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

// This test requires a running server
// It will start a server if one is not already running
describe('Quantum-Safe ATP Integration', () => {
  let server;
  let serverProcess;
  
  beforeAll(async () => {
    // Try to connect to existing server
    try {
      const testClient = new ClaudeATPClient({
        wsUrl: 'ws://localhost:3008',
        clientDID: 'did:atp:test-client'
      });
      
      await testClient.connect();
      console.log('Using existing server on port 3008');
      testClient.disconnect();
    } catch (error) {
      // Start a new server
      console.log('Starting new server for tests...');
      serverProcess = spawn('node', ['quantum-safe-server-standalone-v2.js'], {
        env: { ...process.env, PORT: '3008' },
        detached: true
      });
      
      // Wait for server to start
      await setTimeout(2000);
    }
  });
  
  afterAll(() => {
    // Clean up server if we started one
    if (serverProcess) {
      console.log('Stopping test server...');
      process.kill(-serverProcess.pid);
    }
  });
  
  test('should connect Claude to ATP network', async () => {
    const client = new ClaudeATPClient({
      wsUrl: 'ws://localhost:3008',
      clientDID: 'did:atp:integration-test-client',
      trustLevel: 'verified'
    });
    
    await client.connect();
    
    // Verify connection was successful
    expect(client.connectedAt).not.toBeNull();
    
    client.disconnect();
  }, 10000);
  
  test('should list available tools based on trust level', async () => {
    // Create client with verified trust level
    const verifiedClient = new ClaudeATPClient({
      wsUrl: 'ws://localhost:3008',
      clientDID: 'did:atp:verified-client',
      trustLevel: 'verified'
    });
    
    await verifiedClient.connect();
    const verifiedTools = await verifiedClient.listTools();
    
    // Verified client should see both basic and verified tools
    expect(verifiedTools.length).toBeGreaterThanOrEqual(2);
    expect(verifiedTools.some(t => t.name === 'weather_info')).toBe(true);
    expect(verifiedTools.some(t => t.name === 'atp_identity_lookup')).toBe(true);
    
    verifiedClient.disconnect();
    
    // Create client with basic trust level
    const basicClient = new ClaudeATPClient({
      wsUrl: 'ws://localhost:3008',
      clientDID: 'did:atp:basic-client',
      trustLevel: 'basic'
    });
    
    await basicClient.connect();
    const basicTools = await basicClient.listTools();
    
    // Basic client should only see basic tools
    expect(basicTools.length).toBeGreaterThanOrEqual(1);
    expect(basicTools.some(t => t.name === 'weather_info')).toBe(true);
    expect(basicTools.some(t => t.name === 'atp_identity_lookup')).toBe(false);
    
    basicClient.disconnect();
  }, 15000);
  
  test('should call tools with quantum-safe signatures', async () => {
    const client = new ClaudeATPClient({
      wsUrl: 'ws://localhost:3008',
      clientDID: 'did:atp:tool-test-client',
      trustLevel: 'verified'
    });
    
    await client.connect();
    
    // Call weather tool
    const weatherResult = await client.callTool('weather_info', {
      location: 'San Francisco',
      units: 'celsius'
    });
    
    // Verify result
    expect(weatherResult).toBeDefined();
    expect(weatherResult.content).toBeDefined();
    expect(weatherResult.content[0].type).toBe('text');
    
    const weatherData = JSON.parse(weatherResult.content[0].text);
    expect(weatherData.location).toBe('San Francisco');
    expect(weatherData.units).toBe('celsius');
    expect(weatherData.temperature).toBeDefined();
    expect(weatherData.quantumSafeVerified).toBe(true);
    
    client.disconnect();
  }, 10000);
  
  test('should enforce trust level requirements', async () => {
    const client = new ClaudeATPClient({
      wsUrl: 'ws://localhost:3008',
      clientDID: 'did:atp:basic-client',
      trustLevel: 'basic'
    });
    
    await client.connect();
    
    // Call weather tool (should succeed with basic trust)
    const weatherResult = await client.callTool('weather_info', {
      location: 'San Francisco'
    });
    
    // Verify success
    expect(weatherResult).toBeDefined();
    
    // Call identity lookup tool (should fail with basic trust)
    await expect(client.callTool('atp_identity_lookup', {
      did: 'did:atp:test-did'
    })).rejects.toThrow();
    
    client.disconnect();
  }, 10000);
  
  test('should run full integration test suite', async () => {
    const testSuite = new QuantumSafeIntegrationTest();
    
    // Run individual tests
    await testSuite.testClaudeConnection();
    expect(testSuite.testResults.connectionTest).toBe(true);
    
    await testSuite.testToolAccess();
    expect(testSuite.testResults.toolAccessTest).toBe(true);
    
    await testSuite.testSecurityFeatures();
    expect(testSuite.testResults.securityTest).toBe(true);
    
    await testSuite.testPerformance();
    expect(testSuite.testResults.performanceTest).toBe(true);
  }, 30000);
});