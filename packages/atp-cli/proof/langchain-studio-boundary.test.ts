/** Boundary tests: real LangChain + SDK crypto, simulated Guardian responses. */
import { describe, expect, it } from 'vitest';
import { createAgent, FakeToolCallingModel, tool } from 'langchain';
import { z } from 'zod';
import { AgentActionClient } from '@atp/sdk/runtime';
import { KmsSigner, jcsBytes, verifyRaw } from '@atp/crypto';
import { studioToolBoundary } from './langchain-studio-boundary.mjs';

describe('existing LangChain tool / real Studio SDK boundary (not live Guardian)', () => {
  for (const mode of ['ALLOW', 'DENY', 'unavailable', 'malformed', 'unmapped'] as const) {
    it(`${mode}: verifies signed request and original handler count`, async () => {
      const did = 'did:atp:agt_boundary';
      const signer = KmsSigner.generate(`${did}#key-1`);
      let calls = 0;
      let requests = 0;
      const client = new AgentActionClient({ baseUrl: 'http://127.0.0.1:3000',
        tenantId: 'ten_boundary', agentDid: did, signer,
        fetchImpl: async (_url, init) => {
          requests++;
          const input = JSON.parse(String(init?.body));
          const { signature, ...assertion } = input.assertion;
          expect(verifyRaw(await signer.publicKey(), jcsBytes({
            domain: 'atp.agent-action.v1', method: 'POST', path: '/v1/agent-authorize',
            ...assertion, body: { action: input.action, actionKind: input.actionKind,
              requiredScope: input.requiredScope, jti: null },
          }), Buffer.from(signature, 'base64url'))).toBe(true);
          expect(init?.credentials).toBe('omit');
          expect(input.action).toBe('tool.inventory_read');
          if (mode === 'unavailable') throw Error('test transport unavailable');
          return new Response(JSON.stringify(mode === 'malformed' ? {} : {
            decision: mode === 'ALLOW' ? 'ALLOW' : 'DENY', reasonCode: 'scope_missing',
            trace: [
              { step: 'identity_verification', outcome: 'pass', ms: 1 },
              { step: 'policy_assertion', outcome: 'pass', ms: 1 },
              { step: 'token_issuance', outcome: 'skipped', ms: 1 },
              { step: 'audit_commit', outcome: 'pass', ms: 1 },
            ], auditEventId: 'evt_boundary_simulated', latencyMs: 4, trustScoreAt: null,
          }), { status: 200 });
        },
      });
      // Original tool exists before ATP middleware; the handler is never replaced.
      const original = tool(async ({ item }) => {
        calls++;
        expect(item).toBe('fixture');
        return 'fixture result';
      }, { name: 'inventory_read', description: 'Read isolated fixture', schema: z.object({ item: z.string() }) });
      const agent = createAgent({
        model: new FakeToolCallingModel({ toolCalls: [[{
          name: 'inventory_read', args: { item: 'fixture' }, id: 'call_fixture', type: 'tool_call',
        }], []] }), tools: [original], middleware: [studioToolBoundary({ client, agentDid: did,
          scopes: mode === 'unmapped' ? { other: 'read' } : { inventory_read: 'read' } })],
      });
      try { await agent.invoke({ messages: [{ role: 'user', content: 'Read fixture' }] }); }
      catch (error) { if (mode === 'ALLOW') throw error; }
      expect(calls).toBe(mode === 'ALLOW' ? 1 : 0);
      expect(requests).toBe(mode === 'unmapped' ? 0 : 1);
    });
  }
});
