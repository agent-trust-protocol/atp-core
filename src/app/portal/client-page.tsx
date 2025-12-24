'use client';

import { useState, useCallback, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useUser, useClerk } from '@clerk/nextjs';
import { useSDKMetrics, useAPIKeys } from '@/hooks/use-sdk-metrics';
import { RefreshCw, Copy, Key, Shield, Zap, Users } from 'lucide-react';

export default function CustomerPortalClient() {
  const { user, isLoaded: authLoading } = useUser();
  const { signOut } = useClerk();
  const isAuthenticated = !!user;

  // Helper to get user display name with proper types
  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = user as any;
    return u.firstName || u.fullName || u.primaryEmailAddress?.emailAddress || 'Guest';
  };

  // SDK Metrics - real data from /api/sdk/metrics
  const {
    data: metrics,
    loading: metricsLoading,
    error: metricsError,
    isDemo,
    refresh: refreshMetrics
  } = useSDKMetrics({
    timeRange: '24h',
    refreshInterval: 30000
  });

  // API Keys - real data from /api/sdk/keys
  const {
    keys: apiKeys,
    loading: keysLoading,
    createKey,
    revokeKey,
    refresh: refreshKeys
  } = useAPIKeys();

  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'John Doe', email: 'john@company.com', role: 'Admin', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@company.com', role: 'Developer', status: 'active' }
  ]);

  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [isCreatingKey, setIsCreatingKey] = useState(false);

  const handleCreateKey = useCallback(async () => {
    if (!newKeyName.trim()) return;

    setIsCreatingKey(true);
    try {
      const result = await createKey({
        name: newKeyName,
        permissions: ['read:agents', 'write:agents', 'read:credentials'],
        environment: 'development'
      });

      if (result.success && result.data?.key) {
        setCreatedKey(result.data.key);
        setNewKeyName('');
        refreshKeys();
      }
    } finally {
      setIsCreatingKey(false);
    }
  }, [newKeyName, createKey, refreshKeys]);

  const handleRevokeKey = useCallback(async (keyId: string) => {
    await revokeKey(keyId);
    refreshKeys();
  }, [revokeKey, refreshKeys]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut();
  }, [signOut]);

  // Loading state
  if (!authLoading && !isAuthenticated) {
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold mb-2">Enterprise Portal</h1>
          <p className="text-muted-foreground">
            Welcome back, {getUserDisplayName()}! Manage your ATP subscription, team, and API access.
          </p>
          {isDemo && (
            <Badge variant="outline" className="mt-2">Demo Data</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshMetrics} disabled={metricsLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${metricsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
              API Calls Today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {metrics?.apiCalls?.today?.toLocaleString() || '0'}
            </p>
            <Progress
              value={Math.min(100, ((metrics?.apiCalls?.today || 0) / 10000) * 100)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">of 10,000 limit</p>
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
            <p className="text-2xl font-bold">{metrics?.agents?.active || 0}</p>
            <p className="text-xs text-muted-foreground">
              {metrics?.agents?.total || 0} total registered
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
              {metrics?.trust?.averageScore?.toFixed(1) || '0'}%
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
              {apiKeys.filter(k => k.status === 'active').length}
            </p>
            <p className="text-xs text-muted-foreground">{apiKeys.length} total keys</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="api-keys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
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
                <Button onClick={handleCreateKey} disabled={isCreatingKey || !newKeyName.trim()}>
                  {isCreatingKey ? 'Creating...' : 'Create Key'}
                </Button>
              </div>

              {/* Show newly created key */}
              {createdKey && (
                <Alert>
                  <AlertDescription className="flex flex-col gap-2">
                    <p className="font-semibold">Save this key now - it won&apos;t be shown again!</p>
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
                  <p className="text-muted-foreground">Loading keys...</p>
                ) : apiKeys.length === 0 ? (
                  <p className="text-muted-foreground">No API keys created yet</p>
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

        {/* Team Tab */}
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage who has access to your ATP organization</CardDescription>
                </div>
                <Button>Invite Member</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={member.role === 'Admin' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                      <Button variant="outline" size="sm">Edit</Button>
                    </div>
                  </div>
                ))}
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
                    <li>✓ Unlimited API calls</li>
                    <li>✓ 10 agent registrations</li>
                    <li>✓ Quantum-safe signatures</li>
                    <li>✓ Priority support</li>
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
                <Label>Organization Name</Label>
                <Input defaultValue="My Organization" />
              </div>

              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input placeholder="https://your-api.com/webhook" />
                <p className="text-xs text-muted-foreground">
                  Receive real-time notifications for agent events
                </p>
              </div>

              <div className="space-y-2">
                <Label>IP Allowlist</Label>
                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <Button variant="outline" className="w-full">Manage IP Restrictions</Button>
                  </CardContent>
                </Card>
              </div>

              <Button>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
