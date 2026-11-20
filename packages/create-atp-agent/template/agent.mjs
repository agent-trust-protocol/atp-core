import { Agent, BUILTIN_PROFILES, evaluateActionWithProfile } from 'atp-sdk';

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

// Local decision preview: no tools are executed by this example.
for (const actionType of ['filesystem', 'shell', 'unmapped']) {
  const result = evaluateActionWithProfile(BUILTIN_PROFILES['safe-default'], {
    actionType, state: 'executing',
  });
  console.log(`Policy preview: ${actionType} => ${result.decision}`);
}
console.log('Your host must enforce these decisions before executing tools.');
