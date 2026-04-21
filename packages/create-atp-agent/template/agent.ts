import { Agent } from 'atp-sdk';

const agent = await Agent.quickstart('MyBot');

console.log('⚡ MyBot ready!');
console.log('  DID:          ', agent.getDID());
console.log('  Quantum-safe: ', agent.isQuantumSafe());
console.log('  Standalone:   ', agent.isStandalone());

// Trust score example
const score = await agent.getTrustScore(agent.getDID());
console.log('  Trust:        ', score);
