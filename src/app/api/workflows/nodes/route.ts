import { NextRequest, NextResponse } from 'next/server';

// ATP-specific workflow nodes
const workflowNodes = [
  // Policy Nodes
  {
    type: 'policy-change-trigger',
    category: 'trigger',
    label: 'Policy Change Trigger',
    description: 'Triggers when a policy is created, updated, or deleted',
    icon: '📋',
    color: '#3B82F6',
    inputs: [],
    outputs: [{ name: 'policyData', type: 'object' }]
  },
  {
    type: 'policy-violation-trigger',
    category: 'trigger', 
    label: 'Policy Violation Trigger',
    description: 'Triggers when a policy violation is detected',
    icon: '⚠️',
    color: '#EF4444',
    inputs: [],
    outputs: [{ name: 'violationData', type: 'object' }]
  },
  {
    type: 'create-policy',
    category: 'action',
    label: 'Create Policy',
    description: 'Creates a new policy in the ATP system',
    icon: '➕',
    color: '#10B981',
    inputs: [{ name: 'policyDefinition', type: 'object', required: true }],
    outputs: [{ name: 'policyId', type: 'string' }]
  },
  {
    type: 'validate-policy',
    category: 'action',
    label: 'Validate Policy',
    description: 'Validates policy syntax and rules',
    icon: '✅',
    color: '#8B5CF6',
    inputs: [{ name: 'policy', type: 'object', required: true }],
    outputs: [{ name: 'isValid', type: 'boolean' }, { name: 'errors', type: 'array' }]
  },
  {
    type: 'policy-valid',
    category: 'condition',
    label: 'Policy Valid?',
    description: 'Checks if a policy passes validation',
    icon: '❓',
    color: '#F59E0B',
    inputs: [{ name: 'validationResult', type: 'object', required: true }],
    outputs: [{ name: 'true', type: 'boolean' }, { name: 'false', type: 'boolean' }]
  },
  
  // Trust Nodes
  {
    type: 'trust-change-trigger',
    category: 'trigger',
    label: 'Trust Change Trigger', 
    description: 'Triggers when trust scores change significantly',
    icon: '🔄',
    color: '#06B6D4',
    inputs: [],
    outputs: [{ name: 'trustData', type: 'object' }]
  },
  {
    type: 'evaluate-trust',
    category: 'action',
    label: 'Evaluate Trust Score',
    description: 'Calculates trust score for an agent or transaction',
    icon: '📊',
    color: '#84CC16',
    inputs: [{ name: 'agentId', type: 'string', required: true }],
    outputs: [{ name: 'trustScore', type: 'number' }, { name: 'factors', type: 'array' }]
  },
  {
    type: 'trust-threshold',
    category: 'condition',
    label: 'Trust Threshold Check',
    description: 'Checks if trust score meets minimum threshold',
    icon: '📏',
    color: '#F97316',
    inputs: [{ name: 'trustScore', type: 'number', required: true }, { name: 'threshold', type: 'number', required: true }],
    outputs: [{ name: 'above', type: 'boolean' }, { name: 'below', type: 'boolean' }]
  },
  
  // Monitoring Nodes
  {
    type: 'security-alert-trigger',
    category: 'trigger',
    label: 'Security Alert Trigger',
    description: 'Triggers on security events and anomalies',
    icon: '🚨',
    color: '#DC2626',
    inputs: [],
    outputs: [{ name: 'alertData', type: 'object' }]
  },
  {
    type: 'send-alert',
    category: 'action',
    label: 'Send Alert',
    description: 'Sends notifications via configured channels',
    icon: '📢',
    color: '#7C3AED',
    inputs: [{ name: 'message', type: 'string', required: true }, { name: 'severity', type: 'string', required: true }],
    outputs: [{ name: 'sent', type: 'boolean' }]
  },
  {
    type: 'generate-report',
    category: 'action',
    label: 'Generate Report',
    description: 'Generates compliance and audit reports',
    icon: '📄',
    color: '#059669',
    inputs: [{ name: 'reportType', type: 'string', required: true }, { name: 'timeRange', type: 'object' }],
    outputs: [{ name: 'reportUrl', type: 'string' }]
  }
];

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    
    let nodes = [...workflowNodes];
    
    // Filter by category if provided
    if (category) {
      nodes = nodes.filter(node => node.category === category);
    }
    
    return NextResponse.json({
      nodes,
      categories: ['trigger', 'action', 'condition'],
      total: nodes.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch workflow nodes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}