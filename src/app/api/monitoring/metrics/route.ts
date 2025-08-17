import { NextRequest, NextResponse } from 'next/server'

const MONITORING_SERVICE_URL = process.env.ATP_MONITORING_URL || 'http://localhost:3007'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    let monitoringUrl = `${MONITORING_SERVICE_URL}/api/monitoring/metrics`
    
    // Forward query parameters for history endpoint
    if (searchParams.has('timeRange') || searchParams.has('services') || searchParams.has('limit')) {
      monitoringUrl += '/history'
      const params = new URLSearchParams()
      if (searchParams.has('timeRange')) params.append('timeRange', searchParams.get('timeRange')!)
      if (searchParams.has('services')) params.append('services', searchParams.get('services')!)
      if (searchParams.has('limit')) params.append('limit', searchParams.get('limit')!)
      
      if (params.toString()) {
        monitoringUrl += `?${params.toString()}`
      }
    }

    const response = await fetch(monitoringUrl, {
      headers: {
        'User-Agent': 'ATP-Website/1.0',
        'Accept': 'application/json',
      },
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
    console.error('Monitoring metrics API error:', error)
    
    // Return fallback data if monitoring service is unavailable
    return NextResponse.json(
      {
        success: false,
        error: 'Monitoring service unavailable',
        data: {
          timestamp: new Date().toISOString(),
          services: [],
          performance: {
            activeConnections: 0,
            signaturesGenerated: 0,
            avgResponseTime: 0,
            requestsPerSecond: 0,
            errorRate: 0,
            memoryUsage: 0,
            cpuUsage: 0
          },
          security: {
            trustTransactions: 0,
            failedAuthentications: 0,
            compromisedAgents: 0,
            quantumThreats: 0
          },
          business: {
            registeredAgents: 0,
            activeAgents: 0,
            credentialsIssued: 0,
            auditEvents: 0
          }
        }
      },
      { status: 503 }
    )
  }
}