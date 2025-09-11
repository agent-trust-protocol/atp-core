'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { VisualPolicyEditor } from "@/components/atp/visual-policy-editor"
import { Subnav } from "@/components/ui/subnav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Edit3, Play, BarChart3, Lock, ArrowRight, CheckCircle } from "lucide-react"
import type { Metadata } from 'next'

// Note: Metadata export needs to be in a separate server component
// export const metadata: Metadata = {
//   title: 'Visual Policy Editor — Agent Trust Protocol',
//   description: 'Create and edit trust policies with a visual, no-code editor.'
// }

export default function PolicyEditorPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user has already signed up (stored in localStorage for demo)
    const authToken = localStorage.getItem('atp_demo_access')
    if (authToken) {
      setIsAuthenticated(true)
    }
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Store demo access token
    localStorage.setItem('atp_demo_access', JSON.stringify({ email, company, date: new Date().toISOString() }))
    
    // Track signup (you'd send this to your analytics/CRM)
    console.log('Lead captured:', { email, company, feature: 'policy-editor' })
    
    setIsLoading(false)
    setIsAuthenticated(true)
    setShowSignup(false)
  }

  const policyTabs = [
    {
      id: 'policies',
      label: 'Policy Management',
      href: '/policies',
      icon: <Shield className="h-4 w-4" />
    },
    {
      id: 'policy-editor',
      label: 'Policy Editor',
      href: '/policy-editor',
      icon: <Edit3 className="h-4 w-4" />
    },
    {
      id: 'policy-testing',
      label: 'Policy Testing',
      href: '/policy-testing',
      icon: <Play className="h-4 w-4" />
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: <BarChart3 className="h-4 w-4" />
    }
  ]

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Policy Management', href: '/policies' },
    { label: 'Policy Editor' }
  ]

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Subnav 
          tabs={policyTabs} 
          breadcrumbs={breadcrumbs}
          variant="both"
        />
        
        <div className="container mx-auto px-4 py-16 max-w-6xl">
          {!showSignup ? (
            // Gate screen
            <Card className="max-w-2xl mx-auto border-2">
              <CardHeader className="text-center pb-8">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold">Visual Policy Editor</CardTitle>
                <CardDescription className="text-lg mt-4">
                  Create complex trust policies with our revolutionary drag-and-drop editor.
                  No coding required.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Intuitive Visual Interface</p>
                      <p className="text-sm text-muted-foreground">Build policies with drag-and-drop nodes</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Real-time Validation</p>
                      <p className="text-sm text-muted-foreground">Instant feedback on policy correctness</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Enterprise Templates</p>
                      <p className="text-sm text-muted-foreground">Pre-built policies for common scenarios</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 space-y-4">
                  <Button 
                    size="lg" 
                    className="w-full"
                    onClick={() => setShowSignup(true)}
                  >
                    Get Free Access
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full"
                    onClick={() => router.push('/contact')}
                  >
                    Request Enterprise Demo
                  </Button>
                </div>
                
                <p className="text-center text-sm text-muted-foreground">
                  No credit card required • Free developer access
                </p>
              </CardContent>
            </Card>
          ) : (
            // Signup form
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Access Visual Policy Editor</CardTitle>
                <CardDescription>
                  Get instant access to create and test policies
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
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Access...' : 'Get Access'}
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    By signing up, you agree to our Terms of Service and Privacy Policy
                  </p>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  // Authenticated view - show the actual editor
  return (
    <div className="min-h-screen bg-background">
      <Subnav 
        tabs={policyTabs} 
        breadcrumbs={breadcrumbs}
        variant="both"
      />
      {/* Add bottom padding so the footer doesn't overlap the canvas */}
      <div className="pb-40">
        <VisualPolicyEditor />
      </div>
    </div>
  )
}