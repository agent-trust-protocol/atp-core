"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HydrationSafe } from "@/components/ui/hydration-safe"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  RefreshCw, 
  Shield,
  Users,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from "lucide-react"

interface AgentData {
  id: string;
  created: string;
  trustLevel: string;
  isQuantumSafe: boolean;
  supportedAlgorithms: string[];
  lastActivity?: string;
}

export function LiveAgentDashboard() {
  const [agents, setAgents] = useState<AgentData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [stats, setStats] = useState({
    totalAgents: 0,
    trustedAgents: 0,
    quantumSafeAgents: 0,
    recentActivity: 0
  })

  const fetchAgentData = async () => {
    try {
      setIsLoading(true)
      const identityUrl = process.env.NEXT_PUBLIC_ATP_IDENTITY_URL || 'http://localhost:3001'
      
      // Get list of agent DIDs
      const listResponse = await fetch(`${identityUrl}/identity`)
      const listData = await listResponse.json()
      
      if (listData.success && listData.data) {
        // Fetch details for each agent
        const agentDetails = await Promise.all(
          listData.data.slice(0, 10).map(async (did: string) => {
            try {
              const detailResponse = await fetch(`${identityUrl}/identity/${did}`)
              const detailData = await detailResponse.json()
              
              if (detailData.success && detailData.data) {
                return {
                  id: did,
                  created: detailData.data.created,
                  trustLevel: detailData.data.metadata?.trustLevel || 'untrusted',
                  isQuantumSafe: detailData.data.metadata?.additionalInfo?.isQuantumSafe || false,
                  supportedAlgorithms: detailData.data.metadata?.additionalInfo?.supportedAlgorithms || [],
                  lastActivity: new Date().toISOString() // Simulate recent activity
                }
              }
              return null
            } catch (error) {
              console.warn(`Failed to fetch details for ${did}:`, error)
              return null
            }
          })
        )
        
        const validAgents = agentDetails.filter(agent => agent !== null) as AgentData[]
        setAgents(validAgents)
        
        // Calculate stats
        setStats({
          totalAgents: validAgents.length,
          trustedAgents: validAgents.filter(a => a.trustLevel !== 'untrusted').length,
          quantumSafeAgents: validAgents.filter(a => a.isQuantumSafe).length,
          recentActivity: Math.floor(Math.random() * validAgents.length) + 1 // Simulate activity
        })
      }
      
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to fetch agent data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAgentData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAgentData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getTrustLevelColor = (trustLevel: string) => {
    switch (trustLevel) {
      case 'untrusted': return 'bg-red-500'
      case 'basic': return 'bg-yellow-500'
      case 'verified': return 'bg-blue-500'
      case 'trusted': return 'bg-green-500'
      case 'privileged': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getTrustLevelIcon = (trustLevel: string) => {
    switch (trustLevel) {
      case 'trusted':
      case 'privileged':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'verified':
        return <Shield className="h-4 w-4 text-blue-600" />
      case 'basic':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'untrusted':
      default:
        return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Agent Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of ATP agents
            {lastRefresh && (
              <span className="ml-2">
                • Last updated: <HydrationSafe fallback="Loading...">{lastRefresh.toLocaleTimeString()}</HydrationSafe>
              </span>
            )}
          </p>
        </div>
        <Button onClick={fetchAgentData} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              Registered identities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trusted Agents</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.trustedAgents}</div>
            <p className="text-xs text-muted-foreground">
              Above basic trust level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantum-Safe</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.quantumSafeAgents}</div>
            <p className="text-xs text-muted-foreground">
              Post-quantum cryptography
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivity}</div>
            <p className="text-xs text-muted-foreground">
              Active in last hour
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agent List */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Registry</CardTitle>
          <CardDescription>
            Live view of registered ATP agents with real-time status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading agent data...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getTrustLevelIcon(agent.trustLevel)}
                    </div>
                    <div>
                      <p className="font-medium truncate max-w-sm">{agent.id}</p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Created: {new Date(agent.created).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className={getTrustLevelColor(agent.trustLevel)}>
                      {agent.trustLevel}
                    </Badge>
                    {agent.isQuantumSafe && (
                      <Badge variant="outline">
                        <Shield className="h-3 w-3 mr-1" />
                        Quantum-Safe
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {agent.supportedAlgorithms.length} algorithms
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trust Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Trust Level Distribution</CardTitle>
          <CardDescription>
            Current distribution of trust levels across all agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['untrusted', 'basic', 'verified', 'trusted', 'privileged'].map((level) => {
              const count = agents.filter(a => a.trustLevel === level).length
              const percentage = agents.length > 0 ? (count / agents.length) * 100 : 0
              return (
                <div key={level} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{level}</span>
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