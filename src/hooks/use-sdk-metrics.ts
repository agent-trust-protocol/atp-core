'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * SDK Metrics Types
 */
export interface SDKMetrics {
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
  history?: HistoryPoint[]
}

export interface HistoryPoint {
  timestamp: string
  agents: number
  messages: number
  apiCalls: number
  avgTrustScore: number
  errorRate: number
}

export interface SDKMetricsResponse {
  success: boolean
  demo?: boolean
  message?: string
  data: SDKMetrics
  meta?: {
    timeRange: string
    userId?: string
    generatedAt: string
  }
}

export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d'

interface UseSDKMetricsOptions {
  timeRange?: TimeRange
  includeHistory?: boolean
  refreshInterval?: number  // milliseconds, 0 to disable
  enabled?: boolean
}

interface UseSDKMetricsReturn {
  data: SDKMetrics | null
  loading: boolean
  error: string | null
  isDemo: boolean
  refresh: () => Promise<void>
  setTimeRange: (range: TimeRange) => void
  timeRange: TimeRange
}

/**
 * Hook to fetch and manage SDK metrics data
 *
 * @example
 * ```tsx
 * const { data, loading, error, isDemo, refresh, setTimeRange } = useSDKMetrics({
 *   timeRange: '24h',
 *   includeHistory: true,
 *   refreshInterval: 30000
 * })
 *
 * if (loading) return <Spinner />
 * if (error) return <Error message={error} />
 *
 * return (
 *   <div>
 *     <p>Total Agents: {data?.usage.totalAgents}</p>
 *     <p>Trust Score: {Math.round((data?.trust.averageScore || 0) * 100)}%</p>
 *   </div>
 * )
 * ```
 */
export function useSDKMetrics(options: UseSDKMetricsOptions = {}): UseSDKMetricsReturn {
  const {
    timeRange: initialTimeRange = '24h',
    includeHistory = false,
    refreshInterval = 30000,
    enabled = true
  } = options

  const [data, setData] = useState<SDKMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange)

  const fetchMetrics = useCallback(async () => {
    if (!enabled) return

    try {
      setError(null)

      const params = new URLSearchParams()
      params.append('timeRange', timeRange)
      if (includeHistory) {
        params.append('history', 'true')
      }

      const response = await fetch(`/api/sdk/metrics?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.status}`)
      }

      const result: SDKMetricsResponse = await response.json()

      if (!result.success && !result.demo) {
        throw new Error(result.message || 'Failed to fetch metrics')
      }

      setData(result.data)
      setIsDemo(result.demo || false)
    } catch (err) {
      console.error('SDK Metrics fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
    } finally {
      setLoading(false)
    }
  }, [timeRange, includeHistory, enabled])

  // Initial fetch
  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  // Auto-refresh
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return

    const interval = setInterval(fetchMetrics, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchMetrics, refreshInterval, enabled])

  const refresh = useCallback(async () => {
    setLoading(true)
    await fetchMetrics()
  }, [fetchMetrics])

  return {
    data,
    loading,
    error,
    isDemo,
    refresh,
    setTimeRange,
    timeRange
  }
}

/**
 * Hook to fetch SDK health status
 */
export interface SDKHealthStatus {
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

export function useSDKHealth(refreshInterval = 60000) {
  const [health, setHealth] = useState<SDKHealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/sdk/health')
      const data = await response.json()
      setHealth(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
    if (refreshInterval > 0) {
      const interval = setInterval(fetchHealth, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchHealth, refreshInterval])

  return { health, loading, error, refresh: fetchHealth }
}

/**
 * Hook to manage API keys
 */
export interface APIKey {
  id: string
  name: string
  keyPrefix: string
  permissions: string[]
  environment: 'development' | 'staging' | 'production'
  createdAt: string
  lastUsedAt?: string
  expiresAt?: string
  status: 'active' | 'revoked' | 'expired'
  rateLimit: {
    requestsPerMinute: number
    requestsPerDay: number
  }
}

export function useAPIKeys() {
  const [keys, setKeys] = useState<APIKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sdk/keys', {
        credentials: 'include'
      })
      const data = await response.json()

      if (data.success) {
        setKeys(data.data.keys || [])
      } else {
        throw new Error(data.error || 'Failed to fetch API keys')
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch API keys')
    } finally {
      setLoading(false)
    }
  }, [])

  const createKey = useCallback(async (params: {
    name: string
    permissions?: string[]
    environment?: 'development' | 'staging' | 'production'
    expiresIn?: number
    description?: string
  }) => {
    const response = await fetch('/api/sdk/keys', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Failed to create API key')
    }

    await fetchKeys()
    return data.data // Contains the full key (shown only once)
  }, [fetchKeys])

  const revokeKey = useCallback(async (keyId: string) => {
    const response = await fetch(`/api/sdk/keys?id=${keyId}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Failed to revoke API key')
    }

    await fetchKeys()
  }, [fetchKeys])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  return { keys, loading, error, createKey, revokeKey, refresh: fetchKeys }
}

export default useSDKMetrics
