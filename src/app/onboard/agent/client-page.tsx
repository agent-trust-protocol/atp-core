'use client';

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Shield, CheckCircle, XCircle, Loader2, ArrowLeft, ArrowRight,
  AlertTriangle, Copy, Check, ChevronDown, ChevronUp, Terminal,
  Zap, Link2, RefreshCw
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types and constants
// ---------------------------------------------------------------------------

type SetupPath = 'new-project' | 'existing-project' | 'dashboard-only';
type RuntimeTarget = 'openclaw' | 'mcp' | 'langchain' | 'custom';
type Environment = 'dev' | 'staging' | 'prod';
type Language = 'ts' | 'js';

interface PreflightResult {
  ok: boolean;
  value?: string;
  error?: string;
  fix?: string;
  warning?: boolean;
}
interface PreflightData {
  node: PreflightResult;
  npm: PreflightResult;
  port: PreflightResult;
  allClear: boolean;
}

interface ProfileSummary {
  id: string;
  name: string;
  userLabel: string;
  description: string;
  userDescription: string;
  highlights: string[];
}

const PROFILES: ProfileSummary[] = [
  {
    id: 'safe-default',
    name: 'Safe Default',
    userLabel: 'Balanced (recommended)',
    description: 'Conservative profile for most agents: limited tools, strong auditing.',
    userDescription: 'Good for most agents. Limits risky actions and keeps a full record of everything.',
    highlights: ['Read-only filesystem', 'Shell disabled', 'Full audit trail']
  },
  {
    id: 'dev-mode',
    name: 'Dev Mode',
    userLabel: 'Open (local development)',
    description: 'Permissive profile for local development: most tools allowed, minimal restrictions.',
    userDescription: 'Use during development only. Fewer guardrails so you can move fast.',
    highlights: ['All tools enabled', 'No approval gates', 'Action logging on']
  },
  {
    id: 'enterprise-locked',
    name: 'Enterprise Locked',
    userLabel: 'Strict (production / compliance)',
    description: 'Maximum security for production: strict controls, full audit, approval required.',
    userDescription: 'Maximum protection for production. Sensitive actions require explicit approval.',
    highlights: ['Shell fully blocked', 'Credentials blocked', 'Sensitive field redaction']
  },
  {
    id: 'openclaw-sandbox',
    name: 'OpenClaw Sandbox',
    userLabel: 'OpenClaw sandbox',
    description: 'Sandbox profile tuned for OpenClaw/NemoClaw agents with state-based enforcement.',
    userDescription: 'Tuned for OpenClaw agents. Sandbox paths and state-based policy checks.',
    highlights: ['OpenClaw-optimized', 'Sandbox paths only', 'State-based policies']
  }
];

const RUNTIMES: { value: RuntimeTarget; label: string; description: string }[] = [
  { value: 'openclaw', label: 'OpenClaw / NemoClaw', description: 'Multi-agent crew orchestration' },
  { value: 'mcp', label: 'MCP', description: 'Model Context Protocol servers' },
  { value: 'langchain', label: 'LangChain', description: 'LangChain / LangGraph agents' },
  { value: 'custom', label: 'Custom runtime', description: 'Your own agent framework' }
];

const CONTROL_DETAILS: Record<string, Record<string, string>> = {
  'safe-default': {
    Shell: 'Blocked (approval required)',
    Filesystem: 'Read-only, restricted paths',
    Network: 'Internal only, approval for external',
    Credentials: 'Blocked (approval required)',
    Messaging: 'Allowed, approval for external'
  },
  'dev-mode': {
    Shell: 'Allowed, no restrictions',
    Filesystem: 'Read + Write, all paths',
    Network: 'All domains allowed',
    Credentials: 'Allowed',
    Messaging: 'Allowed, no restrictions'
  },
  'enterprise-locked': {
    Shell: 'Fully blocked',
    Filesystem: 'Read-only, approved paths only',
    Network: 'Internal corp only',
    Credentials: 'Fully blocked',
    Messaging: 'Allowed, approval for external'
  },
  'openclaw-sandbox': {
    Shell: 'Blocked (approval, limited commands)',
    Filesystem: 'Read + Write, sandbox paths',
    Network: 'Internal + OpenClaw domains',
    Credentials: 'Blocked (approval required)',
    Messaging: 'Allowed, approval for external'
  }
};

// ---------------------------------------------------------------------------
// CLI command builder
// ---------------------------------------------------------------------------

function buildCliCommand(
  path: SetupPath,
  name: string,
  runtime: RuntimeTarget | '',
  profileId: string,
  lang: Language,
  env: Environment
): string {
  if (path === 'dashboard-only') {
    return 'npx create-atp-agent --dashboard-only';
  }
  if (path === 'existing-project') {
    return 'npm install atp-sdk';
  }
  // new-project
  const safeName = name.trim() ? name.toLowerCase().replace(/\s+/g, '-') : 'my-agent';
  const parts = [`npx create-atp-agent ${safeName}`];
  if (runtime) parts.push(`--runtime ${runtime}`);
  if (profileId !== 'safe-default') parts.push(`--profile ${profileId}`);
  if (lang === 'ts') parts.push('--typescript');
  if (env !== 'dev') parts.push(`--env ${env}`);
  return parts.join(' ');
}

function buildExistingSnippet(runtime: RuntimeTarget | '', profileId: string, lang: Language): string {
  const importLine = lang === 'ts'
    ? "import { Agent, ATPClient } from 'atp-sdk';"
    : "const { Agent, ATPClient } = require('atp-sdk');";
  const profileLine = profileId !== 'safe-default' ? `\nclient.setProfile('${profileId}');` : '';
  const runtimeComment = runtime ? ` // ${RUNTIMES.find(r => r.value === runtime)?.label ?? runtime} agent` : '';
  return `${importLine}

const client = new ATPClient({ baseUrl: process.env.ATP_BASE_URL });${profileLine}
const agent = await Agent.quickstart('my-agent');${runtimeComment}
console.log('Agent DID:', agent.getDID());`;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className="ml-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
    </button>
  );
}

function PreflightRow({
  label,
  check
}: {
  label: string;
  check: PreflightResult | undefined;
}) {
  if (!check) return null;
  const isWarning = check.warning && check.ok;
  const icon = !check ? null : check.ok && !isWarning
    ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
    : isWarning
    ? <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
    : <XCircle className="w-4 h-4 text-red-500 shrink-0" />;

  return (
    <div className="p-3 space-y-1">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium">{label}</span>
        {check.value && (
          <span className="text-xs text-gray-500 ml-auto">{check.value}</span>
        )}
      </div>
      {check.error && (
        <p className="text-xs text-red-600 dark:text-red-400 pl-6">{check.error}</p>
      )}
      {check.fix && (
        <p className="text-xs text-gray-600 dark:text-gray-400 pl-6">
          <span className="font-medium">How to fix:</span> {check.fix}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function OnboardAgentClient() {
  // path selection
  const [path, setPath] = useState<SetupPath | null>(null);
  // step within the wizard (0 = path already chosen, increments from there)
  const [step, setStep] = useState(0);

  // preflight
  const [preflight, setPreflight] = useState<PreflightData | null>(null);
  const [preflightLoading, setPreflightLoading] = useState(false);
  const [preflightError, setPreflightError] = useState('');

  // config
  const [agentName, setAgentName] = useState('');
  const [runtime, setRuntime] = useState<RuntimeTarget | ''>('');
  const [environment, setEnvironment] = useState<Environment>('dev');
  const [profileId, setProfileId] = useState('safe-default');
  const [lang, setLang] = useState<Language>('ts');

  // advanced panel
  const [showAdvanced, setShowAdvanced] = useState(false);

  // execution
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ agentId: string; did: string } | null>(null);

  const cliCommand = useMemo(
    () => buildCliCommand(path ?? 'new-project', agentName, runtime, profileId, lang, environment),
    [path, agentName, runtime, profileId, lang, environment]
  );

  const existingSnippet = useMemo(
    () => buildExistingSnippet(runtime, profileId, lang),
    [runtime, profileId, lang]
  );

  const filteredProfiles = useMemo(
    () => runtime ? PROFILES.filter(p =>
      p.id !== 'openclaw-sandbox' || runtime === 'openclaw'
    ) : PROFILES,
    [runtime]
  );

  // dashboard-only is a 3-step flow: path → preflight → command
  // the others are 5-step: path → preflight → config → cli-preview → confirm
  const totalSteps = path === 'dashboard-only' ? 3 : 5;

  const runPreflight = useCallback(async () => {
    setPreflightLoading(true);
    setPreflightError('');
    try {
      const res = await fetch('/api/preflight');
      if (!res.ok) throw new Error('Preflight check failed');
      const data: PreflightData = await res.json();
      setPreflight(data);
    } catch {
      setPreflightError('Could not run preflight checks. You can proceed, but verify Node 18+ and npm are installed.');
    } finally {
      setPreflightLoading(false);
    }
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/agents/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runtime, name: agentName, environment, profileId })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to register agent');
      }
      const data = await res.json();
      setResult({
        agentId: data.agentId || data.id || agentName,
        did: data.did || `did:atp:${agentName.toLowerCase().replace(/\s+/g, '-')}`
      });
      setDone(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const canAdvance = useMemo(() => {
    if (step === 0) return path !== null;
    if (step === 1) return true; // can always proceed past preflight
    if (step === 2) {
      if (path === 'dashboard-only') return true;
      return agentName.trim() !== '';
    }
    return true;
  }, [step, path, agentName]);

  const goNext = () => {
    if (step === 1 && !preflight) {
      runPreflight();
    }
    setStep((s: number) => s + 1);
  };

  const goBack = () => setStep((s: number) => s - 1);

  const resetAll = () => {
    setPath(null);
    setStep(0);
    setPreflight(null);
    setAgentName('');
    setRuntime('');
    setEnvironment('dev');
    setProfileId('safe-default');
    setLang('ts');
    setDone(false);
    setResult(null);
    setError('');
    setShowAdvanced(false);
  };

  // -------------------------------------------------------------------------
  // Step renderers
  // -------------------------------------------------------------------------

  const renderStepPath = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">What would you like to do?</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Choose your setup path. You can always switch later.
      </p>
      <div className="grid grid-cols-1 gap-3">
        {([
          {
            id: 'new-project' as SetupPath,
            icon: <Zap className="w-5 h-5 text-blue-500" />,
            title: 'Create a new ATP project',
            desc: 'Scaffold a new agent project with security built in from the start. Best if you are starting fresh.'
          },
          {
            id: 'existing-project' as SetupPath,
            icon: <Link2 className="w-5 h-5 text-purple-500" />,
            title: 'Connect an existing project',
            desc: 'Add ATP to a codebase you already have. Installs the SDK and walks you through setup.'
          },
          {
            id: 'dashboard-only' as SetupPath,
            icon: <Terminal className="w-5 h-5 text-green-500" />,
            title: 'Open the guided local dashboard',
            desc: 'Launch a local ATP onboarding UI on your machine — no cloud account needed to explore.'
          }
        ] as { id: SetupPath; icon: React.ReactNode; title: string; desc: string }[]).map(opt => (
          <button
            key={opt.id}
            onClick={() => setPath(opt.id)}
            className={`text-left border rounded-lg p-4 transition-colors flex gap-3 items-start ${
              path === opt.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
            }`}
          >
            <span className="mt-0.5">{opt.icon}</span>
            <div>
              <div className="font-medium text-sm">{opt.title}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStepPreflight = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Environment check</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        ATP checks your environment before starting so you don't hit surprises mid-setup.
      </p>

      {!preflight && !preflightLoading && (
        <div className="text-center py-4">
          <Button onClick={runPreflight} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Run environment checks
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Checks Node.js version, npm availability, and dashboard port.
          </p>
        </div>
      )}

      {preflightLoading && (
        <div className="flex items-center justify-center gap-2 py-6 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Checking your environment…</span>
        </div>
      )}

      {preflightError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-sm">Could not run checks</AlertTitle>
          <AlertDescription className="text-xs">{preflightError}</AlertDescription>
        </Alert>
      )}

      {preflight && (
        <>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            <PreflightRow label="Node.js 18+" check={preflight.node} />
            <PreflightRow label="npm" check={preflight.npm} />
            <PreflightRow label="Local dashboard port (3456)" check={preflight.port} />
          </div>

          {preflight.allClear ? (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-sm text-green-800 dark:text-green-300">
                Environment ready
              </AlertTitle>
              <AlertDescription className="text-xs text-green-700 dark:text-green-400">
                Your machine meets all ATP requirements. You're good to go.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-sm">Action needed before continuing</AlertTitle>
              <AlertDescription className="text-xs">
                Fix the issues above, then click "Re-run checks" to confirm before proceeding.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button onClick={runPreflight} variant="ghost" size="sm" className="gap-1 text-xs">
              <RefreshCw className="w-3 h-3" />
              Re-run checks
            </Button>
          </div>
        </>
      )}
    </div>
  );

  // Dashboard-only: show the command and explain what happens
  const renderStepDashboardCommand = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Run the guided local dashboard</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Copy the command below and run it in your terminal. ATP will open a setup UI at{' '}
        <code className="rounded bg-muted px-1">http://127.0.0.1:3456</code> — no cloud account needed.
      </p>
      <div className="rounded-lg bg-gray-900 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 font-mono">Terminal</span>
          <CopyButton text={cliCommand} />
        </div>
        <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">{cliCommand}</pre>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
        <p className="font-medium text-gray-800 dark:text-gray-200">What happens next:</p>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>ATP opens a local dashboard at <code className="rounded bg-muted px-1">http://127.0.0.1:3456</code></li>
          <li>You choose your agent runtime and security profile</li>
          <li>ATP generates your agent's identity and configuration files</li>
          <li>You get a DID and ready-to-run starter code</li>
        </ol>
      </div>
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle className="text-sm">Node.js 18+ and npm required</AlertTitle>
        <AlertDescription className="text-xs">
          The command above requires Node.js 18 or newer. Check the environment panel above if you're unsure.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderStepConfig = () => (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">Configure your agent</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Fill in a few details. The command preview on the next screen updates as you type.
      </p>

      {/* Agent name */}
      <div className="space-y-1">
        <Label htmlFor="agent-name">
          {path === 'new-project' ? 'Project name' : 'Agent name'}
        </Label>
        <Input
          id="agent-name"
          placeholder={path === 'new-project' ? 'e.g. my-finance-agent' : 'e.g. FinanceBot'}
          value={agentName}
          onChange={e => setAgentName(e.target.value)}
          autoFocus
        />
        {path === 'new-project' && (
          <p className="text-xs text-muted-foreground">
            Used as the project folder name and agent identifier.
          </p>
        )}
      </div>

      {/* Language */}
      <div className="space-y-1">
        <Label>Preferred JavaScript format</Label>
        <div className="flex gap-2">
          {([
            { value: 'ts' as Language, label: 'TypeScript', hint: 'Recommended' },
            { value: 'js' as Language, label: 'JavaScript (ESM)', hint: '' }
          ]).map(l => (
            <button
              key={l.value}
              onClick={() => setLang(l.value)}
              className={`flex-1 border rounded-lg p-3 text-sm text-left transition-colors ${
                lang === l.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{l.label}</span>
                {l.hint && <Badge variant="secondary" className="text-xs">{l.hint}</Badge>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Runtime */}
      <div className="space-y-1">
        <Label>Agent framework</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RUNTIMES.map(r => (
            <button
              key={r.value}
              onClick={() => setRuntime(r.value)}
              className={`text-left border rounded-lg p-3 text-sm transition-colors ${
                runtime === r.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
              }`}
            >
              <div className="font-medium">{r.label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{r.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Protection level */}
      <div className="space-y-1">
        <Label>Protection level</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Controls what your agent is allowed to do. You can change this later.
        </p>
        <div className="grid grid-cols-1 gap-2">
          {filteredProfiles.map(p => (
            <button
              key={p.id}
              onClick={() => setProfileId(p.id)}
              className={`text-left border rounded-lg p-3 transition-colors ${
                profileId === p.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-medium text-sm">{p.userLabel}</span>
                {p.id === 'safe-default' && (
                  <Badge variant="secondary" className="text-xs">Recommended</Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{p.userDescription}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Environment */}
      <div className="space-y-1">
        <Label>Deployment environment</Label>
        <div className="flex gap-2">
          {(['dev', 'staging', 'prod'] as Environment[]).map(env => (
            <button
              key={env}
              onClick={() => setEnvironment(env)}
              className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${
                environment === env
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
              }`}
            >
              {env === 'dev' ? 'Development' : env === 'staging' ? 'Staging' : 'Production'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStepCliPreview = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Your ATP command</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        This is the exact command that matches your choices. Copy and run it anytime — or click{' '}
        <strong>Continue</strong> to register your agent here.
      </p>

      <div className="rounded-lg bg-gray-900 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 font-mono">Terminal</span>
          <CopyButton text={cliCommand} />
        </div>
        <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap break-all">{cliCommand}</pre>
      </div>

      {path === 'existing-project' && (
        <div className="rounded-lg bg-gray-900 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-mono">
              {lang === 'ts' ? 'TypeScript' : 'JavaScript'} — after install
            </span>
            <CopyButton text={existingSnippet} />
          </div>
          <pre className="text-xs text-blue-300 font-mono whitespace-pre-wrap">{existingSnippet}</pre>
        </div>
      )}

      <button
        onClick={() => setShowAdvanced(v => !v)}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {showAdvanced ? 'Hide advanced details' : 'Show advanced details'}
      </button>

      {showAdvanced && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <div className="p-3 flex justify-between">
            <span className="text-gray-500">Path</span>
            <span className="font-medium capitalize">{path?.replace('-', ' ')}</span>
          </div>
          {agentName && (
            <div className="p-3 flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-mono text-xs">{agentName}</span>
            </div>
          )}
          {runtime && (
            <div className="p-3 flex justify-between">
              <span className="text-gray-500">Runtime</span>
              <span className="font-medium">{RUNTIMES.find(r => r.value === runtime)?.label}</span>
            </div>
          )}
          <div className="p-3 flex justify-between">
            <span className="text-gray-500">Profile</span>
            <span className="font-mono text-xs">{profileId}</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="text-gray-500">Language</span>
            <span className="font-medium">{lang === 'ts' ? 'TypeScript' : 'JavaScript (ESM)'}</span>
          </div>
          <div className="p-3 flex justify-between">
            <span className="text-gray-500">Environment</span>
            <span className="font-medium">{environment}</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderStepConfirm = () => {
    const controls = CONTROL_DETAILS[profileId] || {};
    const profile = PROFILES.find(p => p.id === profileId);
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Ready to register</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Review your configuration, then click <strong>Register agent</strong>. ATP will
          generate a decentralized identity (DID) and apply your security profile.
        </p>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
          <div className="p-3 flex justify-between text-sm">
            <span className="text-gray-500">Agent name</span>
            <span className="font-medium">{agentName}</span>
          </div>
          <div className="p-3 flex justify-between text-sm">
            <span className="text-gray-500">Framework</span>
            <span className="font-medium">{RUNTIMES.find(r => r.value === runtime)?.label ?? '—'}</span>
          </div>
          <div className="p-3 flex justify-between text-sm">
            <span className="text-gray-500">Protection level</span>
            <span className="font-medium">{profile?.userLabel}</span>
          </div>
          <div className="p-3 flex justify-between text-sm">
            <span className="text-gray-500">Environment</span>
            <span className="font-medium">{environment}</span>
          </div>
        </div>

        <button
          onClick={() => setShowAdvanced(v => !v)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {showAdvanced ? 'Hide profile controls' : 'Show profile controls'}
        </button>

        {showAdvanced && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            {Object.entries(controls).map(([key, value]) => (
              <div key={key} className="p-3 flex justify-between text-sm">
                <span className="text-gray-500">{key}</span>
                <span className="font-medium text-xs">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderDone = () => {
    const nextAction = path === 'new-project'
      ? { label: 'Start your agent', cmd: `cd ${agentName.toLowerCase().replace(/\s+/g, '-') || 'my-agent'} && npm start` }
      : path === 'existing-project'
      ? { label: 'Add the ATP import', cmd: 'npm install atp-sdk' }
      : null;

    return (
      <div className="text-center space-y-4 py-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-semibold">Agent registered</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm max-w-sm mx-auto">
          Your agent now has a decentralized identity and your chosen protection level applied.
        </p>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 text-left max-w-sm mx-auto">
          <div className="p-3 flex justify-between text-sm">
            <span className="text-gray-500">Agent ID</span>
            <span className="font-mono text-xs">{result?.agentId}</span>
          </div>
          <div className="p-3 flex justify-between text-sm">
            <span className="text-gray-500">DID</span>
            <span className="font-mono text-xs truncate max-w-[180px]">{result?.did}</span>
          </div>
          <div className="p-3 flex justify-between text-sm">
            <span className="text-gray-500">Profile</span>
            <span className="font-medium">{PROFILES.find(p => p.id === profileId)?.name}</span>
          </div>
        </div>

        {nextAction && (
          <div className="max-w-sm mx-auto text-left">
            <p className="text-sm font-medium mb-2">Next step: {nextAction.label}</p>
            <div className="rounded-lg bg-gray-900 p-3 flex items-center justify-between">
              <code className="text-xs text-green-400 font-mono">{nextAction.cmd}</code>
              <CopyButton text={nextAction.cmd} />
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/agents'}>
            View agents
          </Button>
          <Button onClick={resetAll}>Register another</Button>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Step labels for progress bar
  // -------------------------------------------------------------------------

  const stepLabels = path === 'dashboard-only'
    ? ['Path', 'Environment', 'Command']
    : ['Path', 'Environment', 'Configure', 'Command', 'Register'];

  const stepRenderers =
    path === 'dashboard-only'
      ? [renderStepPath, renderStepPreflight, renderStepDashboardCommand]
      : [renderStepPath, renderStepPreflight, renderStepConfig, renderStepCliPreview, renderStepConfirm];

  const isLastStep = step === totalSteps - 1;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex justify-center">
            <Image
              src="/atp-logo.svg"
              alt="Agent Trust Protocol logo"
              width={64}
              height={64}
              className="h-16 w-16 object-contain"
              priority
              unoptimized
            />
          </div>
          <CardTitle>Set up with ATP</CardTitle>
          <CardDescription>
            Secure your AI agent with quantum-safe identity and policy controls.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {done ? (
            renderDone()
          ) : (
            <>
              {/* Progress bar */}
              <div className="flex items-center justify-center gap-1 mb-6 flex-wrap">
                {stepLabels.map((label, i) => (
                  <div key={label} className="flex items-center gap-1">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                        i === step
                          ? 'bg-blue-600 text-white'
                          : i < step
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                      }`}
                    >
                      {i < step ? <Check className="w-3 h-3" /> : i + 1}
                    </div>
                    <span className={`text-xs hidden sm:inline ${i === step ? 'font-medium' : 'text-gray-400'}`}>
                      {label}
                    </span>
                    {i < stepLabels.length - 1 && (
                      <div className={`w-6 h-px ${i < step ? 'bg-blue-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step content */}
              {stepRenderers[step]?.()}

              {/* Execution error */}
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="text-sm">Registration failed</AlertTitle>
                  <AlertDescription className="text-xs space-y-1">
                    <p>{error}</p>
                    <p>Check your network connection and try again. If the problem continues, the ATP API may be temporarily unavailable.</p>
                  </AlertDescription>
                </Alert>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                <Button variant="outline" disabled={step === 0} onClick={goBack}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>

                {isLastStep && path !== 'dashboard-only' ? (
                  <Button disabled={submitting || !canAdvance} onClick={handleSubmit}>
                    {submitting
                      ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Registering…</>
                      : <><Shield className="w-4 h-4 mr-1" /> Register agent</>}
                  </Button>
                ) : (
                  <Button disabled={!canAdvance} onClick={goNext}>
                    {isLastStep && path === 'dashboard-only' ? 'Done' : 'Continue'}
                    {!isLastStep && <ArrowRight className="w-4 h-4 ml-1" />}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
