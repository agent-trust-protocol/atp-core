import Link from "next/link"
import { 
  Target, 
  TrendingUp, 
  Users, 
  Building, 
  GraduationCap,
  DollarSign,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  BarChart3,
  Clock,
  Award,
  Star,
  FileText,
  Video,
  MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QuantumShieldIcon, TrustNetworkIcon, QuantumKeyIcon } from "@/components/ui/atp-icons"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sales Guide — Agent Trust Protocol',
  description: 'Internal sales and promotion guide for ATP: key selling points, target audiences, pricing justification, and competitive advantages.',
  keywords: [
    'ATP sales guide',
    'quantum-safe selling points',
    'enterprise sales',
    'developer marketing',
    'competitive advantages',
    'pricing strategy',
    'ROI calculations',
    'sales objections'
  ],
}

export default function SalesGuidePage() {
  return (
    <div className="min-h-screen relative">
      {/* Warning Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2 text-amber-400 text-sm">
            <Info size={16} />
            <span className="font-medium">Internal Use Only:</span>
            <span>This sales guide is for ATP team members and authorized partners</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="flex items-center justify-center mb-6 animate-fade-in-up">
            <div className="relative w-20 h-20 mb-4 atp-quantum-glow rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Target size={40} className="text-primary animate-in zoom-in-50 duration-1000" />
            </div>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extralight mb-6 animate-fade-in-up">
            <span className="atp-gradient-text">Sales & Promotion Guide</span>
          </h1>
          <p className="text-lg sm:text-xl text-foreground/80 mb-8 max-w-4xl mx-auto leading-relaxed animate-fade-in-up">
            Complete sales toolkit for promoting <span className="atp-gradient-text font-medium">Agent Trust Protocol</span> 
            with key selling points, target audiences, and competitive strategies.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8 animate-fade-in-up">
            <Badge className="glass text-sm px-4 py-2 atp-trust-high border-0">
              <Target size={14} className="mr-2" />
              Sales Strategy
            </Badge>
            <Badge className="glass text-sm px-4 py-2 atp-trust-verified border-0">
              <TrendingUp size={14} className="mr-2" />
              Market Analysis
            </Badge>
            <Badge className="glass text-sm px-4 py-2 atp-trust-enterprise border-0">
              <DollarSign size={14} className="mr-2" />
              ROI Justification
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="selling-points" className="space-y-8">
          <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-2 lg:grid-cols-6 glass border-0">
            <TabsTrigger value="selling-points" className="text-xs sm:text-sm">Key Points</TabsTrigger>
            <TabsTrigger value="audiences" className="text-xs sm:text-sm">Target Audiences</TabsTrigger>
            <TabsTrigger value="pricing" className="text-xs sm:text-sm">Pricing</TabsTrigger>
            <TabsTrigger value="competitive" className="text-xs sm:text-sm">Competition</TabsTrigger>
            <TabsTrigger value="objections" className="text-xs sm:text-sm">Objections</TabsTrigger>
            <TabsTrigger value="demo" className="text-xs sm:text-sm">Demo Guide</TabsTrigger>
          </TabsList>

          {/* Key Selling Points */}
          <TabsContent value="selling-points" className="space-y-8">
            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <Star className="text-primary" size={24} />
                  Core Value Propositions
                </CardTitle>
                <CardDescription>Primary selling points that differentiate ATP in the market</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <h4 className="font-medium text-primary mb-3 flex items-center gap-2">
                        <QuantumShieldIcon size={20} className="text-primary" />
                        World's First Quantum-Safe AI Protocol
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        The only AI agent security protocol designed specifically for the post-quantum era, 
                        providing future-proof security when quantum computers threaten current cryptography.
                      </p>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="text-green-400" size={12} />
                          <span>NIST-approved Dilithium signatures</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="text-green-400" size={12} />
                          <span>Ed25519 + Dilithium hybrid approach</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="text-green-400" size={12} />
                          <span>Protection against quantum attacks</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-secondary/5 border border-secondary/20">
                      <h4 className="font-medium text-secondary mb-3 flex items-center gap-2">
                        <Clock size={20} className="text-secondary" />
                        First-Mover Advantage
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Be prepared for quantum threats before they materialize. Industry experts predict 
                        cryptographically relevant quantum computers by 2030-2040.
                      </p>
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3">
                        <div className="text-xs text-amber-300 font-medium">Market Timing:</div>
                        <div className="text-xs text-amber-300/90">Organizations adopting quantum-safe solutions now gain 5-10 year security advantage</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                      <h4 className="font-medium text-green-400 mb-3 flex items-center gap-2">
                        <Zap size={20} className="text-green-400" />
                        Enterprise-Ready from Day One
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Unlike academic research projects, ATP is built for production with enterprise 
                        features, compliance, and 24/7 support from day one.
                      </p>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="text-green-400" size={12} />
                          <span>SOC 2, ISO 27001, HIPAA compliance</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="text-green-400" size={12} />
                          <span>Multi-tenant architecture</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="text-green-400" size={12} />
                          <span>Comprehensive audit logging</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <h4 className="font-medium text-blue-400 mb-3 flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-400" />
                        Developer Experience Excellence
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Quantum-safe security doesn't mean complex implementation. ATP provides 
                        simple SDKs, clear documentation, and seamless integration.
                      </p>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
                        <div className="text-xs text-blue-300 font-medium">Integration Time:</div>
                        <div className="text-xs text-blue-300/90">Most teams integrate ATP in under 2 hours vs weeks for alternatives</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <Shield className="text-purple-400" size={20} />
                    </div>
                    <CardTitle className="font-display text-lg">Risk Mitigation</CardTitle>
                  </div>
                  <CardDescription>Proactive security investment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    "The cost of implementing quantum-safe security today is far less than 
                    the cost of a quantum attack tomorrow."
                  </p>
                  <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                    <div className="text-xs text-red-400 font-medium">Risk Without ATP:</div>
                    <div className="text-xs text-red-400/90">Complete cryptographic failure, data breaches, compliance violations</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                      <Award className="text-green-400" size={20} />
                    </div>
                    <CardTitle className="font-display text-lg">Competitive Edge</CardTitle>
                  </div>
                  <CardDescription>Market differentiation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    "Be the first in your industry to offer quantum-safe AI services, 
                    attracting security-conscious customers."
                  </p>
                  <div className="bg-green-500/10 border border-green-500/20 rounded p-3">
                    <div className="text-xs text-green-400 font-medium">Market Position:</div>
                    <div className="text-xs text-green-400/90">Premium pricing for quantum-safe services, win enterprise deals</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <Globe className="text-amber-400" size={20} />
                    </div>
                    <CardTitle className="font-display text-lg">Future-Proof Investment</CardTitle>
                  </div>
                  <CardDescription>Long-term technology strategy</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    "ATP grows with your needs - from prototype to global scale, 
                    with consistent quantum-safe security."
                  </p>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3">
                    <div className="text-xs text-amber-400 font-medium">Technology Roadmap:</div>
                    <div className="text-xs text-amber-400/90">Continuous updates as quantum computing advances</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Target Audiences */}
          <TabsContent value="audiences" className="space-y-8">
            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <Users className="text-primary" size={24} />
                  Primary Target Segments
                </CardTitle>
                <CardDescription>Key audience segments with tailored value propositions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="p-6 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                          <Building size={24} className="text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-blue-400 text-lg">Enterprise Organizations</h3>
                          <p className="text-xs text-muted-foreground">Fortune 500, Government, Financial Services</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Key Pain Points:</h4>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div>• Regulatory compliance requirements (SOC 2, HIPAA, GDPR)</div>
                            <div>• Risk of quantum computing threats to existing infrastructure</div>
                            <div>• Need for audit trails and accountability in AI systems</div>
                            <div>• Multi-tenant security and data isolation requirements</div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm mb-2">ATP Value Proposition:</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="text-green-400" size={12} />
                              <span>Enterprise-grade compliance and audit logging</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="text-green-400" size={12} />
                              <span>Future-proof quantum-safe security architecture</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="text-green-400" size={12} />
                              <span>24/7 enterprise support and SLA guarantees</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="text-green-400" size={12} />
                              <span>Seamless integration with existing enterprise systems</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm mb-2">Decision Makers:</h4>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">CISO</Badge>
                            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">CTO</Badge>
                            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">Compliance Officer</Badge>
                            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">Enterprise Architect</Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-lg bg-green-500/5 border border-green-500/20">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                          <Users size={24} className="text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-green-400 text-lg">AI/ML Development Teams</h3>
                          <p className="text-xs text-muted-foreground">Startups, Scale-ups, AI Companies</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Key Pain Points:</h4>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div>• Complex security implementation slowing development</div>
                            <div>• Difficulty attracting enterprise customers without security</div>
                            <div>• Technical debt from inadequate security foundations</div>
                            <div>• Limited security expertise on development teams</div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm mb-2">ATP Value Proposition:</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="text-green-400" size={12} />
                              <span>Simple SDK integration in under 2 hours</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="text-green-400" size={12} />
                              <span>Enterprise-ready security without security expertise</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="text-green-400" size={12} />
                              <span>Competitive advantage with quantum-safe marketing</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="text-green-400" size={12} />
                              <span>Scale from development to production seamlessly</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm mb-2">Decision Makers:</h4>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">Lead Developer</Badge>
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">Tech Lead</Badge>
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">Founder/CTO</Badge>
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">Product Manager</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-lg bg-purple-500/5 border border-purple-500/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <GraduationCap size={24} className="text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-purple-400 text-lg">Research & Academic Institutions</h3>
                        <p className="text-xs text-muted-foreground">Universities, Research Labs, Think Tanks</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Key Pain Points:</h4>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div>• Need cutting-edge technology for research credibility</div>
                          <div>• Collaboration security between institutions</div>
                          <div>• Grant requirements for innovative security research</div>
                          <div>• Publication and IP protection concerns</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">ATP Value Proposition:</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="text-green-400" size={12} />
                            <span>Cutting-edge quantum-safe technology</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="text-green-400" size={12} />
                            <span>Academic licensing and collaboration features</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="text-green-400" size={12} />
                            <span>Open source foundation with enterprise extensions</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="text-green-400" size={12} />
                            <span>Research publication opportunities</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-sm mb-2">Decision Makers:</h4>
                        <div className="flex flex-wrap gap-2">
                          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs">Principal Investigator</Badge>
                          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs">Research Director</Badge>
                          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs">IT Security</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Justification */}
          <TabsContent value="pricing" className="space-y-8">
            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <DollarSign className="text-primary" size={24} />
                  Pricing Strategy & ROI Justification
                </CardTitle>
                <CardDescription>Value-based pricing model with clear ROI calculations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="border border-green-500/20 bg-green-500/5">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-green-400">Open Source Core</CardTitle>
                          <Badge className="bg-green-500/10 text-green-400 border-green-500/20">FREE</Badge>
                        </div>
                        <CardDescription>Perfect for development and small projects</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-3xl font-bold text-green-400">$0</div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="text-green-400" size={16} />
                            <span>Full quantum-safe security</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="text-green-400" size={16} />
                            <span>Community support</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="text-green-400" size={16} />
                            <span>Basic monitoring</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="text-green-400" size={16} />
                            <span>Up to 10 agents</span>
                          </div>
                        </div>
                        <div className="pt-4">
                          <div className="text-xs text-green-300/80 font-medium mb-2">ROI Impact:</div>
                          <div className="text-xs text-green-300/70">Eliminates need for $50K+ custom security development</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-blue-500/20 bg-blue-500/5">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-blue-400">Professional</CardTitle>
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">POPULAR</Badge>
                        </div>
                        <CardDescription>Production-ready with enterprise features</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-3xl font-bold text-blue-400">$2,500<span className="text-lg font-normal">/month</span></div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="text-blue-400" size={16} />
                            <span>Everything in Open Source</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="text-blue-400" size={16} />
                            <span>Priority support (24/7)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="text-blue-400" size={16} />
                            <span>Advanced monitoring & analytics</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="text-blue-400" size={16} />
                            <span>Up to 100 agents</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="text-blue-400" size={16} />
                            <span>SLA guarantees</span>
                          </div>
                        </div>
                        <div className="pt-4">
                          <div className="text-xs text-blue-300/80 font-medium mb-2">ROI Impact:</div>
                          <div className="text-xs text-blue-300/70">Prevents $1M+ security breach costs, reduces security team needs by 50%</div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border border-purple-500/20 bg-purple-500/5">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-purple-400">Enterprise</CardTitle>
                          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">CUSTOM</Badge>
                        </div>
                        <CardDescription>Full-scale deployment with custom solutions</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-3xl font-bold text-purple-400">Custom</div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="text-purple-400" size={16} />
                            <span>Everything in Professional</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="text-purple-400" size={16} />
                            <span>Dedicated customer success</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="text-purple-400" size={16} />
                            <span>Custom compliance reports</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="text-purple-400" size={16} />
                            <span>Unlimited agents</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="text-purple-400" size={16} />
                            <span>Custom integrations</span>
                          </div>
                        </div>
                        <div className="pt-4">
                          <div className="text-xs text-purple-300/80 font-medium mb-2">ROI Impact:</div>
                          <div className="text-xs text-purple-300/70">Enterprise deals $100K-$1M+ ARR, enables premium quantum-safe services</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="glass border-0">
                    <CardHeader>
                      <CardTitle className="font-display text-lg flex items-center gap-2">
                        <BarChart3 className="text-primary" size={20} />
                        ROI Calculator Framework
                      </CardTitle>
                      <CardDescription>Help customers quantify the value of ATP implementation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h4 className="font-medium text-green-400">Cost Savings:</h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center p-3 rounded-lg bg-card/30 border border-border/30">
                              <span>Security team reduction (50%)</span>
                              <Badge className="bg-green-500/10 text-green-400 border-green-500/20">$200K+/year</Badge>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-card/30 border border-border/30">
                              <span>Avoided custom development</span>
                              <Badge className="bg-green-500/10 text-green-400 border-green-500/20">$500K+</Badge>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-card/30 border border-border/30">
                              <span>Faster time to market (6 months)</span>
                              <Badge className="bg-green-500/10 text-green-400 border-green-500/20">$1M+</Badge>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-card/30 border border-border/30">
                              <span>Reduced compliance costs</span>
                              <Badge className="bg-green-500/10 text-green-400 border-green-500/20">$100K+/year</Badge>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-medium text-blue-400">Revenue Generation:</h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center p-3 rounded-lg bg-card/30 border border-border/30">
                              <span>Premium quantum-safe pricing</span>
                              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">+30% pricing</Badge>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-card/30 border border-border/30">
                              <span>Enterprise customer acquisition</span>
                              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">+50% deals</Badge>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-card/30 border border-border/30">
                              <span>Competitive differentiation</span>
                              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">+25% win rate</Badge>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-card/30 border border-border/30">
                              <span>Future-proof market position</span>
                              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">5-year advantage</Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <h4 className="font-medium text-primary mb-2">Typical Enterprise ROI:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">300%+</div>
                            <div className="text-muted-foreground">First Year ROI</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">$2.5M</div>
                            <div className="text-muted-foreground">3-Year Value</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">6 months</div>
                            <div className="text-muted-foreground">Payback Period</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Competitive Advantages */}
          <TabsContent value="competitive" className="space-y-8">
            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <Award className="text-primary" size={24} />
                  Competitive Landscape & Positioning
                </CardTitle>
                <CardDescription>How ATP compares to existing solutions and alternatives</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                        <h4 className="font-medium text-red-400 mb-3">Traditional Security Solutions</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="text-red-400 mt-0.5" size={14} />
                            <span><strong>Quantum Vulnerable:</strong> RSA, ECDSA will be broken by quantum computers</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="text-red-400 mt-0.5" size={14} />
                            <span><strong>Not AI-Specific:</strong> Generic security, not designed for agent interactions</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="text-red-400 mt-0.5" size={14} />
                            <span><strong>Complex Migration:</strong> Expensive and time-consuming to upgrade later</span>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded">
                          <div className="text-xs font-medium text-red-400">Key Message:</div>
                          <div className="text-xs text-red-300/90">"Traditional security is technical debt waiting to happen in the quantum era"</div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                        <h4 className="font-medium text-amber-400 mb-3">Academic Research Projects</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="text-amber-400 mt-0.5" size={14} />
                            <span><strong>Research-Only:</strong> Not production-ready or enterprise-supported</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="text-amber-400 mt-0.5" size={14} />
                            <span><strong>No Commercial Support:</strong> Reliance on academic timelines and priorities</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="text-amber-400 mt-0.5" size={14} />
                            <span><strong>Integration Complexity:</strong> Requires deep cryptographic expertise</span>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded">
                          <div className="text-xs font-medium text-amber-400">Key Message:</div>
                          <div className="text-xs text-amber-300/90">"Academic projects are great for research, but enterprises need production-ready solutions"</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                        <h4 className="font-medium text-green-400 mb-3">ATP Competitive Advantages</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="text-green-400 mt-0.5" size={14} />
                            <span><strong>First-Mover:</strong> Only production-ready quantum-safe AI agent protocol</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="text-green-400 mt-0.5" size={14} />
                            <span><strong>Enterprise-Ready:</strong> Built for production from day one with SLAs</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="text-green-400 mt-0.5" size={14} />
                            <span><strong>Developer-First:</strong> Simple SDK, excellent documentation, fast integration</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="text-green-400 mt-0.5" size={14} />
                            <span><strong>Open Core:</strong> Free to start, enterprise features when needed</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                        <h4 className="font-medium text-blue-400 mb-3">Unique Differentiation</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <Star className="text-blue-400 mt-0.5" size={14} />
                            <span><strong>AI-Specific Design:</strong> Built specifically for agent trust and capability management</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Star className="text-blue-400 mt-0.5" size={14} />
                            <span><strong>Visual Policy Editor:</strong> No-code trust policy creation and management</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Star className="text-blue-400 mt-0.5" size={14} />
                            <span><strong>Real-time Monitoring:</strong> Live trust level tracking and anomaly detection</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Star className="text-blue-400 mt-0.5" size={14} />
                            <span><strong>Hybrid Crypto:</strong> Best of both worlds - current performance + quantum safety</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Card className="border-0 bg-gradient-to-r from-primary/5 to-secondary/5">
                    <CardContent className="p-6">
                      <h4 className="font-medium text-lg mb-4 text-center">Competitive Comparison Matrix</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/30">
                              <th className="text-left py-2">Feature</th>
                              <th className="text-center py-2">ATP</th>
                              <th className="text-center py-2">Traditional Security</th>
                              <th className="text-center py-2">Academic Projects</th>
                              <th className="text-center py-2">Custom Development</th>
                            </tr>
                          </thead>
                          <tbody className="text-xs">
                            <tr className="border-b border-border/20">
                              <td className="py-2">Quantum-Safe</td>
                              <td className="text-center py-2"><CheckCircle className="text-green-400 mx-auto" size={16} /></td>
                              <td className="text-center py-2"><AlertTriangle className="text-red-400 mx-auto" size={16} /></td>
                              <td className="text-center py-2"><CheckCircle className="text-green-400 mx-auto" size={16} /></td>
                              <td className="text-center py-2"><AlertTriangle className="text-amber-400 mx-auto" size={16} /></td>
                            </tr>
                            <tr className="border-b border-border/20">
                              <td className="py-2">Production Ready</td>
                              <td className="text-center py-2"><CheckCircle className="text-green-400 mx-auto" size={16} /></td>
                              <td className="text-center py-2"><CheckCircle className="text-green-400 mx-auto" size={16} /></td>
                              <td className="text-center py-2"><AlertTriangle className="text-red-400 mx-auto" size={16} /></td>
                              <td className="text-center py-2"><AlertTriangle className="text-amber-400 mx-auto" size={16} /></td>
                            </tr>
                            <tr className="border-b border-border/20">
                              <td className="py-2">AI Agent Specific</td>
                              <td className="text-center py-2"><CheckCircle className="text-green-400 mx-auto" size={16} /></td>
                              <td className="text-center py-2"><AlertTriangle className="text-red-400 mx-auto" size={16} /></td>
                              <td className="text-center py-2"><AlertTriangle className="text-red-400 mx-auto" size={16} /></td>
                              <td className="text-center py-2"><CheckCircle className="text-green-400 mx-auto" size={16} /></td>
                            </tr>
                            <tr className="border-b border-border/20">
                              <td className="py-2">Easy Integration</td>
                              <td className="text-center py-2"><CheckCircle className="text-green-400 mx-auto" size={16} /></td>
                              <td className="text-center py-2"><AlertTriangle className="text-amber-400 mx-auto" size={16} /></td>
                              <td className="text-center py-2"><AlertTriangle className="text-red-400 mx-auto" size={16} /></td>
                              <td className="text-center py-2"><AlertTriangle className="text-red-400 mx-auto" size={16} /></td>
                            </tr>
                            <tr className="border-b border-border/20">
                              <td className="py-2">Enterprise Support</td>
                              <td className="text-center py-2"><CheckCircle className="text-green-400 mx-auto" size={16} /></td>
                              <td className="text-center py-2"><CheckCircle className="text-green-400 mx-auto" size={16} /></td>
                              <td className="text-center py-2"><AlertTriangle className="text-red-400 mx-auto" size={16} /></td>
                              <td className="text-center py-2"><AlertTriangle className="text-amber-400 mx-auto" size={16} /></td>
                            </tr>
                            <tr>
                              <td className="py-2">Total Cost of Ownership</td>
                              <td className="text-center py-2 text-green-400 font-medium">Low</td>
                              <td className="text-center py-2 text-red-400 font-medium">High*</td>
                              <td className="text-center py-2 text-amber-400 font-medium">Medium</td>
                              <td className="text-center py-2 text-red-400 font-medium">Very High</td>
                            </tr>
                          </tbody>
                        </table>
                        <div className="text-xs text-muted-foreground mt-2">
                          * High due to future quantum migration costs
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Common Objections */}
          <TabsContent value="objections" className="space-y-8">
            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <MessageSquare className="text-primary" size={24} />
                  Common Objections & Responses
                </CardTitle>
                <CardDescription>Prepared responses to typical customer concerns and questions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                    <h4 className="font-medium text-blue-400 mb-3">"Quantum computers are still years away - why do we need this now?"</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>Response:</strong> Security infrastructure changes take years to implement properly. The "crypto-apocalypse" isn't just about when quantum computers exist, but when adversaries start collecting encrypted data today to decrypt later.</p>
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3 mt-3">
                        <div className="text-xs font-medium text-blue-400">Key Points:</div>
                        <ul className="text-xs text-blue-300/90 list-disc list-inside space-y-1 mt-1">
                          <li>"Harvest now, decrypt later" attacks are happening today</li>
                          <li>NIST recommends migration by 2030</li>
                          <li>First-mover advantage in quantum-safe services</li>
                          <li>ATP hybrid approach provides immediate security benefits</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <h4 className="font-medium text-amber-400 mb-3">"This sounds too complex for our team to implement"</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>Response:</strong> ATP is designed to hide complexity behind simple APIs. Most teams integrate in under 2 hours, and we provide comprehensive support throughout implementation.</p>
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3 mt-3">
                        <div className="text-xs font-medium text-amber-400">Demo Points:</div>
                        <ul className="text-xs text-amber-300/90 list-disc list-inside space-y-1 mt-1">
                          <li>Show 5-minute quickstart example</li>
                          <li>Demonstrate visual policy editor</li>
                          <li>Highlight comprehensive documentation</li>
                          <li>Offer proof-of-concept engagement</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                    <h4 className="font-medium text-red-400 mb-3">"We already have security solutions in place"</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>Response:</strong> ATP complements existing security by adding quantum-safe protection specifically for AI agents. It's not about replacing everything, but about future-proofing your AI investments.</p>
                      <div className="bg-red-500/10 border border-red-500/20 rounded p-3 mt-3">
                        <div className="text-xs font-medium text-red-400">Positioning:</div>
                        <ul className="text-xs text-red-300/90 list-disc list-inside space-y-1 mt-1">
                          <li>ATP focuses specifically on AI agent security</li>
                          <li>Integrates with existing infrastructure</li>
                          <li>Provides quantum-safe upgrade path</li>
                          <li>ROI comes from enhanced AI service capabilities</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                    <h4 className="font-medium text-purple-400 mb-3">"What if quantum-safe standards change?"</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>Response:</strong> ATP uses NIST-approved algorithms and is designed for algorithm agility. We continuously update our implementation as standards evolve, protecting your investment.</p>
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded p-3 mt-3">
                        <div className="text-xs font-medium text-purple-400">Assurance:</div>
                        <ul className="text-xs text-purple-300/90 list-disc list-inside space-y-1 mt-1">
                          <li>Built-in algorithm agility</li>
                          <li>Regular security updates included</li>
                          <li>NIST compliance commitment</li>
                          <li>Hybrid approach reduces migration risk</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                    <h4 className="font-medium text-green-400 mb-3">"How do we justify the cost to our executives?"</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>Response:</strong> Frame it as risk mitigation and competitive advantage. The cost of quantum-safe security today is far less than the cost of a quantum attack or late migration tomorrow.</p>
                      <div className="bg-green-500/10 border border-green-500/20 rounded p-3 mt-3">
                        <div className="text-xs font-medium text-green-400">Executive Messaging:</div>
                        <ul className="text-xs text-green-300/90 list-disc list-inside space-y-1 mt-1">
                          <li>Present ROI calculator results</li>
                          <li>Show competitive differentiation benefits</li>
                          <li>Highlight enterprise customer requirements</li>
                          <li>Emphasize early adoption advantages</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
                    <h4 className="font-medium text-cyan-400 mb-3">"Can't we just build this ourselves?"</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>Response:</strong> You could, but it would take 2-3 years and cost $1M+ for a team of cryptography experts. ATP gives you a production-ready solution today for a fraction of that cost.</p>
                      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded p-3 mt-3">
                        <div className="text-xs font-medium text-cyan-400">Build vs Buy:</div>
                        <ul className="text-xs text-cyan-300/90 list-disc list-inside space-y-1 mt-1">
                          <li>Custom development: $1M+, 2-3 years</li>
                          <li>ATP Professional: $30K/year, 2 hours integration</li>
                          <li>Ongoing security updates and compliance included</li>
                          <li>Focus resources on core business instead</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Demo Talking Points */}
          <TabsContent value="demo" className="space-y-8">
            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <Video className="text-primary" size={24} />
                  Demo Script & Talking Points
                </CardTitle>
                <CardDescription>Step-by-step demo flow with key messages for maximum impact</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div className="p-6 rounded-lg bg-primary/5 border border-primary/20">
                    <h4 className="font-medium text-primary mb-4">Demo Opening (2 minutes)</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">1</div>
                        <div>
                          <div className="font-medium">Problem Statement</div>
                          <div className="text-muted-foreground">"Traditional AI security will be completely broken by quantum computers. Companies need quantum-safe solutions now."</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">2</div>
                        <div>
                          <div className="font-medium">Solution Introduction</div>
                          <div className="text-muted-foreground">"ATP is the world's first production-ready quantum-safe protocol designed specifically for AI agents."</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">3</div>
                        <div>
                          <div className="font-medium">Demo Preview</div>
                          <div className="text-muted-foreground">"I'll show you how to implement quantum-safe AI security in under 5 minutes."</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                      <h4 className="font-medium text-green-400 mb-3">Demo Section 1: Quick Setup (3 minutes)</h4>
                      <div className="space-y-2 text-sm">
                        <div className="font-medium">Show:</div>
                        <ul className="text-muted-foreground list-disc list-inside space-y-1">
                          <li>npm install atp-sdk</li>
                          <li>Simple client initialization</li>
                          <li>Agent registration in 3 lines of code</li>
                        </ul>
                        <div className="font-medium mt-3">Key Message:</div>
                        <div className="text-green-300/90 text-xs bg-green-500/10 p-2 rounded border border-green-500/20">
                          "Notice how simple this is - you get enterprise-grade quantum-safe security without needing a PhD in cryptography."
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <h4 className="font-medium text-blue-400 mb-3">Demo Section 2: Quantum Signatures (3 minutes)</h4>
                      <div className="space-y-2 text-sm">
                        <div className="font-medium">Show:</div>
                        <ul className="text-muted-foreground list-disc list-inside space-y-1">
                          <li>Quantum signature generation demo</li>
                          <li>Hybrid Ed25519 + Dilithium verification</li>
                          <li>Performance metrics display</li>
                        </ul>
                        <div className="font-medium mt-3">Key Message:</div>
                        <div className="text-blue-300/90 text-xs bg-blue-500/10 p-2 rounded border border-blue-500/20">
                          "This hybrid approach gives you the best of both worlds - current performance plus quantum safety."
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                      <h4 className="font-medium text-purple-400 mb-3">Demo Section 3: Trust Management (4 minutes)</h4>
                      <div className="space-y-2 text-sm">
                        <div className="font-medium">Show:</div>
                        <ul className="text-muted-foreground list-disc list-inside space-y-1">
                          <li>Trust level progression demo</li>
                          <li>Capability-based access control</li>
                          <li>Real-time trust monitoring</li>
                        </ul>
                        <div className="font-medium mt-3">Key Message:</div>
                        <div className="text-purple-300/90 text-xs bg-purple-500/10 p-2 rounded border border-purple-500/20">
                          "This is AI-specific security - not just authentication, but intelligent trust management for agent interactions."
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <h4 className="font-medium text-amber-400 mb-3">Demo Section 4: Enterprise Features (3 minutes)</h4>
                      <div className="space-y-2 text-sm">
                        <div className="font-medium">Show:</div>
                        <ul className="text-muted-foreground list-disc list-inside space-y-1">
                          <li>Visual policy editor</li>
                          <li>Audit logging and compliance reports</li>
                          <li>Monitoring dashboard</li>
                        </ul>
                        <div className="font-medium mt-3">Key Message:</div>
                        <div className="text-amber-300/90 text-xs bg-amber-500/10 p-2 rounded border border-amber-500/20">
                          "Built for enterprise from day one - compliance, monitoring, and governance are included, not afterthoughts."
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-lg bg-secondary/5 border border-secondary/20">
                    <h4 className="font-medium text-secondary mb-4">Demo Closing & Next Steps (2 minutes)</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary font-bold text-xs">1</div>
                        <div>
                          <div className="font-medium">Value Summary</div>
                          <div className="text-muted-foreground">"In 15 minutes, you've seen how ATP provides quantum-safe AI security that's both enterprise-ready and developer-friendly."</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary font-bold text-xs">2</div>
                        <div>
                          <div className="font-medium">ROI Reminder</div>
                          <div className="text-muted-foreground">"Remember, the cost of implementing this today is far less than the cost of a quantum attack or late migration tomorrow."</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary font-bold text-xs">3</div>
                        <div>
                          <div className="font-medium">Call to Action</div>
                          <div className="text-muted-foreground">"Would you like to start with our free open source version, or should we discuss enterprise requirements?"</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Card className="border-0 bg-gradient-to-r from-green-500/5 to-blue-500/5">
                    <CardContent className="p-6">
                      <h4 className="font-medium text-lg mb-4 flex items-center gap-2">
                        <Lightbulb className="text-primary" size={20} />
                        Demo Best Practices
                      </h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
                        <div className="space-y-2">
                          <div className="font-medium text-green-400">Do's:</div>
                          <div className="space-y-1 text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="text-green-400" size={14} />
                              <span>Keep demo under 15 minutes</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="text-green-400" size={14} />
                              <span>Focus on business value, not technical details</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="text-green-400" size={14} />
                              <span>Ask questions throughout to maintain engagement</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="text-green-400" size={14} />
                              <span>Relate features to customer's specific use case</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="font-medium text-red-400">Don'ts:</div>
                          <div className="space-y-1 text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="text-red-400" size={14} />
                              <span>Don't get lost in cryptographic details</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="text-red-400" size={14} />
                              <span>Don't compare extensively to competitors</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="text-red-400" size={14} />
                              <span>Don't rush through enterprise features</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="text-red-400" size={14} />
                              <span>Don't end without a clear next step</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Internal CTA Section */}
        <div className="text-center mt-16 p-8 glass-intense rounded-2xl border-0 atp-quantum-glow text-white">
          <h2 className="font-display text-3xl lg:text-4xl font-light mb-4">Ready to Drive ATP Sales?</h2>
          <p className="text-lg sm:text-xl mb-8 text-white/90 leading-relaxed">
            Use these <span className="text-atp-electric-cyan font-medium">proven strategies</span> to effectively promote ATP's quantum-safe advantage
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-gradient-to-r from-[hsl(var(--atp-quantum))] to-[hsl(var(--atp-primary))] text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 w-full sm:w-auto h-14 px-8 text-lg font-semibold">
              <Link href="/dashboard">
                <Video className="h-5 w-5 mr-3" />
                Practice Demo
              </Link>
            </Button>
            <Button asChild size="lg" className="bg-gradient-to-r from-[hsl(var(--atp-electric-cyan))] to-[hsl(var(--atp-electric-cyan-light))] text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 w-full sm:w-auto h-14 px-8 text-lg font-semibold">
              <Link href="/contact">
                <FileText className="h-5 w-5 mr-3" />
                Sales Materials
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}