"use client"

import { useState, useEffect } from "react"
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  Target, 
  BarChart3,
  LineChart,
  PieChart,
  Zap,
  Shield,
  Users,
  Database,
  Globe,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Cpu
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HydrationSafe } from "@/components/ui/hydration-safe"

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

interface RealTimeData {
  timestamp: Date
  requestsPerSecond: number
  activeConnections: number
  avgResponseTime: number
  errorRate: number
}

interface MetricTrend {
  name: string
  current: number
  previous: number
  change: number
  trend: 'up' | 'down' | 'stable'
  icon: any
  color: string
}

interface Props {
  metrics: SystemMetrics
  realTimeData: RealTimeData[]
}

export function AdvancedMetrics({ metrics, realTimeData }: Props) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [isLoading, setIsLoading] = useState(false)

  // Calculate trends based on real-time data
  const calculateTrends = (): MetricTrend[] => {
    if (realTimeData.length < 2) return []

    const current = realTimeData[realTimeData.length - 1]
    const previous = realTimeData[Math.floor(realTimeData.length / 2)]

    return [
      {
        name: 'Requests/sec',
        current: current.requestsPerSecond,
        previous: previous.requestsPerSecond,
        change: ((current.requestsPerSecond - previous.requestsPerSecond) / previous.requestsPerSecond) * 100,
        trend: current.requestsPerSecond > previous.requestsPerSecond ? 'up' : current.requestsPerSecond < previous.requestsPerSecond ? 'down' : 'stable',
        icon: Activity,
        color: 'text-blue-600'
      },
      {
        name: 'Response Time',
        current: current.avgResponseTime,
        previous: previous.avgResponseTime,
        change: ((current.avgResponseTime - previous.avgResponseTime) / previous.avgResponseTime) * 100,
        trend: current.avgResponseTime < previous.avgResponseTime ? 'up' : current.avgResponseTime > previous.avgResponseTime ? 'down' : 'stable',
        icon: Clock,
        color: 'text-green-600'
      },
      {
        name: 'Error Rate',
        current: current.errorRate,
        previous: previous.errorRate,
        change: ((current.errorRate - previous.errorRate) / previous.errorRate) * 100,
        trend: current.errorRate < previous.errorRate ? 'up' : current.errorRate > previous.errorRate ? 'down' : 'stable',
        icon: AlertTriangle,
        color: 'text-red-600'
      },
      {
        name: 'Active Connections',
        current: current.activeConnections,
        previous: previous.activeConnections,
        change: ((current.activeConnections - previous.activeConnections) / previous.activeConnections) * 100,
        trend: current.activeConnections > previous.activeConnections ? 'up' : current.activeConnections < previous.activeConnections ? 'down' : 'stable',
        icon: Users,
        color: 'text-atp-electric-cyan'
      }
    ]
  }

  const trends = calculateTrends()

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="h-4 w-4 text-green-600" />
      case 'down': return <ArrowDownRight className="h-4 w-4 text-red-600" />
      case 'stable': return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable', metric: string) => {
    if (metric === 'Response Time' || metric === 'Error Rate') {
      return trend === 'down' ? 'text-green-600' : trend === 'up' ? 'text-red-600' : 'text-gray-600'
    }
    return trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
  }

  const generateChartData = () => {
    return realTimeData.map((data, index) => ({
      time: data.timestamp.toLocaleTimeString(),
      requests: data.requestsPerSecond,
      responseTime: data.avgResponseTime,
      connections: data.activeConnections,
      errors: data.errorRate * 100
    }))
  }

  const chartData = generateChartData()

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Advanced Metrics</h3>
        <div className="flex items-center gap-2">
          <Tabs value={selectedTimeframe} onValueChange={(value) => setSelectedTimeframe(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="1h">1H</TabsTrigger>
              <TabsTrigger value="24h">24H</TabsTrigger>
              <TabsTrigger value="7d">7D</TabsTrigger>
              <TabsTrigger value="30d">30D</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Trend Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {trends.map((trend) => {
          const Icon = trend.icon
          return (
            <Card key={trend.name} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Icon className={`h-5 w-5 ${trend.color}`} />
                  {getTrendIcon(trend.trend)}
                </div>
                <CardTitle className="text-sm font-medium">{trend.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trend.current.toFixed(1)}</div>
                <div className={`text-sm ${getTrendColor(trend.trend, trend.name)}`}>
                  {trend.change > 0 ? '+' : ''}{trend.change.toFixed(1)}% from previous
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Response Time Trend
            </CardTitle>
            <CardDescription>Average response time over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{metrics.avgResponseTime}ms</div>
                  <div className="text-sm text-muted-foreground">Current average</div>
                </div>
                <Badge variant={metrics.avgResponseTime < 25 ? 'default' : 'destructive'}>
                  {metrics.avgResponseTime < 25 ? 'Optimal' : 'High'}
                </Badge>
              </div>
              <div className="h-32 bg-gray-50 rounded-lg flex items-end justify-between p-4">
                {chartData.slice(-10).map((data, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="bg-blue-500 rounded-t w-4"
                      style={{ height: `${(data.responseTime / 50) * 100}%` }}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      <HydrationSafe fallback="--">
                        {data.time.split(':').slice(0, 2).join(':')}
                      </HydrationSafe>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Request Volume
            </CardTitle>
            <CardDescription>Requests per second over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{metrics.requestsPerSecond}</div>
                  <div className="text-sm text-muted-foreground">Current RPS</div>
                </div>
                <Badge variant="default">
                  {metrics.requestsPerSecond > 150 ? 'High Load' : 'Normal'}
                </Badge>
              </div>
              <div className="h-32 bg-gray-50 rounded-lg flex items-end justify-between p-4">
                {chartData.slice(-10).map((data, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="bg-green-500 rounded-t w-4"
                      style={{ height: `${(data.requests / 200) * 100}%` }}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      <HydrationSafe fallback="--">
                        {data.time.split(':').slice(0, 2).join(':')}
                      </HydrationSafe>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Health Overview
          </CardTitle>
          <CardDescription>Comprehensive system health indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CPU Usage</span>
                <span className="text-sm text-muted-foreground">{metrics.performanceMetrics.cpuUsage}%</span>
              </div>
              <Progress value={metrics.performanceMetrics.cpuUsage} className="h-2" />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Cpu className="h-3 w-3" />
                {metrics.performanceMetrics.cpuUsage > 80 ? 'High' : metrics.performanceMetrics.cpuUsage > 60 ? 'Moderate' : 'Low'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Memory Usage</span>
                <span className="text-sm text-muted-foreground">{metrics.performanceMetrics.memoryUsage}%</span>
              </div>
              <Progress value={metrics.performanceMetrics.memoryUsage} className="h-2" />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Database className="h-3 w-3" />
                {metrics.performanceMetrics.memoryUsage > 80 ? 'High' : metrics.performanceMetrics.memoryUsage > 60 ? 'Moderate' : 'Low'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Network</span>
                <span className="text-sm text-muted-foreground">{metrics.performanceMetrics.networkThroughput}%</span>
              </div>
              <Progress value={metrics.performanceMetrics.networkThroughput} className="h-2" />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                {metrics.performanceMetrics.networkThroughput > 80 ? 'High' : metrics.performanceMetrics.networkThroughput > 60 ? 'Moderate' : 'Low'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Error Rate</span>
                <span className="text-sm text-muted-foreground">{(metrics.errorRate * 100).toFixed(2)}%</span>
              </div>
              <Progress value={metrics.errorRate * 100} className="h-2" />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3" />
                {metrics.errorRate > 0.5 ? 'High' : metrics.errorRate > 0.1 ? 'Moderate' : 'Low'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust Level Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Trust Level Analytics
          </CardTitle>
          <CardDescription>Detailed breakdown of agent trust levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {Object.entries(metrics.trustLevelDistribution).map(([level, count]) => {
                const percentage = ((count / metrics.totalAgents) * 100).toFixed(1)
                const getLevelColor = (level: string) => {
                  switch (level) {
                    case 'enterprise': return 'bg-purple-500'
                    case 'premium': return 'bg-blue-500'
                    case 'verified': return 'bg-green-500'
                    case 'basic': return 'bg-yellow-500'
                    case 'untrusted': return 'bg-red-500'
                    default: return 'bg-gray-500'
                  }
                }
                return (
                  <div key={level} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getLevelColor(level)}`} />
                      <span className="text-sm font-medium capitalize">{level}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{count}</div>
                      <div className="text-xs text-muted-foreground">{percentage}%</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 32 32">
                  {Object.entries(metrics.trustLevelDistribution).map(([level, count], index) => {
                    const percentage = (count / metrics.totalAgents) * 100
                    const circumference = 2 * Math.PI * 14
                    const strokeDasharray = (percentage / 100) * circumference
                    const strokeDashoffset = circumference - strokeDasharray
                    const getLevelColor = (level: string) => {
                      switch (level) {
                        case 'enterprise': return '#8b5cf6'
                        case 'premium': return '#3b82f6'
                        case 'verified': return '#10b981'
                        case 'basic': return '#f59e0b'
                        case 'untrusted': return '#ef4444'
                        default: return '#6b7280'
                      }
                    }
                    return (
                      <circle
                        key={level}
                        cx="16"
                        cy="16"
                        r="14"
                        stroke={getLevelColor(level)}
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        style={{
                          transformOrigin: 'center',
                          transform: `rotate(${index * 72}deg)`
                        }}
                      />
                    )
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold">{metrics.totalAgents}</div>
                    <div className="text-xs text-muted-foreground">Total Agents</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Status */}
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white text-foreground">
            <CheckCircle className="h-5 w-5 text-atp-electric-cyan" />
            Compliance Status
          </CardTitle>
          <CardDescription className="dark:text-white/80 text-muted-foreground">Enterprise compliance metrics and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(metrics.complianceMetrics).map(([compliance, score]) => (
              <div key={compliance} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium dark:text-white text-foreground">{compliance.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                  <Badge 
                    variant={score > 95 ? 'default' : score > 90 ? 'secondary' : 'destructive'}
                    className={score > 95 ? 'bg-green-500 text-white' : score > 90 ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'}
                  >
                    {score}%
                  </Badge>
                </div>
                <Progress 
                  value={score} 
                  className="h-2" 
                  style={{
                    '--progress-background': score > 95 ? 'hsl(142, 76%, 36%)' : score > 90 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 84%, 60%)'
                  } as React.CSSProperties}
                />
                <div className="flex items-center gap-1 text-xs">
                  {score > 95 ? (
                    <>
                      <CheckCircle className="h-3 w-3 dark:text-green-400 text-green-700" />
                      <span className="dark:text-green-400 text-green-700 font-medium">Compliant</span>
                    </>
                  ) : score > 90 ? (
                    <>
                      <AlertTriangle className="h-3 w-3 dark:text-yellow-400 text-yellow-700" />
                      <span className="dark:text-yellow-400 text-yellow-700 font-medium">Warning</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3 dark:text-red-400 text-red-700" />
                      <span className="dark:text-red-400 text-red-700 font-medium">Non-compliant</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}