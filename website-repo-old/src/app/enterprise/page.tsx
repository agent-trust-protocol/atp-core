import Link from "next/link"
import { 
  Shield, 
  Building, 
  Users, 
  Award, 
  TrendingUp, 
  Lock, 
  Eye, 
  Settings,
  ArrowRight,
  CheckCircle,
  Clock,
  Globe,
  Headphones,
  FileText,
  Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function EnterprisePage() {
  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="flex items-center justify-center mb-6 animate-fade-in-up">
            <div className="relative w-20 h-20 mb-4 atp-quantum-glow rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Building size={40} className="text-primary animate-in zoom-in-50 duration-1000" />
            </div>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extralight mb-6 animate-fade-in-up">
            Enterprise Security
          </h1>
          <p className="text-lg sm:text-xl text-foreground/80 mb-8 max-w-4xl mx-auto leading-relaxed animate-fade-in-up">
            Production-ready <span className="atp-gradient-text font-medium">quantum-safe security</span> 
            with enterprise-grade features, compliance, and 24/7 support.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8 animate-fade-in-up">
            <Badge className="glass text-sm px-3 py-1 atp-trust-enterprise border-0">
              <Building size={12} className="mr-1" />
              Enterprise Ready
            </Badge>
            <Badge className="glass text-sm px-3 py-1 atp-trust-verified border-0">
              <Award size={12} className="mr-1 icon-glow" />
              SOC 2 Compliant
            </Badge>
            <Badge className="glass text-sm px-3 py-1 atp-trust-high border-0">
              <Shield size={12} className="mr-1" />
              99.9% Uptime SLA
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up">
            <Button asChild size="lg" className="glass atp-quantum-glow hover:scale-105 transition-all duration-300 w-full sm:w-auto">
              <Link href="/dashboard">
                <Activity className="h-4 w-4 mr-2" />
                Request Demo
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="glass border-atp-electric-cyan/30 hover:bg-atp-electric-cyan/10 hover:scale-105 transition-all duration-300 w-full sm:w-auto">
              <Link href="/pricing">
                <FileText className="h-4 w-4 mr-2" />
                View Pricing
              </Link>
            </Button>
          </div>
        </div>

        {/* Enterprise Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12 lg:mb-16">
          <Card className="glass atp-trust-indicator hover:scale-105 transition-all duration-300 border-0">
            <CardHeader>
              <div className="relative p-3 rounded-xl w-fit mb-2">
                <div className="absolute inset-0 atp-gradient-primary rounded-xl opacity-90" />
                <div className="relative z-10">
                  <TrendingUp size={24} className="text-white" />
                </div>
              </div>
              <CardTitle className="font-display text-xl">Advanced Monitoring</CardTitle>
              <CardDescription className="text-foreground/70">
                Real-time metrics, performance analytics, and custom dashboards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  Real-time agent performance metrics
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  Custom alerting and notifications
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  Historical trend analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  Executive reporting dashboards
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass atp-trust-indicator hover:scale-105 transition-all duration-300 border-0">
            <CardHeader>
              <div className="relative p-3 rounded-xl w-fit mb-2">
                <div className="absolute inset-0 atp-gradient-secondary rounded-xl opacity-90" />
                <div className="relative z-10">
                  <Lock size={24} className="text-white" />
                </div>
              </div>
              <CardTitle className="font-display text-xl">Enterprise SSO</CardTitle>
              <CardDescription className="text-foreground/70">
                Single sign-on, RBAC, and enterprise authentication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  SAML 2.0 and OAuth 2.0 support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  Active Directory integration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  Role-based access control
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  Multi-factor authentication
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass atp-trust-indicator hover:scale-105 transition-all duration-300 border-0">
            <CardHeader>
              <div className="relative p-3 rounded-xl w-fit mb-2">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl opacity-90" />
                <Award className="relative z-10 text-white" size={24} />
              </div>
              <CardTitle className="font-display text-xl">Compliance & Audit</CardTitle>
              <CardDescription className="text-foreground/70">
                SOC 2, HIPAA, GDPR compliance with comprehensive audit trails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  SOC 2 Type II certification
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  HIPAA and GDPR compliance
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  Immutable audit logs
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  Compliance reporting tools
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass atp-trust-indicator hover:scale-105 transition-all duration-300 border-0">
            <CardHeader>
              <div className="relative p-3 rounded-xl w-fit mb-2">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl opacity-90" />
                <Globe className="relative z-10 text-white" size={24} />
              </div>
              <CardTitle className="font-display text-xl">High Availability</CardTitle>
              <CardDescription className="text-foreground/70">
                Multi-region deployment with automatic failover
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  99.9% uptime SLA guarantee
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  Multi-region clustering
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  Automatic failover and recovery
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  Load balancing and scaling
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass atp-trust-indicator hover:scale-105 transition-all duration-300 border-0">
            <CardHeader>
              <div className="relative p-3 rounded-xl w-fit mb-2">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl opacity-90" />
                <Headphones className="relative z-10 text-white" size={24} />
              </div>
              <CardTitle className="font-display text-xl">Priority Support</CardTitle>
              <CardDescription className="text-foreground/70">
                24/7 dedicated support with guaranteed response times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  24/7 phone and email support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  Dedicated customer success manager
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  Priority bug fixes and features
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  Professional services available
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass atp-trust-indicator hover:scale-105 transition-all duration-300 border-0">
            <CardHeader>
              <div className="relative p-3 rounded-xl w-fit mb-2">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-red-500 rounded-xl opacity-90" />
                <Settings className="relative z-10 text-white icon-glow" size={24} />
              </div>
              <CardTitle className="font-display text-xl">Custom Integrations</CardTitle>
              <CardDescription className="text-foreground/70">
                Tailored integrations and custom protocol adapters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  Custom protocol bridges
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  Legacy system integrations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  API customization and extensions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  White-label deployment options
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Value Proposition */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl lg:text-4xl font-light mb-4 atp-gradient-text">
              Why Enterprises Choose ATP
            </h2>
            <p className="text-foreground/70 max-w-3xl mx-auto leading-relaxed">
              Built for enterprise scale with the security and compliance features you need
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="glass border-0 p-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={16} className="text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Future-Proof Security</h3>
                    <p className="text-sm text-foreground/70">
                      Quantum-safe cryptography protects your agents against both current and future threats, 
                      ensuring long-term security for your AI infrastructure.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={16} className="text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Regulatory Compliance</h3>
                    <p className="text-sm text-foreground/70">
                      Built-in compliance features for SOC 2, HIPAA, GDPR, and other regulatory frameworks 
                      reduce compliance burden and audit costs.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={16} className="text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Zero-Trust Architecture</h3>
                    <p className="text-sm text-foreground/70">
                      Every agent interaction is cryptographically verified with granular permission controls, 
                      eliminating trust assumptions and reducing attack surface.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="glass border-0 p-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Operational Excellence</h3>
                    <p className="text-sm text-foreground/70">
                      Advanced monitoring, alerting, and analytics provide complete visibility into your 
                      agent ecosystem with automated incident response.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Clock size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Rapid Deployment</h3>
                    <p className="text-sm text-foreground/70">
                      Pre-built enterprise features and professional services ensure quick time-to-value 
                      with minimal disruption to existing systems.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Users size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Expert Support</h3>
                    <p className="text-sm text-foreground/70">
                      Dedicated customer success managers and 24/7 support ensure your team has the 
                      expertise needed for successful deployment and operation.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl lg:text-4xl font-light mb-4 atp-gradient-text">
              Enterprise Use Cases
            </h2>
            <p className="text-foreground/70 max-w-3xl mx-auto leading-relaxed">
              Real-world applications across industries and enterprise functions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass border-0 hover:scale-105 transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                  <Building size={24} className="text-white" />
                </div>
                <CardTitle className="text-lg">Financial Services</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70 mb-4">
                  Secure multi-bank fraud detection, automated compliance reporting, 
                  and cross-institutional data sharing with privacy preservation.
                </p>
                <ul className="text-xs text-foreground/60 space-y-1">
                  <li>• Multi-party fraud analysis</li>
                  <li>• Regulatory compliance automation</li>
                  <li>• Privacy-preserving collaboration</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="glass border-0 hover:scale-105 transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4">
                  <Shield size={24} className="text-white" />
                </div>
                <CardTitle className="text-lg">Healthcare</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70 mb-4">
                  HIPAA-compliant federated diagnosis, secure medical record sharing, 
                  and multi-provider care coordination with full audit trails.
                </p>
                <ul className="text-xs text-foreground/60 space-y-1">
                  <li>• Federated medical diagnosis</li>
                  <li>• HIPAA compliance built-in</li>
                  <li>• Multi-provider coordination</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="glass border-0 hover:scale-105 transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                  <Eye size={24} className="text-white" />
                </div>
                <CardTitle className="text-lg">Manufacturing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70 mb-4">
                  Supply chain transparency, automated quality control, 
                  and cross-supplier collaboration with intellectual property protection.
                </p>
                <ul className="text-xs text-foreground/60 space-y-1">
                  <li>• Supply chain optimization</li>
                  <li>• Quality control automation</li>
                  <li>• IP-protected collaboration</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center p-8 glass-intense rounded-2xl border-0 atp-quantum-glow">
          <h2 className="font-display text-3xl lg:text-4xl font-light mb-4 atp-gradient-text">
            Ready for Enterprise Deployment?
          </h2>
          <p className="text-lg mb-8 text-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Schedule a demo to see how ATP Enterprise can secure your AI agent infrastructure
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="atp-gradient-primary hover:scale-105 transition-all duration-300">
              <Link href="/dashboard">
                <Activity className="h-4 w-4 mr-2" />
                Schedule Demo
              </Link>
            </Button>
            <Button asChild size="lg" className="atp-gradient-secondary hover:scale-105 transition-all duration-300">
              <Link href="/pricing">
                <FileText className="h-4 w-4 mr-2" />
                View Pricing
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}