/**
 * Simple 3-line ATP Agent Example
 * 
 * This demonstrates the simplified API for creating quantum-safe AI agents
 */

import { Agent } from '../src/index.js';

async function main() {
  console.log('🚀 ATP Simple Agent Demo - 3 Lines of Code!\n');

  try {
    // Line 1: Create a quantum-safe agent
    console.log('Creating quantum-safe agent...');
    const agent = await Agent.create('MyBot');
    console.log(`✅ Agent created with DID: ${agent.getDID()}\n`);

    // Line 2: Send a secure message
    console.log('Sending secure message...');
    await agent.send('did:atp:example-recipient', 'Hello, quantum world!');
    console.log('✅ Message sent securely\n');

    // Line 3: Check trust score
    console.log('Checking trust score...');
    const trustScore = await agent.getTrustScore('did:atp:example-recipient');
    console.log(`✅ Trust score: ${trustScore} (${getTrustLevel(trustScore)})\n`);

    // Bonus: Show additional capabilities
    console.log('📋 Additional capabilities available:');
    console.log('- Grant capabilities: agent.grantCapability(did, capability)');
    console.log('- Issue credentials: agent.issueCredential(did, type, claims)');
    console.log('- Establish trust: agent.establishTrust(did, minLevel)');
    console.log('- Subscribe to events: agent.on(event, handler) [coming soon]');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    console.log('\nMake sure ATP services are running:');
    console.log('  cd agent-trust-protocol && ./start-services.sh');
  }
}

function getTrustLevel(score: number): string {
  if (score === 0) return 'Unknown';
  if (score <= 0.25) return 'Basic';
  if (score <= 0.5) return 'Verified';
  if (score <= 0.75) return 'Trusted';
  return 'Privileged';
}

// Run the example
main().catch(console.error);