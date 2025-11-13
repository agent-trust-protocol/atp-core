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
    ? "brightness-110 contrast-110 drop-shadow-2xl"
    : "brightness-100 contrast-100 drop-shadow-lg"

  // Only apply gradient background to larger logos (size > 40)
  const hasBackground = size > 40

  return (
    <div className={`relative inline-flex items-center justify-center group`}>
      {/* Modern gradient background - only for larger logos */}
      {hasBackground && (
        <>
          <div className={`absolute inset-0 rounded-xl bg-gradient-to-br transition-all duration-300 ${
            isDarkMode
              ? 'from-blue-500/10 via-purple-500/10 to-cyan-500/10 group-hover:from-blue-500/20 group-hover:via-purple-500/20 group-hover:to-cyan-500/20'
              : 'from-blue-50 via-purple-50 to-cyan-50 group-hover:from-blue-100 group-hover:via-purple-100 group-hover:to-cyan-100'
          }`} />

          {/* Subtle border */}
          <div className={`absolute inset-0 rounded-xl border transition-all duration-300 ${
            isDarkMode
              ? 'border-blue-500/20 group-hover:border-blue-400/30'
              : 'border-blue-200/50 group-hover:border-blue-300/70'
          }`} />
        </>
      )}

      <Image
        src={src}
        alt={effectiveAlt}
        width={size}
        height={size}
        className={`relative z-10 object-contain transition-all duration-300 ${darkModeClasses} ${className} ${hasBackground ? 'p-1.5' : ''}`}
        priority
        unoptimized
        onError={() => setSrc("/atp-logo.svg")}
      />
    </div>
  )
}


