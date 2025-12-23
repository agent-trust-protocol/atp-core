import Link from "next/link"
import Image from "next/image"

// Force dynamic rendering for this page due to interactive components
export const dynamic = 'force-dynamic'
import { 
  Shield, 
  Users, 
  Activity, 
  BarChart3, 
  Settings, 
  FileText,
  ArrowRight,
  Zap,
  Globe,
  Building,
  CheckCircle,
  Award,
  Sparkles,
  Network,
  Lock,
  Eye,
  TrendingUp
} from "lucide-react"
import { AnimatedIcon, IconWithBadge, FloatingIcon } from "@/components/ui/animated-icon"
import { QuantumShieldIcon, TrustNetworkIcon, QuantumKeyIcon, SecureConnectionIcon, PolicyFlowIcon } from "@/components/ui/atp-icons"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QuantumSignatureDemo } from "@/components/atp/quantum-signature-demo"
import { TrustLevelDemo } from "@/components/atp/trust-level-demo"
import { MonitoringDemo } from "@/components/atp/monitoring-demo"

export default function HomePage() {
  return (
    <div className="min-h-screen relative">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        <div className="text-center mb-12 lg:mb-16">
          <div className="flex items-center justify-center mb-6 animate-fade-in-up">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-4 atp-quantum-glow rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Image
                src="/atp-logo.png"
                alt="Agent Trust Protocol Logo"
                width={60}
                height={60}
                className="object-contain animate-in zoom-in-50 duration-1000"
                priority
              />
            </div>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extralight mb-6 animate-fade-in-up">
            Agent Trust Protocol
          </h1>
          <p className="text-lg sm:text-xl text-foreground/80 mb-8 max-w-4xl mx-auto leading-relaxed animate-fade-in-up">
            The world's first <span className="atp-gradient-text font-medium">quantum-safe AI agent protocol</span>. 
            <strong>Open source core</strong> with enterprise-grade security, visual policy management, and real-time monitoring.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8 animate-fade-in-up">
            <Badge className="glass text-sm px-3 py-1 atp-trust-high border-0">
              <Sparkles size={12} className="mr-1 icon-glow" />
              Open Source
            </Badge>
            <Badge className="glass text-sm px-3 py-1 atp-trust-enterprise border-0">
              <Globe size={12} className="mr-1 animate-pulse" />
              Enterprise Ready
            </Badge>
            <Badge className="glass text-sm px-3 py-1 atp-trust-verified border-0">
              <Award size={12} className="mr-1 icon-glow" />
              Production Ready
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up">
            <Button asChild size="lg" className="glass atp-quantum-glow hover:scale-105 transition-all duration-300 w-full sm:w-auto">
              <Link href="/dashboard">
                <Activity className="h-4 w-4 mr-2" />
                Try Live Demo
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="glass border-atp-electric-cyan/30 hover:bg-atp-electric-cyan/10 hover:scale-105 transition-all duration-300 w-full sm:w-auto">
              <a href="https://github.com/agent-trust-protocol/core" target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4 mr-2" />
                View on GitHub
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="glass border-purple-500/30 hover:bg-purple-500/10 hover:scale-105 transition-all duration-300 w-full sm:w-auto">
              <Link href="/enterprise">
                <Building className="h-4 w-4 mr-2" />
                Enterprise
              </Link>
            </Button>
          </div>
          
          <div className="mt-6 p-4 glass rounded-lg border border-atp-electric-cyan/20 animate-fade-in-up">
            <p className="text-sm text-foreground/70 text-center">
              🎉 <strong>100% Open Source</strong> • Apache 2.0 License • 
              <a href="https://github.com/agent-trust-protocol/core" className="text-atp-electric-cyan hover:underline" target="_blank" rel="noopener noreferrer">
                Free Forever
              </a> • Enterprise Support Available
            </p>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12 lg:mb-16">
          <Card className="glass atp-trust-indicator hover:scale-105 transition-all duration-300 border-0">
            <CardHeader>
              <div className="relative p-3 rounded-xl w-fit mb-2">
                <div className="absolute inset-0 atp-gradient-primary rounded-xl opacity-90" />
                <div className="relative z-10">
                  <QuantumShieldIcon size={24} gradient className="text-white animate-in zoom-in-50 duration-500" />
                </div>
              </div>
              <CardTitle className="font-display text-xl">Quantum-Safe Security</CardTitle>
              <CardDescription className="text-foreground/70">
                Ed25519 + Dilithium hybrid cryptography for post-quantum security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/60 mb-4 leading-relaxed">
                Advanced cryptographic protection against quantum computing threats with minimal performance overhead.
              </p>
              <Button asChild variant="outline" size="sm" className="glass border-atp-quantum-blue/30 hover:bg-atp-quantum-blue/10">
                <Link href="/dashboard">
                  Learn More
                  <ArrowRight size={12} className="ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass atp-trust-indicator hover:scale-105 transition-all duration-300 border-0">
            <CardHeader>
              <div className="relative p-3 rounded-xl w-fit mb-2">
                <div className="absolute inset-0 atp-gradient-secondary rounded-xl opacity-90" />
                <div className="relative z-10">
                  <TrustNetworkIcon size={24} gradient className="text-white animate-pulse" />
                </div>
              </div>
              <CardTitle className="font-display text-xl">Trust Level Management</CardTitle>
              <CardDescription className="text-foreground/70">
                Dynamic trust evaluation and agent capability management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/60 mb-4 leading-relaxed">
                Multi-level trust system with automatic progression and capability-based access control.
              </p>
              <Button asChild variant="outline" size="sm" className="glass border-atp-emerald/30 hover:bg-atp-emerald/10">
                <Link href="/dashboard">
                  Explore Trust Levels
                  <ArrowRight size={12} className="ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass atp-trust-indicator hover:scale-105 transition-all duration-300 border-0">
            <CardHeader>
              <div className="relative p-3 rounded-xl w-fit mb-2">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl opacity-90" />
                <TrendingUp className="relative z-10 text-white" size={24} />
              </div>
              <CardTitle className="font-display text-xl">Real-Time Monitoring</CardTitle>
              <CardDescription className="text-foreground/70">
                Comprehensive system monitoring and performance analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/60 mb-4 leading-relaxed">
                Live metrics, performance tracking, and enterprise-grade monitoring with alerting.
              </p>
              <Button asChild variant="outline" size="sm" className="glass border-purple-500/30 hover:bg-purple-500/10">
                <Link href="/dashboard">
                  View Metrics
                  <ArrowRight size={12} className="ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass atp-trust-indicator hover:scale-105 transition-all duration-300 border-0">
            <CardHeader>
              <div className="relative p-3 rounded-xl w-fit mb-2">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl opacity-90" />
                <div className="relative z-10">
                  <PolicyFlowIcon size={24} gradient className="text-white" />
                </div>
              </div>
              <CardTitle className="font-display text-xl">Visual Policy Editor</CardTitle>
              <CardDescription className="text-foreground/70">
                Drag-and-drop policy creation with no-code interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/60 mb-4 leading-relaxed">
                Create complex trust policies visually with real-time validation and simulation.
              </p>
              <Button asChild variant="outline" size="sm" className="glass border-orange-500/30 hover:bg-orange-500/10">
                <Link href="/policy-editor">
                  Create Policy
                  <ArrowRight size={12} className="ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass atp-trust-indicator hover:scale-105 transition-all duration-300 border-0">
            <CardHeader>
              <div className="relative p-3 rounded-xl w-fit mb-2">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl opacity-90" />
                <Building className="relative z-10 text-white" size={24} />
              </div>
              <CardTitle className="font-display text-xl">Enterprise Features</CardTitle>
              <CardDescription className="text-foreground/70">
                Multi-tenant architecture with compliance and audit logging
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/60 mb-4 leading-relaxed">
                SOC 2, ISO 27001, GDPR, and HIPAA compliance with comprehensive audit trails.
              </p>
              <Button asChild variant="outline" size="sm" className="glass border-indigo-500/30 hover:bg-indigo-500/10">
                <Link href="/policies">
                  Manage Policies
                  <ArrowRight size={12} className="ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass atp-trust-indicator hover:scale-105 transition-all duration-300 border-0">
            <CardHeader>
              <div className="relative p-3 rounded-xl w-fit mb-2">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-red-500 rounded-xl opacity-90" />
                <Zap className="relative z-10 text-white icon-glow" size={24} />
              </div>
              <CardTitle className="font-display text-xl">High Performance</CardTitle>
              <CardDescription className="text-foreground/70">
                Optimized for high-throughput AI agent interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/60 mb-4 leading-relaxed">
                Sub-millisecond response times with horizontal scaling and load balancing.
              </p>
              <Button asChild variant="outline" size="sm" className="glass border-yellow-500/30 hover:bg-yellow-500/10">
                <Link href="/dashboard">
                  View Performance
                  <ArrowRight size={12} className="ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Demo Section */}
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl lg:text-4xl font-light mb-4 atp-gradient-text">Interactive Demos</h2>
            <p className="text-foreground/70 max-w-2xl mx-auto leading-relaxed">
              Experience ATP's quantum-safe capabilities with these interactive demonstrations
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <div className="icon-glow">
                    <QuantumKeyIcon size={20} gradient />
                  </div>
                  Quantum-Safe Signatures
                </CardTitle>
                <CardDescription className="text-foreground/70">
                  Generate and verify quantum-safe signatures in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuantumSignatureDemo />
              </CardContent>
            </Card>

            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <div className="animate-pulse">
                    <TrustNetworkIcon size={20} gradient />
                  </div>
                  Trust Level System
                </CardTitle>
                <CardDescription className="text-foreground/70">
                  Register agents and manage trust levels dynamically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TrustLevelDemo />
              </CardContent>
            </Card>
          </div>

          <Card className="glass border-0 atp-trust-indicator">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-xl">
                <div className="animate-pulse">
                  <SecureConnectionIcon size={20} gradient />
                </div>
                Real-Time Monitoring
              </CardTitle>
              <CardDescription className="text-foreground/70">
                Live system metrics and performance monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonitoringDemo />
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12 lg:mt-16 p-6 sm:p-8 glass-intense rounded-2xl border-0 atp-quantum-glow">
          <h2 className="font-display text-3xl lg:text-4xl font-light mb-4 atp-gradient-text">Ready to Get Started?</h2>
          <p className="text-lg sm:text-xl mb-8 text-foreground/80 leading-relaxed">
            Join the future of <span className="text-atp-electric-cyan font-medium">quantum-safe</span> AI agent interactions
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="atp-gradient-primary hover:scale-105 transition-all duration-300 w-full sm:w-auto">
              <Link href="/dashboard">
                <Activity className="h-4 w-4 mr-2" />
                Launch Dashboard
              </Link>
            </Button>
            <Button asChild size="lg" className="atp-gradient-secondary hover:scale-105 transition-all duration-300 w-full sm:w-auto">
              <Link href="/policy-editor">
                <FileText className="h-4 w-4 mr-2" />
                Try Policy Editor
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}