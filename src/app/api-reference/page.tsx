import Link from "next/link"
import { 
  Code2, 
  Terminal, 
  Key, 
  Shield, 
  ArrowRight,
  Copy,
  ExternalLink,
  CheckCircle,
  Info,
  BookOpen,
  Zap,
  Lock,
  Clock,
  Globe,
  Database,
  Activity,
  Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Reference — Agent Trust Protocol',
  description: 'Complete API documentation for ATP: authentication methods, endpoints, SDKs, rate limits, and error codes.',
}

export default function APIReferencePage() {
  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extralight mb-6">
            <span className="atp-gradient-text">API Reference</span>
          </h1>
          <p className="text-lg sm:text-xl text-foreground/80 mb-8 max-w-3xl mx-auto leading-relaxed">
            Complete documentation for ATP APIs, SDKs, authentication, and integration guides.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 px-4 py-2">
              <Code2 size={14} className="mr-2" />
              REST API
            </Badge>
            <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-4 py-2">
              <Key size={14} className="mr-2" />
              Quantum-Safe Auth
            </Badge>
            <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 px-4 py-2">
              <Shield size={14} className="mr-2" />
              Enterprise Ready
            </Badge>
          </div>
        </div>

        {/* Quick Start */}
        <Card className="glass mb-8 border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-yellow-500" />
              Quick Start
            </CardTitle>
            <CardDescription>
              Get started with ATP API in minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="install" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="install">Install SDK</TabsTrigger>
                <TabsTrigger value="auth">Authentication</TabsTrigger>
                <TabsTrigger value="example">First Request</TabsTrigger>
              </TabsList>
              
              <TabsContent value="install" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Install ATP SDK</h3>
                  <div className="bg-gray-900 rounded-lg p-4 relative">
                    <code className="text-green-400 font-mono text-sm">
                      npm install atp-sdk
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-2 top-2"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="auth" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Authentication</h3>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <pre className="text-green-400 font-mono text-sm">
{`import { ATPClient } from 'atp-sdk'

const client = new ATPClient({
  endpoint: 'https://api.atp.dev',
  apiKey: 'your-api-key'
})

await client.authenticate()`}
                    </pre>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="example" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Create Agent</h3>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <pre className="text-green-400 font-mono text-sm">
{`const agent = await client.agents.create({
  name: 'My Agent',
  capabilities: ['read', 'write'],
  trustLevel: 'medium'
})

console.log('Agent created:', agent.id)`}
                    </pre>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Core Endpoints */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Agent Management
              </CardTitle>
              <CardDescription>
                Create, manage, and monitor AI agents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">POST /agents</span>
                  <Badge variant="outline">Create</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">GET /agents</span>
                  <Badge variant="outline">List</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">GET /agents/:id</span>
                  <Badge variant="outline">Get</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">PUT /agents/:id</span>
                  <Badge variant="outline">Update</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Trust & Security
              </CardTitle>
              <CardDescription>
                Manage trust levels and security policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">POST /trust/evaluate</span>
                  <Badge variant="outline">Evaluate</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">GET /trust/levels</span>
                  <Badge variant="outline">List</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">POST /policies</span>
                  <Badge variant="outline">Create</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">GET /policies</span>
                  <Badge variant="outline">List</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Authentication Methods */}
        <Card className="glass mb-8 border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-purple-500" />
              Authentication Methods
            </CardTitle>
            <CardDescription>
              Quantum-safe authentication options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold">API Keys</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Simple authentication for development and testing
                </p>
                <Badge variant="outline">Development</Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold">Quantum Signatures</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Post-quantum cryptographic signatures for production
                </p>
                <Badge variant="outline">Production</Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold">Enterprise SSO</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  SAML, OAuth, and Active Directory integration
                </p>
                <Badge variant="outline">Enterprise</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rate Limits */}
        <Card className="glass mb-8 border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Rate Limits & Quotas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4">Plan</th>
                    <th className="text-left p-4">Requests/Minute</th>
                    <th className="text-left p-4">Agents</th>
                    <th className="text-left p-4">Support</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-4">
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        Free
                      </Badge>
                    </td>
                    <td className="p-4">60</td>
                    <td className="p-4">10</td>
                    <td className="p-4">Community</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">
                      <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                        Pro
                      </Badge>
                    </td>
                    <td className="p-4">1,000</td>
                    <td className="p-4">100</td>
                    <td className="p-4">Email</td>
                  </tr>
                  <tr>
                    <td className="p-4">
                      <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                        Enterprise
                      </Badge>
                    </td>
                    <td className="p-4">10,000+</td>
                    <td className="p-4">Unlimited</td>
                    <td className="p-4">24/7 Support</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* SDK Documentation */}
        <Card className="glass mb-8 border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-cyan-500" />
              SDK Documentation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Official SDKs</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <div className="font-semibold">TypeScript/JavaScript</div>
                      <div className="text-sm text-muted-foreground">npm install atp-sdk</div>
                    </div>
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                      Stable
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <div className="font-semibold">Python</div>
                      <div className="text-sm text-muted-foreground">pip install atp-sdk</div>
                    </div>
                    <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                      Beta
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold">Community SDKs</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <div className="font-semibold">Go</div>
                      <div className="text-sm text-muted-foreground">go get github.com/atp/go-sdk</div>
                    </div>
                    <Badge variant="outline">Community</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <div className="font-semibold">Rust</div>
                      <div className="text-sm text-muted-foreground">cargo add atp-sdk</div>
                    </div>
                    <Badge variant="outline">Community</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="glass border-0 p-8">
            <h2 className="font-display text-2xl font-light mb-4">
              Ready to Build with ATP?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Start integrating quantum-safe security into your AI agents today
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-gradient-to-r from-[hsl(var(--atp-quantum))] to-[hsl(var(--atp-primary))] text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 h-14 px-8 text-lg font-semibold">
                <Link href="/dashboard">
                  <Terminal className="h-5 w-5 mr-3" />
                  Try Live Demo
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-2 border-atp-electric-cyan/30 hover:bg-atp-electric-cyan/10 hover:border-atp-electric-cyan/50 hover:scale-105 transition-all duration-300 h-14 px-8 text-lg font-semibold">
                <Link href="/examples">
                  <ExternalLink className="h-5 w-5 mr-3" />
                  View Examples
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}