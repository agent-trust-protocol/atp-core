'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// Built-in profiles (mirrored from atp-profiles for client-side rendering)
// ---------------------------------------------------------------------------

type RuntimeTarget = 'openclaw' | 'mcp' | 'langchain' | 'custom';

interface ProfileSummary {
  id: string;
  name: string;
  description: string;
  runtime_targets: RuntimeTarget[];
  highlights: string[];
}

const PROFILES: ProfileSummary[] = [
  {
    id: 'safe-default',
    name: 'Safe Default',
    description: 'Conservative profile for most agents: limited tools, strong auditing.',
    runtime_targets: ['openclaw', 'mcp', 'langchain', 'custom'],
    highlights: ['Read-only filesystem', 'Shell disabled', 'Full audit trail']
  },
  {
    id: 'dev-mode',
    name: 'Dev Mode',
    description: 'Permissive profile for local development: most tools allowed, minimal restrictions.',
    runtime_targets: ['openclaw', 'mcp', 'langchain', 'custom'],
    highlights: ['All tools enabled', 'No approval gates', 'Action logging on']
  },
  {
    id: 'enterprise-locked',
    name: 'Enterprise Locked',
    description: 'Maximum security for production: strict controls, full audit, approval required.',
    runtime_targets: ['openclaw', 'mcp', 'langchain', 'custom'],
    highlights: ['Shell fully blocked', 'Credentials blocked', 'Sensitive field redaction']
  },
  {
    id: 'openclaw-sandbox',
    name: 'OpenClaw Sandbox',
    description: 'Sandbox profile tuned for OpenClaw/NemoClaw agents with state-based enforcement.',
    runtime_targets: ['openclaw'],
    highlights: ['OpenClaw-optimized', 'Sandbox paths only', 'State-based policies']
  }
];

const RUNTIMES: { value: RuntimeTarget; label: string; description: string }[] = [
  { value: 'openclaw', label: 'OpenClaw / NemoClaw', description: 'Multi-agent crew orchestration' },
  { value: 'mcp', label: 'MCP', description: 'Model Context Protocol servers' },
  { value: 'langchain', label: 'LangChain', description: 'LangChain / LangGraph agents' },
  { value: 'custom', label: 'Custom Runtime', description: 'Your own agent framework' }
];

const ENVIRONMENTS = ['dev', 'staging', 'prod'] as const;
type Environment = (typeof ENVIRONMENTS)[number];

// ---------------------------------------------------------------------------
// Controls summary renderer
// ---------------------------------------------------------------------------

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
// Component
// ---------------------------------------------------------------------------

export default function OnboardAgentClient() {
  const [step, setStep] = useState(0);
  const [runtime, setRuntime] = useState<RuntimeTarget | ''>('');
  const [agentName, setAgentName] = useState('');
  const [environment, setEnvironment] = useState<Environment>('dev');
  const [profileId, setProfileId] = useState('safe-default');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ agentId: string; did: string } | null>(null);

  const canNext =
    (step === 0 && runtime !== '') ||
    (step === 1 && agentName.trim() !== '') ||
    step === 2 ||
    step === 3;

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
        throw new Error(data.error || 'Failed to onboard agent');
      }
      const data = await res.json();
      setResult({ agentId: data.agentId || data.id || agentName, did: data.did || `did:atp:${agentName.toLowerCase().replace(/\s+/g, '-')}` });
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered profiles based on selected runtime
  const filteredProfiles = runtime
    ? PROFILES.filter((p) => p.runtime_targets.includes(runtime as RuntimeTarget))
    : PROFILES;

  // -----------------------------------------------------------------------
  // Step renderers
  // -----------------------------------------------------------------------

  const renderStep0 = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Choose Runtime</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">Select the agent runtime your agent will run on.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {RUNTIMES.map((r) => (
          <button
            key={r.value}
            className={`text-left border rounded-lg p-4 transition-colors ${
              runtime === r.value
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
            }`}
            onClick={() => setRuntime(r.value)}
          >
            <div className="font-medium">{r.label}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{r.description}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Name Your Agent</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">Give your agent a human-readable name.</p>
      <div className="space-y-2">
        <Label htmlFor="agent-name">Agent Name</Label>
        <Input
          id="agent-name"
          placeholder="e.g. FinanceBot, CodeReviewer"
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label>Environment</Label>
        <div className="flex gap-2">
          {ENVIRONMENTS.map((env) => (
            <button
              key={env}
              className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${
                environment === env
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
              }`}
              onClick={() => setEnvironment(env)}
            >
              {env}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Select Security Profile</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Choose an ATP security profile that defines what your agent can and cannot do.
      </p>
      <div className="grid grid-cols-1 gap-3">
        {filteredProfiles.map((p) => (
          <button
            key={p.id}
            className={`text-left border rounded-lg p-4 transition-colors ${
              profileId === p.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
            }`}
            onClick={() => setProfileId(p.id)}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{p.name}</span>
              {p.id === 'safe-default' && (
                <Badge variant="secondary" className="text-xs">Recommended</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{p.description}</p>
            <div className="flex flex-wrap gap-1">
              {p.highlights.map((h) => (
                <Badge key={h} variant="outline" className="text-xs">{h}</Badge>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => {
    const controls = CONTROL_DETAILS[profileId] || {};
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Confirm Controls</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Review the key controls for your selected profile before onboarding.
        </p>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
          <div className="p-3 flex justify-between text-sm">
            <span className="text-gray-500">Runtime</span>
            <span className="font-medium">{RUNTIMES.find((r) => r.value === runtime)?.label}</span>
          </div>
          <div className="p-3 flex justify-between text-sm">
            <span className="text-gray-500">Agent Name</span>
            <span className="font-medium">{agentName}</span>
          </div>
          <div className="p-3 flex justify-between text-sm">
            <span className="text-gray-500">Environment</span>
            <span className="font-medium">{environment}</span>
          </div>
          <div className="p-3 flex justify-between text-sm">
            <span className="text-gray-500">Profile</span>
            <span className="font-medium">{PROFILES.find((p) => p.id === profileId)?.name}</span>
          </div>
        </div>

        <h3 className="text-sm font-semibold mt-4">Profile Controls</h3>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
          {Object.entries(controls).map(([key, value]) => (
            <div key={key} className="p-3 flex justify-between text-sm">
              <span className="text-gray-500">{key}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDone = () => (
    <div className="text-center space-y-4 py-6">
      <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
      </div>
      <h2 className="text-xl font-semibold">Agent Onboarded</h2>
      <p className="text-gray-600 dark:text-gray-400">
        Your agent has been registered with ATP and is ready to use.
      </p>
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 text-left max-w-md mx-auto">
        <div className="p-3 flex justify-between text-sm">
          <span className="text-gray-500">Agent ID</span>
          <span className="font-mono text-xs">{result?.agentId}</span>
        </div>
        <div className="p-3 flex justify-between text-sm">
          <span className="text-gray-500">DID</span>
          <span className="font-mono text-xs truncate max-w-[200px]">{result?.did}</span>
        </div>
        <div className="p-3 flex justify-between text-sm">
          <span className="text-gray-500">Profile</span>
          <span className="font-medium">{PROFILES.find((p) => p.id === profileId)?.name}</span>
        </div>
        <div className="p-3 flex justify-between text-sm">
          <span className="text-gray-500">Runtime</span>
          <span className="font-medium">{RUNTIMES.find((r) => r.value === runtime)?.label}</span>
        </div>
        <div className="p-3 flex justify-between text-sm">
          <span className="text-gray-500">Environment</span>
          <span className="font-medium">{environment}</span>
        </div>
      </div>
      <div className="flex gap-3 justify-center pt-2">
        <Button variant="outline" onClick={() => window.location.href = '/dashboard/agents'}>
          View Agents
        </Button>
        <Button onClick={() => { setStep(0); setDone(false); setResult(null); setAgentName(''); }}>
          Onboard Another
        </Button>
      </div>
    </div>
  );

  const steps = [renderStep0, renderStep1, renderStep2, renderStep3];
  const stepLabels = ['Runtime', 'Agent', 'Profile', 'Confirm'];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle>Onboard Agent with ATP</CardTitle>
          <CardDescription>
            Register your agent with Agent Trust Protocol and select a security profile.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!done && (
            <>
              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {stepLabels.map((label, i) => (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                        i === step
                          ? 'bg-blue-600 text-white'
                          : i < step
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                      }`}
                    >
                      {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={`text-xs hidden sm:inline ${i === step ? 'font-medium' : 'text-gray-400'}`}>
                      {label}
                    </span>
                    {i < stepLabels.length - 1 && (
                      <div className={`w-8 h-px ${i < step ? 'bg-blue-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
                    )}
                  </div>
                ))}
              </div>

              {steps[step]()}

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                {step < 3 ? (
                  <Button disabled={!canNext} onClick={() => setStep(step + 1)}>
                    Next <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button disabled={submitting} onClick={handleSubmit}>
                    {submitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Shield className="w-4 h-4 mr-1" />}
                    {submitting ? 'Onboarding...' : 'Onboard Agent'}
                  </Button>
                )}
              </div>
            </>
          )}

          {done && renderDone()}
        </CardContent>
      </Card>
    </div>
  );
}
