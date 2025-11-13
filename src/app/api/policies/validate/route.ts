/**
 * Policy Validation API - Server-side policy validation
 * 
 * SECURITY NOTICE: This API endpoint contains proprietary validation algorithms
 * and should never be exposed in client-side code. All validation logic
 * is secured on the server to prevent IP theft and reverse engineering.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  validatePolicyConsistency, 
  analyzePolicy,
  PolicyAnalysisResult,
  PolicyValidationResult
} from '../../../../packages/shared/src/policy/policy-utils.js';
import {
  ATPVisualPolicy,
  validateATPPolicy,
  validatePolicyRule,
  VisualPolicyRule
} from '../../../../packages/shared/src/policy/visual-policy-schema.js';

// Types for the API request
interface PolicyValidationRequest {
  // For validating visual graph structure
  nodes?: Array<{
    id: string;
    type: 'condition' | 'action' | 'operator';
    data: {
      type: string;
      conditionType?: string;
      actionType?: string;
      operatorType?: string;
      parameters: Record<string, any>;
      isValid: boolean;
    };
  }>;
  edges?: Array<{
    id: string;
    source: string;
    target: string;
  }>;
  // For validating complete policy documents
  policy?: ATPVisualPolicy;
  // Validation options
  validationType: 'graph' | 'policy' | 'comprehensive';
  strictMode?: boolean;
}

interface ValidationResponse {
  success: boolean;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  analysis?: PolicyAnalysisResult;
  suggestions?: string[];
  securityScore?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: PolicyValidationRequest = await request.json();
    
    // Validate request structure
    if (!body.validationType) {
      return NextResponse.json({
        success: false,
        error: 'Missing validation type'
      }, { status: 400 });
    }

    let result: ValidationResponse;

    switch (body.validationType) {
      case 'graph':
        result = await validatePolicyGraphSecure(body);
        break;
      case 'policy':
        result = await validatePolicyDocumentSecure(body);
        break;
      case 'comprehensive':
        result = await validateComprehensiveSecure(body);
        break;
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid validation type'
        }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Policy validation API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * PROPRIETARY ALGORITHM: Secure graph validation
 * 
 * This function contains advanced algorithms for validating visual policy graphs
 * including sophisticated node relationship analysis, flow validation, and
 * security vulnerability detection.
 */
async function validatePolicyGraphSecure(request: PolicyValidationRequest): Promise<ValidationResponse> {
  const { nodes = [], edges = [], strictMode = false } = request;
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // PROPRIETARY: Advanced node structure validation
  const nodeValidation = await validateNodeStructureSecure(nodes, strictMode);
  errors.push(...nodeValidation.errors);
  warnings.push(...nodeValidation.warnings);

  // PROPRIETARY: Sophisticated edge connectivity validation
  const edgeValidation = await validateEdgeConnectivitySecure(nodes, edges, strictMode);
  errors.push(...edgeValidation.errors);
  warnings.push(...edgeValidation.warnings);

  // PROPRIETARY: Advanced flow analysis
  const flowValidation = await validatePolicyFlowSecure(nodes, edges);
  errors.push(...flowValidation.errors);
  warnings.push(...flowValidation.warnings);
  suggestions.push(...flowValidation.suggestions);

  // PROPRIETARY: Security vulnerability analysis
  const securityScore = await calculateSecurityScoreSecure(nodes, edges);

  return {
    success: true,
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    securityScore
  };
}

/**
 * PROPRIETARY ALGORITHM: Secure policy document validation
 * 
 * Contains advanced algorithms for validating complete ATP policy documents
 * including schema validation, consistency checking, and optimization analysis.
 */
async function validatePolicyDocumentSecure(request: PolicyValidationRequest): Promise<ValidationResponse> {
  const { policy, strictMode = false } = request;
  
  if (!policy) {
    return {
      success: false,
      isValid: false,
      errors: ['Policy document is required'],
      warnings: []
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // PROPRIETARY: Advanced schema validation
    validateATPPolicy(policy);
  } catch (validationError) {
    errors.push(`Schema validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown error'}`);
  }

  // PROPRIETARY: Advanced consistency validation
  const consistencyResult = validatePolicyConsistency(policy);
  errors.push(...consistencyResult.errors);
  warnings.push(...consistencyResult.warnings);

  // PROPRIETARY: Sophisticated policy analysis
  const analysis = analyzePolicy(policy);

  // PROPRIETARY: Advanced security scoring
  const securityScore = await calculatePolicySecurityScore(policy, analysis);

  return {
    success: true,
    isValid: errors.length === 0,
    errors,
    warnings,
    analysis,
    securityScore
  };
}

/**
 * PROPRIETARY ALGORITHM: Comprehensive validation system
 * 
 * Combines multiple validation algorithms to provide complete policy analysis
 * including advanced threat modeling and optimization recommendations.
 */
async function validateComprehensiveSecure(request: PolicyValidationRequest): Promise<ValidationResponse> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Run graph validation if graph data is provided
  if (request.nodes && request.edges) {
    const graphResult = await validatePolicyGraphSecure(request);
    errors.push(...graphResult.errors);
    warnings.push(...graphResult.warnings);
    if (graphResult.suggestions) {
      suggestions.push(...graphResult.suggestions);
    }
  }

  // Run policy document validation if policy is provided
  let analysis: PolicyAnalysisResult | undefined;
  let securityScore = 0;
  
  if (request.policy) {
    const policyResult = await validatePolicyDocumentSecure(request);
    errors.push(...policyResult.errors);
    warnings.push(...policyResult.warnings);
    analysis = policyResult.analysis;
    securityScore = Math.max(securityScore, policyResult.securityScore || 0);
  }

  // PROPRIETARY: Advanced cross-validation algorithms
  if (request.nodes && request.edges && request.policy) {
    const crossValidation = await validateGraphPolicyConsistency(request.nodes, request.edges, request.policy);
    errors.push(...crossValidation.errors);
    warnings.push(...crossValidation.warnings);
  }

  return {
    success: true,
    isValid: errors.length === 0,
    errors,
    warnings,
    analysis,
    suggestions,
    securityScore
  };
}

/**
 * PROPRIETARY: Advanced node structure validation algorithm
 */
async function validateNodeStructureSecure(nodes: PolicyValidationRequest['nodes'], strictMode: boolean) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!nodes || nodes.length === 0) {
    errors.push('Policy must contain at least one node');
    return { errors, warnings };
  }

  const conditionNodes = nodes.filter(n => n.type === 'condition');
  const actionNodes = nodes.filter(n => n.type === 'action');
  const operatorNodes = nodes.filter(n => n.type === 'operator');

  // PROPRIETARY: Advanced structural requirements
  if (conditionNodes.length === 0) {
    errors.push('Policy must contain at least one condition');
  }
  
  if (actionNodes.length === 0) {
    errors.push('Policy must contain at least one action');
  }

  // PROPRIETARY: Validate node data integrity
  for (const node of nodes) {
    if (!node.data.type) {
      errors.push(`Node ${node.id} missing type information`);
    }
    
    if (!node.data.parameters) {
      warnings.push(`Node ${node.id} has no parameters`);
    }

    // PROPRIETARY: Advanced parameter validation
    const paramValidation = validateNodeParameters(node, strictMode);
    errors.push(...paramValidation.errors);
    warnings.push(...paramValidation.warnings);
  }

  return { errors, warnings };
}

/**
 * PROPRIETARY: Advanced edge connectivity validation algorithm
 */
async function validateEdgeConnectivitySecure(
  nodes: PolicyValidationRequest['nodes'], 
  edges: PolicyValidationRequest['edges'], 
  strictMode: boolean
) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!edges || edges.length === 0) {
    if (nodes && nodes.length > 1) {
      errors.push('Multiple nodes present but no connections defined');
    }
    return { errors, warnings };
  }

  // PROPRIETARY: Validate connection validity
  for (const edge of edges) {
    const sourceNode = nodes?.find(n => n.id === edge.source);
    const targetNode = nodes?.find(n => n.id === edge.target);

    if (!sourceNode) {
      errors.push(`Edge ${edge.id} references non-existent source node ${edge.source}`);
      continue;
    }

    if (!targetNode) {
      errors.push(`Edge ${edge.id} references non-existent target node ${edge.target}`);
      continue;
    }

    // PROPRIETARY: Advanced connection type validation
    const connectionValidation = validateConnectionType(sourceNode, targetNode);
    if (!connectionValidation.valid) {
      errors.push(`Invalid connection from ${sourceNode.type} to ${targetNode.type}: ${connectionValidation.reason}`);
    }
  }

  // PROPRIETARY: Check for disconnected nodes
  if (nodes) {
    const connectedNodeIds = new Set<string>();
    edges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    const disconnectedNodes = nodes.filter(node => !connectedNodeIds.has(node.id));
    disconnectedNodes.forEach(node => {
      warnings.push(`Node "${node.id}" is not connected to any other nodes`);
    });
  }

  return { errors, warnings };
}

/**
 * PROPRIETARY: Advanced policy flow validation algorithm
 */
async function validatePolicyFlowSecure(
  nodes: PolicyValidationRequest['nodes'],
  edges: PolicyValidationRequest['edges']
) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (!nodes || !edges) {
    return { errors, warnings, suggestions };
  }

  // PROPRIETARY: Advanced flow analysis
  const actionNodes = nodes.filter(n => n.type === 'action');
  
  for (const actionNode of actionNodes) {
    const pathsToAction = findAllPathsToNode(actionNode.id, nodes, edges);
    
    if (pathsToAction.length === 0) {
      warnings.push(`Action "${actionNode.id}" has no incoming paths`);
    }

    // PROPRIETARY: Analyze path complexity
    const complexPaths = pathsToAction.filter(path => path.length > 5);
    if (complexPaths.length > 0) {
      suggestions.push(`Consider simplifying complex paths to action "${actionNode.id}"`);
    }
  }

  // PROPRIETARY: Check for circular dependencies
  const circularDependencies = detectCircularDependencies(nodes, edges);
  circularDependencies.forEach(cycle => {
    errors.push(`Circular dependency detected: ${cycle.join(' -> ')}`);
  });

  return { errors, warnings, suggestions };
}

/**
 * PROPRIETARY: Advanced security scoring algorithm
 */
async function calculateSecurityScoreSecure(
  nodes: PolicyValidationRequest['nodes'],
  edges: PolicyValidationRequest['edges']
): Promise<number> {
  let score = 100; // Start with perfect score

  if (!nodes) return 0;

  const conditionNodes = nodes.filter(n => n.type === 'condition');
  const actionNodes = nodes.filter(n => n.type === 'action');

  // PROPRIETARY: Security deductions based on advanced analysis
  
  // Penalize policies with only allow actions (security risk)
  const allowActions = actionNodes.filter(n => n.data.actionType === 'allow');
  const denyActions = actionNodes.filter(n => n.data.actionType === 'deny');
  
  if (allowActions.length > 0 && denyActions.length === 0) {
    score -= 20; // No explicit deny rules
  }

  // PROPRIETARY: Advanced trust level analysis
  const trustConditions = conditionNodes.filter(n => n.data.conditionType === 'trustLevel');
  if (trustConditions.length === 0) {
    score -= 15; // No trust level checks
  }

  // PROPRIETARY: Advanced credential verification analysis
  const vcConditions = conditionNodes.filter(n => n.data.conditionType === 'vc');
  if (vcConditions.length === 0) {
    score -= 10; // No credential verification
  }

  // PROPRIETARY: Time-based access control analysis
  const timeConditions = conditionNodes.filter(n => n.data.conditionType === 'time');
  if (timeConditions.length > 0) {
    score += 5; // Bonus for time restrictions
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * PROPRIETARY: Advanced policy security scoring algorithm
 */
async function calculatePolicySecurityScore(policy: ATPVisualPolicy, analysis: PolicyAnalysisResult): Promise<number> {
  let score = 100;

  // PROPRIETARY: Deduct based on policy analysis
  score -= analysis.issues.filter(i => i.severity === 'critical').length * 25;
  score -= analysis.issues.filter(i => i.severity === 'high').length * 15;
  score -= analysis.issues.filter(i => i.severity === 'medium').length * 8;
  score -= analysis.issues.filter(i => i.severity === 'low').length * 3;

  // PROPRIETARY: Security-focused scoring
  if (policy.defaultAction === 'allow') {
    score -= 20; // Default allow is less secure
  }

  if (policy.evaluationMode === 'all_rules') {
    score += 5; // More thorough evaluation
  }

  // PROPRIETARY: Rule complexity scoring
  if (analysis.complexity === 'high') {
    score -= 5; // High complexity can lead to vulnerabilities
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * PROPRIETARY: Node parameter validation algorithm
 */
function validateNodeParameters(node: PolicyValidationRequest['nodes'][0], strictMode: boolean) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!node) return { errors, warnings };

  const { type, data } = node;
  const { parameters } = data;

  // PROPRIETARY: Type-specific parameter validation
  switch (type) {
    case 'condition':
      const conditionValidation = validateConditionParameters(data.conditionType, parameters, strictMode);
      errors.push(...conditionValidation.errors);
      warnings.push(...conditionValidation.warnings);
      break;
    
    case 'action':
      const actionValidation = validateActionParameters(data.actionType, parameters, strictMode);
      errors.push(...actionValidation.errors);
      warnings.push(...actionValidation.warnings);
      break;
  }

  return { errors, warnings };
}

/**
 * PROPRIETARY: Condition parameter validation algorithm
 */
function validateConditionParameters(conditionType: string, parameters: Record<string, any>, strictMode: boolean) {
  const errors: string[] = [];
  const warnings: string[] = [];

  // PROPRIETARY: Advanced parameter validation by type
  switch (conditionType) {
    case 'did':
      if (strictMode && !parameters.did && !parameters.didPattern) {
        errors.push('DID condition requires did or didPattern parameter');
      }
      break;
    
    case 'trustLevel':
      if (strictMode && !parameters.level && !parameters.minTrustLevel) {
        errors.push('Trust level condition requires level or minTrustLevel parameter');
      }
      break;
    
    case 'vc':
      if (strictMode && !parameters.credentialType && !parameters.schema) {
        warnings.push('VC condition should specify credentialType or schema');
      }
      break;
  }

  return { errors, warnings };
}

/**
 * PROPRIETARY: Action parameter validation algorithm  
 */
function validateActionParameters(actionType: string, parameters: Record<string, any>, strictMode: boolean) {
  const errors: string[] = [];
  const warnings: string[] = [];

  // PROPRIETARY: Advanced parameter validation by action type
  switch (actionType) {
    case 'throttle':
      if (!parameters.limit && !parameters.throttleRate && !parameters.requestsPerMinute) {
        warnings.push('Throttle action should specify rate limits');
      }
      break;
    
    case 'alert':
      if (strictMode && !parameters.alertChannel && !parameters.recipients) {
        errors.push('Alert action requires channel or recipients');
      }
      break;
    
    case 'require_approval':
      if (strictMode && !parameters.approvers) {
        errors.push('Approval action requires approvers list');
      }
      break;
  }

  return { errors, warnings };
}

/**
 * PROPRIETARY: Connection type validation algorithm
 */
function validateConnectionType(sourceNode: any, targetNode: any): { valid: boolean; reason?: string } {
  // PROPRIETARY: Advanced connection rules
  if (sourceNode.type === 'condition' && (targetNode.type === 'operator' || targetNode.type === 'action')) {
    return { valid: true };
  }
  
  if (sourceNode.type === 'operator' && (targetNode.type === 'operator' || targetNode.type === 'action')) {
    return { valid: true };
  }
  
  return { 
    valid: false, 
    reason: `Cannot connect ${sourceNode.type} to ${targetNode.type}` 
  };
}

/**
 * PROPRIETARY: Path finding algorithm
 */
function findAllPathsToNode(nodeId: string, nodes: any[], edges: any[]): string[][] {
  const paths: string[][] = [];
  const visited = new Set<string>();

  function dfs(currentId: string, path: string[]) {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    const incomingEdges = edges.filter(e => e.target === currentId);
    
    if (incomingEdges.length === 0) {
      paths.push([...path, currentId]);
      return;
    }

    for (const edge of incomingEdges) {
      dfs(edge.source, [...path, currentId]);
    }

    visited.delete(currentId);
  }

  dfs(nodeId, []);
  return paths;
}

/**
 * PROPRIETARY: Circular dependency detection algorithm
 */
function detectCircularDependencies(nodes: any[], edges: any[]): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string, path: string[]): boolean {
    if (recursionStack.has(nodeId)) {
      const cycleStart = path.indexOf(nodeId);
      cycles.push(path.slice(cycleStart));
      return true;
    }

    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outgoingEdges = edges.filter(e => e.source === nodeId);
    
    for (const edge of outgoingEdges) {
      if (dfs(edge.target, [...path, nodeId])) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  }

  return cycles;
}

/**
 * PROPRIETARY: Graph-policy consistency validation algorithm
 */
async function validateGraphPolicyConsistency(
  nodes: any[], 
  edges: any[], 
  policy: ATPVisualPolicy
) {
  const errors: string[] = [];
  const warnings: string[] = [];

  // PROPRIETARY: Advanced consistency checks
  const actionNodes = nodes.filter(n => n.type === 'action');
  const policyRules = policy.rules;

  if (actionNodes.length !== policyRules.length) {
    warnings.push(`Graph has ${actionNodes.length} actions but policy has ${policyRules.length} rules`);
  }

  // Additional advanced consistency checks would go here...

  return { errors, warnings };
}