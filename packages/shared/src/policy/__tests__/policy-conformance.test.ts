/**
 * Policy Assertion Engine — Conformance Suite (ATP Item C)
 *
 * Table-driven conformance tests for the runtime PolicyEvaluator. The intent is
 * that W3C / external conformance vectors can later be dropped in as additional
 * rows of the `it.each([...])` tables below without restructuring the suite.
 *
 * The decision semantics pinned down here:
 *   - allow / deny decisions for representative inputs
 *   - explicit deny-by-default (an action with no matching allow rule is denied)
 *   - obligation handling (obligations returned on allow)
 *   - adversarial / malicious policy expressions are REJECTED (not evaluated),
 *     reusing the safe-expression sandbox patterns.
 *
 * These tests intentionally call only the real public API of the engine
 * (`PolicyEvaluator.evaluatePolicy`) and the schema-validated types — no
 * private internals are reached into.
 */

import { describe, it, expect } from '@jest/globals';
import { randomUUID } from 'crypto';
import {
  PolicyEvaluator,
  PolicyEvaluationContext,
  PolicyEvaluationResult,
} from '../policy-evaluator.js';
import {
  ATPVisualPolicy,
  VisualPolicyRule,
  VisualPolicyCondition,
  VisualPolicyActionType,
  VisualPolicyTrustLevel,
} from '../visual-policy-schema.js';
import { evaluateSafeExpression } from '../../security/safe-expression.js';

// ---------------------------------------------------------------------------
// Builders — keep conformance rows terse and declarative.
// ---------------------------------------------------------------------------

const now = '2026-06-19T12:00:00.000Z';

function makeContext(overrides: Partial<PolicyEvaluationContext> = {}): PolicyEvaluationContext {
  return {
    agentDID: 'did:atp:agent-1',
    trustLevel: 'VERIFIED',
    credentials: [],
    tool: {
      id: 'database_query',
      type: 'database',
      sensitivity: 'internal',
    },
    requestedAction: 'read',
    organizationId: 'org_test',
    timestamp: now,
    ...overrides,
  };
}

function rule(
  condition: VisualPolicyRule['condition'],
  action: VisualPolicyActionType,
  overrides: Partial<VisualPolicyRule> = {}
): VisualPolicyRule {
  return {
    id: randomUUID(),
    name: 'rule',
    enabled: true,
    priority: 100,
    condition,
    action,
    tags: [],
    createdAt: now,
    updatedAt: now,
    createdBy: 'did:atp:creator',
    version: '1.0.0',
    ...overrides,
  };
}

function policy(
  rules: VisualPolicyRule[],
  overrides: Partial<ATPVisualPolicy> = {}
): ATPVisualPolicy {
  return {
    id: randomUUID(),
    name: 'conformance-policy',
    version: '1.0.0',
    organizationId: 'org_test',
    createdBy: 'did:atp:creator',
    createdAt: now,
    updatedAt: now,
    enabled: true,
    defaultAction: 'deny',
    evaluationMode: 'priority_order',
    rules,
    tags: [],
    testCases: [],
    auditLog: [],
    ...overrides,
  };
}

const allow: VisualPolicyActionType = { id: randomUUID(), type: 'allow' };
const deny: VisualPolicyActionType = {
  id: randomUUID(),
  type: 'deny',
  reason: 'denied',
  notifyAdmin: false,
};

function trustCond(
  operator: VisualPolicyCondition['operator'],
  value: VisualPolicyTrustLevel | number
): VisualPolicyCondition {
  return { id: randomUUID(), type: 'trust_level', operator, value } as VisualPolicyCondition;
}

function toolCond(value: string): VisualPolicyCondition {
  return { id: randomUUID(), type: 'tool', operator: 'equals', value } as VisualPolicyCondition;
}

async function evalPolicy(
  p: ATPVisualPolicy,
  ctx: PolicyEvaluationContext
): Promise<PolicyEvaluationResult> {
  return new PolicyEvaluator().evaluatePolicy(p, ctx);
}

// ===========================================================================
// 1. ALLOW / DENY decisions for representative inputs
// ===========================================================================

interface DecisionCase {
  name: string;
  policy: ATPVisualPolicy;
  context: PolicyEvaluationContext;
  expected: PolicyEvaluationResult['decision'];
}

const decisionCases: DecisionCase[] = [
  {
    name: 'allow when trust level meets threshold (priority_order)',
    policy: policy([rule(trustCond('greater_than_or_equal', 'VERIFIED'), allow)]),
    context: makeContext({ trustLevel: 'TRUSTED', trustScore: 3 }),
    expected: 'allow',
  },
  {
    name: 'deny when trust level below threshold, explicit deny rule matches',
    policy: policy([rule(trustCond('less_than', 'VERIFIED'), deny)]),
    context: makeContext({ trustLevel: 'BASIC', trustScore: 1 }),
    expected: 'deny',
  },
  {
    name: 'allow on exact tool match',
    policy: policy([rule(toolCond('database_query'), allow)]),
    context: makeContext({ tool: { id: 'database_query', type: 'database', sensitivity: 'internal' } }),
    expected: 'allow',
  },
  {
    name: 'higher-priority deny wins over lower-priority allow (priority_order)',
    policy: policy([
      rule(trustCond('greater_than_or_equal', 'BASIC'), allow, { priority: 200, name: 'broad-allow' }),
      rule(toolCond('database_query'), deny, { priority: 10, name: 'tool-deny' }),
    ]),
    context: makeContext({ trustLevel: 'TRUSTED', trustScore: 3 }),
    expected: 'deny',
  },
  {
    name: 'first_match returns the FIRST matching rule and skips later matches (first wins)',
    // A second rule that ALSO matches the context but denies must be skipped;
    // if the engine fell back to all_rules-style combining, this would flip to deny.
    policy: policy(
      [
        rule(toolCond('database_query'), allow),
        rule(toolCond('database_query'), deny),
      ],
      { evaluationMode: 'first_match' }
    ),
    context: makeContext(),
    expected: 'allow',
  },
  {
    name: 'all_rules: any deny among matches yields deny',
    policy: policy(
      [
        rule(trustCond('greater_than_or_equal', 'BASIC'), allow),
        rule(toolCond('database_query'), deny),
      ],
      { evaluationMode: 'all_rules' }
    ),
    context: makeContext({ trustLevel: 'TRUSTED', trustScore: 3 }),
    expected: 'deny',
  },
  {
    name: 'disabled policy denies regardless of rules',
    policy: policy([rule(trustCond('greater_than_or_equal', 'UNKNOWN'), allow)], { enabled: false }),
    context: makeContext(),
    expected: 'deny',
  },
  {
    name: 'require_approval decision surfaces from matching rule',
    policy: policy([
      rule(toolCond('database_query'), {
        id: randomUUID(),
        type: 'require_approval',
        approvers: ['did:atp:admin'],
      } as VisualPolicyActionType),
    ]),
    context: makeContext(),
    expected: 'require_approval',
  },
];

describe('Policy conformance — allow/deny decisions', () => {
  it.each(decisionCases)('$name', async ({ policy: p, context, expected }) => {
    const result = await evalPolicy(p, context);
    expect(result.decision).toBe(expected);
  });
});

// ===========================================================================
// 2. EXPLICIT DENY-BY-DEFAULT
//    An action with no matching allow rule MUST be denied.
// ===========================================================================

interface DenyByDefaultCase {
  name: string;
  policy: ATPVisualPolicy;
  context: PolicyEvaluationContext;
}

const denyByDefaultCases: DenyByDefaultCase[] = [
  {
    name: 'priority_order with no matching rule falls through to default deny',
    // Rule requires PRIVILEGED; context is BASIC → no rule matches.
    policy: policy([rule(trustCond('greater_than_or_equal', 'PRIVILEGED'), allow)], {
      defaultAction: 'deny',
    }),
    context: makeContext({ trustLevel: 'BASIC', trustScore: 1 }),
  },
  {
    name: 'first_match with no matching rule denies',
    policy: policy([rule(toolCond('some_other_tool'), allow)], {
      evaluationMode: 'first_match',
    }),
    context: makeContext({ tool: { id: 'database_query', type: 'database', sensitivity: 'internal' } }),
  },
  {
    name: 'all_rules with zero matches denies (no allow present)',
    policy: policy([rule(toolCond('nonexistent_tool'), allow)], {
      evaluationMode: 'all_rules',
    }),
    context: makeContext(),
  },
  {
    name: 'only non-decisive (log) rule matches → falls through to default deny',
    policy: policy(
      [
        rule(toolCond('database_query'), {
          id: randomUUID(),
          type: 'log',
        } as VisualPolicyActionType),
      ],
      { defaultAction: 'deny' }
    ),
    context: makeContext(),
  },
];

describe('Policy conformance — explicit deny-by-default', () => {
  it.each(denyByDefaultCases)('$name', async ({ policy: p, context }) => {
    const result = await evalPolicy(p, context);
    expect(result.decision).toBe('deny');
  });

  it('honors an explicit defaultAction of allow only when configured (sanity guard)', async () => {
    // This confirms deny-by-default is the configured-default behavior, not an
    // accident: when the policy author opts into defaultAction:allow with no
    // matching rule, the engine allows. The secure default remains 'deny'.
    const allowDefault = policy([rule(trustCond('greater_than_or_equal', 'PRIVILEGED'), allow)], {
      defaultAction: 'allow',
    });
    const result = await evalPolicy(allowDefault, makeContext({ trustLevel: 'BASIC', trustScore: 1 }));
    expect(result.decision).toBe('allow');
  });

  it('defaultAction:allow does NOT govern first_match / all_rules fallthrough (engine boundary)', async () => {
    // Conformance boundary: in the current engine `defaultAction` is honored
    // only in priority_order mode. first_match and all_rules hard-deny on a
    // no-match regardless of the field. Pinning this prevents a false reading
    // that `defaultAction` governs fallthrough in all three modes — if a future
    // change made these modes honor it, this row would catch the behavior shift.
    for (const evaluationMode of ['first_match', 'all_rules'] as const) {
      const p = policy([rule(toolCond('some_other_tool'), allow)], {
        evaluationMode,
        defaultAction: 'allow',
      });
      const result = await evalPolicy(
        p,
        makeContext({ tool: { id: 'database_query', type: 'database', sensitivity: 'internal' } })
      );
      expect(result.decision).toBe('deny');
    }
  });
});

// ===========================================================================
// 3. OBLIGATION HANDLING
//    Obligations must be returned/enforced alongside an allow decision.
// ===========================================================================

interface ObligationCase {
  name: string;
  action: VisualPolicyActionType;
  expectedDecision: PolicyEvaluationResult['decision'];
  expectedObligationTypes: string[];
}

const obligationCases: ObligationCase[] = [
  {
    name: 'allow with requireMFA yields mfa_required obligation',
    action: {
      id: randomUUID(),
      type: 'allow',
      conditions: { requireMFA: true },
    } as VisualPolicyActionType,
    expectedDecision: 'allow',
    expectedObligationTypes: ['mfa_required'],
  },
  {
    name: 'allow with timeLimit + usageLimit yields both obligations',
    action: {
      id: randomUUID(),
      type: 'allow',
      conditions: { timeLimit: 60, usageLimit: 10 },
    } as VisualPolicyActionType,
    expectedDecision: 'allow',
    expectedObligationTypes: ['time_limit', 'usage_limit'],
  },
  {
    name: 'allow with all conditions yields mfa + time + usage obligations',
    action: {
      id: randomUUID(),
      type: 'allow',
      conditions: { requireMFA: true, timeLimit: 30, usageLimit: 5 },
    } as VisualPolicyActionType,
    expectedDecision: 'allow',
    expectedObligationTypes: ['mfa_required', 'time_limit', 'usage_limit'],
  },
  {
    name: 'plain allow yields no obligations',
    action: { id: randomUUID(), type: 'allow' },
    expectedDecision: 'allow',
    expectedObligationTypes: [],
  },
];

describe('Policy conformance — obligation handling', () => {
  it.each(obligationCases)('$name', async ({ action, expectedDecision, expectedObligationTypes }) => {
    const p = policy([rule(toolCond('database_query'), action)]);
    const result = await evalPolicy(p, makeContext());

    expect(result.decision).toBe(expectedDecision);
    const types = (result.obligations ?? []).map(o => o.type).sort();
    expect(types).toEqual([...expectedObligationTypes].sort());
  });

  it('carries obligation parameters through (time_limit minutes)', async () => {
    const action: VisualPolicyActionType = {
      id: randomUUID(),
      type: 'allow',
      conditions: { timeLimit: 45 },
    } as VisualPolicyActionType;
    const result = await evalPolicy(policy([rule(toolCond('database_query'), action)]), makeContext());
    const timeLimit = (result.obligations ?? []).find(o => o.type === 'time_limit');
    expect(timeLimit?.parameters).toEqual({ minutes: 45 });
  });

  it('carries obligation parameters through (usage_limit count)', async () => {
    const action: VisualPolicyActionType = {
      id: randomUUID(),
      type: 'allow',
      conditions: { usageLimit: 10 },
    } as VisualPolicyActionType;
    const result = await evalPolicy(policy([rule(toolCond('database_query'), action)]), makeContext());
    const usageLimit = (result.obligations ?? []).find(o => o.type === 'usage_limit');
    expect(usageLimit?.parameters).toEqual({ count: 10 });
  });
});

// ===========================================================================
// 4. ADVERSARIAL / MALICIOUS POLICY EXPRESSIONS
//    Expressions feeding the sandbox must be REJECTED, never evaluated against
//    the host runtime. Mirrors packages/shared/src/security/safe-expression.
// ===========================================================================

interface AdversarialCase {
  name: string;
  expression: string;
  // A substring the thrown error message must match (case-insensitive intent).
  expectedError: RegExp;
}

const adversarialCases: AdversarialCase[] = [
  { name: 'process.env exfiltration', expression: 'process.env.SECRET', expectedError: /unknown identifier/ },
  { name: 'require() injection', expression: "require('child_process')", expectedError: /unknown identifier/ },
  { name: 'globalThis access', expression: 'globalThis.x', expectedError: /unknown identifier/ },
  { name: 'prototype pollution via __proto__', expression: 'data.__proto__', expectedError: /forbidden property/ },
  { name: 'constructor escape', expression: 'data.constructor', expectedError: /forbidden property/ },
  { name: 'prototype access', expression: 'data.prototype', expectedError: /forbidden property/ },
  { name: 'valueOf access', expression: 'data.valueOf', expectedError: /forbidden property/ },
  { name: 'toString access', expression: 'data.toString', expectedError: /forbidden property/ },
  { name: 'computed __proto__ access', expression: "data['__proto__']", expectedError: /forbidden property/ },
  { name: 'computed constructor access', expression: "data['constructor']", expectedError: /forbidden property/ },
  { name: 'computed prototype access', expression: "data['prototype']", expectedError: /forbidden property/ },
  { name: 'arbitrary function call', expression: 'data.x()', expectedError: /unexpected token/ },
  { name: 'assignment (state mutation)', expression: 'data.x = 1', expectedError: /unexpected token/ },
];

describe('Policy conformance — adversarial expressions are rejected, not evaluated', () => {
  it.each(adversarialCases)('$name is rejected', ({ expression, expectedError }) => {
    expect(() => evaluateSafeExpression(expression, { x: 1 })).toThrow(expectedError);
  });

  it('rejects template literals (no host interpolation)', () => {
    expect(() => evaluateSafeExpression('`${data.x}`', { x: 1 })).toThrow(/unexpected character/);
  });

  it('rejects over-long expressions (DoS guard)', () => {
    const long = 'data.x ' + '+ 0 '.repeat(300);
    expect(() => evaluateSafeExpression(long, { x: 1 })).toThrow(/too long/);
  });

  it('rejects non-string expressions', () => {
    expect(() => evaluateSafeExpression({} as never, {})).toThrow();
  });

  it('evaluates only legitimate data-bound expressions', () => {
    // Positive control: confirms rejection above is selective, not blanket.
    expect(evaluateSafeExpression('data.x > 5', { x: 6 })).toBe(true);
    expect(evaluateSafeExpression("data['role'] === 'admin'", { role: 'admin' })).toBe(true);
  });
});
