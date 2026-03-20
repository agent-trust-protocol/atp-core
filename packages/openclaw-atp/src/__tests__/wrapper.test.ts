import { wrapSkillWithAtp } from '../claw-api';
import type { ATPClient } from 'atp-sdk';
import type { AgentContext } from '../agent/types';

function makeAgentContext(trustScore = 0.8): AgentContext {
  return {
    atp: {
      did: 'did:atp:agent-123',
      publicKey: 'pub',
      privateKey: 'priv',
      trustScore,
      trustLevel: 'VERIFIED' as const,
      policyProfileId: 'default',
      role: 'researcher',
      capabilities: [],
      registeredAt: new Date(),
      lastTrustUpdate: new Date()
    }
  };
}

function makeMockClient(opts?: {
  getDIDFails?: boolean;
  checkAccessAllowed?: boolean;
}): ATPClient {
  return {
    identity: {
      getDID: opts?.getDIDFails
        ? jest.fn().mockRejectedValue(new Error('not found'))
        : jest.fn().mockResolvedValue({ id: 'did:atp:agent-123' }),
      updateTrustLevel: jest.fn().mockResolvedValue({})
    },
    permissions: {
      checkAccess: jest.fn().mockResolvedValue({
        allowed: opts?.checkAccessAllowed ?? true
      })
    },
    audit: {
      log: jest.fn().mockResolvedValue({ id: 'audit-1' })
    },
    credentials: {},
    trust: {},
    config: {}
  } as unknown as ATPClient;
}

describe('wrapSkillWithAtp', () => {
  it('executes the skill and returns success when allowed', async () => {
    const skill = jest.fn().mockResolvedValue({ data: 'result' });
    const client = makeMockClient({ checkAccessAllowed: true });
    const secured = wrapSkillWithAtp(skill, client, { minTrustScore: 0.5 });

    const result = await secured(makeAgentContext(0.8), { query: 'test' });

    expect(result.success).toBe(true);
    expect(result.result).toEqual({ data: 'result' });
    expect(skill).toHaveBeenCalledWith({ query: 'test' });
  });

  it('blocks execution and returns error when agent identity is invalid', async () => {
    const skill = jest.fn();
    const client = makeMockClient({ getDIDFails: true });
    const secured = wrapSkillWithAtp(skill, client);

    const result = await secured(makeAgentContext(0.9));

    expect(result.success).toBe(false);
    expect(result.error?.message).toMatch(/authentication failed/i);
    expect(skill).not.toHaveBeenCalled();
  });

  it('blocks execution and returns error when permission is denied', async () => {
    const skill = jest.fn();
    const client = makeMockClient({ checkAccessAllowed: false });
    const secured = wrapSkillWithAtp(skill, client);

    const result = await secured(makeAgentContext(0.9));

    expect(result.success).toBe(false);
    expect(result.error?.message).toMatch(/permission denied/i);
    expect(skill).not.toHaveBeenCalled();
  });

  it('blocks execution when trust score is below the minimum', async () => {
    const skill = jest.fn();
    const client = makeMockClient({ checkAccessAllowed: true });
    const secured = wrapSkillWithAtp(skill, client, { minTrustScore: 0.9 });

    const result = await secured(makeAgentContext(0.6));

    expect(result.success).toBe(false);
    expect(result.error?.message).toMatch(/insufficient trust/i);
    expect(skill).not.toHaveBeenCalled();
  });

  it('logs an audit event on every call (allowed or blocked)', async () => {
    const skill = jest.fn().mockResolvedValue('ok');
    const client = makeMockClient({ checkAccessAllowed: true });
    const secured = wrapSkillWithAtp(skill, client);

    await secured(makeAgentContext(0.8));

    expect(client.audit.log).toHaveBeenCalled();
  });
});
