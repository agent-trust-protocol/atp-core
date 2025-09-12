'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Lock, 
  ArrowRight, 
  CheckCircle,
  Code2,
  Key,
  Shield,
  BookOpen,
  FileCode,
  Webhook
} from "lucide-react"

interface GatedAPIReferenceProps {
  children: React.ReactNode
}

export function GatedAPIReference({ children }: GatedAPIReferenceProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check server-side authentication
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          credentials: 'include'
        })
        setIsAuthenticated(response.ok)
      } catch (error) {
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  const handleLoginRedirect = () => {
    const returnUrl = encodeURIComponent(window.location.pathname)
    router.push(`/login?returnTo=${returnUrl}&feature=api-reference`)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <Card className="max-w-3xl mx-auto border-2">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Complete API Documentation</CardTitle>
            <CardDescription className="text-lg mt-4">
              Access comprehensive API reference, endpoints, schemas, and integration guides
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* What's Included */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Code2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">API Endpoints</p>
                  <p className="text-sm text-muted-foreground">
                    All REST endpoints with parameters
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FileCode className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Code Examples</p>
                  <p className="text-sm text-muted-foreground">
                    Working examples in multiple languages
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Webhook className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Webhooks & Events</p>
                  <p className="text-sm text-muted-foreground">
                    Real-time event documentation
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Integration Guides</p>
                  <p className="text-sm text-muted-foreground">
                    Step-by-step integration tutorials
                  </p>
                </div>
              </div>
            </div>

            {/* Value Props */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-3">Why require authentication?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Protect proprietary implementation details</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Ensure secure access to sensitive documentation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Provide enterprise-grade security</span>
                </li>
              </ul>
            </div>
            
            {/* CTAs */}
            <div className="pt-6 space-y-4">
              <Button 
                size="lg" 
                className="w-full"
                onClick={handleLoginRedirect}
              >
                Sign In to Access API Docs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex-1"
                  onClick={() => router.push('/docs')}
                >
                  View Public Docs
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex-1"
                  onClick={() => router.push('/contact')}
                >
                  Contact Sales
                </Button>
              </div>
            </div>
            
            <p className="text-center text-sm text-muted-foreground">
              Enterprise authentication required for API access
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Authenticated - show full API docs
  return <>{children}</>
}