import {
  enforceAtpPoliciesForClawSession,
  defaultClawStatePolicy
} from '../session/enforce';
import type { ATPClient } from 'atp-sdk';
import type { ClawSessionContext, SessionState } from '../session/types';

function makeMockClient(checkAccessAllowed = true): ATPClient {
  return {
    identity: {},
    permissions: {
      checkAccess: jest.fn().mockResolvedValue({ allowed: checkAccessAllowed })
    },
    audit: {
      log: jest.fn().mockResolvedValue({ id: 'audit-1' })
    },
    credentials: {},
    trust: {},
    config: {}
  } as unknown as ATPClient;
}

function makeCtx(state: SessionState): ClawSessionContext {
  return {
    agentDid: 'did:atp:session-agent',
    state,
    sessionId: `test-session-${state}`
  };
}

describe('defaultClawStatePolicy', () => {
  it('has entries for all four states', () => {
    expect(defaultClawStatePolicy.planning).toBeDefined();
    expect(defaultClawStatePolicy.executing).toBeDefined();
    expect(defaultClawStatePolicy.communicating).toBeDefined();
    expect(defaultClawStatePolicy.completed).toBeDefined();
  });

  it('restricts shell/http/fs during planning', () => {
    expect(defaultClawStatePolicy.planning.restrictedTools).toEqual(
      expect.arrayContaining(['shell', 'http', 'fs'])
    );
    expect(defaultClawStatePolicy.planning.allowedTools).toHaveLength(0);
  });
});

describe('enforceAtpPoliciesForClawSession', () => {
  describe('planning state', () => {
    it('returns no allowed tools and restricted shell/http/fs', async () => {
      const client = makeMockClient(true);
      const result = await enforceAtpPoliciesForClawSession(makeCtx('planning'), client);

      expect(result.state).toBe('planning');
      expect(result.allowedTools).toHaveLength(0);
      expect(result.forbiddenTools).toEqual(expect.arrayContaining(['shell', 'http', 'fs']));
    });
  });

  describe('executing state', () => {
    it('allows http and fs when ATP approves', async () => {
      const client = makeMockClient(true);
      const result = await enforceAtpPoliciesForClawSession(makeCtx('executing'), client);

      expect(result.allowedTools).toEqual(expect.arrayContaining(['http', 'fs']));
      expect(result.forbiddenTools).toContain('shell-dangerous');
    });

    it('moves a tool to forbidden when ATP denies it', async () => {
      const client = makeMockClient(false); // ATP denies everything
      const result = await enforceAtpPoliciesForClawSession(makeCtx('executing'), client);

      expect(result.allowedTools).toHaveLength(0);
      expect(result.forbiddenTools).toEqual(expect.arrayContaining(['http', 'fs']));
    });
  });

  describe('communicating state', () => {
    it('allows messaging and flags external-send as requiring approval', async () => {
      const client = makeMockClient(true);
      const result = await enforceAtpPoliciesForClawSession(makeCtx('communicating'), client);

      expect(result.allowedTools).toContain('messaging');
      expect(result.requiresApproval).toContain('external-send');
    });
  });

  describe('completed state', () => {
    it('allows only read-only-logs and restricts shell/fs/http', async () => {
      const client = makeMockClient(true);
      const result = await enforceAtpPoliciesForClawSession(makeCtx('completed'), client);

      expect(result.allowedTools).toContain('read-only-logs');
      expect(result.forbiddenTools).toEqual(expect.arrayContaining(['shell', 'fs', 'http']));
    });
  });

  describe('localOnly mode', () => {
    it('skips ATP permission check and uses local policy only', async () => {
      const client = makeMockClient(false); // would deny if called
      const result = await enforceAtpPoliciesForClawSession(
        makeCtx('executing'),
        client,
        { localOnly: true }
      );

      expect(client.permissions.checkAccess).not.toHaveBeenCalled();
      // Local policy says http and fs are allowed
      expect(result.allowedTools).toEqual(expect.arrayContaining(['http', 'fs']));
    });
  });

  describe('policyOverride', () => {
    it('deep-merges overrides so non-overridden states keep defaults', async () => {
      const client = makeMockClient(true);
      const result = await enforceAtpPoliciesForClawSession(
        makeCtx('planning'),
        client,
        {
          localOnly: true,
          policyOverride: {
            planning: { allowedTools: ['read-only'], restrictedTools: ['shell'] }
          }
        }
      );

      expect(result.allowedTools).toContain('read-only');
      expect(result.forbiddenTools).toContain('shell');
    });
  });

  describe('audit logging', () => {
    it('always logs a session-policy-enforced event', async () => {
      const client = makeMockClient(true);
      await enforceAtpPoliciesForClawSession(makeCtx('executing'), client);

      expect(client.audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'session-policy-enforced' })
      );
    });
  });

  describe('result shape', () => {
    it('includes agentDid, state, and evaluatedAt timestamp', async () => {
      const client = makeMockClient(true);
      const result = await enforceAtpPoliciesForClawSession(makeCtx('completed'), client);

      expect(result.agentDid).toBe('did:atp:session-agent');
      expect(result.state).toBe('completed');
      expect(result.evaluatedAt).toBeInstanceOf(Date);
    });
  });
});
