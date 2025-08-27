'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function CustomerPortal() {
  const router = useRouter();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Move all state declarations to the top
  const [apiKeys, setApiKeys] = useState([
    { id: 1, name: 'Production API', key: 'atp_prod_****', created: '2024-01-15', status: 'active' },
    { id: 2, name: 'Development API', key: 'atp_dev_****', created: '2024-01-10', status: 'active' }
  ]);

  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'John Doe', email: 'john@company.com', role: 'Admin', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@company.com', role: 'Developer', status: 'active' }
  ]);

  const [billing] = useState({
    plan: 'Professional',
    price: '$1,500/month',
    nextBilling: '2024-02-01',
    usage: {
      agents: { current: 45, limit: 100 },
      requests: { current: 125000, limit: 250000 },
      storage: { current: 15, limit: 50 }
    }
  });
  
  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('atp_token');
    const tenantData = localStorage.getItem('atp_tenant');
    
    if (!token || !tenantData) {
      router.push('/login');
      return;
    }
    
    setTenant(JSON.parse(tenantData));
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('atp_token');
    localStorage.removeItem('atp_tenant');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4">Loading portal...</p>
        </div>
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
            Welcome back, {tenant?.name || 'Guest'}! Manage your ATP subscription, team, and API access.
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Sign Out
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{billing.plan}</div>
            <p className="text-sm text-muted-foreground">{billing.price}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Active Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {billing.usage.agents.current}/{billing.usage.agents.limit}
            </div>
            <Progress 
              value={(billing.usage.agents.current / billing.usage.agents.limit) * 100} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">API Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(billing.usage.requests.current / 1000).toFixed(0)}K
            </div>
            <Progress 
              value={(billing.usage.requests.current / billing.usage.requests.limit) * 100} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-sm text-muted-foreground">Active users</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Quick links and resources to get you started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">📚 Documentation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Complete API reference and integration guides
                    </p>
                    <Button variant="outline" className="w-full">View Docs</Button>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">🚀 Quick Start</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Get up and running in 5 minutes with our SDK
                    </p>
                    <Button variant="outline" className="w-full">Start Tutorial</Button>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Trial Ending Soon:</strong> Your trial ends in 7 days. Upgrade now to continue using all features.
                  <Button variant="link" className="ml-2 p-0 h-auto">Upgrade Plan →</Button>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage your API credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button>+ Generate New Key</Button>
                </div>
                
                <div className="space-y-2">
                  {apiKeys.map(key => (
                    <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{key.name}</p>
                        <p className="text-sm text-muted-foreground font-mono">{key.key}</p>
                        <p className="text-xs text-muted-foreground">Created: {key.created}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                          {key.status}
                        </Badge>
                        <Button variant="outline" size="sm">Copy</Button>
                        <Button variant="outline" size="sm">Rotate</Button>
                        <Button variant="destructive" size="sm">Revoke</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage your team's access</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button>+ Invite Member</Button>
                </div>
                
                <div className="space-y-2">
                  {teamMembers.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{member.role}</Badge>
                        <Button variant="outline" size="sm">Edit Role</Button>
                        <Button variant="destructive" size="sm">Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Usage</CardTitle>
              <CardDescription>Manage your subscription and view usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Current Plan</span>
                  <span className="font-bold">{billing.plan} - {billing.price}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Next billing date</span>
                  <span>{billing.nextBilling}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Current Usage</h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Quantum Agents</span>
                      <span className="text-sm">{billing.usage.agents.current} / {billing.usage.agents.limit}</span>
                    </div>
                    <Progress value={(billing.usage.agents.current / billing.usage.agents.limit) * 100} />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">API Requests</span>
                      <span className="text-sm">{billing.usage.requests.current.toLocaleString()} / {billing.usage.requests.limit.toLocaleString()}</span>
                    </div>
                    <Progress value={(billing.usage.requests.current / billing.usage.requests.limit) * 100} />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Storage (GB)</span>
                      <span className="text-sm">{billing.usage.storage.current} / {billing.usage.storage.limit}</span>
                    </div>
                    <Progress value={(billing.usage.storage.current / billing.usage.storage.limit) * 100} />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline">View Invoices</Button>
                <Button variant="outline">Update Payment</Button>
                <Button>Upgrade Plan</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>Configure your organization preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input id="org-name" placeholder="Your Company" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook">Webhook URL</Label>
                <Input id="webhook" placeholder="https://your-app.com/webhook" />
              </div>

              <div className="space-y-2">
                <Label>SSO Configuration</Label>
                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <Button variant="outline" className="w-full">Configure SAML/OIDC</Button>
                  </CardContent>
                </Card>
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