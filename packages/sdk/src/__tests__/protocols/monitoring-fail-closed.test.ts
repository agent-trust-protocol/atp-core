import { createHash } from 'node:crypto';
import { describe, expect, it } from '@jest/globals';
import { SecurityEnforcer, UniversalMonitor } from '../../monitoring/universal-monitor.js';
import type { SecurityConfig } from '../../monitoring/universal-monitor.js';
import { MCPAdapter } from '../../protocols/mcp/mcp-adapter.js';
import { Protocol } from '../../protocols/base/types.js';
import type { AgentEvent, Observable } from '../../protocols/base/types.js';

const event = (): AgentEvent => ({
  id: 'evt_fixture', protocol: Protocol.MCP, type: 'mcp.tool.invoke',
  timestamp: '2026-10-21T00:00:00Z', source: { agentDid: 'did:example:untrusted' },
  data: { operation: 'read', permissions: ['admin'] }, trustScore: 100,
});
const diagnostic: SecurityConfig = {
  minTrustLevel: 0, requireSignatures: false, requirePermissions: false, quantumSafe: false,
};

describe('legacy monitoring requirements fail closed', () => {
  it('rejects the formerly accepted unkeyed digest even with claimed high trust', () => {
    const input = event();
    input.signature = createHash('sha256').update(JSON.stringify({
      id: input.id, protocol: input.protocol, type: input.type, timestamp: input.timestamp,
      source: input.source, data: input.data,
    })).digest('hex');
    expect(new SecurityEnforcer({ ...diagnostic, requireSignatures: true }).enforcePolicy(input))
      .toBe('DENY');
  });

  it.each([
    { requirePermissions: true }, { quantumSafe: true }, { minTrustLevel: 1 },
    { minTrustLevel: NaN }, { minTrustLevel: Infinity }, { minTrustLevel: -1 },
    { minTrustLevel: 101 },
  ])('denies unavailable or invalid required evidence: %j', (requirement) => {
    expect(new SecurityEnforcer({ ...diagnostic, ...requirement }).enforcePolicy(event()))
      .toBe('DENY');
  });

  it('does not let updateConfig silently bypass a required permission check', () => {
    const filter = new SecurityEnforcer(diagnostic);
    expect(filter.enforcePolicy(event())).toBe('ALLOW');
    filter.updateConfig({ requirePermissions: true });
    expect(filter.enforcePolicy(event())).toBe('DENY');
    expect(filter.getConfig().requirePermissions).toBe(true);
  });
});

/** Synchronous transport fixture: no timer, network or production credentials. */
class FixtureAdapter extends MCPAdapter {
  constructor(private readonly input: AgentEvent) { super(); }
  monitor(): Observable<AgentEvent> {
    return {
      subscribe: (observer) => {
        observer.next(this.input);
        return { unsubscribe() {} };
      },
      pipe() { return this; },
    };
  }
}

async function observe(input: AgentEvent, enableSigning: boolean) {
  const adapter = new FixtureAdapter(input);
  await adapter.initialize({ protocol: Protocol.MCP, atpConfig: { baseUrl: 'http://localhost' } });
  const monitor = new UniversalMonitor({ enableSigning, enableAudit: false });
  monitor.registerAdapter(Protocol.MCP, adapter);
  const stream = await monitor.monitor({
    did: input.source.agentDid, protocol: Protocol.MCP, capabilities: [],
  });
  try {
    return await new Promise<{ value?: AgentEvent; error?: Error }>((resolve) => {
      stream.subscribe({ next: (value) => resolve({ value }), error: (error) => resolve({ error }) });
    });
  } finally { await monitor.cleanup(); }
}

describe('monitoring never fabricates security evidence', () => {
  it('reports unavailable signing and never emits a hash as a signature', async () => {
    const input = event();
    const output = await observe(input, true);
    expect(output.value).toBeUndefined();
    expect(output.error?.message).toBe('Monitoring event signing is not implemented');
    expect(input.signature).toBeUndefined();
  });

  it('does not assign protocol-based trust when evidence is absent', async () => {
    const input = event();
    delete input.trustScore;
    const output = await observe(input, false);
    expect(output.error).toBeUndefined();
    expect(output.value?.trustScore).toBe(0);
    expect(output.value?.signature).toBeUndefined();
  });

  it('does not promote a sender-supplied reputation claim into assessed trust', async () => {
    const output = await observe(event(), false);
    expect(output.value?.trustScore).toBe(0);
  });
});
