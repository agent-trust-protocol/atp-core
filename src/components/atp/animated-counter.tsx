'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
  decimals?: number
}

export function AnimatedCounter({ 
  value, 
  duration = 2000, 
  className,
  prefix = '',
  suffix = '',
  decimals = 0
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)
  const startTimeRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const previousValueRef = useRef(value)
  const isFirstRender = useRef(true)

  useEffect(() => {
    // On first render, just set the value without animation
    if (isFirstRender.current) {
      isFirstRender.current = false
      setDisplayValue(value)
      previousValueRef.current = value
      return
    }

    // Only animate if value changed
    if (previousValueRef.current === value) {
      return
    }

    const startValue = previousValueRef.current
    const endValue = value
    previousValueRef.current = value
    setIsAnimating(true)
    startTimeRef.current = Date.now()

    const animate = () => {
      if (!startTimeRef.current) return
      
      const now = Date.now()
      const elapsed = now - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3)

      const currentValue = startValue + (endValue - startValue) * easeOut
      setDisplayValue(currentValue)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
        setIsAnimating(false)
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [value, duration])

  const formatValue = (val: number) => {
    const rounded = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toString()
    return rounded.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  return (
    <span className={cn('tabular-nums', className, isAnimating && 'transition-all')}>
      {prefix}{formatValue(displayValue)}{suffix}
    </span>
  )
}

