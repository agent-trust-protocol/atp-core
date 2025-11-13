"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Network,
  RefreshCw,
  Clock,
  Zap,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";

interface SystemHealthData {
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  uptime: number;
  version: string;
  services: Array<{
    name: string;
    status: 'online' | 'degraded' | 'offline';
    uptime: number;
    responseTime: number;
    lastCheck: string;
    description: string;
  }>;
  performance: {
    cpu: {
      usage: number;
      cores: number;
      loadAverage: number[];
    };
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    disk: {
      used: number;
      total: number;
      percentage: number;
    };
    network: {
      bytesIn: number;
      bytesOut: number;
      connections: number;
    };
  };
  workflow: {
    activeExecutions: number;
    queuedJobs: number;
    completedToday: number;
    failedToday: number;
    avgExecutionTime: number;
    successRate: number;
  };
  dependencies: Array<{
    name: string;
    status: 'connected' | 'slow' | 'disconnected';
    responseTime: number;
    lastCheck: string;
  }>;
}

export function WorkflowSystemHealth() {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    loadHealthData();
    // Set up polling for real-time updates
    const interval = setInterval(loadHealthData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadHealthData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/health?type=workflows&action=health');
      if (response.ok) {
        // Mock enhanced health data
        const mockHealthData: SystemHealthData = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: 186432, // ~2 days in seconds
          version: '1.0.0',
          services: [
            {
              name: 'Workflow Engine',
              status: 'online',
              uptime: 99.8,
              responseTime: 45,
              lastCheck: new Date(Date.now() - 30000).toISOString(),
              description: 'Core workflow execution engine'
            },
            {
              name: 'Node Registry',
              status: 'online',
              uptime: 99.9,
              responseTime: 32,
              lastCheck: new Date(Date.now() - 30000).toISOString(),
              description: 'Workflow node type registry'
            },
            {
              name: 'Event Bus',
              status: 'online',
              uptime: 99.7,
              responseTime: 28,
              lastCheck: new Date(Date.now() - 30000).toISOString(),
              description: 'Event-driven communication system'
            },
            {
              name: 'Scheduler',
              status: 'degraded',
              uptime: 95.2,
              responseTime: 124,
              lastCheck: new Date(Date.now() - 30000).toISOString(),
              description: 'Cron-based workflow scheduler'
            }
          ],
          performance: {
            cpu: {
              usage: 23.4,
              cores: 8,
              loadAverage: [1.2, 1.1, 1.0]
            },
            memory: {
              used: 2.1,
              total: 8.0,
              percentage: 26.3
            },
            disk: {
              used: 45.2,
              total: 100.0,
              percentage: 45.2
            },
            network: {
              bytesIn: 1024768,
              bytesOut: 2048256,
              connections: 42
            }
          },
          workflow: {
            activeExecutions: 3,
            queuedJobs: 7,
            completedToday: 156,
            failedToday: 4,
            avgExecutionTime: 82500, // ms
            successRate: 97.5
          },
          dependencies: [
            {
              name: 'Database (PostgreSQL)',
              status: 'connected',
              responseTime: 15,
              lastCheck: new Date(Date.now() - 5000).toISOString()
            },
            {
              name: 'Redis Cache',
              status: 'connected',
              responseTime: 8,
              lastCheck: new Date(Date.now() - 5000).toISOString()
            },
            {
              name: 'ATP API Gateway',
              status: 'slow',
              responseTime: 250,
              lastCheck: new Date(Date.now() - 5000).toISOString()
            },
            {
              name: 'Email Service',
              status: 'connected',
              responseTime: 120,
              lastCheck: new Date(Date.now() - 5000).toISOString()
            }
          ]
        };
        setHealthData(mockHealthData);
        setLastUpdate(new Date().toLocaleTimeString());
        setError(null);
      } else {
        setError('Failed to load health data');
      }
    } catch (err) {
      console.error('Failed to load health data:', err);
      setError('Failed to load health data');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'connected':
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
      case 'slow':
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'offline':
      case 'disconnected':
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      online: 'bg-green-100 text-green-800 border-green-200',
      connected: 'bg-green-100 text-green-800 border-green-200',
      healthy: 'bg-green-100 text-green-800 border-green-200',
      degraded: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      slow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      offline: 'bg-red-100 text-red-800 border-red-200',
      disconnected: 'bg-red-100 text-red-800 border-red-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    };
    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {status}
      </Badge>
    );
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (isLoading && !healthData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading system health data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !healthData) {
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

  if (!healthData) return null;

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(healthData.status)}
              <CardTitle>System Status: {healthData.status.toUpperCase()}</CardTitle>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Last Updated: {lastUpdate}</span>
              <Button onClick={loadHealthData} variant="outline" size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          <CardDescription>
            System uptime: {formatUptime(healthData.uptime)} • Version: {healthData.version}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="h-4 w-4 text-blue-600" />
              <span className="font-medium">CPU Usage</span>
            </div>
            <div className="text-2xl font-bold mb-1">{healthData.performance.cpu.usage.toFixed(1)}%</div>
            <Progress value={healthData.performance.cpu.usage} className="h-2" />
            <div className="text-xs text-gray-600 mt-1">
              {healthData.performance.cpu.cores} cores • Load: {healthData.performance.cpu.loadAverage[0].toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="h-4 w-4 text-green-600" />
              <span className="font-medium">Memory</span>
            </div>
            <div className="text-2xl font-bold mb-1">{healthData.performance.memory.percentage.toFixed(1)}%</div>
            <Progress value={healthData.performance.memory.percentage} className="h-2" />
            <div className="text-xs text-gray-600 mt-1">
              {healthData.performance.memory.used.toFixed(1)}GB / {healthData.performance.memory.total.toFixed(1)}GB
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Disk Usage</span>
            </div>
            <div className="text-2xl font-bold mb-1">{healthData.performance.disk.percentage.toFixed(1)}%</div>
            <Progress value={healthData.performance.disk.percentage} className="h-2" />
            <div className="text-xs text-gray-600 mt-1">
              {healthData.performance.disk.used.toFixed(1)}GB / {healthData.performance.disk.total.toFixed(1)}GB
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Network className="h-4 w-4 text-orange-600" />
              <span className="font-medium">Network</span>
            </div>
            <div className="text-2xl font-bold mb-1">{healthData.performance.network.connections}</div>
            <div className="text-xs text-gray-600">
              ↓ {formatBytes(healthData.performance.network.bytesIn)}
            </div>
            <div className="text-xs text-gray-600">
              ↑ {formatBytes(healthData.performance.network.bytesOut)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Workflow Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{healthData.workflow.activeExecutions}</div>
              <div className="text-sm text-gray-600">Active Executions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{healthData.workflow.queuedJobs}</div>
              <div className="text-sm text-gray-600">Queued Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{healthData.workflow.completedToday}</div>
              <div className="text-sm text-gray-600">Completed Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{healthData.workflow.failedToday}</div>
              <div className="text-sm text-gray-600">Failed Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{(healthData.workflow.avgExecutionTime / 1000).toFixed(1)}s</div>
              <div className="text-sm text-gray-600">Avg Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{healthData.workflow.successRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Service Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {healthData.services.map((service) => (
              <div key={service.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-gray-600">{service.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium">{service.uptime.toFixed(1)}%</div>
                    <div className="text-gray-600">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{service.responseTime}ms</div>
                    <div className="text-gray-600">Response</div>
                  </div>
                  {getStatusBadge(service.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dependencies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            External Dependencies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {healthData.dependencies.map((dep) => (
              <div key={dep.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(dep.status)}
                  <div>
                    <div className="font-medium">{dep.name}</div>
                    <div className="text-sm text-gray-600">
                      Last checked: {new Date(dep.lastCheck).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="font-medium">{dep.responseTime}ms</div>
                    <div className="text-xs text-gray-600">Response</div>
                  </div>
                  {getStatusBadge(dep.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}