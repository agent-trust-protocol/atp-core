import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Building, 
  Users, 
  Calendar, 
  Shield, 
  CheckCircle,
  ArrowLeft,
  Mail,
  Phone,
  Globe
} from "lucide-react"
import Link from "next/link"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Enterprise Contact — Agent Trust Protocol',
  description: 'Get in touch with our enterprise sales team for quantum-safe AI security solutions.'
}

export default function EnterpriseContactPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-atp-midnight via-atp-navy to-slate-900" />
      
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8">
            <Link href="/enterprise" className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors">
              <ArrowLeft size={16} />
              <span className="text-sm">Back to Enterprise</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <div className="mb-8">
                <h1 className="font-display text-4xl sm:text-5xl font-extralight mb-4 animate-fade-in-up">
                  <span className="atp-gradient-text">Let's Talk Enterprise</span>
                </h1>
                <p className="text-lg text-foreground/80 leading-relaxed">
                  Schedule a personalized demo and discover how ATP Enterprise can secure your AI agent infrastructure.
                </p>
              </div>

              <Card className="glass border border-border/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Request Enterprise Demo
                  </CardTitle>
                  <CardDescription>
                    Our enterprise specialists will contact you within 24 hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form action="/api/enterprise/contact" method="POST" className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          required
                          placeholder="John"
                          className="glass"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          required
                          placeholder="Smith"
                          className="glass"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Business Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="john.smith@company.com"
                        className="glass"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        className="glass"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company Name *</Label>
                        <Input
                          id="company"
                          name="company"
                          required
                          placeholder="Acme Corporation"
                          className="glass"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jobTitle">Job Title *</Label>
                        <Input
                          id="jobTitle"
                          name="jobTitle"
                          required
                          placeholder="CTO"
                          className="glass"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companySize">Company Size *</Label>
                        <select
                          id="companySize"
                          name="companySize"
                          required
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 glass"
                        >
                          <option value="">Select company size</option>
                          <option value="1-10">1-10 employees</option>
                          <option value="11-50">11-50 employees</option>
                          <option value="51-200">51-200 employees</option>
                          <option value="201-1000">201-1000 employees</option>
                          <option value="1000+">1000+ employees</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry *</Label>
                        <select
                          id="industry"
                          name="industry"
                          required
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 glass"
                        >
                          <option value="">Select industry</option>
                          <option value="financial-services">Financial Services</option>
                          <option value="healthcare">Healthcare</option>
                          <option value="manufacturing">Manufacturing</option>
                          <option value="technology">Technology</option>
                          <option value="government">Government</option>
                          <option value="education">Education</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="useCase">Primary Use Case *</Label>
                      <select
                        id="useCase"
                        name="useCase"
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 glass"
                      >
                        <option value="">Select primary use case</option>
                        <option value="ai-agent-security">AI Agent Security</option>
                        <option value="multi-party-collaboration">Multi-Party Collaboration</option>
                        <option value="compliance-automation">Compliance Automation</option>
                        <option value="quantum-safe-migration">Quantum-Safe Migration</option>
                        <option value="custom-integration">Custom Integration</option>
                        <option value="evaluation">General Evaluation</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="agentCount">Expected Number of Agents</Label>
                      <select
                        id="agentCount"
                        name="agentCount"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 glass"
                      >
                        <option value="">Select agent count</option>
                        <option value="10-50">10-50 agents</option>
                        <option value="51-200">51-200 agents</option>
                        <option value="201-1000">201-1000 agents</option>
                        <option value="1000+">1000+ agents</option>
                        <option value="unknown">Not sure yet</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeline">Implementation Timeline</Label>
                      <select
                        id="timeline"
                        name="timeline"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 glass"
                      >
                        <option value="">Select timeline</option>
                        <option value="immediate">Immediate (within 30 days)</option>
                        <option value="3-months">3 months</option>
                        <option value="6-months">6 months</option>
                        <option value="12-months">12 months</option>
                        <option value="evaluating">Just evaluating</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Additional Information</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Tell us about your specific security requirements, compliance needs, or any questions you have..."
                        rows={4}
                        className="glass"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <input type="checkbox" id="consent" name="consent" required className="mt-1" />
                        <Label htmlFor="consent" className="text-sm text-foreground/70 leading-relaxed">
                          I agree to receive communications from Agent Trust Protocol regarding enterprise solutions. 
                          We respect your privacy and will never share your information.
                        </Label>
                      </div>

                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full bg-gradient-to-r from-[hsl(var(--atp-quantum))] to-[hsl(var(--atp-primary))] text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 h-14 text-lg font-semibold"
                      >
                        <Calendar className="h-5 w-5 mr-3" />
                        Request Enterprise Demo
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information & Benefits */}
            <div className="space-y-8">
              {/* Contact Methods */}
              <Card className="glass border border-border/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Get in Touch</CardTitle>
                  <CardDescription>
                    Multiple ways to connect with our enterprise team
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Mail size={18} className="text-white" />
                    </div>
                    <div>
                      <div className="font-medium">Email</div>
                      <div className="text-sm text-foreground/70">enterprise@agenttrust.org</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <Phone size={18} className="text-white" />
                    </div>
                    <div>
                      <div className="font-medium">Phone</div>
                      <div className="text-sm text-foreground/70">+1 (555) ATP-SAFE</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Globe size={18} className="text-white" />
                    </div>
                    <div>
                      <div className="font-medium">Business Hours</div>
                      <div className="text-sm text-foreground/70">Mon-Fri 9AM-6PM EST</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* What to Expect */}
              <Card className="glass border border-border/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>What to Expect</CardTitle>
                  <CardDescription>
                    Your path to quantum-safe AI security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm font-semibold text-blue-500">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Initial Consultation</h4>
                      <p className="text-sm text-foreground/70">
                        15-minute call to understand your security requirements and use cases
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm font-semibold text-green-500">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Personalized Demo</h4>
                      <p className="text-sm text-foreground/70">
                        45-minute technical demonstration tailored to your specific industry and needs
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm font-semibold text-purple-500">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Proof of Concept</h4>
                      <p className="text-sm text-foreground/70">
                        30-day enterprise trial with dedicated support and custom configuration
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enterprise Benefits */}
              <Card className="glass border border-border/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Enterprise Benefits</CardTitle>
                  <CardDescription>
                    Why leading organizations choose ATP
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm">Quantum-safe security future-proofing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm">SOC 2 Type II compliance certification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm">24/7 enterprise support with 99.9% SLA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm">Custom integrations and professional services</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm">High availability multi-region deployment</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}