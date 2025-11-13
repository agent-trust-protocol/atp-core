import { NextRequest, NextResponse } from 'next/server';
import { checkApiAuth, createDemoResponse } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication - workflow engine details contain valuable IP
    const authResult = await checkApiAuth(request);
    if (!authResult.isAuthenticated) {
      return authResult.error || createDemoResponse('workflow-engine');
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'workflow-engine',
      version: '1.0.0',
      features: {
        nodeRegistry: 'available',
        workflowEngine: 'available',
        database: 'optional'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}