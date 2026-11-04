import { registerClawWithAtp } from '../claw-api';
import type { ATPClient } from 'atp-sdk';

function makeMockClient(overrides?: Partial<ATPClient['identity']>): ATPClient {
  const identity = {
    registerAgent: jest.fn().mockResolvedValue({
      did: 'did:atp:test-001',
      publicKey: 'pub-key-abc',
      privateKey: 'priv-key-xyz',
      didDocument: { id: 'did:atp:test-001' }
    }),
    getDID: jest.fn().mockResolvedValue({ id: 'did:atp:test-001' }),
    updateTrustLevel: jest.fn().mockResolvedValue({}),
    ...overrides
  };

  return {
    identity,
    permissions: {
      checkAccess: jest.fn().mockResolvedValue({ allowed: true }),
      grant: jest.fn().mockResolvedValue(undefined),
      getPolicy: jest.fn().mockRejectedValue(new Error('not found')),
      createPolicy: jest.fn().mockResolvedValue({})
    },
    audit: {
      log: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      query: jest.fn(),
      getEvents: jest.fn()
    },
    credentials: { issue: jest.fn(), verify: jest.fn() },
    trust: { getScore: jest.fn(), evaluate: jest.fn() },
    config: {}
  } as unknown as ATPClient;
}

describe('registerClawWithAtp', () => {
  it('returns AgentMetadata with DID, public key, and trust score on success', async () => {
    const client = makeMockClient();

    const result = await registerClawWithAtp(client, {
      name: 'test-claw',
      role: 'researcher',
      trustLevel: 'verified',
      capabilities: ['web-search']
    });

    expect(result.did).toBe('did:atp:test-001');
    expect(result.publicKey).toBe('pub-key-abc');
    expect(result.trustScore).toBeGreaterThan(0);
    expect(result.role).toBe('researcher');
    expect(result.capabilities).toContain('web-search');
    expect(result.registeredAt).toBeInstanceOf(Date);
  });

  it('calls identity.registerAgent with the correct payload', async () => {
    const client = makeMockClient();

    await registerClawWithAtp(client, {
      name: 'my-claw',
      role: 'trader',
      trustLevel: 'elevated'
    });

    expect(client.identity.registerAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'my-claw',
        role: 'trader'
      })
    );
  });

  it('logs an audit event after successful registration', async () => {
    const client = makeMockClient();

    await registerClawWithAtp(client, {
      name: 'audit-claw',
      role: 'researcher'
    });

    expect(client.audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'agent-registered' })
    );
  });

  it('propagates an error if identity.registerAgent rejects', async () => {
    const client = makeMockClient({
      registerAgent: jest.fn().mockRejectedValue(new Error('Identity service unavailable'))
    });

    await expect(
      registerClawWithAtp(client, { name: 'bad-claw', role: 'researcher' })
    ).rejects.toThrow('Identity service unavailable');
  });
});
