"use client"

import { useState, useEffect } from "react"
import { 
  Shield, 
  Users, 
  Activity, 
  Database, 
  Zap, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  Server,
  Globe,
  Lock,
  Eye,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  Cpu,
  HardDrive,
  Network,
  ShieldCheck,
  AlertCircle,
  Info,
  RefreshCw,
  Filter,
  Download,
  Calendar,
  Target,
  Award,
  Gauge
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { HydrationSafe } from "@/components/ui/hydration-safe"
import { AdvancedMetrics } from "./advanced-metrics"
import { UserManagement } from "./user-management"

interface SystemMetrics {
  totalAgents: number
  activeConnections: number
  signaturesGenerated: number
  avgResponseTime: number
  uptime: number
  requestsPerSecond: number
  errorRate: number
  dataProcessed: number
  securityEvents: number
  trustLevelDistribution: {
    untrusted: number
    basic: number
    verified: number
    premium: number
    enterprise: number
  }
  performanceMetrics: {
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
    networkThroughput: number
  }
  complianceMetrics: {
    soc2Compliance: number
    iso27001Compliance: number
    gdprCompliance: number
    hipaaCompliance: number
  }
}

interface ServiceStatus {
  name: string
  status: 'online' | 'warning' | 'offline'
  responseTime: number
  uptime: number
  version: string
  icon: any
  lastUpdated: Date
  healthScore: number
}

interface SecurityAlert {
  id: string
  type: 'critical' | 'warning' | 'info'
  title: string
  description: string
  timestamp: Date
  resolved: boolean
  severity: number
  affectedServices: string[]
}

interface RealTimeData {
  timestamp: Date
  requestsPerSecond: number
  activeConnections: number
  avgResponseTime: number
  errorRate: number
}

const SERVICES: ServiceStatus[] = [
  { 
    name: 'Identity Service', 
    status: 'online', 
    responseTime: 23, 
    uptime: 99.9, 
    version: '1.2.3', 
    icon: Users,
    lastUpdated: new Date(),
    healthScore: 98
  },
  { 
    name: 'VC Service', 
    status: 'online', 
    responseTime: 18, 
    uptime: 99.8, 
    version: '1.2.1', 
    icon: Shield,
    lastUpdated: new Date(),
    healthScore: 97
  },
  { 
    name: 'Permission Service', 
    status: 'warning', 
    responseTime: 45, 
    uptime: 98.5, 
    version: '1.1.9', 
    icon: Lock,
    lastUpdated: new Date(),
    healthScore: 85
  },
  { 
    name: 'RPC Gateway', 
    status: 'online', 
    responseTime: 12, 
    uptime: 99.9, 
    version: '1.3.0', 
    icon: Globe,
    lastUpdated: new Date(),
    healthScore: 99
  },
  { 
    name: 'Audit Logger', 
    status: 'online', 
    responseTime: 31, 
    uptime: 99.7, 
    version: '1.2.2', 
    icon: Eye,
    lastUpdated: new Date(),
    healthScore: 96
  },
  { 
    name: 'Quantum-Safe Server', 
    status: 'online', 
    responseTime: 15, 
    uptime: 99.9, 
    version: '1.0.0', 
    icon: ShieldCheck,
    lastUpdated: new Date(),
    healthScore: 100
  },
]

export function EnterpriseDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalAgents: 1247,
    activeConnections: 342,
    signaturesGenerated: 15847,
    avgResponseTime: 23,
    uptime: 99.9,
    requestsPerSecond: 156,
    errorRate: 0.1,
    dataProcessed: 2.4, // TB
    securityEvents: 3,
    trustLevelDistribution: {
      untrusted: 15,
      basic: 45,
      verified: 25,
      premium: 12,
      enterprise: 3
    },
    performanceMetrics: {
      cpuUsage: 67,
      memoryUsage: 78,
      diskUsage: 45,
      networkThroughput: 89
    },
    complianceMetrics: {
      soc2Compliance: 95,
      iso27001Compliance: 92,
      gdprCompliance: 98,
      hipaaCompliance: 94
    }
  })

  const [alerts, setAlerts] = useState<SecurityAlert[]>([
    {
      id: '1',
      type: 'warning',
      title: 'Permission Service Response Time',
      description: 'Response time increased to 45ms, above normal threshold',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      resolved: false,
      severity: 2,
      affectedServices: ['Permission Service']
    },
    {
      id: '2',
      type: 'info',
      title: 'New Enterprise Agent Registered',
      description: 'Enterprise agent "JPMorgan-AI-Assistant" successfully registered',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      resolved: true,
      severity: 1,
      affectedServices: ['Identity Service']
    },
    {
      id: '3',
      type: 'critical',
      title: 'Quantum-Safe Signature Verification Failed',
      description: 'Multiple signature verification failures detected in last 10 minutes',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      resolved: false,
      severity: 3,
      affectedServices: ['Quantum-Safe Server', 'VC Service']
    }
  ])

  const [realTimeData, setRealTimeData] = useState<RealTimeData[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newDataPoint: RealTimeData = {
        timestamp: new Date(),
        requestsPerSecond: Math.floor(Math.random() * 50) + 140,
        activeConnections: Math.floor(Math.random() * 100) + 300,
        avgResponseTime: Math.floor(Math.random() * 10) + 20,
        errorRate: Math.random() * 0.2
      }
      
      setRealTimeData(prev => {
        const updated = [...prev, newDataPoint]
        return updated.slice(-20) // Keep last 20 data points
      })

      // Update metrics with slight variations
      setMetrics(prev => ({
        ...prev,
        requestsPerSecond: newDataPoint.requestsPerSecond,
        activeConnections: newDataPoint.activeConnections,
        avgResponseTime: newDataPoint.avgResponseTime,
        errorRate: newDataPoint.errorRate
      }))

      setLastUpdated(new Date())
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const refreshDashboard = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
    setLastUpdated(new Date())
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'offline': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getMetricColor = (value: number, type: string) => {
    if (type === 'errorRate' || type === 'responseTime') {
      return value > 50 ? 'text-red-600' : value > 30 ? 'text-yellow-600' : 'text-green-600'
    }
    return value > 90 ? 'text-green-600' : value > 70 ? 'text-yellow-600' : 'text-red-600'
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return AlertTriangle
      case 'warning': return AlertCircle
      case 'info': return Info
      default: return Info
    }
  }

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'critical': return 'destructive'
      case 'warning': return 'warning'
      case 'info': return 'default'
      default: return 'default'
    }
  }

  const exportDashboardData = () => {
    const data = {
      metrics,
      services: SERVICES,
      alerts,
      timestamp: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `atp-dashboard-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ATP Enterprise Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring and management for Agent Trust Protocol
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={exportDashboardData}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDashboard}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-sm text-gray-500 flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Last updated: <HydrationSafe fallback="Loading...">{lastUpdated.toLocaleTimeString()}</HydrationSafe>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAgents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeConnections}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.requestsPerSecond} req/s
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getMetricColor(metrics.avgResponseTime, 'responseTime')}`}>
              {metrics.avgResponseTime}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Target: &lt;25ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.uptime}%</div>
            <p className="text-xs text-muted-foreground">
              SLA: 99.9%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              System Performance
            </CardTitle>
            <CardDescription>Real-time system resource utilization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>CPU Usage</span>
                <span>{metrics.performanceMetrics.cpuUsage}%</span>
              </div>
              <Progress value={metrics.performanceMetrics.cpuUsage} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memory Usage</span>
                <span>{metrics.performanceMetrics.memoryUsage}%</span>
              </div>
              <Progress value={metrics.performanceMetrics.memoryUsage} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Disk Usage</span>
                <span>{metrics.performanceMetrics.diskUsage}%</span>
              </div>
              <Progress value={metrics.performanceMetrics.diskUsage} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Network Throughput</span>
                <span>{metrics.performanceMetrics.networkThroughput}%</span>
              </div>
              <Progress value={metrics.performanceMetrics.networkThroughput} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <ShieldCheck className="h-5 w-5 text-atp-electric-cyan" />
              Compliance Status
            </CardTitle>
            <CardDescription className="text-white/80">Enterprise compliance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-white/80">
                <span>Standard</span>
                <span>Status</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-white font-medium">SOC 2</span>
                  <span className="text-white font-bold">{metrics.complianceMetrics.soc2Compliance}%</span>
                </div>
                <Progress value={metrics.complianceMetrics.soc2Compliance} className="h-2" />
                <p className="text-xs text-white/70">Security, availability, confidentiality</p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-white font-medium">ISO 27001</span>
                  <span className="text-white font-bold">{metrics.complianceMetrics.iso27001Compliance}%</span>
                </div>
                <Progress value={metrics.complianceMetrics.iso27001Compliance} className="h-2" />
                <p className="text-xs text-white/70">Information security management</p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-white font-medium">GDPR</span>
                  <span className="text-white font-bold">{metrics.complianceMetrics.gdprCompliance}%</span>
                </div>
                <Progress value={metrics.complianceMetrics.gdprCompliance} className="h-2" />
                <p className="text-xs text-white/70">EU data protection regulation</p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-white font-medium">HIPAA</span>
                  <span className="text-white font-bold">{metrics.complianceMetrics.hipaaCompliance}%</span>
                </div>
                <Progress value={metrics.complianceMetrics.hipaaCompliance} className="h-2" />
                <p className="text-xs text-white/70">US healthcare data privacy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Status and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Service Status
            </CardTitle>
            <CardDescription>Real-time service health monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {SERVICES.map((service) => (
                <div key={service.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <service.icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">v{service.version}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${getStatusColor(service.status)}`}>
                      {service.status.toUpperCase()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {service.responseTime}ms • {service.uptime}% uptime
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Health: {service.healthScore}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Security Alerts
            </CardTitle>
            <CardDescription>Active security and system alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.filter(alert => !alert.resolved).map((alert) => {
                const Icon = getAlertIcon(alert.type)
                return (
                  <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
                    <Icon className="h-4 w-4" />
                    <AlertTitle>{alert.title}</AlertTitle>
                    <AlertDescription>
                      {alert.description}
                      <div className="text-xs mt-1">
                        <HydrationSafe fallback="Loading...">{alert.timestamp.toLocaleTimeString()}</HydrationSafe> • Severity: {alert.severity}/3
                      </div>
                    </AlertDescription>
                  </Alert>
                )
              })}
              {alerts.filter(alert => !alert.resolved).length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p>All systems operational</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trust Level Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Trust Level Distribution
          </CardTitle>
          <CardDescription>Agent trust level breakdown across the network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(metrics.trustLevelDistribution).map(([level, count]) => (
              <div key={level} className="text-center">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground capitalize">{level}</div>
                <div className="text-xs text-muted-foreground">
                  {((count / metrics.totalAgents) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Tabs */}
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics">Advanced Metrics</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="metrics" className="space-y-4">
          <AdvancedMetrics metrics={metrics} realTimeData={realTimeData} />
        </TabsContent>
        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Analytics</CardTitle>
              <CardDescription>Advanced analytics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>Advanced analytics dashboard coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}