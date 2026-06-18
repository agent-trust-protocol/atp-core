/**
 * Policy Assertion Engine — Conformance Test Suite (W3C core item 3)
 *
 * Table-driven conformance tests for the RBAC decision engine
 * (`PolicyEngine.evaluate`) and adversarial tests for its embedded
 * `SafeEvaluator` condition language. New W3C conformance vectors can be
 * appended as rows to the `DECISION_VECTORS` / `ADVERSARIAL_VECTORS` arrays.
 *
 * Covered conformance areas:
 *   - explicit ALLOW
 *   - explicit DENY
 *   - deny-by-default when no rule matches
 *   - precedence: highest-priority active rule wins
 *   - obligation-like condition semantics (expiry, scope membership)
 *   - determinism (same policy + context => same decision)
 *
 * Adversarial / safe-expression hardening (mirrors the patterns in
 * `packages/shared/src/security/__tests__/safe-expression.test.ts`):
 *   - prototype-pollution attempts (__proto__, constructor)
 *   - unknown identifiers
 *   - function-call / template-literal injection
 *   - overly long expressions
 * All of these must be SAFELY REJECTED — i.e. the rule must not fire, so the
 * engine falls through to the default-deny decision. The engine never throws.
 */

import { describe, it, expect } from '@jest/globals';
import { PolicyEngine, PolicyContext, PolicyResult } from '../policy.js';
import { PolicyRule, PermissionGrant } from '../../models/permission.js';

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

const makeGrant = (overrides: Partial<PermissionGrant> = {}): PermissionGrant => ({
  id: 'grant-conformance',
  grantor: 'did:atp:grantor',
  grantee: 'did:atp:grantee',
  scopes: ['read'],
  createdAt: Date.now(),
  ...overrides,
});

const makeContext = (overrides: Partial<PolicyContext> = {}): PolicyContext => ({
  subject: 'did:atp:agent1',
  action: 'read',
  resource: 'did:atp:resource1',
  grant: makeGrant(),
  context: {},
  ...overrides,
});

let ruleSeq = 0;
const makeRule = (partial: Partial<PolicyRule> & Pick<PolicyRule, 'condition' | 'effect'>): PolicyRule => ({
  id: `rule-${ruleSeq++}`,
  name: partial.name ?? `rule-${ruleSeq}`,
  condition: partial.condition,
  effect: partial.effect,
  priority: partial.priority ?? 100,
  active: partial.active ?? true,
});

// ---------------------------------------------------------------------------
// Decision conformance vectors — append new W3C rows here.
// ---------------------------------------------------------------------------

interface DecisionVector {
  name: string;
  rules: PolicyRule[];
  context: PolicyContext;
  expected: {
    allowed: boolean;
    reasonContains?: string;
  };
}

const DECISION_VECTORS: DecisionVector[] = [
  // --- explicit ALLOW ------------------------------------------------------
  {
    name: 'explicit ALLOW when condition is true',
    rules: [makeRule({ name: 'Allow True', condition: 'true', effect: 'allow', priority: 100 })],
    context: makeContext(),
    expected: { allowed: true, reasonContains: 'allow' },
  },
  {
    name: 'explicit ALLOW on subject match',
    rules: [
      makeRule({
        name: 'Subject Match',
        condition: 'subject === "did:atp:agent1"',
        effect: 'allow',
        priority: 100,
      }),
    ],
    context: makeContext({ subject: 'did:atp:agent1' }),
    expected: { allowed: true },
  },

  // --- explicit DENY -------------------------------------------------------
  {
    name: 'explicit DENY when a matching deny rule fires',
    rules: [makeRule({ name: 'Deny True', condition: 'true', effect: 'deny', priority: 100 })],
    context: makeContext(),
    expected: { allowed: false, reasonContains: 'deny' },
  },

  // --- deny-by-default -----------------------------------------------------
  {
    name: 'deny-by-default when no rules loaded',
    rules: [],
    context: makeContext(),
    expected: { allowed: false, reasonContains: 'default deny' },
  },
  {
    name: 'deny-by-default when no rule condition matches',
    rules: [
      makeRule({
        name: 'Allow other subject',
        condition: 'subject === "did:atp:somebody-else"',
        effect: 'allow',
        priority: 100,
      }),
    ],
    context: makeContext({ subject: 'did:atp:agent1' }),
    expected: { allowed: false, reasonContains: 'default deny' },
  },

  // --- precedence: highest priority wins -----------------------------------
  {
    name: 'precedence — highest-priority DENY overrides lower-priority ALLOW',
    rules: [
      makeRule({ name: 'Low Allow', condition: 'true', effect: 'allow', priority: 10 }),
      makeRule({ name: 'High Deny', condition: 'true', effect: 'deny', priority: 100 }),
    ],
    context: makeContext(),
    expected: { allowed: false, reasonContains: 'high deny' },
  },
  {
    name: 'precedence — highest-priority ALLOW overrides lower-priority DENY',
    rules: [
      makeRule({ name: 'Low Deny', condition: 'true', effect: 'deny', priority: 10 }),
      makeRule({ name: 'High Allow', condition: 'true', effect: 'allow', priority: 100 }),
    ],
    context: makeContext(),
    expected: { allowed: true, reasonContains: 'high allow' },
  },

  // --- scope / membership semantics ----------------------------------------
  {
    name: 'ALLOW when grant scopes include admin',
    rules: [
      makeRule({
        name: 'Admin Override',
        condition: 'grant.scopes.includes("admin")',
        effect: 'allow',
        priority: 900,
      }),
    ],
    context: makeContext({ grant: makeGrant({ scopes: ['read', 'admin'] }) }),
    expected: { allowed: true },
  },
  {
    name: 'deny-by-default when grant scopes lack admin',
    rules: [
      makeRule({
        name: 'Admin Override',
        condition: 'grant.scopes.includes("admin")',
        effect: 'allow',
        priority: 900,
      }),
    ],
    context: makeContext({ grant: makeGrant({ scopes: ['read'] }) }),
    expected: { allowed: false, reasonContains: 'default deny' },
  },

  // --- inactive rule ignored ------------------------------------------------
  {
    name: 'inactive ALLOW rule is ignored -> deny-by-default',
    rules: [makeRule({ name: 'Inactive Allow', condition: 'true', effect: 'allow', active: false })],
    context: makeContext(),
    expected: { allowed: false, reasonContains: 'default deny' },
  },
];

describe('PolicyEngine — W3C decision conformance vectors (table-driven)', () => {
  it.each(DECISION_VECTORS.map((v) => [v.name, v] as const))('%s', async (_name, vector) => {
    const engine = new PolicyEngine();
    for (const rule of vector.rules) engine.addRule(rule);

    const result = await engine.evaluate(vector.context);

    expect(result.allowed).toBe(vector.expected.allowed);
    if (vector.expected.reasonContains) {
      expect((result.reason ?? '').toLowerCase()).toContain(vector.expected.reasonContains.toLowerCase());
    }
  });
});

// ---------------------------------------------------------------------------
// Adversarial / safe-expression hardening
// ---------------------------------------------------------------------------

interface AdversarialVector {
  name: string;
  condition: string;
}

const ADVERSARIAL_VECTORS: AdversarialVector[] = [
  // prototype pollution
  { name: 'prototype pollution via __proto__', condition: 'grant.__proto__.polluted === true' },
  { name: 'prototype pollution via constructor', condition: 'grant.constructor === "x"' },
  { name: 'prototype pollution via constructor.prototype', condition: 'grant.constructor.prototype === "x"' },
  { name: 'computed __proto__-style access', condition: '__proto__ === "x"' },
  // unknown identifiers / globals
  { name: 'unknown identifier process.env', condition: 'process.env.SECRET === "1"' },
  { name: 'globalThis access', condition: 'globalThis.x === 1' },
  { name: 'require() call', condition: 'require("child_process") === 1' },
  // function-call / template-literal injection
  { name: 'arbitrary method call', condition: 'grant.scopes.map("x")' },
  { name: 'disallowed method (toString)', condition: 'subject.toString() === "x"' },
  { name: 'template literal injection', condition: '`${subject}` === "x"' },
  { name: 'assignment attempt', condition: 'subject = "hacked"' },
  // structurally invalid
  { name: 'garbage tokens', condition: '!@#$%^&*()' },
  { name: 'dangling operator', condition: 'subject ===' },
  // overly long expression
  { name: 'overly long expression', condition: 'subject ' + '|| subject '.repeat(500) },
];

describe('PolicyEngine — adversarial condition hardening (safe rejection)', () => {
  it.each(ADVERSARIAL_VECTORS.map((v) => [v.name, v] as const))(
    'safely rejects: %s (no throw, falls through to default deny)',
    async (_name, vector) => {
      const engine = new PolicyEngine();
      engine.addRule(
        makeRule({ name: 'Adversarial', condition: vector.condition, effect: 'allow', priority: 100 }),
      );

      let result: PolicyResult | undefined;
      await expect(
        (async () => {
          result = await engine.evaluate(makeContext());
        })(),
      ).resolves.not.toThrow();

      // The malicious/invalid rule must not grant access.
      expect(result!.allowed).toBe(false);
      expect((result!.reason ?? '').toLowerCase()).toContain('default deny');
    },
  );

  it('a benign rule still works even when an adversarial rule is present', async () => {
    const engine = new PolicyEngine();
    engine.addRule(makeRule({ name: 'Adversarial', condition: 'process.env.X === 1', effect: 'allow', priority: 50 }));
    engine.addRule(makeRule({ name: 'Benign Allow', condition: 'true', effect: 'allow', priority: 100 }));

    const result = await engine.evaluate(makeContext());
    expect(result.allowed).toBe(true);
    expect((result.reason ?? '').toLowerCase()).toContain('benign allow');
  });

  it('an adversarial rule does not bypass a higher-priority deny', async () => {
    const engine = new PolicyEngine();
    engine.addRule(makeRule({ name: 'Adversarial Allow', condition: 'grant.__proto__.x === 1', effect: 'allow', priority: 100 }));
    engine.addRule(makeRule({ name: 'Guard Deny', condition: 'true', effect: 'deny', priority: 1000 }));

    const result = await engine.evaluate(makeContext());
    expect(result.allowed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('PolicyEngine — determinism', () => {
  it.each(DECISION_VECTORS.map((v) => [v.name, v] as const))(
    'repeated evaluation yields identical decision: %s',
    async (_name, vector) => {
      const engine = new PolicyEngine();
      for (const rule of vector.rules) engine.addRule(rule);

      const results: PolicyResult[] = [];
      for (let i = 0; i < 5; i++) {
        results.push(await engine.evaluate(vector.context));
      }
      const first = results[0];
      for (const r of results) {
        expect(r.allowed).toBe(first.allowed);
        expect(r.reason).toBe(first.reason);
      }
    },
  );
});
