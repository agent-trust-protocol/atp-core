import Link from 'next/link';
import Image from 'next/image';
import { BrandLogo } from '@/components/ui/brand-logo';

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
  TrendingUp,
  Code2
} from 'lucide-react';
import { AnimatedIcon, IconWithBadge, FloatingIcon } from '@/components/ui/animated-icon';
import { QuantumShieldIcon, TrustNetworkIcon, PolicyFlowIcon } from '@/components/ui/atp-icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuantumSafeSignatureDemo } from '@/components/atp/quantum-safe-signature-demo';
import { TrustLevelManagementDemo } from '@/components/atp/trust-level-management-demo';
import { QuickAccess } from '@/components/ui/quick-access';

export default function HomePage() {
  return (
    <div className="min-h-screen relative">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 pointer-events-none" />
        <div className="container mx-auto px-4 py-20 sm:py-24 lg:py-32 relative">
          <div className="text-center max-w-5xl mx-auto space-y-12">
          <div className="flex items-center justify-center mb-8 animate-fade-in-up">
            <BrandLogo variant="lockup" size={320} className="animate-in zoom-in-50 duration-1000" alt="Agent Trust Protocol™ Official Logo" />
          </div>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extralight leading-tight animate-fade-in-up text-foreground dark:text-white">
                World's First <span className="atp-gradient-text font-semibold">Quantum-Safe</span>
            <br />
            AI Agent Protocol™
          </h1>
              <p className="text-xl sm:text-2xl text-foreground/90 dark:text-gray-200 max-w-4xl mx-auto leading-relaxed animate-fade-in-up">
            Enterprise-grade security with <strong className="text-foreground dark:text-white">visual policy management</strong> and <span className="text-foreground dark:text-cyan-300 font-medium">real-time monitoring</span>. Trust your AI agents with quantum-level protection.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-4 animate-fade-in-up">
            <Badge className="bg-[hsl(var(--atp-quantum))]/10 dark:bg-[hsl(var(--atp-quantum))]/20 text-[hsl(var(--atp-quantum))] dark:text-cyan-300 border-[hsl(var(--atp-quantum))]/20 dark:border-cyan-400/30 px-4 py-2 text-sm font-medium backdrop-blur-sm"><Sparkles size={14} className="mr-2" />Open Source</Badge>
            <Badge className="bg-[hsl(var(--atp-primary))]/10 dark:bg-[hsl(var(--atp-primary))]/20 text-[hsl(var(--atp-primary))] dark:text-blue-300 border-[hsl(var(--atp-primary))]/20 dark:border-blue-400/30 px-4 py-2 text-sm font-medium backdrop-blur-sm"><Globe size={14} className="mr-2" />Enterprise Ready</Badge>
            <Badge className="bg-atp-electric-cyan/10 dark:bg-atp-electric-cyan/20 text-atp-electric-cyan dark:text-cyan-200 border-atp-electric-cyan/20 dark:border-cyan-300/30 px-4 py-2 text-sm font-medium backdrop-blur-sm"><Award size={14} className="mr-2" />Production Ready</Badge>
          </div>
          {/* Primary CTA + secondary links */}
          <div className="w-full animate-fade-in-up">
            <div className="flex flex-col sm:flex-row items-center sm:justify-center gap-3 px-4 sm:px-0">
              <Button asChild size="lg" className="bg-gradient-to-r from-[hsl(var(--atp-quantum))] to-[hsl(var(--atp-primary))] text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 w-full sm:w-auto h-12 px-6 text-base font-semibold whitespace-nowrap">
                <Link href="/developers"><Code2 className="h-4 w-4 mr-2" />Get Started — npm install atp-sdk</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-2 border-atp-electric-cyan/30 hover:bg-atp-electric-cyan/10 hover:border-atp-electric-cyan/50 hover:scale-105 transition-all duration-300 w-full sm:w-auto h-12 px-5 text-sm font-semibold whitespace-nowrap">
                <Link href="/demos"><Activity className="h-4 w-4 mr-2" />Try Live Demos</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50 hover:scale-105 transition-all duration-300 w-full sm:w-auto h-12 px-5 text-sm font-semibold whitespace-nowrap">
                <a href="https://github.com/agent-trust-protocol/atp-core" target="_blank" rel="noopener noreferrer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0-2-1.5-3-1.5-3-1.5-.3 1.15-.3 2.35 0 3.5-1.05 1.08-1 3.5-1 3.5 0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>View on GitHub</a>
              </Button>
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
              <Link href="/signup" className="hover:text-foreground transition-colors">Start free trial</Link>
              <span>•</span>
              <Link href="/cloud" className="hover:text-foreground transition-colors">Request cloud access</Link>
              <span>•</span>
              <Link href="/login" className="hover:text-foreground transition-colors">Customer login</Link>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-[hsl(var(--atp-surface))]/50 to-[hsl(var(--atp-surface))]/80 rounded-2xl border border-border/50 backdrop-blur-sm animate-fade-in-up">
            <p className="text-base text-muted-foreground text-center">🎉 <strong className="text-foreground">100% Open Source</strong> • Apache 2.0 License • <a href="https://github.com/agent-trust-protocol/core" className="text-atp-electric-cyan hover:text-atp-electric-cyan/80 hover:underline" target="_blank" rel="noopener noreferrer">Free Forever</a> • <Link href="/developers" className="text-atp-electric-cyan hover:text-atp-electric-cyan/80 hover:underline">Developer Portal</Link> • <Link href="/integrations/openclaw" className="text-atp-electric-cyan hover:text-atp-electric-cyan/80 hover:underline">OpenClaw Integration</Link> • Enterprise Support Available</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm">
              <a href="https://github.com/agent-trust-protocol/core" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-git-branch">
                  <line x1="6" x2="6" y1="3" y2="15"></line>
                  <circle cx="18" cy="6" r="3"></circle>
                  <circle cx="6" cy="18" r="3"></circle>
                  <path d="M18 9a9 9 0 0 1-9 9"></path>
                </svg>
                Core Protocol
              </a>
              <span className="text-muted-foreground">•</span>
              <a href="https://github.com/agent-trust-protocol" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-github">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0-2-1.5-3-1.5-3-1.5-.3 1.15-.3 2.35 0 3.5-1.05 1.08-1 3.5-1 3.5 0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                  <path d="M9 18c-4.51 2-5-2-7-2"></path>
                </svg>
                All Repositories
              </a>
            </div>
          </div>

          {/* Quick Access */}
          <QuickAccess />
        </div>
        {/* Close hero wrapper */}
      </div>

      {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12 lg:mb-16">
                      <Card className="glass atp-trust-indicator hover:scale-105 transition-all duration-300">
              <CardHeader className="pt-6">
                <div className="relative p-3 rounded-xl w-fit mb-4">
                  <div className="absolute inset-0 atp-gradient-primary rounded-xl opacity-90" />
                  <div className="relative z-10">
                    <QuantumShieldIcon size={24} gradient className="text-white animate-in zoom-in-50 duration-500" />
                  </div>
                </div>
                <CardTitle className="font-display text-xl mb-2">Quantum-Safe Security</CardTitle>
                <CardDescription className="text-foreground/70">
                  Ed25519 + Dilithium hybrid cryptography for post-quantum security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/60 mb-4 leading-relaxed">
                  Advanced cryptographic protection against quantum computing threats with minimal performance overhead.
                </p>
                <Button asChild variant="outline" size="sm" className="glass border-atp-quantum-blue/30 hover:bg-atp-quantum-blue/10">
                  <Link href="/enterprise">
                    Learn More
                    <ArrowRight size={12} className="ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

                      <Card className="glass atp-trust-indicator hover:scale-105 transition-all duration-300">
              <CardHeader className="pt-6">
                <div className="relative p-3 rounded-xl w-fit mb-4">
                  <div className="absolute inset-0 atp-gradient-secondary rounded-xl opacity-90" />
                  <div className="relative z-10">
                    <TrustNetworkIcon size={24} gradient className="text-white animate-pulse" />
                  </div>
                </div>
                <CardTitle className="font-display text-xl mb-2">Trust Level Management</CardTitle>
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

                      <Card className="glass atp-trust-indicator hover:scale-105 transition-all duration-300">
              <CardHeader className="pt-6">
                <div className="relative p-3 rounded-xl w-fit mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl opacity-90" />
                  <TrendingUp className="relative z-10 text-white" size={24} />
                </div>
                <CardTitle className="font-display text-xl mb-2">Monitoring Dashboard</CardTitle>
                <CardDescription className="text-foreground/70">
                  Real-time metrics, trust scores, and audit streams for deployed agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/60 mb-4 leading-relaxed">
                  SDK-level metrics available today. Hosted dashboard ships with ATP 2.0 (Q2 2026).
                </p>
                <Button asChild variant="outline" size="sm" className="glass border-purple-500/30 hover:bg-purple-500/10">
                  <Link href="/monitoring">
                    View Metrics
                    <ArrowRight size={12} className="ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

                      <Card className="glass atp-trust-indicator hover:scale-105 transition-all duration-300">
              <CardHeader className="pt-6">
                <div className="relative p-3 rounded-xl w-fit mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl opacity-90" />
                  <div className="relative z-10">
                    <PolicyFlowIcon size={24} gradient className="text-white" />
                  </div>
                </div>
                <CardTitle className="font-display text-xl mb-2">Visual Policy Editor</CardTitle>
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

                      <Card className="glass atp-trust-indicator hover:scale-105 transition-all duration-300">
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

                      <Card className="glass atp-trust-indicator hover:scale-105 transition-all duration-300">
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
            <QuantumSafeSignatureDemo />
            <TrustLevelManagementDemo />
          </div>
        </div>

        {/* ATP 2.0 Roadmap Teaser */}
        <div className="mt-12 lg:mt-16 relative overflow-hidden rounded-2xl border border-atp-electric-cyan/30 bg-gradient-to-br from-[hsl(var(--atp-surface))]/60 via-background/40 to-[hsl(var(--atp-surface))]/60 backdrop-blur-sm p-6 sm:p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-atp-electric-cyan/10 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <Badge className="bg-atp-electric-cyan/15 text-atp-electric-cyan border-atp-electric-cyan/30 px-3 py-1 text-xs font-semibold">
                <Sparkles size={12} className="mr-1.5" />Coming Q2 2026
              </Badge>
              <h2 className="font-display text-2xl sm:text-3xl font-light text-foreground">
                ATP 2.0 — <span className="atp-gradient-text font-semibold">Enterprise Platform</span>
              </h2>
              <p className="text-foreground/70 leading-relaxed">
                Hosted agent registry, visual agent inspector, managed cloud dashboards, and tiered enterprise controls. The open-source SDK stays free forever — 2.0 adds optional managed infrastructure for teams running ATP at scale.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full lg:w-auto">
              <Button asChild variant="outline" size="sm" className="border-atp-electric-cyan/40 hover:bg-atp-electric-cyan/10 whitespace-nowrap">
                <Link href="/cloud">Get early access<ArrowRight size={14} className="ml-1" /></Link>
              </Button>
              <span className="text-xs text-muted-foreground text-center lg:text-right">SDK 1.x remains fully supported</span>
            </div>
          </div>
        </div>

        {/* Interactive Demos CTA */}
        <div className="text-center mt-12 lg:mt-16 p-6 sm:p-8 glass-intense rounded-2xl border-0 atp-quantum-glow text-white">
          <h2 className="font-display text-3xl lg:text-4xl font-light mb-4">Experience ATP in Action</h2>
          <p className="text-lg sm:text-xl mb-8 text-white/90 leading-relaxed">
            Try <span className="text-atp-electric-cyan font-medium">quantum-safe cryptography</span>, design trust policies, and explore performance monitoring—all in your browser
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="atp-gradient-primary hover:scale-105 transition-all duration-300 w-full sm:w-auto">
              <Link href="/demos">
                <Zap className="h-4 w-4 mr-2" />
                Interactive Demos
              </Link>
            </Button>
            <Button asChild size="lg" className="atp-gradient-secondary hover:scale-105 transition-all duration-300 w-full sm:w-auto">
              <Link href="/enterprise">
                <Building className="h-4 w-4 mr-2" />
                Enterprise Solutions
              </Link>
            </Button>
          </div>
          <div className="mt-6 text-sm text-white/70">
            No signup required • Experience quantum-safe features instantly
          </div>
        </div>
      </div>
    </div>
  );
}
