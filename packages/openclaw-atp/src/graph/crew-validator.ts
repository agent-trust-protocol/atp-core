/**
 * Crew Validator - Simplified validation for OpenClaw crews
 */

import type { ATPClient } from 'atp-sdk';
import type { GraphValidationResult } from './types.js';
import { ATPGraphValidator } from './validator.js';
import { ATPPolicyProfile } from '../policy/profile.js';

export interface CrewValidationOptions {
  /** Policy profile to use */
  policyProfile?: 'strict-dev' | 'production-finance' | 'pii-workflow' | 'research-workflow';

  /** Custom policies */
  customPolicies?: any[];

  /** Custom constraints */
  customConstraints?: any;
}

/**
 * Validate a OpenClaw crew with ATP policies
 */
export async function validateCrewWithAtp(
  crew: any,
  atpClient: ATPClient,
  options: CrewValidationOptions = {}
): Promise<GraphValidationResult> {
  // Get policy profile
  let profile;

  switch (options.policyProfile) {
    case 'strict-dev':
      profile = ATPPolicyProfile.strictDev();
      break;
    case 'production-finance':
      profile = ATPPolicyProfile.productionFinance();
      break;
    case 'pii-workflow':
      profile = ATPPolicyProfile.piiWorkflow();
      break;
    case 'research-workflow':
      profile = ATPPolicyProfile.researchWorkflow();
      break;
    default:
      profile = ATPPolicyProfile.strictDev();
  }

  // Merge custom policies/constraints
  const policies = options.customPolicies || profile.interAgentRules;
  const constraints = options.customConstraints || profile.workflowConstraints;

  // Create validator
  const validator = new ATPGraphValidator(atpClient, policies, constraints);

  // Extract nodes and edges from crew
  const { nodes, edges } = extractCrewGraph(crew);

  // Validate
  return await validator.validateGraph(nodes, edges);
}

/**
 * Extract graph structure from OpenClaw crew
 */
function extractCrewGraph(crew: any): { nodes: any[]; edges: any[] } {
  const nodes: any[] = [];
  const edges: any[] = [];

  // Extract agents as nodes
  if (crew.agents) {
    for (const agent of crew.agents) {
      nodes.push({
        name: agent.name || agent.id,
        role: agent.role || agent.metadata?.role || 'agent',
        did: agent.metadata?.atp?.did,
        trustScore: agent.metadata?.atp?.trustScore,
        tools: agent.tools?.map((t: any) => t.name || t) || [],
        capabilities: agent.metadata?.atp?.capabilities || []
      });
    }
  }

  // Extract tasks to infer edges
  if (crew.tasks) {
    for (const task of crew.tasks) {
      const fromAgent = task.agent?.name || task.agent;

      // If task has dependencies, create edges
      if (task.dependencies) {
        for (const dep of task.dependencies) {
          const toAgent = dep.agent?.name || dep.agent;

          edges.push({
            from: fromAgent,
            to: toAgent,
            dataType: task.metadata?.atp?.dataClassification || 'internal'
          });
        }
      }
    }
  }

  // If no explicit edges from tasks, infer from tool usage patterns
  // (This would require deeper inspection of the crew structure)

  return { nodes, edges };
}
