"use client"

import Image from "next/image"
import { useState, useEffect } from "react"

type BrandLogoProps = {
  variant?: "mark" | "lockup"
  size?: number
  className?: string
  alt?: string
}

/**
 * Centralized logo component with dark mode support and graceful fallback.
 *
 * Automatically detects dark mode and applies appropriate styling.
 * Place your branded assets under `/public/brand/` using these names:
 * - mark:   `/brand/atp-shield-mark.png` (square icon)
 * - lockup: `/brand/atp-lockup.png` (full wordmark lockup)
 *
 * If a file is missing, this component falls back to `/atp-logo.svg`.
 */
export function BrandLogo({ variant = "mark", size = 32, className = "", alt }: BrandLogoProps) {
  const [src, setSrc] = useState<string>(
    variant === "lockup" ? "/brand/atp-lockup.png" : "/brand/atp-shield-mark.png"
  )
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Check for dark mode on mount and when theme changes
    const checkDarkMode = () => {
      if (typeof window !== 'undefined') {
        const htmlElement = document.documentElement
        const isDark = htmlElement.classList.contains('dark') || 
                      window.matchMedia('(prefers-color-scheme: dark)').matches
        setIsDarkMode(isDark)
      }
    }

    checkDarkMode()

    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const observer = new MutationObserver(checkDarkMode)
    
    mediaQuery.addListener(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => {
      mediaQuery.removeListener(checkDarkMode)
      observer.disconnect()
    }
  }, [])

  const effectiveAlt = alt ?? (variant === "lockup" ? "Agent Trust Protocol Logo" : "ATP Logo")

  // Enhanced styling for dark mode visibility
  const darkModeClasses = isDarkMode 
    ? "brightness-125 contrast-150 drop-shadow-xl filter" 
    : "brightness-100 contrast-100"

  return (
    <div className={`relative inline-flex items-center justify-center ${isDarkMode ? 'atp-quantum-glow' : ''}`}>
      <Image
        src={src}
        alt={effectiveAlt}
        width={size}
        height={size}
        className={`object-contain transition-all duration-300 ${darkModeClasses} ${className}`}
        priority
        unoptimized
        onError={() => setSrc("/atp-logo.svg")}
      />
      {/* Enhanced visibility overlay for dark mode */}
      {isDarkMode && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-400/15 to-blue-400/15 pointer-events-none" />
      )}
    </div>
  )
}


