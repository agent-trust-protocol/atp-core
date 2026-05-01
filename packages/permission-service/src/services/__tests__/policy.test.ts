import { PolicyEngine, PolicyContext } from '../policy.js';
import { PermissionGrant } from '../../models/permission.js';

const makeGrant = (overrides: Partial<PermissionGrant> = {}): PermissionGrant => ({
  id: 'grant-1',
  grantor: 'did:atp:grantor',
  grantee: 'did:atp:grantee',
  scopes: ['read'],
  createdAt: Date.now(),
  ...overrides
});

const makeContext = (overrides: Partial<PolicyContext> = {}): PolicyContext => ({
  subject: 'did:atp:agent1',
  action: 'read',
  resource: 'did:atp:resource1',
  grant: makeGrant(),
  context: {},
  ...overrides
});

describe('PolicyEngine', () => {
  let engine: PolicyEngine;

  beforeEach(() => {
    engine = new PolicyEngine();
  });

  describe('addRule / removeRule', () => {
    it('adds an active rule and uses it during evaluation', async () => {
      engine.addRule({
        id: 'rule-allow-all',
        name: 'Allow All',
        condition: 'true',
        effect: 'allow',
        priority: 100,
        active: true
      });

      const result = await engine.evaluate(makeContext());
      expect(result.allowed).toBe(true);
    });

    it('ignores inactive rules', async () => {
      engine.addRule({
        id: 'rule-inactive',
        name: 'Inactive Rule',
        condition: 'true',
        effect: 'allow',
        priority: 100,
        active: false
      });

      const result = await engine.evaluate(makeContext());
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/default deny/i);
    });

    it('removes a rule so it no longer applies', async () => {
      engine.addRule({
        id: 'rule-temp',
        name: 'Temporary Rule',
        condition: 'true',
        effect: 'allow',
        priority: 100,
        active: true
      });

      engine.removeRule('rule-temp');

      const result = await engine.evaluate(makeContext());
      expect(result.allowed).toBe(false);
    });
  });

  describe('evaluate', () => {
    it('returns default deny when no rules are loaded', async () => {
      const result = await engine.evaluate(makeContext());
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/default deny/i);
    });

    it('respects rule priority — highest priority wins', async () => {
      engine.addRule({
        id: 'low-priority-allow',
        name: 'Low Allow',
        condition: 'true',
        effect: 'allow',
        priority: 10,
        active: true
      });
      engine.addRule({
        id: 'high-priority-deny',
        name: 'High Deny',
        condition: 'true',
        effect: 'deny',
        priority: 100,
        active: true
      });

      const result = await engine.evaluate(makeContext());
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/high deny/i);
    });

    it('evaluates condition expressions using context values', async () => {
      engine.addRule({
        id: 'subject-match',
        name: 'Subject Match',
        condition: 'subject == "did:atp:agent1"',
        effect: 'allow',
        priority: 100,
        active: true
      });

      const result = await engine.evaluate(makeContext({ subject: 'did:atp:agent1' }));
      expect(result.allowed).toBe(true);
    });

    it('denies when condition expression is false', async () => {
      engine.addRule({
        id: 'subject-no-match',
        name: 'Subject No Match',
        condition: 'subject == "did:atp:other"',
        effect: 'allow',
        priority: 100,
        active: true
      });

      const result = await engine.evaluate(makeContext({ subject: 'did:atp:agent1' }));
      expect(result.allowed).toBe(false);
    });

    it('gracefully skips rules with invalid expressions', async () => {
      engine.addRule({
        id: 'bad-rule',
        name: 'Bad Expression',
        condition: '!@#$%^&*()',
        effect: 'allow',
        priority: 100,
        active: true
      });

      // Should not throw, should fall through to default deny
      const result = await engine.evaluate(makeContext());
      expect(result.allowed).toBe(false);
    });

    it('allow rule with deny effect returns allowed: false', async () => {
      engine.addRule({
        id: 'explicit-deny',
        name: 'Explicit Deny',
        condition: 'true',
        effect: 'deny',
        priority: 100,
        active: true
      });

      const result = await engine.evaluate(makeContext());
      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/explicit deny/i);
    });
  });

  describe('getDefaultRules', () => {
    it('returns three default rules', () => {
      const rules = engine.getDefaultRules();
      expect(rules).toHaveLength(3);
    });

    it('default rules all have required fields', () => {
      const rules = engine.getDefaultRules();
      for (const rule of rules) {
        expect(rule.id).toBeDefined();
        expect(rule.condition).toBeDefined();
        expect(['allow', 'deny']).toContain(rule.effect);
        expect(typeof rule.priority).toBe('number');
      }
    });
  });
});
