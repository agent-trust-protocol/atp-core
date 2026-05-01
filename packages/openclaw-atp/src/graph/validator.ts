/**
 * ATP Graph Validator
 *
 * Validates OpenClaw agent graphs against ATP policies
 */

import type { ATPClient } from 'atp-sdk';
import type {
  GraphValidationResult,
  InterAgentPolicy,
  WorkflowConstraints,
  GraphNode,
  GraphEdge
} from './types.js';

export class ATPGraphValidator {
  private atpClient: ATPClient;
  private interAgentPolicies: Map<string, InterAgentPolicy> = new Map();
  private workflowConstraints: WorkflowConstraints;

  constructor(
    atpClient: ATPClient,
    policies?: InterAgentPolicy[],
    constraints?: WorkflowConstraints
  ) {
    this.atpClient = atpClient;
    this.workflowConstraints = constraints || {
      maxChainDepth: 10,
      maxFanOut: 5,
      allowCycles: false,
      minWorkflowTrust: 0.5
    };

    if (policies) {
      policies.forEach(policy => {
        const key = `${policy.from}→${policy.to}`;
        this.interAgentPolicies.set(key, policy);
      });
    }
  }

  /**
   * Validate a OpenClaw agent graph
   */
  async validateGraph(
    nodes: GraphNode[],
    edges: GraphEdge[]
  ): Promise<GraphValidationResult> {
    const result: GraphValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      validatedAgents: [],
      validatedEdges: [],
      appliedPolicies: []
    };

    // 1. Validate nodes (agents)
    for (const node of nodes) {
      const nodeValidation = await this.validateNode(node);

      if (!nodeValidation.valid) {
        result.isValid = false;
        result.errors.push({
          type: 'agent',
          message: nodeValidation.error || 'Node validation failed',
          source: node.name,
          severity: 'error'
        });
      }

      if (nodeValidation.warnings) {
        result.warnings.push(...nodeValidation.warnings);
      }

      if (nodeValidation.valid) {
        result.validatedAgents.push(node.name);
      }
    }

    // 2. Validate edges (agent connections)
    for (const edge of edges) {
      const edgeValidation = await this.validateEdge(edge, nodes);

      result.validatedEdges.push({
        from: edge.from,
        to: edge.to,
        allowed: edgeValidation.allowed
      });

      if (!edgeValidation.allowed) {
        result.isValid = false;
        result.errors.push({
          type: 'edge',
          message: edgeValidation.reason || 'Edge not allowed',
          source: edge.from,
          target: edge.to,
          severity: 'error'
        });
      }

      if (edgeValidation.policy) {
        if (!result.appliedPolicies.includes(edgeValidation.policy)) {
          result.appliedPolicies.push(edgeValidation.policy);
        }
      }
    }

    // 3. Validate workflow constraints
    const workflowValidation = this.validateWorkflowConstraints(nodes, edges);

    if (!workflowValidation.valid) {
      result.isValid = false;
      result.errors.push(...workflowValidation.errors);
    }

    result.warnings.push(...workflowValidation.warnings);

    // 4. Check for cycles if not allowed
    if (!this.workflowConstraints.allowCycles) {
      const cycleCheck = this.detectCycles(edges);

      if (cycleCheck.hasCycles) {
        result.isValid = false;
        result.errors.push({
          type: 'workflow',
          message: `Cycles detected: ${cycleCheck.cycles.join(', ')}`,
          severity: 'error'
        });
      }
    }

    // 5. Check chain depth
    if (this.workflowConstraints.maxChainDepth) {
      const depthCheck = this.calculateMaxDepth(edges);

      if (depthCheck.maxDepth > this.workflowConstraints.maxChainDepth) {
        result.isValid = false;
        result.errors.push({
          type: 'workflow',
          message: `Chain depth ${depthCheck.maxDepth} exceeds limit ${this.workflowConstraints.maxChainDepth}`,
          severity: 'error'
        });
      }
    }

    // 6. Check fan-out
    if (this.workflowConstraints.maxFanOut) {
      const fanOutCheck = this.calculateFanOut(edges);

      for (const [agent, fanOut] of Object.entries(fanOutCheck)) {
        if (fanOut > this.workflowConstraints.maxFanOut) {
          result.warnings.push(
            `Agent ${agent} has fan-out of ${fanOut}, exceeds recommended limit ${this.workflowConstraints.maxFanOut}`
          );
        }
      }
    }

    // 7. Log validation
    await this.logValidation(result);

    return result;
  }

  /**
   * Validate a single node (agent)
   */
  private async validateNode(node: GraphNode): Promise<{ valid: boolean; error?: string; warnings?: string[] }> {
    const warnings: string[] = [];

    // Check if agent is registered
    if (node.did) {
      try {
        await this.atpClient.identity.getDID(node.did);
      } catch {
        return { valid: false, error: `Agent DID ${node.did} not found in ATP` };
      }
    } else {
      warnings.push(`Agent ${node.name} has no DID - not registered with ATP`);
    }

    // Check trust level
    if (this.workflowConstraints.minWorkflowTrust && node.trustScore) {
      if (node.trustScore < this.workflowConstraints.minWorkflowTrust) {
        return {
          valid: false,
          error: `Agent ${node.name} trust score ${node.trustScore} below minimum ${this.workflowConstraints.minWorkflowTrust}`
        };
      }
    }

    return { valid: true, warnings };
  }

  /**
   * Validate an edge (agent-to-agent connection)
   */
  private async validateEdge(
    edge: GraphEdge,
    nodes: GraphNode[]
  ): Promise<{ allowed: boolean; reason?: string; policy?: string }> {
    // Find source and target nodes
    const fromNode = nodes.find(n => n.name === edge.from);
    const toNode = nodes.find(n => n.name === edge.to);

    if (!fromNode || !toNode) {
      return { allowed: false, reason: 'Source or target node not found' };
    }

    // Check inter-agent policy
    const policyKey = `${edge.from}→${edge.to}`;
    const roleKey = `${fromNode.role}→${toNode.role}`;

    const policy = this.interAgentPolicies.get(policyKey) || this.interAgentPolicies.get(roleKey);

    if (policy) {
      if (!policy.allowed) {
        return {
          allowed: false,
          reason: `Policy prohibits ${edge.from} → ${edge.to} connection`,
          policy: policyKey
        };
      }

      // Check data type restrictions
      if (policy.allowedDataTypes && edge.dataType) {
        if (!policy.allowedDataTypes.includes(edge.dataType)) {
          return {
            allowed: false,
            reason: `Data type ${edge.dataType} not allowed on this edge`,
            policy: policyKey
          };
        }
      }

      // Check trust level
      if (policy.minTrustLevel && fromNode.trustScore) {
        if (fromNode.trustScore < policy.minTrustLevel) {
          return {
            allowed: false,
            reason: `Source agent trust ${fromNode.trustScore} below required ${policy.minTrustLevel}`,
            policy: policyKey
          };
        }
      }

      // Run custom conditions
      if (policy.conditions) {
        for (const condition of policy.conditions) {
          if (!condition(fromNode, toNode)) {
            return {
              allowed: false,
              reason: 'Custom policy condition failed',
              policy: policyKey
            };
          }
        }
      }
    }

    // Check forbidden pairs
    if (this.workflowConstraints.forbiddenPairs) {
      for (const [a, b] of this.workflowConstraints.forbiddenPairs) {
        if ((edge.from === a && edge.to === b) || (edge.from === b && edge.to === a)) {
          return {
            allowed: false,
            reason: `Connection between ${a} and ${b} is forbidden`
          };
        }
      }
    }

    return { allowed: true, policy: policy ? policyKey : undefined };
  }

  /**
   * Validate workflow constraints
   */
  private validateWorkflowConstraints(
    nodes: GraphNode[],
    edges: GraphEdge[]
  ): { valid: boolean; errors: any[]; warnings: string[] } {
    const errors: any[] = [];
    const warnings: string[] = [];

    // Check minimum workflow trust
    if (this.workflowConstraints.minWorkflowTrust) {
      const lowTrustAgents = nodes.filter(n =>
        n.trustScore && n.trustScore < (this.workflowConstraints.minWorkflowTrust || 0)
      );

      if (lowTrustAgents.length > 0) {
        errors.push({
          type: 'workflow',
          message: `Agents with insufficient trust: ${lowTrustAgents.map(a => a.name).join(', ')}`,
          severity: 'error'
        });
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Detect cycles in the graph
   */
  private detectCycles(edges: GraphEdge[]): { hasCycles: boolean; cycles: string[] } {
    const adjacency = new Map<string, string[]>();
    const cycles: string[] = [];

    // Build adjacency list
    for (const edge of edges) {
      if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
      adjacency.get(edge.from)!.push(edge.to);
    }

    // DFS to detect cycles
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (node: string, path: string[]): boolean => {
      visited.add(node);
      recStack.add(node);
      path.push(node);

      const neighbors = adjacency.get(node) || [];

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor, [...path])) return true;
        } else if (recStack.has(neighbor)) {
          const cycleStart = path.indexOf(neighbor);
          const cycle = [...path.slice(cycleStart), neighbor].join(' → ');
          cycles.push(cycle);
          return true;
        }
      }

      recStack.delete(node);
      return false;
    };

    for (const node of adjacency.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return { hasCycles: cycles.length > 0, cycles };
  }

  /**
   * Calculate maximum chain depth
   */
  private calculateMaxDepth(edges: GraphEdge[]): { maxDepth: number; longestPath: string[] } {
    const adjacency = new Map<string, string[]>();

    for (const edge of edges) {
      if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
      adjacency.get(edge.from)!.push(edge.to);
    }

    let maxDepth = 0;
    let longestPath: string[] = [];

    const dfs = (node: string, depth: number, path: string[]): void => {
      if (depth > maxDepth) {
        maxDepth = depth;
        longestPath = [...path];
      }

      const neighbors = adjacency.get(node) || [];

      for (const neighbor of neighbors) {
        dfs(neighbor, depth + 1, [...path, neighbor]);
      }
    };

    // Find root nodes (no incoming edges)
    const hasIncoming = new Set(edges.map(e => e.to));
    const roots = Array.from(adjacency.keys()).filter(n => !hasIncoming.has(n));

    for (const root of roots) {
      dfs(root, 0, [root]);
    }

    return { maxDepth, longestPath };
  }

  /**
   * Calculate fan-out for each agent
   */
  private calculateFanOut(edges: GraphEdge[]): Record<string, number> {
    const fanOut: Record<string, number> = {};

    for (const edge of edges) {
      fanOut[edge.from] = (fanOut[edge.from] || 0) + 1;
    }

    return fanOut;
  }

  /**
   * Log validation result
   */
  private async logValidation(result: GraphValidationResult): Promise<void> {
    await this.atpClient.audit.log({
      eventType: 'graph-validation',
      severity: result.isValid ? 'info' : 'error',
      metadata: {
        isValid: result.isValid,
        errorCount: result.errors.length,
        warningCount: result.warnings.length,
        validatedAgents: result.validatedAgents.length,
        appliedPolicies: result.appliedPolicies
      }
    });
  }
}

/**
 * Simplified crew validation function
 */
export async function validateCrewWithAtp(
  crew: any,
  atpClient: ATPClient,
  policies?: InterAgentPolicy[],
  constraints?: WorkflowConstraints
): Promise<GraphValidationResult> {
  const validator = new ATPGraphValidator(atpClient, policies, constraints);

  // Extract nodes and edges from crew (this is simplified)
  const nodes: GraphNode[] = crew.agents?.map((agent: any) => ({
    name: agent.name,
    role: agent.role || agent.metadata?.role,
    did: agent.metadata?.atp?.did,
    trustScore: agent.metadata?.atp?.trustScore,
    tools: agent.tools?.map((t: any) => t.name || t),
    capabilities: agent.metadata?.atp?.capabilities
  })) || [];

  // Extract edges (agent-to-agent connections)
  const edges: GraphEdge[] = [];

  // In OpenClaw, edges are implicit through tool usage
  // This would need to be extracted from the actual crew structure

  return await validator.validateGraph(nodes, edges);
}
