'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  const [showSignup, setShowSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user has already signed up
    const authToken = localStorage.getItem('atp_api_access')
    if (authToken) {
      setIsAuthenticated(true)
    }
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Store access token
    localStorage.setItem('atp_api_access', JSON.stringify({ 
      email, 
      company, 
      role,
      date: new Date().toISOString() 
    }))
    
    // Track lead
    console.log('API docs lead captured:', { email, company, role, feature: 'api-reference' })
    
    setIsLoading(false)
    setIsAuthenticated(true)
    setShowSignup(false)
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {!showSignup ? (
          // Gate screen
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
                <h3 className="font-medium mb-3">Why gate API documentation?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Protect proprietary implementation details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Track developer interest and adoption</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Provide personalized onboarding support</span>
                  </li>
                </ul>
              </div>
              
              {/* CTAs */}
              <div className="pt-6 space-y-4">
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={() => setShowSignup(true)}
                >
                  Get API Access
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
                Free for developers • No credit card required
              </p>
            </CardContent>
          </Card>
        ) : (
          // Signup form
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Access API Documentation</CardTitle>
              <CardDescription>
                Get instant access to complete API reference
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Work Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    type="text"
                    placeholder="Your company name"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Your Role</Label>
                  <select
                    id="role"
                    className="w-full px-3 py-2 border rounded-lg bg-background"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  >
                    <option value="">Select your role</option>
                    <option value="developer">Developer</option>
                    <option value="architect">Solutions Architect</option>
                    <option value="devops">DevOps Engineer</option>
                    <option value="product">Product Manager</option>
                    <option value="cto">CTO/Engineering Lead</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Access...' : 'Get API Documentation'}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Authenticated - show full API docs
  return <>{children}</>
}