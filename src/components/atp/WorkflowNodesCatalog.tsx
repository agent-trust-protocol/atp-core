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
  Zap,
  Play,
  GitBranch,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Database,
  Shield,
  Activity,
  Bell,
  Settings,
  RefreshCw
} from "lucide-react";

interface WorkflowNode {
  type: string;
  category: 'trigger' | 'action' | 'condition' | 'output';
  label: string;
  description: string;
  icon: string;
  color: string;
  inputs?: string[];
  outputs?: string[];
  configurable?: boolean;
  atpSpecific?: boolean;
}

const nodeIcons: Record<string, React.ReactNode> = {
  '📋': <Shield className="h-4 w-4" />,
  '🔄': <RefreshCw className="h-4 w-4" />,
  '🚨': <AlertTriangle className="h-4 w-4" />,
  '✅': <CheckCircle className="h-4 w-4" />,
  '⏰': <Clock className="h-4 w-4" />,
  '📧': <Mail className="h-4 w-4" />,
  '💾': <Database className="h-4 w-4" />,
  '🎯': <Activity className="h-4 w-4" />,
  '🔔': <Bell className="h-4 w-4" />,
  '⚙️': <Settings className="h-4 w-4" />
};

export function WorkflowNodesCatalog() {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [filteredNodes, setFilteredNodes] = useState<WorkflowNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadNodes();
  }, []);

  useEffect(() => {
    filterNodes();
  }, [nodes, searchTerm, selectedCategory]);

  const loadNodes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/health?type=workflows&action=nodes');
      if (response.ok) {
        const data = await response.json();
        // Enhanced mock data with more ATP-specific nodes
        const enhancedNodes: WorkflowNode[] = [
          // Triggers
          {
            type: 'policy-change-trigger',
            category: 'trigger',
            label: 'Policy Change Trigger',
            description: 'Triggers when a policy is created, updated, or deleted in the ATP system',
            icon: '📋',
            color: '#3B82F6',
            outputs: ['policy_data', 'change_type', 'timestamp'],
            configurable: true,
            atpSpecific: true
          },
          {
            type: 'trust-change-trigger',
            category: 'trigger',
            label: 'Trust Score Change Trigger',
            description: 'Triggers when agent trust scores change significantly',
            icon: '🔄',
            color: '#06B6D4',
            outputs: ['agent_id', 'old_score', 'new_score', 'threshold'],
            configurable: true,
            atpSpecific: true
          },
          {
            type: 'security-alert-trigger',
            category: 'trigger',
            label: 'Security Alert Trigger',
            description: 'Triggers on security events, anomalies, or potential threats',
            icon: '🚨',
            color: '#DC2626',
            outputs: ['alert_level', 'threat_type', 'affected_agents', 'details'],
            configurable: true,
            atpSpecific: true
          },
          {
            type: 'schedule-trigger',
            category: 'trigger',
            label: 'Schedule Trigger',
            description: 'Triggers workflows on a predefined schedule (cron-based)',
            icon: '⏰',
            color: '#7C3AED',
            outputs: ['execution_time', 'schedule_config'],
            configurable: true,
            atpSpecific: false
          },
          // Actions
          {
            type: 'validate-policy',
            category: 'action',
            label: 'Validate Policy',
            description: 'Validates ATP policy syntax and compliance rules',
            icon: '✅',
            color: '#059669',
            inputs: ['policy_data'],
            outputs: ['validation_result', 'errors', 'warnings'],
            configurable: true,
            atpSpecific: true
          },
          {
            type: 'evaluate-trust',
            category: 'action',
            label: 'Evaluate Trust Score',
            description: 'Calculates and updates agent trust scores based on behavior',
            icon: '🎯',
            color: '#0891B2',
            inputs: ['agent_id', 'behavior_data'],
            outputs: ['trust_score', 'factors', 'recommendations'],
            configurable: true,
            atpSpecific: true
          },
          {
            type: 'send-notification',
            category: 'action',
            label: 'Send Notification',
            description: 'Sends alerts via email, SMS, or webhook',
            icon: '📧',
            color: '#EA580C',
            inputs: ['message', 'recipients', 'priority'],
            outputs: ['delivery_status', 'message_id'],
            configurable: true,
            atpSpecific: false
          },
          {
            type: 'generate-report',
            category: 'action',
            label: 'Generate Report',
            description: 'Creates compliance and security reports',
            icon: '💾',
            color: '#7C2D12',
            inputs: ['report_type', 'data_range', 'format'],
            outputs: ['report_url', 'file_path', 'metadata'],
            configurable: true,
            atpSpecific: true
          },
          {
            type: 'update-agent-status',
            category: 'action',
            label: 'Update Agent Status',
            description: 'Modifies agent status, permissions, or trust level',
            icon: '⚙️',
            color: '#1D4ED8',
            inputs: ['agent_id', 'status_change', 'reason'],
            outputs: ['previous_status', 'new_status', 'timestamp'],
            configurable: true,
            atpSpecific: true
          },
          // Conditions
          {
            type: 'trust-threshold',
            category: 'condition',
            label: 'Trust Threshold Check',
            description: 'Evaluates if trust scores meet specified thresholds',
            icon: '🎯',
            color: '#059669',
            inputs: ['trust_score', 'threshold_config'],
            outputs: ['meets_threshold', 'score_difference'],
            configurable: true,
            atpSpecific: true
          },
          {
            type: 'policy-compliance',
            category: 'condition',
            label: 'Policy Compliance Check',
            description: 'Verifies compliance with ATP policies and regulations',
            icon: '📋',
            color: '#7C3AED',
            inputs: ['policy_id', 'compliance_data'],
            outputs: ['is_compliant', 'violations', 'severity'],
            configurable: true,
            atpSpecific: true
          },
          // Outputs
          {
            type: 'audit-log',
            category: 'output',
            label: 'Audit Log Entry',
            description: 'Records workflow execution in immutable audit logs',
            icon: '💾',
            color: '#374151',
            inputs: ['event_data', 'classification'],
            outputs: ['log_entry_id', 'hash', 'timestamp'],
            configurable: false,
            atpSpecific: true
          }
        ];
        setNodes(enhancedNodes);
      } else {
        setError('Failed to load workflow nodes');
      }
    } catch (err) {
      console.error('Failed to load nodes:', err);
      setError('Failed to load workflow nodes');
    } finally {
      setIsLoading(false);
    }
  };

  const filterNodes = () => {
    let filtered = nodes;

    if (searchTerm) {
      filtered = filtered.filter(node => 
        node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(node => node.category === selectedCategory);
    }

    setFilteredNodes(filtered);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'trigger': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'action': return 'bg-green-100 text-green-800 border-green-200';
      case 'condition': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'output': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton for filters */}
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
            </div>
          </CardContent>
        </Card>

        {/* Loading skeleton for stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading skeleton for nodes grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-16 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
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
            Filter Nodes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search nodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="trigger">Triggers</SelectItem>
                <SelectItem value="action">Actions</SelectItem>
                <SelectItem value="condition">Conditions</SelectItem>
                <SelectItem value="output">Outputs</SelectItem>
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
              <Play className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{nodes.filter(n => n.category === 'trigger').length}</div>
                <div className="text-sm text-gray-600">Triggers</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{nodes.filter(n => n.category === 'action').length}</div>
                <div className="text-sm text-gray-600">Actions</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{nodes.filter(n => n.category === 'condition').length}</div>
                <div className="text-sm text-gray-600">Conditions</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{nodes.filter(n => n.atpSpecific).length}</div>
                <div className="text-sm text-gray-600">ATP-Specific</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nodes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredNodes.map((node) => (
          <Card key={node.type} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="p-2 rounded-lg text-white"
                    style={{ backgroundColor: node.color }}
                  >
                    {nodeIcons[node.icon] || <Zap className="h-4 w-4" />}
                  </div>
                  <div>
                    <CardTitle className="text-sm">{node.label}</CardTitle>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getCategoryColor(node.category)}`}
                      >
                        {node.category}
                      </Badge>
                      {node.atpSpecific && (
                        <Badge variant="secondary" className="text-xs">
                          ATP
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">{node.description}</p>
              
              {node.inputs && node.inputs.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-medium text-gray-500 mb-1">Inputs:</div>
                  <div className="flex flex-wrap gap-1">
                    {node.inputs.map((input, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {input}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {node.outputs && node.outputs.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-1">Outputs:</div>
                  <div className="flex flex-wrap gap-1">
                    {node.outputs.map((output, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {output}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  {node.configurable ? 'Configurable' : 'Fixed'}
                </span>
                <Button size="sm" variant="outline" className="h-6 text-xs">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNodes.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No nodes found</h3>
            <p className="text-gray-600">
              Try adjusting your search criteria or category filter
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}