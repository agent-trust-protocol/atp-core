/**
 * @atp/sdk-lite Example - 3-line quantum-safe agent integration
 */

import { Agent } from './dist/sdk.js';

async function demo() {
  console.log('🚀 ATP SDK-Lite Demo\n');

  // Configure SDK (optional)
  Agent.configure({
    atpServerUrl: 'http://localhost:3000',
    debug: true
  });

  try {
    // 3-line integration example
    const alice = await Agent.create('Alice');
    const bob = await Agent.create('Bob');
    await alice.send(bob, 'Hello from the quantum future!');
    
    console.log('\n✅ Basic Demo Complete!');
    console.log(`Alice DID: ${alice.did}`);
    console.log(`Bob DID: ${bob.did}`);
    console.log(`Quantum-safe: ${alice.isQuantumSafe}`);
    
    // Trust scoring
    const trustScore = await alice.getTrustScore(bob);
    console.log(`Trust Score: ${trustScore}/100`);
    
    // MCP tool request (requires ATP server)
    try {
      const mcpResult = await alice.mcpRequest('search', {
        query: 'quantum computing'
      });
      console.log('MCP Result:', mcpResult);
    } catch (error) {
      console.log('📝 MCP demo skipped (requires ATP server)');
    }
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.log('💡 Make sure ATP server is running: npm run start');
  }
}

demo();