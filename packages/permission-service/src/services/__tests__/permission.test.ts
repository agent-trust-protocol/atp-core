import { PermissionService } from '../permission.js';
import { PermissionGrant, PolicyRule, PermissionRequest, PermissionCheck } from '../../models/permission.js';

// Minimal in-memory storage mock
const makeStorageMock = () => {
  const grants = new Map<string, PermissionGrant>();
  const rules = new Map<string, PolicyRule>();

  return {
    storeGrant: jest.fn(async (grant: PermissionGrant) => { grants.set(grant.id, grant); }),
    getGrant: jest.fn(async (id: string) => grants.get(id) ?? null),
    getGrantsForSubject: jest.fn(async (subject: string) =>
      Array.from(grants.values()).filter(g => g.grantee === subject)
    ),
    revokeGrant: jest.fn(async (id: string) => {
      const g = grants.get(id);
      if (g) grants.set(id, { ...g, revokedAt: Date.now() });
    }),
    storePolicyRule: jest.fn(async (rule: PolicyRule) => { rules.set(rule.id, rule); }),
    removePolicyRule: jest.fn(async (id: string) => { rules.delete(id); }),
    listPolicyRules: jest.fn(async () => Array.from(rules.values())),
  };
};

const SECRET = 'test-secret-key-for-jwt-32-chars!!';

describe('PermissionService', () => {
  let service: PermissionService;
  let storage: ReturnType<typeof makeStorageMock>;

  beforeEach(() => {
    storage = makeStorageMock();
    service = new PermissionService(storage as any, SECRET);
  });

  describe('grantPermission', () => {
    it('stores the grant and returns allowed: true with a token', async () => {
      const req: PermissionRequest = {
        grantor: 'did:atp:grantor',
        grantee: 'did:atp:grantee',
        scopes: ['read'],
        resource: 'did:atp:resource1',
      };

      const result = await service.grantPermission(req);

      expect(result.allowed).toBe(true);
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(storage.storeGrant).toHaveBeenCalledTimes(1);
    });

    it('creates a grant with the correct grantor and grantee', async () => {
      const req: PermissionRequest = {
        grantor: 'did:atp:alice',
        grantee: 'did:atp:bob',
        scopes: ['write'],
      };

      await service.grantPermission(req);

      const storedGrant = storage.storeGrant.mock.calls[0][0] as PermissionGrant;
      expect(storedGrant.grantor).toBe('did:atp:alice');
      expect(storedGrant.grantee).toBe('did:atp:bob');
      expect(storedGrant.scopes).toContain('write');
    });
  });

  describe('checkPermission', () => {
    it('returns allowed: false when no grants exist', async () => {
      const check: PermissionCheck = {
        subject: 'did:atp:unknown',
        action: 'read',
      };

      const result = await service.checkPermission(check);
      expect(result.allowed).toBe(false);
    });

    it('returns allowed: true when a matching active grant exists', async () => {
      // Grant first
      await service.grantPermission({
        grantor: 'did:atp:owner',
        grantee: 'did:atp:agent',
        scopes: ['read'],
        resource: 'did:atp:doc1',
      });

      // Load rules so policy engine can evaluate
      await service.loadPolicyRules();

      // Add a permissive policy rule so engine doesn't default-deny
      await service.addPolicyRule({
        id: 'allow-all',
        name: 'Allow All',
        condition: 'true',
        effect: 'allow',
        priority: 100,
        active: true,
      });

      const check: PermissionCheck = {
        subject: 'did:atp:agent',
        action: 'read',
        resource: 'did:atp:doc1',
      };

      const result = await service.checkPermission(check);
      expect(result.allowed).toBe(true);
    });

    it('respects scope wildcard — admin grants access to any action', async () => {
      await service.grantPermission({
        grantor: 'did:atp:root',
        grantee: 'did:atp:admin-agent',
        scopes: ['admin'],
      });

      await service.addPolicyRule({
        id: 'allow-all',
        name: 'Allow All',
        condition: 'true',
        effect: 'allow',
        priority: 100,
        active: true,
      });

      const check: PermissionCheck = {
        subject: 'did:atp:admin-agent',
        action: 'write',
      };

      const result = await service.checkPermission(check);
      expect(result.allowed).toBe(true);
    });

    it('ignores expired grants', async () => {
      const pastTimestamp = Date.now() - 1000; // 1 second ago
      const expiredGrant: PermissionGrant = {
        id: 'expired-grant',
        grantor: 'did:atp:owner',
        grantee: 'did:atp:agent',
        scopes: ['read'],
        createdAt: Date.now() - 10000,
        expiresAt: pastTimestamp,
      };
      storage.getGrantsForSubject.mockResolvedValueOnce([expiredGrant]);

      const result = await service.checkPermission({
        subject: 'did:atp:agent',
        action: 'read',
      });

      expect(result.allowed).toBe(false);
    });

    it('ignores revoked grants', async () => {
      const revokedGrant: PermissionGrant = {
        id: 'revoked-grant',
        grantor: 'did:atp:owner',
        grantee: 'did:atp:agent',
        scopes: ['read'],
        createdAt: Date.now() - 10000,
        revokedAt: Date.now() - 5000,
      };
      storage.getGrantsForSubject.mockResolvedValueOnce([revokedGrant]);

      const result = await service.checkPermission({
        subject: 'did:atp:agent',
        action: 'read',
      });

      expect(result.allowed).toBe(false);
    });
  });

  describe('revokePermission', () => {
    it('revokes a grant when called by the grantor', async () => {
      const grant: PermissionGrant = {
        id: 'grant-to-revoke',
        grantor: 'did:atp:grantor',
        grantee: 'did:atp:grantee',
        scopes: ['read'],
        createdAt: Date.now(),
      };
      storage.getGrant.mockResolvedValueOnce(grant);

      await expect(
        service.revokePermission('grant-to-revoke', 'did:atp:grantor')
      ).resolves.not.toThrow();

      expect(storage.revokeGrant).toHaveBeenCalledWith('grant-to-revoke');
    });

    it('revokes a grant when called by the grantee', async () => {
      const grant: PermissionGrant = {
        id: 'grant-to-revoke',
        grantor: 'did:atp:grantor',
        grantee: 'did:atp:grantee',
        scopes: ['read'],
        createdAt: Date.now(),
      };
      storage.getGrant.mockResolvedValueOnce(grant);

      await expect(
        service.revokePermission('grant-to-revoke', 'did:atp:grantee')
      ).resolves.not.toThrow();
    });

    it('throws when a third party tries to revoke', async () => {
      const grant: PermissionGrant = {
        id: 'grant-to-revoke',
        grantor: 'did:atp:grantor',
        grantee: 'did:atp:grantee',
        scopes: ['read'],
        createdAt: Date.now(),
      };
      storage.getGrant.mockResolvedValueOnce(grant);

      await expect(
        service.revokePermission('grant-to-revoke', 'did:atp:attacker')
      ).rejects.toThrow(/only grantor or grantee/i);
    });

    it('throws when grant does not exist', async () => {
      storage.getGrant.mockResolvedValueOnce(null);

      await expect(
        service.revokePermission('nonexistent', 'did:atp:anyone')
      ).rejects.toThrow(/grant not found/i);
    });
  });

  describe('scopeMatches (via checkPermission)', () => {
    const setupAndCheck = async (grantedScopes: any[], action: any) => {
      const grant: PermissionGrant = {
        id: 'scope-test-grant',
        grantor: 'did:atp:owner',
        grantee: 'did:atp:subject',
        scopes: grantedScopes,
        createdAt: Date.now(),
      };
      storage.getGrantsForSubject.mockResolvedValueOnce([grant]);

      await service.addPolicyRule({
        id: 'allow-all',
        name: 'Allow All',
        condition: 'true',
        effect: 'allow',
        priority: 100,
        active: true,
      });

      return service.checkPermission({ subject: 'did:atp:subject', action });
    };

    it('matches exact scope', async () => {
      const result = await setupAndCheck(['identity:read'], 'identity:read');
      expect(result.allowed).toBe(true);
    });

    it('matches namespace wildcard (identity:* covers identity:read)', async () => {
      const result = await setupAndCheck(['identity:*' as any], 'identity:read');
      expect(result.allowed).toBe(true);
    });

    it('does not match a different namespace wildcard', async () => {
      const result = await setupAndCheck(['vc:*' as any], 'identity:read');
      expect(result.allowed).toBe(false);
    });
  });
});
