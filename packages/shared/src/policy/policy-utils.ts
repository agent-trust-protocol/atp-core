/**
 * Policy Utilities - Helper functions for working with visual trust policies
 * 
 * This module provides utility functions for creating, manipulating, and
 * analyzing visual trust policies in the ATP system.
 */

import { randomUUID } from 'crypto';
import { 
  ATPVisualPolicy, 
  VisualPolicyRule, 
  VisualPolicyCondition, 
  VisualPolicyActionType,
  VisualPolicyLogicalExpression,
  VisualPolicyTrustLevel,
  VisualPolicyAction
} from './visual-policy-schema.js';

// ============================================================================
// POLICY CREATION UTILITIES
// ============================================================================

/**
 * Creates a new policy rule with default values
 */
export function createPolicyRule(
  name: string,
  condition: VisualPolicyCondition | VisualPolicyLogicalExpression,
  action: VisualPolicyActionType,
  options?: {
    description?: string;
    priority?: number;
    enabled?: boolean;
    tags?: string[];
    createdBy?: string;
  }
): VisualPolicyRule {
  const now = new Date().toISOString();
  
  return {
    id: randomUUID(),
    name,
    description: options?.description,
    enabled: options?.enabled ?? true,
    priority: options?.priority ?? 100,
    condition,
    action,
    tags: options?.tags ?? [],
    createdAt: now,
    updatedAt: now,
    createdBy: options?.createdBy ?? 'system',
    version: '1.0.0'
  };
}

/**
 * Creates a simple condition
 */
export function createCondition(
  type: VisualPolicyCondition['type'],
  operator: any,
  value: any,
  options?: {
    description?: string;
    metadata?: Record<string, any>;
  }
): VisualPolicyCondition {
  return {
    id: randomUUID(),
    type,
    operator,
    value,
    description: options?.description,
    metadata: options?.metadata
  } as VisualPolicyCondition;
}

/**
 * Creates a logical expression combining multiple conditions
 */
export function createLogicalExpression(
  operator: 'AND' | 'OR' | 'NOT',
  operands: (VisualPolicyCondition | VisualPolicyLogicalExpression)[]
): VisualPolicyLogicalExpression {
  return {
    id: randomUUID(),
    operator,
    operands
  };
}

/**
 * Creates an allow action
 */
export function createAllowAction(options?: {
  description?: string;
  timeLimit?: number;
  usageLimit?: number;
  requireMFA?: boolean;
}): VisualPolicyActionType {
  return {
    id: randomUUID(),
    type: 'allow',
    description: options?.description,
    conditions: {
      timeLimit: options?.timeLimit,
      usageLimit: options?.usageLimit,
      requireMFA: options?.requireMFA ?? false
    }
  };
}

/**
 * Creates a deny action
 */
export function createDenyAction(options?: {
  description?: string;
  reason?: string;
  notifyAdmin?: boolean;
}): VisualPolicyActionType {
  return {
    id: randomUUID(),
    type: 'deny',
    description: options?.description,
    reason: options?.reason,
    notifyAdmin: options?.notifyAdmin ?? false
  };
}

/**
 * Creates a throttle action
 */
export function createThrottleAction(
  limits: {
    requestsPerMinute?: number;
    requestsPerHour?: number;
    requestsPerDay?: number;
    burstLimit?: number;
  },
  options?: {
    description?: string;
  }
): VisualPolicyActionType {
  return {
    id: randomUUID(),
    type: 'throttle',
    description: options?.description,
    limits
  };
}

// ============================================================================
// POLICY ANALYSIS UTILITIES
// ============================================================================

/**
 * Analyzes a policy for potential issues
 */
export interface PolicyAnalysisResult {
  issues: PolicyIssue[];
  warnings: PolicyWarning[];
  suggestions: PolicySuggestion[];
  complexity: 'low' | 'medium' | 'high';
  coverage: {
    trustLevels: VisualPolicyTrustLevel[];
    tools: string[];
    conditions: string[];
  };
}

export interface PolicyIssue {
  type: 'error' | 'warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  ruleId?: string;
  suggestion?: string;
}

export interface PolicyWarning {
  type: 'performance' | 'security' | 'usability';
  message: string;
  ruleId?: string;
}

export interface PolicySuggestion {
  type: 'optimization' | 'security' | 'usability';
  message: string;
  action?: string;
}

/**
 * Analyzes a policy for issues and optimization opportunities
 */
export function analyzePolicy(policy: ATPVisualPolicy): PolicyAnalysisResult {
  const issues: PolicyIssue[] = [];
  const warnings: PolicyWarning[] = [];
  const suggestions: PolicySuggestion[] = [];
  
  // Check for duplicate priorities
  const priorities = policy.rules.map(rule => rule.priority);
  const duplicatePriorities = priorities.filter((priority, index) => priorities.indexOf(priority) !== index);
  
  if (duplicatePriorities.length > 0) {
    issues.push({
      type: 'warning',
      severity: 'medium',
      message: `Duplicate rule priorities found: ${duplicatePriorities.join(', ')}`,
      suggestion: 'Ensure each rule has a unique priority for predictable evaluation order'
    });
  }
  
  // Check for unreachable rules
  const sortedRules = [...policy.rules].sort((a, b) => a.priority - b.priority);
  for (let i = 0; i < sortedRules.length - 1; i++) {
    const currentRule = sortedRules[i];
    if (currentRule.action.type === 'deny' && isUnconditionalRule(currentRule)) {
      const unreachableRules = sortedRules.slice(i + 1);
      if (unreachableRules.length > 0) {
        issues.push({
          type: 'warning',
          severity: 'high',
          message: `${unreachableRules.length} rules are unreachable after unconditional deny rule "${currentRule.name}"`,
          ruleId: currentRule.id,
          suggestion: 'Move conditional rules before unconditional deny rules'
        });
      }
      break;
    }
  }
  
  // Check for overly complex conditions
  policy.rules.forEach(rule => {
    const complexity = calculateConditionComplexity(rule.condition);
    if (complexity > 10) {
      warnings.push({
        type: 'performance',
        message: `Rule "${rule.name}" has high complexity (${complexity}). Consider simplifying.`,
        ruleId: rule.id
      });
    }
  });
  
  // Check for security best practices
  const hasDefaultDeny = policy.defaultAction === 'deny';
  if (!hasDefaultDeny) {
    issues.push({
      type: 'warning',
      severity: 'high',
      message: 'Policy uses default allow action, which may be less secure',
      suggestion: 'Consider using default deny with explicit allow rules'
    });
  }
  
  // Analyze coverage
  const trustLevels = extractTrustLevels(policy);
  const tools = extractTools(policy);
  const conditions = extractConditionTypes(policy);
  
  // Calculate overall complexity
  const totalRules = policy.rules.length;
  const avgComplexity = policy.rules.reduce((sum, rule) => 
    sum + calculateConditionComplexity(rule.condition), 0) / totalRules;
  
  let complexity: 'low' | 'medium' | 'high';
  if (totalRules <= 5 && avgComplexity <= 3) {
    complexity = 'low';
  } else if (totalRules <= 15 && avgComplexity <= 7) {
    complexity = 'medium';
  } else {
    complexity = 'high';
  }
  
  // Generate suggestions
  if (policy.rules.length === 1 && isUnconditionalRule(policy.rules[0])) {
    suggestions.push({
      type: 'usability',
      message: 'Consider adding more granular rules for better access control',
      action: 'Add conditions based on trust level, credentials, or context'
    });
  }
  
  if (trustLevels.length === 1) {
    suggestions.push({
      type: 'security',
      message: 'Policy only considers one trust level',
      action: 'Add rules for different trust levels to improve security'
    });
  }
  
  return {
    issues,
    warnings,
    suggestions,
    complexity,
    coverage: {
      trustLevels,
      tools,
      conditions
    }
  };
}

/**
 * Checks if a rule is unconditional (always matches)
 */
function isUnconditionalRule(rule: VisualPolicyRule): boolean {
  // This is a simplified check - in practice, you'd need more sophisticated analysis
  if ('type' in rule.condition) {
    const condition = rule.condition as VisualPolicyCondition;
    return condition.type === 'trust_level' && 
           condition.operator === 'greater_than_or_equal' && 
           condition.value === 'UNKNOWN';
  }
  return false;
}

/**
 * Calculates the complexity of a condition or logical expression
 */
function calculateConditionComplexity(condition: VisualPolicyCondition | VisualPolicyLogicalExpression): number {
  if ('type' in condition) {
    // Simple condition
    return 1;
  } else {
    // Logical expression
    const expr = condition as VisualPolicyLogicalExpression;
    return 1 + expr.operands.reduce((sum: number, operand: any) => sum + calculateConditionComplexity(operand), 0);
  }
}

/**
 * Extracts all trust levels referenced in the policy
 */
function extractTrustLevels(policy: ATPVisualPolicy): VisualPolicyTrustLevel[] {
  const trustLevels = new Set<VisualPolicyTrustLevel>();
  
  function extractFromCondition(condition: VisualPolicyCondition | VisualPolicyLogicalExpression) {
    if ('type' in condition) {
      const cond = condition as VisualPolicyCondition;
      if (cond.type === 'trust_level') {
        if (typeof cond.value === 'string') {
          trustLevels.add(cond.value as VisualPolicyTrustLevel);
        } else if (Array.isArray(cond.value)) {
          cond.value.forEach(level => {
            if (typeof level === 'string') {
              trustLevels.add(level as VisualPolicyTrustLevel);
            }
          });
        }
      }
    } else {
      const expr = condition as VisualPolicyLogicalExpression;
      expr.operands.forEach((operand: any) => extractFromCondition(operand));
    }
  }
  
  policy.rules.forEach(rule => extractFromCondition(rule.condition));
  
  return Array.from(trustLevels);
}

/**
 * Extracts all tools referenced in the policy
 */
function extractTools(policy: ATPVisualPolicy): string[] {
  const tools = new Set<string>();
  
  function extractFromCondition(condition: VisualPolicyCondition | VisualPolicyLogicalExpression) {
    if ('type' in condition) {
      const cond = condition as VisualPolicyCondition;
      if (cond.type === 'tool') {
        if (typeof cond.value === 'string') {
          tools.add(cond.value);
        } else if (Array.isArray(cond.value)) {
          cond.value.forEach(tool => {
            if (typeof tool === 'string') {
              tools.add(tool);
            }
          });
        } else if (typeof cond.value === 'object' && cond.value.toolId) {
          tools.add(cond.value.toolId);
        }
      }
    } else {
      const expr = condition as VisualPolicyLogicalExpression;
      expr.operands.forEach((operand: any) => extractFromCondition(operand));
    }
  }
  
  policy.rules.forEach(rule => extractFromCondition(rule.condition));
  
  return Array.from(tools);
}

/**
 * Extracts all condition types used in the policy
 */
function extractConditionTypes(policy: ATPVisualPolicy): string[] {
  const conditionTypes = new Set<string>();
  
  function extractFromCondition(condition: VisualPolicyCondition | VisualPolicyLogicalExpression) {
    if ('type' in condition) {
      const cond = condition as VisualPolicyCondition;
      conditionTypes.add(cond.type);
    } else {
      const expr = condition as VisualPolicyLogicalExpression;
      expr.operands.forEach((operand: any) => extractFromCondition(operand));
    }
  }
  
  policy.rules.forEach(rule => extractFromCondition(rule.condition));
  
  return Array.from(conditionTypes);
}

// ============================================================================
// POLICY TRANSFORMATION UTILITIES
// ============================================================================

/**
 * Clones a policy with a new ID and timestamps
 */
export function clonePolicy(
  policy: ATPVisualPolicy, 
  newName: string,
  createdBy: string
): ATPVisualPolicy {
  const now = new Date().toISOString();
  
  return {
    ...policy,
    id: randomUUID(),
    name: newName,
    createdBy,
    createdAt: now,
    updatedAt: now,
    rules: policy.rules.map(rule => ({
      ...rule,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      createdBy
    })),
    auditLog: [{
      timestamp: now,
      action: 'created',
      actor: createdBy,
      reason: `Cloned from policy: ${policy.name}`
    }]
  };
}

/**
 * Merges multiple policies into one
 */
export function mergePolicies(
  policies: ATPVisualPolicy[],
  newName: string,
  organizationId: string,
  createdBy: string
): ATPVisualPolicy {
  if (policies.length === 0) {
    throw new Error('Cannot merge empty policy list');
  }
  
  const now = new Date().toISOString();
  const allRules: VisualPolicyRule[] = [];
  let priorityOffset = 0;
  
  // Combine rules from all policies, adjusting priorities to avoid conflicts
  policies.forEach((policy, index) => {
    const adjustedRules = policy.rules.map(rule => ({
      ...rule,
      id: randomUUID(),
      priority: rule.priority + priorityOffset,
      createdAt: now,
      updatedAt: now,
      createdBy,
      tags: [...rule.tags, `merged-from-${policy.name}`]
    }));
    
    allRules.push(...adjustedRules);
    priorityOffset += 1000; // Ensure no priority conflicts
  });
  
  return {
    id: randomUUID(),
    name: newName,
    description: `Merged policy from: ${policies.map(p => p.name).join(', ')}`,
    version: '1.0.0',
    organizationId,
    createdBy,
    createdAt: now,
    updatedAt: now,
    enabled: true,
    defaultAction: 'deny', // Use most restrictive default
    evaluationMode: 'priority_order',
    rules: allRules,
    tags: ['merged'],
    testCases: [],
    auditLog: [{
      timestamp: now,
      action: 'created',
      actor: createdBy,
      reason: `Merged from ${policies.length} policies`
    }]
  };
}

/**
 * Optimizes a policy by removing redundant rules and simplifying conditions
 */
export function optimizePolicy(policy: ATPVisualPolicy): ATPVisualPolicy {
  const optimizedRules = [...policy.rules];
  
  // Remove disabled rules
  const enabledRules = optimizedRules.filter(rule => rule.enabled);
  
  // Sort by priority
  enabledRules.sort((a, b) => a.priority - b.priority);
  
  // TODO: Add more sophisticated optimization logic
  // - Remove redundant rules
  // - Simplify complex conditions
  // - Merge similar rules
  
  return {
    ...policy,
    rules: enabledRules,
    updatedAt: new Date().toISOString()
  };
}

// ============================================================================
// POLICY VALIDATION UTILITIES
// ============================================================================

/**
 * Validates policy consistency and returns validation errors
 */
export interface PolicyValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Performs comprehensive policy validation
 */
export function validatePolicyConsistency(policy: ATPVisualPolicy): PolicyValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for empty rules
  if (policy.rules.length === 0) {
    errors.push('Policy must have at least one rule');
  }
  
  // Check for duplicate rule names
  const ruleNames = policy.rules.map(rule => rule.name);
  const duplicateNames = ruleNames.filter((name, index) => ruleNames.indexOf(name) !== index);
  if (duplicateNames.length > 0) {
    warnings.push(`Duplicate rule names found: ${duplicateNames.join(', ')}`);
  }
  
  // Check priority ranges
  policy.rules.forEach(rule => {
    if (rule.priority < 0 || rule.priority > 1000) {
      errors.push(`Rule "${rule.name}" has invalid priority: ${rule.priority}`);
    }
  });
  
  // Check for circular references in logical expressions
  policy.rules.forEach(rule => {
    if (hasCircularReference(rule.condition, new Set())) {
      errors.push(`Rule "${rule.name}" has circular reference in conditions`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Checks for circular references in logical expressions
 */
function hasCircularReference(
  condition: VisualPolicyCondition | VisualPolicyLogicalExpression,
  visited: Set<string>
): boolean {
  if ('type' in condition) {
    // Simple condition - no circular reference possible
    return false;
  }
  
  const expr = condition as VisualPolicyLogicalExpression;
  if (visited.has(expr.id)) {
    return true;
  }
  
  visited.add(expr.id);
  
  for (const operand of expr.operands) {
    if (hasCircularReference(operand, new Set(visited))) {
      return true;
    }
  }
  
  return false;
}