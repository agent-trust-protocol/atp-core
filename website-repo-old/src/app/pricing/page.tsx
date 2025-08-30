import Link from "next/link"
import { 
  Check, 
  ArrowRight, 
  Building, 
  Users, 
  Zap, 
  Shield, 
  Award,
  Github,
  Cloud,
  Star,
  Download,
  Globe
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function PricingPage() {
  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extralight mb-6 animate-fade-in-up">
            OpenCore Pricing
          </h1>
          <p className="text-lg sm:text-xl text-foreground/80 mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in-up">
            Start with our <span className="atp-gradient-text font-medium">open source core</span> forever free, 
            upgrade to enterprise features when you need them.
          </p>
          <div className="flex items-center justify-center gap-4 mb-8 animate-fade-in-up">
            <Badge className="glass text-sm px-3 py-1 atp-trust-high border-0">
              <Github size={12} className="mr-1" />
              Open Source
            </Badge>
            <Badge className="glass text-sm px-3 py-1 atp-trust-verified border-0">
              <Award size={12} className="mr-1" />
              Apache 2.0 License
            </Badge>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          
          {/* Open Source Core */}
          <Card className="glass border-0 atp-trust-indicator relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="atp-gradient-primary text-white px-4 py-1">
                <Star size={12} className="mr-1" />
                Most Popular
              </Badge>
            </div>
            <CardHeader className="text-center pt-8">
              <div className="relative p-3 rounded-xl w-fit mx-auto mb-4">
                <div className="absolute inset-0 atp-gradient-primary rounded-xl opacity-90" />
                <Github className="relative z-10 text-white" size={32} />
              </div>
              <CardTitle className="font-display text-2xl">Open Source Core</CardTitle>
              <CardDescription className="text-foreground/70 mb-4">
                Complete ATP protocol implementation
              </CardDescription>
              <div className="text-center">
                <div className="text-4xl font-bold atp-gradient-text mb-2">$0</div>
                <div className="text-sm text-foreground/60">Forever Free</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Complete ATP protocol</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">3-line SDK integration</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Quantum-safe cryptography</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">W3C DID/VC standards</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Basic trust scoring</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Self-hosted deployment</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Community support</span>
                </div>
              </div>
              <Button asChild className="w-full atp-gradient-primary">
                <a href="https://github.com/agent-trust-protocol/core" target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Get Started Free
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise Edition */}
          <Card className="glass border-2 border-atp-electric-cyan/20 atp-trust-indicator relative scale-105">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="atp-gradient-secondary text-white px-4 py-1">
                <Building size={12} className="mr-1" />
                Enterprise
              </Badge>
            </div>
            <CardHeader className="text-center pt-8">
              <div className="relative p-3 rounded-xl w-fit mx-auto mb-4">
                <div className="absolute inset-0 atp-gradient-secondary rounded-xl opacity-90" />
                <Building className="relative z-10 text-white" size={32} />
              </div>
              <CardTitle className="font-display text-2xl">Enterprise Edition</CardTitle>
              <CardDescription className="text-foreground/70 mb-4">
                Advanced features for production deployment
              </CardDescription>
              <div className="text-center">
                <div className="text-4xl font-bold atp-gradient-text mb-2">$25K</div>
                <div className="text-sm text-foreground/60">per year, per organization</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                <div className="text-xs font-semibold text-atp-electric-cyan uppercase mb-2">Everything in Open Source, plus:</div>
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Advanced monitoring dashboard</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Enterprise SSO & RBAC</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Compliance reporting (SOC 2, HIPAA)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">High availability clustering</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">24/7 priority support</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Custom integrations</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Professional services</span>
                </div>
              </div>
              <Button asChild className="w-full atp-gradient-secondary">
                <Link href="/dashboard">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Contact Sales
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* ATP Cloud */}
          <Card className="glass border-0 atp-trust-indicator">
            <CardHeader className="text-center">
              <div className="relative p-3 rounded-xl w-fit mx-auto mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl opacity-90" />
                <Cloud className="relative z-10 text-white" size={32} />
              </div>
              <CardTitle className="font-display text-2xl">ATP Cloud</CardTitle>
              <CardDescription className="text-foreground/70 mb-4">
                Hosted quantum-safe agent infrastructure
              </CardDescription>
              <div className="text-center">
                <div className="text-4xl font-bold atp-gradient-text mb-2">$0.50</div>
                <div className="text-sm text-foreground/60">per agent per month</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-6">
                <div className="text-xs font-semibold text-purple-400 uppercase mb-2">Coming Q2 2025:</div>
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Zero setup deployment</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Global edge network</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Automatic scaling</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Built-in compliance</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">99.9% SLA guarantee</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Free tier: 100 agents</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Pay-as-you-scale</span>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full glass border-purple-500/30 hover:bg-purple-500/10">
                <Link href="/dashboard">
                  <Globe className="h-4 w-4 mr-2" />
                  Join Waitlist
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature Comparison */}
        <div className="mb-16">
          <h2 className="font-display text-3xl lg:text-4xl font-light mb-8 text-center atp-gradient-text">
            Feature Comparison
          </h2>
          
          <div className="glass rounded-lg border-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 font-medium">Feature</th>
                    <th className="text-center p-4 font-medium">Open Source</th>
                    <th className="text-center p-4 font-medium">Enterprise</th>
                    <th className="text-center p-4 font-medium">Cloud</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-white/5">
                    <td className="p-4">ATP Protocol Core</td>
                    <td className="text-center p-4"><Check size={16} className="text-green-500 mx-auto" /></td>
                    <td className="text-center p-4"><Check size={16} className="text-green-500 mx-auto" /></td>
                    <td className="text-center p-4"><Check size={16} className="text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4">Quantum-Safe Signatures</td>
                    <td className="text-center p-4"><Check size={16} className="text-green-500 mx-auto" /></td>
                    <td className="text-center p-4"><Check size={16} className="text-green-500 mx-auto" /></td>
                    <td className="text-center p-4"><Check size={16} className="text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4">Basic Monitoring</td>
                    <td className="text-center p-4"><Check size={16} className="text-green-500 mx-auto" /></td>
                    <td className="text-center p-4"><Check size={16} className="text-green-500 mx-auto" /></td>
                    <td className="text-center p-4"><Check size={16} className="text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4">Advanced Dashboard</td>
                    <td className="text-center p-4 text-foreground/40">—</td>
                    <td className="text-center p-4"><Check size={16} className="text-green-500 mx-auto" /></td>
                    <td className="text-center p-4"><Check size={16} className="text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4">Enterprise SSO</td>
                    <td className="text-center p-4 text-foreground/40">—</td>
                    <td className="text-center p-4"><Check size={16} className="text-green-500 mx-auto" /></td>
                    <td className="text-center p-4"><Check size={16} className="text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4">Compliance Reporting</td>
                    <td className="text-center p-4 text-foreground/40">—</td>
                    <td className="text-center p-4"><Check size={16} className="text-green-500 mx-auto" /></td>
                    <td className="text-center p-4"><Check size={16} className="text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4">High Availability</td>
                    <td className="text-center p-4 text-foreground/40">—</td>
                    <td className="text-center p-4"><Check size={16} className="text-green-500 mx-auto" /></td>
                    <td className="text-center p-4"><Check size={16} className="text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4">Priority Support</td>
                    <td className="text-center p-4 text-foreground/40">Community</td>
                    <td className="text-center p-4">24/7</td>
                    <td className="text-center p-4">24/7</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="p-4">Deployment</td>
                    <td className="text-center p-4 text-foreground/60">Self-hosted</td>
                    <td className="text-center p-4 text-foreground/60">Self-hosted</td>
                    <td className="text-center p-4 text-atp-electric-cyan">Fully managed</td>
                  </tr>
                  <tr>
                    <td className="p-4">SLA</td>
                    <td className="text-center p-4 text-foreground/40">—</td>
                    <td className="text-center p-4 text-foreground/60">Custom</td>
                    <td className="text-center p-4 text-atp-electric-cyan">99.9%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="font-display text-3xl lg:text-4xl font-light mb-8 text-center atp-gradient-text">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="text-lg">Is the open source version really free?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70">
                  Yes! The ATP core protocol is 100% open source under Apache 2.0 license. 
                  You get the complete quantum-safe agent security stack forever free.
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="text-lg">What's the difference between Enterprise and Cloud?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70">
                  Enterprise is self-hosted with advanced features. Cloud is our fully managed service 
                  with zero setup and global infrastructure.
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="text-lg">Can I migrate from open source to enterprise?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70">
                  Absolutely! ATP is designed for seamless migration. Your data and configurations 
                  transfer directly to enterprise features.
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="text-lg">When will ATP Cloud be available?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70">
                  ATP Cloud launches Q2 2025. Join our waitlist to get early access and 
                  participate in the beta program.
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="text-lg">Do you offer volume discounts?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70">
                  Yes! We offer custom pricing for large deployments, multi-year contracts, 
                  and academic institutions. Contact our sales team.
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="text-lg">What support is included?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70">
                  Open source includes community support. Enterprise includes 24/7 priority support, 
                  professional services, and dedicated customer success.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-8 glass-intense rounded-2xl border-0 atp-quantum-glow">
          <h2 className="font-display text-3xl lg:text-4xl font-light mb-4 atp-gradient-text">
            Ready to Secure Your Agents?
          </h2>
          <p className="text-lg mb-8 text-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Start with open source today, upgrade when you need enterprise features
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="atp-gradient-primary hover:scale-105 transition-all duration-300">
              <a href="https://github.com/agent-trust-protocol/core" target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Start Free
              </a>
            </Button>
            <Button asChild size="lg" className="atp-gradient-secondary hover:scale-105 transition-all duration-300">
              <Link href="/dashboard">
                <Building className="h-4 w-4 mr-2" />
                Contact Sales
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}