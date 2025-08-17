import { useState, useEffect } from 'react'

/**
 * Hook to prevent hydration mismatches for client-only values
 */
export function useHydrationSafe() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}

/**
 * Hook for hydration-safe timestamps
 */
export function useCurrentTime() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const isClient = useHydrationSafe()

  useEffect(() => {
    if (isClient) {
      setCurrentTime(new Date())
    }
  }, [isClient])

  return currentTime
}