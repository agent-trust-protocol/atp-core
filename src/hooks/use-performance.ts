"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { cachedFetch, batchFetch, performanceMonitor, clientCache } from '@/lib/performance'

export function usePerformance() {
  const [metrics, setMetrics] = useState(performanceMonitor.getMetrics())
  const [cacheSize, setCacheSize] = useState(clientCache.size())

  const refreshMetrics = useCallback(() => {
    setMetrics(performanceMonitor.getMetrics())
    setCacheSize(clientCache.size())
  }, [])

  const clearCache = useCallback(() => {
    clientCache.clear()
    performanceMonitor.reset()
    refreshMetrics()
  }, [refreshMetrics])

  const clearCacheEntry = useCallback((key: string) => {
    clientCache.delete(key)
    refreshMetrics()
  }, [refreshMetrics])

  // Auto-refresh metrics every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshMetrics, 30000)
    return () => clearInterval(interval)
  }, [refreshMetrics])

  return {
    metrics,
    cacheSize,
    refreshMetrics,
    clearCache,
    clearCacheEntry
  }
}

export function useCachedFetch<T>() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async (
    url: string,
    options?: RequestInit & {
      cacheKey?: string
      cacheTTL?: number
      skipCache?: boolean
    }
  ): Promise<T | null> => {
    setLoading(true)
    setError(null)

    try {
      const data = await cachedFetch<T>(url, options)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const batchRequest = useCallback(async (
    requests: Array<{
      url: string
      options?: RequestInit
      cacheKey?: string
      cacheTTL?: number
    }>
  ) => {
    setLoading(true)
    setError(null)

    try {
      const results = await batchFetch<T>(requests)
      return results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch request failed'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    fetch,
    batchRequest,
    loading,
    error
  }
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [ready, setReady] = useState(true)
  const latestCallback = useRef(callback)

  useEffect(() => {
    latestCallback.current = callback
  }, [callback])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledCallback = useCallback(
    ((...args) => {
      if (ready) {
        latestCallback.current(...args as Parameters<T>)
        setReady(false)
        setTimeout(() => setReady(true), delay)
      }
    }) as T,
    [delay, ready]
  )

  return throttledCallback
}