/**
 * Visual Trust Policy Editor - ATP Policy JSON Schema
 *
 * This module defines the comprehensive schema for visual trust policies
 * that can be created using the drag-and-drop policy editor and enforced
 * by the ATP Gateway at runtime.
 *
 * @version 1.0.0
 * @author ATP Team
 */

import { z } from 'zod';
import { randomUUID } from 'crypto';

// ============================================================================
// CORE POLICY TYPES
// ============================================================================

/**
 * Trust levels supported by ATP Visual Policies
 */
export const VisualPolicyTrustLevelEnum = z.enum([
  'UNKNOWN',
  'BASIC',
  'VERIFIED',
  'TRUSTED',
  'PRIVILEGED'
]);

/**
 * Policy actions that can be taken
 */
export const VisualPolicyActionEnum = z.enum([
  'allow',
  'deny',
  'throttle',
  'log',
  'alert',
  'require_approval'
]);

/**
 * Logical operators for combining conditions
 */
export const VisualPolicyLogicalOperatorEnum = z.enum([
  'AND',
  'OR',
  'NOT'
]);

/**
 * Comparison operators for condition evaluation
 */
export const VisualPolicyComparisonOperatorEnum = z.enum([
  'equals',
  'not_equals',
  'greater_than',
  'greater_than_or_equal',
  'less_than',
  'less_than_or_equal',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
  'matches_regex',
  'in_list',
  'not_in_list'
]);

// ============================================================================
// CONDITION SCHEMAS
// ============================================================================

/**
 * Base condition interface
 */
export const VisualPolicyBaseConditionSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Agent DID condition - matches against agent's decentralized identifier
 */
export const VisualPolicyAgentDIDConditionSchema = VisualPolicyBaseConditionSchema.extend({
  type: z.literal('agent_did'),
  operator: VisualPolicyComparisonOperatorEnum,
  value: z.union([
    z.string(), // Single DID
    z.array(z.string()) // List of DIDs
  ])
});

/**
 * Trust level condition - matches against agent's trust level
 */
export const VisualPolicyTrustLevelConditionSchema = VisualPolicyBaseConditionSchema.extend({
  type: z.literal('trust_level'),
  operator: VisualPolicyComparisonOperatorEnum,
  value: z.union([
    VisualPolicyTrustLevelEnum, // Single trust level
    z.array(VisualPolicyTrustLevelEnum), // List of trust levels
    z.number().min(0).max(5) // Numeric trust score
  ])
});

/**
 * Verifiable Credential condition - matches against agent's credentials
 */
export const VisualPolicyVerifiableCredentialConditionSchema = VisualPolicyBaseConditionSchema.extend({
  type: z.literal('verifiable_credential'),
  operator: VisualPolicyComparisonOperatorEnum,
  value: z.object({
    credentialType: z.string().optional(), // e.g., "com.atp.security.certified"
    issuer: z.string().optional(), // DID of credential issuer
    schemaId: z.string().optional(), // Credential schema identifier
    claims: z.record(z.any()).optional(), // Specific claims to match
    expirationCheck: z.boolean().default(true) // Check if credential is expired
  })
});

/**
 * Tool/Resource condition - matches against requested tool or resource
 */
export const VisualPolicyToolConditionSchema = VisualPolicyBaseConditionSchema.extend({
  type: z.literal('tool'),
  operator: VisualPolicyComparisonOperatorEnum,
  value: z.union([
    z.string(), // Single tool identifier
    z.array(z.string()), // List of tool identifiers
    z.object({
      toolId: z.string().optional(),
      toolType: z.string().optional(), // e.g., "api", "database", "file_system"
      endpoint: z.string().optional(), // Specific endpoint or path
      method: z.string().optional(), // HTTP method for API tools
      sensitivity: z.enum(['public', 'internal', 'confidential', 'restricted']).optional()
    })
  ])
});

/**
 * Time-based condition - matches against current time/date
 */
export const VisualPolicyTimeConditionSchema = VisualPolicyBaseConditionSchema.extend({
  type: z.literal('time'),
  operator: VisualPolicyComparisonOperatorEnum,
  value: z.object({
    startTime: z.string().optional(), // ISO 8601 time
    endTime: z.string().optional(), // ISO 8601 time
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(), // 0=Sunday, 6=Saturday
    timezone: z.string().default('UTC')
  })
});

/**
 * Context condition - matches against request context
 */
export const VisualPolicyContextConditionSchema = VisualPolicyBaseConditionSchema.extend({
  type: z.literal('context'),
  operator: VisualPolicyComparisonOperatorEnum,
  value: z.object({
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
    location: z.object({
      country: z.string().optional(),
      region: z.string().optional(),
      city: z.string().optional()
    }).optional(),
    sessionAge: z.number().optional(), // Minutes since session start
    riskScore: z.number().min(0).max(100).optional()
  })
});

/**
 * Organization condition - matches against agent's organization
 */
export const VisualPolicyOrganizationConditionSchema = VisualPolicyBaseConditionSchema.extend({
  type: z.literal('organization'),
  operator: VisualPolicyComparisonOperatorEnum,
  value: z.union([
    z.string(), // Single org ID
    z.array(z.string()), // List of org IDs
    z.object({
      orgId: z.string().optional(),
      orgType: z.string().optional(), // e.g., "enterprise", "partner", "public"
      tier: z.enum(['free', 'basic', 'premium', 'enterprise']).optional()
    })
  ])
});

/**
 * Union of all condition types
 */
export const VisualPolicyConditionSchema = z.discriminatedUnion('type', [
  VisualPolicyAgentDIDConditionSchema,
  VisualPolicyTrustLevelConditionSchema,
  VisualPolicyVerifiableCredentialConditionSchema,
  VisualPolicyToolConditionSchema,
  VisualPolicyTimeConditionSchema,
  VisualPolicyContextConditionSchema,
  VisualPolicyOrganizationConditionSchema
]);

// ============================================================================
// LOGICAL EXPRESSION SCHEMAS
// ============================================================================

/**
 * Logical expression for combining conditions
 */
export const VisualPolicyLogicalExpressionSchema: z.ZodType<any> = z.lazy(() => z.object({
  id: z.string().uuid(),
  operator: VisualPolicyLogicalOperatorEnum,
  operands: z.array(z.union([
    VisualPolicyConditionSchema,
    VisualPolicyLogicalExpressionSchema
  ])).min(1)
}));

// ============================================================================
// ACTION SCHEMAS
// ============================================================================

/**
 * Base action interface
 */
export const VisualPolicyBaseActionSchema = z.object({
  id: z.string().uuid(),
  type: VisualPolicyActionEnum,
  description: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Allow action - grants access
 */
export const VisualPolicyAllowActionSchema = VisualPolicyBaseActionSchema.extend({
  type: z.literal('allow'),
  conditions: z.object({
    timeLimit: z.number().optional(), // Minutes
    usageLimit: z.number().optional(), // Number of uses
    requireMFA: z.boolean().default(false)
  }).optional()
});

/**
 * Deny action - blocks access
 */
export const VisualPolicyDenyActionSchema = VisualPolicyBaseActionSchema.extend({
  type: z.literal('deny'),
  reason: z.string().optional(),
  notifyAdmin: z.boolean().default(false)
});

/**
 * Throttle action - rate limits access
 */
export const VisualPolicyThrottleActionSchema = VisualPolicyBaseActionSchema.extend({
  type: z.literal('throttle'),
  limits: z.object({
    requestsPerMinute: z.number().min(1).optional(),
    requestsPerHour: z.number().min(1).optional(),
    requestsPerDay: z.number().min(1).optional(),
    burstLimit: z.number().min(1).optional()
  })
});

/**
 * Log action - records the access attempt
 */
export const VisualPolicyLogActionSchema = VisualPolicyBaseActionSchema.extend({
  type: z.literal('log'),
  level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  includeContext: z.boolean().default(true),
  alertThreshold: z.number().optional() // Alert after N occurrences
});

/**
 * Alert action - sends notifications
 */
export const VisualPolicyAlertActionSchema = VisualPolicyBaseActionSchema.extend({
  type: z.literal('alert'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  channels: z.array(z.enum(['email', 'slack', 'webhook', 'sms'])),
  recipients: z.array(z.string()),
  message: z.string().optional()
});

/**
 * Require approval action - requires manual approval
 */
export const VisualPolicyRequireApprovalActionSchema = VisualPolicyBaseActionSchema.extend({
  type: z.literal('require_approval'),
  approvers: z.array(z.string()), // DIDs of approvers
  timeout: z.number().default(3600), // Seconds to wait for approval
  autoApproveAfter: z.number().optional() // Auto-approve after N seconds
});

/**
 * Union of all action types
 */
export const VisualPolicyActionSchema = z.discriminatedUnion('type', [
  VisualPolicyAllowActionSchema,
  VisualPolicyDenyActionSchema,
  VisualPolicyThrottleActionSchema,
  VisualPolicyLogActionSchema,
  VisualPolicyAlertActionSchema,
  VisualPolicyRequireApprovalActionSchema
]);

// ============================================================================
// POLICY RULE SCHEMA
// ============================================================================

/**
 * Individual policy rule
 */
export const VisualPolicyRuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  enabled: z.boolean().default(true),
  priority: z.number().min(0).max(1000).default(100),

  // Condition that must be met
  condition: z.union([
    VisualPolicyConditionSchema,
    VisualPolicyLogicalExpressionSchema
  ]),

  // Action to take when condition is met
  action: VisualPolicyActionSchema,

  // Metadata
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string(), // DID of creator
  version: z.string().default('1.0.0')
});

// ============================================================================
// COMPLETE POLICY SCHEMA
// ============================================================================

/**
 * Complete ATP Visual Trust Policy
 */
export const ATPVisualPolicySchema = z.object({
  // Policy metadata
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  version: z.string().default('1.0.0'),

  // Organization and access control
  organizationId: z.string(),
  createdBy: z.string(), // DID of creator
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  // Policy configuration
  enabled: z.boolean().default(true),
  defaultAction: VisualPolicyActionEnum.default('deny'),
  evaluationMode: z.enum(['first_match', 'all_rules', 'priority_order']).default('priority_order'),

  // Policy rules (ordered by priority)
  rules: z.array(VisualPolicyRuleSchema).min(1),

  // Policy metadata
  tags: z.array(z.string()).default([]),
  category: z.string().optional(), // e.g., "security", "compliance", "operational"

  // Validation and testing
  testCases: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    input: z.object({
      agentDID: z.string(),
      trustLevel: VisualPolicyTrustLevelEnum,
      credentials: z.array(z.any()),
      tool: z.string(),
      context: z.record(z.any()).optional()
    }),
    expectedAction: VisualPolicyActionEnum,
    description: z.string().optional()
  })).default([]),

  // Audit and compliance
  auditLog: z.array(z.object({
    timestamp: z.string().datetime(),
    action: z.enum(['created', 'updated', 'enabled', 'disabled', 'deployed']),
    actor: z.string(), // DID of actor
    changes: z.record(z.any()).optional(),
    reason: z.string().optional()
  })).default([])
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type VisualPolicyTrustLevel = z.infer<typeof VisualPolicyTrustLevelEnum>;
export type VisualPolicyAction = z.infer<typeof VisualPolicyActionEnum>;
export type VisualPolicyLogicalOperator = z.infer<typeof VisualPolicyLogicalOperatorEnum>;
export type VisualPolicyComparisonOperator = z.infer<typeof VisualPolicyComparisonOperatorEnum>;

export type VisualPolicyCondition = z.infer<typeof VisualPolicyConditionSchema>;
export type VisualPolicyLogicalExpression = z.infer<typeof VisualPolicyLogicalExpressionSchema>;
export type VisualPolicyActionType = z.infer<typeof VisualPolicyActionSchema>;
export type VisualPolicyRule = z.infer<typeof VisualPolicyRuleSchema>;
export type ATPVisualPolicy = z.infer<typeof ATPVisualPolicySchema>;

// Specific condition types
export type VisualPolicyAgentDIDCondition = z.infer<typeof VisualPolicyAgentDIDConditionSchema>;
export type VisualPolicyTrustLevelCondition = z.infer<typeof VisualPolicyTrustLevelConditionSchema>;
export type VisualPolicyVerifiableCredentialCondition = z.infer<typeof VisualPolicyVerifiableCredentialConditionSchema>;
export type VisualPolicyToolCondition = z.infer<typeof VisualPolicyToolConditionSchema>;
export type VisualPolicyTimeCondition = z.infer<typeof VisualPolicyTimeConditionSchema>;
export type VisualPolicyContextCondition = z.infer<typeof VisualPolicyContextConditionSchema>;
export type VisualPolicyOrganizationCondition = z.infer<typeof VisualPolicyOrganizationConditionSchema>;

// Specific action types
export type VisualPolicyAllowAction = z.infer<typeof VisualPolicyAllowActionSchema>;
export type VisualPolicyDenyAction = z.infer<typeof VisualPolicyDenyActionSchema>;
export type VisualPolicyThrottleAction = z.infer<typeof VisualPolicyThrottleActionSchema>;
export type VisualPolicyLogAction = z.infer<typeof VisualPolicyLogActionSchema>;
export type VisualPolicyAlertAction = z.infer<typeof VisualPolicyAlertActionSchema>;
export type VisualPolicyRequireApprovalAction = z.infer<typeof VisualPolicyRequireApprovalActionSchema>;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validates a complete ATP Visual Policy
 */
export function validateATPPolicy(policy: unknown): ATPVisualPolicy {
  return ATPVisualPolicySchema.parse(policy);
}

/**
 * Validates a policy rule
 */
export function validatePolicyRule(rule: unknown): VisualPolicyRule {
  return VisualPolicyRuleSchema.parse(rule);
}

/**
 * Validates a policy condition
 */
export function validatePolicyCondition(condition: unknown): VisualPolicyCondition {
  return VisualPolicyConditionSchema.parse(condition);
}

/**
 * Validates a policy action
 */
export function validatePolicyAction(action: unknown): VisualPolicyActionType {
  return VisualPolicyActionSchema.parse(action);
}

/**
 * Creates a safe partial validation for policy editing
 */
export function validatePartialPolicy(policy: unknown): Partial<ATPVisualPolicy> {
  return ATPVisualPolicySchema.partial().parse(policy);
}

// ============================================================================
// POLICY TEMPLATES
// ============================================================================

/**
 * Creates a basic allow-all policy template
 */
export function createAllowAllPolicyTemplate(organizationId: string, createdBy: string): ATPVisualPolicy {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    name: 'Allow All Access',
    description: 'Basic policy that allows all authenticated agents access to all tools',
    version: '1.0.0',
    organizationId,
    createdBy,
    createdAt: now,
    updatedAt: now,
    enabled: true,
    defaultAction: 'deny',
    evaluationMode: 'first_match',
    rules: [{
      id: randomUUID(),
      name: 'Allow All Rule',
      description: 'Allows access for any agent with basic trust level or higher',
      enabled: true,
      priority: 100,
      condition: {
        id: randomUUID(),
        type: 'trust_level',
        operator: 'greater_than_or_equal',
        value: 'BASIC'
      },
      action: {
        id: randomUUID(),
        type: 'allow'
      },
      tags: ['basic', 'permissive'],
      createdAt: now,
      updatedAt: now,
      createdBy,
      version: '1.0.0'
    }],
    tags: ['template', 'basic'],
    testCases: [],
    auditLog: [{
      timestamp: now,
      action: 'created',
      actor: createdBy,
      reason: 'Created from template'
    }]
  };
}

/**
 * Creates a security-focused policy template
 */
export function createSecurityPolicyTemplate(organizationId: string, createdBy: string): ATPVisualPolicy {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    name: 'Security Policy',
    description: 'Restrictive policy requiring verified credentials for sensitive tools',
    version: '1.0.0',
    organizationId,
    createdBy,
    createdAt: now,
    updatedAt: now,
    enabled: true,
    defaultAction: 'deny',
    evaluationMode: 'priority_order',
    rules: [
      {
        id: randomUUID(),
        name: 'Require Security Certification',
        description: 'Require security certification for database access',
        enabled: true,
        priority: 10,
        condition: {
          id: randomUUID(),
          operator: 'AND',
          operands: [
            {
              id: randomUUID(),
              type: 'verifiable_credential',
              operator: 'contains',
              value: {
                credentialType: 'com.atp.security.certified',
                expirationCheck: true
              }
            },
            {
              id: randomUUID(),
              type: 'tool',
              operator: 'contains',
              value: 'database'
            }
          ]
        },
        action: {
          id: randomUUID(),
          type: 'allow',
          conditions: {
            requireMFA: true,
            timeLimit: 60
          }
        },
        tags: ['security', 'database'],
        createdAt: now,
        updatedAt: now,
        createdBy,
        version: '1.0.0'
      }
    ],
    tags: ['template', 'security'],
    category: 'security',
    testCases: [],
    auditLog: [{
      timestamp: now,
      action: 'created',
      actor: createdBy,
      reason: 'Created from security template'
    }]
  };
}
