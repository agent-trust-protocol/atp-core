import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * SDK Health Check Response
 */
interface SDKHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  timestamp: string
  services: {
    name: string
    status: 'up' | 'down' | 'degraded'
    latency?: number
    lastCheck: string
  }[]
  features: {
    quantumSafe: boolean
    encryption: boolean
    trustScoring: boolean
    credentials: boolean
    payments: boolean
  }
}

/**
 * GET /api/sdk/health
 * Public health check endpoint for SDK status
 * No authentication required - used by SDK clients for connectivity checks
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Check individual service health
    const services = await checkServiceHealth()

    // Determine overall status
    const downServices = services.filter(s => s.status === 'down').length
    const degradedServices = services.filter(s => s.status === 'degraded').length

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (downServices > 0) {
      status = 'unhealthy'
    } else if (degradedServices > 0) {
      status = 'degraded'
    }

    const response: SDKHealthStatus = {
      status,
      version: process.env.SDK_VERSION || '1.1.0',
      timestamp: new Date().toISOString(),
      services,
      features: {
        quantumSafe: true,
        encryption: true,
        trustScoring: true,
        credentials: true,
        payments: true
      }
    }

    const responseTime = Date.now() - startTime

    return NextResponse.json(response, {
      status: status === 'unhealthy' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${responseTime}ms`
      }
    })
  } catch (error) {
    console.error('SDK Health check error:', error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        version: process.env.SDK_VERSION || '1.1.0',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        services: [],
        features: {
          quantumSafe: false,
          encryption: false,
          trustScoring: false,
          credentials: false,
          payments: false
        }
      },
      { status: 503 }
    )
  }
}

/**
 * Check health of individual SDK backend services
 */
async function checkServiceHealth(): Promise<SDKHealthStatus['services']> {
  const services: SDKHealthStatus['services'] = []
  const now = new Date().toISOString()

  // Identity Service
  const identityHealth = await checkEndpoint(
    process.env.ATP_IDENTITY_URL || 'http://localhost:3001',
    '/health'
  )
  services.push({
    name: 'identity',
    status: identityHealth.status,
    latency: identityHealth.latency,
    lastCheck: now
  })

  // Credentials Service
  const credentialsHealth = await checkEndpoint(
    process.env.ATP_CREDENTIALS_URL || 'http://localhost:3002',
    '/health'
  )
  services.push({
    name: 'credentials',
    status: credentialsHealth.status,
    latency: credentialsHealth.latency,
    lastCheck: now
  })

  // Permissions Service
  const permissionsHealth = await checkEndpoint(
    process.env.ATP_PERMISSIONS_URL || 'http://localhost:3003',
    '/health'
  )
  services.push({
    name: 'permissions',
    status: permissionsHealth.status,
    latency: permissionsHealth.latency,
    lastCheck: now
  })

  // Audit Service
  const auditHealth = await checkEndpoint(
    process.env.ATP_AUDIT_URL || 'http://localhost:3006',
    '/health'
  )
  services.push({
    name: 'audit',
    status: auditHealth.status,
    latency: auditHealth.latency,
    lastCheck: now
  })

  // Payments Service
  const paymentsHealth = await checkEndpoint(
    process.env.ATP_PAYMENTS_URL || 'http://localhost:3005',
    '/health'
  )
  services.push({
    name: 'payments',
    status: paymentsHealth.status,
    latency: paymentsHealth.latency,
    lastCheck: now
  })

  return services
}

/**
 * Check a single endpoint's health
 */
async function checkEndpoint(
  baseUrl: string,
  path: string
): Promise<{ status: 'up' | 'down' | 'degraded'; latency?: number }> {
  const startTime = Date.now()

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })

    const latency = Date.now() - startTime

    if (response.ok) {
      // Consider service degraded if latency > 1000ms
      if (latency > 1000) {
        return { status: 'degraded', latency }
      }
      return { status: 'up', latency }
    }

    return { status: 'down', latency }
  } catch {
    // Service is down or unreachable
    return { status: 'down' }
  }
}
