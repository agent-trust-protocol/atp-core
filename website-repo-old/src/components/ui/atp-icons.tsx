'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number
  gradient?: boolean
}

export function QuantumShieldIcon({ size = 24, gradient = false, className, ...props }: IconProps) {
  const id = React.useId()
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('transition-all duration-300', className)}
      {...props}
    >
      {gradient && (
        <defs>
          <linearGradient id={`quantum-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M12 2L4 7V12C4 16.5 6.84 20.74 11 21.9C11.35 22.02 11.65 22.02 12 21.9C16.16 20.74 19 16.5 19 12V7L12 2Z"
        stroke={gradient ? `url(#quantum-${id})` : 'currentColor'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke={gradient ? `url(#quantum-${id})` : 'currentColor'}
        strokeWidth="1.5"
      />
      <path
        d="M12 9V12M12 12V15M12 12H9M12 12H15"
        stroke={gradient ? `url(#quantum-${id})` : 'currentColor'}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function TrustNetworkIcon({ size = 24, gradient = false, className, ...props }: IconProps) {
  const id = React.useId()
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('transition-all duration-300', className)}
      {...props}
    >
      {gradient && (
        <defs>
          <linearGradient id={`trust-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" />
          </linearGradient>
        </defs>
      )}
      <circle cx="12" cy="5" r="2" stroke={gradient ? `url(#trust-${id})` : 'currentColor'} strokeWidth="1.5" />
      <circle cx="5" cy="19" r="2" stroke={gradient ? `url(#trust-${id})` : 'currentColor'} strokeWidth="1.5" />
      <circle cx="19" cy="19" r="2" stroke={gradient ? `url(#trust-${id})` : 'currentColor'} strokeWidth="1.5" />
      <path
        d="M12 7V12M12 12L6.5 17.5M12 12L17.5 17.5"
        stroke={gradient ? `url(#trust-${id})` : 'currentColor'}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="12"
        r="2"
        fill={gradient ? `url(#trust-${id})` : 'currentColor'}
      />
    </svg>
  )
}

export function QuantumKeyIcon({ size = 24, gradient = false, className, ...props }: IconProps) {
  const id = React.useId()
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('transition-all duration-300', className)}
      {...props}
    >
      {gradient && (
        <defs>
          <linearGradient id={`key-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" />
          </linearGradient>
        </defs>
      )}
      <circle
        cx="8"
        cy="12"
        r="4"
        stroke={gradient ? `url(#key-${id})` : 'currentColor'}
        strokeWidth="1.5"
      />
      <path
        d="M12 12H20M20 12V10M20 12V14M18 10H20M16 14H20"
        stroke={gradient ? `url(#key-${id})` : 'currentColor'}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle
        cx="8"
        cy="12"
        r="1.5"
        fill={gradient ? `url(#key-${id})` : 'currentColor'}
      />
    </svg>
  )
}

export function SecureConnectionIcon({ size = 24, gradient = false, className, ...props }: IconProps) {
  const id = React.useId()
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('transition-all duration-300', className)}
      {...props}
    >
      {gradient && (
        <defs>
          <linearGradient id={`secure-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M4 12C4 12 8 8 12 8C16 8 20 12 20 12C20 12 16 16 12 16C8 16 4 12 4 12Z"
        stroke={gradient ? `url(#secure-${id})` : 'currentColor'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke={gradient ? `url(#secure-${id})` : 'currentColor'}
        strokeWidth="1.5"
      />
      <circle
        cx="12"
        cy="12"
        r="1"
        fill={gradient ? `url(#secure-${id})` : 'currentColor'}
      />
      <path
        d="M2 6L6 2M22 6L18 2M2 18L6 22M22 18L18 22"
        stroke={gradient ? `url(#secure-${id})` : 'currentColor'}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function PolicyFlowIcon({ size = 24, gradient = false, className, ...props }: IconProps) {
  const id = React.useId()
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('transition-all duration-300', className)}
      {...props}
    >
      {gradient && (
        <defs>
          <linearGradient id={`policy-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" />
          </linearGradient>
        </defs>
      )}
      <rect
        x="3"
        y="3"
        width="6"
        height="6"
        rx="1"
        stroke={gradient ? `url(#policy-${id})` : 'currentColor'}
        strokeWidth="1.5"
      />
      <rect
        x="15"
        y="3"
        width="6"
        height="6"
        rx="1"
        stroke={gradient ? `url(#policy-${id})` : 'currentColor'}
        strokeWidth="1.5"
      />
      <rect
        x="9"
        y="15"
        width="6"
        height="6"
        rx="1"
        stroke={gradient ? `url(#policy-${id})` : 'currentColor'}
        strokeWidth="1.5"
      />
      <path
        d="M9 6H15M12 9V15M9 18H6M15 18H18"
        stroke={gradient ? `url(#policy-${id})` : 'currentColor'}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}