"use client"

import { useState, useEffect } from "react"
import { BarChart3, RefreshCw, Activity, Database, Zap, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TimeDisplay } from "@/components/ui/hydration-safe"

interface Metrics {
  activeConnections: number
  signaturesGenerated: number
  avgResponseTime: number
  uptime: number
  requestsPerSecond: number
  errorRate: number
}

const STATUS_INDICATORS = [
  { name: 'ATP Server', status: 'online', icon: Activity },
  { name: 'Database', status: 'online', icon: Database },
  { name: 'Quantum Engine', status: 'online', icon: Zap },
] as const

export function MonitoringDemo() {
  const [metrics, setMetrics] = useState<Metrics>({
    activeConnections: 42,
    signaturesGenerated: 1247,
    avgResponseTime: 23,
    uptime: 99.9,
    requestsPerSecond: 156,
    errorRate: 0.1
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Initialize timestamp on client-side only
  useEffect(() => {
    setLastUpdated(new Date())
  }, [])

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        activeConnections: prev.activeConnections + Math.floor(Math.random() * 10 - 5),
        signaturesGenerated: prev.signaturesGenerated + Math.floor(Math.random() * 5),
        avgResponseTime: Math.max(15, prev.avgResponseTime + Math.floor(Math.random() * 10 - 5)),
        requestsPerSecond: Math.max(100, prev.requestsPerSecond + Math.floor(Math.random() * 20 - 10)),
        errorRate: Math.max(0, Math.min(1, prev.errorRate + (Math.random() * 0.2 - 0.1)))
      }))
      setLastUpdated(new Date())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const refreshMetrics = async () => {
    setIsRefreshing(true)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMetrics({
        activeConnections: 35 + Math.floor(Math.random() * 20),
        signaturesGenerated: 1200 + Math.floor(Math.random() * 100),
        avgResponseTime: 20 + Math.floor(Math.random() * 15),
        uptime: 99.5 + Math.random() * 0.4,
        requestsPerSecond: 140 + Math.floor(Math.random() * 40),
        errorRate: Math.random() * 0.3
      })
      setLastUpdated(new Date())
    } finally {
      setIsRefreshing(false)
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'online' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
  }

  const getMetricColor = (value: number, type: string) => {
    switch (type) {
      case 'uptime':
        return value > 99 ? 'text-green-600' : value > 95 ? 'text-yellow-600' : 'text-red-600'
      case 'responseTime':
        return value < 30 ? 'text-green-600' : value < 50 ? 'text-yellow-600' : 'text-red-600'
      case 'errorRate':
        return value < 0.5 ? 'text-green-600' : value < 1 ? 'text-yellow-600' : 'text-red-600'
      default:
        return 'text-blue-600'
    }
  }

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg atp-gradient">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          Real-time Monitoring
        </CardTitle>
        <CardDescription>
          Live system metrics and performance monitoring
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">System Status</h4>
            <div className="text-xs text-gray-500">
              Last updated: <TimeDisplay format="time" />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {STATUS_INDICATORS.map((indicator) => {
              const IconComponent = indicator.icon
              return (
                <Badge
                  key={indicator.name}
                  className={`${getStatusColor(indicator.status)} flex items-center gap-1`}
                >
                  <IconComponent className="h-3 w-3" />
                  {indicator.name}
                </Badge>
              )
            })}
          </div>
          
          <Button 
            onClick={refreshMetrics}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? "Refreshing..." : "Refresh Metrics"}
          </Button>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium">Performance Metrics</h4>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gray-50 text-center hover:bg-gray-100 transition-colors">
              <div className={`text-2xl font-bold ${getMetricColor(metrics.activeConnections, 'connections')}`}>
                {metrics.activeConnections}
              </div>
              <div className="text-sm text-gray-600 mt-1">Active Connections</div>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-50 text-center hover:bg-gray-100 transition-colors">
              <div className={`text-2xl font-bold ${getMetricColor(metrics.signaturesGenerated, 'signatures')}`} suppressHydrationWarning>
                {metrics.signaturesGenerated.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 mt-1">Signatures Generated</div>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-50 text-center hover:bg-gray-100 transition-colors">
              <div className={`text-2xl font-bold ${getMetricColor(metrics.avgResponseTime, 'responseTime')}`}>
                {metrics.avgResponseTime}ms
              </div>
              <div className="text-sm text-gray-600 mt-1">Avg Response Time</div>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-50 text-center hover:bg-gray-100 transition-colors">
              <div className={`text-2xl font-bold ${getMetricColor(metrics.uptime, 'uptime')}`}>
                {metrics.uptime.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Uptime</div>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-50 text-center hover:bg-gray-100 transition-colors">
              <div className={`text-2xl font-bold ${getMetricColor(metrics.requestsPerSecond, 'rps')}`}>
                {metrics.requestsPerSecond}
              </div>
              <div className="text-sm text-gray-600 mt-1">Requests/sec</div>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-50 text-center hover:bg-gray-100 transition-colors">
              <div className={`text-2xl font-bold ${getMetricColor(metrics.errorRate, 'errorRate')}`}>
                {metrics.errorRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Error Rate</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium">System Health</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border border-green-200 bg-green-50">
              <div className="flex items-center gap-2 text-green-800">
                <Activity className="h-4 w-4" />
                <span className="font-medium">System Status</span>
              </div>
              <div className="text-sm text-green-700 mt-1">All systems operational</div>
            </div>
            
            <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
              <div className="flex items-center gap-2 text-blue-800">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Next Maintenance</span>
              </div>
              <div className="text-sm text-blue-700 mt-1">Scheduled in 7 days</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}