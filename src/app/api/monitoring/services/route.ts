import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MONITORING_SERVICE_URL = process.env.ATP_MONITORING_URL || 'http://localhost:3007'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${MONITORING_SERVICE_URL}/api/monitoring/services`, {
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
    console.error('Service health API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check service health',
        data: {
          services: [
            {
              name: 'Identity Service',
              status: 'unknown',
              uptime: 0,
              lastCheck: new Date().toISOString(),
              responseTime: 0,
              url: 'http://localhost:3001'
            },
            {
              name: 'Credential Service', 
              status: 'unknown',
              uptime: 0,
              lastCheck: new Date().toISOString(),
              responseTime: 0,
              url: 'http://localhost:3002'
            },
            {
              name: 'Permission Service',
              status: 'unknown',
              uptime: 0,
              lastCheck: new Date().toISOString(),
              responseTime: 0,
              url: 'http://localhost:3003'
            },
            {
              name: 'RPC Gateway',
              status: 'unknown',
              uptime: 0,
              lastCheck: new Date().toISOString(),
              responseTime: 0,
              url: 'http://localhost:3000'
            },
            {
              name: 'Audit Logger',
              status: 'unknown',
              uptime: 0,
              lastCheck: new Date().toISOString(),
              responseTime: 0,
              url: 'http://localhost:3006'
            }
          ],
          summary: {
            total: 5,
            online: 0,
            degraded: 0,
            offline: 5
          }
        }
      },
      { status: 503 }
    )
  }
}