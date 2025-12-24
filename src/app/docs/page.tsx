import Link from "next/link"
import { 
  Book, 
  Shield, 
  Zap, 
  Globe, 
  Code, 
  ArrowRight,
  CheckCircle,
  Terminal,
  Lock,
  Users,
  Settings,
  Download,
  ExternalLink,
  FileText,
  PlayCircle,
  AlertCircle,
  Info,
  HelpCircle,
  Lightbulb,
  Rocket
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QuantumShieldIcon, TrustNetworkIcon, QuantumKeyIcon, SecureConnectionIcon, PolicyFlowIcon } from "@/components/ui/atp-icons"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Documentation — Agent Trust Protocol',
  description: 'Complete documentation for ATP quantum-safe security: getting started, API reference, integration guides, and deployment options.',
  keywords: [
    'ATP documentation',
    'quantum-safe security',
    'AI agent protocol',
    'API reference',
    'integration guide',
    'deployment',
    'Ed25519',
    'Dilithium',
    'post-quantum cryptography'
  ],
}

export default function DocsPage() {
  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="flex items-center justify-center mb-6 animate-fade-in-up">
            <div className="relative w-20 h-20 mb-4 atp-quantum-glow rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Book size={40} className="text-primary animate-in zoom-in-50 duration-1000" />
            </div>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extralight mb-6 animate-fade-in-up">
            <span className="atp-gradient-text">Documentation</span>
          </h1>
          <p className="text-lg sm:text-xl text-foreground/80 mb-8 max-w-4xl mx-auto leading-relaxed animate-fade-in-up">
            Complete guide to implementing <span className="atp-gradient-text font-medium">quantum-safe security</span> 
            for your AI agents with ATP's enterprise-grade protocol.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8 animate-fade-in-up">
            <Badge className="glass text-sm px-4 py-2 atp-trust-high border-0">
              <Shield size={14} className="mr-2" />
              Quantum-Safe
            </Badge>
            <Badge className="glass text-sm px-4 py-2 atp-trust-verified border-0">
              <Code size={14} className="mr-2" />
              Developer-First
            </Badge>
            <Badge className="glass text-sm px-4 py-2 atp-trust-enterprise border-0">
              <Zap size={14} className="mr-2" />
              Production-Ready
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="getting-started" className="space-y-8">
          <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-2 lg:grid-cols-6 glass border-0">
            <TabsTrigger value="getting-started" className="text-xs sm:text-sm">Getting Started</TabsTrigger>
            <TabsTrigger value="concepts" className="text-xs sm:text-sm">Core Concepts</TabsTrigger>
            <TabsTrigger value="integration" className="text-xs sm:text-sm">Integration</TabsTrigger>
            <TabsTrigger value="security" className="text-xs sm:text-sm">Security</TabsTrigger>
            <TabsTrigger value="deployment" className="text-xs sm:text-sm">Deployment</TabsTrigger>
            <TabsTrigger value="faq" className="text-xs sm:text-sm">FAQ</TabsTrigger>
          </TabsList>

          {/* Getting Started */}
          <TabsContent value="getting-started" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                      <Download className="text-green-400" size={20} />
                    </div>
                    <CardTitle className="font-display text-xl">Quick Installation</CardTitle>
                  </div>
                  <CardDescription>Get ATP running in under 5 minutes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-card/50 border border-border/50 rounded-lg p-4 font-mono text-sm">
                    <div className="text-muted-foreground mb-2"># Install ATP SDK</div>
                    <div className="text-foreground">npm install atp-sdk</div>
                    <div className="text-muted-foreground mt-2"># Or clone repository</div>
                    <div className="text-foreground">git clone https://github.com/agent-trust-protocol/core.git</div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full glass border-atp-electric-cyan/30 hover:bg-atp-electric-cyan/10 hover:border-atp-electric-cyan/50 hover:scale-105 transition-all duration-300">
                    <Link href="/examples">
                      <PlayCircle size={16} className="mr-2" />
                      View Quick Start Examples
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <Terminal className="text-blue-400" size={20} />
                    </div>
                    <CardTitle className="font-display text-xl">First Agent</CardTitle>
                  </div>
                  <CardDescription>Register your first AI agent</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-card/50 border border-border/50 rounded-lg p-4 font-mono text-sm">
                    <div className="text-muted-foreground mb-2">{"// Initialize ATP client"}</div>
                    <div className="text-foreground">const atp = new ATPClient()</div>
                    <div className="text-muted-foreground mt-2">{"// Register agent"}</div>
                    <div className="text-foreground">const agent = await atp.registerAgent({"{"}
                      <br />{"  "}name: "MyAgent",
                      <br />{"  "}capabilities: ["read", "write"]
                      <br />{"}"})
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full glass border-atp-electric-cyan/30 hover:bg-atp-electric-cyan/10 hover:border-atp-electric-cyan/50 hover:scale-105 transition-all duration-300">
                    <Link href="/dashboard">
                      <Settings size={16} className="mr-2" />
                      Try Live Demo
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <Rocket className="text-primary" size={24} />
                  30-Second Setup Guide
                </CardTitle>
                <CardDescription>Follow these steps to get your first quantum-safe agent running</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">1</div>
                    <h3 className="font-medium">Install SDK</h3>
                    <p className="text-sm text-muted-foreground">Add ATP to your project with npm or yarn</p>
                  </div>
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary font-bold">2</div>
                    <h3 className="font-medium">Configure</h3>
                    <p className="text-sm text-muted-foreground">Set environment variables and initialize client</p>
                  </div>
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold">3</div>
                    <h3 className="font-medium">Deploy</h3>
                    <p className="text-sm text-muted-foreground">Register agents and start secure interactions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Core Concepts */}
          <TabsContent value="concepts" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <QuantumShieldIcon size={20} className="text-primary" />
                    </div>
                    <CardTitle className="font-display text-xl">What is ATP?</CardTitle>
                  </div>
                  <CardDescription>Agent Trust Protocol fundamentals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed">
                    ATP is the world's first quantum-safe protocol specifically designed for AI agent interactions. 
                    It provides cryptographic trust, identity verification, and capability-based access control 
                    using post-quantum cryptography.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="text-green-400" size={16} />
                      <span>Ed25519 + Dilithium hybrid signatures</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="text-green-400" size={16} />
                      <span>Multi-level trust management</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="text-green-400" size={16} />
                      <span>Real-time monitoring and audit</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-secondary/10 border border-secondary/20">
                      <Shield className="text-secondary" size={20} />
                    </div>
                    <CardTitle className="font-display text-xl">Why Quantum-Safe?</CardTitle>
                  </div>
                  <CardDescription>Future-proofing against quantum threats</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed">
                    Quantum computers pose an existential threat to current cryptographic systems. 
                    ATP uses NIST-approved post-quantum algorithms to ensure your AI agents remain 
                    secure even against quantum attacks.
                  </p>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-amber-400 text-sm">
                      <AlertCircle size={16} />
                      <span className="font-medium">Timeline:</span>
                    </div>
                    <p className="text-sm text-amber-300/90 mt-1">
                      Cryptographically relevant quantum computers expected by 2030-2040
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <TrustNetworkIcon size={24} className="text-primary" />
                  ATP Architecture Overview
                </CardTitle>
                <CardDescription>Understanding the core components and data flow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center space-y-3 p-4 rounded-lg bg-card/30 border border-border/30">
                    <div className="w-12 h-12 mx-auto rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Users className="text-primary" size={24} />
                    </div>
                    <h3 className="font-medium">Identity Service</h3>
                    <p className="text-xs text-muted-foreground">Agent registration and key management</p>
                  </div>
                  <div className="text-center space-y-3 p-4 rounded-lg bg-card/30 border border-border/30">
                    <div className="w-12 h-12 mx-auto rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                      <Lock className="text-secondary" size={24} />
                    </div>
                    <h3 className="font-medium">Permission Service</h3>
                    <p className="text-xs text-muted-foreground">Policy enforcement and capability checks</p>
                  </div>
                  <div className="text-center space-y-3 p-4 rounded-lg bg-card/30 border border-border/30">
                    <div className="w-12 h-12 mx-auto rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                      <Globe className="text-accent" size={24} />
                    </div>
                    <h3 className="font-medium">RPC Gateway</h3>
                    <p className="text-xs text-muted-foreground">Secure communication layer</p>
                  </div>
                  <div className="text-center space-y-3 p-4 rounded-lg bg-card/30 border border-border/30">
                    <div className="w-12 h-12 mx-auto rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <FileText className="text-purple-400" size={24} />
                    </div>
                    <h3 className="font-medium">Audit Logger</h3>
                    <p className="text-xs text-muted-foreground">Compliance and monitoring</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integration Guide */}
          <TabsContent value="integration" className="space-y-8">
            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <Code className="text-primary" size={24} />
                  Integration Patterns
                </CardTitle>
                <CardDescription>Choose the integration approach that fits your architecture</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                      <h3 className="font-medium text-green-400 mb-2">SDK Integration</h3>
                      <p className="text-sm text-muted-foreground mb-3">Direct integration with TypeScript/JavaScript SDK</p>
                      <div className="bg-card/50 rounded p-3 font-mono text-xs">
                        import {"{"}ATPClient{"}"} from 'atp-sdk'<br />
                        const client = new ATPClient()
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href="/api">
                        <Code size={16} className="mr-2" />
                        SDK Documentation
                      </Link>
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <h3 className="font-medium text-blue-400 mb-2">REST API</h3>
                      <p className="text-sm text-muted-foreground mb-3">Language-agnostic HTTP API integration</p>
                      <div className="bg-card/50 rounded p-3 font-mono text-xs">
                        POST /agents/register<br />
                        {"{"}"name": "MyAgent"{"}"}<br />
                        Authorization: Bearer token
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href="/api#rest">
                        <ExternalLink size={16} className="mr-2" />
                        API Reference
                      </Link>
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                      <h3 className="font-medium text-purple-400 mb-2">Docker Compose</h3>
                      <p className="text-sm text-muted-foreground mb-3">Complete containerized deployment</p>
                      <div className="bg-card/50 rounded p-3 font-mono text-xs">
                        docker-compose up -d<br />
                        # ATP services ready<br />
                        # on localhost:8080
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <a href="https://github.com/agent-trust-protocol/core" target="_blank" rel="noopener noreferrer">
                        <Download size={16} className="mr-2" />
                        Docker Setup
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Framework Integrations</CardTitle>
                  <CardDescription>Popular AI frameworks and platforms</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-border/30">
                      <span className="font-medium">LangChain</span>
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Ready</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-border/30">
                      <span className="font-medium">AutoGPT</span>
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">In Progress</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-border/30">
                      <span className="font-medium">CrewAI</span>
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Planned</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Cloud Providers</CardTitle>
                  <CardDescription>Deploy ATP on major cloud platforms</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-border/30">
                      <span className="font-medium">AWS ECS/EKS</span>
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Tested</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-border/30">
                      <span className="font-medium">Google Cloud Run</span>
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Tested</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-border/30">
                      <span className="font-medium">Azure Container</span>
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Beta</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Features */}
          <TabsContent value="security" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <QuantumKeyIcon size={20} className="text-primary" />
                    </div>
                    <CardTitle className="font-display text-xl">Cryptographic Foundations</CardTitle>
                  </div>
                  <CardDescription>Post-quantum security implementation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-card/30 border border-border/30">
                      <h4 className="font-medium text-sm mb-2">Ed25519 (Current Security)</h4>
                      <p className="text-xs text-muted-foreground">High-performance elliptic curve signatures for immediate security</p>
                    </div>
                    <div className="p-3 rounded-lg bg-card/30 border border-border/30">
                      <h4 className="font-medium text-sm mb-2">Dilithium (Quantum-Safe)</h4>
                      <p className="text-xs text-muted-foreground">NIST-approved lattice-based signatures for post-quantum security</p>
                    </div>
                    <div className="p-3 rounded-lg bg-card/30 border border-border/30">
                      <h4 className="font-medium text-sm mb-2">Hybrid Approach</h4>
                      <p className="text-xs text-muted-foreground">Combines both for maximum security with performance optimization</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-secondary/10 border border-secondary/20">
                      <TrustNetworkIcon size={20} className="text-secondary" />
                    </div>
                    <CardTitle className="font-display text-xl">Trust Level System</CardTitle>
                  </div>
                  <CardDescription>Dynamic capability management</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-green-500/20">
                      <span className="text-sm font-medium">Level 1 - Unverified</span>
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">Limited</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-blue-500/20">
                      <span className="text-sm font-medium">Level 2 - Verified</span>
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">Standard</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-green-500/20">
                      <span className="text-sm font-medium">Level 3 - Trusted</span>
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">Enhanced</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Agents earn higher trust levels through consistent behavior and verification
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <Shield className="text-primary" size={24} />
                  Security Best Practices
                </CardTitle>
                <CardDescription>Essential security guidelines for production deployment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-green-400">✓ Recommended Practices</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="text-green-400" size={16} />
                        <span>Use environment variables for secrets</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="text-green-400" size={16} />
                        <span>Enable audit logging in production</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="text-green-400" size={16} />
                        <span>Implement rate limiting</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="text-green-400" size={16} />
                        <span>Regular key rotation</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="text-green-400" size={16} />
                        <span>Monitor trust level changes</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-red-400">⚠ Security Warnings</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="text-red-400" size={16} />
                        <span>Never hardcode private keys</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="text-red-400" size={16} />
                        <span>Validate all input parameters</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="text-red-400" size={16} />
                        <span>Use HTTPS in production</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="text-red-400" size={16} />
                        <span>Implement proper error handling</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="text-red-400" size={16} />
                        <span>Keep dependencies updated</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deployment Options */}
          <TabsContent value="deployment" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                      <Download className="text-green-400" size={20} />
                    </div>
                    <CardTitle className="font-display text-lg">Local Development</CardTitle>
                  </div>
                  <CardDescription>Quick setup for development and testing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-card/50 border border-border/50 rounded-lg p-3 font-mono text-xs">
                    <div className="text-muted-foreground"># Clone repository</div>
                    <div className="text-foreground">git clone [repo]</div>
                    <div className="text-muted-foreground mt-2"># Start services</div>
                    <div className="text-foreground">docker-compose up</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="text-green-400" size={16} />
                      <span>All services included</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="text-green-400" size={16} />
                      <span>Mock databases</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="text-green-400" size={16} />
                      <span>Hot reload enabled</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <Globe className="text-blue-400" size={20} />
                    </div>
                    <CardTitle className="font-display text-lg">Cloud Deployment</CardTitle>
                  </div>
                  <CardDescription>Production-ready cloud deployment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-card/50 border border-border/50 rounded-lg p-3 font-mono text-xs">
                    <div className="text-muted-foreground"># Deploy to AWS</div>
                    <div className="text-foreground">aws ecs deploy-task</div>
                    <div className="text-muted-foreground mt-2"># Or Google Cloud</div>
                    <div className="text-foreground">gcloud run deploy</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="text-green-400" size={16} />
                      <span>Auto-scaling</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="text-green-400" size={16} />
                      <span>Load balancing</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="text-green-400" size={16} />
                      <span>Health monitoring</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <Settings className="text-purple-400" size={20} />
                    </div>
                    <CardTitle className="font-display text-lg">Enterprise Setup</CardTitle>
                  </div>
                  <CardDescription>High-availability enterprise deployment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-card/50 border border-border/50 rounded-lg p-3 font-mono text-xs">
                    <div className="text-muted-foreground"># Kubernetes</div>
                    <div className="text-foreground">kubectl apply -f k8s/</div>
                    <div className="text-muted-foreground mt-2"># Helm chart</div>
                    <div className="text-foreground">helm install atp ./chart</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="text-green-400" size={16} />
                      <span>Multi-region deployment</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="text-green-400" size={16} />
                      <span>Database clustering</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="text-green-400" size={16} />
                      <span>Compliance monitoring</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <Settings className="text-primary" size={24} />
                  Configuration Reference
                </CardTitle>
                <CardDescription>Environment variables and configuration options</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Core Configuration</h4>
                    <div className="bg-card/50 border border-border/50 rounded-lg p-4 font-mono text-xs space-y-2">
                      <div><span className="text-muted-foreground"># Database</span></div>
                      <div>DATABASE_URL=postgresql://...</div>
                      <div><span className="text-muted-foreground"># Redis</span></div>
                      <div>REDIS_URL=redis://localhost:6379</div>
                      <div><span className="text-muted-foreground"># JWT Secret</span></div>
                      <div>JWT_SECRET=your-secret-key</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Security Configuration</h4>
                    <div className="bg-card/50 border border-border/50 rounded-lg p-4 font-mono text-xs space-y-2">
                      <div><span className="text-muted-foreground"># Encryption</span></div>
                      <div>ENCRYPTION_KEY=base64-key</div>
                      <div><span className="text-muted-foreground"># Rate Limiting</span></div>
                      <div>RATE_LIMIT_MAX=100</div>
                      <div><span className="text-muted-foreground"># CORS</span></div>
                      <div>CORS_ORIGIN=https://yourdomain.com</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq" className="space-y-6">
            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <HelpCircle className="text-primary" size={24} />
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription>Common questions about ATP implementation and security</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border-l-2 border-primary/30 pl-4">
                    <h4 className="font-medium mb-2">Q: How does ATP compare to traditional API authentication?</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      ATP goes beyond simple API keys or OAuth tokens. It provides cryptographic identity verification, 
                      capability-based access control, and quantum-safe security. Traditional authentication is 
                      vulnerable to quantum attacks, while ATP is designed for long-term security.
                    </p>
                  </div>

                  <div className="border-l-2 border-secondary/30 pl-4">
                    <h4 className="font-medium mb-2">Q: What's the performance impact of post-quantum cryptography?</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      ATP's hybrid approach maintains excellent performance. Ed25519 provides fast signatures for immediate use, 
                      while Dilithium adds quantum-safe security. Total overhead is typically &lt;5ms for most operations.
                    </p>
                  </div>

                  <div className="border-l-2 border-accent/30 pl-4">
                    <h4 className="font-medium mb-2">Q: Can I integrate ATP with existing AI frameworks?</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Yes! ATP is designed to be framework-agnostic. We provide SDKs for popular languages and 
                      direct integrations for LangChain, with more frameworks coming soon. The REST API works with any system.
                    </p>
                  </div>

                  <div className="border-l-2 border-purple-500/30 pl-4">
                    <h4 className="font-medium mb-2">Q: Is ATP suitable for real-time applications?</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Absolutely. ATP is optimized for high-throughput scenarios with sub-millisecond response times. 
                      The trust level system reduces validation overhead for trusted agents.
                    </p>
                  </div>

                  <div className="border-l-2 border-green-500/30 pl-4">
                    <h4 className="font-medium mb-2">Q: What compliance standards does ATP support?</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      ATP supports SOC 2, ISO 27001, GDPR, HIPAA, and other major compliance frameworks. 
                      Comprehensive audit logging and policy enforcement make compliance verification straightforward.
                    </p>
                  </div>

                  <div className="border-l-2 border-amber-500/30 pl-4">
                    <h4 className="font-medium mb-2">Q: How do I migrate from my current authentication system?</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      ATP can run alongside existing authentication systems during migration. Start by registering 
                      new agents with ATP while maintaining legacy systems, then gradually migrate existing agents.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <Lightbulb className="text-secondary" size={20} />
                  Still Have Questions?
                </CardTitle>
                <CardDescription>Get help from our team and community</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button asChild variant="outline" className="h-12">
                    <a href="https://github.com/agent-trust-protocol/core/discussions" target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={16} className="mr-2" />
                      GitHub Discussions
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="h-12">
                    <Link href="/contact">
                      <Info size={16} className="mr-2" />
                      Contact Support
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <div className="text-center mt-16 p-8 glass-intense rounded-2xl border-0 atp-quantum-glow text-white">
          <h2 className="font-display text-3xl lg:text-4xl font-light mb-4">Ready to Implement ATP?</h2>
          <p className="text-lg sm:text-xl mb-8 text-white/90 leading-relaxed">
            Start building <span className="text-atp-electric-cyan font-medium">quantum-safe</span> AI agent interactions today
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="atp-gradient-primary hover:scale-105 transition-all duration-300 w-full sm:w-auto">
              <Link href="/dashboard">
                <PlayCircle className="h-4 w-4 mr-2" />
                Try Live Demo
              </Link>
            </Button>
            <Button asChild size="lg" className="atp-gradient-secondary hover:scale-105 transition-all duration-300 w-full sm:w-auto">
              <a href="https://github.com/agent-trust-protocol/core" target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download ATP
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}