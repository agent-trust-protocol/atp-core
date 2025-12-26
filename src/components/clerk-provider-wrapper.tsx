'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ReactNode, Component } from 'react'

interface ClerkProviderWrapperProps {
  children: ReactNode
}

interface ClerkProviderErrorBoundaryState {
  hasError: boolean
}

// Error boundary specifically for ClerkProvider initialization errors
class ClerkProviderErrorBoundary extends Component<
  { children: ReactNode },
  ClerkProviderErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ClerkProviderErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('ClerkProvider initialization error:', error)
  }

  render() {
    if (this.state.hasError) {
      // When Clerk fails, just render children without Clerk context
      // The individual components will handle the missing context
      return this.props.children
    }
    return this.props.children
  }
}

// Wrapper that only uses ClerkProvider if the publishable key is available
export function ClerkProviderWrapper({ children }: ClerkProviderWrapperProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  // If no publishable key, render children without Clerk (for build/static generation)
  if (!publishableKey) {
    return <>{children}</>
  }

  return (
    <ClerkProviderErrorBoundary>
      <ClerkProvider publishableKey={publishableKey}>
        {children}
      </ClerkProvider>
    </ClerkProviderErrorBoundary>
  )
}
