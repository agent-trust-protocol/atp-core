import { NextRequest, NextResponse } from 'next/server';
import { checkApiAuth, createDemoResponse } from '@/lib/api-auth';

// Mock workflow data for now
const mockWorkflows = [
  {
    id: 'workflow-1',
    name: 'Policy Validation Workflow',
    status: 'active',
    nodes: [
      { id: 'trigger-1', type: 'policy-change-trigger', label: 'Policy Change Detected' },
      { id: 'action-1', type: 'validate-policy', label: 'Validate Policy' },
      { id: 'condition-1', type: 'policy-valid', label: 'Is Policy Valid?' }
    ],
    lastExecution: {
      status: 'success',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      duration: 1500
    },
    schedule: '0 */4 * * *'
  },
  {
    id: 'workflow-2', 
    name: 'Trust Score Monitoring',
    status: 'active',
    nodes: [
      { id: 'trigger-2', type: 'trust-change-trigger', label: 'Trust Change Detected' },
      { id: 'action-2', type: 'evaluate-trust', label: 'Evaluate Trust Score' },
      { id: 'condition-2', type: 'trust-threshold', label: 'Check Trust Threshold' }
    ],
    lastExecution: {
      status: 'success', 
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      duration: 850
    },
    schedule: '*/15 * * * *'
  },
  {
    id: 'workflow-3',
    name: 'Security Alert Response',
    status: 'draft',
    nodes: [
      { id: 'trigger-3', type: 'security-alert-trigger', label: 'Security Alert' },
      { id: 'action-3', type: 'send-alert', label: 'Send Notification' },
      { id: 'action-4', type: 'generate-report', label: 'Generate Incident Report' }
    ]
  }
];

const mockExecutions = [
  {
    executionId: 'exec-1',
    workflowId: 'workflow-1',
    state: 'running',
    startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    progress: 75
  },
  {
    executionId: 'exec-2', 
    workflowId: 'workflow-2',
    state: 'completed',
    startTime: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 19 * 60 * 1000).toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    // Check authentication - protect valuable workflow IP
    const authResult = await checkApiAuth(request);
    if (!authResult.isAuthenticated) {
      return authResult.error || createDemoResponse('workflows');
    }

    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const status = url.searchParams.get('status');
    
    let workflows = [...mockWorkflows];
    
    // Filter by status if provided
    if (status) {
      workflows = workflows.filter(w => w.status === status);
    }
    
    // Limit results if provided
    if (limit) {
      workflows = workflows.slice(0, parseInt(limit));
    }
    
    return NextResponse.json({
      workflows,
      total: workflows.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch workflows',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication - protect workflow creation
    const authResult = await checkApiAuth(request);
    if (!authResult.isAuthenticated) {
      return authResult.error || NextResponse.json(
        { 
          error: 'Premium feature',
          message: 'Workflow creation requires premium subscription' 
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Workflow name is required' },
        { status: 400 }
      );
    }
    
    // Create new workflow
    const newWorkflow = {
      id: `workflow-${Date.now()}`,
      name: body.name,
      description: body.description || '',
      status: 'draft',
      nodes: body.nodes || [],
      edges: body.edges || [],
      variables: body.variables || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json(
      {
        message: 'Workflow created successfully',
        workflow: newWorkflow
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to create workflow',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}