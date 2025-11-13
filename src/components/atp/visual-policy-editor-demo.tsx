'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield,
  Plus,
  Trash2,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Database,
  Network,
  Clock,
  Lock,
  Eye,
  Settings,
  ArrowRight
} from "lucide-react"

interface PolicyNode {
  id: string
  type: 'condition' | 'action' | 'agent' | 'resource'
  title: string
  config: Record<string, any>
  position: { x: number; y: number }
  connections: string[]
}

interface PolicyRule {
  id: string
  name: string
  description: string
  nodes: PolicyNode[]
  status: 'active' | 'draft' | 'testing'
  lastModified: string
}

const NODE_TYPES = {
  condition: {
    icon: AlertTriangle,
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    examples: [
      { title: 'Trust Level Check', desc: 'Verify minimum trust score' },
      { title: 'Time Window', desc: 'Check if within allowed hours' },
      { title: 'Location Verify', desc: 'Validate geographic region' },
      { title: 'Rate Limit', desc: 'Check request frequency' }
    ]
  },
  action: {
    icon: CheckCircle,
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    examples: [
      { title: 'Grant Access', desc: 'Allow the requested action' },
      { title: 'Deny Access', desc: 'Block the requested action' },
      { title: 'Log Event', desc: 'Record to audit trail' },
      { title: 'Send Alert', desc: 'Notify administrators' }
    ]
  },
  agent: {
    icon: Users,
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    examples: [
      { title: 'AI Assistant', desc: 'General purpose agent' },
      { title: 'Data Processor', desc: 'Analytics and ML agent' },
      { title: 'API Gateway', desc: 'Service integration agent' },
      { title: 'Security Monitor', desc: 'Threat detection agent' }
    ]
  },
  resource: {
    icon: Database,
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    examples: [
      { title: 'User Database', desc: 'Customer information' },
      { title: 'API Endpoint', desc: 'External service access' },
      { title: 'File Storage', desc: 'Document repository' },
      { title: 'Payment System', desc: 'Financial transactions' }
    ]
  }
}

export function VisualPolicyEditorDemo() {
  const router = useRouter()
  const [currentRule, setCurrentRule] = useState<PolicyRule>({
    id: 'demo-rule-1',
    name: 'Data Access Policy',
    description: 'Controls agent access to sensitive customer data',
    nodes: [
      {
        id: 'agent-1',
        type: 'agent',
        title: 'AI Assistant',
        config: { trustLevel: 'verified' },
        position: { x: 50, y: 100 },
        connections: ['condition-1']
      },
      {
        id: 'condition-1',
        type: 'condition',
        title: 'Trust Level Check',
        config: { minTrust: 85, requireMFA: true },
        position: { x: 250, y: 100 },
        connections: ['condition-2']
      },
      {
        id: 'condition-2',
        type: 'condition',
        title: 'Time Window',
        config: { startHour: 9, endHour: 17, timezone: 'UTC' },
        position: { x: 450, y: 100 },
        connections: ['action-1', 'action-2']
      },
      {
        id: 'action-1',
        type: 'action',
        title: 'Grant Access',
        config: { level: 'read-only', duration: 3600 },
        position: { x: 650, y: 50 },
        connections: []
      },
      {
        id: 'action-2',
        type: 'action',
        title: 'Deny Access',
        config: { reason: 'outside_hours', notify: true },
        position: { x: 650, y: 150 },
        connections: []
      }
    ],
    status: 'active',
    lastModified: new Date().toISOString()
  })

  const [selectedNode, setSelectedNode] = useState<PolicyNode | null>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [isValidating, setIsValidating] = useState(false)

  const addNode = (type: keyof typeof NODE_TYPES) => {
    const newNode: PolicyNode = {
      id: `${type}-${Date.now()}`,
      type,
      title: NODE_TYPES[type].examples[0].title,
      config: {},
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      connections: []
    }

    setCurrentRule(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }))
  }

  const deleteNode = (nodeId: string) => {
    setCurrentRule(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId)
    }))
    setSelectedNode(null)
  }

  const testPolicy = async () => {
    setIsValidating(true)

    // Simulate policy validation
    await new Promise(resolve => setTimeout(resolve, 2000))

    const scenarios = [
      {
        name: 'Verified Agent - Business Hours',
        agent: 'AI Assistant (Trust: 92)',
        time: '2024-01-15 14:30 UTC',
        result: 'ALLOW',
        reason: 'All conditions met',
        color: 'text-green-500'
      },
      {
        name: 'Verified Agent - After Hours',
        agent: 'AI Assistant (Trust: 92)',
        time: '2024-01-15 20:30 UTC',
        result: 'DENY',
        reason: 'Outside business hours',
        color: 'text-red-500'
      },
      {
        name: 'Unverified Agent - Business Hours',
        agent: 'Data Processor (Trust: 45)',
        time: '2024-01-15 10:00 UTC',
        result: 'DENY',
        reason: 'Insufficient trust level',
        color: 'text-red-500'
      }
    ]

    setTestResult(scenarios)
    setIsValidating(false)
  }

  const NodeIcon = selectedNode ? NODE_TYPES[selectedNode.type]?.icon : Shield

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Settings className="h-8 w-8 text-blue-500" />
          <h2 className="text-3xl font-bold">Visual Policy Editor Demo</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Design trust policies with drag-and-drop simplicity. No code required -
          create complex agent access rules visually.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Eye size={14} className="mr-1" />
            Visual Design
          </Badge>
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle size={14} className="mr-1" />
            No Code Required
          </Badge>
          <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
            <Shield size={14} className="mr-1" />
            Real-time Validation
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="designer" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="designer">Policy Designer</TabsTrigger>
          <TabsTrigger value="testing">Testing Suite</TabsTrigger>
          <TabsTrigger value="preview">Preview & Deploy</TabsTrigger>
        </TabsList>

        <TabsContent value="designer" className="space-y-4">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Node Palette */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Components</CardTitle>
                <CardDescription>Drag elements to build your policy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(NODE_TYPES).map(([type, config]) => {
                  const Icon = config.icon
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize">{type}s</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addNode(type as keyof typeof NODE_TYPES)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {config.examples.slice(0, 2).map((example, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded border text-xs ${config.color} cursor-pointer hover:opacity-80`}
                          >
                            <div className="flex items-center gap-1">
                              <Icon size={12} />
                              <span className="font-medium">{example.title}</span>
                            </div>
                            <div className="text-xs opacity-75 mt-1">{example.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Policy Canvas */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{currentRule.name}</CardTitle>
                      <CardDescription>{currentRule.description}</CardDescription>
                    </div>
                    <Badge className={
                      currentRule.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      currentRule.status === 'testing' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                      'bg-gray-500/10 text-gray-500 border-gray-500/20'
                    }>
                      {currentRule.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative bg-muted/30 rounded-lg p-6 min-h-[400px] border-2 border-dashed">
                    {/* Simplified visual representation */}
                    <div className="flex items-center justify-center space-x-8">
                      {currentRule.nodes.map((node, index) => {
                        const NodeType = NODE_TYPES[node.type]
                        const Icon = NodeType.icon
                        return (
                          <div key={node.id} className="flex flex-col items-center">
                            <div
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:scale-105 ${NodeType.color} ${
                                selectedNode?.id === node.id ? 'ring-2 ring-blue-500' : ''
                              }`}
                              onClick={() => setSelectedNode(node)}
                            >
                              <Icon size={24} />
                              <div className="text-xs mt-2 text-center max-w-20 break-words">
                                {node.title}
                              </div>
                            </div>
                            {index < currentRule.nodes.length - 1 && (
                              <ArrowRight className="h-4 w-4 mt-4 text-muted-foreground" />
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {currentRule.nodes.length === 0 && (
                      <div className="text-center py-16">
                        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Start by adding components from the palette</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Properties Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Properties</CardTitle>
                <CardDescription>
                  {selectedNode ? `Configure ${selectedNode.title}` : 'Select a component'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedNode ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {NodeIcon && <NodeIcon size={16} />}
                      <span className="font-medium">{selectedNode.title}</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Title</label>
                        <Input
                          value={selectedNode.title}
                          onChange={(e) => {
                            const updated = { ...selectedNode, title: e.target.value }
                            setSelectedNode(updated)
                            setCurrentRule(prev => ({
                              ...prev,
                              nodes: prev.nodes.map(n => n.id === updated.id ? updated : n)
                            }))
                          }}
                          className="mt-1"
                        />
                      </div>

                      {selectedNode.type === 'condition' && (
                        <>
                          <div>
                            <label className="text-sm font-medium">Min Trust Level</label>
                            <Input
                              type="number"
                              placeholder="85"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Time Window</label>
                            <Select>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Business hours" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="business">Business Hours (9-17)</SelectItem>
                                <SelectItem value="extended">Extended (7-19)</SelectItem>
                                <SelectItem value="always">24/7</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}

                      {selectedNode.type === 'action' && (
                        <div>
                          <label className="text-sm font-medium">Access Level</label>
                          <Select>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Read-only" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="read">Read Only</SelectItem>
                              <SelectItem value="write">Read/Write</SelectItem>
                              <SelectItem value="admin">Administrator</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteNode(selectedNode.id)}
                      className="w-full"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete Component
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Click on a component to configure its properties
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Policy Testing Suite
              </CardTitle>
              <CardDescription>
                Test your policy against different scenarios to ensure it works as expected
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testPolicy} disabled={isValidating} size="lg" className="w-full">
                {isValidating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Running Policy Tests...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Test Scenarios
                  </>
                )}
              </Button>

              {testResult && (
                <div className="space-y-3">
                  <h4 className="font-medium">Test Results</h4>
                  {testResult.map((scenario: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{scenario.name}</span>
                        <Badge className={
                          scenario.result === 'ALLOW'
                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }>
                          {scenario.result}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Agent: {scenario.agent}</div>
                        <div>Time: {scenario.time}</div>
                        <div>Reason: {scenario.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Policy Preview</CardTitle>
              <CardDescription>
                Review and deploy your policy to production
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm">
{`policy "${currentRule.name}" {
  description = "${currentRule.description}"

  rule "agent_access" {
    condition {
      agent.trust_level >= 85
      time.hour >= 9 && time.hour <= 17
      mfa.required = true
    }

    action {
      allow {
        level = "read-only"
        duration = "1h"
      }
    }
  }
}`}
                </pre>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-900 dark:text-yellow-100">Demo Mode</span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  This is a demonstration. To deploy policies to production, sign up for ATP Enterprise.
                </p>
                <Button className="mt-3" onClick={() => router.push('/enterprise')}>
                  Get Production Access
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}