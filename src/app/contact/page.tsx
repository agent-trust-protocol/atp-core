import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Shield, Zap, Target } from "lucide-react"

export const metadata: Metadata = {
  title: 'Contact Us - Agent Trust Protocol™',
  description: 'Get in touch with the Agent Trust Protocol team for enterprise inquiries, technical support, or partnership opportunities.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extralight mb-4 atp-gradient-text">
            Contact Us
          </h1>
          <p className="text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Ready to secure your AI agents with quantum-safe technology? Let's discuss how Agent Trust Protocol™ can transform your security posture.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Contact Form */}
          <Card className="glass border border-border/50 backdrop-blur-xl hover:shadow-2xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Send us a message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input id="firstName" placeholder="John" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input id="lastName" placeholder="Doe" required />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="john.doe@company.com" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" placeholder="Your Company Inc." />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="inquiryType">Inquiry Type</Label>
                <select 
                  id="inquiryType" 
                  name="inquiryType"
                  aria-label="Select inquiry type"
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Select an option</option>
                  <option value="enterprise">Enterprise Sales</option>
                  <option value="technical">Technical Support</option>
                  <option value="partnership">Partnership</option>
                  <option value="demo">Request Demo</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea 
                  id="message" 
                  placeholder="Tell us about your AI security needs, deployment plans, or any questions you have..."
                  rows={4}
                  required
                />
              </div>
              
              <Button className="w-full bg-gradient-to-r from-[hsl(var(--atp-quantum))] to-[hsl(var(--atp-primary))] text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 h-14 px-8 text-lg font-semibold">
                Send Message
              </Button>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            {/* Enterprise Sales */}
            <Card className="glass border border-border/50 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2">
                  <Badge variant="default" className="bg-[hsl(var(--atp-primary))]">Enterprise</Badge>
                  <span>Sales & Partnerships</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Ready to deploy quantum-safe AI security at scale? Our enterprise team is here to help.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Email:</span>
                    <a href="mailto:enterprise@agenttrustprotocol.com" className="text-blue-600 hover:underline text-sm">
                      enterprise@agenttrustprotocol.com
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Response Time:</span>
                    <span className="text-sm text-muted-foreground">Within 4 hours</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full border-2 border-atp-electric-cyan/30 hover:bg-atp-electric-cyan/10 hover:border-atp-electric-cyan/50 hover:scale-105 transition-all duration-300 h-12 px-6 text-base font-medium">
                  Schedule Enterprise Demo
                </Button>
              </CardContent>
            </Card>

            {/* Technical Support */}
            <Card className="glass border border-border/50 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2">
                  <Badge variant="secondary">Technical</Badge>
                  <span>Developer Support</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Need help integrating ATP™ into your applications? Our technical team provides comprehensive support.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Email:</span>
                    <a href="mailto:support@agenttrustprotocol.com" className="text-blue-600 hover:underline text-sm">
                      support@agenttrustprotocol.com
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Response Time:</span>
                    <span className="text-sm text-muted-foreground">Within 24 hours</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full border-2 border-atp-electric-cyan/30 hover:bg-atp-electric-cyan/10 hover:border-atp-electric-cyan/50 hover:scale-105 transition-all duration-300 h-12 px-6 text-base font-medium">
                  View Documentation
                </Button>
              </CardContent>
            </Card>

            {/* Office Hours */}
            <Card className="glass border border-border/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle>Office Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Monday - Friday:</span>
                    <span>9:00 AM - 6:00 PM PST</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday:</span>
                    <span>10:00 AM - 2:00 PM PST</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday:</span>
                    <span>Closed</span>
                  </div>
                </div>
                <Separator className="my-4" />
                <p className="text-xs text-muted-foreground">
                  For urgent enterprise matters, contact our 24/7 emergency line
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Why Choose (aligned with home/enterprise cards) */}
        <div className="mt-16 text-center">
          <h2 className="font-display text-3xl lg:text-4xl font-light mb-8 atp-gradient-text">Why choose Agent Trust Protocol™?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            <Card className="glass atp-trust-indicator hover:scale-105 transition-all duration-300 border-0 h-full">
              <CardHeader className="pt-6">
                <div className="relative p-3 rounded-xl w-fit mb-4 mx-auto">
                  <div className="absolute inset-0 atp-gradient-primary rounded-xl opacity-90" />
                  <Shield className="relative z-10 text-white" size={24} />
                </div>
                <CardTitle className="font-display text-xl mb-2">Quantum-Safe Security</CardTitle>
                <CardDescription className="text-foreground/70">
                  Future-proof cryptography that resists quantum attacks
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass atp-trust-indicator hover:scale-105 transition-all duration-300 border-0 h-full">
              <CardHeader className="pt-6">
                <div className="relative p-3 rounded-xl w-fit mb-4 mx-auto">
                  <div className="absolute inset-0 atp-gradient-secondary rounded-xl opacity-90" />
                  <Zap className="relative z-10 text-white" size={24} />
                </div>
                <CardTitle className="font-display text-xl mb-2">Enterprise Ready</CardTitle>
                <CardDescription className="text-foreground/70">
                  Built for scale with enterprise-grade features and support
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass atp-trust-indicator hover:scale-105 transition-all duration-300 border-0 h-full">
              <CardHeader className="pt-6">
                <div className="relative p-3 rounded-xl w-fit mb-4 mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl opacity-90" />
                  <Target className="relative z-10 text-white" size={24} />
                </div>
                <CardTitle className="font-display text-xl mb-2">Visual Policy Editor</CardTitle>
                <CardDescription className="text-foreground/70">
                  Drag-and-drop interface for non-technical users
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
