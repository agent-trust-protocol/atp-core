"use client"

import { useState, useCallback, useRef, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
  ReactFlowInstance,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Save,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Plus,
  Settings,
  Zap,
  GitBranch,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Database,
  Shield,
  Activity
} from "lucide-react";

// Custom node types for ATP workflows
const nodeTypes = {
  trigger: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-blue-100 border-2 border-blue-300 min-w-[150px]">
      <div className="flex items-center gap-2 mb-1">
        <Play className="h-4 w-4 text-blue-600" />
        <div className="font-medium text-blue-800">{data.label}</div>
      </div>
      <div className="text-xs text-blue-600">{data.type}</div>
    </div>
  ),
  action: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-green-100 border-2 border-green-300 min-w-[150px]">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="h-4 w-4 text-green-600" />
        <div className="font-medium text-green-800">{data.label}</div>
      </div>
      <div className="text-xs text-green-600">{data.type}</div>
    </div>
  ),
  condition: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-yellow-100 border-2 border-yellow-300 min-w-[150px]">
      <div className="flex items-center gap-2 mb-1">
        <GitBranch className="h-4 w-4 text-yellow-600" />
        <div className="font-medium text-yellow-800">{data.label}</div>
      </div>
      <div className="text-xs text-yellow-600">{data.type}</div>
    </div>
  ),
  output: ({ data }: { data: any }) => (
    <div className="px-4 py-2 shadow-lg rounded-lg bg-purple-100 border-2 border-purple-300 min-w-[150px]">
      <div className="flex items-center gap-2 mb-1">
        <Database className="h-4 w-4 text-purple-600" />
        <div className="font-medium text-purple-800">{data.label}</div>
      </div>
      <div className="text-xs text-purple-600">{data.type}</div>
    </div>
  ),
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 100, y: 100 },
    data: { label: 'Policy Change Trigger', type: 'policy-change-trigger' },
  },
  {
    id: '2',
    type: 'action',
    position: { x: 300, y: 100 },
    data: { label: 'Validate Policy', type: 'validate-policy' },
  },
  {
    id: '3',
    type: 'condition',
    position: { x: 500, y: 100 },
    data: { label: 'Policy Valid?', type: 'policy-valid' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3', animated: true },
];

// Available node templates for the toolbar
const nodeTemplates = [
  {
    category: 'Triggers',
    nodes: [
      { type: 'trigger', label: 'Policy Change', nodeType: 'policy-change-trigger', icon: Shield },
      { type: 'trigger', label: 'Trust Change', nodeType: 'trust-change-trigger', icon: Activity },
      { type: 'trigger', label: 'Security Alert', nodeType: 'security-alert-trigger', icon: AlertTriangle },
      { type: 'trigger', label: 'Schedule', nodeType: 'schedule-trigger', icon: Clock },
    ]
  },
  {
    category: 'Actions',
    nodes: [
      { type: 'action', label: 'Validate Policy', nodeType: 'validate-policy', icon: CheckCircle },
      { type: 'action', label: 'Evaluate Trust', nodeType: 'evaluate-trust', icon: Activity },
      { type: 'action', label: 'Send Notification', nodeType: 'send-notification', icon: Mail },
      { type: 'action', label: 'Generate Report', nodeType: 'generate-report', icon: Database },
    ]
  },
  {
    category: 'Conditions',
    nodes: [
      { type: 'condition', label: 'Trust Threshold', nodeType: 'trust-threshold', icon: GitBranch },
      { type: 'condition', label: 'Policy Compliance', nodeType: 'policy-compliance', icon: Shield },
    ]
  },
  {
    category: 'Outputs',
    nodes: [
      { type: 'output', label: 'Audit Log', nodeType: 'audit-log', icon: Database },
    ]
  }
];

function WorkflowDesignerContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onInit = useCallback((rfi: ReactFlowInstance) => {
    setReactFlowInstance(rfi);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeData = event.dataTransfer.getData('application/reactflow');
      if (typeof nodeData === 'undefined' || !nodeData) {
        return;
      }

      const { type, label, nodeType } = JSON.parse(nodeData);
      const position = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `${Date.now()}`,
        type,
        position: position || { x: 0, y: 0 },
        data: { label, type: nodeType },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string, type: string) => {
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({ type: nodeType, label, nodeType: type })
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const saveWorkflow = () => {
    const workflow = {
      name: workflowName,
      nodes,
      edges,
      timestamp: new Date().toISOString()
    };
    
    // Save to localStorage for demo purposes
    localStorage.setItem(`workflow-${Date.now()}`, JSON.stringify(workflow));
    
    // In a real app, this would save to the backend
    alert(`Workflow "${workflowName}" saved successfully!`);
  };

  const resetWorkflow = () => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setWorkflowName('New Workflow');
    setSelectedNode(null);
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-[800px]">
      {/* Node Palette */}
      <div className="col-span-3">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Node Palette</CardTitle>
            <CardDescription>Drag nodes to the canvas to build your workflow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {nodeTemplates.map((category) => (
              <div key={category.category}>
                <h4 className="font-medium text-sm text-gray-600 mb-2">{category.category}</h4>
                <div className="space-y-2">
                  {category.nodes.map((node) => {
                    const IconComponent = node.icon;
                    return (
                      <div
                        key={node.nodeType}
                        className="flex items-center gap-2 p-2 border rounded cursor-move hover:bg-gray-50 transition-colors"
                        draggable
                        onDragStart={(e) => onDragStart(e, node.type, node.label, node.nodeType)}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span className="text-sm">{node.label}</span>
                      </div>
                    );
                  })}
                </div>
                <Separator className="mt-3" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Main Canvas */}
      <div className="col-span-6">
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <Input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="text-lg font-medium border-none p-0 h-auto bg-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={resetWorkflow}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button size="sm" onClick={saveWorkflow}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline">
                <Play className="h-4 w-4 mr-1" />
                Test
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div ref={reactFlowWrapper} className="h-[600px]">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={onInit}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                className="bg-gray-50"
              >
                <Controls />
                <MiniMap />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
              </ReactFlow>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties Panel */}
      <div className="col-span-3">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Properties</CardTitle>
            <CardDescription>Configure the selected node</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedNode ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Node Type</Label>
                  <div className="text-sm text-gray-600">{selectedNode.data.type}</div>
                </div>
                <div>
                  <Label htmlFor="node-label" className="text-sm font-medium">Label</Label>
                  <Input
                    id="node-label"
                    value={selectedNode.data.label}
                    onChange={(e) => {
                      setNodes((nds) =>
                        nds.map((node) =>
                          node.id === selectedNode.id
                            ? { ...node, data: { ...node.data, label: e.target.value } }
                            : node
                        )
                      );
                    }}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Position</Label>
                  <div className="text-sm text-gray-600">
                    X: {Math.round(selectedNode.position.x)}, Y: {Math.round(selectedNode.position.y)}
                  </div>
                </div>
                <Button size="sm" variant="destructive" className="w-full">
                  Delete Node
                </Button>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Settings className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Select a node to view its properties</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function WorkflowDesigner() {
  return (
    <ReactFlowProvider>
      <WorkflowDesignerContent />
    </ReactFlowProvider>
  );
}