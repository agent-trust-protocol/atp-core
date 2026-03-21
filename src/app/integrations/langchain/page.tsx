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
  GitBranch,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ATP Security for LangChain — Agent Trust Protocol',
  description: 'Secure your LangChain agents and chains with quantum-safe cryptography, agent identity, tool-level security, and dynamic trust scoring from Agent Trust Protocol.',
  keywords: [
    'LangChain security',
    'LangChain ATP',
    'quantum-safe LangChain',
    'agent trust protocol LangChain',
    'LangChain tool security',
    'agent identity LangChain',
    'LangGraph security',
    'LangChain audit logging'
  ]
};

export default function LangChainIntegrationPage() {
  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">

        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="flex items-center justify-center mb-6 animate-fade-in-up">
            <div className="relative w-20 h-20 mb-4 atp-quantum-glow rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
              <GitBranch size={40} className="text-green-400 animate-in zoom-in-50 duration-1000" />
            </div>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extralight mb-6 animate-fade-in-up">
            <span className="atp-gradient-text">ATP Security</span> for LangChain
          </h1>
          <p className="text-lg sm:text-xl text-foreground/80 mb-8 max-w-4xl mx-auto leading-relaxed animate-fade-in-up">
            Add quantum-safe agent identity, tool-level access control, and immutable audit logging to your
            <span className="atp-gradient-text font-medium"> LangChain agents and LangGraph workflows</span> in minutes.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8 animate-fade-in-up">
            <Badge className="text-sm px-4 py-2 atp-trust-high border-0 font-semibold">
              <Shield size={14} className="mr-2" />
              Quantum-Safe Identities
            </Badge>
            <Badge className="text-sm px-4 py-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300/40 font-semibold">
              <Lock size={14} className="mr-2" />
              Tool-Level Security
            </Badge>
            <Badge className="text-sm px-4 py-2 bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-300/40 font-semibold">
              <Layers size={14} className="mr-2" />
              LangGraph Support
            </Badge>
            <Badge className="text-sm px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300/40 font-semibold">
              <Activity size={14} className="mr-2" />
              Audit Logging
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

        {/* Why ATP + LangChain */}
        <section className="mb-16">
          <h2 className="font-display text-3xl font-light mb-8 text-center">
            <span className="atp-gradient-text">Why ATP + LangChain?</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass border-0">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <Key className="text-green-400" size={20} />
                  </div>
                  <CardTitle className="font-display text-lg">Agent Identity</CardTitle>
                </div>
                <CardDescription>
                  Every LangChain agent gets a cryptographic DID. No more anonymous chains — every action is attributable.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground/70">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Ed25519 + ML-DSA hybrid keys</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>W3C DID standard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Verifiable credentials</span>
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
                  <CardTitle className="font-display text-lg">Tool Guardrails</CardTitle>
                </div>
                <CardDescription>
                  Wrap LangChain tools with ATP security. Every tool call is auth-checked, rate-limited, and logged.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground/70">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Per-call authorization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Policy-based execution</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Redis-backed rate limiting</span>
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
                  <CardTitle className="font-display text-lg">Immutable Audit</CardTitle>
                </div>
                <CardDescription>
                  Chain-linked audit log for every agent action. HMAC-signed, optionally IPFS-anchored.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground/70">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Hash-chained event log</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Tamper-evident records</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Compliance-ready exports</span>
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
          <Tabs defaultValue="install" className="space-y-6">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 glass border-0">
              <TabsTrigger value="install">Install</TabsTrigger>
              <TabsTrigger value="agent">Secure Agent</TabsTrigger>
              <TabsTrigger value="tools">Secure Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="install">
              <Card className="glass border-0">
                <CardHeader>
                  <CardTitle className="font-display">Installation</CardTitle>
                  <CardDescription>Add ATP to your LangChain project</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-black/60 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                    <pre className="text-green-300">{`npm install atp-sdk @atpdevelopment/openclaw-atp

# or with yarn
yarn add atp-sdk @atpdevelopment/openclaw-atp

# LangChain peer deps (if not already installed)
npm install langchain @langchain/core @langchain/openai`}</pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agent">
              <Card className="glass border-0">
                <CardHeader>
                  <CardTitle className="font-display">Register a LangChain Agent</CardTitle>
                  <CardDescription>Give your agent a quantum-safe identity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-black/60 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                    <pre className="text-blue-300">{`import { ATPClient } from 'atp-sdk';
import { registerAgentWithAtp } from '@atpdevelopment/openclaw-atp';
import { AgentExecutor } from 'langchain/agents';

const atp = new ATPClient({ url: process.env.ATP_URL });

// Register your LangChain agent with a quantum-safe DID
const { did, trustScore } = await registerAgentWithAtp(atp, {
  name: 'research-agent',
  role: 'researcher',
  trustLevel: 'standard',
  capabilities: ['web_search', 'summarize']
});

console.log('Agent DID:', did);
// did:atp:z6Mk...  (quantum-safe Ed25519 + ML-DSA)

console.log('Trust Score:', trustScore);
// 0.82 — starts high, adjusts dynamically`}</pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tools">
              <Card className="glass border-0">
                <CardHeader>
                  <CardTitle className="font-display">Secure LangChain Tools</CardTitle>
                  <CardDescription>Wrap tools with ATP auth, rate limiting, and audit</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-black/60 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                    <pre className="text-blue-300">{`import { secureTools } from '@atpdevelopment/openclaw-atp';
import { WebBrowser, Calculator } from 'langchain/tools';

const rawTools = [new WebBrowser(), new Calculator()];

// Wrap every tool with ATP guardrails
const securedTools = secureTools(did, rawTools, atp, {
  requiredTrustLevel: 0.5,
  requiresAuth: true,
  rateLimit: { maxRequests: 100, windowMs: 60_000 },
  auditLevel: 'full'   // every call logged to immutable audit
});

// Drop-in replacement — use exactly like normal LangChain tools
const agent = await createReactAgent({
  llm,
  tools: securedTools,   // ← secured tools here
  prompt
});`}</pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* LangGraph Support */}
        <section className="mb-16">
          <h2 className="font-display text-3xl font-light mb-8 text-center">
            <span className="atp-gradient-text">LangGraph Support</span>
          </h2>
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="font-display text-xl">
                <Network size={20} className="inline mr-2 text-purple-400" />
                Enforce Policies Per State Node
              </CardTitle>
              <CardDescription>
                ATP integrates with LangGraph&apos;s state machine model — different tools allowed per graph state
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black/60 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                <pre className="text-blue-300">{`import { StateGraph } from '@langchain/langgraph';
import { enforceAtpPoliciesForClawSession } from '@atpdevelopment/openclaw-atp';

const graph = new StateGraph({ channels: agentState });

// Attach ATP policy enforcement to each node transition
graph.addNode('research', async (state) => {
  await enforceAtpPoliciesForClawSession(
    { agentDid: did, state: 'executing', requestedTools: ['web_search'] },
    atp
  );
  return researchNode(state);
});

graph.addNode('write', async (state) => {
  await enforceAtpPoliciesForClawSession(
    { agentDid: did, state: 'communicating', requestedTools: ['file_write'] },
    atp
  );
  return writeNode(state);
});`}</pre>
              </div>
            </CardContent>
          </Card>
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
                  <CardDescription>Complete API reference and guides</CardDescription>
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
                  <CardDescription>Try ATP with LangChain in your browser</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-primary text-sm flex items-center gap-1">
                    Open playground <ArrowRight size={12} />
                  </span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/integrations/openclaw">
              <Card className="glass border-0 hover:scale-105 transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <TrendingUp size={24} className="text-green-400 mb-2" />
                  <CardTitle className="font-display text-lg">OpenClaw Integration</CardTitle>
                  <CardDescription>Full multi-agent framework support</CardDescription>
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
