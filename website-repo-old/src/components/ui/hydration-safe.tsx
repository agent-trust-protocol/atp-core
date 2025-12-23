"use client"

import { useState, useEffect, ReactNode } from 'react'

interface HydrationSafeProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Wrapper component to prevent hydration mismatches
 * Only renders children on client-side after hydration
 */
export function HydrationSafe({ children, fallback = null }: HydrationSafeProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Component for hydration-safe time display
 */
interface TimeDisplayProps {
  format?: 'time' | 'date' | 'datetime'
  className?: string
}

export function TimeDisplay({ format = 'time', className }: TimeDisplayProps) {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
  }, [])

  if (!time) {
    return <span className={className}>Loading...</span>
  }

  const formatTime = () => {
    switch (format) {
      case 'time':
        return time.toLocaleTimeString()
      case 'date':
        return time.toLocaleDateString()
      case 'datetime':
        return time.toLocaleString()
      default:
        return time.toLocaleTimeString()
    }
  }

  return (
    <span className={className} suppressHydrationWarning>
      {formatTime()}
    </span>
  )
}