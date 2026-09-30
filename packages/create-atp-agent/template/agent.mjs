import { Agent } from 'atp-sdk';

const agent = await Agent.quickstart('__AGENT_NAME__');

// Standalone identity is ephemeral and not remotely resolvable.
// Persist keys securely and connect ATP services before cross-system use.
console.log('Standalone:', agent.isStandalone());
