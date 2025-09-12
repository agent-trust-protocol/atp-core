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
  ReactFlowProvider,
  Handle,
  Position,
  MarkerType
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
    <div className={`relative px-4 py-2 shadow-lg rounded-lg border-2 ${data.isValid ? 'border-green-500' : 'border-red-500'} bg-white`}>
      {/* Condition: output only */}
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-blue-500" />
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
    <div className={`relative px-4 py-2 shadow-lg rounded-lg border-2 ${data.isValid ? 'border-green-500' : 'border-red-500'} bg-white`}>
      {/* Action: input only */}
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-green-600" />
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
    <div className={`relative px-4 py-2 shadow-lg rounded-lg border-2 ${data.isValid ? 'border-green-500' : 'border-red-500'} bg-white`}>
      {/* Operator: input and output */}
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-purple-600" />
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-purple-600" />
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
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [editingNode, setEditingNode] = useState<Node | null>(null)
  const [nodeConfig, setNodeConfig] = useState<Record<string, any>>({})
  const [isDragging, setIsDragging] = useState(false)
  const [policyName, setPolicyName] = useState("Enterprise Trust Policy")
  const [policyDescription, setPolicyDescription] = useState("")
  const [policyVersion, setPolicyVersion] = useState("1.0.0")
  const [versions, setVersions] = useState<Array<{
    id: string
    name: string
    description: string
    version: string
    timestamp: string
    graph: { nodes: Node[]; edges: Edge[] }
    saved?: boolean
  }>>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationResults, setSimulationResults] = useState<any>(null)
  const [invalidHint, setInvalidHint] = useState<string | null>(null)
  const defaultEdgeOptions = useMemo(() => ({
    type: 'smoothstep' as const,
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981', width: 18, height: 18 },
    style: { stroke: '#10b981', strokeWidth: 2 }
  }), [])

  const { addNodes, getNodes, getEdges, screenToFlowPosition } = useReactFlow()

  const findNodeById = useCallback((id: string) => getNodes().find(n => n.id === id), [getNodes])

  const bumpSemver = useCallback((current: string, type: 'patch' | 'minor' | 'major') => {
    const parts = current.split('.').map((n) => parseInt(n || '0', 10) || 0)
    let [major, minor, patch] = [parts[0] || 0, parts[1] || 0, parts[2] || 0]
    if (type === 'patch') patch += 1
    if (type === 'minor') { minor += 1; patch = 0 }
    if (type === 'major') { major += 1; minor = 0; patch = 0 }
    return `${major}.${minor}.${patch}`
  }, [])

  // Using secure server-side policy building for snapshots
  const saveVersionSnapshot = useCallback(async () => {
    const baseUrl = process.env.NEXT_PUBLIC_ATP_PERMISSION_URL || 'http://localhost:3003'
    const snapshot = {
      id: `v-${Date.now()}`,
      name: policyName,
      description: policyDescription,
      version: policyVersion,
      timestamp: new Date().toISOString(),
      graph: { nodes: getNodes(), edges: getEdges() },
      saved: false
    }
    setVersions((prev) => [snapshot, ...prev].slice(0, 25))

    // Best-effort persistence: create a versioned policy document using secure API
    const policy = await buildPolicyObject()
    if (!policy) return
    const versionSuffix = policyVersion.replace(/\./g, '_')
    const versionedPolicy = {
      ...policy,
      id: `${policy.id}-v${versionSuffix}`,
      name: `${policyName} v${policyVersion}`,
      version: policyVersion,
      tags: Array.from(new Set([...(policy.tags || []), `version:${policyVersion}`]))
    }
    try {
      const res = await fetch(`${baseUrl}/policies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: versionedPolicy.name,
          description: `${policyDescription} (snapshot v${policyVersion})`,
          document: versionedPolicy,
          organizationId: versionedPolicy.organizationId
        })
      })
      if (res.ok) {
        setVersions((prev) => prev.map(v => v.id === snapshot.id ? { ...v, saved: true } : v))
        setInvalidHint(`Snapshot v${policyVersion} saved`)
        setTimeout(() => setInvalidHint(null), 1500)
      } else {
        setInvalidHint(`Snapshot saved locally (backend ${res.status})`)
        setTimeout(() => setInvalidHint(null), 1500)
      }
    } catch {
      setInvalidHint('Snapshot saved locally (backend unreachable)')
      setTimeout(() => setInvalidHint(null), 1500)
    }
  }, [getEdges, getNodes, policyDescription, policyName, policyVersion])

  const rollbackToVersion = useCallback((versionId: string) => {
    const v = versions.find((x) => x.id === versionId)
    if (!v) return
    setPolicyName(v.name)
    setPolicyDescription(v.description)
    setPolicyVersion(v.version)
    setNodes(v.graph.nodes)
    setEdges(v.graph.edges)
    setInvalidHint(`Rolled back to ${v.version}`)
    setTimeout(() => setInvalidHint(null), 1500)
  }, [setEdges, setNodes, versions])

  const isValidConnection = useCallback((params: Connection) => {
    const source = params.source ? findNodeById(params.source) : undefined
    const target = params.target ? findNodeById(params.target) : undefined
    if (!source || !target) return false

    const sourceType = source.type
    const targetType = target.type

    // Allowed flows:
    // condition -> operator | action
    // operator  -> operator | action
    if (sourceType === 'condition' && (targetType === 'operator' || targetType === 'action')) return true
    if (sourceType === 'operator' && (targetType === 'operator' || targetType === 'action')) return true

    // Disallow others (e.g., action -> anything, condition -> condition)
    return false
  }, [findNodeById])

  // Handle node double-click for configuration
  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault()
      setEditingNode(node)
      setNodeConfig(node.data.parameters || {})
      setConfigDialogOpen(true)
    },
    []
  )

  // Save node configuration
  const saveNodeConfig = useCallback(() => {
    if (!editingNode) return
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === editingNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              parameters: nodeConfig,
              isValid: true
            }
          }
        }
        return node
      })
    )
    
    setConfigDialogOpen(false)
    setEditingNode(null)
    setNodeConfig({})
  }, [editingNode, nodeConfig, setNodes])

  const onConnect = useCallback(
    (params: Connection) => {
      if (!isValidConnection(params)) {
        const msg = 'Invalid connection. Use: Condition → Operator/Action; Operator → Operator/Action.'
        setValidationErrors((prev) => [...prev, msg])
        setInvalidHint(msg)
        setTimeout(() => setInvalidHint(null), 1500)
        return
      }
      setEdges((eds) => addEdge({
        ...params,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981', width: 18, height: 18 },
        style: { stroke: '#10b981', strokeWidth: 2 },
        type: 'smoothstep'
      }, eds))
    },
    [setEdges, isValidConnection]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((event: React.DragEvent) => {
    // Only reset if leaving the canvas entirely (not just entering a child element)
    if (!event.currentTarget.contains(event.relatedTarget as Element)) {
      setIsDragging(false)
    }
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
      setIsDragging(false)
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

  const validatePolicy = async () => {
    try {
      const response = await fetch('/api/policies/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          validationType: 'graph',
          nodes: getNodes(),
          edges: getEdges(),
          strictMode: true
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        setValidationErrors([result.error || 'Validation failed']);
        return false;
      }

      setValidationErrors(result.errors || []);
      
      if (result.warnings && result.warnings.length > 0) {
        setInvalidHint(`Warnings: ${result.warnings.join(', ')}`);
        setTimeout(() => setInvalidHint(null), 3000);
      }

      return result.isValid;
    } catch (error) {
      const errorMsg = 'Validation service unavailable';
      setValidationErrors([errorMsg]);
      setInvalidHint(errorMsg);
      setTimeout(() => setInvalidHint(null), 2000);
      return false;
    }
  }

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewJson, setPreviewJson] = useState<string>("")

  const buildPolicyObject = async () => {
    try {
      const response = await fetch('/api/policies/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: getNodes(),
          edges: getEdges(),
          metadata: {
            policyName,
            policyDescription,
            policyVersion,
            organizationId: 'org-demo',
            createdBy: 'visual-editor'
          }
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        setInvalidHint(result.error || 'Failed to build policy');
        setTimeout(() => setInvalidHint(null), 2000);
        return null;
      }

      return result.policy;
    } catch (error) {
      const errorMsg = 'Policy build service unavailable';
      setInvalidHint(errorMsg);
      setTimeout(() => setInvalidHint(null), 2000);
      return null;
    }
  }

  // SECURITY NOTE: Policy transformation algorithms moved to server-side for IP protection
  // All proprietary logic now secured in /api/policies/build endpoint

  const previewPolicy = async () => {
    const policy = await buildPolicyObject()
    if (!policy) return
    setPreviewJson(JSON.stringify(policy, null, 2))
    setPreviewOpen(true)
  }

  const exportPolicy = async () => {
    const policy = await buildPolicyObject()
    if (!policy) return

    const blob = new Blob([JSON.stringify(policy, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${policyName.replace(/\s+/g, '-').toLowerCase()}-policy.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const savePolicy = async () => {
    const policy = await buildPolicyObject()
    if (!policy) return
    const baseUrl = process.env.NEXT_PUBLIC_ATP_PERMISSION_URL || 'http://localhost:3003'
    try {
      const res = await fetch(`${baseUrl}/policies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: policyName,
          description: policyDescription,
          document: policy,
          organizationId: 'org-demo'
        })
      })
      if (!res.ok) throw new Error(`Save failed: ${res.status}`)
      setInvalidHint('Policy saved successfully')
      setTimeout(() => setInvalidHint(null), 1500)
    } catch (err) {
      setInvalidHint('Save failed. Check backend API')
      setTimeout(() => setInvalidHint(null), 2000)
    }
  }

  // SECURITY NOTE: Policy rule generation moved to server-side for IP protection
  // All proprietary logic now secured in /api/policies/build endpoint

  const simulatePolicy = async () => {
    const validationResult = await validatePolicy()
    if (!validationResult) {
      return
    }

    setIsSimulating(true)
    
    try {
      const policy = await buildPolicyObject()
      if (!policy) return

      const simulationContext = {
        agentDID: "did:atp:test-agent",
        trustLevel: "VERIFIED" as const,
        credentials: [],
        tool: {
          id: "weather-api",
          type: "api",
          sensitivity: "public" as const
        },
        requestedAction: "read",
        organizationId: "org-demo",
        timestamp: new Date().toISOString()
      }

      const res = await fetch('/api/policies/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policy,
          context: simulationContext,
          options: {
            debugMode: true,
            includeTrace: true
          }
        })
      })

      if (!res.ok) {
        throw new Error(`Simulation failed: ${res.status}`)
      }

      const apiResult = await res.json()
      
      if (!apiResult.success) {
        throw new Error(apiResult.error || 'Simulation failed')
      }

      const result = apiResult.result
      
      setSimulationResults({
        success: true,
        evaluation: {
          input: simulationContext,
          result: result.decision.toUpperCase(),
          reason: result.reason,
          executionTime: `${result.processingTime}ms`,
          matchedRule: result.matchedRule?.name || 'No rule matched',
          rules: result.evaluationTrace?.map((step: any) => ({
            condition: step.ruleName,
            status: step.conditionResult ? 'PASS' : 'FAIL'
          })) || []
        }
      })
    } catch (err) {
      setSimulationResults({
        success: false,
        error: 'Simulation failed. Using secure policy evaluation API.',
        evaluation: null
      })
    }
    
    setIsSimulating(false)
  }

  const clearCanvas = () => {
    setNodes([])
    setEdges([])
    setValidationErrors([])
    setSimulationResults(null)
  }

  const loadPolicies = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_ATP_PERMISSION_URL || 'http://localhost:3003'
    try {
      const res = await fetch(`${baseUrl}/policies`)
      if (!res.ok) throw new Error(`Load failed: ${res.status}`)
      const data = await res.json()
      
      if (data.policies && data.policies.length > 0) {
        const policy = data.policies[0] // Load first policy as example
        setPolicyName(policy.name)
        setPolicyDescription(policy.description || '')
        setPolicyVersion(policy.version || '1.0.0')
        
        // Policy loading will be implemented with secure server-side conversion
        setInvalidHint('Policy loading temporarily disabled for security')
        setTimeout(() => setInvalidHint(null), 2000)
        setInvalidHint(`Loaded policy: ${policy.name}`)
        setTimeout(() => setInvalidHint(null), 1500)
      }
    } catch (err) {
      setInvalidHint('Failed to load policies')
      setTimeout(() => setInvalidHint(null), 2000)
    }
  }

  // SECURITY NOTE: Policy-to-nodes conversion moved to server-side for IP protection
  // All proprietary conversion algorithms now secured in backend services

  // SECURITY NOTE: ATP condition type conversion moved to server-side for IP protection

  // SECURITY NOTE: ATP condition value conversion moved to server-side for IP protection

  return (
    <div className="h-full flex flex-col">
      {/* Security Notice */}
      <div className="bg-green-50 border-b border-green-200 p-3">
        <div className="flex items-center gap-2 text-green-800">
          <Shield className="h-4 w-4" />
          <p className="text-sm font-medium">
            🔒 IP PROTECTED: All policy algorithms secured server-side. Proprietary logic no longer exposed in client code.
          </p>
        </div>
      </div>
      
      {/* Header */}
      <div className="border-b p-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold">Visual Trust Policy Editor</h2>
              <p className="text-sm text-gray-600">Drag from the palette, then connect: Condition → Operator/Action, Operator → Operator/Action</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearCanvas}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button variant="outline" size="sm" onClick={() => validatePolicy()}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Validate
            </Button>
            <Button variant="outline" size="sm" onClick={simulatePolicy} disabled={isSimulating}>
              <Play className="h-4 w-4 mr-2" />
              {isSimulating ? 'Simulating...' : 'Simulate'}
            </Button>
            <Button variant="outline" size="sm" onClick={previewPolicy}>
              <FileText className="h-4 w-4 mr-2" />
              Preview JSON
            </Button>
            <Button variant="outline" size="sm" onClick={loadPolicies}>
              <Upload className="h-4 w-4 mr-2" />
              Load
            </Button>
            <Button variant="outline" size="sm" onClick={savePolicy}>
              <Save className="h-4 w-4 mr-2" />
              Save
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
              <h3 className="font-medium text-sm mb-3">Drag to canvas or click to add</h3>
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
              <h3 className="font-medium text-sm mb-3">Drag to canvas or click to add</h3>
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
              <h3 className="font-medium text-sm mb-3">Drag to canvas or click to add</h3>
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
            <div>
              <label className="text-sm font-medium">Version</label>
              <div className="mt-1 flex items-center gap-2">
                <Input value={policyVersion} onChange={(e) => setPolicyVersion(e.target.value)} className="w-28" />
                <Button type="button" variant="outline" size="sm" onClick={() => setPolicyVersion((v) => bumpSemver(v, 'patch'))}>+ Patch</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setPolicyVersion((v) => bumpSemver(v, 'minor'))}>+ Minor</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setPolicyVersion((v) => bumpSemver(v, 'major'))}>+ Major</Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Versioning</label>
                <Button type="button" variant="outline" size="sm" onClick={saveVersionSnapshot}>
                  <Save className="h-4 w-4 mr-1" /> Save Snapshot
                </Button>
              </div>
              {versions.length === 0 ? (
                <div className="text-xs text-muted-foreground">No snapshots yet</div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-auto">
                  {versions.map((v) => (
                    <Card key={v.id}>
                      <CardContent className="p-2">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-medium">v{v.version}</div>
                            <div className="text-[10px] text-muted-foreground">{new Date(v.timestamp).toLocaleString()}</div>
                            <div className="text-[10px]">
                              <Badge variant={v.saved ? 'default' : 'outline'} className="text-[10px]">{v.saved ? 'Persisted' : 'Local'}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button type="button" variant="outline" size="sm" onClick={() => rollbackToVersion(v.id)}>Load</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Import from JSON</label>
              <Input
                type="file"
                accept="application/json"
                className="mt-1"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const text = await file.text()
                    const json = JSON.parse(text)
                    // expect json.graph.nodes and json.graph.edges
                    if (json?.graph?.nodes && json?.graph?.edges) {
                      const importedNodes: Node[] = json.graph.nodes.map((n: any) => ({
                        id: n.id,
                        type: n.type,
                        position: { x: Math.random() * 400 + 100, y: Math.random() * 200 + 100 },
                        data: n.data
                      }))
                      const importedEdges: Edge[] = json.graph.edges.map((e: any) => ({
                        id: e.id || `${e.source}-${e.target}`,
                        source: e.source,
                        target: e.target,
                        animated: true
                      }))
                      setNodes(importedNodes)
                      setEdges(importedEdges)
                      setPolicyName(json.name || policyName)
                      setPolicyDescription(json.description || policyDescription)
                      setInvalidHint('Policy imported')
                      setTimeout(() => setInvalidHint(null), 1500)
                    } else {
                      setInvalidHint('Invalid JSON format: missing graph')
                      setTimeout(() => setInvalidHint(null), 2000)
                    }
                  } catch {
                    setInvalidHint('Failed to import JSON')
                    setTimeout(() => setInvalidHint(null), 2000)
                  }
                }}
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
        <div className={`flex-1 relative ${isDragging ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''}`}>
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="bg-blue-100 border-2 border-blue-400 rounded-lg p-4 shadow-lg">
                <span className="text-blue-700 font-medium">Drop node here to add to canvas</span>
              </div>
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDoubleClick={onNodeDoubleClick}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionLineStyle={{ stroke: '#10b981', strokeWidth: 2 }}
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
            {invalidHint && (
              <Panel position="top-center" className="bg-red-50 text-red-700 px-3 py-2 rounded border border-red-200 shadow">
                <div className="text-xs font-medium">{invalidHint}</div>
              </Panel>
            )}
          </ReactFlow>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Policy JSON Preview</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded bg-muted p-3 text-xs">
            <pre className="whitespace-pre-wrap break-words">{previewJson}</pre>
          </div>
        </DialogContent>
      </Dialog>

      {/* Node Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure {editingNode?.data.label || 'Node'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editingNode?.data.type === 'condition' && (
              <>
                {editingNode.data.conditionType === 'did' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">DID Pattern</label>
                    <Input
                      placeholder="e.g., did:atp:*"
                      value={nodeConfig.didPattern || ''}
                      onChange={(e) => setNodeConfig({ ...nodeConfig, didPattern: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">Use * for wildcards</p>
                  </div>
                )}
                {editingNode.data.conditionType === 'trustLevel' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Minimum Trust Level</label>
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      placeholder="e.g., 0.8"
                      value={nodeConfig.minTrustLevel || ''}
                      onChange={(e) => setNodeConfig({ ...nodeConfig, minTrustLevel: parseFloat(e.target.value) })}
                    />
                    <p className="text-xs text-gray-500">Value between 0 and 1</p>
                  </div>
                )}
                {editingNode.data.conditionType === 'vc' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Required Credential Type</label>
                    <Input
                      placeholder="e.g., VerifiedIdentity"
                      value={nodeConfig.credentialType || ''}
                      onChange={(e) => setNodeConfig({ ...nodeConfig, credentialType: e.target.value })}
                    />
                  </div>
                )}
                {editingNode.data.conditionType === 'tool' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tool Name</label>
                    <Input
                      placeholder="e.g., api-access"
                      value={nodeConfig.toolName || ''}
                      onChange={(e) => setNodeConfig({ ...nodeConfig, toolName: e.target.value })}
                    />
                    <label className="text-sm font-medium mt-2">Tool Type</label>
                    <Input
                      placeholder="e.g., read, write, execute"
                      value={nodeConfig.toolType || ''}
                      onChange={(e) => setNodeConfig({ ...nodeConfig, toolType: e.target.value })}
                    />
                  </div>
                )}
                {editingNode.data.conditionType === 'time' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Time Range</label>
                    <div className="flex gap-2">
                      <Input
                        type="time"
                        value={nodeConfig.startTime || ''}
                        onChange={(e) => setNodeConfig({ ...nodeConfig, startTime: e.target.value })}
                      />
                      <span className="self-center">to</span>
                      <Input
                        type="time"
                        value={nodeConfig.endTime || ''}
                        onChange={(e) => setNodeConfig({ ...nodeConfig, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                )}
                {editingNode.data.conditionType === 'context' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Context Key</label>
                    <Input
                      placeholder="e.g., location"
                      value={nodeConfig.contextKey || ''}
                      onChange={(e) => setNodeConfig({ ...nodeConfig, contextKey: e.target.value })}
                    />
                    <label className="text-sm font-medium mt-2">Context Value</label>
                    <Input
                      placeholder="e.g., office"
                      value={nodeConfig.contextValue || ''}
                      onChange={(e) => setNodeConfig({ ...nodeConfig, contextValue: e.target.value })}
                    />
                  </div>
                )}
                {editingNode.data.conditionType === 'organization' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Organization Name</label>
                    <Input
                      placeholder="e.g., AcmeCorp"
                      value={nodeConfig.organizationName || ''}
                      onChange={(e) => setNodeConfig({ ...nodeConfig, organizationName: e.target.value })}
                    />
                  </div>
                )}
              </>
            )}
            
            {editingNode?.data.type === 'action' && (
              <>
                {editingNode.data.actionType === 'throttle' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Throttle Rate (%)</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="e.g., 50"
                      value={nodeConfig.throttleRate || ''}
                      onChange={(e) => setNodeConfig({ ...nodeConfig, throttleRate: parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-gray-500">Percentage of requests to allow</p>
                  </div>
                )}
                {editingNode.data.actionType === 'log' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Log Level</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={nodeConfig.logLevel || 'info'}
                      onChange={(e) => setNodeConfig({ ...nodeConfig, logLevel: e.target.value })}
                    >
                      <option value="debug">Debug</option>
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                )}
                {editingNode.data.actionType === 'alert' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Alert Message</label>
                    <Input
                      placeholder="e.g., Suspicious activity detected"
                      value={nodeConfig.alertMessage || ''}
                      onChange={(e) => setNodeConfig({ ...nodeConfig, alertMessage: e.target.value })}
                    />
                    <label className="text-sm font-medium mt-2">Alert Channel</label>
                    <Input
                      placeholder="e.g., email, slack"
                      value={nodeConfig.alertChannel || ''}
                      onChange={(e) => setNodeConfig({ ...nodeConfig, alertChannel: e.target.value })}
                    />
                  </div>
                )}
                {editingNode.data.actionType === 'require_approval' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Approver Role</label>
                    <Input
                      placeholder="e.g., admin"
                      value={nodeConfig.approverRole || ''}
                      onChange={(e) => setNodeConfig({ ...nodeConfig, approverRole: e.target.value })}
                    />
                    <label className="text-sm font-medium mt-2">Timeout (seconds)</label>
                    <Input
                      type="number"
                      placeholder="e.g., 300"
                      value={nodeConfig.timeout || ''}
                      onChange={(e) => setNodeConfig({ ...nodeConfig, timeout: parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </>
            )}
            
            {editingNode?.data.type === 'operator' && (
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  {editingNode.data.operatorType === 'and' && 'All connected conditions must be true'}
                  {editingNode.data.operatorType === 'or' && 'At least one connected condition must be true'}
                  {editingNode.data.operatorType === 'not' && 'Inverts the result of the connected condition'}
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveNodeConfig}>
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Wrapper component with ReactFlowProvider
export function VisualPolicyEditor() {
  return (
    <ReactFlowProvider>
      {/* Use min-h instead of h-screen so the footer can sit below without overlapping */}
      <div className="min-h-[80vh]">
        <PolicyEditor />
      </div>
    </ReactFlowProvider>
  )
} 