import Link from "next/link"
import { 
  PlayCircle, 
  Code2, 
  Lightbulb, 
  Users, 
  Shield, 
  Zap, 
  ArrowRight,
  Copy,
  ExternalLink,
  CheckCircle,
  GitBranch,
  Database,
  Globe,
  Activity,
  Settings,
  FileText,
  Terminal,
  Book,
  Video,
  Download,
  Star
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QuantumShieldIcon, TrustNetworkIcon, QuantumKeyIcon, SecureConnectionIcon, PolicyFlowIcon } from "@/components/ui/atp-icons"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Examples — Agent Trust Protocol',
  description: 'Real-world examples, tutorials, and best practices for implementing ATP quantum-safe security in your AI agents.',
  keywords: [
    'ATP examples',
    'code samples',
    'tutorials',
    'integration patterns',
    'best practices',
    'LangChain integration',
    'quantum-safe examples',
    'AI agent security',
    'sample applications'
  ],
}

export default function ExamplesPage() {
  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="flex items-center justify-center mb-6 animate-fade-in-up">
            <div className="relative w-20 h-20 mb-4 atp-quantum-glow rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <PlayCircle size={40} className="text-primary animate-in zoom-in-50 duration-1000" />
            </div>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extralight mb-6 animate-fade-in-up">
            <span className="atp-gradient-text">Examples & Tutorials</span>
          </h1>
          <p className="text-lg sm:text-xl text-foreground/80 mb-8 max-w-4xl mx-auto leading-relaxed animate-fade-in-up">
            Learn ATP through <span className="atp-gradient-text font-medium">real-world examples</span>, 
            integration patterns, and step-by-step tutorials for quantum-safe AI agent security.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8 animate-fade-in-up">
            <Badge className="glass text-sm px-4 py-2 atp-trust-high border-0">
              <Code2 size={14} className="mr-2" />
              Code Examples
            </Badge>
            <Badge className="glass text-sm px-4 py-2 atp-trust-verified border-0">
              <Lightbulb size={14} className="mr-2" />
              Best Practices
            </Badge>
            <Badge className="glass text-sm px-4 py-2 atp-trust-enterprise border-0">
              <Video size={14} className="mr-2" />
              Video Tutorials
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="quickstart" className="space-y-8">
          <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-2 lg:grid-cols-6 glass border-0">
            <TabsTrigger value="quickstart" className="text-xs sm:text-sm">Quick Start</TabsTrigger>
            <TabsTrigger value="use-cases" className="text-xs sm:text-sm">Use Cases</TabsTrigger>
            <TabsTrigger value="patterns" className="text-xs sm:text-sm">Patterns</TabsTrigger>
            <TabsTrigger value="samples" className="text-xs sm:text-sm">Sample Apps</TabsTrigger>
            <TabsTrigger value="tutorials" className="text-xs sm:text-sm">Tutorials</TabsTrigger>
            <TabsTrigger value="best-practices" className="text-xs sm:text-sm">Best Practices</TabsTrigger>
          </TabsList>

          {/* Quick Start */}
          <TabsContent value="quickstart" className="space-y-8">
            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <Zap className="text-primary" size={24} />
                  5-Minute Quick Start
                </CardTitle>
                <CardDescription>Get your first quantum-safe agent running in minutes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">1</div>
                      <h3 className="font-medium">Install ATP SDK</h3>
                    </div>
                    <div className="bg-card/50 border border-border/50 rounded-lg p-4 font-mono text-xs">
                      <div className="text-muted-foreground mb-2"># Choose your preferred package manager</div>
                      <div className="text-foreground">npm install atp-sdk</div>
                      <div className="text-muted-foreground"># or</div>
                      <div className="text-foreground">yarn add atp-sdk</div>
                      <div className="text-muted-foreground"># or</div>
                      <div className="text-foreground">pnpm add atp-sdk</div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full glass border-atp-electric-cyan/30 hover:bg-atp-electric-cyan/10 hover:border-atp-electric-cyan/50 hover:scale-105 transition-all duration-300">
                      <Copy size={16} className="mr-2" />
                      Copy Install Command
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary font-bold text-sm">2</div>
                      <h3 className="font-medium">Initialize Client</h3>
                    </div>
                    <div className="bg-card/50 border border-border/50 rounded-lg p-4 font-mono text-xs">
                      <div className="text-muted-foreground mb-2">{"// src/index.ts"}</div>
                      <div className="text-foreground">import {"{ ATPClient }"} from 'atp-sdk'</div>
                      <div className="text-foreground mt-2">const atp = new ATPClient({"{"}
                        <br />{"  "}baseUrl: 'https://api.atp.dev',
                        <br />{"  "}apiKey: process.env.ATP_API_KEY
                        <br />{"}"})
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full glass border-atp-electric-cyan/30 hover:bg-atp-electric-cyan/10 hover:border-atp-electric-cyan/50 hover:scale-105 transition-all duration-300">
                      <Copy size={16} className="mr-2" />
                      Copy Code
                    </Button>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-border/30">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-sm">3</div>
                        <h3 className="font-medium">Register Your Agent</h3>
                      </div>
                      <div className="bg-card/50 border border-border/50 rounded-lg p-4 font-mono text-xs">
                        <div className="text-muted-foreground mb-2">{"// Register an AI agent"}</div>
                        <div className="text-foreground">const agent = await atp.agents.create({"{"}
                          <br />{"  "}name: 'CustomerServiceBot',
                          <br />{"  "}description: 'Handles customer inquiries',
                          <br />{"  "}capabilities: ['read', 'write', 'analyze']
                          <br />{"}"})
                        </div>
                        <div className="text-muted-foreground mt-3 mb-2">{"// Agent is now quantum-safe!"}</div>
                        <div className="text-foreground">console.log(`Agent ID: ${"{"}agent.id{"}"}`)</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm">4</div>
                        <h3 className="font-medium">Start Secure Interactions</h3>
                      </div>
                      <div className="bg-card/50 border border-border/50 rounded-lg p-4 font-mono text-xs">
                        <div className="text-muted-foreground mb-2">{"// Secure agent communication"}</div>
                        <div className="text-foreground">const response = await atp.agents.interact({"{"}
                          <br />{"  "}agentId: agent.id,
                          <br />{"  "}message: 'Process customer request',
                          <br />{"  "}context: {"{ customerId: '123' }"}
                          <br />{"}"})
                        </div>
                        <div className="text-muted-foreground mt-3 mb-2">{"// All communications are quantum-safe"}</div>
                        <div className="text-foreground">console.log(response)</div>
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
                    <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                      <Terminal className="text-green-400" size={20} />
                    </div>
                    <CardTitle className="font-display text-lg">Complete Example</CardTitle>
                  </div>
                  <CardDescription>Full working example with error handling</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full bg-gradient-to-r from-[hsl(var(--atp-quantum))] to-[hsl(var(--atp-primary))] text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                    <a href="https://github.com/agent-trust-protocol/core/tree/main/examples/quickstart" target="_blank" rel="noopener noreferrer">
                      <GitBranch size={16} className="mr-2" />
                      View on GitHub
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <PlayCircle className="text-blue-400" size={20} />
                    </div>
                    <CardTitle className="font-display text-lg">Live Demo</CardTitle>
                  </div>
                  <CardDescription>Try the example in your browser</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full glass border-atp-electric-cyan/30 hover:bg-atp-electric-cyan/10 hover:border-atp-electric-cyan/50 hover:scale-105 transition-all duration-300">
                    <Link href="/dashboard">
                      <Activity size={16} className="mr-2" />
                      Launch Demo
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <Download className="text-purple-400" size={20} />
                    </div>
                    <CardTitle className="font-display text-lg">Starter Template</CardTitle>
                  </div>
                  <CardDescription>Ready-to-use project template</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full glass border-atp-electric-cyan/30 hover:bg-atp-electric-cyan/10 hover:border-atp-electric-cyan/50 hover:scale-105 transition-all duration-300">
                    <Download size={16} className="mr-2" />
                    Download Template
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Use Cases */}
          <TabsContent value="use-cases" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <Users className="text-primary" size={20} />
                    </div>
                    <CardTitle className="font-display text-lg">Multi-Agent Systems</CardTitle>
                  </div>
                  <CardDescription>Coordinated AI agents with trust hierarchies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Build secure multi-agent systems where agents collaborate, delegate tasks, 
                    and maintain trust relationships with quantum-safe communication.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="text-green-400" size={16} />
                      <span>Agent orchestration</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="text-green-400" size={16} />
                      <span>Trust-based delegation</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="text-green-400" size={16} />
                      <span>Secure inter-agent messaging</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="glass border-atp-electric-cyan/30 hover:bg-atp-electric-cyan/10 hover:border-atp-electric-cyan/50 hover:scale-105 transition-all duration-300">
                      <Link href="#multi-agent-example">
                        <Code2 size={14} className="mr-2" />
                        View Code
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="glass border-atp-electric-cyan/30 hover:bg-atp-electric-cyan/10 hover:border-atp-electric-cyan/50 hover:scale-105 transition-all duration-300">
                      <Link href="/dashboard">
                        <PlayCircle size={14} className="mr-2" />
                        Demo
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-secondary/10 border border-secondary/20">
                      <Globe className="text-secondary" size={20} />
                    </div>
                    <CardTitle className="font-display text-lg">Enterprise Integration</CardTitle>
                  </div>
                  <CardDescription>ATP in enterprise microservices architecture</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Integrate ATP into existing enterprise systems with service-to-service authentication, 
                    compliance logging, and centralized policy management.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="text-green-400" size={16} />
                      <span>Microservices authentication</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="text-green-400" size={16} />
                      <span>SOC 2 compliance</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="text-green-400" size={16} />
                      <span>API gateway integration</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href="#enterprise-example">
                        <Code2 size={14} className="mr-2" />
                        View Code
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/enterprise">
                        <Shield size={14} className="mr-2" />
                        Enterprise
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <Lightbulb className="text-primary" size={24} />
                  Popular Use Case Examples
                </CardTitle>
                <CardDescription>Real-world scenarios where ATP provides value</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                    <Link href="#customer-service">
                      <div className="w-full">
                        <div className="flex items-center gap-2 mb-1">
                          <Users size={16} className="text-blue-400" />
                          <span className="font-medium text-sm">Customer Service</span>
                        </div>
                        <p className="text-xs text-muted-foreground text-left">AI agents handling customer inquiries with compliance tracking</p>
                      </div>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                    <Link href="#financial-trading">
                      <div className="w-full">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity size={16} className="text-green-400" />
                          <span className="font-medium text-sm">Financial Trading</span>
                        </div>
                        <p className="text-xs text-muted-foreground text-left">Quantum-safe trading algorithms with audit trails</p>
                      </div>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                    <Link href="#healthcare">
                      <div className="w-full">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield size={16} className="text-red-400" />
                          <span className="font-medium text-sm">Healthcare AI</span>
                        </div>
                        <p className="text-xs text-muted-foreground text-left">HIPAA-compliant medical AI with quantum security</p>
                      </div>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                    <Link href="#supply-chain">
                      <div className="w-full">
                        <div className="flex items-center gap-2 mb-1">
                          <Database size={16} className="text-purple-400" />
                          <span className="font-medium text-sm">Supply Chain</span>
                        </div>
                        <p className="text-xs text-muted-foreground text-left">IoT agents managing logistics with trust verification</p>
                      </div>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                    <Link href="#content-moderation">
                      <div className="w-full">
                        <div className="flex items-center gap-2 mb-1">
                          <Settings size={16} className="text-amber-400" />
                          <span className="font-medium text-sm">Content Moderation</span>
                        </div>
                        <p className="text-xs text-muted-foreground text-left">AI moderators with transparent decision tracking</p>
                      </div>
                    </Link>
                  </Button>

                  <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-start space-y-2">
                    <Link href="#research-collaboration">
                      <div className="w-full">
                        <div className="flex items-center gap-2 mb-1">
                          <Book size={16} className="text-cyan-400" />
                          <span className="font-medium text-sm">Research Networks</span>
                        </div>
                        <p className="text-xs text-muted-foreground text-left">Academic AI collaboration with IP protection</p>
                      </div>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integration Patterns */}
          <TabsContent value="patterns" className="space-y-8">
            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <GitBranch className="text-primary" size={24} />
                  Common Integration Patterns
                </CardTitle>
                <CardDescription>Proven architectural patterns for ATP implementation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                      <h4 className="font-medium text-green-400 mb-3 flex items-center gap-2">
                        <QuantumKeyIcon size={16} className="text-green-400" />
                        Gateway Pattern
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Centralized ATP gateway handling all agent authentication and routing
                      </p>
                      <div className="bg-card/50 rounded p-3 font-mono text-xs">
                        <div className="text-muted-foreground">{"// API Gateway with ATP"}</div>
                        <div className="text-foreground">app.use('/api/agents/*', atpAuth)</div>
                        <div className="text-foreground">app.use('/api/agents', agentRouter)</div>
                      </div>
                      <Button asChild variant="outline" size="sm" className="w-full mt-3">
                        <Link href="#gateway-pattern">
                          <ExternalLink size={14} className="mr-2" />
                          Full Example
                        </Link>
                      </Button>
                    </div>

                    <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <h4 className="font-medium text-blue-400 mb-3 flex items-center gap-2">
                        <TrustNetworkIcon size={16} className="text-blue-400" />
                        Sidecar Pattern
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        ATP sidecar container for microservices communication
                      </p>
                      <div className="bg-card/50 rounded p-3 font-mono text-xs">
                        <div className="text-muted-foreground"># docker-compose.yml</div>
                        <div className="text-foreground">services:</div>
                        <div className="text-foreground">  my-service:</div>
                        <div className="text-foreground">    image: my-app</div>
                        <div className="text-foreground">  atp-sidecar:</div>
                        <div className="text-foreground">    image: atp/sidecar</div>
                      </div>
                      <Button asChild variant="outline" size="sm" className="w-full mt-3">
                        <Link href="#sidecar-pattern">
                          <ExternalLink size={14} className="mr-2" />
                          Full Example
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                      <h4 className="font-medium text-purple-400 mb-3 flex items-center gap-2">
                        <SecureConnectionIcon size={16} className="text-purple-400" />
                        Embedded Pattern
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        ATP SDK directly embedded in application code
                      </p>
                      <div className="bg-card/50 rounded p-3 font-mono text-xs">
                        <div className="text-muted-foreground">{"// Direct integration"}</div>
                        <div className="text-foreground">import {"{ ATPClient }"} from 'atp-sdk'</div>
                        <div className="text-foreground">const atp = new ATPClient(config)</div>
                        <div className="text-foreground">await atp.authenticate()</div>
                      </div>
                      <Button asChild variant="outline" size="sm" className="w-full mt-3">
                        <Link href="#embedded-pattern">
                          <ExternalLink size={14} className="mr-2" />
                          Full Example
                        </Link>
                      </Button>
                    </div>

                    <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <h4 className="font-medium text-amber-400 mb-3 flex items-center gap-2">
                        <PolicyFlowIcon size={16} className="text-amber-400" />
                        Event-Driven Pattern
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        ATP events triggering business logic and workflows
                      </p>
                      <div className="bg-card/50 rounded p-3 font-mono text-xs">
                        <div className="text-muted-foreground">{"// Event handlers"}</div>
                        <div className="text-foreground">atp.on('trustLevelChange', handler)</div>
                        <div className="text-foreground">atp.on('policyViolation', handler)</div>
                        <div className="text-foreground">atp.on('agentRegistered', handler)</div>
                      </div>
                      <Button asChild variant="outline" size="sm" className="w-full mt-3">
                        <Link href="#event-driven-pattern">
                          <ExternalLink size={14} className="mr-2" />
                          Full Example
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Framework Integrations</CardTitle>
                  <CardDescription>Ready-made integrations with popular frameworks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                          <Code2 className="text-green-400" size={16} />
                        </div>
                        <span className="font-medium">LangChain</span>
                      </div>
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Ready</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                          <Terminal className="text-blue-400" size={16} />
                        </div>
                        <span className="font-medium">FastAPI</span>
                      </div>
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Ready</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                          <Globe className="text-purple-400" size={16} />
                        </div>
                        <span className="font-medium">Express.js</span>
                      </div>
                      <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">Ready</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Deployment Patterns</CardTitle>
                  <CardDescription>Infrastructure and deployment configurations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                          <Database className="text-amber-400" size={16} />
                        </div>
                        <span className="font-medium">Kubernetes</span>
                      </div>
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Tested</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                          <Settings className="text-green-400" size={16} />
                        </div>
                        <span className="font-medium">Docker Compose</span>
                      </div>
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Ready</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card/30 border border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                          <Globe className="text-blue-400" size={16} />
                        </div>
                        <span className="font-medium">Cloud Functions</span>
                      </div>
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Beta</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sample Applications */}
          <TabsContent value="samples" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                      <Users className="text-green-400" size={20} />
                    </div>
                    <CardTitle className="font-display text-lg">ChatBot Demo</CardTitle>
                  </div>
                  <CardDescription>Quantum-safe customer service chatbot</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Full-featured chatbot with ATP authentication, trust level management, and compliance logging.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Technology:</span>
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Next.js + ATP</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Features:</span>
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Real-time Chat</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href="/dashboard">
                        <PlayCircle size={14} className="mr-2" />
                        Demo
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <a href="https://github.com/agent-trust-protocol/core/tree/main/examples/chatbot" target="_blank" rel="noopener noreferrer">
                        <GitBranch size={14} className="mr-2" />
                        Code
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <Activity className="text-blue-400" size={20} />
                    </div>
                    <CardTitle className="font-display text-lg">Multi-Agent System</CardTitle>
                  </div>
                  <CardDescription>Coordinated agents with trust hierarchies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Multiple AI agents working together with secure communication and dynamic trust management.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Technology:</span>
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Python + FastAPI</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Features:</span>
                      <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">Agent Mesh</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href="/monitoring">
                        <Activity size={14} className="mr-2" />
                        Monitor
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <a href="https://github.com/agent-trust-protocol/core/tree/main/examples/multi-agent" target="_blank" rel="noopener noreferrer">
                        <GitBranch size={14} className="mr-2" />
                        Code
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <Shield className="text-purple-400" size={20} />
                    </div>
                    <CardTitle className="font-display text-lg">Enterprise Gateway</CardTitle>
                  </div>
                  <CardDescription>Production API gateway with ATP</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enterprise-grade API gateway with ATP authentication, rate limiting, and comprehensive monitoring.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Technology:</span>
                      <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">Node.js + Kong</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Features:</span>
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Enterprise</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href="/enterprise">
                        <Shield size={14} className="mr-2" />
                        Enterprise
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <a href="https://github.com/agent-trust-protocol/core/tree/main/examples/enterprise-gateway" target="_blank" rel="noopener noreferrer">
                        <GitBranch size={14} className="mr-2" />
                        Code
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <Database className="text-amber-400" size={20} />
                    </div>
                    <CardTitle className="font-display text-lg">IoT Agent Network</CardTitle>
                  </div>
                  <CardDescription>Secure IoT device management</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    IoT devices acting as AI agents with quantum-safe communication and edge computing capabilities.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Technology:</span>
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Rust + MQTT</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Features:</span>
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Edge AI</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" className="flex-1" disabled>
                      <span>
                        <Code2 size={14} className="mr-2" />
                        Coming Soon
                      </span>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href="/contact">
                        <ExternalLink size={14} className="mr-2" />
                        Request
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                      <Book className="text-cyan-400" size={20} />
                    </div>
                    <CardTitle className="font-display text-lg">LangChain Integration</CardTitle>
                  </div>
                  <CardDescription>ATP-secured LangChain agents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    LangChain agent chains with ATP security, including memory persistence and tool usage tracking.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Technology:</span>
                      <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">LangChain + ATP</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Features:</span>
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Agent Chains</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href="/dashboard">
                        <PlayCircle size={14} className="mr-2" />
                        Demo
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <a href="https://github.com/agent-trust-protocol/core/tree/main/examples/langchain" target="_blank" rel="noopener noreferrer">
                        <GitBranch size={14} className="mr-2" />
                        Code
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                      <Settings className="text-red-400" size={20} />
                    </div>
                    <CardTitle className="font-display text-lg">Policy Editor</CardTitle>
                  </div>
                  <CardDescription>Visual policy creation interface</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Drag-and-drop policy editor with real-time validation and simulation capabilities.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Technology:</span>
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/20">React Flow + ATP</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Features:</span>
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Visual Editor</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href="/policy-editor">
                        <Settings size={14} className="mr-2" />
                        Try Editor
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <a href="https://github.com/agent-trust-protocol/core/tree/main/examples/policy-editor" target="_blank" rel="noopener noreferrer">
                        <GitBranch size={14} className="mr-2" />
                        Code
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Video Tutorials */}
          <TabsContent value="tutorials" className="space-y-8">
            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <Video className="text-primary" size={24} />
                  Video Tutorial Series
                </CardTitle>
                <CardDescription>Step-by-step video guides for mastering ATP</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="border-0 bg-gradient-to-br from-green-500/5 to-blue-500/5">
                    <CardContent className="p-6">
                      <div className="aspect-video bg-card/50 rounded-lg mb-4 flex items-center justify-center border border-border/30">
                        <Video size={48} className="text-muted-foreground" />
                      </div>
                      <h4 className="font-medium mb-2">Getting Started with ATP</h4>
                      <p className="text-sm text-muted-foreground mb-3">Learn the basics of ATP and create your first quantum-safe agent</p>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">15 min</Badge>
                        <Button size="sm">
                          <PlayCircle size={14} className="mr-2" />
                          Watch
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
                    <CardContent className="p-6">
                      <div className="aspect-video bg-card/50 rounded-lg mb-4 flex items-center justify-center border border-border/30">
                        <Video size={48} className="text-muted-foreground" />
                      </div>
                      <h4 className="font-medium mb-2">Quantum-Safe Signatures</h4>
                      <p className="text-sm text-muted-foreground mb-3">Deep dive into Ed25519 + Dilithium hybrid cryptography</p>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">22 min</Badge>
                        <Button size="sm">
                          <PlayCircle size={14} className="mr-2" />
                          Watch
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                    <CardContent className="p-6">
                      <div className="aspect-video bg-card/50 rounded-lg mb-4 flex items-center justify-center border border-border/30">
                        <Video size={48} className="text-muted-foreground" />
                      </div>
                      <h4 className="font-medium mb-2">Enterprise Deployment</h4>
                      <p className="text-sm text-muted-foreground mb-3">Production deployment patterns and best practices</p>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-xs">28 min</Badge>
                        <Button size="sm">
                          <PlayCircle size={14} className="mr-2" />
                          Watch
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Written Tutorials</CardTitle>
                  <CardDescription>Comprehensive step-by-step guides</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild variant="outline" className="w-full justify-start h-auto p-4">
                    <Link href="#tutorial-basics">
                      <div className="text-left">
                        <div className="font-medium">ATP Fundamentals</div>
                        <div className="text-xs text-muted-foreground">Core concepts and architecture overview</div>
                      </div>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start h-auto p-4">
                    <Link href="#tutorial-integration">
                      <div className="text-left">
                        <div className="font-medium">Framework Integration</div>
                        <div className="text-xs text-muted-foreground">Integrate ATP with popular AI frameworks</div>
                      </div>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start h-auto p-4">
                    <Link href="#tutorial-security">
                      <div className="text-left">
                        <div className="font-medium">Security Deep Dive</div>
                        <div className="text-xs text-muted-foreground">Advanced security configuration and best practices</div>
                      </div>
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Interactive Workshops</CardTitle>
                  <CardDescription>Hands-on learning experiences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild variant="outline" className="w-full justify-start h-auto p-4">
                    <Link href="/dashboard">
                      <div className="text-left">
                        <div className="font-medium">Live Demo Workshop</div>
                        <div className="text-xs text-muted-foreground">Interactive ATP features exploration</div>
                      </div>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start h-auto p-4">
                    <Link href="/policy-editor">
                      <div className="text-left">
                        <div className="font-medium">Policy Editor Workshop</div>
                        <div className="text-xs text-muted-foreground">Build complex trust policies visually</div>
                      </div>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start h-auto p-4" disabled>
                    <div className="text-left">
                      <div className="font-medium">Multi-Agent Workshop</div>
                      <div className="text-xs text-muted-foreground">Create coordinated agent systems (Coming Soon)</div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Best Practices */}
          <TabsContent value="best-practices" className="space-y-8">
            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-xl">
                  <Star className="text-primary" size={24} />
                  Production Best Practices
                </CardTitle>
                <CardDescription>Essential guidelines for secure ATP deployment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                      <h4 className="font-medium text-green-400 mb-3 flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-400" />
                        Security First
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 mt-0.5" size={14} />
                          <span>Always use quantum-safe signatures in production</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 mt-0.5" size={14} />
                          <span>Implement proper key rotation schedules</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 mt-0.5" size={14} />
                          <span>Use environment variables for sensitive configuration</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 mt-0.5" size={14} />
                          <span>Enable comprehensive audit logging</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 mt-0.5" size={14} />
                          <span>Regularly update ATP SDK and dependencies</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <h4 className="font-medium text-blue-400 mb-3 flex items-center gap-2">
                        <Zap size={16} className="text-blue-400" />
                        Performance Optimization
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 mt-0.5" size={14} />
                          <span>Cache agent trust levels to reduce API calls</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 mt-0.5" size={14} />
                          <span>Use connection pooling for database operations</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 mt-0.5" size={14} />
                          <span>Implement exponential backoff for retries</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 mt-0.5" size={14} />
                          <span>Monitor and optimize signature verification times</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 mt-0.5" size={14} />
                          <span>Use batch operations where possible</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                      <h4 className="font-medium text-purple-400 mb-3 flex items-center gap-2">
                        <Activity size={16} className="text-purple-400" />
                        Monitoring & Observability
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 mt-0.5" size={14} />
                          <span>Set up comprehensive metrics collection</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 mt-0.5" size={14} />
                          <span>Implement real-time alerting for security events</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 mt-0.5" size={14} />
                          <span>Track trust level changes and policy violations</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 mt-0.5" size={14} />
                          <span>Monitor API rate limits and quota usage</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 mt-0.5" size={14} />
                          <span>Implement distributed tracing for debugging</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <h4 className="font-medium text-amber-400 mb-3 flex items-center gap-2">
                        <Shield size={16} className="text-amber-400" />
                        Compliance & Governance
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 mt-0.5" size={14} />
                          <span>Maintain detailed audit trails for compliance</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 mt-0.5" size={14} />
                          <span>Implement policy review and approval workflows</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 mt-0.5" size={14} />
                          <span>Regular security assessments and penetration testing</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 mt-0.5" size={14} />
                          <span>Document agent capabilities and trust requirements</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle className="text-green-400 mt-0.5" size={14} />
                          <span>Establish incident response procedures</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Common Pitfalls to Avoid</CardTitle>
                  <CardDescription>Learn from common implementation mistakes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                    <div className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-red-400">Hardcoding Secrets:</span>
                        <span className="text-muted-foreground ml-1">Never hardcode private keys or API keys in source code</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                    <div className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-red-400">Ignoring Rate Limits:</span>
                        <span className="text-muted-foreground ml-1">Always implement proper rate limiting and respect API quotas</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                    <div className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-red-400">Insufficient Error Handling:</span>
                        <span className="text-muted-foreground ml-1">Implement comprehensive error handling and retry logic</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                    <div className="flex items-start gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-red-400">Skipping Monitoring:</span>
                        <span className="text-muted-foreground ml-1">Always set up monitoring and alerting from day one</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 atp-trust-indicator">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Development Workflow</CardTitle>
                  <CardDescription>Recommended development and deployment flow</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">1</div>
                      <div className="text-sm">
                        <div className="font-medium">Development</div>
                        <div className="text-muted-foreground text-xs">Use API keys for local development</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary font-bold text-sm">2</div>
                      <div className="text-sm">
                        <div className="font-medium">Staging</div>
                        <div className="text-muted-foreground text-xs">Test with JWT tokens and mock data</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-sm">3</div>
                      <div className="text-sm">
                        <div className="font-medium">Production</div>
                        <div className="text-xs text-muted-foreground">Deploy with quantum-safe signatures</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm">4</div>
                      <div className="text-sm">
                        <div className="font-medium">Monitoring</div>
                        <div className="text-xs text-muted-foreground">Continuous monitoring and optimization</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <div className="text-center mt-16 p-8 glass-intense rounded-2xl border-0 atp-quantum-glow text-white">
          <h2 className="font-display text-3xl lg:text-4xl font-light mb-4">Start Building Today</h2>
          <p className="text-lg sm:text-xl mb-8 text-white/90 leading-relaxed">
            Explore ATP's <span className="text-atp-electric-cyan font-medium">quantum-safe examples</span> and build the future of AI security
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="atp-gradient-primary hover:scale-105 transition-all duration-300 w-full sm:w-auto">
              <Link href="/dashboard">
                <PlayCircle className="h-4 w-4 mr-2" />
                Try Live Examples
              </Link>
            </Button>
            <Button asChild size="lg" className="atp-gradient-secondary hover:scale-105 transition-all duration-300 w-full sm:w-auto">
              <a href="https://github.com/agent-trust-protocol/core" target="_blank" rel="noopener noreferrer">
                <GitBranch className="h-4 w-4 mr-2" />
                Clone Repository
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}