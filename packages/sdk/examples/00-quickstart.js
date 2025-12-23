// Minimal quickstart smoke test for atp-sdk
// Run with: node packages/sdk/examples/00-quickstart.js

import { Agent } from 'atp-sdk';

async function main() {
  try {
    const agent = await Agent.create('quickstart-bot');
    console.log('✅ Agent created:', agent.getDID());
    console.log('✅ Quantum-safe:', agent.isQuantumSafe() ? 'Yes (hybrid Ed25519 + ML-DSA)' : 'No (Ed25519 only)');

    const trust = await agent.getTrustScore('did:atp:example:other');
    console.log('Trust score sample:', trust);

    console.log('\n🎉 Quickstart smoke test completed.');
    console.log('   Your agent is using quantum-safe cryptography by default!');
  } catch (err) {
    console.error('❌ Quickstart failed:', err?.message || err);
    if (err?.message?.includes('ECONNREFUSED') || err?.message?.includes('fetch')) {
      console.error('\nHint: ATP services are not running. Start them with:');
      console.error('   docker compose up -d');
      console.error('\nOr set environment variables to point to remote services.');
    } else {
      console.error('\nHint: Ensure local services are running (see docker-compose.yml) or set ATP_* URLs.');
    }
    process.exitCode = 1;
  }
}

main();


