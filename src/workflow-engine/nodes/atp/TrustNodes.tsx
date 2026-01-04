import { 
  NodeExecutor, 
  NodeDefinition, 
  NodeInput, 
  NodeOutput,
  WorkflowExecutionContext 
} from '../../types/WorkflowTypes';

export const trustChangeExecutor: NodeExecutor = {
  type: 'trust-change-trigger',
  async execute(inputs: any, config: any, context: WorkflowExecutionContext) {
    console.log('[Trust Change Trigger] Monitoring trust level changes...');
    
    const agentDid = inputs.agentDid || config.agentDid;
    const threshold = inputs.threshold || config.threshold || 0.1;
    const direction = inputs.direction || config.direction || 'any';
    
    const trustChange = {
      agentDid: agentDid || 'did:atp:agent-123',
      previousLevel: 0.75,
      currentLevel: 0.45,
      change: -0.30,
      changeType: 'decrease',
      timestamp: new Date(),
      reason: 'Multiple failed authentication attempts',
      factors: {
        authentication: -0.15,
        behavior: -0.10,
        compliance: -0.05
      }
    };
    
    const meetsThreshold = Math.abs(trustChange.change) >= threshold;
    const meetsDirection = direction === 'any' || 
      (direction === 'increase' && trustChange.change > 0) ||
      (direction === 'decrease' && trustChange.change < 0);
    
    return {
      triggered: meetsThreshold && meetsDirection,
      trustChange: trustChange,
      alert: trustChange.currentLevel < 0.5,
      metadata: {
        executionId: context.executionId,
        timestamp: new Date()
      }
    };
  },
  
  validate(config: any) {
    if (config.threshold && (config.threshold < 0 || config.threshold > 1)) {
      return false;
    }
    if (config.direction && !['any', 'increase', 'decrease'].includes(config.direction)) {
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
          required: false,
          description: 'Specific agent to monitor (optional)'
        },
        {
          name: 'threshold',
          type: 'number',
          required: false,
          description: 'Minimum change to trigger (0-1)',
          default: 0.1,
          validation: {
            min: 0,
            max: 1
          }
        },
        {
          name: 'direction',
          type: 'string',
          required: false,
          description: 'Direction of change to monitor',
          default: 'any',
          validation: {
            enum: ['any', 'increase', 'decrease']
          }
        }
      ],
      outputs: [
        {
          name: 'trustChange',
          type: 'object',
          description: 'Details about the trust level change'
        },
        {
          name: 'alert',
          type: 'boolean',
          description: 'Whether an alert should be raised'
        }
      ]
    };
  }
};

export const riskDetectedExecutor: NodeExecutor = {
  type: 'risk-detected-trigger',
  async execute(inputs: any, config: any, context: WorkflowExecutionContext) {
    console.log('[Risk Detected Trigger] Monitoring risk signals...');
    
    const riskLevel = inputs.riskLevel || config.riskLevel || 'medium';
    const riskTypes = inputs.riskTypes || config.riskTypes || ['security', 'compliance', 'operational'];
    
    const riskEvent = {
      riskId: `risk-${Date.now()}`,
      level: 'high',
      score: 0.82,
      type: 'security',
      source: 'anomaly-detection',
      description: 'Unusual access pattern detected',
      affectedAgents: [
        { did: 'did:atp:agent-456', name: 'Agent Alpha' },
        { did: 'did:atp:agent-789', name: 'Agent Beta' }
      ],
      indicators: [
        { type: 'access_frequency', value: 250, threshold: 100 },
        { type: 'geographic_anomaly', value: 'unexpected_location' },
        { type: 'time_anomaly', value: 'outside_business_hours' }
      ],
      recommendedActions: [
        'Temporarily suspend agent access',
        'Require additional authentication',
        'Review recent activities'
      ],
      timestamp: new Date()
    };
    
    const riskLevelValues = { low: 1, medium: 2, high: 3, critical: 4 };
    const detectedLevelValue = riskLevelValues[riskEvent.level as keyof typeof riskLevelValues];
    const thresholdLevelValue = riskLevelValues[riskLevel as keyof typeof riskLevelValues];
    
    return {
      triggered: detectedLevelValue >= thresholdLevelValue && riskTypes.includes(riskEvent.type),
      risk: riskEvent,
      requiresImmediateAction: riskEvent.level === 'critical' || riskEvent.level === 'high',
      metadata: {
        executionId: context.executionId,
        timestamp: new Date()
      }
    };
  },
  
  validate(config: any) {
    const validLevels = ['low', 'medium', 'high', 'critical'];
    if (config.riskLevel && !validLevels.includes(config.riskLevel)) {
      return false;
    }
    return true;
  },
  
  getSchema() {
    return {
      inputs: [
        {
          name: 'riskLevel',
          type: 'string',
          required: false,
          description: 'Minimum risk level to trigger',
          default: 'medium',
          validation: {
            enum: ['low', 'medium', 'high', 'critical']
          }
        },
        {
          name: 'riskTypes',
          type: 'array',
          required: false,
          description: 'Types of risks to monitor',
          default: ['security', 'compliance', 'operational']
        }
      ],
      outputs: [
        {
          name: 'risk',
          type: 'object',
          description: 'Risk event details'
        },
        {
          name: 'requiresImmediateAction',
          type: 'boolean',
          description: 'Whether immediate action is required'
        }
      ]
    };
  }
};

export const evaluateTrustExecutor: NodeExecutor = {
  type: 'evaluate-trust',
  async execute(inputs: any, config: any, context: WorkflowExecutionContext) {
    console.log('[Evaluate Trust] Calculating trust score...');
    
    const agentDid = inputs.agentDid || config.agentDid;
    const factors = inputs.factors || config.factors || ['authentication', 'behavior', 'history', 'compliance'];
    
    if (!agentDid) {
      throw new Error('Agent DID is required for trust evaluation');
    }
    
    const factorScores: Record<string, number> = {};
    factors.forEach((factor: string) => {
      factorScores[factor] = Math.random() * 0.4 + 0.6;
    });
    
    const overallScore = Object.values(factorScores).reduce((sum, score) => sum + score, 0) / factors.length;
    
    const trustLevel = 
      overallScore >= 0.9 ? 'trusted' :
      overallScore >= 0.7 ? 'verified' :
      overallScore >= 0.5 ? 'provisional' :
      overallScore >= 0.3 ? 'restricted' :
      'untrusted';
    
    const evaluation = {
      agentDid: agentDid,
      overallScore: overallScore,
      trustLevel: trustLevel,
      factorScores: factorScores,
      evaluatedAt: new Date(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      recommendations: overallScore < 0.7 ? [
        'Require additional verification',
        'Monitor agent activities closely',
        'Limit access to sensitive resources'
      ] : [],
      metadata: {
        evaluationMethod: 'weighted_average',
        factorsUsed: factors,
        executionId: context.executionId
      }
    };
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      evaluation: evaluation,
      message: `Trust evaluation completed for ${agentDid}`
    };
  },
  
  validate(config: any) {
    return config.agentDid && typeof config.agentDid === 'string';
  },
  
  getSchema() {
    return {
      inputs: [
        {
          name: 'agentDid',
          type: 'string',
          required: true,
          description: 'Agent DID to evaluate'
        },
        {
          name: 'factors',
          type: 'array',
          required: false,
          description: 'Factors to consider in evaluation',
          default: ['authentication', 'behavior', 'history', 'compliance']
        }
      ],
      outputs: [
        {
          name: 'evaluation',
          type: 'object',
          description: 'Trust evaluation results'
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

export const adjustTrustExecutor: NodeExecutor = {
  type: 'adjust-trust',
  async execute(inputs: any, config: any, context: WorkflowExecutionContext) {
    console.log('[Adjust Trust] Adjusting trust level...');
    
    const agentDid = inputs.agentDid || config.agentDid;
    const adjustment = inputs.adjustment || config.adjustment;
    const reason = inputs.reason || config.reason || 'Manual adjustment';
    const adjustmentType = inputs.adjustmentType || config.adjustmentType || 'relative';
    
    if (!agentDid) {
      throw new Error('Agent DID is required for trust adjustment');
    }
    
    if (adjustment === undefined || adjustment === null) {
      throw new Error('Adjustment value is required');
    }
    
    const currentTrustLevel = 0.65;
    
    let newTrustLevel: number;
    if (adjustmentType === 'absolute') {
      newTrustLevel = adjustment;
    } else {
      newTrustLevel = currentTrustLevel + adjustment;
    }
    
    newTrustLevel = Math.max(0, Math.min(1, newTrustLevel));
    
    const adjustmentRecord = {
      agentDid: agentDid,
      previousLevel: currentTrustLevel,
      newLevel: newTrustLevel,
      change: newTrustLevel - currentTrustLevel,
      adjustmentType: adjustmentType,
      reason: reason,
      adjustedBy: context.user?.id || 'system',
      adjustedAt: new Date(),
      auditLog: {
        executionId: context.executionId,
        workflowId: context.workflowId,
        timestamp: new Date()
      }
    };
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      adjustment: adjustmentRecord,
      message: `Trust level adjusted for ${agentDid}: ${currentTrustLevel.toFixed(2)} → ${newTrustLevel.toFixed(2)}`
    };
  },
  
  validate(config: any) {
    if (!config.agentDid || typeof config.agentDid !== 'string') {
      return false;
    }
    if (config.adjustment === undefined || config.adjustment === null) {
      return false;
    }
    if (config.adjustmentType && !['relative', 'absolute'].includes(config.adjustmentType)) {
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
          description: 'Agent DID to adjust'
        },
        {
          name: 'adjustment',
          type: 'number',
          required: true,
          description: 'Adjustment value',
          validation: {
            min: -1,
            max: 1
          }
        },
        {
          name: 'adjustmentType',
          type: 'string',
          required: false,
          description: 'Type of adjustment',
          default: 'relative',
          validation: {
            enum: ['relative', 'absolute']
          }
        },
        {
          name: 'reason',
          type: 'string',
          required: false,
          description: 'Reason for adjustment'
        }
      ],
      outputs: [
        {
          name: 'adjustment',
          type: 'object',
          description: 'Adjustment details'
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

export const trustThresholdConditionExecutor: NodeExecutor = {
  type: 'trust-threshold',
  async execute(inputs: any, config: any, context: WorkflowExecutionContext) {
    console.log('[Trust Threshold Condition] Checking trust level...');
    
    const agentDid = inputs.agentDid || config.agentDid;
    const threshold = inputs.threshold || config.threshold || 0.7;
    const operator = inputs.operator || config.operator || 'gte';
    
    if (!agentDid) {
      throw new Error('Agent DID is required for trust threshold check');
    }
    
    const currentTrustLevel = 0.65 + (Math.random() * 0.3 - 0.15);
    
    let meetsThreshold: boolean;
    switch (operator) {
      case 'gt':
        meetsThreshold = currentTrustLevel > threshold;
        break;
      case 'gte':
        meetsThreshold = currentTrustLevel >= threshold;
        break;
      case 'lt':
        meetsThreshold = currentTrustLevel < threshold;
        break;
      case 'lte':
        meetsThreshold = currentTrustLevel <= threshold;
        break;
      case 'eq':
        meetsThreshold = Math.abs(currentTrustLevel - threshold) < 0.01;
        break;
      default:
        meetsThreshold = currentTrustLevel >= threshold;
    }
    
    return {
      meetsThreshold: meetsThreshold,
      agentDid: agentDid,
      currentLevel: currentTrustLevel,
      requiredLevel: threshold,
      operator: operator,
      gap: threshold - currentTrustLevel,
      recommendation: meetsThreshold ? 'Proceed' : 'Additional verification required'
    };
  },
  
  validate(config: any) {
    if (config.threshold && (config.threshold < 0 || config.threshold > 1)) {
      return false;
    }
    if (config.operator && !['gt', 'gte', 'lt', 'lte', 'eq'].includes(config.operator)) {
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
          name: 'threshold',
          type: 'number',
          required: false,
          description: 'Trust threshold (0-1)',
          default: 0.7,
          validation: {
            min: 0,
            max: 1
          }
        },
        {
          name: 'operator',
          type: 'string',
          required: false,
          description: 'Comparison operator',
          default: 'gte',
          validation: {
            enum: ['gt', 'gte', 'lt', 'lte', 'eq']
          }
        }
      ],
      outputs: [
        {
          name: 'meetsThreshold',
          type: 'boolean',
          description: 'Whether threshold is met'
        },
        {
          name: 'currentLevel',
          type: 'number',
          description: 'Current trust level'
        },
        {
          name: 'gap',
          type: 'number',
          description: 'Gap to threshold'
        }
      ]
    };
  }
};

export const riskAssessmentConditionExecutor: NodeExecutor = {
  type: 'risk-assessment',
  async execute(inputs: any, config: any, context: WorkflowExecutionContext) {
    console.log('[Risk Assessment Condition] Evaluating risk...');
    
    const agentDid = inputs.agentDid || config.agentDid;
    const maxAcceptableRisk = inputs.maxAcceptableRisk || config.maxAcceptableRisk || 0.5;
    const riskFactors = inputs.riskFactors || config.riskFactors || ['behavior', 'location', 'time', 'frequency'];
    
    const factorRisks: Record<string, number> = {};
    riskFactors.forEach((factor: string) => {
      factorRisks[factor] = Math.random() * 0.6;
    });
    
    const overallRisk = Object.values(factorRisks).reduce((sum, risk) => sum + risk, 0) / riskFactors.length;
    
    const riskLevel = 
      overallRisk >= 0.8 ? 'critical' :
      overallRisk >= 0.6 ? 'high' :
      overallRisk >= 0.4 ? 'medium' :
      overallRisk >= 0.2 ? 'low' :
      'minimal';
    
    const assessment = {
      isAcceptable: overallRisk <= maxAcceptableRisk,
      agentDid: agentDid,
      overallRisk: overallRisk,
      riskLevel: riskLevel,
      factorRisks: factorRisks,
      maxAcceptableRisk: maxAcceptableRisk,
      mitigations: overallRisk > maxAcceptableRisk ? [
        'Require additional authentication',
        'Enable enhanced monitoring',
        'Limit resource access',
        'Request manual review'
      ] : [],
      assessedAt: new Date()
    };
    
    return assessment;
  },
  
  validate(config: any) {
    if (config.maxAcceptableRisk && (config.maxAcceptableRisk < 0 || config.maxAcceptableRisk > 1)) {
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
          required: false,
          description: 'Agent to assess (optional)'
        },
        {
          name: 'maxAcceptableRisk',
          type: 'number',
          required: false,
          description: 'Maximum acceptable risk (0-1)',
          default: 0.5,
          validation: {
            min: 0,
            max: 1
          }
        },
        {
          name: 'riskFactors',
          type: 'array',
          required: false,
          description: 'Risk factors to evaluate',
          default: ['behavior', 'location', 'time', 'frequency']
        }
      ],
      outputs: [
        {
          name: 'isAcceptable',
          type: 'boolean',
          description: 'Whether risk is acceptable'
        },
        {
          name: 'overallRisk',
          type: 'number',
          description: 'Overall risk score (0-1)'
        },
        {
          name: 'riskLevel',
          type: 'string',
          description: 'Risk level category'
        },
        {
          name: 'mitigations',
          type: 'array',
          description: 'Recommended mitigations'
        }
      ]
    };
  }
};

export const trustNodeDefinitions: NodeDefinition[] = [
  {
    type: 'trust-change-trigger',
    category: 'trigger',
    label: 'Trust Change Trigger',
    description: 'Triggers when trust level changes significantly',
    icon: '📊',
    color: '#10b981',
    inputs: trustChangeExecutor.getSchema!().inputs,
    outputs: trustChangeExecutor.getSchema!().outputs,
    executor: trustChangeExecutor
  },
  {
    type: 'risk-detected-trigger',
    category: 'trigger',
    label: 'Risk Detected Trigger',
    description: 'Triggers when risk is detected',
    icon: '⚡',
    color: '#f59e0b',
    inputs: riskDetectedExecutor.getSchema!().inputs,
    outputs: riskDetectedExecutor.getSchema!().outputs,
    executor: riskDetectedExecutor
  },
  {
    type: 'evaluate-trust',
    category: 'action',
    label: 'Evaluate Trust',
    description: 'Calculate trust score for an agent',
    icon: '🔍',
    color: '#3b82f6',
    inputs: evaluateTrustExecutor.getSchema!().inputs,
    outputs: evaluateTrustExecutor.getSchema!().outputs,
    executor: evaluateTrustExecutor
  },
  {
    type: 'adjust-trust',
    category: 'action',
    label: 'Adjust Trust',
    description: 'Modify trust level for an agent',
    icon: '⚖️',
    color: '#3b82f6',
    inputs: adjustTrustExecutor.getSchema!().inputs,
    outputs: adjustTrustExecutor.getSchema!().outputs,
    executor: adjustTrustExecutor
  },
  {
    type: 'trust-threshold',
    category: 'condition',
    label: 'Trust Threshold',
    description: 'Check if trust level meets threshold',
    icon: '🎯',
    color: '#eab308',
    inputs: trustThresholdConditionExecutor.getSchema!().inputs,
    outputs: trustThresholdConditionExecutor.getSchema!().outputs,
    executor: trustThresholdConditionExecutor
  },
  {
    type: 'risk-assessment',
    category: 'condition',
    label: 'Risk Assessment',
    description: 'Evaluate risk level',
    icon: '🚨',
    color: '#eab308',
    inputs: riskAssessmentConditionExecutor.getSchema!().inputs,
    outputs: riskAssessmentConditionExecutor.getSchema!().outputs,
    executor: riskAssessmentConditionExecutor
  }
];