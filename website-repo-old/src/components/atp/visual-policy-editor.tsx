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
  EdgeTypes,
  Panel,
  useReactFlow,
  ReactFlowProvider
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
  Redo
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Node Types
interface ConditionNodeData {
  label: string
  type: 'condition'
  conditionType: 'did' | 'trustLevel' | 'vc' | 'tool' | 'time' | 'context' | 'organization'
  parameters: Record<string, any>
  isValid: boolean
}

interface ActionNodeData {
  label: string
  type: 'action'
  actionType: 'allow' | 'deny' | 'throttle' | 'log' | 'alert' | 'require_approval'
  parameters: Record<string, any>
  isValid: boolean
}

interface OperatorNodeData {
  label: string
  type: 'operator'
  operatorType: 'and' | 'or' | 'not'
  isValid: boolean
}

type NodeData = ConditionNodeData | ActionNodeData | OperatorNodeData

// Custom Node Components
const ConditionNode = ({ data }: { data: ConditionNodeData }) => {
  const getConditionIcon = (type: string) => {
    switch (type) {
      case 'did': return <Users className="h-4 w-4" />
      case 'trustLevel': return <Shield className="h-4 w-4" />
      case 'vc': return <FileText className="h-4 w-4" />
      case 'tool': return <Zap className="h-4 w-4" />
      case 'time': return <Clock className="h-4 w-4" />
      case 'context': return <Globe className="h-4 w-4" />
      case 'organization': return <Building className="h-4 w-4" />
      default: return <Eye className="h-4 w-4" />
    }
  }

  const getConditionColor = (type: string) => {
    switch (type) {
      case 'did': return 'bg-blue-500'
      case 'trustLevel': return 'bg-green-500'
      case 'vc': return 'bg-purple-500'
      case 'tool': return 'bg-yellow-500'
      case 'time': return 'bg-orange-500'
      case 'context': return 'bg-indigo-500'
      case 'organization': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className={`px-4 py-2 shadow-lg rounded-lg border-2 ${data.isValid ? 'border-green-500' : 'border-red-500'} bg-white`}>
      <div className="flex items-center gap-2">
        <div className={`p-1 rounded ${getConditionColor(data.conditionType)}`}>
          {getConditionIcon(data.conditionType)}
        </div>
        <div>
          <div className="font-medium text-sm">{data.label}</div>
          <div className="text-xs text-gray-500 capitalize">{data.conditionType.replace(/([A-Z])/g, ' $1')}</div>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-600">
        {Object.entries(data.parameters).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span>{key}:</span>
            <span className="font-medium">{String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const ActionNode = ({ data }: { data: ActionNodeData }) => {
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'allow': return <CheckCircle className="h-4 w-4" />
      case 'deny': return <XCircle className="h-4 w-4" />
      case 'throttle': return <Zap className="h-4 w-4" />
      case 'log': return <FileText className="h-4 w-4" />
      case 'alert': return <AlertTriangle className="h-4 w-4" />
      case 'require_approval': return <Shield className="h-4 w-4" />
      default: return <Eye className="h-4 w-4" />
    }
  }

  const getActionColor = (type: string) => {
    switch (type) {
      case 'allow': return 'bg-green-500'
      case 'deny': return 'bg-red-500'
      case 'throttle': return 'bg-yellow-500'
      case 'log': return 'bg-blue-500'
      case 'alert': return 'bg-orange-500'
      case 'require_approval': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className={`px-4 py-2 shadow-lg rounded-lg border-2 ${data.isValid ? 'border-green-500' : 'border-red-500'} bg-white`}>
      <div className="flex items-center gap-2">
        <div className={`p-1 rounded ${getActionColor(data.actionType)}`}>
          {getActionIcon(data.actionType)}
        </div>
        <div>
          <div className="font-medium text-sm">{data.label}</div>
          <div className="text-xs text-gray-500 capitalize">{data.actionType.replace(/([A-Z])/g, ' $1')}</div>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-600">
        {Object.entries(data.parameters).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span>{key}:</span>
            <span className="font-medium">{String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const OperatorNode = ({ data }: { data: OperatorNodeData }) => {
  const getOperatorIcon = (type: string) => {
    switch (type) {
      case 'and': return <Plus className="h-4 w-4" />
      case 'or': return <Globe className="h-4 w-4" />
      case 'not': return <XCircle className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const getOperatorColor = (type: string) => {
    switch (type) {
      case 'and': return 'bg-blue-500'
      case 'or': return 'bg-green-500'
      case 'not': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className={`px-4 py-2 shadow-lg rounded-lg border-2 ${data.isValid ? 'border-green-500' : 'border-red-500'} bg-white`}>
      <div className="flex items-center gap-2">
        <div className={`p-1 rounded ${getOperatorColor(data.operatorType)}`}>
          {getOperatorIcon(data.operatorType)}
        </div>
        <div>
          <div className="font-medium text-sm">{data.label}</div>
          <div className="text-xs text-gray-500 uppercase">{data.operatorType}</div>
        </div>
      </div>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  condition: ConditionNode,
  action: ActionNode,
  operator: OperatorNode,
}

// Policy Editor Component
function PolicyEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [policyName, setPolicyName] = useState("Enterprise Trust Policy")
  const [policyDescription, setPolicyDescription] = useState("")
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationResults, setSimulationResults] = useState<any>(null)

  const { addNodes, getNodes, getEdges, screenToFlowPosition } = useReactFlow()

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
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

      if (typeof data === 'undefined' || !data) {
        return
      }

      const dragData = JSON.parse(data)
      const position = screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const newNode: Node = {
        id: `${dragData.type}-${Date.now()}`,
        type: dragData.type,
        position,
        data: {
          label: `${dragData[dragData.type + 'Type'] || dragData.type} ${dragData.type}`,
          type: dragData.type,
          [dragData.type + 'Type']: dragData[dragData.type + 'Type'],
          parameters: dragData.type === 'condition' 
            ? getDefaultParameters(dragData.conditionType)
            : dragData.type === 'action'
            ? getDefaultActionParameters(dragData.actionType)
            : {},
          isValid: true
        }
      }

      addNodes(newNode)
    },
    [addNodes, screenToFlowPosition]
  )

  const addConditionNode = (conditionType: string) => {
    const newNode: Node = {
      id: `condition-${Date.now()}`,
      type: 'condition',
      position: { x: 100, y: 100 + nodes.length * 100 },
      data: {
        label: `${conditionType.charAt(0).toUpperCase() + conditionType.slice(1)} Condition`,
        type: 'condition',
        conditionType: conditionType as any,
        parameters: getDefaultParameters(conditionType),
        isValid: true
      }
    }
    addNodes(newNode)
  }

  const addActionNode = (actionType: string) => {
    const newNode: Node = {
      id: `action-${Date.now()}`,
      type: 'action',
      position: { x: 400, y: 100 + nodes.length * 100 },
      data: {
        label: `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Action`,
        type: 'action',
        actionType: actionType as any,
        parameters: getDefaultActionParameters(actionType),
        isValid: true
      }
    }
    addNodes(newNode)
  }

  const addOperatorNode = (operatorType: string) => {
    const newNode: Node = {
      id: `operator-${Date.now()}`,
      type: 'operator',
      position: { x: 250, y: 100 + nodes.length * 100 },
      data: {
        label: `${operatorType.toUpperCase()} Operator`,
        type: 'operator',
        operatorType: operatorType as any,
        isValid: true
      }
    }
    addNodes(newNode)
  }

  const getDefaultParameters = (conditionType: string) => {
    switch (conditionType) {
      case 'did':
        return { did: 'did:atp:example', operator: 'equals' }
      case 'trustLevel':
        return { level: 'verified', operator: 'gte' }
      case 'vc':
        return { schema: 'https://schema.org/credential', required: true }
      case 'tool':
        return { toolName: 'weather-api', access: 'read' }
      case 'time':
        return { startTime: '09:00', endTime: '17:00', timezone: 'UTC' }
      case 'context':
        return { location: 'office', device: 'desktop' }
      case 'organization':
        return { orgId: 'org-123', membership: 'active' }
      default:
        return {}
    }
  }

  const getDefaultActionParameters = (actionType: string) => {
    switch (actionType) {
      case 'allow':
        return { reason: 'Policy satisfied', log: true }
      case 'deny':
        return { reason: 'Policy violated', log: true }
      case 'throttle':
        return { limit: 100, window: '1h', log: true }
      case 'log':
        return { level: 'info', details: 'Policy evaluation' }
      case 'alert':
        return { severity: 'medium', channel: 'email' }
      case 'require_approval':
        return { approvers: ['admin@company.com'], timeout: '24h' }
      default:
        return {}
    }
  }

  const validatePolicy = () => {
    const errors: string[] = []
    const currentNodes = getNodes()
    const currentEdges = getEdges()

    // Check for at least one condition and one action
    const conditions = currentNodes.filter(node => node.type === 'condition')
    const actions = currentNodes.filter(node => node.type === 'action')

    if (conditions.length === 0) {
      errors.push("Policy must contain at least one condition")
    }
    if (actions.length === 0) {
      errors.push("Policy must contain at least one action")
    }

    // Check for disconnected nodes
    const connectedNodeIds = new Set()
    currentEdges.forEach(edge => {
      connectedNodeIds.add(edge.source)
      connectedNodeIds.add(edge.target)
    })

    currentNodes.forEach(node => {
      if (!connectedNodeIds.has(node.id)) {
        errors.push(`Node "${node.data.label}" is not connected`)
      }
    })

    setValidationErrors(errors)
    return errors.length === 0
  }

  const exportPolicy = () => {
    if (!validatePolicy()) {
      return
    }

    const policy = {
      name: policyName,
      description: policyDescription,
      version: "1.0.0",
      createdAt: new Date().toISOString(),
      nodes: getNodes(),
      edges: getEdges(),
      rules: generatePolicyRules()
    }

    const blob = new Blob([JSON.stringify(policy, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${policyName.replace(/\s+/g, '-').toLowerCase()}-policy.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generatePolicyRules = () => {
    // Convert visual policy to ATP JSON schema
    const nodes = getNodes()
    const edges = getEdges()
    
    // This is a simplified conversion - in a real implementation,
    // you'd have more sophisticated logic to convert the visual graph
    // to the actual ATP policy format
    return {
      conditions: nodes.filter(n => n.type === 'condition').map(n => ({
        type: n.data.conditionType,
        parameters: n.data.parameters
      })),
      actions: nodes.filter(n => n.type === 'action').map(n => ({
        type: n.data.actionType,
        parameters: n.data.parameters
      }))
    }
  }

  const simulatePolicy = async () => {
    if (!validatePolicy()) {
      return
    }

    setIsSimulating(true)
    
    // Simulate policy evaluation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setSimulationResults({
      success: true,
      evaluation: {
        input: {
          did: "did:atp:test-agent",
          trustLevel: "verified",
          tool: "weather-api",
          context: { location: "office" }
        },
        result: "ALLOW",
        reason: "All conditions satisfied",
        executionTime: "2.3ms",
        rules: [
          { condition: "DID verification", status: "PASS" },
          { condition: "Trust level check", status: "PASS" },
          { action: "Allow access", status: "EXECUTED" }
        ]
      }
    })
    
    setIsSimulating(false)
  }

  const clearCanvas = () => {
    setNodes([])
    setEdges([])
    setValidationErrors([])
    setSimulationResults(null)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold">Visual Trust Policy Editor</h2>
              <p className="text-sm text-gray-600">Drag and drop to create trust policies</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearCanvas}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button variant="outline" size="sm" onClick={validatePolicy}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Validate
            </Button>
            <Button variant="outline" size="sm" onClick={simulatePolicy} disabled={isSimulating}>
              <Play className="h-4 w-4 mr-2" />
              {isSimulating ? 'Simulating...' : 'Simulate'}
            </Button>
            <Button onClick={exportPolicy}>
              <Download className="h-4 w-4 mr-2" />
              Export Policy
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
          <Tabs defaultValue="conditions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="conditions">Conditions</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="operators">Operators</TabsTrigger>
            </TabsList>

            <TabsContent value="conditions" className="space-y-2 mt-4">
              <h3 className="font-medium text-sm mb-3">Drag conditions to canvas</h3>
              {[
                { type: 'did', label: 'DID Verification', icon: Users },
                { type: 'trustLevel', label: 'Trust Level', icon: Shield },
                { type: 'vc', label: 'Verifiable Credential', icon: FileText },
                { type: 'tool', label: 'Tool Access', icon: Zap },
                { type: 'time', label: 'Time Restriction', icon: Clock },
                { type: 'context', label: 'Context Check', icon: Globe },
                { type: 'organization', label: 'Organization', icon: Building }
              ].map((condition) => {
                const Icon = condition.icon
                return (
                  <Card 
                    key={condition.type} 
                    className="cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/reactflow', JSON.stringify({
                        type: 'condition',
                        conditionType: condition.type
                      }))
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onClick={() => addConditionNode(condition.type)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">{condition.label}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </TabsContent>

            <TabsContent value="actions" className="space-y-2 mt-4">
              <h3 className="font-medium text-sm mb-3">Drag actions to canvas</h3>
              {[
                { type: 'allow', label: 'Allow Access', icon: CheckCircle },
                { type: 'deny', label: 'Deny Access', icon: XCircle },
                { type: 'throttle', label: 'Throttle', icon: Zap },
                { type: 'log', label: 'Log Event', icon: FileText },
                { type: 'alert', label: 'Send Alert', icon: AlertTriangle },
                { type: 'require_approval', label: 'Require Approval', icon: Shield }
              ].map((action) => {
                const Icon = action.icon
                return (
                  <Card 
                    key={action.type} 
                    className="cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/reactflow', JSON.stringify({
                        type: 'action',
                        actionType: action.type
                      }))
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onClick={() => addActionNode(action.type)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">{action.label}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </TabsContent>

            <TabsContent value="operators" className="space-y-2 mt-4">
              <h3 className="font-medium text-sm mb-3">Drag operators to canvas</h3>
              {[
                { type: 'and', label: 'AND', icon: Plus },
                { type: 'or', label: 'OR', icon: Globe },
                { type: 'not', label: 'NOT', icon: XCircle }
              ].map((operator) => {
                const Icon = operator.icon
                return (
                  <Card 
                    key={operator.type} 
                    className="cursor-grab hover:shadow-md transition-shadow active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/reactflow', JSON.stringify({
                        type: 'operator',
                        operatorType: operator.type
                      }))
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onClick={() => addOperatorNode(operator.type)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">{operator.label}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </TabsContent>
          </Tabs>

          {/* Policy Info */}
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Policy Name</label>
              <Input
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
                placeholder="Enter policy name"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={policyDescription}
                onChange={(e) => setPolicyDescription(e.target.value)}
                placeholder="Enter policy description"
                className="mt-1"
              />
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Validation Errors</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Simulation Results */}
          {simulationResults && (
            <div className="mt-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Simulation Complete</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Result:</span>
                      <Badge variant={simulationResults.evaluation.result === 'ALLOW' ? 'default' : 'destructive'}>
                        {simulationResults.evaluation.result}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {simulationResults.evaluation.reason}
                    </div>
                    <div className="text-xs text-gray-500">
                      Execution time: {simulationResults.evaluation.executionTime}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Background />
            <Controls />
            <MiniMap />
            <Panel position="top-right" className="bg-white p-2 rounded shadow">
              <div className="text-xs text-gray-600">
                Nodes: {nodes.length} | Edges: {edges.length}
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}

// Wrapper component with ReactFlowProvider
export function VisualPolicyEditor() {
  return (
    <ReactFlowProvider>
      <div className="h-screen">
        <PolicyEditor />
      </div>
    </ReactFlowProvider>
  )
} 