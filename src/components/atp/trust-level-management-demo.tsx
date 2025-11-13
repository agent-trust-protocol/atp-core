'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Star,
  Activity,
  Clock,
  Award,
  Zap,
  Lock,
  RefreshCw,
  Plus,
  ArrowRight
} from "lucide-react"

interface Agent {
  id: string
  name: string
  type: 'AI Assistant' | 'Data Processor' | 'API Gateway' | 'Security Monitor' | 'Custom'
  trustLevel: number
  status: 'active' | 'inactive' | 'suspended' | 'pending'
  capabilities: string[]
  verificationDate: string
  successfulOperations: number
  failedOperations: number
  riskFactors: string[]
  accessLevel: 'basic' | 'elevated' | 'admin'
}

interface TrustMetrics {
  averageTrust: number
  totalAgents: number
  verifiedAgents: number
  suspiciousActivity: number
  trustTrend: 'up' | 'down' | 'stable'
}

const DEMO_AGENTS: Agent[] = [
  {
    id: 'agent-001',
    name: 'ChatBot Assistant Pro',
    type: 'AI Assistant',
    trustLevel: 92,
    status: 'active',
    capabilities: ['text_generation', 'conversation', 'knowledge_qa'],
    verificationDate: '2024-01-10T10:00:00Z',
    successfulOperations: 15420,
    failedOperations: 23,
    riskFactors: [],
    accessLevel: 'elevated'
  },
  {
    id: 'agent-002',
    name: 'DataMiner Analytics',
    type: 'Data Processor',
    trustLevel: 78,
    status: 'active',
    capabilities: ['data_analysis', 'ml_inference', 'reporting'],
    verificationDate: '2024-01-08T14:30:00Z',
    successfulOperations: 8934,
    failedOperations: 156,
    riskFactors: ['high_error_rate'],
    accessLevel: 'basic'
  },
  {
    id: 'agent-003',
    name: 'SecureGate Monitor',
    type: 'Security Monitor',
    trustLevel: 96,
    status: 'active',
    capabilities: ['threat_detection', 'anomaly_analysis', 'incident_response'],
    verificationDate: '2024-01-12T09:15:00Z',
    successfulOperations: 23567,
    failedOperations: 12,
    riskFactors: [],
    accessLevel: 'admin'
  },
  {
    id: 'agent-004',
    name: 'NewBot Trial',
    type: 'Custom',
    trustLevel: 45,
    status: 'pending',
    capabilities: ['experimental'],
    verificationDate: '2024-01-15T16:00:00Z',
    successfulOperations: 234,
    failedOperations: 67,
    riskFactors: ['unverified_source', 'limited_history'],
    accessLevel: 'basic'
  }
]

export function TrustLevelManagementDemo() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>(DEMO_AGENTS)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(agents[0])
  const [newAgentName, setNewAgentName] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [metrics, setMetrics] = useState<TrustMetrics>({
    averageTrust: 78,
    totalAgents: 4,
    verifiedAgents: 3,
    suspiciousActivity: 1,
    trustTrend: 'up'
  })

  const getTrustColor = (trust: number) => {
    if (trust >= 90) return 'text-green-500'
    if (trust >= 70) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getTrustBadge = (trust: number) => {
    if (trust >= 90) return { label: 'Highly Trusted', color: 'bg-green-500/10 text-green-500 border-green-500/20' }
    if (trust >= 70) return { label: 'Trusted', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' }
    return { label: 'Limited Trust', color: 'bg-red-500/10 text-red-500 border-red-500/20' }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return { label: 'Active', color: 'bg-green-500/10 text-green-500 border-green-500/20' }
      case 'inactive': return { label: 'Inactive', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' }
      case 'suspended': return { label: 'Suspended', color: 'bg-red-500/10 text-red-500 border-red-500/20' }
      case 'pending': return { label: 'Pending Review', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' }
      default: return { label: status, color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' }
    }
  }

  const registerNewAgent = async () => {
    if (!newAgentName.trim()) return

    setIsRegistering(true)

    // Simulate registration process
    await new Promise(resolve => setTimeout(resolve, 2000))

    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name: newAgentName,
      type: 'Custom',
      trustLevel: 50, // Starting trust level
      status: 'pending',
      capabilities: ['basic_operations'],
      verificationDate: new Date().toISOString(),
      successfulOperations: 0,
      failedOperations: 0,
      riskFactors: ['unverified_source', 'new_agent'],
      accessLevel: 'basic'
    }

    setAgents(prev => [...prev, newAgent])
    setNewAgentName('')
    setIsRegistering(false)
    setSelectedAgent(newAgent)

    // Update metrics
    setMetrics(prev => ({
      ...prev,
      totalAgents: prev.totalAgents + 1
    }))
  }

  const updateTrustLevel = (agentId: string, change: number) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        const newTrust = Math.max(0, Math.min(100, agent.trustLevel + change))
        return { ...agent, trustLevel: newTrust }
      }
      return agent
    }))

    if (selectedAgent?.id === agentId) {
      setSelectedAgent(prev => prev ? { ...prev, trustLevel: Math.max(0, Math.min(100, prev.trustLevel + change)) } : null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Users className="h-8 w-8 text-blue-500" />
          <h2 className="text-3xl font-bold">Trust Level Management Demo</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Experience dynamic trust evaluation and capability-based access control.
          Register agents and watch their trust levels evolve based on behavior.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Activity size={14} className="mr-1" />
            Dynamic Evaluation
          </Badge>
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <Shield size={14} className="mr-1" />
            Capability-Based Access
          </Badge>
          <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
            <TrendingUp size={14} className="mr-1" />
            Multi-Level Progression
          </Badge>
        </div>
      </div>

      {/* Trust Metrics Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Trust</p>
                <p className="text-2xl font-bold">{metrics.averageTrust}%</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-500">+2.3% this week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Agents</p>
                <p className="text-2xl font-bold">{metrics.totalAgents}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Plus className="h-3 w-3 text-blue-500" />
              <span className="text-xs text-blue-500">3 new this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold">{metrics.verifiedAgents}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {Math.round((metrics.verifiedAgents / metrics.totalAgents) * 100)}% verification rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alerts</p>
                <p className="text-2xl font-bold">{metrics.suspiciousActivity}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Requires attention
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="agents">Agent Registry</TabsTrigger>
          <TabsTrigger value="register">Register New Agent</TabsTrigger>
          <TabsTrigger value="analytics">Trust Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Agent List */}
            <Card>
              <CardHeader>
                <CardTitle>Registered Agents</CardTitle>
                <CardDescription>Manage and monitor your AI agents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {agents.map(agent => {
                  const trustBadge = getTrustBadge(agent.trustLevel)
                  const statusBadge = getStatusBadge(agent.status)

                  return (
                    <div
                      key={agent.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-blue-500 ${
                        selectedAgent?.id === agent.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''
                      }`}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">{agent.name}</span>
                        </div>
                        <Badge className={statusBadge.color}>{statusBadge.label}</Badge>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">{agent.type}</span>
                        <Badge className={trustBadge.color}>{trustBadge.label}</Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Trust Level: {agent.trustLevel}%
                        </span>
                        <Progress value={agent.trustLevel} className="w-20 h-2" />
                      </div>

                      {agent.riskFactors.length > 0 && (
                        <div className="mt-2 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs text-yellow-600">
                            {agent.riskFactors.length} risk factor(s)
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Agent Details */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedAgent ? `${selectedAgent.name} Details` : 'Agent Details'}
                </CardTitle>
                <CardDescription>
                  {selectedAgent ? 'View and manage agent trust settings' : 'Select an agent to view details'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedAgent ? (
                  <div className="space-y-6">
                    {/* Trust Level Display */}
                    <div className="text-center space-y-4">
                      <div className="relative inline-flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full border-8 border-muted flex items-center justify-center">
                          <div className="text-center">
                            <div className={`text-3xl font-bold ${getTrustColor(selectedAgent.trustLevel)}`}>
                              {selectedAgent.trustLevel}
                            </div>
                            <div className="text-xs text-muted-foreground">Trust Score</div>
                          </div>
                        </div>
                      </div>
                      <Badge className={getTrustBadge(selectedAgent.trustLevel).color}>
                        {getTrustBadge(selectedAgent.trustLevel).label}
                      </Badge>
                    </div>

                    {/* Agent Info */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="font-medium text-muted-foreground">Type</label>
                          <div>{selectedAgent.type}</div>
                        </div>
                        <div>
                          <label className="font-medium text-muted-foreground">Access Level</label>
                          <div className="capitalize">{selectedAgent.accessLevel}</div>
                        </div>
                        <div>
                          <label className="font-medium text-muted-foreground">Successful Ops</label>
                          <div className="text-green-500">{selectedAgent.successfulOperations.toLocaleString()}</div>
                        </div>
                        <div>
                          <label className="font-medium text-muted-foreground">Failed Ops</label>
                          <div className="text-red-500">{selectedAgent.failedOperations.toLocaleString()}</div>
                        </div>
                      </div>

                      <div>
                        <label className="font-medium text-muted-foreground">Capabilities</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedAgent.capabilities.map(cap => (
                            <Badge key={cap} variant="outline" className="text-xs">
                              {cap.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {selectedAgent.riskFactors.length > 0 && (
                        <div>
                          <label className="font-medium text-muted-foreground">Risk Factors</label>
                          <div className="space-y-1 mt-1">
                            {selectedAgent.riskFactors.map(risk => (
                              <div key={risk} className="flex items-center gap-2 text-sm">
                                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                <span className="text-yellow-600">{risk.replace('_', ' ')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Demo Controls */}
                      <div className="pt-4 border-t space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Demo Controls</div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTrustLevel(selectedAgent.id, 5)}
                          >
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +5
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTrustLevel(selectedAgent.id, -5)}
                          >
                            <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                            -5
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Select an agent to view detailed information</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="register" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Register New Agent
              </CardTitle>
              <CardDescription>
                Add a new AI agent to your trust network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Agent Name</label>
                  <Input
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                    placeholder="Enter agent name..."
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={registerNewAgent}
                  disabled={isRegistering || !newAgentName.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isRegistering ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Registering Agent...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Register Agent
                    </>
                  )}
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium mb-2">Registration Process</h4>
                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Initial trust score assigned (50%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Basic capabilities granted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span>Pending verification review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span>Trust level adjusts based on behavior</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trust Analytics</CardTitle>
              <CardDescription>
                Analyze trust patterns and agent behavior trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">96%</div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">2.3s</div>
                    <div className="text-sm text-muted-foreground">Avg Response</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">15K</div>
                    <div className="text-sm text-muted-foreground">Daily Operations</div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-900 dark:text-yellow-100">Demo Analytics</span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                    Full trust analytics with ML-powered insights available in production deployment.
                  </p>
                  <Button onClick={() => router.push('/enterprise')}>
                    Get Full Analytics
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}