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
  Globe,
  Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — Agent Trust Protocol',
  description: 'OpenCore pricing: start free with open source; upgrade to Enterprise for production.'
}

export default function PricingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient - brand colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-atp-midnight via-atp-navy to-slate-900" />
      
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
          {/* Header */}
          <div className="text-center mb-12 lg:mb-16">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extralight mb-6 animate-fade-in-up">
              <span className="atp-gradient-text">OpenCore Pricing</span>
            </h1>
            <p className="text-lg sm:text-xl text-foreground/80 mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in-up">
              Start with our <span className="atp-gradient-text font-medium">open source core</span> forever free, 
              upgrade to enterprise features when you need them.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 mb-8 animate-fade-in-up">
              <Badge className="glass text-sm px-4 py-2 atp-trust-high border border-green-500/20">
                <Github size={14} className="mr-2" />
                Open Source
              </Badge>
              <Badge className="glass text-sm px-4 py-2 atp-trust-verified border border-blue-500/20">
                <Award size={14} className="mr-2" />
                Apache 2.0 License
              </Badge>
            </div>
          </div>

          {/* Pricing Tiers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8 mb-16">
            
            {/* Open Source Core */}
            <Card className="glass border border-border/50 backdrop-blur-xl relative group hover:scale-105 transition-all duration-300">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <Badge className="atp-gradient-primary text-white px-4 py-2 shadow-lg">
                  <Star size={14} className="mr-2" />
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="text-center pt-16 pb-8">
                <div className="relative p-4 rounded-xl w-fit mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <div className="absolute inset-0 atp-gradient-primary rounded-xl opacity-90" />
                  <Github className="relative z-10 text-white" size={36} />
                </div>
                <CardTitle className="font-display text-2xl mb-3">Open Source Core</CardTitle>
                <CardDescription className="text-muted-foreground mb-6">
                  Complete ATP protocol implementation
                </CardDescription>
                <div className="text-center">
                  <div className="text-5xl font-bold atp-gradient-text mb-2">$0</div>
                  <div className="text-sm text-muted-foreground">Forever Free</div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Core ATP protocol</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">3-line SDK integration</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Quantum-safe cryptography</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">W3C DID/VC standards</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Basic trust scoring</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Up to 10 agents, 5K requests</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Self-hosted deployment</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Community support</span>
                  </div>
                </div>
                <Button asChild className="w-full bg-gradient-to-r from-[hsl(var(--atp-quantum))] to-[hsl(var(--atp-primary))] text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 h-14 px-8 text-lg font-semibold">
                  <a href="https://github.com/agent-trust-protocol/core" target="_blank" rel="noopener noreferrer">
                    <Download className="h-5 w-5 mr-3" />
                    Get Started Free
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Startup */}
            <Card className="glass border border-border/50 backdrop-blur-xl relative group hover:scale-105 transition-all duration-300">
              <CardHeader className="text-center pt-8 pb-6">
                <div className="relative p-3 rounded-xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl opacity-90" />
                  <Zap className="relative z-10 text-white" size={32} />
                </div>
                <CardTitle className="font-display text-xl mb-2">Startup</CardTitle>
                <CardDescription className="text-muted-foreground mb-4">
                  Growing teams and small businesses
                </CardDescription>
                <div className="text-center">
                  <div className="text-4xl font-bold atp-gradient-text mb-1">$250</div>
                  <div className="text-xs text-muted-foreground">per month ($3K/year)</div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 mb-6">
                  <div className="text-xs font-semibold text-green-400 uppercase mb-3 text-center">Everything in Open Source, plus:</div>
                  <div className="flex items-start gap-2">
                    <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">SaaS hosted platform</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Up to 25 agents, 25K requests</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Email support</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">5GB storage</span>
                  </div>
                </div>
                <Button asChild className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:scale-105 transition-all duration-300 h-12 text-sm font-semibold">
                  <Link href="/enterprise/contact">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Get Started
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Professional */}
            <Card className="glass border border-border/50 backdrop-blur-xl relative group hover:scale-105 transition-all duration-300">
              <CardHeader className="text-center pt-8 pb-6">
                <div className="relative p-3 rounded-xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl opacity-90" />
                  <Users className="relative z-10 text-white" size={32} />
                </div>
                <CardTitle className="font-display text-xl mb-2">Professional</CardTitle>
                <CardDescription className="text-muted-foreground mb-4">
                  Growing organizations & mid-market
                </CardDescription>
                <div className="text-center">
                  <div className="text-4xl font-bold atp-gradient-text mb-1">$1.5K</div>
                  <div className="text-xs text-muted-foreground">per month ($18K/year)</div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 mb-6">
                  <div className="text-xs font-semibold text-blue-400 uppercase mb-3 text-center">Everything in Startup, plus:</div>
                  <div className="flex items-start gap-2">
                    <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Up to 100 agents, 250K requests</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Advanced analytics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Priority support</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">50GB storage</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">Compliance frameworks</span>
                  </div>
                </div>
                <Button asChild className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:scale-105 transition-all duration-300 h-12 text-sm font-semibold">
                  <Link href="/enterprise/contact">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Get Started
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Enterprise Edition */}
            <Card className="glass border-2 border-cyan-500/30 backdrop-blur-xl relative scale-105 group hover:scale-110 transition-all duration-300 shadow-xl">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <Badge className="atp-gradient-secondary text-white px-4 py-2 shadow-lg">
                  <Building size={14} className="mr-2" />
                  Enterprise
                </Badge>
              </div>
              <CardHeader className="text-center pt-16 pb-8">
                <div className="relative p-4 rounded-xl w-fit mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <div className="absolute inset-0 atp-gradient-secondary rounded-xl opacity-90" />
                  <Building className="relative z-10 text-white" size={36} />
                </div>
                <CardTitle className="font-display text-2xl mb-3">Enterprise</CardTitle>
                <CardDescription className="text-muted-foreground mb-6">
                  Large organizations & Fortune 500
                </CardDescription>
                <div className="text-center">
                  <div className="text-5xl font-bold atp-gradient-text mb-2">$50K</div>
                  <div className="text-sm text-muted-foreground">per year minimum</div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4 mb-8">
                  <div className="text-xs font-semibold text-cyan-400 uppercase mb-4 text-center">Everything in Professional, plus:</div>
                  <div className="flex items-start gap-3">
                    <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Up to 1,000+ agents, 2.5M requests</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Enterprise SSO/SAML & RBAC</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">SOC2, HIPAA, GDPR compliance</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">High availability clustering</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Behavioral analytics with ML</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">24/7 dedicated support & SLA</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Custom integrations & services</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">30-day enterprise trial</span>
                  </div>
                </div>
                <Button asChild className="w-full bg-gradient-to-r from-[hsl(var(--atp-electric-cyan))] to-[hsl(var(--atp-electric-cyan-light))] text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 h-14 px-8 text-lg font-semibold">
                  <Link href="/enterprise/contact">
                    <ArrowRight className="h-5 w-5 mr-3" />
                    Start 30-Day Trial
                  </Link>
                </Button>
              </CardContent>
            </Card>

          </div>

          {/* Feature Comparison */}
          <div className="mb-16">
            <h2 className="font-display text-3xl lg:text-4xl font-light mb-12 text-center">
              <span className="atp-gradient-text">Feature Comparison</span>
            </h2>
            
            <Card className="glass border border-border/50 backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/20 bg-muted/5">
                      <th className="text-left p-6 font-semibold">Feature</th>
                      <th className="text-center p-6 font-semibold">Open Source</th>
                      <th className="text-center p-6 font-semibold">Enterprise</th>
                      <th className="text-center p-6 font-semibold">Cloud</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                      <td className="p-6 font-medium">ATP Protocol Core</td>
                      <td className="text-center p-6"><Check size={18} className="text-green-500 mx-auto" /></td>
                      <td className="text-center p-6"><Check size={18} className="text-green-500 mx-auto" /></td>
                      <td className="text-center p-6"><Check size={18} className="text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                      <td className="p-6 font-medium">Quantum-Safe Signatures</td>
                      <td className="text-center p-6"><Check size={18} className="text-green-500 mx-auto" /></td>
                      <td className="text-center p-6"><Check size={18} className="text-green-500 mx-auto" /></td>
                      <td className="text-center p-6"><Check size={18} className="text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                      <td className="p-6 font-medium">Basic Monitoring</td>
                      <td className="text-center p-6"><Check size={18} className="text-green-500 mx-auto" /></td>
                      <td className="text-center p-6"><Check size={18} className="text-green-500 mx-auto" /></td>
                      <td className="text-center p-6"><Check size={18} className="text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                      <td className="p-6 font-medium">Advanced Dashboard</td>
                      <td className="text-center p-6 text-muted-foreground">—</td>
                      <td className="text-center p-6 text-blue-500">In Dev</td>
                      <td className="text-center p-6 text-blue-500">In Dev</td>
                    </tr>
                    <tr className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                      <td className="p-6 font-medium">Enterprise SSO</td>
                      <td className="text-center p-6 text-muted-foreground">—</td>
                      <td className="text-center p-6"><Check size={18} className="text-green-500 mx-auto" /></td>
                      <td className="text-center p-6"><Check size={18} className="text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                      <td className="p-6 font-medium">Compliance Reporting</td>
                      <td className="text-center p-6 text-muted-foreground">—</td>
                      <td className="text-center p-6"><Check size={18} className="text-green-500 mx-auto" /></td>
                      <td className="text-center p-6"><Check size={18} className="text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                      <td className="p-6 font-medium">High Availability</td>
                      <td className="text-center p-6 text-muted-foreground">—</td>
                      <td className="text-center p-6"><Check size={18} className="text-green-500 mx-auto" /></td>
                      <td className="text-center p-6"><Check size={18} className="text-green-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                      <td className="p-6 font-medium">Priority Support</td>
                      <td className="text-center p-6 text-muted-foreground">Community</td>
                      <td className="text-center p-6">24/7</td>
                      <td className="text-center p-6">24/7</td>
                    </tr>
                    <tr className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                      <td className="p-6 font-medium">Deployment</td>
                      <td className="text-center p-6 text-muted-foreground">Self-hosted</td>
                      <td className="text-center p-6 text-muted-foreground">Self-hosted</td>
                      <td className="text-center p-6 text-cyan-400">Fully managed</td>
                    </tr>
                    <tr className="hover:bg-muted/5 transition-colors">
                      <td className="p-6 font-medium">SLA</td>
                      <td className="text-center p-6 text-muted-foreground">—</td>
                      <td className="text-center p-6">Custom</td>
                      <td className="text-center p-6 text-cyan-400">99.9%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* FAQ */}
          <div className="mb-16">
            <h2 className="font-display text-3xl lg:text-4xl font-light mb-12 text-center">
              <span className="atp-gradient-text">Frequently Asked Questions</span>
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass border border-border/50 backdrop-blur-xl hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Is the open source version really free?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Yes! The ATP core protocol is 100% open source under Apache 2.0 license. 
                    You get the complete quantum-safe agent security stack forever free.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glass border border-border/50 backdrop-blur-xl hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">What&apos;s the difference between Enterprise and Cloud?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Enterprise is self-hosted with advanced features. Cloud is our fully managed service 
                    with zero setup and global infrastructure.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glass border border-border/50 backdrop-blur-xl hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Can I migrate from open source to enterprise?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Absolutely! ATP is designed for seamless migration. Your data and configurations 
                    transfer directly to enterprise features.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glass border border-border/50 backdrop-blur-xl hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">When will ATP Cloud be available?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    ATP Cloud launches Q2 2025. Join our waitlist to get early access and 
                    participate in the beta program.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glass border border-border/50 backdrop-blur-xl hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Do you offer volume discounts?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Yes! We offer custom pricing for large deployments, multi-year contracts, 
                    and academic institutions. Contact our sales team.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glass border border-border/50 backdrop-blur-xl hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">What support is included?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Open source includes community support. Enterprise includes 24/7 priority support, 
                    professional services, and dedicated customer success.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glass border border-border/50 backdrop-blur-xl hover:scale-105 transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">How does the 30-day enterprise trial work?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Get full access to enterprise features for 30 days with dedicated onboarding support. 
                    No credit card required. Includes custom configuration for your environment.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center p-8 glass border border-border/30 backdrop-blur-xl rounded-2xl">
            <h2 className="font-display text-3xl lg:text-4xl font-light mb-4">
              <span className="atp-gradient-text">Ready to Secure Your Agents?</span>
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
                <Link href="/enterprise/contact">
                  <Building className="h-4 w-4 mr-2" />
                  Start Enterprise Trial
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}