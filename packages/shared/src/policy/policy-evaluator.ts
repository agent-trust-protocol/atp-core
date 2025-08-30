/**
 * Policy Evaluator - Runtime policy evaluation engine
 * 
 * This module provides the core policy evaluation engine that the ATP Gateway
 * uses to evaluate visual trust policies against incoming requests in real-time.
 */

import { randomUUID } from 'crypto';
import {
  ATPVisualPolicy,
  VisualPolicyRule,
  VisualPolicyCondition,
  VisualPolicyActionType,
  VisualPolicyLogicalExpression,
  VisualPolicyTrustLevel,
  VisualPolicyAction,
  VisualPolicyComparisonOperator
} from './visual-policy-schema.js';

// ============================================================================
// EVALUATION CONTEXT TYPES
// ============================================================================

/**
 * Context information for policy evaluation
 */
export interface PolicyEvaluationContext {
  // Agent information
  agentDID: string;
  trustLevel: VisualPolicyTrustLevel;
  trustScore?: number; // Numeric trust score (0-5)
  credentials: VerifiableCredentialInfo[];
  
  // Request information
  tool: ToolInfo;
  requestedAction: string;
  
  // Session and context
  sessionInfo?: SessionInfo;
  requestContext?: RequestContext;
  
  // Organization
  organizationId: string;
  
  // Timestamp
  timestamp: string;
}

export interface VerifiableCredentialInfo {
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: any;
  isExpired: boolean;
  isRevoked: boolean;
}

export interface ToolInfo {
  id: string;
  type: string; // 'api', 'database', 'file_system', etc.
  endpoint?: string;
  method?: string;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  metadata?: any;
}

export interface SessionInfo {
  sessionId: string;
  startTime: string;
  lastActivity: string;
  mfaVerified: boolean;
  ipAddress: string;
  userAgent: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

export interface RequestContext {
  requestId: string;
  headers: Record<string, string>;
  parameters?: any;
  riskScore?: number; // 0-100
  metadata?: any;
}

// ============================================================================
// EVALUATION RESULT TYPES
// ============================================================================

/**
 * Result of policy evaluation
 */
export interface PolicyEvaluationResult {
  decision: 'allow' | 'deny' | 'throttle' | 'require_approval';
  action: VisualPolicyActionType;
  matchedRule?: VisualPolicyRule;
  reason: string;
  obligations?: PolicyObligation[];
  metadata?: any;
  evaluationTrace?: EvaluationStep[];
  processingTime: number; // milliseconds
}

export interface PolicyObligation {
  type: 'log' | 'alert' | 'mfa_required' | 'time_limit' | 'usage_limit' | 'throttle';
  parameters: any;
  description: string;
}

export interface EvaluationStep {
  ruleId: string;
  ruleName: string;
  conditionResult: boolean;
  actionTaken?: string;
  processingTime: number;
  details?: any;
}

// ============================================================================
// POLICY EVALUATOR CLASS
// ============================================================================

export class PolicyEvaluator {
  private debugMode: boolean = false;
  
  constructor(options?: { debugMode?: boolean }) {
    this.debugMode = options?.debugMode || false;
  }
  
  /**
   * Evaluates a policy against the given context
   */
  async evaluatePolicy(
    policy: ATPVisualPolicy, 
    context: PolicyEvaluationContext
  ): Promise<PolicyEvaluationResult> {
    const startTime = Date.now();
    const evaluationTrace: EvaluationStep[] = [];
    
    try {
      // Check if policy is enabled
      if (!policy.enabled) {
        return {
          decision: 'deny',
          action: { id: randomUUID(), type: 'deny', reason: 'Policy is disabled', notifyAdmin: false },
          reason: 'Policy is disabled',
          processingTime: Date.now() - startTime
        };
      }
      
      // Sort rules by priority (lower number = higher priority)
      const sortedRules = [...policy.rules]
        .filter(rule => rule.enabled)
        .sort((a, b) => a.priority - b.priority);
      
      // Evaluate rules based on evaluation mode
      switch (policy.evaluationMode) {
        case 'first_match':
          return await this.evaluateFirstMatch(sortedRules, context, evaluationTrace, startTime);
          
        case 'all_rules':
          return await this.evaluateAllRules(sortedRules, context, evaluationTrace, startTime);
          
        case 'priority_order':
        default:
          return await this.evaluatePriorityOrder(sortedRules, context, evaluationTrace, startTime, policy.defaultAction);
      }
      
    } catch (error) {
      return {
        decision: 'deny',
        action: { id: randomUUID(), type: 'deny', reason: 'Evaluation error', notifyAdmin: false },
        reason: `Policy evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        processingTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Evaluates rules until the first match is found
   */
  private async evaluateFirstMatch(
    rules: VisualPolicyRule[],
    context: PolicyEvaluationContext,
    trace: EvaluationStep[],
    startTime: number
  ): Promise<PolicyEvaluationResult> {
    for (const rule of rules) {
      const ruleStartTime = Date.now();
      const conditionResult = await this.evaluateCondition(rule.condition, context);
      
      const step: EvaluationStep = {
        ruleId: rule.id,
        ruleName: rule.name,
        conditionResult,
        processingTime: Date.now() - ruleStartTime
      };
      
      if (conditionResult) {
        step.actionTaken = rule.action.type;
        trace.push(step);
        
        return {
          decision: this.mapActionToDecision(rule.action),
          action: rule.action,
          matchedRule: rule,
          reason: `Matched rule: ${rule.name}`,
          obligations: this.extractObligations(rule.action),
          evaluationTrace: this.debugMode ? trace : undefined,
          processingTime: Date.now() - startTime
        };
      }
      
      trace.push(step);
    }
    
    // No rules matched
    return {
      decision: 'deny',
      action: { id: randomUUID(), type: 'deny', reason: 'No matching rules', notifyAdmin: false },
      reason: 'No rules matched the request',
      evaluationTrace: this.debugMode ? trace : undefined,
      processingTime: Date.now() - startTime
    };
  }
  
  /**
   * Evaluates all rules and combines results
   */
  private async evaluateAllRules(
    rules: VisualPolicyRule[],
    context: PolicyEvaluationContext,
    trace: EvaluationStep[],
    startTime: number
  ): Promise<PolicyEvaluationResult> {
    const matchedRules: VisualPolicyRule[] = [];
    const obligations: PolicyObligation[] = [];
    
    for (const rule of rules) {
      const ruleStartTime = Date.now();
      const conditionResult = await this.evaluateCondition(rule.condition, context);
      
      const step: EvaluationStep = {
        ruleId: rule.id,
        ruleName: rule.name,
        conditionResult,
        processingTime: Date.now() - ruleStartTime
      };
      
      if (conditionResult) {
        matchedRules.push(rule);
        step.actionTaken = rule.action.type;
        obligations.push(...this.extractObligations(rule.action));
      }
      
      trace.push(step);
    }
    
    // Determine final decision based on all matched rules
    const finalDecision = this.combineRuleDecisions(matchedRules);
    
    return {
      decision: finalDecision.decision,
      action: finalDecision.action,
      reason: `Evaluated ${rules.length} rules, ${matchedRules.length} matched`,
      obligations,
      evaluationTrace: this.debugMode ? trace : undefined,
      processingTime: Date.now() - startTime
    };
  }
  
  /**
   * Evaluates rules in priority order, stopping at first decisive action
   */
  private async evaluatePriorityOrder(
    rules: VisualPolicyRule[],
    context: PolicyEvaluationContext,
    trace: EvaluationStep[],
    startTime: number,
    defaultAction: VisualPolicyAction
  ): Promise<PolicyEvaluationResult> {
    const obligations: PolicyObligation[] = [];
    
    for (const rule of rules) {
      const ruleStartTime = Date.now();
      const conditionResult = await this.evaluateCondition(rule.condition, context);
      
      const step: EvaluationStep = {
        ruleId: rule.id,
        ruleName: rule.name,
        conditionResult,
        processingTime: Date.now() - ruleStartTime
      };
      
      if (conditionResult) {
        step.actionTaken = rule.action.type;
        trace.push(step);
        
        // Collect obligations from this rule
        obligations.push(...this.extractObligations(rule.action));
        
        // Check if this is a decisive action (allow/deny)
        if (rule.action.type === 'allow' || rule.action.type === 'deny' || rule.action.type === 'require_approval') {
          return {
            decision: this.mapActionToDecision(rule.action),
            action: rule.action,
            matchedRule: rule,
            reason: `Matched rule: ${rule.name}`,
            obligations,
            evaluationTrace: this.debugMode ? trace : undefined,
            processingTime: Date.now() - startTime
          };
        }
      }
      
      trace.push(step);
    }
    
    // No decisive rule matched, use default action
    const decision = defaultAction === 'allow' ? 'allow' : 'deny';
    return {
      decision,
      action: decision === 'allow' ? {
        id: randomUUID(),
        type: 'allow' as const,
        description: 'Default action applied'
      } : {
        id: randomUUID(),
        type: 'deny' as const,
        reason: 'Default action applied',
        notifyAdmin: false
      },
      reason: `No decisive rules matched, applied default action: ${defaultAction}`,
      obligations,
      evaluationTrace: this.debugMode ? trace : undefined,
      processingTime: Date.now() - startTime
    };
  }
  
  /**
   * Evaluates a condition or logical expression
   */
  private async evaluateCondition(
    condition: VisualPolicyCondition | VisualPolicyLogicalExpression,
    context: PolicyEvaluationContext
  ): Promise<boolean> {
    // Handle logical expressions
    if ('operator' in condition && 'operands' in condition) {
      return await this.evaluateLogicalExpression(condition, context);
    }
    
    // Handle simple conditions
    return await this.evaluateSimpleCondition(condition as VisualPolicyCondition, context);
  }
  
  /**
   * Evaluates a logical expression (AND, OR, NOT)
   */
  private async evaluateLogicalExpression(
    expression: VisualPolicyLogicalExpression,
    context: PolicyEvaluationContext
  ): Promise<boolean> {
    const results = await Promise.all(
      expression.operands.map((operand: any) => this.evaluateCondition(operand, context))
    );
    
    switch (expression.operator) {
      case 'AND':
        return results.every(result => result);
        
      case 'OR':
        return results.some(result => result);
        
      case 'NOT':
        // NOT should have exactly one operand
        return !results[0];
        
      default:
        throw new Error(`Unknown logical operator: ${expression.operator}`);
    }
  }
  
  /**
   * Evaluates a simple condition
   */
  private async evaluateSimpleCondition(
    condition: VisualPolicyCondition,
    context: PolicyEvaluationContext
  ): Promise<boolean> {
    switch (condition.type) {
      case 'agent_did':
        return this.evaluateAgentDIDCondition(condition, context);
        
      case 'trust_level':
        return this.evaluateTrustLevelCondition(condition, context);
        
      case 'verifiable_credential':
        return this.evaluateVCCondition(condition, context);
        
      case 'tool':
        return this.evaluateToolCondition(condition, context);
        
      case 'time':
        return this.evaluateTimeCondition(condition, context);
        
      case 'context':
        return this.evaluateContextCondition(condition, context);
        
      case 'organization':
        return this.evaluateOrganizationCondition(condition, context);
        
      default:
        throw new Error(`Unknown condition type: ${(condition as any).type}`);
    }
  }
  
  /**
   * Evaluates agent DID condition
   */
  private evaluateAgentDIDCondition(condition: any, context: PolicyEvaluationContext): boolean {
    const agentDID = context.agentDID;
    const value = condition.value;
    
    return this.compareValues(agentDID, condition.operator, value);
  }
  
  /**
   * Evaluates trust level condition
   */
  private evaluateTrustLevelCondition(condition: any, context: PolicyEvaluationContext): boolean {
    const trustLevel = context.trustLevel;
    const trustScore = context.trustScore || this.trustLevelToScore(trustLevel);
    const value = condition.value;
    
    // Handle numeric comparisons
    if (typeof value === 'number') {
      return this.compareValues(trustScore, condition.operator, value);
    }
    
    // Handle trust level enum comparisons
    if (typeof value === 'string') {
      const valueScore = this.trustLevelToScore(value as VisualPolicyTrustLevel);
      return this.compareValues(trustScore, condition.operator, valueScore);
    }
    
    // Handle array of trust levels
    if (Array.isArray(value)) {
      return this.compareValues(trustLevel, condition.operator, value);
    }
    
    return false;
  }
  
  /**
   * Evaluates verifiable credential condition
   */
  private evaluateVCCondition(condition: any, context: PolicyEvaluationContext): boolean {
    const credentials = context.credentials;
    const vcCondition = condition.value;
    
    for (const credential of credentials) {
      // Check expiration if required
      if (vcCondition.expirationCheck && credential.isExpired) {
        continue;
      }
      
      // Check if revoked
      if (credential.isRevoked) {
        continue;
      }
      
      // Check credential type
      if (vcCondition.credentialType) {
        if (!credential.type.includes(vcCondition.credentialType)) {
          continue;
        }
      }
      
      // Check issuer
      if (vcCondition.issuer) {
        if (credential.issuer !== vcCondition.issuer) {
          continue;
        }
      }
      
      // Check claims
      if (vcCondition.claims) {
        let claimsMatch = true;
        for (const [key, expectedValue] of Object.entries(vcCondition.claims)) {
          if (credential.credentialSubject[key] !== expectedValue) {
            claimsMatch = false;
            break;
          }
        }
        if (!claimsMatch) {
          continue;
        }
      }
      
      // If we get here, the credential matches
      return condition.operator === 'contains' || condition.operator === 'equals';
    }
    
    // No matching credential found
    return condition.operator === 'not_contains' || condition.operator === 'not_equals';
  }
  
  /**
   * Evaluates tool condition
   */
  private evaluateToolCondition(condition: any, context: PolicyEvaluationContext): boolean {
    const tool = context.tool;
    const value = condition.value;
    
    if (typeof value === 'string') {
      return this.compareValues(tool.id, condition.operator, value);
    }
    
    if (Array.isArray(value)) {
      return this.compareValues(tool.id, condition.operator, value);
    }
    
    if (typeof value === 'object') {
      // Check individual tool properties
      if (value.toolId && !this.compareValues(tool.id, 'equals', value.toolId)) {
        return false;
      }
      
      if (value.toolType && !this.compareValues(tool.type, 'equals', value.toolType)) {
        return false;
      }
      
      if (value.endpoint && tool.endpoint && !this.compareValues(tool.endpoint, 'equals', value.endpoint)) {
        return false;
      }
      
      if (value.sensitivity && !this.compareValues(tool.sensitivity, 'equals', value.sensitivity)) {
        return false;
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Evaluates time condition
   */
  private evaluateTimeCondition(condition: any, context: PolicyEvaluationContext): boolean {
    const now = new Date(context.timestamp);
    const timeCondition = condition.value;
    
    // Check time range
    if (timeCondition.startTime && timeCondition.endTime) {
      const startTime = new Date(timeCondition.startTime);
      const endTime = new Date(timeCondition.endTime);
      
      if (now < startTime || now > endTime) {
        return false;
      }
    }
    
    // Check days of week
    if (timeCondition.daysOfWeek && timeCondition.daysOfWeek.length > 0) {
      const dayOfWeek = now.getDay(); // 0 = Sunday
      if (!timeCondition.daysOfWeek.includes(dayOfWeek)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Evaluates context condition
   */
  private evaluateContextCondition(condition: any, context: PolicyEvaluationContext): boolean {
    const sessionInfo = context.sessionInfo;
    const requestContext = context.requestContext;
    const contextCondition = condition.value;
    
    if (!sessionInfo && !requestContext) {
      return false;
    }
    
    // Check IP address
    if (contextCondition.ipAddress && sessionInfo?.ipAddress) {
      if (!this.compareValues(sessionInfo.ipAddress, condition.operator, contextCondition.ipAddress)) {
        return false;
      }
    }
    
    // Check user agent
    if (contextCondition.userAgent && sessionInfo?.userAgent) {
      if (!this.compareValues(sessionInfo.userAgent, condition.operator, contextCondition.userAgent)) {
        return false;
      }
    }
    
    // Check location
    if (contextCondition.location && sessionInfo?.location) {
      const location = sessionInfo.location;
      if (contextCondition.location.country && location.country) {
        if (!this.compareValues(location.country, 'equals', contextCondition.location.country)) {
          return false;
        }
      }
    }
    
    // Check risk score
    if (contextCondition.riskScore && requestContext?.riskScore !== undefined) {
      if (!this.compareValues(requestContext.riskScore, condition.operator, contextCondition.riskScore)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Evaluates organization condition
   */
  private evaluateOrganizationCondition(condition: any, context: PolicyEvaluationContext): boolean {
    const orgId = context.organizationId;
    const value = condition.value;
    
    if (typeof value === 'string') {
      return this.compareValues(orgId, condition.operator, value);
    }
    
    if (Array.isArray(value)) {
      return this.compareValues(orgId, condition.operator, value);
    }
    
    if (typeof value === 'object' && value.orgId) {
      return this.compareValues(orgId, condition.operator, value.orgId);
    }
    
    return false;
  }
  
  /**
   * Compares two values using the specified operator
   */
  private compareValues(actual: any, operator: VisualPolicyComparisonOperator, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
        
      case 'not_equals':
        return actual !== expected;
        
      case 'greater_than':
        return actual > expected;
        
      case 'greater_than_or_equal':
        return actual >= expected;
        
      case 'less_than':
        return actual < expected;
        
      case 'less_than_or_equal':
        return actual <= expected;
        
      case 'contains':
        if (typeof actual === 'string' && typeof expected === 'string') {
          return actual.includes(expected);
        }
        if (Array.isArray(expected)) {
          return expected.includes(actual);
        }
        return false;
        
      case 'not_contains':
        if (typeof actual === 'string' && typeof expected === 'string') {
          return !actual.includes(expected);
        }
        if (Array.isArray(expected)) {
          return !expected.includes(actual);
        }
        return true;
        
      case 'starts_with':
        return typeof actual === 'string' && typeof expected === 'string' && actual.startsWith(expected);
        
      case 'ends_with':
        return typeof actual === 'string' && typeof expected === 'string' && actual.endsWith(expected);
        
      case 'matches_regex':
        if (typeof actual === 'string' && typeof expected === 'string') {
          const regex = new RegExp(expected);
          return regex.test(actual);
        }
        return false;
        
      case 'in_list':
        return Array.isArray(expected) && expected.includes(actual);
        
      case 'not_in_list':
        return Array.isArray(expected) && !expected.includes(actual);
        
      default:
        throw new Error(`Unknown comparison operator: ${operator}`);
    }
  }
  
  /**
   * Converts trust level to numeric score
   */
  private trustLevelToScore(trustLevel: VisualPolicyTrustLevel): number {
    switch (trustLevel) {
      case 'UNKNOWN': return 0;
      case 'BASIC': return 1;
      case 'VERIFIED': return 2;
      case 'TRUSTED': return 3;
      case 'PRIVILEGED': return 4;
      default: return 0;
    }
  }
  
  /**
   * Maps policy action to evaluation decision
   */
  private mapActionToDecision(action: VisualPolicyActionType): 'allow' | 'deny' | 'throttle' | 'require_approval' {
    switch (action.type) {
      case 'allow':
        return 'allow';
      case 'deny':
        return 'deny';
      case 'throttle':
        return 'throttle';
      case 'require_approval':
        return 'require_approval';
      case 'log':
      case 'alert':
        // These are non-decisive actions, should not be used for final decision
        return 'allow'; // Default to allow for logging/alerting actions
      default:
        return 'deny';
    }
  }
  
  /**
   * Extracts obligations from a policy action
   */
  private extractObligations(action: VisualPolicyActionType): PolicyObligation[] {
    const obligations: PolicyObligation[] = [];
    
    switch (action.type) {
      case 'allow':
        if ('conditions' in action && action.conditions) {
          if (action.conditions.requireMFA) {
            obligations.push({
              type: 'mfa_required',
              parameters: {},
              description: 'Multi-factor authentication required'
            });
          }
          if (action.conditions.timeLimit) {
            obligations.push({
              type: 'time_limit',
              parameters: { minutes: action.conditions.timeLimit },
              description: `Access limited to ${action.conditions.timeLimit} minutes`
            });
          }
          if (action.conditions.usageLimit) {
            obligations.push({
              type: 'usage_limit',
              parameters: { count: action.conditions.usageLimit },
              description: `Access limited to ${action.conditions.usageLimit} uses`
            });
          }
        }
        break;
        
      case 'throttle':
        if ('limits' in action && action.limits) {
          obligations.push({
            type: 'throttle',
            parameters: action.limits,
            description: 'Request rate limiting applied'
          });
        }
        break;
        
      case 'log':
        obligations.push({
          type: 'log',
          parameters: {
            level: 'level' in action ? action.level : 'info',
            includeContext: 'includeContext' in action ? action.includeContext : true
          },
          description: 'Access attempt will be logged'
        });
        break;
        
      case 'alert':
        if ('severity' in action && 'channels' in action) {
          obligations.push({
            type: 'alert',
            parameters: {
              severity: action.severity,
              channels: action.channels,
              recipients: action.recipients
            },
            description: `Alert will be sent via ${action.channels.join(', ')}`
          });
        }
        break;
    }
    
    return obligations;
  }
  
  /**
   * Combines decisions from multiple matched rules
   */
  private combineRuleDecisions(rules: VisualPolicyRule[]): { decision: 'allow' | 'deny' | 'throttle' | 'require_approval', action: VisualPolicyActionType } {
    // If any rule denies, deny
    const denyRule = rules.find(rule => rule.action.type === 'deny');
    if (denyRule) {
      return { decision: 'deny', action: denyRule.action };
    }
    
    // If any rule requires approval, require approval
    const approvalRule = rules.find(rule => rule.action.type === 'require_approval');
    if (approvalRule) {
      return { decision: 'require_approval', action: approvalRule.action };
    }
    
    // If any rule throttles, throttle
    const throttleRule = rules.find(rule => rule.action.type === 'throttle');
    if (throttleRule) {
      return { decision: 'throttle', action: throttleRule.action };
    }
    
    // If any rule allows, allow
    const allowRule = rules.find(rule => rule.action.type === 'allow');
    if (allowRule) {
      return { decision: 'allow', action: allowRule.action };
    }
    
    // Default to deny
    return {
      decision: 'deny',
      action: { id: randomUUID(), type: 'deny', reason: 'No decisive action found', notifyAdmin: false }
    };
  }
}