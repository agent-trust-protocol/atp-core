/**
 * Policy Assertion Engine — Conformance Test Suite (W3C core item 3)
 *
 * Table-driven conformance tests for the runtime Policy Assertion Engine
 * (`PolicyEvaluator.evaluatePolicy`). The intent is that W3C conformance
 * vectors can be appended later simply as new rows in the `VECTORS` array.
 *
 * Covered conformance areas:
 *   - explicit ALLOW
 *   - explicit DENY
 *   - deny-by-default when no rule matches (first_match + priority_order)
 *   - precedence among evaluation modes (first_match vs priority_order vs
 *     all_rules) — including deny-wins combination semantics
 *   - obligation emission (MFA, time-limit, throttle, log)
 *   - determinism (same policy + context => same decision)
 *
 * These tests ONLY assert observable engine behaviour. They do not modify the
 * engine. To add a W3C vector, append a `ConformanceVector` to `VECTORS`.
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
  VisualPolicyActionType,
  VisualPolicyCondition,
  VisualPolicyLogicalExpression,
  VisualPolicyTrustLevel,
  VisualPolicyComparisonOperator,
} from '../visual-policy-schema.js';

// ---------------------------------------------------------------------------
// Builders — keep vectors terse so future W3C rows are easy to append.
// ---------------------------------------------------------------------------

const NOW = '2026-06-18T12:00:00.000Z';

function makeContext(overrides: Partial<PolicyEvaluationContext> = {}): PolicyEvaluationContext {
  return {
    agentDID: 'did:atp:agent-conformance',
    trustLevel: 'TRUSTED',
    credentials: [],
    tool: {
      id: 'tool-db-read',
      type: 'database',
      sensitivity: 'internal',
    },
    requestedAction: 'read',
    organizationId: 'org-conformance',
    timestamp: NOW,
    ...overrides,
  };
}

function trustCondition(
  operator: VisualPolicyComparisonOperator,
  value: VisualPolicyTrustLevel | number,
): VisualPolicyCondition {
  return {
    id: randomUUID(),
    type: 'trust_level',
    operator,
    value,
  } as VisualPolicyCondition;
}

function didCondition(
  operator: VisualPolicyComparisonOperator,
  value: string | string[],
): VisualPolicyCondition {
  return {
    id: randomUUID(),
    type: 'agent_did',
    operator,
    value,
  } as VisualPolicyCondition;
}

function makeRule(
  partial: {
    name: string;
    priority: number;
    condition: VisualPolicyCondition | VisualPolicyLogicalExpression;
    action: VisualPolicyActionType;
    enabled?: boolean;
  },
): VisualPolicyRule {
  return {
    id: randomUUID(),
    name: partial.name,
    enabled: partial.enabled ?? true,
    priority: partial.priority,
    condition: partial.condition,
    action: partial.action,
    tags: [],
    createdAt: NOW,
    updatedAt: NOW,
    createdBy: 'did:atp:author',
    version: '1.0.0',
  } as VisualPolicyRule;
}

function makePolicy(
  partial: {
    evaluationMode: ATPVisualPolicy['evaluationMode'];
    rules: VisualPolicyRule[];
    defaultAction?: ATPVisualPolicy['defaultAction'];
    enabled?: boolean;
  },
): ATPVisualPolicy {
  return {
    id: randomUUID(),
    name: 'Conformance Policy',
    version: '1.0.0',
    organizationId: 'org-conformance',
    createdBy: 'did:atp:author',
    createdAt: NOW,
    updatedAt: NOW,
    enabled: partial.enabled ?? true,
    defaultAction: partial.defaultAction ?? 'deny',
    evaluationMode: partial.evaluationMode,
    rules: partial.rules,
    tags: [],
    testCases: [],
    auditLog: [],
  } as ATPVisualPolicy;
}

const allow = (extra: Partial<VisualPolicyActionType> = {}): VisualPolicyActionType =>
  ({ id: randomUUID(), type: 'allow', ...extra } as VisualPolicyActionType);
const deny = (extra: Partial<VisualPolicyActionType> = {}): VisualPolicyActionType =>
  ({ id: randomUUID(), type: 'deny', notifyAdmin: false, ...extra } as VisualPolicyActionType);
const requireApproval = (): VisualPolicyActionType =>
  ({ id: randomUUID(), type: 'require_approval', approvers: ['did:atp:approver'], timeout: 3600 } as VisualPolicyActionType);
const throttle = (): VisualPolicyActionType =>
  ({ id: randomUUID(), type: 'throttle', limits: { requestsPerMinute: 5 } } as VisualPolicyActionType);
const logAction = (): VisualPolicyActionType =>
  ({ id: randomUUID(), type: 'log', level: 'info', includeContext: true } as VisualPolicyActionType);

// ---------------------------------------------------------------------------
// Conformance vector table — append new W3C vectors as rows here.
// ---------------------------------------------------------------------------

interface ConformanceVector {
  name: string;
  policy: ATPVisualPolicy;
  context: PolicyEvaluationContext;
  expected: {
    decision: PolicyEvaluationResult['decision'];
    actionType: VisualPolicyActionType['type'];
    /** obligation `type`s that MUST all be present (subset match). */
    obligations?: Array<NonNullable<PolicyEvaluationResult['obligations']>[number]['type']>;
    /** substring the `reason` must contain (case-insensitive). */
    reasonContains?: string;
  };
}

const VECTORS: ConformanceVector[] = [
  // --- explicit ALLOW ------------------------------------------------------
  {
    name: 'explicit ALLOW when matching rule grants access (first_match)',
    policy: makePolicy({
      evaluationMode: 'first_match',
      rules: [
        makeRule({
          name: 'Allow trusted',
          priority: 10,
          condition: trustCondition('greater_than_or_equal', 'TRUSTED'),
          action: allow(),
        }),
      ],
    }),
    context: makeContext({ trustLevel: 'TRUSTED' }),
    expected: { decision: 'allow', actionType: 'allow', reasonContains: 'Allow trusted' },
  },

  // --- explicit DENY -------------------------------------------------------
  {
    name: 'explicit DENY when matching rule blocks access (first_match)',
    policy: makePolicy({
      evaluationMode: 'first_match',
      rules: [
        makeRule({
          name: 'Deny low trust',
          priority: 10,
          condition: trustCondition('less_than', 'TRUSTED'),
          action: deny({ reason: 'insufficient trust' } as Partial<VisualPolicyActionType>),
        }),
      ],
    }),
    context: makeContext({ trustLevel: 'BASIC' }),
    expected: { decision: 'deny', actionType: 'deny', reasonContains: 'Deny low trust' },
  },

  // --- deny-by-default (no rule matches) -----------------------------------
  {
    name: 'deny-by-default when no rule matches (first_match)',
    policy: makePolicy({
      evaluationMode: 'first_match',
      rules: [
        makeRule({
          name: 'Allow privileged only',
          priority: 10,
          condition: trustCondition('greater_than_or_equal', 'PRIVILEGED'),
          action: allow(),
        }),
      ],
    }),
    context: makeContext({ trustLevel: 'BASIC' }),
    expected: { decision: 'deny', actionType: 'deny', reasonContains: 'No rules matched' },
  },
  {
    name: 'deny-by-default when no decisive rule matches (priority_order, default deny)',
    policy: makePolicy({
      evaluationMode: 'priority_order',
      defaultAction: 'deny',
      rules: [
        makeRule({
          name: 'Allow privileged only',
          priority: 10,
          condition: trustCondition('greater_than_or_equal', 'PRIVILEGED'),
          action: allow(),
        }),
      ],
    }),
    context: makeContext({ trustLevel: 'BASIC' }),
    expected: { decision: 'deny', actionType: 'deny', reasonContains: 'default action' },
  },
  {
    name: 'default ALLOW applied when default is allow and no decisive rule fires (priority_order)',
    policy: makePolicy({
      evaluationMode: 'priority_order',
      defaultAction: 'allow',
      rules: [
        makeRule({
          name: 'Log everything (non-decisive)',
          priority: 10,
          condition: trustCondition('greater_than_or_equal', 'UNKNOWN'),
          action: logAction(),
        }),
      ],
    }),
    context: makeContext({ trustLevel: 'BASIC' }),
    expected: { decision: 'allow', actionType: 'allow', obligations: ['log'], reasonContains: 'default action' },
  },

  // --- precedence: first_match stops at first matching rule ----------------
  {
    name: 'first_match honours priority order — higher-priority DENY wins over later ALLOW',
    policy: makePolicy({
      evaluationMode: 'first_match',
      rules: [
        makeRule({
          name: 'Late allow',
          priority: 100,
          condition: trustCondition('greater_than_or_equal', 'BASIC'),
          action: allow(),
        }),
        makeRule({
          name: 'Early deny',
          priority: 1,
          condition: trustCondition('greater_than_or_equal', 'BASIC'),
          action: deny(),
        }),
      ],
    }),
    context: makeContext({ trustLevel: 'TRUSTED' }),
    expected: { decision: 'deny', actionType: 'deny', reasonContains: 'Early deny' },
  },

  // --- precedence: priority_order returns first decisive action ------------
  {
    name: 'priority_order returns first decisive (allow) action by priority',
    policy: makePolicy({
      evaluationMode: 'priority_order',
      rules: [
        makeRule({
          name: 'Deny later',
          priority: 100,
          condition: trustCondition('greater_than_or_equal', 'BASIC'),
          action: deny(),
        }),
        makeRule({
          name: 'Allow first',
          priority: 1,
          condition: trustCondition('greater_than_or_equal', 'BASIC'),
          action: allow(),
        }),
      ],
    }),
    context: makeContext({ trustLevel: 'TRUSTED' }),
    expected: { decision: 'allow', actionType: 'allow', reasonContains: 'Allow first' },
  },

  // --- precedence: all_rules combines with deny-wins semantics -------------
  {
    name: 'all_rules deny-wins — any matching deny overrides matching allow',
    policy: makePolicy({
      evaluationMode: 'all_rules',
      rules: [
        makeRule({
          name: 'Allow basic',
          priority: 10,
          condition: trustCondition('greater_than_or_equal', 'BASIC'),
          action: allow(),
        }),
        makeRule({
          name: 'Deny basic',
          priority: 20,
          condition: trustCondition('greater_than_or_equal', 'BASIC'),
          action: deny(),
        }),
      ],
    }),
    context: makeContext({ trustLevel: 'TRUSTED' }),
    expected: { decision: 'deny', actionType: 'deny' },
  },
  {
    name: 'all_rules require_approval wins over allow when no deny present',
    policy: makePolicy({
      evaluationMode: 'all_rules',
      rules: [
        makeRule({
          name: 'Allow basic',
          priority: 10,
          condition: trustCondition('greater_than_or_equal', 'BASIC'),
          action: allow(),
        }),
        makeRule({
          name: 'Approval basic',
          priority: 20,
          condition: trustCondition('greater_than_or_equal', 'BASIC'),
          action: requireApproval(),
        }),
      ],
    }),
    context: makeContext({ trustLevel: 'TRUSTED' }),
    expected: { decision: 'require_approval', actionType: 'require_approval' },
  },
  {
    name: 'all_rules deny-by-default when no rule matches',
    policy: makePolicy({
      evaluationMode: 'all_rules',
      rules: [
        makeRule({
          name: 'Allow privileged only',
          priority: 10,
          condition: trustCondition('greater_than_or_equal', 'PRIVILEGED'),
          action: allow(),
        }),
      ],
    }),
    context: makeContext({ trustLevel: 'BASIC' }),
    expected: { decision: 'deny', actionType: 'deny' },
  },

  // --- obligation emission -------------------------------------------------
  {
    name: 'obligation emission — allow with MFA + time-limit conditions',
    policy: makePolicy({
      evaluationMode: 'first_match',
      rules: [
        makeRule({
          name: 'Allow with obligations',
          priority: 10,
          condition: didCondition('equals', 'did:atp:agent-conformance'),
          action: allow({ conditions: { requireMFA: true, timeLimit: 30 } } as Partial<VisualPolicyActionType>),
        }),
      ],
    }),
    context: makeContext(),
    expected: { decision: 'allow', actionType: 'allow', obligations: ['mfa_required', 'time_limit'] },
  },
  {
    name: 'obligation emission — throttle emits a throttle obligation',
    policy: makePolicy({
      evaluationMode: 'priority_order',
      rules: [
        makeRule({
          name: 'Throttle then allow',
          priority: 5,
          condition: trustCondition('greater_than_or_equal', 'BASIC'),
          action: throttle(),
        }),
        makeRule({
          name: 'Allow',
          priority: 10,
          condition: trustCondition('greater_than_or_equal', 'BASIC'),
          action: allow(),
        }),
      ],
    }),
    context: makeContext({ trustLevel: 'TRUSTED' }),
    // priority_order: throttle is decisive in mapActionToDecision? No — only
    // allow/deny/require_approval short-circuit. Throttle's obligation is
    // collected, then the allow rule is decisive.
    expected: { decision: 'allow', actionType: 'allow', obligations: ['throttle'] },
  },

  // --- all_rules precedence: deny outranks require_approval ----------------
  // TEETH: with both a matching deny AND a matching require_approval, deny MUST
  // win. Earlier vectors only covered deny-vs-allow and approval-vs-allow, so a
  // swap of the deny/approval precedence in combineRuleDecisions survived. This
  // row pins deny > require_approval.
  {
    name: 'all_rules deny outranks require_approval when both match',
    policy: makePolicy({
      evaluationMode: 'all_rules',
      rules: [
        makeRule({
          name: 'Approval basic',
          priority: 10,
          condition: trustCondition('greater_than_or_equal', 'BASIC'),
          action: requireApproval(),
        }),
        makeRule({
          name: 'Deny basic',
          priority: 20,
          condition: trustCondition('greater_than_or_equal', 'BASIC'),
          action: deny(),
        }),
      ],
    }),
    context: makeContext({ trustLevel: 'TRUSTED' }),
    expected: { decision: 'deny', actionType: 'deny' },
  },
  // --- all_rules precedence: require_approval outranks throttle -------------
  // TEETH: require_approval must beat a matching throttle when no deny present.
  {
    name: 'all_rules require_approval outranks throttle when both match (no deny)',
    policy: makePolicy({
      evaluationMode: 'all_rules',
      rules: [
        makeRule({
          name: 'Throttle basic',
          priority: 10,
          condition: trustCondition('greater_than_or_equal', 'BASIC'),
          action: throttle(),
        }),
        makeRule({
          name: 'Approval basic',
          priority: 20,
          condition: trustCondition('greater_than_or_equal', 'BASIC'),
          action: requireApproval(),
        }),
      ],
    }),
    context: makeContext({ trustLevel: 'TRUSTED' }),
    expected: { decision: 'require_approval', actionType: 'require_approval' },
  },

  // --- comparison operator boundaries (>= and <) ---------------------------
  // TEETH: 'greater_than_or_equal' must be inclusive at the boundary. With the
  // context trust EXACTLY at the threshold, a mutation to strict '>' flips this
  // from allow to deny-by-default.
  {
    name: 'greater_than_or_equal is inclusive at the exact boundary (allow)',
    policy: makePolicy({
      evaluationMode: 'first_match',
      rules: [
        makeRule({
          name: 'Allow at-or-above verified',
          priority: 10,
          condition: trustCondition('greater_than_or_equal', 'VERIFIED'),
          action: allow(),
        }),
      ],
    }),
    context: makeContext({ trustLevel: 'VERIFIED' }),
    expected: { decision: 'allow', actionType: 'allow', reasonContains: 'Allow at-or-above verified' },
  },
  {
    name: 'less_than is exclusive at the exact boundary (no match -> deny-by-default)',
    // TEETH: 'less_than' must be strict. At the exact boundary (VERIFIED < VERIFIED
    // is false) the rule must NOT fire, so the engine falls through to
    // deny-by-default. Using an ALLOW rule makes the mutation observable: if '<'
    // wrongly became '<=', the rule would fire and ALLOW; correct strict '<'
    // yields no-match -> deny-by-default.
    policy: makePolicy({
      evaluationMode: 'first_match',
      rules: [
        makeRule({
          name: 'Allow strictly-below verified',
          priority: 10,
          condition: trustCondition('less_than', 'VERIFIED'),
          action: allow(),
        }),
      ],
    }),
    context: makeContext({ trustLevel: 'VERIFIED' }),
    expected: { decision: 'deny', actionType: 'deny', reasonContains: 'No rules matched' },
  },

  // --- per-rule enabled flag is honoured -----------------------------------
  // TEETH: a disabled (enabled:false) rule must be filtered out before matching.
  // Here the ONLY allow rule is disabled; if the per-rule enabled filter were
  // removed it would match and ALLOW. Correct behaviour: it is skipped and the
  // request is denied-by-default (first_match no-match).
  {
    name: 'disabled rule is ignored -> deny-by-default (first_match)',
    policy: makePolicy({
      evaluationMode: 'first_match',
      rules: [
        makeRule({
          name: 'Disabled allow-all',
          priority: 10,
          condition: trustCondition('greater_than_or_equal', 'UNKNOWN'),
          action: allow(),
          enabled: false,
        }),
      ],
    }),
    context: makeContext({ trustLevel: 'TRUSTED' }),
    expected: { decision: 'deny', actionType: 'deny', reasonContains: 'No rules matched' },
  },
  {
    name: 'disabled deny rule is ignored, later enabled allow wins (priority_order)',
    // TEETH: a higher-priority DENY that is disabled must not suppress a
    // lower-priority enabled ALLOW.
    policy: makePolicy({
      evaluationMode: 'priority_order',
      rules: [
        makeRule({
          name: 'Disabled early deny',
          priority: 1,
          condition: trustCondition('greater_than_or_equal', 'BASIC'),
          action: deny(),
          enabled: false,
        }),
        makeRule({
          name: 'Enabled allow',
          priority: 10,
          condition: trustCondition('greater_than_or_equal', 'BASIC'),
          action: allow(),
        }),
      ],
    }),
    context: makeContext({ trustLevel: 'TRUSTED' }),
    expected: { decision: 'allow', actionType: 'allow', reasonContains: 'Enabled allow' },
  },

  // --- usage_limit obligation pass-through ---------------------------------
  // TEETH: completes obligation coverage in this suite (usage_limit was only
  // checked in the permission-package suite).
  {
    name: 'obligation emission — allow with usage-limit condition emits usage_limit',
    policy: makePolicy({
      evaluationMode: 'first_match',
      rules: [
        makeRule({
          name: 'Allow with usage cap',
          priority: 10,
          condition: didCondition('equals', 'did:atp:agent-conformance'),
          action: allow({ conditions: { usageLimit: 7 } } as Partial<VisualPolicyActionType>),
        }),
      ],
    }),
    context: makeContext(),
    expected: { decision: 'allow', actionType: 'allow', obligations: ['usage_limit'] },
  },

  // --- disabled policy -----------------------------------------------------
  {
    name: 'disabled policy denies regardless of rules',
    policy: makePolicy({
      evaluationMode: 'first_match',
      enabled: false,
      rules: [
        makeRule({
          name: 'Allow all',
          priority: 10,
          condition: trustCondition('greater_than_or_equal', 'UNKNOWN'),
          action: allow(),
        }),
      ],
    }),
    context: makeContext(),
    expected: { decision: 'deny', actionType: 'deny', reasonContains: 'disabled' },
  },
];

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

describe('PolicyEvaluator — W3C conformance vectors (table-driven)', () => {
  const evaluator = new PolicyEvaluator();

  it.each(VECTORS.map((v) => [v.name, v] as const))('%s', async (_name, vector) => {
    const result = await evaluator.evaluatePolicy(vector.policy, vector.context);

    expect(result.decision).toBe(vector.expected.decision);
    expect(result.action.type).toBe(vector.expected.actionType);

    if (vector.expected.reasonContains) {
      expect(result.reason.toLowerCase()).toContain(vector.expected.reasonContains.toLowerCase());
    }

    if (vector.expected.obligations) {
      const emitted = (result.obligations ?? []).map((o) => o.type);
      for (const required of vector.expected.obligations) {
        expect(emitted).toContain(required);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('PolicyEvaluator — determinism', () => {
  const evaluator = new PolicyEvaluator();

  it.each(VECTORS.map((v) => [v.name, v] as const))(
    'repeated evaluation yields identical decision: %s',
    async (_name, vector) => {
      const runs: PolicyEvaluationResult[] = [];
      for (let i = 0; i < 5; i++) {
        runs.push(await evaluator.evaluatePolicy(vector.policy, vector.context));
      }

      const first = runs[0];
      for (const r of runs) {
        expect(r.decision).toBe(first.decision);
        expect(r.action.type).toBe(first.action.type);
        expect((r.obligations ?? []).map((o) => o.type).sort()).toEqual(
          (first.obligations ?? []).map((o) => o.type).sort(),
        );
      }
    },
  );

  it('two independent evaluator instances agree on the same vector', async () => {
    const a = new PolicyEvaluator();
    const b = new PolicyEvaluator();
    for (const vector of VECTORS) {
      const ra = await a.evaluatePolicy(vector.policy, vector.context);
      const rb = await b.evaluatePolicy(vector.policy, vector.context);
      expect(ra.decision).toBe(rb.decision);
      expect(ra.action.type).toBe(rb.action.type);
    }
  });
});
