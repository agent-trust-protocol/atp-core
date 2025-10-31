/**
 * Multi-Protocol Support Example
 *
 * Demonstrates how to use ATP SDK with different AI agent protocols:
 * - MCP (Model Context Protocol)
 * - OpenAI Swarm
 * - Google ADK
 * - Agent2Agent (A2A)
 */

import {
  ATPClient,
  createQuickConfig,
  ProtocolDetector,
  UniversalMonitor,
  MCPAdapter,
  Protocol
} from '@atp/sdk';

/**
 * Example 1: Automatic Protocol Detection
 */
async function detectAgentProtocol() {
  console.log('\n=== Example 1: Protocol Detection ===\n');

  // Example MCP agent
  const mcpAgent = {
    did: 'did:atp:mcp-agent-123',
    context: { session: 'session_1' },
    tools: { calculator: {}, search: {} },
    updateContext: () => {},
    metadata: { protocol: 'mcp' }
  };

  // Detect protocol
  const detection = await ProtocolDetector.detect(mcpAgent);

  console.log('Detection Result:');
  console.log(`  Protocol: ${detection.protocol}`);
  console.log(`  Confidence: ${(detection.confidence * 100).toFixed(1)}%`);
  console.log(`  Reasons: ${detection.reasons.join(', ')}`);
}

/**
 * Example 2: Monitor MCP Agent
 */
async function monitorMCPAgent() {
  console.log('\n=== Example 2: Monitor MCP Agent ===\n');

  // Initialize ATP client
  const config = createQuickConfig('http://localhost:3000', {
    auth: {
      did: 'did:atp:developer',
      privateKey: process.env.ATP_PRIVATE_KEY || 'your-private-key'
    }
  });

  const atp = new ATPClient(config);

  // Create MCP adapter
  const mcpAdapter = new MCPAdapter();
  await mcpAdapter.initialize({
    protocol: Protocol.MCP,
    atpConfig: config,
    enableMonitoring: true,
    enableAudit: true,
    securityLevel: 'quantum-safe'
  });

  // Create universal monitor
  const monitor = new UniversalMonitor({
    minTrustLevel: 50,
    enableSigning: true,
    enableAudit: true
  });

  // Register MCP adapter
  monitor.registerAdapter(Protocol.MCP, mcpAdapter);

  // Define agent to monitor
  const agent = {
    did: 'did:atp:mcp-assistant',
    protocol: Protocol.MCP,
    name: 'MCP Assistant',
    capabilities: ['context-management', 'tool-execution', 'retrieval']
  };

  // Start monitoring
  const stream = await monitor.monitor(agent);

  console.log(`Monitoring agent: ${agent.name} (${agent.did})`);
  console.log('Listening for events...\n');

  // Subscribe to events
  const subscription = stream.subscribe({
    next: (event) => {
      console.log('Event received:');
      console.log(`  Type: ${event.type}`);
      console.log(`  Timestamp: ${event.timestamp}`);
      console.log(`  Trust Score: ${event.trustScore}`);
      console.log(`  Data:`, JSON.stringify(event.data, null, 2));
      console.log('---');
    },
    error: (error) => {
      console.error('Error:', error.message);
    },
    complete: () => {
      console.log('Monitoring complete');
    }
  });

  // Monitor for 30 seconds
  setTimeout(() => {
    subscription.unsubscribe();
    monitor.cleanup();
    console.log('\nMonitoring stopped');
  }, 30000);
}

/**
 * Example 3: Secure Message Exchange
 */
async function secureMessageExchange() {
  console.log('\n=== Example 3: Secure Message Exchange ===\n');

  // Initialize MCP adapter
  const mcpAdapter = new MCPAdapter();
  await mcpAdapter.initialize({
    protocol: Protocol.MCP,
    atpConfig: {
      baseUrl: 'http://localhost:3000',
      auth: {
        did: 'did:atp:developer',
        privateKey: process.env.ATP_PRIVATE_KEY
      }
    },
    securityLevel: 'quantum-safe'
  });

  // Create a message
  const message = {
    id: 'msg_' + Date.now(),
    protocol: Protocol.MCP,
    sender: 'did:atp:agent-1',
    recipient: 'did:atp:agent-2',
    payload: {
      type: 'context-update',
      context: {
        conversation_id: 'conv_123',
        turn: 5,
        data: { user_intent: 'book_flight' }
      }
    },
    timestamp: new Date().toISOString()
  };

  console.log('Original Message:');
  console.log(JSON.stringify(message, null, 2));

  // Apply ATP security layer
  const securedMessage = await mcpAdapter.secure(message);

  console.log('\nSecured Message:');
  console.log(`  Signature: ${securedMessage.signature.substring(0, 50)}...`);
  console.log(`  Trust Level: ${securedMessage.trustLevel}`);
  console.log(`  Timestamp: ${securedMessage.timestamp}`);

  // Verify the secured message
  const verification = await mcpAdapter.verify(securedMessage);

  console.log('\nVerification Result:');
  console.log(`  Verified: ${verification.verified}`);
  console.log(`  Trust Score: ${verification.trustScore}`);
  console.log(`  Signature Valid: ${verification.details?.signatureValid}`);
  console.log(`  Sender Verified: ${verification.details?.senderVerified}`);

  await mcpAdapter.cleanup();
}

/**
 * Example 4: Multi-Protocol Detection
 */
async function detectMultipleProtocols() {
  console.log('\n=== Example 4: Multi-Protocol Detection ===\n');

  const agents = [
    {
      name: 'MCP Agent',
      agent: {
        did: 'did:atp:mcp-1',
        context: {},
        tools: {},
        metadata: { protocol: 'mcp' }
      }
    },
    {
      name: 'Swarm Agent',
      agent: {
        did: 'did:atp:swarm-1',
        handoff: () => {},
        routines: [],
        metadata: { framework: 'swarm' }
      }
    },
    {
      name: 'ADK Agent',
      agent: {
        did: 'did:atp:adk-1',
        role: 'assistant',
        evaluate: () => {},
        metadata: { framework: 'adk' }
      }
    },
    {
      name: 'A2A Agent',
      agent: {
        did: 'did:atp:a2a-1',
        discover: () => {},
        advertise: () => {},
        capabilities: ['chat'],
        metadata: { protocol: 'a2a' }
      }
    }
  ];

  console.log('Detecting protocols for multiple agents...\n');

  for (const { name, agent } of agents) {
    const detection = await ProtocolDetector.detect(agent);
    console.log(`${name}:`);
    console.log(`  Protocol: ${detection.protocol}`);
    console.log(`  Confidence: ${(detection.confidence * 100).toFixed(1)}%`);
    console.log(`  Reasons: ${detection.reasons.join(', ')}`);
    console.log('');
  }
}

/**
 * Example 5: Protocol Information
 */
async function showProtocolInfo() {
  console.log('\n=== Example 5: Protocol Information ===\n');

  const mcpAdapter = new MCPAdapter();
  await mcpAdapter.initialize({
    protocol: Protocol.MCP,
    atpConfig: { baseUrl: 'http://localhost:3000' }
  });

  const info = mcpAdapter.identify();

  console.log('Protocol Information:');
  console.log(`  Name: ${info.name}`);
  console.log(`  Protocol: ${info.protocol}`);
  console.log(`  Version: ${info.version}`);
  console.log(`  Description: ${info.description}`);
  console.log('  Capabilities:');
  info.capabilities.forEach(cap => console.log(`    - ${cap}`));
  console.log('  Metadata:', JSON.stringify(info.metadata, null, 2));

  await mcpAdapter.cleanup();
}

/**
 * Example 6: Event Filtering
 */
async function filterEvents() {
  console.log('\n=== Example 6: Event Filtering ===\n');

  // Create monitor with event filters
  const monitor = new UniversalMonitor({
    minTrustLevel: 50,
    filters: [
      {
        field: 'type',
        operator: 'eq',
        value: 'mcp.context.update'
      },
      {
        field: 'trustScore',
        operator: 'gt',
        value: 70
      }
    ]
  });

  const mcpAdapter = new MCPAdapter();
  await mcpAdapter.initialize({
    protocol: Protocol.MCP,
    atpConfig: { baseUrl: 'http://localhost:3000' }
  });

  monitor.registerAdapter(Protocol.MCP, mcpAdapter);

  const agent = {
    did: 'did:atp:filtered-agent',
    protocol: Protocol.MCP,
    name: 'Filtered Agent',
    capabilities: ['context']
  };

  const stream = await monitor.monitor(agent);

  console.log('Monitoring with filters:');
  console.log('  - Only context.update events');
  console.log('  - Trust score > 70');
  console.log('\nWaiting for matching events...\n');

  stream.subscribe({
    next: (event) => {
      console.log('Filtered event received:');
      console.log(`  Type: ${event.type}`);
      console.log(`  Trust Score: ${event.trustScore}`);
    }
  });
}

// Run examples
async function main() {
  const example = process.env.EXAMPLE || '1';

  switch (example) {
    case '1':
      await detectAgentProtocol();
      break;
    case '2':
      await monitorMCPAgent();
      break;
    case '3':
      await secureMessageExchange();
      break;
    case '4':
      await detectMultipleProtocols();
      break;
    case '5':
      await showProtocolInfo();
      break;
    case '6':
      await filterEvents();
      break;
    case 'all':
      await detectAgentProtocol();
      await secureMessageExchange();
      await detectMultipleProtocols();
      await showProtocolInfo();
      break;
    default:
      console.log('Usage: EXAMPLE=<1-6|all> node 09-multi-protocol-support.js');
      console.log('\nExamples:');
      console.log('  1 - Protocol Detection');
      console.log('  2 - Monitor MCP Agent');
      console.log('  3 - Secure Message Exchange');
      console.log('  4 - Multi-Protocol Detection');
      console.log('  5 - Protocol Information');
      console.log('  6 - Event Filtering');
      console.log('  all - Run all examples');
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  detectAgentProtocol,
  monitorMCPAgent,
  secureMessageExchange,
  detectMultipleProtocols,
  showProtocolInfo,
  filterEvents
};
