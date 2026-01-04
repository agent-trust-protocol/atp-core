"use client"

import { useState } from "react"
import { 
  GitBranch, 
  Plus, 
  Search, 
  Filter,
  Clock,
  Play,
  Calendar,
  Webhook,
  Zap,
  Shield,
  Activity,
  FileText,
  RefreshCw,
  Upload,
  Database,
  Globe,
  Mail,
  Terminal,
  Server,
  Users,
  Settings,
  ChevronRight,
  ChevronDown,
  Variable,
  History,
  Save,
  FolderOpen,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { NodeCategory } from "@/workflow-engine/types/WorkflowTypes"

interface NodeTemplate {
  id: string
  category: NodeCategory
  type: string
  label: string
  description: string
  icon: React.ReactNode
  config?: Record<string, any>
}

interface WorkflowVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  value: any
  description?: string
  isSecret?: boolean
}

interface ExecutionHistoryItem {
  id: string
  workflowName: string
  status: 'success' | 'failed' | 'running' | 'cancelled'
  startTime: Date
  endTime?: Date
  duration?: number
  triggeredBy: string
  error?: string
}

const nodeTemplates: Record<NodeCategory, NodeTemplate[]> = {
  trigger: [
    {
      id: 'manual-trigger',
      category: 'trigger',
      type: 'manual',
      label: 'Manual Trigger',
      description: 'Start workflow manually',
      icon: <Play className="h-4 w-4" />
    },
    {
      id: 'schedule-trigger',
      category: 'trigger',
      type: 'schedule',
      label: 'Schedule Trigger',
      description: 'Run on a schedule',
      icon: <Calendar className="h-4 w-4" />
    },
    {
      id: 'webhook-trigger',
      category: 'trigger',
      type: 'webhook',
      label: 'Webhook Trigger',
      description: 'Triggered by webhook',
      icon: <Webhook className="h-4 w-4" />
    },
    {
      id: 'event-trigger',
      category: 'trigger',
      type: 'event',
      label: 'Event Trigger',
      description: 'React to system events',
      icon: <Zap className="h-4 w-4" />
    },
    {
      id: 'policy-change-trigger',
      category: 'trigger',
      type: 'policy-change',
      label: 'Policy Change',
      description: 'When policy is modified',
      icon: <Shield className="h-4 w-4" />
    },
    {
      id: 'trust-change-trigger',
      category: 'trigger',
      type: 'trust-change',
      label: 'Trust Change',
      description: 'When trust level changes',
      icon: <Activity className="h-4 w-4" />
    }
  ],
  action: [
    {
      id: 'create-policy',
      category: 'action',
      type: 'create-policy',
      label: 'Create Policy',
      description: 'Create new ATP policy',
      icon: <FileText className="h-4 w-4" />
    },
    {
      id: 'update-policy',
      category: 'action',
      type: 'update-policy',
      label: 'Update Policy',
      description: 'Modify existing policy',
      icon: <RefreshCw className="h-4 w-4" />
    },
    {
      id: 'deploy-policy',
      category: 'action',
      type: 'deploy-policy',
      label: 'Deploy Policy',
      description: 'Deploy policy to agents',
      icon: <Upload className="h-4 w-4" />
    },
    {
      id: 'evaluate-trust',
      category: 'action',
      type: 'evaluate-trust',
      label: 'Evaluate Trust',
      description: 'Calculate trust score',
      icon: <Shield className="h-4 w-4" />
    },
    {
      id: 'adjust-trust',
      category: 'action',
      type: 'adjust-trust',
      label: 'Adjust Trust',
      description: 'Modify trust level',
      icon: <Activity className="h-4 w-4" />
    },
    {
      id: 'generate-report',
      category: 'action',
      type: 'generate-report',
      label: 'Generate Report',
      description: 'Create compliance report',
      icon: <FileText className="h-4 w-4" />
    },
    {
      id: 'send-alert',
      category: 'action',
      type: 'send-alert',
      label: 'Send Alert',
      description: 'Send notification',
      icon: <Mail className="h-4 w-4" />
    }
  ],
  condition: [
    {
      id: 'policy-valid',
      category: 'condition',
      type: 'policy-valid',
      label: 'Policy Valid',
      description: 'Check policy validity',
      icon: <CheckCircle className="h-4 w-4" />
    },
    {
      id: 'policy-compliant',
      category: 'condition',
      type: 'policy-compliant',
      label: 'Policy Compliant',
      description: 'Verify compliance',
      icon: <Shield className="h-4 w-4" />
    },
    {
      id: 'trust-threshold',
      category: 'condition',
      type: 'trust-threshold',
      label: 'Trust Threshold',
      description: 'Check trust level',
      icon: <Activity className="h-4 w-4" />
    },
    {
      id: 'risk-assessment',
      category: 'condition',
      type: 'risk-assessment',
      label: 'Risk Assessment',
      description: 'Evaluate risk level',
      icon: <AlertTriangle className="h-4 w-4" />
    },
    {
      id: 'compliance-status',
      category: 'condition',
      type: 'compliance-status',
      label: 'Compliance Status',
      description: 'Check compliance',
      icon: <CheckCircle className="h-4 w-4" />
    },
    {
      id: 'performance-metrics',
      category: 'condition',
      type: 'performance-metrics',
      label: 'Performance Metrics',
      description: 'Check performance',
      icon: <Activity className="h-4 w-4" />
    }
  ],
  loop: [
    {
      id: 'for-each',
      category: 'loop',
      type: 'for-each',
      label: 'For Each',
      description: 'Iterate over items',
      icon: <RefreshCw className="h-4 w-4" />
    },
    {
      id: 'while-loop',
      category: 'loop',
      type: 'while',
      label: 'While Loop',
      description: 'Loop while condition',
      icon: <RefreshCw className="h-4 w-4" />
    }
  ],
  transform: [
    {
      id: 'map-data',
      category: 'transform',
      type: 'map',
      label: 'Map Data',
      description: 'Transform data structure',
      icon: <GitBranch className="h-4 w-4" />
    },
    {
      id: 'filter-data',
      category: 'transform',
      type: 'filter',
      label: 'Filter Data',
      description: 'Filter array items',
      icon: <Filter className="h-4 w-4" />
    },
    {
      id: 'aggregate-data',
      category: 'transform',
      type: 'aggregate',
      label: 'Aggregate',
      description: 'Aggregate data',
      icon: <Database className="h-4 w-4" />
    }
  ],
  integration: [
    {
      id: 'api-call',
      category: 'integration',
      type: 'api-call',
      label: 'API Call',
      description: 'Make HTTP request',
      icon: <Globe className="h-4 w-4" />
    },
    {
      id: 'database-query',
      category: 'integration',
      type: 'database',
      label: 'Database Query',
      description: 'Query database',
      icon: <Database className="h-4 w-4" />
    },
    {
      id: 'message-queue',
      category: 'integration',
      type: 'message-queue',
      label: 'Message Queue',
      description: 'Send to queue',
      icon: <Server className="h-4 w-4" />
    }
  ],
  utility: [
    {
      id: 'delay',
      category: 'utility',
      type: 'delay',
      label: 'Delay',
      description: 'Wait for duration',
      icon: <Clock className="h-4 w-4" />
    },
    {
      id: 'log',
      category: 'utility',
      type: 'log',
      label: 'Log',
      description: 'Log message',
      icon: <Terminal className="h-4 w-4" />
    },
    {
      id: 'set-variable',
      category: 'utility',
      type: 'set-variable',
      label: 'Set Variable',
      description: 'Set workflow variable',
      icon: <Variable className="h-4 w-4" />
    }
  ],
  output: [
    {
      id: 'return-value',
      category: 'output',
      type: 'return',
      label: 'Return Value',
      description: 'Return workflow result',
      icon: <CheckCircle className="h-4 w-4" />
    },
    {
      id: 'error-handler',
      category: 'output',
      type: 'error',
      label: 'Error Handler',
      description: 'Handle errors',
      icon: <XCircle className="h-4 w-4" />
    }
  ]
}

export function WorkflowDesignerLayout({ children }: { children?: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<NodeCategory | 'all'>('all')
  const [variables, setVariables] = useState<WorkflowVariable[]>([
    { name: 'apiKey', type: 'string', value: '***', isSecret: true },
    { name: 'maxRetries', type: 'number', value: 3 },
    { name: 'environment', type: 'string', value: 'production' }
  ])
  const [executionHistory, setExecutionHistory] = useState<ExecutionHistoryItem[]>([
    {
      id: '1',
      workflowName: 'Trust Evaluation',
      status: 'success',
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(Date.now() - 3540000),
      duration: 60000,
      triggeredBy: 'Schedule'
    },
    {
      id: '2',
      workflowName: 'Policy Deployment',
      status: 'failed',
      startTime: new Date(Date.now() - 7200000),
      endTime: new Date(Date.now() - 7140000),
      duration: 60000,
      triggeredBy: 'Manual',
      error: 'Connection timeout'
    }
  ])
  const [showVariableDialog, setShowVariableDialog] = useState(false)
  const [newVariable, setNewVariable] = useState<Partial<WorkflowVariable>>({})

  const filteredNodes = Object.entries(nodeTemplates).reduce((acc, [category, nodes]) => {
    if (selectedCategory !== 'all' && category !== selectedCategory) {
      return acc
    }
    
    const filtered = nodes.filter(node => 
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    if (filtered.length > 0) {
      acc[category as NodeCategory] = filtered
    }
    
    return acc
  }, {} as Record<NodeCategory, NodeTemplate[]>)

  const onDragStart = (event: React.DragEvent, node: NodeTemplate) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(node))
    event.dataTransfer.effectAllowed = 'move'
  }

  const addVariable = () => {
    if (newVariable.name && newVariable.type) {
      setVariables([...variables, {
        name: newVariable.name,
        type: newVariable.type as any,
        value: newVariable.value || '',
        description: newVariable.description,
        isSecret: newVariable.isSecret
      }])
      setNewVariable({})
      setShowVariableDialog(false)
    }
  }

  const deleteVariable = (name: string) => {
    setVariables(variables.filter(v => v.name !== name))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'running': return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-gray-500" />
      default: return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-80 border-r bg-white shadow-sm flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold mb-3">Node Library</h3>
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="trigger">Triggers</SelectItem>
                <SelectItem value="action">Actions</SelectItem>
                <SelectItem value="condition">Conditions</SelectItem>
                <SelectItem value="loop">Loops</SelectItem>
                <SelectItem value="transform">Transforms</SelectItem>
                <SelectItem value="integration">Integrations</SelectItem>
                <SelectItem value="utility">Utilities</SelectItem>
                <SelectItem value="output">Outputs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <Accordion type="multiple" className="space-y-2">
            {Object.entries(filteredNodes).map(([category, nodes]) => (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {category}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      ({nodes.length})
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {nodes.map((node) => (
                      <Card
                        key={node.id}
                        className="cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing"
                        draggable
                        onDragStart={(e) => onDragStart(e, node)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5">{node.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">
                                {node.label}
                              </div>
                              <div className="text-xs text-gray-600 truncate">
                                {node.description}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {children}
      </div>

      <div className="w-96 border-l bg-white shadow-sm flex flex-col">
        <Tabs defaultValue="variables" className="flex-1 flex flex-col">
          <TabsList className="m-4">
            <TabsTrigger value="variables" className="flex-1">
              <Variable className="h-4 w-4 mr-2" />
              Variables
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex-1">
              <Settings className="h-4 w-4 mr-2" />
              Properties
            </TabsTrigger>
          </TabsList>

          <TabsContent value="variables" className="flex-1 px-4 pb-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Workflow Variables</h4>
                <Dialog open={showVariableDialog} onOpenChange={setShowVariableDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Variable</DialogTitle>
                      <DialogDescription>
                        Create a new workflow variable
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={newVariable.name || ''}
                          onChange={(e) => setNewVariable({...newVariable, name: e.target.value})}
                          placeholder="variableName"
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={newVariable.type}
                          onValueChange={(value) => setNewVariable({...newVariable, type: value as any})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="object">Object</SelectItem>
                            <SelectItem value="array">Array</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Value</Label>
                        <Input
                          value={newVariable.value || ''}
                          onChange={(e) => setNewVariable({...newVariable, value: e.target.value})}
                          placeholder="Default value"
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={newVariable.description || ''}
                          onChange={(e) => setNewVariable({...newVariable, description: e.target.value})}
                          placeholder="Variable description"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={newVariable.isSecret || false}
                          onCheckedChange={(checked) => setNewVariable({...newVariable, isSecret: checked})}
                        />
                        <Label>Secret Variable</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowVariableDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={addVariable}>Add Variable</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {variables.map((variable) => (
                    <Card key={variable.name}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{variable.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {variable.type}
                              </Badge>
                              {variable.isSecret && (
                                <Lock className="h-3 w-3 text-gray-500" />
                              )}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {variable.isSecret ? '•••••' : String(variable.value)}
                            </div>
                            {variable.description && (
                              <div className="text-xs text-gray-500 mt-1">
                                {variable.description}
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteVariable(variable.name)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="history" className="flex-1 px-4 pb-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Execution History</h4>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {executionHistory.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(item.status)}
                              <span className="font-medium text-sm">
                                {item.workflowName}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Triggered by: {item.triggeredBy}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {item.startTime.toLocaleString()}
                            </div>
                            {item.duration && (
                              <div className="text-xs text-gray-500">
                                Duration: {(item.duration / 1000).toFixed(2)}s
                              </div>
                            )}
                            {item.error && (
                              <div className="text-xs text-red-600 mt-1">
                                Error: {item.error}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="properties" className="flex-1 px-4 pb-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Node Properties</h4>
              <div className="text-sm text-gray-600">
                Select a node to view and edit its properties
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"