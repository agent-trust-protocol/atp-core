/**
 * Stateful Session Example
 *
 * Demonstrates how enforceAtpPoliciesForClawSession changes which tools
 * are available as an OpenClaw agent moves through its lifecycle states:
 *   planning → executing → communicating → completed
 *
 * Uses a mock ATP client — no real network calls needed to run this example.
 */

import {
  enforceAtpPoliciesForClawSession,
  defaultClawStatePolicy,
  registerClawWithAtp
} from '../src/index.js';
import type { SessionState, ClawSessionContext } from '../src/index.js';
import type { ATPClient } from 'atp-sdk';

// ---------------------------------------------------------------------------
// Mock ATP client (swap for a real initAtpClient() call in production)
// ---------------------------------------------------------------------------
function createMockAtpClient(): ATPClient {
  return {
    identity: {
      registerAgent: async (_opts: Record<string, unknown>) => ({
        did: `did:atp:claw-${Date.now()}`,
        publicKey: 'mock-pub-key',
        privateKey: 'mock-priv-key-encrypted',
        didDocument: { id: `did:atp:claw-${Date.now()}` }
      }),
      getDID: async (did: string) => ({ id: did }),
      updateTrustLevel: async () => ({})
    },
    permissions: {
      checkAccess: async (req: Record<string, unknown>) => ({
        // Allow 'http' but deny 'fs' to demonstrate mixed results
        allowed: req.resource !== 'tool:fs'
      }),
      grant: async () => {},
      getPolicy: async () => { throw new Error('not found'); },
      createPolicy: async () => ({})
    },
    audit: {
      log: async (event: Record<string, unknown>) => {
        console.log(`  [AUDIT] ${event.eventType} — agent: ${event.agentDid}`);
        return { id: `audit-${Date.now()}` };
      },
      query: async () => ({ events: [] }),
      getEvents: async () => []
    },
    credentials: {
      issue: async () => ({}),
      verify: async () => true
    },
    trust: {
      getScore: async () => 0.8,
      evaluate: async () => ({ trustLevel: 'verified' as const, score: 0.8 })
    },
    config: { baseUrl: 'http://localhost:3001' }
  } as unknown as ATPClient;
}

// ---------------------------------------------------------------------------
// Main demo
// ---------------------------------------------------------------------------
async function main() {
  const atpClient = createMockAtpClient();

  // 1. Register the agent
  console.log('=== Registering agent ===');
  const agentMeta = await registerClawWithAtp(atpClient, {
    name: 'research-claw',
    role: 'researcher',
    trustLevel: 'verified',
    capabilities: ['web-search', 'summarise']
  });
  console.log(`Agent DID : ${agentMeta.did}`);
  console.log(`Trust     : ${agentMeta.trustScore} (${agentMeta.trustLevel})\n`);

  const agentDid = agentMeta.did;

  // 2. Walk through all four lifecycle states
  const states: SessionState[] = ['planning', 'executing', 'communicating', 'completed'];

  for (const state of states) {
    console.log(`=== State: ${state.toUpperCase()} ===`);

    const ctx: ClawSessionContext = {
      agentDid,
      state,
      environmentTags: ['demo', 'sandbox'],
      sessionId: `session-${Date.now()}`
    };

    const result = await enforceAtpPoliciesForClawSession(ctx, atpClient);

    console.log(`  Allowed tools    : [${result.allowedTools.join(', ') || 'none'}]`);
    console.log(`  Forbidden tools  : [${result.forbiddenTools.join(', ') || 'none'}]`);
    console.log(`  Requires approval: [${result.requiresApproval.join(', ') || 'none'}]`);
    console.log();
  }

  // 3. Show policy override — unlock 'shell' only during executing (not recommended in prod)
  console.log('=== Custom override: allow shell during executing ===');
  const overrideCtx: ClawSessionContext = {
    agentDid,
    state: 'executing',
    sessionId: 'override-demo'
  };

  const overrideResult = await enforceAtpPoliciesForClawSession(overrideCtx, atpClient, {
    policyOverride: {
      executing: {
        allowedTools: ['http', 'fs', 'shell'],
        restrictedTools: ['shell-dangerous']
      }
    },
    localOnly: true // Skip ATP check for this demo
  });

  console.log(`  Allowed tools    : [${overrideResult.allowedTools.join(', ')}]`);
  console.log(`  Forbidden tools  : [${overrideResult.forbiddenTools.join(', ')}]`);
  console.log();

  // 4. Print the default policy table for reference
  console.log('=== Default state policy ===');
  for (const [s, perms] of Object.entries(defaultClawStatePolicy)) {
    console.log(`  ${s.padEnd(15)} allowed=[${perms.allowedTools.join(', ') || 'none'}]  restricted=[${(perms.restrictedTools ?? []).join(', ')}]`);
  }
}

main().catch(console.error);
