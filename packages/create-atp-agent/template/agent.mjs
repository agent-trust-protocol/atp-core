import { Agent } from 'atp-sdk';

import { recordDiagnostic } from './diagnostics.mjs';

let agent;
try {
  agent = await Agent.quickstart('__AGENT_NAME__');
  recordDiagnostic('first_run');
} catch (error) {
  recordDiagnostic('error');
  throw error;
}

// Standalone identity is ephemeral and not remotely resolvable.
// Persist keys securely and connect ATP services before cross-system use.
console.log('Standalone:', agent.isStandalone());
