/**
 * ATP Policy Profilesfor Motleycrew
 * 
 * Pre-configured security profiles for common use cases
 */

import type { PolicyProfileConfig } from './types.js';

export class ATPPolicyProfile {
  /**
   * Strict Development Profile - Safe defaults for development
   */
  static strictDev(): PolicyProfileConfig {
    return {
      name: 'strict-dev',
      description: 'Strict security profile for development environments',
      interAgentRules: [
        {
          from: '*',
          to: '*',
          allowed: true,
          allowedDataTypes: ['public', 'internal'],
          minTrustLevel: 0.6
        }
      ],
      workflowConstraints: {
        maxChainDepth: 5,
        maxFanOut: 3,
        allowCycles: false,
        minWorkflowTrust: 0.6,
        maxWorkflowTime: 300000 // 5 minutes
      },
      toolRules: {
        'default': {
          minTrustScore: 0.6,
          rateLimit: 30
        }
      }
    };
  }

  /**
   * Production Finance Profile - High security for financial operations
   */
  static productionFinance(): PolicyProfileConfig {
    return {
      name: 'production-finance',
      description: 'High-security profile for financial production systems',
      interAgentRules: [
        {
          from: 'researcher',
          to: 'trader',
          allowed: true,
          allowedDataTypes: ['market-data'],
          minTrustLevel: 0.9
        },
        {
          from: 'trader',
          to: 'reviewer',
          allowed: true,
          allowedDataTypes: ['trade-request'],
          minTrustLevel: 0.95
        },
        {
          from: 'writer',
          to: 'trader',
          allowed: false // Writers cannot interact with traders
        }
      ],
      workflowConstraints: {
        maxChainDepth: 3,
        maxFanOut: 2,
        allowCycles: false,
        minWorkflowTrust: 0.9,
        maxWorkflowTime: 60000, // 1 minute
        forbiddenPairs: [
          ['external-api', 'payment-processor']
        ]
      },
      toolRules: {
        'trade-execution': {
          minTrustScore: 0.95,
          allowedRoles: ['trader', 'admin'],
          rateLimit: 10
        },
        'market-data': {
          minTrustScore: 0.8,
          rateLimit: 60
        }
      }
    };
  }

  /**
   * PII Workflow Profile - Strict controls for PII handling
   */
  static piiWorkflow(): PolicyProfileConfig {
    return {
      name: 'pii-workflow',
      description: 'Strict profile for workflows handling PII data',
      interAgentRules: [
        {
          from: 'data-collector',
          to: 'data-processor',
          allowed: true,
          allowedDataTypes: ['pii', 'encrypted-pii'],
          minTrustLevel: 0.85
        },
        {
          from: 'data-processor',
          to: 'external-service',
          allowed: false // No PII to external services
        },
        {
          from: '*',
          to: 'pii-handler',
          allowed: true,
          minTrustLevel: 0.9
        }
      ],
      workflowConstraints: {
        maxChainDepth: 4,
        maxFanOut: 2,
        allowCycles: false,
        minWorkflowTrust: 0.85,
        forbiddenPairs: [
          ['pii-handler', 'logger'], // Don't log PII
          ['pii-handler', 'external-api']
        ]
      },
      toolRules: {
        'pii-access': {
          minTrustScore: 0.9,
          allowedRoles: ['pii-handler', 'compliance-officer'],
          rateLimit: 20
        },
        'data-export': {
          minTrustScore: 0.95,
          allowedRoles: ['compliance-officer'],
          rateLimit: 5
        }
      }
    };
  }

  /**
   * Research Workflow Profile - Balanced profile for research tasks
   */
  static researchWorkflow(): PolicyProfileConfig {
    return {
      name: 'research-workflow',
      description: 'Balanced profile for research and analysis workflows',
      interAgentRules: [
        {
          from: 'researcher',
          to: 'analyzer',
          allowed: true,
          allowedDataTypes: ['research-data', 'public'],
          minTrustLevel: 0.7
        },
        {
          from: 'analyzer',
          to: 'writer',
          allowed: true,
          allowedDataTypes: ['analysis-results'],
          minTrustLevel: 0.7
        },
        {
          from: '*',
          to: 'external-search',
          allowed: true,
          minTrustLevel: 0.6
        }
      ],
      workflowConstraints: {
        maxChainDepth: 8,
        maxFanOut: 5,
        allowCycles: true, // Allow iterative research
        minWorkflowTrust: 0.6,
        maxWorkflowTime: 600000 // 10 minutes
      },
      toolRules: {
        'web-search': {
          minTrustScore: 0.5,
          rateLimit: 100
        },
        'document-analysis': {
          minTrustScore: 0.7,
          rateLimit: 50
        }
      }
    };
  }

  /**
   * Custom profile builder
   */
  static custom(config: Partial<PolicyProfileConfig>): PolicyProfileConfig {
    return {
      name: config.name || 'custom',
      description: config.description || 'Custom policy profile',
      interAgentRules: config.interAgentRules || [],
      workflowConstraints: {
        maxChainDepth: 10,
        maxFanOut: 5,
        allowCycles: false,
        minWorkflowTrust: 0.5,
        ...config.workflowConstraints
      },
      toolRules: config.toolRules || {},
      dataClassificationRules: config.dataClassificationRules || []
    };
  }
}
