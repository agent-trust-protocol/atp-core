import Link from 'next/link';
import {
  Shield,
  Users,
  Zap,
  Code,
  ArrowRight,
  CheckCircle,
  Terminal,
  Lock,
  AlertTriangle,
  Download,
  ExternalLink,
  FileText,
  PlayCircle,
  TrendingUp,
  Network,
  Key,
  Activity,
  Eye,
  Database,
  Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ATP Runtime Guard for OpenClaw — Agent Trust Protocol™',
  description: 'ATP Runtime Guard secures your OpenClaw multi-agent systems with quantum-safe cryptography, agent identity, tool-level security, graph validation, and dynamic trust scoring.',
  keywords: [
    'OpenClaw integration',
    'multi-agent security',
    'quantum-safe agents',
    'LangChain security',
    'CrewAI security',
    'agent trust protocol',
    'agent graph validation',
    'tool-level security',
    'agent identity'
  ]
};

export default function OpenClawIntegrationPage() {
  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="flex items-center justify-center mb-6 animate-fade-in-up">
            <div className="relative w-20 h-20 mb-4 atp-quantum-glow rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
              <Users size={40} className="text-primary animate-in zoom-in-50 duration-1000" />
            </div>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extralight mb-6 animate-fade-in-up">
            <span className="atp-gradient-text">ATP Runtime Guard</span> for OpenClaw
          </h1>
          <p className="text-lg sm:text-xl text-foreground/80 mb-8 max-w-4xl mx-auto leading-relaxed animate-fade-in-up">
            Drop ATP&apos;s runtime guard into your <span className="atp-gradient-text font-medium">OpenClaw workflows</span> to add
            quantum-safe cryptography, tool-level security, and dynamic trust scoring.
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
              <Network size={14} className="mr-2" />
              Graph Validation
            </Badge>
            <Badge className="text-sm px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300/40 font-semibold">
              <TrendingUp size={14} className="mr-2" />
              Dynamic Trust Scoring
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up">
            <Link href="/docs">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg">
                <Download size={16} className="mr-2" />
                Get Started
              </Button>
            </Link>
            <Link href="https://github.com/agent-trust-protocol/core/tree/main/packages/openclaw-atp" target="_blank">
              <Button variant="outline" size="lg" className="border-2 border-foreground/20 text-foreground bg-background/80 hover:bg-accent hover:text-accent-foreground font-semibold">
                <ExternalLink size={16} className="mr-2" />
                View on GitHub
              </Button>
            </Link>
          </div>
        </div>

        {/* Architecture Overview */}
        <section className="mb-16">
          <h2 className="font-display text-3xl font-light mb-8 text-center">
            <span className="atp-gradient-text">Architecture</span>
          </h2>
          <Card className="glass border-0 mb-8">
            <CardHeader>
              <CardTitle className="font-display text-xl">Layered Security Approach</CardTitle>
              <CardDescription>
                ATP wraps every layer of your OpenClaw system with quantum-safe security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black/40 rounded-lg p-6 font-mono text-xs sm:text-sm overflow-x-auto">
                <pre className="text-blue-300">{`┌─────────────────────────────────────────────────────────┐
│                 OpenClaw Agent Crew                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Agent A │──│  Agent B │──│  Agent C │             │
│  │ (DID:..1)│  │ (DID:..2)│  │ (DID:..3)│             │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘             │
└────────┼─────────────┼─────────────┼───────────────────┘
         │             │             │
         ▼             ▼             ▼
┌─────────────────────────────────────────────────────────┐
│             ATP OpenClaw Security Layer               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Agent   │  │   Tool   │  │  Graph   │             │
│  │  Wrapper │  │  Wrapper │  │ Validator│             │
│  └──────────┘  └──────────┘  └──────────┘             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Policy  │  │ Monitor  │  │ Secrets  │             │
│  │  Engine  │  │  +Lunary │  │  Manager │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │     ATP Core SDK      │
         │  - Identity Service   │
         │  - Trust Scoring      │
         │  - Audit Logging      │
         └───────────────────────┘`}</pre>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Key Features */}
        <section className="mb-16">
          <h2 className="font-display text-3xl font-light mb-8 text-center">
            <span className="atp-gradient-text">Key Features</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Key className="text-blue-400" size={20} />
                  </div>
                  <CardTitle className="font-display text-lg">Quantum-Safe Identities</CardTitle>
                </div>
                <CardDescription>
                  Every agent gets a cryptographic DID with hybrid Ed25519 + Dilithium3 signatures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground/70">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Post-quantum secure by default</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Decentralized identity (DID)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Automatic key rotation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <Lock className="text-purple-400" size={20} />
                  </div>
                  <CardTitle className="font-display text-lg">Tool-Level Security</CardTitle>
                </div>
                <CardDescription>
                  ATP intercepts every tool call with 5-step validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground/70">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Authentication checks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Trust level validation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Permission verification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Rate limiting & DLP</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <Network className="text-green-400" size={20} />
                  </div>
                  <CardTitle className="font-display text-lg">Graph Validation</CardTitle>
                </div>
                <CardDescription>
                  Policy-based constraints on agent interactions before execution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground/70">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Cycle detection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Chain depth limits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Data flow policies</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <TrendingUp className="text-yellow-400" size={20} />
                  </div>
                  <CardTitle className="font-display text-lg">Dynamic Trust Scoring</CardTitle>
                </div>
                <CardDescription>
                  Agent trust levels adjust based on behavior and success rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground/70">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>0.0-1.0 trust scores</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Automatic adjustments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Trust-based access control</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <Eye className="text-cyan-400" size={20} />
                  </div>
                  <CardTitle className="font-display text-lg">Observability</CardTitle>
                </div>
                <CardDescription>
                  Integration with Lunary for metrics and anomaly detection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground/70">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Real-time monitoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Anomaly detection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Automatic trust updates</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="glass border-0 atp-trust-indicator">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <Database className="text-red-400" size={20} />
                  </div>
                  <CardTitle className="font-display text-lg">Secret Management</CardTitle>
                </div>
                <CardDescription>
                  Short-lived, scoped credentials for external services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground/70">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Time-limited tokens</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Scope-based access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Automatic rotation</span>
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
              <TabsTrigger value="install">Installation</TabsTrigger>
              <TabsTrigger value="basic">Basic Setup</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="install" className="space-y-4">
              <Card className="glass border-0">
                <CardHeader>
                  <CardTitle className="font-display">Install Package</CardTitle>
                  <CardDescription>Add ATP Runtime Guard to your OpenClaw project</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-black/60 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                    <pre className="text-green-300">
{`npm install @atp/openclaw-atp atp-sdk

# or with yarn
yarn add @atp/openclaw-atp atp-sdk

# or with pnpm
pnpm add @atp/openclaw-atp atp-sdk`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="basic" className="space-y-4">
              <Card className="glass border-0">
                <CardHeader>
                  <CardTitle className="font-display">Basic Integration</CardTitle>
                  <CardDescription>Register agents and secure tools in 3 steps</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-black/60 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                    <pre className="text-blue-300">
{`import { OpenClawATPClient } from '@atp/openclaw-atp';
import { OpenClaw } from 'openclaw';

// 1. Initialize ATP client
const atpClient = new OpenClawATPClient({
  atpServiceUrl: 'http://localhost:3000',
  profile: 'strictDev',
  enableMonitoring: true
});

await atpClient.initialize();

// 2. Register agent
const { agent, registration } = await atpClient.registerAgent(
  motleyAgent,
  {
    name: 'trader-agent',
    capabilities: ['trading', 'analysis'],
    trustLevel: 'high'
  }
);

console.log('Agent DID:', registration.did);
console.log('Trust score:', registration.trustScore);

// 3. Validate crew
const crew = new OpenClaw();
crew.add_agent(agent);

const validation = await atpClient.validateCrew(crew);
if (!validation.isValid) {
  throw new Error('Validation failed');
}

// Run secured workflow
const result = await crew.run('Execute trading strategy');`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <Card className="glass border-0">
                <CardHeader>
                  <CardTitle className="font-display">Advanced Configuration</CardTitle>
                  <CardDescription>Custom policies, monitoring, and secret management</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-black/60 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                    <pre className="text-purple-300">
{`import { 
  ATPPolicyProfile, 
  ATPMonitor,
  ATPSecretManager 
} from '@atp/openclaw-atp';

// Custom policy profile
const customPolicy = new ATPPolicyProfile({
  minTrustLevel: 0.85,
  allowCycles: false,
  maxChainDepth: 6,
  customRules: [
    {
      condition: (agent) => agent.capabilities.includes('trading'),
      constraint: { requiredTrust: 0.95, requireMFA: true }
    }
  ]
});

// Set up monitoring
const monitor = new ATPMonitor(atpClient.atpClient);
monitor.recordToolCall(agentDid, {
  tool: 'execute_trade',
  success: true,
  latency: 250
});

// Anomaly detection
const anomalies = monitor.detectAnomalies(agentDid);
if (anomalies.hasAnomalies) {
  console.warn('Anomalies detected:', anomalies.indicators);
}

// Secret management
const secretManager = new ATPSecretManager(atpClient.atpClient);
const token = await secretManager.getSecret('api-key', {
  agentDid,
  scope: 'trading:execute',
  ttl: 3600 // 1 hour
});`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* Security Profiles */}
        <section className="mb-16">
          <h2 className="font-display text-3xl font-light mb-8 text-center">
            <span className="atp-gradient-text">Pre-Configured Security Profiles</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="font-display text-lg">strictDev</CardTitle>
                <CardDescription>Development and testing environment</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground/70">
                  <li className="flex items-center gap-2">
                    <span className="text-foreground/40">Min trust:</span>
                    <Badge variant="outline" className="text-xs">0.6</Badge>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-foreground/40">Allow cycles:</span>
                    <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/20 text-green-400">Yes</Badge>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-foreground/40">Max depth:</span>
                    <Badge variant="outline" className="text-xs">10</Badge>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="font-display text-lg">productionFinance</CardTitle>
                <CardDescription>High-security financial applications</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground/70">
                  <li className="flex items-center gap-2">
                    <span className="text-foreground/40">Min trust:</span>
                    <Badge variant="outline" className="text-xs bg-red-500/10 border-red-500/20 text-red-400">0.95</Badge>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-foreground/40">Require MFA:</span>
                    <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/20 text-green-400">Yes</Badge>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-foreground/40">Allow cycles:</span>
                    <Badge variant="outline" className="text-xs bg-red-500/10 border-red-500/20 text-red-400">No</Badge>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-foreground/40">Max depth:</span>
                    <Badge variant="outline" className="text-xs">5</Badge>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="font-display text-lg">piiWorkflow</CardTitle>
                <CardDescription>GDPR/CCPA compliant workflows</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground/70">
                  <li className="flex items-center gap-2">
                    <span className="text-foreground/40">Min trust:</span>
                    <Badge variant="outline" className="text-xs">0.9</Badge>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-foreground/40">Require consent:</span>
                    <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/20 text-green-400">Yes</Badge>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-foreground/40">Data minimization:</span>
                    <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/20 text-green-400">Yes</Badge>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-foreground/40">Allow sharing:</span>
                    <Badge variant="outline" className="text-xs bg-red-500/10 border-red-500/20 text-red-400">No</Badge>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="font-display text-lg">researchWorkflow</CardTitle>
                <CardDescription>Balanced security for research and exploration</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground/70">
                  <li className="flex items-center gap-2">
                    <span className="text-foreground/40">Min trust:</span>
                    <Badge variant="outline" className="text-xs">0.7</Badge>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-foreground/40">Allow cycles:</span>
                    <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/20 text-green-400">Yes</Badge>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-foreground/40">Max depth:</span>
                    <Badge variant="outline" className="text-xs">8</Badge>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Use Cases */}
        <section className="mb-16">
          <h2 className="font-display text-3xl font-light mb-8 text-center">
            <span className="atp-gradient-text">Use Cases</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="font-display text-lg">Financial Trading</CardTitle>
                <CardDescription>Secure multi-agent trading systems</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70 mb-4">
                  Build trading crews with researcher, trader, and compliance agents.
                  ATP ensures only trusted agents can execute trades, with full audit trails.
                </p>
                <Link href="/docs">
                  <Button variant="outline" size="sm" className="glass w-full">
                    <FileText size={14} className="mr-2" />
                    View Example
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="font-display text-lg">Customer Service</CardTitle>
                <CardDescription>Multi-tiered support automation</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70 mb-4">
                  Create support crews with triage, specialist, and escalation agents.
                  Trust scores determine which agents handle sensitive customer data.
                </p>
                <Link href="/docs">
                  <Button variant="outline" size="sm" className="glass w-full">
                    <FileText size={14} className="mr-2" />
                    View Example
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="glass border-0">
              <CardHeader>
                <CardTitle className="font-display text-lg">Research & Analysis</CardTitle>
                <CardDescription>Collaborative research workflows</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70 mb-4">
                  Build research crews with data collectors, analyzers, and report generators.
                  Graph validation prevents infinite loops and ensures data integrity.
                </p>
                <Link href="/docs">
                  <Button variant="outline" size="sm" className="glass w-full">
                    <FileText size={14} className="mr-2" />
                    View Example
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Why ATP Runtime Guard for OpenClaw */}
        <section className="mb-16">
          <h2 className="font-display text-3xl font-light mb-4 text-center">
            <span className="atp-gradient-text">Why ATP Runtime Guard?</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="glass border-0">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <Key className="text-cyan-400" size={20} />
                  </div>
                  <CardTitle className="font-display text-base">Cryptographic Agent Identity</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70">
                  ATP Runtime Guard gives every OpenClaw agent a cryptographic DID, so every action is
                  attributable, verifiable, and auditable — not just assumed.
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-0">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <Shield className="text-purple-400" size={20} />
                  </div>
                  <CardTitle className="font-display text-base">Quantum-Safe by Default</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70">
                  ATP wraps OpenClaw agent communications with ML-DSA (Dilithium) signatures,
                  future-proofing your workflows against quantum threats without code changes.
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-0">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <TrendingUp className="text-green-400" size={20} />
                  </div>
                  <CardTitle className="font-display text-base">Trust Without Blind Faith</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70">
                  ATP&apos;s dynamic trust scoring lets your OpenClaw workflows adapt in real time —
                  restricting low-trust agents, elevating proven ones, automatically.
                </p>
              </CardContent>
            </Card>
          </div>
          <p className="text-center text-foreground/60 text-sm italic">
            OpenClaw handles the &quot;how&quot; of multi-agent work. ATP Runtime Guard handles the &quot;who&quot; and &quot;should they&quot;.
          </p>
        </section>

        {/* Resources */}
        <section className="mb-16">
          <h2 className="font-display text-3xl font-light mb-8 text-center">
            <span className="atp-gradient-text">Resources</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/docs">
              <Card className="glass border-0 hover:border-primary/20 transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="text-primary" size={20} />
                    <CardTitle className="font-display text-base">Documentation</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Complete integration guide with examples
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="https://github.com/agent-trust-protocol/core/tree/main/packages/openclaw-atp" target="_blank">
              <Card className="glass border-0 hover:border-primary/20 transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="text-primary" size={20} />
                    <CardTitle className="font-display text-base">GitHub</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Source code and examples
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/api-reference">
              <Card className="glass border-0 hover:border-primary/20 transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal className="text-primary" size={20} />
                    <CardTitle className="font-display text-base">API Reference</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Full API documentation
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/examples">
              <Card className="glass border-0 hover:border-primary/20 transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <PlayCircle className="text-primary" size={20} />
                    <CardTitle className="font-display text-base">Examples</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Working code examples
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/integrations/openclaw/agents">
              <Card className="glass border-0 hover:border-primary/20 transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="text-primary" size={20} />
                    <CardTitle className="font-display text-base">Live Agents</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    View registered agents, trust scores, and session policy
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Card className="glass border-0 bg-gradient-to-br from-primary/5 to-purple-500/5">
            <CardHeader>
              <CardTitle className="font-display text-2xl sm:text-3xl">
                Ready to Secure Your Multi-Agent System?
              </CardTitle>
              <CardDescription className="text-base">
                Install ATP Runtime Guard and add quantum-safe security to your OpenClaw agents in minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/docs">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg">
                  <Rocket size={16} className="mr-2" />
                  Get Started
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="border-2 border-foreground/20 text-foreground bg-background/80 hover:bg-accent hover:text-accent-foreground font-semibold">
                  <Users size={16} className="mr-2" />
                  Talk to Us
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
