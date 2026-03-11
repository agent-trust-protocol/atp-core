'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Copy, Key, Shield, Zap, Users, Loader2 } from 'lucide-react';

interface APIKeyData {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  environment: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  status: string;
  rateLimit: { requestsPerMinute: number; requestsPerDay: number };
  metadata?: { description?: string; ipWhitelist?: string[] };
}

interface MetricsData {
  usage: { totalAgents: number; activeAgents: number; totalMessages: number; encryptedMessages: number; apiCalls: number };
  trust: { averageScore: number };
  credentials: { issued: number; verified: number; revoked: number; pending: number };
}

function PortalContent() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  // Real data from API
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [apiKeys, setApiKeys] = useState<APIKeyData[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Key creation
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Settings
  const [orgName, setOrgName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Load session, metrics, and keys on mount
  useEffect(() => {
    async function init() {
      try {
        // Check session with Better Auth
        const sessionRes = await fetch('/api/auth/get-session', { credentials: 'include' });
        if (!sessionRes.ok) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        const sessionData = await sessionRes.json();
        if (!sessionData?.user) {
          // Fallback: check for demo token
          const cookies = document.cookie.split(';');
          const hasDemo = cookies.some(c => c.trim().startsWith('atp_token='));
          if (!hasDemo) {
            setIsAuthenticated(false);
            setIsLoading(false);
            return;
          }
        }

        setIsAuthenticated(true);
        setUserEmail(sessionData?.user?.email || '');
        setUserName(sessionData?.user?.name || sessionData?.user?.email?.split('@')[0] || 'User');
        setIsLoading(false);

        // Fetch metrics and keys in parallel
        fetchMetrics();
        fetchKeys();
      } catch {
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const fetchMetrics = async () => {
    setMetricsLoading(true);
    try {
      const res = await fetch('/api/sdk/metrics', { credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data) {
        setMetrics(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch metrics:', e);
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchKeys = async () => {
    setKeysLoading(true);
    try {
      const res = await fetch('/api/sdk/keys', { credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data?.keys) {
        setApiKeys(json.data.keys);
      }
    } catch (e) {
      console.error('Failed to fetch keys:', e);
    } finally {
      setKeysLoading(false);
    }
  };

  const handleCreateKey = useCallback(async () => {
    if (!newKeyName.trim()) return;
    setCreateLoading(true);
    try {
      const res = await fetch('/api/sdk/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newKeyName, environment: 'production' })
      });
      const json = await res.json();
      if (json.success && json.data?.key) {
        setCreatedKey(json.data.key);
        setNewKeyName('');
        fetchKeys(); // Refresh the list
      }
    } catch (e) {
      console.error('Failed to create key:', e);
    } finally {
      setCreateLoading(false);
    }
  }, [newKeyName]);

  const handleRevokeKey = useCallback(async (keyId: string) => {
    try {
      const res = await fetch(`/api/sdk/keys?id=${keyId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        fetchKeys(); // Refresh the list
      }
    } catch (e) {
      console.error('Failed to revoke key:', e);
    }
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const handleSaveSettings = useCallback(async () => {
    // Settings are saved locally for now — will persist to DB in future
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  }, []);

  const handleLogout = useCallback(async () => {
    // Clear all auth cookies
    document.cookie = 'atp_token=;path=/;max-age=0';
    document.cookie = 'better-auth.session_token=;path=/;max-age=0';

    try {
      await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' });
    } catch {
      // Ignore errors
    }

    router.push('/');
    router.refresh();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl text-center">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to access your portal.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/login?returnTo=/portal">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeKeyCount = apiKeys.filter(k => k.status === 'active').length;
  const apiCallsToday = metrics?.usage?.apiCalls || 0;
  const activeAgents = metrics?.usage?.activeAgents || 0;
  const totalAgents = metrics?.usage?.totalAgents || 0;
  const trustScore = metrics?.trust?.averageScore
    ? (metrics.trust.averageScore * 100).toFixed(1)
    : '0.0';

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold mb-2">Enterprise Portal</h1>
          <p className="text-muted-foreground">
            Welcome back, {userName}! Manage your ATP subscription, team, and API access.
          </p>
          {userEmail && (
            <p className="text-sm text-muted-foreground mt-1">{userEmail}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Usage Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              API Calls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {metricsLoading ? '—' : apiCallsToday.toLocaleString()}
            </p>
            <Progress
              value={Math.min(100, (apiCallsToday / 100000) * 100)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">of 100,000 limit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {metricsLoading ? '—' : activeAgents}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalAgents} total registered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Trust Score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {metricsLoading ? '—' : `${trustScore}%`}
            </p>
            <p className="text-xs text-muted-foreground">Average across agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Active Keys
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {keysLoading ? '—' : activeKeyCount}
            </p>
            <p className="text-xs text-muted-foreground">{apiKeys.length} total keys</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="api-keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="api-keys">
          <Card>
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>
                Create and manage API keys for SDK integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Create New Key */}
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input
                    id="keyName"
                    placeholder="e.g., Production Backend"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreateKey} disabled={!newKeyName.trim() || createLoading}>
                  {createLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Key
                </Button>
              </div>

              {/* Show newly created key */}
              {createdKey && (
                <Alert>
                  <AlertDescription className="flex flex-col gap-2">
                    <p className="font-semibold">Save this key now — it won&apos;t be shown again!</p>
                    <div className="flex items-center gap-2 font-mono bg-muted p-2 rounded">
                      <code className="flex-1 text-sm break-all">{createdKey}</code>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(createdKey)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCreatedKey(null)}
                      className="w-fit"
                    >
                      I&apos;ve saved it
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Existing Keys */}
              <div className="space-y-4">
                <h4 className="font-medium">Your API Keys</h4>
                {keysLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading keys...
                  </div>
                ) : apiKeys.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">
                    No API keys yet. Create one above to get started.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {apiKeys.map((key) => (
                      <div
                        key={key.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{key.name}</p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {key.keyPrefix}...
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                              {key.status}
                            </Badge>
                            <Badge variant="outline">{key.environment}</Badge>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRevokeKey(key.id)}
                          disabled={key.status !== 'active'}
                        >
                          Revoke
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your ATP subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                <div>
                  <p className="font-bold text-lg">Enterprise Trial</p>
                  <p className="text-muted-foreground">14 days remaining</p>
                </div>
                <Badge className="bg-purple-500">Active Trial</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="font-medium">Included Features</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>100,000 API calls/day</li>
                    <li>Unlimited agent registrations</li>
                    <li>Quantum-safe signatures</li>
                    <li>Priority support</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium">Upgrade to Pro</p>
                  <p className="text-2xl font-bold mt-2">$99<span className="text-sm font-normal">/month</span></p>
                  <Button className="w-full mt-4">Upgrade Now</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences and security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={userEmail} disabled className="bg-muted" />
              </div>

              <div className="space-y-2">
                <Label>Organization Name</Label>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="My Organization"
                />
              </div>

              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-api.com/webhook"
                />
                <p className="text-xs text-muted-foreground">
                  Receive real-time notifications for agent events
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Button onClick={handleSaveSettings}>Save Settings</Button>
                {settingsSaved && (
                  <span className="text-sm text-green-600">Settings saved!</span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function CustomerPortalClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <PortalContent />
    </Suspense>
  );
}
