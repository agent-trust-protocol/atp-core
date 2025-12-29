'use client'

import { useState } from 'react'
import {
  Cloud,
  Shield,
  Zap,
  BarChart3,
  Users,
  ArrowRight,
  CheckCircle,
  Globe,
  Lock,
  Building,
  Mail,
  Phone,
  User
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface CloudAccessGateProps {
  feature?: string
  tier?: string
}

export function CloudAccessGate({ feature = "cloud-platform", tier = "startup" }: CloudAccessGateProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    useCase: '',
    agents: '',
    timeline: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/cloud/access-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to submit request. Please try again.')
      }
    } catch (err) {
      console.error('Cloud access request error:', err)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full glass border">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Request Submitted Successfully!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for your interest in ATP Cloud Platform. Our enterprise team will review your request and contact you within 1-2 business days to discuss your specific requirements and provide access credentials.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Priority review for enterprise inquiries</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Custom deployment consultation included</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>14-day free trial with full features</span>
              </div>
            </div>
            <Button className="mt-6" asChild>
              <a href="/">Return to Homepage</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center space-y-6 mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-lg glass border">
              <Cloud className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold atp-gradient-text">ATP™ Cloud Platform</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Enterprise-grade multi-tenant Agent Trust Protocol platform with quantum-safe security,
            advanced analytics, and global infrastructure. Request access to our private beta.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 px-4 py-2">
              <Shield size={16} className="mr-2" />
              Quantum-Safe Security
            </Badge>
            <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-4 py-2">
              <Globe size={16} className="mr-2" />
              Global Infrastructure
            </Badge>
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 px-4 py-2">
              <BarChart3 size={16} className="mr-2" />
              Advanced Analytics
            </Badge>
            <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 px-4 py-2">
              <Lock size={16} className="mr-2" />
              Enterprise Security
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Features */}
          <div className="space-y-8">
            <Card className="glass border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-primary" />
                  Platform Capabilities
                </CardTitle>
                <CardDescription>
                  Production-ready features for enterprise agent ecosystems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-medium">Multi-Tenant Architecture</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="font-medium">Quantum-Safe Cryptography</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <span className="font-medium">Real-time Analytics</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      <span className="font-medium">Global Load Balancing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      <span className="font-medium">SOC 2 Compliance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="font-medium">99.9% Uptime SLA</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Enterprise Benefits
                </CardTitle>
                <CardDescription>
                  Advanced features and support for production deployments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Dedicated Infrastructure</div>
                      <div className="text-sm text-muted-foreground">Isolated tenants with dedicated resources and custom configurations</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium">24/7 Expert Support</div>
                      <div className="text-sm text-muted-foreground">Direct access to ATP engineers and priority incident response</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Custom Integrations</div>
                      <div className="text-sm text-muted-foreground">API customizations and integration with existing enterprise systems</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Advanced Compliance</div>
                      <div className="text-sm text-muted-foreground">GDPR, HIPAA, and industry-specific compliance frameworks</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Lead Generation Form */}
          <Card className="glass border sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Request Enterprise Access
              </CardTitle>
              <CardDescription>
                Get priority access to ATP Cloud Platform with a personalized consultation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Business Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company *</Label>
                    <Input
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      required
                      placeholder="Your company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agents">Number of Agents Expected</Label>
                  <select
                    id="agents"
                    name="agents"
                    value={formData.agents}
                    onChange={handleChange}
                    className="w-full p-2 border border-input bg-background rounded-md"
                  >
                    <option value="">Select range</option>
                    <option value="1-10">1-10 agents</option>
                    <option value="11-50">11-50 agents</option>
                    <option value="51-200">51-200 agents</option>
                    <option value="201-1000">201-1000 agents</option>
                    <option value="1000+">1000+ agents</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeline">Deployment Timeline</Label>
                  <select
                    id="timeline"
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleChange}
                    className="w-full p-2 border border-input bg-background rounded-md"
                  >
                    <option value="">Select timeline</option>
                    <option value="immediate">Immediate (within 30 days)</option>
                    <option value="quarter">This quarter (1-3 months)</option>
                    <option value="half-year">Next 6 months</option>
                    <option value="exploring">Still exploring options</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="useCase">Primary Use Case *</Label>
                  <Textarea
                    id="useCase"
                    name="useCase"
                    value={formData.useCase}
                    onChange={handleChange}
                    required
                    placeholder="Describe your primary use case for agent trust management, security requirements, and expected scale..."
                    rows={3}
                  />
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <Shield className="h-4 w-4 text-green-500 mt-0.5" />
                    <span className="text-sm font-medium">What you'll get:</span>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground ml-6">
                    <div>• Priority review within 24 hours</div>
                    <div>• Custom security assessment</div>
                    <div>• 14-day free trial with full features</div>
                    <div>• Dedicated solution architect consultation</div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>Processing Request...</>
                  ) : (
                    <>
                      Request Enterprise Access
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By submitting this form, you agree to our privacy policy and terms of service.
                  We'll only use your information to process your access request and provide relevant updates.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}