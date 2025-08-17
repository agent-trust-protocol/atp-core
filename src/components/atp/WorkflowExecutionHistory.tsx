"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search,
  Filter,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Pause,
  Square,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Timer,
  BarChart3,
  Eye,
  Download
} from "lucide-react";

interface WorkflowExecution {
  executionId: string;
  workflowId: string;
  workflowName: string;
  state: 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  startTime: string;
  endTime?: string;
  duration?: number;
  progress?: number;
  currentStep?: string;
  trigger: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  error?: string;
  logs?: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    step?: string;
  }>;
}

export function WorkflowExecutionHistory() {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [filteredExecutions, setFilteredExecutions] = useState<WorkflowExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('7d');

  useEffect(() => {
    loadExecutions();
    // Set up polling for active executions
    const interval = setInterval(loadExecutions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterExecutions();
  }, [executions, searchTerm, statusFilter, timeFilter]);

  const loadExecutions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/health?type=workflows&action=executions');
      if (response.ok) {
        const data = await response.json();
        // Enhanced mock data with more execution history
        const mockExecutions: WorkflowExecution[] = [
          {
            executionId: 'exec-running-1',
            workflowId: 'workflow-1',
            workflowName: 'Policy Validation Workflow',
            state: 'running',
            startTime: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
            progress: 65,
            currentStep: 'Validating policy syntax',
            trigger: 'policy-change-trigger',
            inputs: { policy_id: 'pol-001', change_type: 'update' }
          },
          {
            executionId: 'exec-completed-1',
            workflowId: 'workflow-2',
            workflowName: 'Trust Score Monitoring',
            state: 'completed',
            startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            endTime: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
            duration: 120000,
            progress: 100,
            trigger: 'trust-change-trigger',
            inputs: { agent_id: 'agent-001', threshold: 0.8 },
            outputs: { trust_score: 0.92, recommendation: 'maintain' }
          },
          {
            executionId: 'exec-failed-1',
            workflowId: 'workflow-3',
            workflowName: 'Security Alert Response',
            state: 'failed',
            startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000).toISOString(),
            duration: 30000,
            progress: 25,
            currentStep: 'Generate Incident Report',
            trigger: 'security-alert-trigger',
            inputs: { alert_level: 'high', threat_type: 'anomaly' },
            error: 'Failed to connect to reporting service'
          },
          {
            executionId: 'exec-completed-2',
            workflowId: 'workflow-1',
            workflowName: 'Policy Validation Workflow',
            state: 'completed',
            startTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            endTime: new Date(Date.now() - 4 * 60 * 60 * 1000 + 90000).toISOString(),
            duration: 90000,
            progress: 100,
            trigger: 'schedule-trigger',
            inputs: { schedule_config: '0 */4 * * *' },
            outputs: { policies_validated: 12, violations: 0 }
          },
          {
            executionId: 'exec-completed-3',
            workflowId: 'workflow-2',
            workflowName: 'Trust Score Monitoring',
            state: 'completed',
            startTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            endTime: new Date(Date.now() - 8 * 60 * 60 * 1000 + 75000).toISOString(),
            duration: 75000,
            progress: 100,
            trigger: 'trust-change-trigger',
            inputs: { agent_id: 'agent-002', threshold: 0.7 },
            outputs: { trust_score: 0.85, recommendation: 'monitor' }
          }
        ];
        setExecutions(mockExecutions);
      } else {
        setError('Failed to load execution history');
      }
    } catch (err) {
      console.error('Failed to load executions:', err);
      setError('Failed to load execution history');
    } finally {
      setIsLoading(false);
    }
  };

  const filterExecutions = () => {
    let filtered = executions;

    if (searchTerm) {
      filtered = filtered.filter(exec => 
        exec.workflowName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exec.executionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exec.trigger.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(exec => exec.state === statusFilter);
    }

    // Time filter
    const now = Date.now();
    const timeFilters = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      'all': Infinity
    };
    
    if (timeFilter !== 'all') {
      const cutoff = now - timeFilters[timeFilter as keyof typeof timeFilters];
      filtered = filtered.filter(exec => new Date(exec.startTime).getTime() > cutoff);
    }

    setFilteredExecutions(filtered.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled': return <Square className="h-4 w-4 text-gray-500" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      running: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
      paused: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants] || variants.cancelled}>
        {status}
      </Badge>
    );
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading execution history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Executions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search executions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{executions.filter(e => e.state === 'running').length}</div>
                <div className="text-sm text-gray-600">Running</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{executions.filter(e => e.state === 'completed').length}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{executions.filter(e => e.state === 'failed').length}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">
                  {formatDuration(executions.filter(e => e.duration).reduce((avg, e) => avg + (e.duration || 0), 0) / executions.filter(e => e.duration).length)}
                </div>
                <div className="text-sm text-gray-600">Avg Duration</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Execution List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Execution History ({filteredExecutions.length})
            </span>
            <Button onClick={loadExecutions} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredExecutions.map((execution) => (
              <div key={execution.executionId} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(execution.state)}
                      <div>
                        <h3 className="font-medium">{execution.workflowName}</h3>
                        <p className="text-sm text-gray-600">
                          ID: {execution.executionId} • Triggered by: {execution.trigger}
                        </p>
                      </div>
                      {getStatusBadge(execution.state)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Started:</span>
                        <div className="font-medium">
                          {new Date(execution.startTime).toLocaleString()}
                        </div>
                      </div>
                      
                      {execution.endTime && (
                        <div>
                          <span className="text-gray-500">Ended:</span>
                          <div className="font-medium">
                            {new Date(execution.endTime).toLocaleString()}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <div className="font-medium">{formatDuration(execution.duration)}</div>
                      </div>
                      
                      {execution.progress !== undefined && (
                        <div>
                          <span className="text-gray-500">Progress:</span>
                          <div className="font-medium">{execution.progress}%</div>
                        </div>
                      )}
                    </div>
                    
                    {execution.currentStep && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">Current Step:</span>
                        <span className="ml-2 font-medium">{execution.currentStep}</span>
                      </div>
                    )}
                    
                    {execution.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                        <strong>Error:</strong> {execution.error}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3 mr-1" />
                      Logs
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredExecutions.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No executions found</h3>
              <p className="text-gray-600">
                Try adjusting your search criteria or time range
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}