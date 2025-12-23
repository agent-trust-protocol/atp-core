/**
 * Protocol Adapter Tests
 *
 * Tests for the protocol abstraction layer and adapters
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Protocol, Agent } from '../../protocols/base/types.js';
import { ProtocolDetector } from '../../protocols/base/detector.js';
import { MCPAdapter } from '../../protocols/mcp/mcp-adapter.js';
import { UniversalMonitor } from '../../monitoring/universal-monitor.js';

describe('Protocol Detection', () => {
  it('should detect MCP protocol', async () => {
    const mcpAgent = {
      did: 'did:atp:test123',
      context: {},
      tools: {},
      updateContext: () => {},
      metadata: { protocol: 'mcp' }
    };

    const result = await ProtocolDetector.detect(mcpAgent);

    expect(result.protocol).toBe(Protocol.MCP);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should detect Swarm protocol', async () => {
    const swarmAgent = {
      did: 'did:atp:test456',
      handoff: () => {},
      routines: [],
      context: {},
      metadata: { framework: 'swarm' }
    };

    const result = await ProtocolDetector.detect(swarmAgent);

    expect(result.protocol).toBe(Protocol.SWARM);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should detect ADK protocol', async () => {
    const adkAgent = {
      did: 'did:atp:test789',
      role: 'assistant',
      evaluate: () => {},
      deploy: {},
      metadata: { framework: 'adk' }
    };

    const result = await ProtocolDetector.detect(adkAgent);

    expect(result.protocol).toBe(Protocol.ADK);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should detect A2A protocol', async () => {
    const a2aAgent = {
      did: 'did:atp:test101',
      discover: () => {},
      advertise: () => {},
      capabilities: ['chat', 'search'],
      metadata: { protocol: 'a2a' }
    };

    const result = await ProtocolDetector.detect(a2aAgent);

    expect(result.protocol).toBe(Protocol.A2A);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should return UNKNOWN for unrecognized agents', async () => {
    const unknownAgent = {
      did: 'did:atp:unknown',
      someRandomProperty: 'value'
    };

    const result = await ProtocolDetector.detect(unknownAgent);

    expect(result.protocol).toBe(Protocol.UNKNOWN);
    expect(result.confidence).toBe(0);
  });

  it('should batch detect multiple agents', async () => {
    const agents = [
      { did: 'did:1', context: {}, tools: {}, metadata: { protocol: 'mcp' } },
      { did: 'did:2', handoff: () => {}, routines: [], metadata: { framework: 'swarm' } }
    ];

    const results = await ProtocolDetector.detectBatch(agents);

    expect(results.size).toBe(2);
    expect(results.get(agents[0])?.protocol).toBe(Protocol.MCP);
    expect(results.get(agents[1])?.protocol).toBe(Protocol.SWARM);
  });
});

describe('MCP Adapter', () => {
  let adapter: MCPAdapter;
  let agent: Agent;

  beforeEach(async () => {
    adapter = new MCPAdapter();
    await adapter.initialize({
      protocol: Protocol.MCP,
      atpConfig: {
        baseUrl: 'http://localhost:3000',
        auth: {
          did: 'did:atp:test',
          privateKey: 'test-key'
        }
      },
      enableMonitoring: true,
      enableAudit: true
    });

    agent = {
      did: 'did:atp:test-agent',
      protocol: Protocol.MCP,
      name: 'Test MCP Agent',
      capabilities: ['context', 'tools', 'retrieval']
    };
  });

  it('should identify as MCP protocol', () => {
    const info = adapter.identify();

    expect(info.protocol).toBe(Protocol.MCP);
    expect(info.name).toBe('Model Context Protocol');
    expect(info.capabilities).toContain('context-management');
  });

  it('should be ready after initialization', () => {
    expect(adapter.isReady()).toBe(true);
  });

  it('should monitor agent events', (done) => {
    const stream = adapter.monitor(agent);
    let eventReceived = false;

    const subscription = stream.subscribe({
      next: (event) => {
        expect(event.protocol).toBe(Protocol.MCP);
        expect(event.source.agentDid).toBe(agent.did);
        eventReceived = true;
        subscription.unsubscribe();
        done();
      },
      error: (error) => {
        done(error);
      }
    });

    // Wait for event (stream generates events every 5 seconds)
    setTimeout(() => {
      if (!eventReceived) {
        subscription.unsubscribe();
        done(new Error('No event received'));
      }
    }, 6000);
  }, 10000);

  it('should secure messages', async () => {
    const message = {
      id: 'msg_123',
      protocol: Protocol.MCP,
      sender: 'did:atp:sender',
      recipient: 'did:atp:recipient',
      payload: { text: 'Hello' },
      timestamp: new Date().toISOString()
    };

    const secured = await adapter.secure(message);

    expect(secured.signature).toBeDefined();
    expect(secured.trustLevel).toBeDefined();
    expect(secured.id).toBe(message.id);
  });

  it('should verify secured messages', async () => {
    const securedMessage = {
      id: 'msg_123',
      protocol: Protocol.MCP,
      sender: 'did:atp:sender',
      recipient: 'did:atp:recipient',
      payload: { text: 'Hello' },
      timestamp: new Date().toISOString(),
      signature: 'test-signature',
      trustLevel: 50
    };

    const result = await adapter.verify(securedMessage);

    expect(result.verified).toBe(true);
    expect(result.trustScore).toBeDefined();
    expect(result.details).toBeDefined();
  });

  it('should create audit entries', async () => {
    const event = {
      id: 'evt_123',
      protocol: Protocol.MCP,
      timestamp: new Date().toISOString(),
      type: 'mcp.context.update' as const,
      source: {
        agentDid: agent.did,
        agentName: agent.name
      },
      data: { contextId: 'ctx_1' }
    };

    const auditEntry = await adapter.audit(event);

    expect(auditEntry.protocol).toBe(Protocol.MCP);
    expect(auditEntry.agentDid).toBe(agent.did);
    expect(auditEntry.operation).toBe('mcp.context.update');
  });

  it('should cleanup resources', async () => {
    await adapter.cleanup();
    expect(adapter.isReady()).toBe(false);
  });
});

describe('Universal Monitor', () => {
  let monitor: UniversalMonitor;
  let mcpAdapter: MCPAdapter;
  let agent: Agent;

  beforeEach(async () => {
    monitor = new UniversalMonitor({
      minTrustLevel: 0,
      enableSigning: true,
      enableAudit: true
    });

    mcpAdapter = new MCPAdapter();
    await mcpAdapter.initialize({
      protocol: Protocol.MCP,
      atpConfig: {
        baseUrl: 'http://localhost:3000'
      }
    });

    monitor.registerAdapter(Protocol.MCP, mcpAdapter);

    agent = {
      did: 'did:atp:universal-test',
      protocol: Protocol.MCP,
      name: 'Universal Test Agent',
      capabilities: ['context', 'tools']
    };
  });

  it('should register protocol adapters', () => {
    expect(() => {
      monitor.registerAdapter(Protocol.MCP, mcpAdapter);
    }).not.toThrow();
  });

  it('should monitor agents with registered adapters', async () => {
    const stream = await monitor.monitor(agent);

    expect(stream).toBeDefined();
    expect(stream.protocol).toBe(Protocol.MCP);
  });

  it('should throw error for unsupported protocols', async () => {
    const unsupportedAgent = {
      did: 'did:atp:unsupported',
      protocol: Protocol.SWARM, // Not registered
      name: 'Unsupported Agent',
      capabilities: []
    };

    await expect(monitor.monitor(unsupportedAgent)).rejects.toThrow();
  });

  it('should track active monitors', async () => {
    await monitor.monitor(agent);

    const activeMonitors = monitor.getActiveMonitors();
    expect(activeMonitors.size).toBeGreaterThan(0);
  });

  it('should stop monitoring agents', async () => {
    await monitor.monitor(agent);

    monitor.stopMonitoring(agent.did);

    const activeMonitors = monitor.getActiveMonitors();
    expect(activeMonitors.has(agent.did)).toBe(false);
  });

  it('should cleanup all resources', async () => {
    await monitor.monitor(agent);
    await monitor.cleanup();

    const activeMonitors = monitor.getActiveMonitors();
    expect(activeMonitors.size).toBe(0);
  });
});

describe('Protocol Support', () => {
  it('should list all supported protocols', () => {
    const supported = ProtocolDetector.getSupportedProtocols();

    expect(supported).toContain(Protocol.MCP);
    expect(supported).toContain(Protocol.SWARM);
    expect(supported).toContain(Protocol.ADK);
    expect(supported).toContain(Protocol.A2A);
  });

  it('should validate protocol support', () => {
    expect(ProtocolDetector.isProtocolSupported(Protocol.MCP)).toBe(true);
    expect(ProtocolDetector.isProtocolSupported(Protocol.SWARM)).toBe(true);
    expect(ProtocolDetector.isProtocolSupported(Protocol.UNKNOWN)).toBe(false);
  });
});
