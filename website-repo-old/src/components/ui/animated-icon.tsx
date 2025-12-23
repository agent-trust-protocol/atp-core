'use client'

import * as React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnimatedIconProps {
  icon: LucideIcon
  className?: string
  size?: number
  animate?: 'pulse' | 'spin' | 'bounce' | 'glow' | 'wiggle' | 'breathe' | 'bounce-in' | 'none'
  gradient?: boolean | 'primary' | 'success' | 'warning'
  glassmorphic?: boolean
  interactive?: boolean
  hoverEffect?: 'lift' | 'glow' | 'spin' | 'none'
}

export function AnimatedIcon({
  icon: Icon,
  className,
  size = 24,
  animate = 'none',
  gradient = false,
  glassmorphic = false,
  interactive = true,
  hoverEffect = 'none',
}: AnimatedIconProps) {
  const animationClasses = {
    pulse: 'animate-pulse',
    spin: 'animate-spin',
    bounce: 'animate-bounce',
    glow: 'icon-glow',
    wiggle: 'icon-wiggle',
    breathe: 'icon-breathe',
    'bounce-in': 'icon-bounce-in',
    none: '',
  }

  const hoverClasses = {
    lift: 'icon-hover-lift',
    glow: 'icon-hover-glow',
    spin: 'icon-hover-spin',
    none: '',
  }

  const gradientClasses = {
    primary: 'icon-gradient-primary',
    success: 'icon-gradient-success',
    warning: 'icon-gradient-warning',
  }

  const wrapperClasses = cn(
    'relative inline-flex items-center justify-center',
    glassmorphic && 'glass rounded-lg p-2',
    interactive && 'transition-all duration-300',
    interactive && hoverClasses[hoverEffect],
    className
  )

  const iconClasses = cn(
    animationClasses[animate],
    gradient === true && 'atp-gradient-text',
    typeof gradient === 'string' && gradientClasses[gradient],
    interactive && 'transition-all duration-300'
  )

  const renderIcon = () => {
    return (
      <Icon
        size={size}
        className={iconClasses}
        strokeWidth={1.5}
      />
    )
  }

  return (
    <div className={wrapperClasses}>
      {glassmorphic && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 blur-xl" />
      )}
      {renderIcon()}
    </div>
  )
}

interface IconWithBadgeProps extends AnimatedIconProps {
  badge?: string | number
  badgeColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
}

export function IconWithBadge({
  badge,
  badgeColor = 'primary',
  ...iconProps
}: IconWithBadgeProps) {
  const badgeColors = {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    success: 'bg-atp-emerald text-white',
    warning: 'bg-atp-amber text-white',
    danger: 'bg-atp-crimson text-white',
  }

  return (
    <div className="relative inline-flex">
      <AnimatedIcon {...iconProps} />
      {badge !== undefined && (
        <span
          className={cn(
            'absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium',
            badgeColors[badgeColor],
            'animate-in zoom-in-50 duration-200'
          )}
        >
          {badge}
        </span>
      )}
    </div>
  )
}

interface FloatingIconProps extends AnimatedIconProps {
  float?: boolean
  floatDuration?: number
}

export function FloatingIcon({
  float = true,
  floatDuration = 3,
  ...iconProps
}: FloatingIconProps) {
  const floatStyle = float
    ? {
        animation: `float ${floatDuration}s ease-in-out infinite`,
      }
    : {}

  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
      <div style={floatStyle}>
        <AnimatedIcon {...iconProps} />
      </div>
    </>
  )
}