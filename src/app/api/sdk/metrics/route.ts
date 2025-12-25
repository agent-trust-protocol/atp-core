import { NextRequest, NextResponse } from 'next/server'
import { checkApiAuth, createDemoResponse } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

/**
 * SDK Metrics API Types
 */
interface SDKMetrics {
  timestamp: string
  usage: {
    totalAgents: number
    activeAgents: number
    totalMessages: number
    encryptedMessages: number
    apiCalls: number
  }
  trust: {
    averageScore: number
    distribution: {
      unknown: number
      basic: number
      verified: number
      trusted: number
      privileged: number
    }
    assessments: number
  }
  credentials: {
    issued: number
    verified: number
    revoked: number
    pending: number
  }
  security: {
    quantumSafeAgents: number
    classicAgents: number
    encryptionKeyPairs: number
    signatureOperations: number
    failedVerifications: number
  }
  performance: {
    avgResponseTime: number
    p95ResponseTime: number
    errorRate: number
    uptime: number
  }
}

/**
 * Generate demo metrics for unauthenticated users
 */
function generateDemoMetrics(): SDKMetrics {
  return {
    timestamp: new Date().toISOString(),
    usage: {
      totalAgents: 1247,
      activeAgents: 892,
      totalMessages: 15420,
      encryptedMessages: 12890,
      apiCalls: 45230
    },
    trust: {
      averageScore: 0.72,
      distribution: {
        unknown: 45,
        basic: 234,
        verified: 412,
        trusted: 398,
        privileged: 158
      },
      assessments: 3421
    },
    credentials: {
      issued: 2890,
      verified: 2654,
      revoked: 89,
      pending: 147
    },
    security: {
      quantumSafeAgents: 743,
      classicAgents: 504,
      encryptionKeyPairs: 1247,
      signatureOperations: 28450,
      failedVerifications: 12
    },
    performance: {
      avgResponseTime: 45,
      p95ResponseTime: 120,
      errorRate: 0.02,
      uptime: 99.97
    }
  }
}

/**
 * GET /api/sdk/metrics
 * Returns SDK usage metrics for the authenticated user's organization
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication - SDK metrics contain sensitive operational data
    const authResult = await checkApiAuth(request);
    if (!authResult.isAuthenticated) {
      // Return demo data for unauthenticated requests (marketing purposes)
      return NextResponse.json({
        success: true,
        demo: true,
        message: 'Demo data - authenticate for your organization\'s real metrics',
        data: generateDemoMetrics()
      }, {
        headers: {
          'Cache-Control': 'public, max-age=60',
        }
      });
    }

    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get('timeRange') || '24h'
    const includeHistory = searchParams.get('history') === 'true'

    // In production, this would query the SDK backend service
    // For now, generate metrics based on the authenticated user's context
    const metrics = await getSDKMetricsForUser(authResult.user?.id, timeRange, includeHistory)

    return NextResponse.json({
      success: true,
      data: metrics,
      meta: {
        timeRange,
        userId: authResult.user?.id,
        generatedAt: new Date().toISOString()
      }
    }, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('SDK Metrics API error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch SDK metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'SDK_METRICS_ERROR'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sdk/metrics
 * Record SDK metrics from client SDKs (batch upload)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await checkApiAuth(request);
    if (!authResult.isAuthenticated) {
      return authResult.error || NextResponse.json(
        {
          error: 'Authentication required',
          message: 'SDK metrics submission requires authentication',
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }

    const body = await request.json()

    // Validate the metrics payload
    if (!body.events || !Array.isArray(body.events)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payload',
          message: 'Expected { events: MetricEvent[] }',
          code: 'INVALID_PAYLOAD'
        },
        { status: 400 }
      )
    }

    // Process and store metrics
    const processed = await processSDKMetrics(authResult.user?.id, body.events)

    return NextResponse.json({
      success: true,
      message: `Processed ${processed.count} metric events`,
      data: {
        processed: processed.count,
        failed: processed.failed,
        timestamp: new Date().toISOString()
      }
    }, { status: 201 })
  } catch (error) {
    console.error('SDK Metrics POST error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process SDK metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'SDK_METRICS_PROCESS_ERROR'
      },
      { status: 500 }
    )
  }
}

/**
 * Fetch SDK metrics for a specific user/organization
 * In production, this queries the ATP metrics backend
 */
async function getSDKMetricsForUser(
  userId: string | undefined,
  timeRange: string,
  includeHistory: boolean
): Promise<SDKMetrics & { history?: any[] }> {
  // TODO: Replace with actual backend service call
  // This simulates real metrics with some variation based on user
  const baseMetrics = generateDemoMetrics()

  // Add some pseudo-random variation based on userId hash
  const userHash = userId ? hashCode(userId) : 0
  const variation = (userHash % 100) / 100 // 0-1 variation factor

  const metrics: SDKMetrics = {
    ...baseMetrics,
    usage: {
      totalAgents: Math.floor(baseMetrics.usage.totalAgents * (0.5 + variation)),
      activeAgents: Math.floor(baseMetrics.usage.activeAgents * (0.5 + variation)),
      totalMessages: Math.floor(baseMetrics.usage.totalMessages * (0.5 + variation)),
      encryptedMessages: Math.floor(baseMetrics.usage.encryptedMessages * (0.5 + variation)),
      apiCalls: Math.floor(baseMetrics.usage.apiCalls * (0.5 + variation))
    },
    trust: {
      ...baseMetrics.trust,
      averageScore: Math.round((0.5 + variation * 0.5) * 100) / 100
    }
  }

  if (includeHistory) {
    // Generate time-series history data
    const historyPoints = getHistoryPointCount(timeRange)
    const history = generateHistoryData(historyPoints, timeRange)
    return { ...metrics, history }
  }

  return metrics
}

/**
 * Process SDK metric events from client SDKs
 */
async function processSDKMetrics(
  userId: string | undefined,
  events: any[]
): Promise<{ count: number; failed: number }> {
  // TODO: Implement actual metric storage
  // This would write to a time-series database or analytics service

  let count = 0
  let failed = 0

  for (const event of events) {
    try {
      // Validate event structure
      if (event.type && event.timestamp && event.data) {
        // In production: store to database
        count++
      } else {
        failed++
      }
    } catch {
      failed++
    }
  }

  return { count, failed }
}

/**
 * Simple hash function for consistent pseudo-random variation
 */
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

/**
 * Get number of history points based on time range
 */
function getHistoryPointCount(timeRange: string): number {
  switch (timeRange) {
    case '1h': return 12      // 5-minute intervals
    case '6h': return 24      // 15-minute intervals
    case '24h': return 48     // 30-minute intervals
    case '7d': return 42      // 4-hour intervals
    case '30d': return 60     // 12-hour intervals
    default: return 24
  }
}

/**
 * Generate mock history data for time-series charts
 */
function generateHistoryData(points: number, timeRange: string): any[] {
  const history = []
  const now = Date.now()
  const intervalMs = getIntervalMs(timeRange) / points

  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now - (i * intervalMs)).toISOString()
    const variation = Math.sin(i / 4) * 0.2 + 0.9 // Sinusoidal variation 0.7-1.1

    history.push({
      timestamp,
      agents: Math.floor(100 * variation),
      messages: Math.floor(500 * variation),
      apiCalls: Math.floor(1000 * variation),
      avgTrustScore: Math.round(0.7 * variation * 100) / 100,
      errorRate: Math.round((0.02 / variation) * 1000) / 1000
    })
  }

  return history
}

/**
 * Get interval milliseconds for time range
 */
function getIntervalMs(timeRange: string): number {
  switch (timeRange) {
    case '1h': return 60 * 60 * 1000
    case '6h': return 6 * 60 * 60 * 1000
    case '24h': return 24 * 60 * 60 * 1000
    case '7d': return 7 * 24 * 60 * 60 * 1000
    case '30d': return 30 * 24 * 60 * 60 * 1000
    default: return 24 * 60 * 60 * 1000
  }
}
