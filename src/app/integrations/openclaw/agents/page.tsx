'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Minus, Shield, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LiveAgentDashboard } from '@/components/atp/live-agent-dashboard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type SessionState = 'planning' | 'executing' | 'communicating' | 'completed';

interface StatePermissions {
  allowedTools: string[];
  restrictedTools: string[];
  requireApproval: string[];
}

type ClawStatePolicy = Record<SessionState, StatePermissions>;

const DEFAULT_POLICY: ClawStatePolicy = {
  planning: {
    allowedTools: [],
    restrictedTools: ['shell', 'http', 'fs'],
    requireApproval: []
  },
  executing: {
    allowedTools: ['http', 'fs'],
    restrictedTools: ['shell-dangerous'],
    requireApproval: []
  },
  communicating: {
    allowedTools: ['messaging'],
    restrictedTools: [],
    requireApproval: ['external-send']
  },
  completed: {
    allowedTools: ['read-only-logs'],
    restrictedTools: ['shell', 'fs', 'http'],
    requireApproval: []
  }
};

const STATE_ORDER: SessionState[] = ['planning', 'executing', 'communicating', 'completed'];

const STATE_COLORS: Record<SessionState, string> = {
  planning: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  executing: 'bg-green-500/10 border-green-500/20 text-green-400',
  communicating: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  completed: 'bg-gray-500/10 border-gray-500/20 text-gray-400'
};

// ---------------------------------------------------------------------------
// Tool tag editor
// ---------------------------------------------------------------------------
function ToolTagList({
  tools,
  onRemove,
  onAdd,
  colorClass
}: {
  tools: string[];
  onRemove: (t: string) => void;
  onAdd: (t: string) => void;
  colorClass: string;
}) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed && !tools.includes(trimmed)) {
      onAdd(trimmed);
      setInput('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 min-h-[28px]">
        {tools.length === 0 && (
          <span className="text-xs text-foreground/30 italic">none</span>
        )}
        {tools.map((t) => (
          <Badge
            key={t}
            variant="outline"
            className={`text-xs cursor-pointer ${colorClass} hover:opacity-70`}
            onClick={() => onRemove(t)}
            title="Click to remove"
          >
            {t} <Minus size={10} className="ml-1" />
          </Badge>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="add tool…"
          className="flex-1 bg-background/40 border border-foreground/10 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-primary/40"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-6 px-2 text-xs"
          onClick={handleAdd}
        >
          <Plus size={10} />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Policy card
// ---------------------------------------------------------------------------
function ClawStatePolicyCard() {
  const [policy, setPolicy] = useState<ClawStatePolicy>(DEFAULT_POLICY);

  function updateTools(
    state: SessionState,
    field: keyof StatePermissions,
    action: 'add' | 'remove',
    tool: string
  ) {
    setPolicy((prev) => {
      const current = [...prev[state][field]];
      const next =
        action === 'add'
          ? [...current, tool]
          : current.filter((t) => t !== tool);
      return {
        ...prev,
        [state]: { ...prev[state], [field]: next }
      };
    });
  }

  return (
    <Card className="glass border-0 mb-8">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Shield className="text-primary" size={20} />
          </div>
          <div>
            <CardTitle className="font-display text-lg">Session State Policy</CardTitle>
            <CardDescription className="text-xs">
              Maps agent lifecycle states to allowed / restricted tools.
              Click a badge to remove it; type a name and press Enter or + to add.
              Changes are local to this session.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {STATE_ORDER.map((state) => (
            <div key={state} className="space-y-4">
              <Badge
                variant="outline"
                className={`text-xs font-semibold uppercase tracking-wide ${STATE_COLORS[state]}`}
              >
                {state}
              </Badge>

              <div className="space-y-1">
                <p className="text-xs text-foreground/50 font-medium">Allowed</p>
                <ToolTagList
                  tools={policy[state].allowedTools}
                  colorClass="bg-green-500/10 border-green-500/20 text-green-400"
                  onRemove={(t) => updateTools(state, 'allowedTools', 'remove', t)}
                  onAdd={(t) => updateTools(state, 'allowedTools', 'add', t)}
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs text-foreground/50 font-medium">Restricted</p>
                <ToolTagList
                  tools={policy[state].restrictedTools}
                  colorClass="bg-red-500/10 border-red-500/20 text-red-400"
                  onRemove={(t) => updateTools(state, 'restrictedTools', 'remove', t)}
                  onAdd={(t) => updateTools(state, 'restrictedTools', 'add', t)}
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs text-foreground/50 font-medium">Requires approval</p>
                <ToolTagList
                  tools={policy[state].requireApproval}
                  colorClass="bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                  onRemove={(t) => updateTools(state, 'requireApproval', 'remove', t)}
                  onAdd={(t) => updateTools(state, 'requireApproval', 'add', t)}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function OpenClawAgentsPage() {
  return (
    <div className="min-h-screen relative">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Back link */}
        <div className="mb-8">
          <Link href="/integrations/openclaw">
            <Button variant="ghost" size="sm" className="gap-2 text-foreground/60 hover:text-foreground">
              <ArrowLeft size={14} />
              Back to OpenClaw Integration
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Activity className="text-primary" size={24} />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-light">
              Live OpenClaw Agents
            </h1>
          </div>
          <p className="text-foreground/60 max-w-2xl">
            ATP-registered OpenClaw agents with their current trust scores, quantum-safe status,
            and lifecycle states. The policy card below shows which tools each state permits.
          </p>
        </div>

        {/* State policy editor */}
        <ClawStatePolicyCard />

        {/* Agent listing */}
        <LiveAgentDashboard />
      </div>
    </div>
  );
}
