import { 
  NodeExecutor, 
  NodeDefinition, 
  NodeInput, 
  NodeOutput,
  WorkflowExecutionContext 
} from '../../types/WorkflowTypes';

export const policyChangeExecutor: NodeExecutor = {
  type: 'policy-change-trigger',
  async execute(inputs: any, config: any, context: WorkflowExecutionContext) {
    console.log('[Policy Change Trigger] Monitoring policy changes...');
    
    const policyId = inputs.policyId || config.policyId;
    const changeTypes = inputs.changeTypes || config.changeTypes || ['create', 'update', 'delete'];
    
    const simulatedChange = {
      policyId: policyId || 'policy-123',
      changeType: 'update',
      timestamp: new Date(),
      previousVersion: '1.0.0',
      currentVersion: '1.1.0',
      changedBy: context.user?.id || 'system',
      changes: {
        rules: ['Added new trust level condition'],
        actions: ['Updated alert threshold']
      }
    };
    
    return {
      triggered: true,
      policyChange: simulatedChange,
      metadata: {
        executionId: context.executionId,
        timestamp: new Date()
      }
    };
  },
  
  validate(config: any) {
    return true;
  },
  
  getSchema() {
    return {
      inputs: [
        {
          name: 'policyId',
          type: 'string',
          required: false,
          description: 'Specific policy to monitor (optional)'
        },
        {
          name: 'changeTypes',
          type: 'array',
          required: false,
          description: 'Types of changes to monitor',
          default: ['create', 'update', 'delete']
        }
      ],
      outputs: [
        {
          name: 'policyChange',
          type: 'object',
          description: 'Details about the policy change'
        }
      ]
    };
  }
};

export const policyViolationExecutor: NodeExecutor = {
  type: 'policy-violation-trigger',
  async execute(inputs: any, config: any, context: WorkflowExecutionContext) {
    console.log('[Policy Violation Trigger] Monitoring violations...');
    
    const severityThreshold = inputs.severityThreshold || config.severityThreshold || 'medium';
    const policyTypes = inputs.policyTypes || config.policyTypes || ['trust', 'access', 'compliance'];
    
    const simulatedViolation = {
      violationId: `violation-${Date.now()}`,
      policyId: 'policy-456',
      policyName: 'Enterprise Trust Policy',
      violationType: 'trust_threshold',
      severity: 'high',
      agent: {
        did: 'did:atp:agent-789',
        name: 'Test Agent',
        currentTrustLevel: 0.3
      },
      details: {
        expectedTrustLevel: 0.7,
        actualTrustLevel: 0.3,
        action: 'access_denied',
        resource: 'production-database'
      },
      timestamp: new Date()
    };
    
    return {
      triggered: true,
      violation: simulatedViolation,
      requiresAction: simulatedViolation.severity === 'high' || simulatedViolation.severity === 'critical'
    };
  },
  
  validate(config: any) {
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (config.severityThreshold && !validSeverities.includes(config.severityThreshold)) {
      return false;
    }
    return true;
  },
  
  getSchema() {
    return {
      inputs: [
        {
          name: 'severityThreshold',
          type: 'string',
          required: false,
          description: 'Minimum severity to trigger',
          validation: {
            enum: ['low', 'medium', 'high', 'critical']
          }
        },
        {
          name: 'policyTypes',
          type: 'array',
          required: false,
          description: 'Types of policies to monitor'
        }
      ],
      outputs: [
        {
          name: 'violation',
          type: 'object',
          description: 'Policy violation details'
        },
        {
          name: 'requiresAction',
          type: 'boolean',
          description: 'Whether immediate action is required'
        }
      ]
    };
  }
};

export const createPolicyExecutor: NodeExecutor = {
  type: 'create-policy',
  async execute(inputs: any, config: any, context: WorkflowExecutionContext) {
    console.log('[Create Policy] Creating new policy...');
    
    const policyName = inputs.name || config.name;
    const policyType = inputs.type || config.type || 'trust';
    const rules = inputs.rules || config.rules || [];
    const actions = inputs.actions || config.actions || [];
    
    if (!policyName) {
      throw new Error('Policy name is required');
    }
    
    const newPolicy = {
      id: `policy-${Date.now()}`,
      name: policyName,
      type: policyType,
      version: '1.0.0',
      status: 'draft',
      rules: rules,
      actions: actions,
      createdBy: context.user?.id || 'system',
      createdAt: new Date(),
      metadata: {
        workflowId: context.workflowId,
        executionId: context.executionId
      }
    };
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      policy: newPolicy,
      message: `Policy "${policyName}" created successfully`
    };
  },
  
  validate(config: any) {
    return config.name && typeof config.name === 'string';
  },
  
  getSchema() {
    return {
      inputs: [
        {
          name: 'name',
          type: 'string',
          required: true,
          description: 'Policy name'
        },
        {
          name: 'type',
          type: 'string',
          required: false,
          description: 'Policy type',
          default: 'trust'
        },
        {
          name: 'rules',
          type: 'array',
          required: false,
          description: 'Policy rules'
        },
        {
          name: 'actions',
          type: 'array',
          required: false,
          description: 'Policy actions'
        }
      ],
      outputs: [
        {
          name: 'policy',
          type: 'object',
          description: 'Created policy object'
        },
        {
          name: 'success',
          type: 'boolean',
          description: 'Operation success status'
        }
      ]
    };
  }
};

export const updatePolicyExecutor: NodeExecutor = {
  type: 'update-policy',
  async execute(inputs: any, config: any, context: WorkflowExecutionContext) {
    console.log('[Update Policy] Updating policy...');
    
    const policyId = inputs.policyId || config.policyId;
    const updates = inputs.updates || config.updates || {};
    
    if (!policyId) {
      throw new Error('Policy ID is required');
    }
    
    const existingPolicy = {
      id: policyId,
      name: 'Existing Policy',
      version: '1.0.0',
      status: 'active'
    };
    
    const updatedPolicy = {
      ...existingPolicy,
      ...updates,
      version: '1.1.0',
      updatedBy: context.user?.id || 'system',
      updatedAt: new Date(),
      previousVersion: existingPolicy.version
    };
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      policy: updatedPolicy,
      changes: Object.keys(updates),
      message: `Policy "${policyId}" updated successfully`
    };
  },
  
  validate(config: any) {
    return config.policyId && typeof config.policyId === 'string';
  },
  
  getSchema() {
    return {
      inputs: [
        {
          name: 'policyId',
          type: 'string',
          required: true,
          description: 'Policy ID to update'
        },
        {
          name: 'updates',
          type: 'object',
          required: true,
          description: 'Updates to apply'
        }
      ],
      outputs: [
        {
          name: 'policy',
          type: 'object',
          description: 'Updated policy object'
        },
        {
          name: 'changes',
          type: 'array',
          description: 'List of changed fields'
        }
      ]
    };
  }
};

export const deployPolicyExecutor: NodeExecutor = {
  type: 'deploy-policy',
  async execute(inputs: any, config: any, context: WorkflowExecutionContext) {
    console.log('[Deploy Policy] Deploying policy...');
    
    const policyId = inputs.policyId || config.policyId;
    const targetEnvironment = inputs.environment || config.environment || 'production';
    const targetAgents = inputs.agents || config.agents || ['all'];
    
    if (!policyId) {
      throw new Error('Policy ID is required for deployment');
    }
    
    console.log(`Deploying policy ${policyId} to ${targetEnvironment}...`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const deployment = {
      deploymentId: `deploy-${Date.now()}`,
      policyId: policyId,
      environment: targetEnvironment,
      status: 'deployed',
      deployedTo: targetAgents.length === 1 && targetAgents[0] === 'all' 
        ? { type: 'broadcast', count: 42 }
        : { type: 'targeted', agents: targetAgents },
      deployedBy: context.user?.id || 'system',
      deployedAt: new Date(),
      rollbackVersion: '1.0.0'
    };
    
    return {
      success: true,
      deployment: deployment,
      message: `Policy deployed to ${targetEnvironment} successfully`
    };
  },
  
  validate(config: any) {
    const validEnvironments = ['development', 'staging', 'production'];
    if (config.environment && !validEnvironments.includes(config.environment)) {
      return false;
    }
    return config.policyId && typeof config.policyId === 'string';
  },
  
  getSchema() {
    return {
      inputs: [
        {
          name: 'policyId',
          type: 'string',
          required: true,
          description: 'Policy ID to deploy'
        },
        {
          name: 'environment',
          type: 'string',
          required: false,
          description: 'Target environment',
          validation: {
            enum: ['development', 'staging', 'production']
          }
        },
        {
          name: 'agents',
          type: 'array',
          required: false,
          description: 'Target agents (default: all)'
        }
      ],
      outputs: [
        {
          name: 'deployment',
          type: 'object',
          description: 'Deployment details'
        }
      ]
    };
  }
};

export const policyValidConditionExecutor: NodeExecutor = {
  type: 'policy-valid',
  async execute(inputs: any, config: any, context: WorkflowExecutionContext) {
    console.log('[Policy Valid Condition] Validating policy...');
    
    const policyId = inputs.policyId || config.policyId;
    const validationRules = inputs.validationRules || config.validationRules || ['syntax', 'logic', 'conflicts'];
    
    const validationResult = {
      isValid: Math.random() > 0.2,
      policyId: policyId,
      validationTime: new Date(),
      checks: {
        syntax: { passed: true, message: 'Syntax is valid' },
        logic: { passed: true, message: 'Logic is consistent' },
        conflicts: { passed: Math.random() > 0.3, message: 'No conflicts detected' }
      },
      errors: [],
      warnings: []
    };
    
    if (!validationResult.checks.conflicts.passed) {
      validationResult.isValid = false;
      validationResult.errors.push('Policy conflicts with existing rules');
    }
    
    return validationResult;
  },
  
  validate(config: any) {
    return true;
  },
  
  getSchema() {
    return {
      inputs: [
        {
          name: 'policyId',
          type: 'string',
          required: true,
          description: 'Policy to validate'
        },
        {
          name: 'validationRules',
          type: 'array',
          required: false,
          description: 'Validation rules to apply'
        }
      ],
      outputs: [
        {
          name: 'isValid',
          type: 'boolean',
          description: 'Whether policy is valid'
        },
        {
          name: 'checks',
          type: 'object',
          description: 'Validation check results'
        },
        {
          name: 'errors',
          type: 'array',
          description: 'Validation errors'
        }
      ]
    };
  }
};

export const policyCompliantConditionExecutor: NodeExecutor = {
  type: 'policy-compliant',
  async execute(inputs: any, config: any, context: WorkflowExecutionContext) {
    console.log('[Policy Compliant Condition] Checking compliance...');
    
    const agentDid = inputs.agentDid || config.agentDid;
    const policyId = inputs.policyId || config.policyId;
    const complianceLevel = inputs.complianceLevel || config.complianceLevel || 0.8;
    
    const complianceCheck = {
      isCompliant: Math.random() > 0.3,
      complianceScore: Math.random(),
      agentDid: agentDid,
      policyId: policyId,
      checkedAt: new Date(),
      violations: [],
      recommendations: []
    };
    
    if (complianceCheck.complianceScore < complianceLevel) {
      complianceCheck.isCompliant = false;
      complianceCheck.violations.push({
        rule: 'trust_threshold',
        expected: complianceLevel,
        actual: complianceCheck.complianceScore
      });
      complianceCheck.recommendations.push('Increase agent trust level');
    }
    
    return complianceCheck;
  },
  
  validate(config: any) {
    if (config.complianceLevel && (config.complianceLevel < 0 || config.complianceLevel > 1)) {
      return false;
    }
    return true;
  },
  
  getSchema() {
    return {
      inputs: [
        {
          name: 'agentDid',
          type: 'string',
          required: true,
          description: 'Agent DID to check'
        },
        {
          name: 'policyId',
          type: 'string',
          required: true,
          description: 'Policy to check against'
        },
        {
          name: 'complianceLevel',
          type: 'number',
          required: false,
          description: 'Required compliance level (0-1)',
          validation: {
            min: 0,
            max: 1
          }
        }
      ],
      outputs: [
        {
          name: 'isCompliant',
          type: 'boolean',
          description: 'Whether agent is compliant'
        },
        {
          name: 'complianceScore',
          type: 'number',
          description: 'Compliance score (0-1)'
        },
        {
          name: 'violations',
          type: 'array',
          description: 'List of violations'
        }
      ]
    };
  }
};

export const policyNodeDefinitions: NodeDefinition[] = [
  {
    type: 'policy-change-trigger',
    category: 'trigger',
    label: 'Policy Change Trigger',
    description: 'Triggers when a policy is created, updated, or deleted',
    icon: '🛡️',
    color: '#8b5cf6',
    inputs: policyChangeExecutor.getSchema!().inputs,
    outputs: policyChangeExecutor.getSchema!().outputs,
    executor: policyChangeExecutor
  },
  {
    type: 'policy-violation-trigger',
    category: 'trigger',
    label: 'Policy Violation Trigger',
    description: 'Triggers when a policy violation is detected',
    icon: '⚠️',
    color: '#ef4444',
    inputs: policyViolationExecutor.getSchema!().inputs,
    outputs: policyViolationExecutor.getSchema!().outputs,
    executor: policyViolationExecutor
  },
  {
    type: 'create-policy',
    category: 'action',
    label: 'Create Policy',
    description: 'Creates a new ATP policy',
    icon: '📄',
    color: '#3b82f6',
    inputs: createPolicyExecutor.getSchema!().inputs,
    outputs: createPolicyExecutor.getSchema!().outputs,
    executor: createPolicyExecutor
  },
  {
    type: 'update-policy',
    category: 'action',
    label: 'Update Policy',
    description: 'Updates an existing ATP policy',
    icon: '🔄',
    color: '#3b82f6',
    inputs: updatePolicyExecutor.getSchema!().inputs,
    outputs: updatePolicyExecutor.getSchema!().outputs,
    executor: updatePolicyExecutor
  },
  {
    type: 'deploy-policy',
    category: 'action',
    label: 'Deploy Policy',
    description: 'Deploys a policy to target agents',
    icon: '🚀',
    color: '#10b981',
    inputs: deployPolicyExecutor.getSchema!().inputs,
    outputs: deployPolicyExecutor.getSchema!().outputs,
    executor: deployPolicyExecutor
  },
  {
    type: 'policy-valid',
    category: 'condition',
    label: 'Policy Valid',
    description: 'Checks if a policy is valid',
    icon: '✅',
    color: '#eab308',
    inputs: policyValidConditionExecutor.getSchema!().inputs,
    outputs: policyValidConditionExecutor.getSchema!().outputs,
    executor: policyValidConditionExecutor
  },
  {
    type: 'policy-compliant',
    category: 'condition',
    label: 'Policy Compliant',
    description: 'Checks if an agent is compliant with a policy',
    icon: '📋',
    color: '#eab308',
    inputs: policyCompliantConditionExecutor.getSchema!().inputs,
    outputs: policyCompliantConditionExecutor.getSchema!().outputs,
    executor: policyCompliantConditionExecutor
  }
];