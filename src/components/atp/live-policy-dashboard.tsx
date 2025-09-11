"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HydrationSafe } from "@/components/ui/hydration-safe"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  RefreshCw,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Activity,
  Gauge,
  Eye
} from "lucide-react"

interface PolicyData {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  rules: Array<{
    id: string;
    name: string;
    enabled: boolean;
    action: {
      type: string;
    };
  }>;
  tags: string[];
  createdAt: string;
}

export function LivePolicyDashboard() {
  const [policies, setPolicies] = useState<PolicyData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [stats, setStats] = useState({
    totalPolicies: 0,
    activePolicies: 0,
    totalRules: 0,
    allowRules: 0,
    denyRules: 0
  })

  const fetchPolicyData = async () => {
    try {
      setIsLoading(true)
      const permissionUrl = process.env.NEXT_PUBLIC_ATP_PERMISSION_URL || 'http://localhost:3003'
      
      const response = await fetch(`${permissionUrl}/policies`)
      const data = await response.json()
      
      if (data.policies) {
        // Normalize incoming data to avoid runtime errors when optional fields are missing
        const normalizedPolicies: PolicyData[] = data.policies.map((p: any) => ({
          ...p,
          tags: Array.isArray(p?.tags) ? p.tags : [],
          rules: Array.isArray(p?.rules) ? p.rules : []
        }))

        setPolicies(normalizedPolicies)
        
        // Calculate stats
        const totalRules = normalizedPolicies.reduce((sum: number, p: PolicyData) => sum + p.rules.length, 0)
        const allowRules = normalizedPolicies.reduce((sum: number, p: PolicyData) => 
          sum + p.rules.filter(r => r.action.type === 'allow').length, 0)
        const denyRules = normalizedPolicies.reduce((sum: number, p: PolicyData) => 
          sum + p.rules.filter(r => r.action.type === 'deny').length, 0)
        
        setStats({
          totalPolicies: normalizedPolicies.length,
          activePolicies: normalizedPolicies.filter((p: PolicyData) => p.enabled).length,
          totalRules,
          allowRules,
          denyRules
        })
      }
      
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to fetch policy data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPolicyData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPolicyData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'allow': return 'text-green-600'
      case 'deny': return 'text-red-600'
      case 'throttle': return 'text-yellow-600'
      case 'require_approval': return 'text-purple-600'
      case 'log': return 'text-blue-600'
      case 'alert': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'allow': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'deny': return <XCircle className="h-4 w-4 text-red-600" />
      case 'throttle': return <Gauge className="h-4 w-4 text-yellow-600" />
      case 'require_approval': return <AlertTriangle className="h-4 w-4 text-purple-600" />
      case 'log': return <FileText className="h-4 w-4 text-blue-600" />
      case 'alert': return <AlertTriangle className="h-4 w-4 text-orange-600" />
      default: return <Eye className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Policy Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of ATP trust policies
            {lastRefresh && (
              <span className="ml-2">
                • Last updated: <HydrationSafe fallback="Loading...">{lastRefresh.toLocaleTimeString()}</HydrationSafe>
              </span>
            )}
          </p>
        </div>
        <Button onClick={fetchPolicyData} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Policy Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPolicies}</div>
            <p className="text-xs text-muted-foreground">
              Configured policies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePolicies}</div>
            <p className="text-xs text-muted-foreground">
              Currently enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRules}</div>
            <p className="text-xs text-muted-foreground">
              Policy rules defined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allow Rules</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.allowRules}</div>
            <p className="text-xs text-muted-foreground">
              Permissive actions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deny Rules</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.denyRules}</div>
            <p className="text-xs text-muted-foreground">
              Restrictive actions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Policy List */}
      <Card>
        <CardHeader>
          <CardTitle>Policy Registry</CardTitle>
          <CardDescription>
            Live view of configured trust policies with rule breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading policy data...</p>
            </div>
          ) : policies.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No policies configured</p>
            </div>
          ) : (
            <div className="space-y-4">
              {policies.map((policy) => (
                <div key={policy.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{policy.name}</h3>
                        <Badge variant={policy.enabled ? "default" : "secondary"}>
                          {policy.enabled ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {policy.description && (
                        <p className="text-sm text-muted-foreground">{policy.description}</p>
                      )}
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Created: {new Date(policy.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {policy.rules.length} rule{policy.rules.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Rule breakdown */}
                  {policy.rules.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium">Rules:</h4>
                      <div className="grid gap-2">
                        {policy.rules.map((rule) => (
                          <div key={rule.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center space-x-2">
                              {getActionIcon(rule.action.type)}
                              <span className="text-sm">{rule.name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className={getActionColor(rule.action.type)}>
                                {rule.action.type}
                              </Badge>
                              <Badge variant={rule.enabled ? "default" : "secondary"} className="text-xs">
                                {rule.enabled ? "On" : "Off"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {policy.tags?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {policy.tags?.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Action Type Distribution</CardTitle>
          <CardDescription>
            Distribution of action types across all policy rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['allow', 'deny', 'throttle', 'log', 'alert', 'require_approval'].map((actionType) => {
              const count = policies.reduce((sum, p) => 
                sum + p.rules.filter(r => r.action.type === actionType).length, 0)
              const percentage = stats.totalRules > 0 ? (count / stats.totalRules) * 100 : 0
              
              if (count === 0) return null
              
              return (
                <div key={actionType} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      {getActionIcon(actionType)}
                      <span className="capitalize">{actionType.replace('_', ' ')}</span>
                    </div>
                    <span>{count} ({Math.round(percentage)}%)</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}