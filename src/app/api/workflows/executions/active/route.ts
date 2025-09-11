import { NextRequest, NextResponse } from 'next/server';

// Mock active executions
const mockActiveExecutions = [
  {
    executionId: 'exec-running-1',
    workflowId: 'workflow-1',
    workflowName: 'Policy Validation Workflow',
    state: 'running',
    startTime: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    progress: 65,
    currentStep: 'Validating policy syntax',
    estimatedTimeRemaining: 45000
  },
  {
    executionId: 'exec-running-2',
    workflowId: 'workflow-2', 
    workflowName: 'Trust Score Monitoring',
    state: 'running',
    startTime: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    progress: 90,
    currentStep: 'Generating trust report',
    estimatedTimeRemaining: 15000
  }
];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      executions: mockActiveExecutions,
      count: mockActiveExecutions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch active executions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}