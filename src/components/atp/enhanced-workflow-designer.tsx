"use client"

import { useState, useCallback, useMemo } from "react"
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  useNodesState,
  useEdgesState,
  NodeTypes,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position
} from "reactflow"
import "reactflow/dist/style.css"
import { 
  Shield, 
  Users, 
  Lock, 
  Eye, 
  Clock, 
  Globe, 
  Building,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  FileText,
  Download,
  Upload,
  Save,
  Play,
  Settings,
  Plus,
  Trash2,
  Copy,
  Undo,
  Redo,
  GitBranch,
  Activity,
  Database,
  Server,
  Terminal,
  Webhook,
  Calendar,
  Mail,
  Filter,
  LogIn,
  LogOut,
  RefreshCw,
  PauseCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { WorkflowEngine } from "@/workflow-engine/core/WorkflowEngine"
import { NodeRegistry } from "@/workflow-engine/core/NodeRegistry"
import { WorkflowNode, WorkflowEdge, Workflow, NodeCategory } from "@/workflow-engine/types/WorkflowTypes"

interface BaseNodeData {
  label: string
  description?: string
  icon?: React.ReactNode
  category: NodeCategory
  isValid: boolean
  isExecuting?: boolean
  hasError?: boolean
  errorMessage?: string
  config?: Record<string, any>
}

interface TriggerNodeData extends BaseNodeData {
  triggerType: 'manual' | 'schedule' | 'webhook' | 'event' | 'policy-change' | 'trust-change'
  schedule?: string
  webhookUrl?: string
  eventName?: string
}

interface ActionNodeData extends BaseNodeData {
  actionType: string
  inputs?: Record<string, any>
  outputs?: Record<string, any>
}

interface ConditionNodeData extends BaseNodeData {
  conditionType: string
  expression?: string
  operator?: string
  value?: any
}

interface TransformNodeData extends BaseNodeData {
  transformType: string
  mappings?: Record<string, string>
}

const BaseNode = ({ 
  data, 
  selected,
  children 
}: { 
  data: BaseNodeData
  selected?: boolean
  children: React.ReactNode 
}) => {
  const getCategoryColor = (category: NodeCategory) => {
    switch (category) {
      case 'trigger': return 'border-purple-500 bg-purple-50'
      case 'action': return 'border-blue-500 bg-blue-50'
      case 'condition': return 'border-yellow-500 bg-yellow-50'
      case 'transform': return 'border-green-500 bg-green-50'
      case 'integration': return 'border-indigo-500 bg-indigo-50'
      case 'utility': return 'border-gray-500 bg-gray-50'
      case 'loop': return 'border-orange-500 bg-orange-50'
      case 'output': return 'border-red-500 bg-red-50'
      default: return 'border-gray-400 bg-white'
    }
  }

  const statusBorder = data.hasError 
    ? 'border-red-500 border-2' 
    : data.isExecuting 
    ? 'border-green-500 border-2 animate-pulse' 
    : selected 
    ? 'border-2' 
    : 'border'

  return (
    <div className={`rounded-lg shadow-lg ${getCategoryColor(data.category)} ${statusBorder} min-w-[200px]`}>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          {data.icon}
          <div className="flex-1">
            <div className="font-medium text-sm">{data.label}</div>
            {data.description && (
              <div className="text-xs text-gray-600">{data.description}</div>
            )}
          </div>
          {data.isExecuting && (
            <Activity className="h-4 w-4 text-green-500 animate-pulse" />
          )}
          {data.hasError && (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
        </div>
        {children}
      </div>
    </div>
  )
}

const TriggerNode = ({ data, selected }: { data: TriggerNodeData; selected?: boolean }) => {
  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'manual': return <Play className="h-4 w-4" />
      case 'schedule': return <Calendar className="h-4 w-4" />
      case 'webhook': return <Webhook className="h-4 w-4" />
      case 'event': return <Zap className="h-4 w-4" />
      case 'policy-change': return <Shield className="h-4 w-4" />
      case 'trust-change': return <Activity className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <BaseNode data={{ ...data, icon: getTriggerIcon(data.triggerType) }} selected={selected}>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-600">Type:</span>
          <span className="font-medium">{data.triggerType}</span>
        </div>
        {data.schedule && (
          <div className="flex justify-between">
            <span className="text-gray-600">Schedule:</span>
            <span className="font-mono text-xs">{data.schedule}</span>
          </div>
        )}
        {data.webhookUrl && (
          <div className="flex justify-between">
            <span className="text-gray-600">Webhook:</span>
            <span className="truncate max-w-[100px]">{data.webhookUrl}</span>
          </div>
        )}
      </div>
    </BaseNode>
  )
}

const ActionNode = ({ data, selected }: { data: ActionNodeData; selected?: boolean }) => {
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'create-policy': return <FileText className="h-4 w-4" />
      case 'update-policy': return <RefreshCw className="h-4 w-4" />
      case 'deploy-policy': return <Upload className="h-4 w-4" />
      case 'evaluate-trust': return <Shield className="h-4 w-4" />
      case 'adjust-trust': return <Activity className="h-4 w-4" />
      case 'generate-report': return <FileText className="h-4 w-4" />
      case 'send-alert': return <Mail className="h-4 w-4" />
      case 'database-query': return <Database className="h-4 w-4" />
      case 'api-call': return <Globe className="h-4 w-4" />
      case 'transform-data': return <GitBranch className="h-4 w-4" />
      default: return <Zap className="h-4 w-4" />
    }
  }

  return (
    <BaseNode data={{ ...data, icon: getActionIcon(data.actionType) }} selected={selected}>
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
      <div className="text-xs space-y-1">
        {data.inputs && Object.entries(data.inputs).slice(0, 2).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-gray-600">{key}:</span>
            <span className="font-medium truncate max-w-[100px]">{String(value)}</span>
          </div>
        ))}
      </div>
    </BaseNode>
  )
}

const ConditionNode = ({ data, selected }: { data: ConditionNodeData; selected?: boolean }) => {
  return (
    <BaseNode data={{ ...data, icon: <Filter className="h-4 w-4" /> }} selected={selected}>
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <Handle type="source" position={Position.Right} className="w-2 h-2" id="true" />
      <Handle type="source" position={Position.Left} className="w-2 h-2" id="false" />
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-600">Condition:</span>
          <span className="font-medium">{data.conditionType}</span>
        </div>
        {data.expression && (
          <div className="font-mono text-xs bg-gray-100 p-1 rounded">
            {data.expression}
          </div>
        )}
      </div>
      <div className="flex justify-between mt-2 text-xs">
        <Badge variant="outline" className="text-xs">False</Badge>
        <Badge variant="outline" className="text-xs">True</Badge>
      </div>
    </BaseNode>
  )
}

const LoopNode = ({ data, selected }: { data: BaseNodeData; selected?: boolean }) => {
  return (
    <BaseNode data={{ ...data, icon: <RefreshCw className="h-4 w-4" /> }} selected={selected}>
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" id="loop" />
      <Handle type="source" position={Position.Right} className="w-2 h-2" id="done" />
      <div className="text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-600">Iterator:</span>
          <span className="font-medium">items[]</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Current:</span>
          <span className="font-medium">item</span>
        </div>
      </div>
    </BaseNode>
  )
}

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  loop: LoopNode,
}

function WorkflowDesigner() {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [workflowName, setWorkflowName] = useState("ATP Workflow")
  const [workflowDescription, setWorkflowDescription] = useState("")
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResults, setExecutionResults] = useState<any>(null)
  const [showVariables, setShowVariables] = useState(false)
  const [workflowVariables, setWorkflowVariables] = useState<Record<string, any>>({})

  const { addNodes, getNodes, getEdges, screenToFlowPosition, fitView } = useReactFlow()

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#94a3b8', strokeWidth: 2 }
      }
      setEdges((eds) => addEdge(newEdge, eds))
    },
    [setEdges]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const reactFlowBounds = event.currentTarget.getBoundingClientRect()
      const data = event.dataTransfer.getData('application/reactflow')

      if (!data) return

      const nodeData = JSON.parse(data)
      const position = screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const newNode: Node = {
        id: `${nodeData.category}-${Date.now()}`,
        type: nodeData.category,
        position,
        data: {
          label: nodeData.label,
          description: nodeData.description,
          category: nodeData.category,
          [`${nodeData.category}Type`]: nodeData.type,
          isValid: true,
          config: nodeData.config || {}
        }
      }

      addNodes(newNode)
    },
    [addNodes, screenToFlowPosition]
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const updateNodeData = (nodeId: string, data: Partial<any>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      )
    )
  }

  const deleteSelectedNode = () => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id))
      setEdges((eds) => eds.filter((e) => 
        e.source !== selectedNode.id && e.target !== selectedNode.id
      ))
      setSelectedNode(null)
    }
  }

  const validateWorkflow = () => {
    const errors: string[] = []
    const currentNodes = getNodes()
    const currentEdges = getEdges()

    const triggers = currentNodes.filter(n => n.data.category === 'trigger')
    if (triggers.length === 0) {
      errors.push("Workflow must have at least one trigger")
    }

    const disconnectedNodes = currentNodes.filter(node => {
      const hasConnection = currentEdges.some(edge => 
        edge.source === node.id || edge.target === node.id
      )
      return !hasConnection && currentNodes.length > 1
    })

    if (disconnectedNodes.length > 0) {
      errors.push(`${disconnectedNodes.length} node(s) are not connected`)
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const exportWorkflow = () => {
    if (!validateWorkflow()) return

    const workflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name: workflowName,
      description: workflowDescription,
      version: "1.0.0",
      nodes: getNodes().map(n => ({
        id: n.id,
        type: n.type || 'action',
        label: n.data.label,
        description: n.data.description,
        config: n.data.config,
        position: n.position
      })),
      edges: getEdges().map(e => ({
        id: e.id || `edge-${Date.now()}`,
        sourceNodeId: e.source,
        targetNodeId: e.target,
        sourceHandle: e.sourceHandle || undefined,
        targetHandle: e.targetHandle || undefined
      })),
      variables: workflowVariables,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }

    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${workflowName.replace(/\s+/g, '-').toLowerCase()}-workflow.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const executeWorkflow = async () => {
    if (!validateWorkflow()) return

    setIsExecuting(true)
    setExecutionResults(null)

    await new Promise(resolve => setTimeout(resolve, 2000))

    setExecutionResults({
      success: true,
      executionId: `exec-${Date.now()}`,
      duration: 1234,
      steps: [
        { node: "Manual Trigger", status: "completed", duration: 10 },
        { node: "Check Trust Level", status: "completed", duration: 150 },
        { node: "Evaluate Policy", status: "completed", duration: 320 },
        { node: "Send Notification", status: "completed", duration: 754 }
      ]
    })

    setIsExecuting(false)
  }

  const clearCanvas = () => {
    setNodes([])
    setEdges([])
    setSelectedNode(null)
    setValidationErrors([])
    setExecutionResults(null)
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="border-b bg-white shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <GitBranch className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold">ATP Workflow Designer</h2>
                <p className="text-sm text-gray-600">Visual workflow automation for trust policies</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => fitView()}>
                <Eye className="h-4 w-4 mr-2" />
                Fit View
              </Button>
              <Button variant="outline" size="sm" onClick={clearCanvas}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={validateWorkflow}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Validate
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={executeWorkflow}
                disabled={isExecuting}
              >
                {isExecuting ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-pulse" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Execute
                  </>
                )}
              </Button>
              <Button onClick={exportWorkflow}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Background gap={12} size={1} />
            <Controls />
            <MiniMap 
              nodeColor={(node) => {
                switch (node.data?.category) {
                  case 'trigger': return '#a855f7'
                  case 'action': return '#3b82f6'
                  case 'condition': return '#eab308'
                  case 'transform': return '#10b981'
                  default: return '#6b7280'
                }
              }}
            />
            <Panel position="top-left" className="bg-white/90 p-2 rounded-lg shadow-sm">
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded" />
                  <span>Trigger</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded" />
                  <span>Action</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded" />
                  <span>Condition</span>
                </div>
              </div>
            </Panel>
            {validationErrors.length > 0 && (
              <Panel position="bottom-center" className="bg-red-50 border border-red-200 p-3 rounded-lg max-w-md">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-red-800">Validation Errors</div>
                    <ul className="list-disc list-inside text-red-700 mt-1">
                      {validationErrors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Panel>
            )}
            {executionResults && (
              <Panel position="bottom-center" className="bg-green-50 border border-green-200 p-3 rounded-lg max-w-md">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium text-green-800">Execution Complete</div>
                    <div className="text-green-700 mt-1">
                      Duration: {executionResults.duration}ms
                    </div>
                  </div>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}

export function EnhancedWorkflowDesigner() {
  return (
    <ReactFlowProvider>
      <WorkflowDesigner />
    </ReactFlowProvider>
  )
}