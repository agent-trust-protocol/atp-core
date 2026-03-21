import Link from 'next/link';
import {
  Shield,
  Zap,
  Code,
  ArrowRight,
  CheckCircle,
  Lock,
  Download,
  ExternalLink,
  Key,
  Activity,
  Network,
  TrendingUp,
  Server,
  Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ATP Security for MCP (Model Context Protocol) — Agent Trust Protocol',
  description: 'Secure your MCP servers and clients with quantum-safe cryptography, verified tool calls, and immutable audit logging from Agent Trust Protocol.',
  keywords: [
    'MCP security',
    'Model Context Protocol ATP',
    'quantum-safe MCP',
    'agent trust protocol MCP',
    'MCP tool authorization',
    'MCP server security',
    'secure MCP tools',
    'Claude MCP security'
  ]
};

export default function MCPIntegrationPage() {
  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">

        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="flex items-center justify-center mb-6 animate-fade-in-up">
            <div className="relative w-20 h-20 mb-4 atp-quantum-glow rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <Server size={40} className="text-cyan-400 animate-in zoom-in-50 duration-1000" />
            </div>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extralight mb-6 animate-fade-in-up">
            <span className="atp-gradient-text">ATP Security</span> for MCP
          </h1>
          <p className="text-lg sm:text-xl text-foreground/80 mb-8 max-w-4xl mx-auto leading-relaxed animate-fade-in-up">
            Bring quantum-safe identity and policy enforcement to{' '}
            <span className="atp-gradient-text font-medium">Model Context Protocol</span> servers and clients.
            Every tool call verified. Every action audited.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8 animate-fade-in-up">
            <Badge className="text-sm px-4 py-2 atp-trust-high border-0 font-semibold">
              <Shield size={14} className="mr-2" />
              Server Authentication
            </Badge>
            <Badge className="text-sm px-4 py-2 bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 border border-cyan-300/40 font-semibold">
              <Lock size={14} className="mr-2" />
              Tool Authorization
            </Badge>
            <Badge className="text-sm px-4 py-2 bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-300/40 font-semibold">
              <Cpu size={14} className="mr-2" />
              Resource Policies
            </Badge>
            <Badge className="text-sm px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300/40 font-semibold">
              <Activity size={14} className="mr-2" />
              Immutable Audit
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up">
            <Link href="/docs">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg">
                <Download size={16} className="mr-2" />
                Get Started
              </Button>
            </Link>
            <Link href="https://github.com/agent-trust-protocol/core" target="_blank">
              <Button variant="outline" size="lg" className="border-2 border-foreground/20 text-foreground bg-background/80 hover:bg-accent font-semibold">
                <ExternalLink size={16} className="mr-2" />
                View on GitHub
              </Button>
            </Link>
          </div>
        </div>

        {/* Architecture */}
        <section className="mb-16">
          <h2 className="font-display text-3xl font-light mb-8 text-center">
            <span className="atp-gradient-text">Where ATP Fits in MCP</span>
          </h2>
          <Card className="glass border-0 mb-8">
            <CardHeader>
              <CardTitle className="font-display text-xl">ATP as the Trust Layer for MCP</CardTitle>
              <CardDescription>
                ATP sits between MCP clients and servers, verifying identity and enforcing policy before any tool runs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black/40 rounded-lg p-6 font-mono text-xs sm:text-sm overflow-x-auto">
                <pre className="text-blue-300">{`┌─────────────────────────────────────────┐
│           MCP Client (LLM / Agent)      │
│      (Claude, GPT-4o, custom agent)     │
└──────────────────┬──────────────────────┘
                   │  tool_call request
                   ▼
┌─────────────────────────────────────────┐
│         ATP Policy Enforcement          │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │  DID Verify │  │  Policy Engine   │  │
│  │  (caller)   │  │  (trust + RBAC)  │  │
│  └─────────────┘  └──────────────────┘  │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │ Rate Limit  │  │  Audit Logger    │  │
│  │ (per-agent) │  │  (HMAC-signed)   │  │
│  └─────────────┘  └──────────────────┘  │
└──────────────────┬──────────────────────┘
                   │  verified request
                   ▼
┌─────────────────────────────────────────┐
│            MCP Server                   │
│   (filesystem, database, API, etc.)     │
└─────────────────────────────────────────┘`}</pre>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Why ATP + MCP */}
        <section className="mb-16">
          <h2 className="font-display text-3xl font-light mb-8 text-center">
            <span className="atp-gradient-text">Why ATP + MCP?</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass border-0">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <Key className="text-cyan-400" size={20} />
                  </div>
                  <CardTitle className="font-display text-lg">Server Identity</CardTitle>
                </div>
                <CardDescription>
                  MCP servers get a quantum-safe DID. Clients cryptographically verify they&apos;re talking to the real server — not an impostor.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground/70">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Mutual authentication (mTLS + DID)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Server verifiable credentials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Post-quantum secure by default</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="glass border-0">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Shield className="text-blue-400" size={20} />
                  </div>
                  <CardTitle className="font-display text-lg">Tool Authorization</CardTitle>
                </div>
                <CardDescription>
                  Fine-grained policies decide which agents can call which MCP tools, based on trust level and verifiable credentials.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground/70">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Per-tool RBAC policies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Trust-score gating</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Context-aware conditions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="glass border-0">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <Activity className="text-purple-400" size={20} />
                  </div>
                  <CardTitle className="font-display text-lg">Full Auditability</CardTitle>
                </div>
                <CardDescription>
                  Every MCP tool call produces a HMAC-signed, hash-chained audit record. Tamper-evident and compliance-ready.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground/70">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Who called what and when</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>AES-256-GCM encrypted at rest</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>IPFS-anchored (optional)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quick Start */}
        <section className="mb-16">
          <h2 className="font-display text-3xl font-light mb-8 text-center">
            <span className="atp-gradient-text">Quick Start</span>
          </h2>
          <Tabs defaultValue="server" className="space-y-6">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 glass border-0">
              <TabsTrigger value="server">MCP Server</TabsTrigger>
              <TabsTrigger value="client">MCP Client</TabsTrigger>
              <TabsTrigger value="policy">Tool Policy</TabsTrigger>
            </TabsList>

            <TabsContent value="server">
              <Card className="glass border-0">
                <CardHeader>
                  <CardTitle className="font-display">Secure an MCP Server</CardTitle>
                  <CardDescription>Register your MCP server with a quantum-safe identity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-black/60 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                    <pre className="text-blue-300">{`import { ATPClient } from 'atp-sdk';
import { registerAgentWithAtp, secureTools } from '@atpdevelopment/openclaw-atp';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const atp = new ATPClient({ url: process.env.ATP_URL });

// Register the MCP server as an ATP agent with a DID
const { did, trustScore } = await registerAgentWithAtp(atp, {
  name: 'filesystem-mcp-server',
  role: 'mcp-server',
  trustLevel: 'high',
  capabilities: ['file_read', 'file_write', 'directory_list']
});

const server = new Server({ name: 'filesystem', version: '1.0.0' }, {
  capabilities: { tools: {} }
});

// ATP-secured tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // ATP enforces policy before the tool runs
  await atp.enforceToolPolicy(did, request.params.name, {
    requiredTrustLevel: 0.6,
    auditLevel: 'full'
  });

  // ... your tool implementation
});`}</pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="client">
              <Card className="glass border-0">
                <CardHeader>
                  <CardTitle className="font-display">Verify MCP Server Identity</CardTitle>
                  <CardDescription>Cryptographically verify the server before trusting its tools</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-black/60 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                    <pre className="text-blue-300">{`import { ATPClient } from 'atp-sdk';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const atp = new ATPClient({ url: process.env.ATP_URL });

// Connect to MCP server
const client = new Client({ name: 'my-agent', version: '1.0.0' }, {
  capabilities: {}
});

await client.connect(transport);

// Verify the server's DID before trusting any tools
const serverDid = await client.getServerInfo(); // returns server's DID
const verification = await atp.verifyAgent(serverDid.did);

if (!verification.valid || verification.trustScore < 0.7) {
  throw new Error(\`MCP server not trusted: score=\${verification.trustScore}\`);
}

console.log('✅ Server verified:', serverDid.did);
console.log('Trust score:', verification.trustScore);`}</pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="policy">
              <Card className="glass border-0">
                <CardHeader>
                  <CardTitle className="font-display">Define Tool-Level Policies</CardTitle>
                  <CardDescription>Control which agents can call which MCP tools</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-black/60 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                    <pre className="text-blue-300">{`// Define ATP policy profiles for your MCP tools
import { ATPPolicyProfile } from '@atpdevelopment/openclaw-atp';

const mcpPolicy = {
  // Read-only tools: any verified agent allowed
  'file_read': {
    requiredTrustLevel: 0.5,
    requiresAuth: true,
    rateLimit: { maxRequests: 1000, windowMs: 60_000 }
  },
  // Write tools: high-trust agents only, MFA required
  'file_write': {
    requiredTrustLevel: 0.8,
    requiresAuth: true,
    requiresMFA: true,
    rateLimit: { maxRequests: 100, windowMs: 60_000 }
  },
  // Destructive tools: critical trust + explicit approval
  'delete_file': {
    requiredTrustLevel: 0.95,
    requiresAuth: true,
    requiresMFA: true,
    requiresApproval: true,
    rateLimit: { maxRequests: 10, windowMs: 3_600_000 }
  }
};`}</pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* Resources */}
        <section className="mb-8">
          <h2 className="font-display text-3xl font-light mb-8 text-center">
            <span className="atp-gradient-text">Resources</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/docs">
              <Card className="glass border-0 hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <Code size={24} className="text-blue-400 mb-2" />
                  <CardTitle className="font-display text-lg">Full Documentation</CardTitle>
                  <CardDescription>Complete API reference and integration guides</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-primary text-sm flex items-center gap-1">
                    Read docs <ArrowRight size={12} />
                  </span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/playground">
              <Card className="glass border-0 hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <Zap size={24} className="text-yellow-400 mb-2" />
                  <CardTitle className="font-display text-lg">Live Playground</CardTitle>
                  <CardDescription>Test ATP policy enforcement in your browser</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-primary text-sm flex items-center gap-1">
                    Open playground <ArrowRight size={12} />
                  </span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/integrations/langchain">
              <Card className="glass border-0 hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <Network size={24} className="text-green-400 mb-2" />
                  <CardTitle className="font-display text-lg">LangChain Integration</CardTitle>
                  <CardDescription>Combine MCP + LangChain with ATP security</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-primary text-sm flex items-center gap-1">
                    View guide <ArrowRight size={12} />
                  </span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
