/* eslint-disable max-len, no-undef */
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Terminal,
  Code2,
  Zap,
  Shield,
  Users,
  Lock,
  Trash2,
  BookOpen,
  Sparkles
} from 'lucide-react';

// ─── Simulated ATP Runtime ──────────────────────────────────────────────

interface LogEntry {
  type: 'log' | 'info' | 'warn' | 'error' | 'success' | 'system'
  message: string
  timestamp: number
}

function generateDID(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 32; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return `did:atp:${id}`;
}

function generateKeyPair(): { publicKey: string; algorithm: string } {
  const hex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return { publicKey: `0x${hex}`, algorithm: 'Ed25519+Dilithium3' };
}

function generateSignature(): string {
  return Array.from({ length: 128 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

// eslint-disable-next-line no-unused-vars
async function executeCode(code: string, addLog: (_entry: Omit<LogEntry, 'timestamp'>) => void): Promise<void> {
  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  // Parse which example is being run based on code content
  if (code.includes('Agent.create') || code.includes('registerAgent')) {
    addLog({ type: 'system', message: '⚡ Initializing ATP Runtime v1.2.0...' });
    await delay(400);
    addLog({ type: 'info', message: '🔐 Generating quantum-safe keypair (Ed25519 + Dilithium3)...' });
    await delay(600);
    const keys = generateKeyPair();
    addLog({ type: 'log', message: `   Public Key: ${keys.publicKey.slice(0, 40)}...` });
    addLog({ type: 'log', message: `   Algorithm: ${keys.algorithm}` });
    await delay(300);

    const did = generateDID();
    addLog({ type: 'success', message: '✅ Agent created successfully!' });
    addLog({ type: 'log', message: `   DID: ${did}` });
    addLog({ type: 'log', message: '   Trust Level: basic (score: 50)' });
    addLog({ type: 'log', message: '   Quantum Safe: true' });
    await delay(200);

    if (code.includes('capabilities')) {
      addLog({ type: 'info', message: '📋 Registering capabilities: [read, write, analyze]' });
      await delay(200);
      addLog({ type: 'success', message: '✅ Capabilities registered' });
    }

    addLog({ type: 'system', message: `⏱  Completed in ${(Math.random() * 20 + 5).toFixed(1)}ms` });
  }

  else if (code.includes('trust') && (code.includes('evaluate') || code.includes('getScore') || code.includes('Trust'))) {
    addLog({ type: 'system', message: '⚡ ATP Trust Evaluation Engine' });
    await delay(300);
    const did = generateDID();
    addLog({ type: 'info', message: `🔍 Evaluating trust for agent ${did.slice(0, 24)}...` });
    await delay(500);

    const factors = [
      { name: 'Behavioral History', score: 85, weight: 0.3 },
      { name: 'Credential Verification', score: 92, weight: 0.25 },
      { name: 'Interaction Success Rate', score: 88, weight: 0.2 },
      { name: 'Policy Compliance', score: 95, weight: 0.15 },
      { name: 'Peer Endorsements', score: 78, weight: 0.1 }
    ];

    addLog({ type: 'log', message: '   ┌─────────────────────────────────────────────┐' });
    addLog({ type: 'log', message: '   │  Factor                    Score   Weight   │' });
    addLog({ type: 'log', message: '   ├─────────────────────────────────────────────┤' });
    for (const f of factors) {
      await delay(200);
      const bar = '█'.repeat(Math.floor(f.score / 10)) + '░'.repeat(10 - Math.floor(f.score / 10));
      addLog({ type: 'log', message: `   │  ${f.name.padEnd(25)} ${bar} ${f.score}  ${f.weight.toFixed(2)} │` });
    }
    addLog({ type: 'log', message: '   └─────────────────────────────────────────────┘' });
    await delay(300);

    const total = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
    addLog({ type: 'success', message: `✅ Trust Score: ${total.toFixed(1)} / 100` });
    addLog({ type: 'success', message: '   Trust Level: VERIFIED ⬆ (promoted from basic)' });
    addLog({ type: 'log', message: '   Next Level: trusted (requires score ≥ 90)' });
    addLog({ type: 'system', message: `⏱  Evaluated in ${(Math.random() * 15 + 8).toFixed(1)}ms` });
  }

  else if (code.includes('sign') || code.includes('verify') || code.includes('Signature')) {
    addLog({ type: 'system', message: '⚡ ATP Quantum-Safe Signature Engine' });
    await delay(300);
    addLog({ type: 'info', message: '🔐 Generating hybrid signature (Ed25519 + Dilithium3)...' });
    await delay(500);

    const sig = generateSignature();
    addLog({ type: 'log', message: `   Ed25519 component:   ${sig.slice(0, 48)}...` });
    await delay(200);
    addLog({ type: 'log', message: `   Dilithium3 component: ${sig.slice(48, 96)}...` });
    await delay(200);
    addLog({ type: 'log', message: `   Combined length: ${sig.length * 2} bytes` });
    await delay(400);

    addLog({ type: 'info', message: '🔍 Verifying signature...' });
    await delay(300);
    addLog({ type: 'success', message: '✅ Ed25519 verification: PASSED' });
    await delay(200);
    addLog({ type: 'success', message: '✅ Dilithium3 verification: PASSED' });
    await delay(200);
    addLog({ type: 'success', message: '✅ Hybrid verification: PASSED (quantum-safe)' });
    addLog({ type: 'log', message: '   Signature is valid and quantum-resistant' });
    addLog({ type: 'system', message: `⏱  Signed + verified in ${(Math.random() * 8 + 3).toFixed(1)}ms` });
  }

  else if (code.includes('Motleycrew') || code.includes('motleycrew') || code.includes('crew')) {
    addLog({ type: 'system', message: '⚡ ATP × Motleycrew Integration' });
    await delay(300);

    const agents = ['ResearchAgent', 'AnalysisAgent', 'WriterAgent'];
    for (const name of agents) {
      const did = generateDID();
      addLog({ type: 'info', message: `🤖 Registering ${name}...` });
      await delay(300);
      addLog({ type: 'log', message: `   DID: ${did.slice(0, 30)}...` });
      addLog({ type: 'success', message: `   ✅ ${name} registered (trust: basic)` });
      await delay(150);
    }

    await delay(300);
    addLog({ type: 'info', message: '🔗 Validating agent graph...' });
    await delay(400);
    addLog({ type: 'log', message: '   ResearchAgent → AnalysisAgent  ✅ allowed' });
    await delay(150);
    addLog({ type: 'log', message: '   AnalysisAgent → WriterAgent    ✅ allowed' });
    await delay(150);
    addLog({ type: 'log', message: '   WriterAgent → ResearchAgent    ⚠ cycle detected (allowed by policy)' });
    await delay(300);

    addLog({ type: 'info', message: '🛡️ Applying security policy: production-finance...' });
    await delay(300);
    addLog({ type: 'log', message: '   Tool access controls: ENABLED' });
    addLog({ type: 'log', message: '   DLP scanning: ENABLED' });
    addLog({ type: 'log', message: '   Audit logging: ENABLED' });
    await delay(200);

    addLog({ type: 'info', message: '🚀 Executing workflow...' });
    await delay(500);
    addLog({ type: 'log', message: '   [ResearchAgent] Calling tool "web_search" → ✅ authorized' });
    await delay(300);
    addLog({ type: 'log', message: '   [AnalysisAgent] Calling tool "data_analysis" → ✅ authorized' });
    await delay(300);
    addLog({ type: 'log', message: '   [WriterAgent] Calling tool "file_write" → ✅ authorized' });
    await delay(200);

    addLog({ type: 'success', message: '✅ Workflow completed successfully!' });
    addLog({ type: 'log', message: '   3 agents | 3 tools | 0 policy violations | 6 audit events' });
    addLog({ type: 'system', message: `⏱  Total workflow time: ${(Math.random() * 200 + 50).toFixed(0)}ms` });
  }

  else if (code.includes('policy') || code.includes('Policy') || code.includes('permission')) {
    addLog({ type: 'system', message: '⚡ ATP Policy Evaluation Engine' });
    await delay(300);

    addLog({ type: 'info', message: '📜 Loading policy: enterprise-default...' });
    await delay(300);
    addLog({ type: 'log', message: '   Rules loaded: 12' });
    addLog({ type: 'log', message: '   Conditions: 8' });
    addLog({ type: 'log', message: '   Obligations: 3' });
    await delay(300);

    const requests = [
      { action: 'read', resource: 'customer-data', result: true },
      { action: 'write', resource: 'financial-records', result: true },
      { action: 'delete', resource: 'audit-logs', result: false },
      { action: 'execute', resource: 'external-api', result: true }
    ];

    addLog({ type: 'info', message: '🔍 Evaluating access requests...' });
    await delay(200);

    for (const req of requests) {
      await delay(300);
      if (req.result) {
        addLog({ type: 'success', message: `   ✅ ${req.action.toUpperCase()} ${req.resource} → PERMIT` });
      } else {
        addLog({ type: 'error', message: `   ❌ ${req.action.toUpperCase()} ${req.resource} → DENY (immutable resource)` });
      }
    }

    await delay(200);
    addLog({ type: 'info', message: '📊 Policy evaluation summary:' });
    addLog({ type: 'log', message: '   Permitted: 3 | Denied: 1 | Obligations triggered: 2' });
    addLog({ type: 'log', message: '   Obligation: "log_access" → audit event created' });
    addLog({ type: 'log', message: '   Obligation: "notify_admin" → alert sent for denied request' });
    addLog({ type: 'system', message: `⏱  Evaluated in ${(Math.random() * 5 + 2).toFixed(1)}ms` });
  }

  else if (code.includes('audit') || code.includes('Audit') || code.includes('blockchain')) {
    addLog({ type: 'system', message: '⚡ ATP Blockchain Audit System' });
    await delay(300);

    addLog({ type: 'info', message: '📝 Creating audit entries...' });
    await delay(400);

    const events = [
      'agent-registered',
      'tool-execution-success',
      'trust-level-promoted',
      'policy-evaluation-permit'
    ];

    for (const evt of events) {
      await delay(250);
      const hash = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      addLog({ type: 'log', message: `   Block #${Math.floor(Math.random() * 9000 + 1000)} | ${evt} | hash: ${hash}...` });
    }

    await delay(300);
    addLog({ type: 'info', message: '🔗 Building Merkle tree...' });
    await delay(400);
    const root = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    addLog({ type: 'log', message: `   Merkle root: ${root.slice(0, 48)}...` });
    addLog({ type: 'log', message: '   Tree depth: 3 | Leaves: 4' });
    await delay(200);

    addLog({ type: 'info', message: '✔ Verifying audit chain integrity...' });
    await delay(500);
    addLog({ type: 'success', message: '✅ Chain integrity: VALID' });
    addLog({ type: 'success', message: '✅ All blocks verified (4/4)' });
    addLog({ type: 'success', message: '✅ Merkle proof: VERIFIED' });
    addLog({ type: 'log', message: '   Tamper-evident: true | Immutable: true' });
    addLog({ type: 'system', message: `⏱  Audit chain verified in ${(Math.random() * 12 + 5).toFixed(1)}ms` });
  }

  else {
    // Generic execution
    addLog({ type: 'system', message: '⚡ ATP Runtime v1.2.0' });
    await delay(300);
    addLog({ type: 'info', message: 'Running code...' });
    await delay(500);
    addLog({ type: 'success', message: '✅ Execution completed' });
    addLog({ type: 'log', message: '   Select a preset example for a full interactive demo' });
    addLog({ type: 'system', message: `⏱  Completed in ${(Math.random() * 10 + 2).toFixed(1)}ms` });
  }
}

// ─── Preset Examples ────────────────────────────────────────────────────

const EXAMPLES: Record<string, { label: string; icon: string; code: string }> = {
  agent: {
    label: 'Create Agent',
    icon: '🤖',
    code: `import { Agent } from 'atp-sdk';

// Create a new quantum-safe AI agent
const agent = await Agent.create('CustomerBot', {
  capabilities: ['read', 'write', 'analyze'],
  quantumSafe: true
});

// Agent is now registered with ATP
console.log('Agent DID:', agent.getDID());
console.log('Trust Level:', agent.getTrustLevel());
console.log('Quantum Safe:', agent.isQuantumSafe());`
  },
  trust: {
    label: 'Trust Scoring',
    icon: '📊',
    code: `import { TrustEngine } from 'atp-sdk';

const engine = new TrustEngine();

// Evaluate an agent's trust score
// based on behavioral history, credentials, and peer endorsements
const evaluation = await engine.evaluate({
  agentDid: 'did:atp:agent-123',
  factors: [
    'behavioral-history',
    'credential-verification',
    'interaction-success-rate',
    'policy-compliance',
    'peer-endorsements'
  ]
});

console.log('Trust Score:', evaluation.score);
console.log('Trust Level:', evaluation.level);
console.log('Eligible for promotion:', evaluation.canPromote);`
  },
  signature: {
    label: 'Quantum Signatures',
    icon: '🔐',
    code: `import { QuantumSigner } from 'atp-sdk';

const signer = new QuantumSigner({ mode: 'hybrid' });

// Sign a message with Ed25519 + Dilithium3
const message = 'Authorize transfer of 1000 tokens';
const signature = await signer.sign(message);

console.log('Signature created (hybrid Ed25519 + Dilithium3)');

// Verify the quantum-safe signature
const isValid = await signer.verify(message, signature);
console.log('Verification result:', isValid ? 'VALID' : 'INVALID');
console.log('Quantum resistant:', signature.isQuantumSafe);`
  },
  motleycrew: {
    label: 'Motleycrew',
    icon: '🚀',
    code: `import { MotleycrewATPClient } from '@atpdevelopment/motleycrew-atp';

// Initialize ATP-secured Motleycrew workflow
const client = new MotleycrewATPClient({ quantumSafe: true });

// Register a crew of agents
const crew = await client.registerCrew([
  { name: 'ResearchAgent', role: 'researcher', tools: ['web_search'] },
  { name: 'AnalysisAgent', role: 'analyst', tools: ['data_analysis'] },
  { name: 'WriterAgent', role: 'writer', tools: ['file_write'] }
]);

// Validate the agent graph
const validation = await client.validateGraph(crew);

// Apply security policy
await client.applyPolicy('production-finance');

// Execute the workflow with ATP protection
const result = await crew.execute('Research and summarize market trends');
console.log('Workflow result:', result.summary);`
  },
  policy: {
    label: 'Policy Engine',
    icon: '📜',
    code: `import { PolicyEngine } from 'atp-sdk';

const engine = new PolicyEngine();

// Load enterprise policy
const policy = await engine.load('enterprise-default');

// Evaluate multiple access requests
const requests = [
  { action: 'read', resource: 'customer-data', agent: 'did:atp:bot-1' },
  { action: 'write', resource: 'financial-records', agent: 'did:atp:bot-1' },
  { action: 'delete', resource: 'audit-logs', agent: 'did:atp:bot-1' },
  { action: 'execute', resource: 'external-api', agent: 'did:atp:bot-1' }
];

for (const req of requests) {
  const decision = await engine.evaluate(req);
  console.log(\`\${req.action} \${req.resource}: \${decision.effect}\`);
}

console.log('Policy evaluation complete');`
  },
  audit: {
    label: 'Audit Chain',
    icon: '🔗',
    code: `import { AuditChain } from 'atp-sdk';

const chain = new AuditChain({ immutable: true });

// Log events to the blockchain-backed audit trail
await chain.log('agent-registered', { did: 'did:atp:bot-1' });
await chain.log('tool-execution-success', { tool: 'web_search' });
await chain.log('trust-level-promoted', { from: 'basic', to: 'verified' });
await chain.log('policy-evaluation-permit', { resource: 'customer-data' });

// Build Merkle tree for verification
const merkleRoot = await chain.buildMerkleTree();
console.log('Merkle root:', merkleRoot);

// Verify the entire audit chain integrity
const integrity = await chain.verifyChain();
console.log('Chain integrity:', integrity.valid);
console.log('Blocks verified:', integrity.blocksVerified);`
  }
};

// ─── Components ─────────────────────────────────────────────────────────

function LogLine({ entry }: { entry: LogEntry }) {
  const colors: Record<string, string> = {
    log: 'text-gray-300',
    info: 'text-blue-400',
    warn: 'text-yellow-400',
    error: 'text-red-400',
    success: 'text-green-400',
    system: 'text-purple-400'
  };
  return (
    <div className={`font-mono text-[13px] leading-relaxed whitespace-pre-wrap ${colors[entry.type] || 'text-gray-300'}`}>
      {entry.message}
    </div>
  );
}

// ─── Playground Page ────────────────────────────────────────────────────

export default function PlaygroundPage() {
  const [code, setCode] = useState(EXAMPLES.agent.code);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeExample, setActiveExample] = useState('agent');
  const outputRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addLog = useCallback((entry: Omit<LogEntry, 'timestamp'>) => {
    setLogs(prev => [...prev, { ...entry, timestamp: Date.now() }]);
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [logs]);

  const handleRun = async () => {
    setLogs([]);
    setIsRunning(true);
    try {
      await executeCode(code, addLog);
    } catch {
      addLog({ type: 'error', message: 'Runtime error occurred' });
    }
    setIsRunning(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExampleSelect = (key: string) => {
    setActiveExample(key);
    setCode(EXAMPLES[key].code);
    setLogs([]);
  };

  const handleReset = () => {
    setCode(EXAMPLES[activeExample].code);
    setLogs([]);
  };

  // Line numbers for code editor
  const lineCount = code.split('\n').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30">
              <Terminal className="text-purple-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                ATP Playground
                <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                  <Sparkles size={10} className="mr-1" />
                  Live
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">
                Interactive sandbox — explore ATP features in real-time
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/docs">
                <BookOpen size={14} className="mr-2" />
                Docs
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/integrations/motleycrew">
                <Users size={14} className="mr-2" />
                Motleycrew
              </Link>
            </Button>
          </div>
        </div>

        {/* Example Presets */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Code2 size={14} className="text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Preset Examples</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(EXAMPLES).map(([key, ex]) => (
              <Button
                key={key}
                variant={activeExample === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleExampleSelect(key)}
                className={activeExample === key
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0'
                  : 'hover:bg-purple-500/10 hover:border-purple-500/30'
                }
              >
                <span className="mr-1.5">{ex.icon}</span>
                {ex.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Main Editor + Output */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Code Editor */}
          <Card className="border border-border/50 bg-[#0d1117] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-border/30">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs text-gray-500 ml-2 font-mono">playground.ts</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 px-2 text-gray-400 hover:text-white"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-7 px-2 text-gray-400 hover:text-white"
                >
                  <RotateCcw size={14} />
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="flex">
                {/* Line numbers */}
                <div className="select-none px-3 py-4 text-right font-mono text-xs text-gray-600 bg-[#0d1117] border-r border-border/20 min-w-[3rem]">
                  {Array.from({ length: lineCount }, (_, i) => (
                    <div key={i} className="leading-[1.6rem]">{i + 1}</div>
                  ))}
                </div>
                {/* Editor */}
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 bg-transparent text-gray-200 font-mono text-[13px] leading-[1.6rem] p-4 resize-none outline-none min-h-[400px] w-full"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                />
              </div>
            </div>
            {/* Run Button Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-t border-border/30">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Shield size={12} />
                <span>ATP v1.2.0</span>
                <span className="text-gray-700">|</span>
                <Lock size={12} />
                <span>Quantum-Safe</span>
              </div>
              <Button
                onClick={handleRun}
                disabled={isRunning}
                size="sm"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg px-6"
              >
                {isRunning ? (
                  <>
                    <Zap size={14} className="mr-2 animate-pulse" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play size={14} className="mr-2" />
                    Run
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Output Console */}
          <Card className="border border-border/50 bg-[#0d1117] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-border/30">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-green-400" />
                <span className="text-xs text-gray-400 font-mono">Output</span>
                {logs.length > 0 && (
                  <Badge className="bg-gray-700/50 text-gray-400 border-0 text-[10px] px-1.5 py-0">
                    {logs.length}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLogs([])}
                className="h-7 px-2 text-gray-400 hover:text-white"
              >
                <Trash2 size={14} />
              </Button>
            </div>
            <div
              ref={outputRef}
              className="p-4 min-h-[400px] max-h-[500px] overflow-y-auto"
            >
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[360px] text-gray-600">
                  <Terminal size={40} className="mb-4 opacity-30" />
                  <p className="text-sm">Click <strong>Run</strong> to execute the code</p>
                  <p className="text-xs mt-1 opacity-60">Output will appear here</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {logs.map((entry, i) => (
                    <LogLine key={i} entry={entry} />
                  ))}
                  {isRunning && (
                    <div className="text-purple-400 font-mono text-[13px] animate-pulse">▌</div>
                  )}
                </div>
              )}
            </div>
            <div className="px-4 py-2 bg-[#161b22] border-t border-border/30 flex items-center justify-between">
              <span className="text-[10px] text-gray-600 font-mono">
                {isRunning ? 'executing...' : logs.length > 0 ? 'completed' : 'idle'}
              </span>
              <span className="text-[10px] text-gray-600">
                {logs.filter(l => l.type === 'error').length > 0
                  ? `${logs.filter(l => l.type === 'error').length} error(s)`
                  : logs.length > 0 ? 'no errors' : ''}
              </span>
            </div>
          </Card>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card className="glass border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield size={16} className="text-blue-400" />
                Quantum-Safe by Default
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                All operations use hybrid Ed25519 + Dilithium3 signatures, providing both classical and post-quantum security.
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users size={16} className="text-green-400" />
                Multi-Agent Ready
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Test multi-agent workflows with Motleycrew integration, graph validation, and trust-based access control.
              </p>
            </CardContent>
          </Card>
          <Card className="glass border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lock size={16} className="text-purple-400" />
                Zero Config Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Policy enforcement, audit logging, and trust scoring work out of the box — no complex setup required.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
