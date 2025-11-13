import { NextRequest, NextResponse } from 'next/server'
import { checkApiAuth, createDemoResponse } from '@/lib/api-auth';

export const dynamic = 'force-dynamic'

const MONITORING_SERVICE_URL = process.env.ATP_MONITORING_URL || 'http://localhost:3007'

// Workflow data
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
]

const mockActiveExecutions = [
  {
    executionId: 'exec-running-1',
    workflowId: 'workflow-1',
    workflowName: 'Policy Validation Workflow',
    state: 'running',
    startTime: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    progress: 65,
    currentStep: 'Validating policy syntax'
  },
  {
    executionId: 'exec-running-2',
    workflowId: 'workflow-2', 
    workflowName: 'Trust Score Monitoring',
    state: 'running',
    startTime: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    progress: 90,
    currentStep: 'Generating trust report'
  }
]

async function handleWorkflowRequest(searchParams: URLSearchParams, request: NextRequest) {
  // Check authentication for workflow data - contains valuable IP
  const authResult = await checkApiAuth(request);
  if (!authResult.isAuthenticated) {
    return authResult.error || createDemoResponse('monitoring-workflows');
  }

  const action = searchParams.get('action') || 'list'
  
  switch (action) {
    case 'health':
      return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'workflow-engine',
        version: '1.0.0'
      })
    
    case 'list':
      return NextResponse.json({
        workflows: mockWorkflows,
        total: mockWorkflows.length,
        timestamp: new Date().toISOString()
      })
    
    case 'executions':
      return NextResponse.json({
        executions: mockActiveExecutions,
        count: mockActiveExecutions.length,
        timestamp: new Date().toISOString()
      })
    
    case 'nodes':
      const workflowNodes = [
        {
          type: 'policy-change-trigger',
          category: 'trigger',
          label: 'Policy Change Trigger',
          description: 'Triggers when a policy is created, updated, or deleted',
          icon: '📋',
          color: '#3B82F6'
        },
        {
          type: 'trust-change-trigger',
          category: 'trigger',
          label: 'Trust Change Trigger', 
          description: 'Triggers when trust scores change significantly',
          icon: '🔄',
          color: '#06B6D4'
        },
        {
          type: 'security-alert-trigger',
          category: 'trigger',
          label: 'Security Alert Trigger',
          description: 'Triggers on security events and anomalies',
          icon: '🚨',
          color: '#DC2626'
        }
      ]
      return NextResponse.json({
        nodes: workflowNodes,
        categories: ['trigger', 'action', 'condition'],
        total: workflowNodes.length
      })
    
    default:
      return NextResponse.json({ error: 'Unknown workflow action' }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const endpoint = searchParams.get('endpoint') || 'dashboard'
    
    // Handle workflow endpoints
    if (endpoint === 'workflows') {
      return handleWorkflowRequest(searchParams, request)
    }
    
    let monitoringUrl = `${MONITORING_SERVICE_URL}/api/monitoring/${endpoint}`
    
    // Forward query parameters
    const params = new URLSearchParams()
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        params.append(key, value)
      }
    })
    
    if (params.toString()) {
      monitoringUrl += `?${params.toString()}`
    }

    const response = await fetch(monitoringUrl, {
      headers: {
        'User-Agent': 'ATP-Website/1.0',
        'Accept': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`Monitoring service responded with ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Monitoring API proxy error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch monitoring data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function HEAD() {
  try {
    const response = await fetch(`${MONITORING_SERVICE_URL}/api/monitoring/health`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    })
    
    return new NextResponse(null, { 
      status: response.ok ? 200 : 503,
      headers: {
        'X-Monitoring-Service': response.ok ? 'healthy' : 'unhealthy'
      }
    })
  } catch (error) {
    return new NextResponse(null, { 
      status: 503,
      headers: {
        'X-Monitoring-Service': 'unreachable'
      }
    })
  }
}