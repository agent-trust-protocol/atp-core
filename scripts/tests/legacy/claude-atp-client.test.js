/**
 * Unit Tests for Claude ATP Client
 */

import { ClaudeATPClient } from '../claude-atp-client-v2.js';
import WebSocket from 'ws';
import { generateKeysForDID, createHybridSignature } from '../quantum-crypto-utils.js';

// Mock WebSocket
jest.mock('ws');

// Mock crypto utils
jest.mock('../quantum-crypto-utils.js', () => ({
  generateKeysForDID: jest.fn().mockResolvedValue({
    ed25519: {
      publicKey: 'mock-ed25519-public-key',
      privateKey: 'mock-ed25519-private-key'
    },
    dilithium: {
      publicKey: 'mock-dilithium-public-key',
      privateKey: 'mock-dilithium-private-key'
    }
  }),
  createHybridSignature: jest.fn().mockReturnValue({
    ed25519: 'mock-ed25519-signature',
    dilithium: 'mock-dilithium-signature'
  })
}));

// Mock fetch for agent discovery
global.fetch = jest.fn().mockResolvedValue({
  json: jest.fn().mockResolvedValue({
    agents: [
      {
        name: 'Test Agent',
        did: 'did:atp:test-agent',
        atpProfile: {
          trustLevel: 'verified'
        },
        capabilities: [
          { name: 'weather-current' }
        ]
      }
    ]
  })
});

describe('ClaudeATPClient', () => {
  let client;
  let mockWs;
  
  beforeEach(() => {
    // Reset mocks
    WebSocket.mockClear();
    generateKeysForDID.mockClear();
    createHybridSignature.mockClear();
    
    // Create mock WebSocket
    mockWs = {
      on: jest.fn((event, callback) => {
        if (event === 'open') {
          // Simulate immediate connection
          setTimeout(() => callback(), 0);
        }
      }),
      send: jest.fn()
    };
    
    // Mock WebSocket constructor
    WebSocket.mockImplementation(() => mockWs);
    
    // Create client instance
    client = new ClaudeATPClient({
      wsUrl: 'ws://localhost:3008',
      clientDID: 'did:atp:test-client',
      trustLevel: 'verified'
    });
  });
  
  test('should initialize with correct default values', () => {
    expect(client.wsUrl).toBe('ws://localhost:3008');
    expect(client.clientDID).toBe('did:atp:test-client');
    expect(client.trustLevel).toBe('verified');
    expect(client.authMethod).toBe('quantum-safe-signature');
    expect(client.quantumSafe).toBe(true);
    expect(client.securityLevel).toBe('post-quantum');
  });
  
  test('should connect with proper headers', async () => {
    // Setup mock for initialize response
    const mockMessageHandler = jest.fn();
    mockWs.on.mockImplementation((event, callback) => {
      if (event === 'open') {
        setTimeout(() => callback(), 0);
      } else if (event === 'message') {
        mockMessageHandler = callback;
      }
    });
    
    // Connect to server
    const connectPromise = client.connect();
    
    // Simulate initialize response
    setTimeout(() => {
      mockMessageHandler(JSON.stringify({
        id: 1,
        result: {
          serverInfo: {
            name: 'ATP Quantum-Safe MCP Server',
            protocol: 'quantum-safe-mcp'
          },
          atpInfo: {
            serverDID: 'did:atp:test-server'
          }
        }
      }));
    }, 10);
    
    await connectPromise;
    
    // Verify WebSocket was created with correct headers
    expect(WebSocket).toHaveBeenCalledWith('ws://localhost:3008', {
      headers: expect.objectContaining({
        'x-atp-did': 'did:atp:test-client',
        'x-atp-trust-level': 'verified',
        'x-atp-auth-method': 'quantum-safe-signature',
        'x-atp-quantum-signature': 'enabled',
        'x-atp-security-level': 'post-quantum'
      })
    });
    
    // Verify keys were initialized
    expect(generateKeysForDID).toHaveBeenCalledWith('did:atp:test-client');
    expect(client.keys).not.toBeNull();
  });
  
  test('should initialize MCP session', async () => {
    // Setup mock for message handling
    let messageHandler;
    mockWs.on.mockImplementation((event, callback) => {
      if (event === 'open') {
        setTimeout(() => callback(), 0);
      } else if (event === 'message') {
        messageHandler = callback;
      }
    });
    
    // Connect to server
    const connectPromise = client.connect();
    
    // Simulate initialize response
    setTimeout(() => {
      // Extract the message ID from the sent message
      const sentMessage = JSON.parse(mockWs.send.mock.calls[0][0]);
      
      messageHandler(JSON.stringify({
        id: sentMessage.id,
        result: {
          serverInfo: {
            name: 'ATP Quantum-Safe MCP Server',
            protocol: 'quantum-safe-mcp'
          },
          atpInfo: {
            serverDID: 'did:atp:test-server'
          }
        }
      }));
    }, 10);
    
    await connectPromise;
    
    // Verify initialize message was sent
    expect(mockWs.send).toHaveBeenCalled();
    const sentMessage = JSON.parse(mockWs.send.mock.calls[0][0]);
    expect(sentMessage.method).toBe('initialize');
    expect(sentMessage.params.clientInfo).toBeDefined();
  });
  
  test('should list tools with trust level filtering', async () => {
    // Setup client with mocked connection
    client.ws = mockWs;
    
    // Setup mock for sendRequest
    client.sendRequest = jest.fn().mockResolvedValue({
      tools: [
        {
          name: 'weather_info',
          description: 'Get weather information',
          atpConfig: {
            trustLevelRequired: 'basic',
            capabilities: ['weather-current'],
            rateLimits: { requestsPerMinute: 60 }
          }
        },
        {
          name: 'atp_identity_lookup',
          description: 'Look up ATP identity',
          atpConfig: {
            trustLevelRequired: 'verified',
            capabilities: ['identity-lookup'],
            rateLimits: { requestsPerMinute: 30 }
          }
        }
      ]
    });
    
    // List tools
    const tools = await client.listTools();
    
    // Verify request was sent
    expect(client.sendRequest).toHaveBeenCalledWith('tools/list');
    
    // Verify tools were returned
    expect(tools).toHaveLength(2);
    expect(tools[0].name).toBe('weather_info');
    expect(tools[1].name).toBe('atp_identity_lookup');
  });
  
  test('should call tools with quantum-safe signatures', async () => {
    // Setup client with mocked connection and keys
    client.ws = mockWs;
    client.keys = {
      ed25519: {
        publicKey: 'mock-ed25519-public-key',
        privateKey: 'mock-ed25519-private-key'
      },
      dilithium: {
        publicKey: 'mock-dilithium-public-key',
        privateKey: 'mock-dilithium-private-key'
      }
    };
    
    // Setup mock for sendRequest
    client.sendRequest = jest.fn().mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            location: 'San Francisco',
            temperature: 22,
            units: 'celsius',
            condition: 'Sunny'
          })
        }
      ],
      atpMetadata: {
        quantumSafeVerified: true,
        trustLevel: 'verified',
        executedAt: new Date().toISOString()
      }
    });
    
    // Call tool
    const args = {
      location: 'San Francisco',
      units: 'celsius'
    };
    
    await client.callTool('weather_info', args);
    
    // Verify signature was created
    expect(createHybridSignature).toHaveBeenCalled();
    expect(createHybridSignature.mock.calls[0][0]).toContain('weather_info');
    expect(createHybridSignature.mock.calls[0][0]).toContain('San Francisco');
    
    // Verify request was sent with signature
    expect(client.sendRequest).toHaveBeenCalledWith('tools/call', expect.objectContaining({
      name: 'weather_info',
      arguments: args,
      signature: {
        ed25519: 'mock-ed25519-signature',
        dilithium: 'mock-dilithium-signature'
      }
    }));
  });
  
  test('should discover agents', async () => {
    // Discover agents
    const agents = await client.discoverAgents(['weather-current'], 'basic');
    
    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalled();
    expect(global.fetch.mock.calls[0][0]).toContain('/a2a/discover');
    
    // Verify request body
    const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(requestBody.query.capabilities).toContain('weather-current');
    expect(requestBody.query.trustLevel).toBe('basic');
    expect(requestBody.requester.did).toBe('did:atp:test-client');
    
    // Verify agents were returned
    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe('Test Agent');
    expect(agents[0].did).toBe('did:atp:test-agent');
  });
  
  test('should handle message responses correctly', () => {
    // Setup client
    client.pendingRequests = new Map();
    
    // Setup mock resolvers
    const mockResolve = jest.fn();
    const mockReject = jest.fn();
    
    // Add pending request
    client.pendingRequests.set(123, {
      resolve: mockResolve,
      reject: mockReject
    });
    
    // Handle successful response
    client.handleMessage({
      id: 123,
      result: { success: true }
    });
    
    // Verify resolver was called
    expect(mockResolve).toHaveBeenCalledWith({ success: true });
    expect(client.pendingRequests.size).toBe(0);
    
    // Reset mocks
    mockResolve.mockClear();
    mockReject.mockClear();
    
    // Add another pending request
    client.pendingRequests.set(456, {
      resolve: mockResolve,
      reject: mockReject
    });
    
    // Handle error response
    client.handleMessage({
      id: 456,
      error: {
        message: 'Test error'
      }
    });
    
    // Verify reject was called
    expect(mockReject).toHaveBeenCalled();
    expect(mockReject.mock.calls[0][0].message).toBe('Test error');
    expect(client.pendingRequests.size).toBe(0);
  });
  
  test('should handle request timeouts', async () => {
    // Setup client with mocked connection
    client.ws = mockWs;
    
    // Mock setTimeout to trigger immediately
    jest.useFakeTimers();
    
    // Send request that will timeout
    const promise = client.sendRequest('test/method');
    
    // Fast-forward timers
    jest.advanceTimersByTime(31000);
    
    // Verify promise rejects with timeout
    await expect(promise).rejects.toThrow('Request timeout');
    
    // Restore timers
    jest.useRealTimers();
  });
  
  test('should disconnect properly', () => {
    // Setup client with mocked connection
    client.ws = {
      close: jest.fn()
    };
    
    // Disconnect
    client.disconnect();
    
    // Verify close was called
    expect(client.ws.close).toHaveBeenCalled();
  });
});