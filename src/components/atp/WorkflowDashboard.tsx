"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  Square, 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle,
  GitBranch,
  Zap,
  AlertTriangle,
  RefreshCw,
  Plus
} from "lucide-react";

interface WorkflowSummary {
  id: string;
  name: string;
  status: 'active' | 'draft' | 'archived';
  lastExecution?: {
    status: 'success' | 'failed' | 'running';
    timestamp: string;
    duration?: number;
  };
  schedule?: string;
  nodeCount: number;
}

interface ExecutionSummary {
  id: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  duration?: number;
  progress?: number;
}

const WORKFLOW_ENGINE_API = '/api/health?type=workflows';

export function WorkflowDashboard() {
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [executions, setExecutions] = useState<ExecutionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [engineStatus, setEngineStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  useEffect(() => {
    checkEngineStatus();
    if (engineStatus === 'connected') {
      loadWorkflows();
      loadExecutions();
    }
  }, [engineStatus]);

  const checkEngineStatus = async () => {
    try {
      const response = await fetch('/api/health?type=workflows&action=health');
      if (response.ok) {
        setEngineStatus('connected');
        setError(null);
      } else {
        setEngineStatus('disconnected');
        setError('Workflow engine is not responding');
      }
    } catch (err) {
      setEngineStatus('disconnected');
      setError('Cannot connect to workflow engine. The Next.js server may be having issues.');
    }
  };

  const loadWorkflows = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(WORKFLOW_ENGINE_API + '&action=list');
      if (response.ok) {
        const data = await response.json();
        // Transform workflow data to summary format
        const summaries: WorkflowSummary[] = data.workflows?.map((w: any) => ({
          id: w.id,
          name: w.name,
          status: w.status || 'draft',
          nodeCount: w.nodes?.length || 0,
          schedule: w.triggers?.find((t: any) => t.type === 'schedule')?.config?.schedule
        })) || [];
        setWorkflows(summaries);
      }
    } catch (err) {
      console.error('Failed to load workflows:', err);
      setError('Failed to load workflows');
    } finally {
      setIsLoading(false);
    }
  };

  const loadExecutions = async () => {
    try {
      const response = await fetch(`${WORKFLOW_ENGINE_API}&action=executions`);
      if (response.ok) {
        const data = await response.json();
        const summaries: ExecutionSummary[] = data.executions?.map((e: any) => ({
          id: e.executionId,
          workflowName: e.workflowId, // Would need to map to actual name
          status: e.state,
          startTime: e.startTime,
          progress: Math.random() * 100 // Placeholder
        })) || [];
        setExecutions(summaries);
      }
    } catch (err) {
      console.error('Failed to load executions:', err);
    }
  };

  const executeWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch(`${WORKFLOW_ENGINE_API}/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialData: {} })
      });
      
      if (response.ok) {
        await loadExecutions(); // Refresh executions
      } else {
        setError('Failed to execute workflow');
      }
    } catch (err) {
      setError('Failed to execute workflow');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed': 
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled': return <Square className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'active' ? 'default' : 
                   status === 'draft' ? 'secondary' : 'outline';
    return <Badge variant={variant}>{status}</Badge>;
  };

  if (engineStatus === 'checking') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Checking workflow engine status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (engineStatus === 'disconnected') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Workflow Engine Offline
          </CardTitle>
          <CardDescription>
            The workflow automation engine is not running.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              The workflow automation engine is integrated into your Next.js application.
              If you're seeing this message, there may be an issue with the API routes.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium">✨ Good news!</p>
              <p className="text-sm text-blue-700">Workflow features are now built into your ATP app - no separate server needed!</p>
            </div>
            <Button onClick={checkEngineStatus} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Engine Connected</span>
        </div>
        <Button onClick={() => window.location.href = '/dashboard/workflows/health'} variant="outline" size="sm">
          <Activity className="h-4 w-4 mr-2" />
          System Health
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-red-900">Connection Issue</h4>
              <p className="text-red-700 mt-1 text-sm">{error}</p>
              <div className="mt-3 flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setError(null);
                    checkEngineStatus();
                  }}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Try Again
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => window.location.href = '/dashboard/workflows/health'}
                  className="text-red-700 hover:bg-red-100"
                >
                  Check System Health
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Executions */}
      {executions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Active Executions ({executions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {executions.map((execution) => (
                <div key={execution.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(execution.status)}
                    <div>
                      <div className="font-medium">{execution.workflowName}</div>
                      <div className="text-sm text-gray-600">
                        Started {new Date(execution.startTime).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {execution.progress && (
                      <div className="text-sm text-gray-600">
                        {Math.round(execution.progress)}%
                      </div>
                    )}
                    <Badge variant="outline">{execution.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Workflows ({workflows.length})
          </CardTitle>
          <CardDescription>
            Automated workflows for ATP policy, trust, and security management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {/* Skeleton loader for better UX */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4 animate-pulse">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <GitBranch className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Workflow Automation</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Automate your ATP operations with visual workflows. Create triggers, actions, and conditions to respond to events automatically.
              </p>
              <div className="space-y-3">
                <Button onClick={() => window.location.href = '/dashboard/workflows/designer'} size="lg" className="mx-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Workflow
                </Button>
                <p className="text-sm text-gray-500">
                  or <button className="text-blue-600 hover:underline" onClick={() => window.location.href = '/dashboard/workflows/nodes'}>browse available workflow nodes</button>
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{workflow.name}</CardTitle>
                      {getStatusBadge(workflow.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Nodes:</span>
                        <span className="font-medium">{workflow.nodeCount}</span>
                      </div>
                      
                      {workflow.schedule && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Schedule:</span>
                          <span className="font-mono text-xs">{workflow.schedule}</span>
                        </div>
                      )}
                      
                      {workflow.lastExecution && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Last run:</span>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(workflow.lastExecution.status)}
                            <span className="text-xs">
                              {new Date(workflow.lastExecution.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          onClick={() => executeWorkflow(workflow.id)}
                          disabled={workflow.status !== 'active'}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Run
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => alert('Workflow details: ' + workflow.name)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Button 
              variant="default" 
              className="h-20 flex-col bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
              onClick={() => window.location.href = '/dashboard/workflows/designer'}
            >
              <GitBranch className="h-6 w-6 mb-2" />
              <span className="font-medium">Create Workflow</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col border-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              onClick={() => window.location.href = '/dashboard/workflows/nodes'}
            >
              <Zap className="h-6 w-6 mb-2 text-blue-600" />
              <span>Browse Nodes</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col border-2 hover:bg-green-50 hover:border-green-300 transition-colors"
              onClick={() => window.location.href = '/dashboard/workflows/executions'}
            >
              <Activity className="h-6 w-6 mb-2 text-green-600" />
              <span>View Executions</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col border-2 hover:bg-purple-50 hover:border-purple-300 transition-colors"
              onClick={() => window.location.href = '/dashboard/workflows/health'}
            >
              <CheckCircle className="h-6 w-6 mb-2 text-purple-600" />
              <span>System Status</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}