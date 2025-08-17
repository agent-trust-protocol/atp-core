import { NextRequest, NextResponse } from 'next/server'

const MONITORING_SERVICE_URL = process.env.ATP_MONITORING_URL || 'http://localhost:3007'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    let monitoringUrl = `${MONITORING_SERVICE_URL}/api/monitoring/alerts`
    
    // Forward query parameters
    const params = new URLSearchParams()
    if (searchParams.has('resolved')) params.append('resolved', searchParams.get('resolved')!)
    if (searchParams.has('limit')) params.append('limit', searchParams.get('limit')!)
    
    if (params.toString()) {
      monitoringUrl += `?${params.toString()}`
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
    console.error('Alerts API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch alerts',
        data: []
      },
      { status: 503 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const alertId = searchParams.get('alertId')
    const action = searchParams.get('action')
    
    if (!alertId || action !== 'resolve') {
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      )
    }

    const response = await fetch(`${MONITORING_SERVICE_URL}/api/monitoring/alerts/${alertId}/resolve`, {
      method: 'POST',
      headers: {
        'User-Agent': 'ATP-Website/1.0',
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`Monitoring service responded with ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Alert resolution API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to resolve alert'
      },
      { status: 500 }
    )
  }
}