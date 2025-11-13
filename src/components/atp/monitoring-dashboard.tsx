"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Activity, Shield, AlertTriangle, CheckCircle, Clock, Database, Server, Users, Zap, TrendingUp } from 'lucide-react'
import { AnimatedIcon } from '@/components/ui/animated-icon'
import { usePerformance, useCachedFetch } from '@/hooks/use-performance'

interface AuditEvent {
  id: string
  timestamp: string
  source: string
  action: string
  resource: string
  actor?: string
  details?: Record<string, any>
  hash: string
  ipfs_hash?: string
}

interface MonitoringMetrics {
  timestamp: string
  services: Array<{
    name: string
    status: 'online' | 'degraded' | 'offline'
    uptime: number
    lastCheck: string
    responseTime: number
    version?: string
    url: string
  }>
  performance: {
    activeConnections: number
    signaturesGenerated: number
    avgResponseTime: number
    requestsPerSecond: number
    errorRate: number
    memoryUsage: number
    cpuUsage: number
  }
  security: {
    trustTransactions: number
    failedAuthentications: number
    compromisedAgents: number
    quantumThreats: number
  }
  business: {
    registeredAgents: number
    activeAgents: number
    credentialsIssued: number
    auditEvents: number
  }
}

export function MonitoringDashboard() {
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([])
  const [monitoringData, setMonitoringData] = useState<MonitoringMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h')
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  const { metrics, cacheSize, refreshMetrics, clearCache } = usePerformance()
  const { fetch: cachedFetchHook } = useCachedFetch<any>()

  const fetchAuditData = useCallback(async () => {
    try {
      const auditUrl = process.env.NEXT_PUBLIC_ATP_AUDIT_URL || 'http://localhost:3006'
      let query = `${auditUrl}/audit/events?`
      if (selectedTimeRange !== 'all') {
        const hours = selectedTimeRange === '1h' ? 1 : selectedTimeRange === '24h' ? 24 : 168
        const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
        query += `since=${since}&`
      }
      if (selectedSeverity !== 'all') {
        query += `severity=${selectedSeverity}&`
      }
      query += 'limit=100'

      const response = await fetch(query)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAuditEvents(data.events || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch audit data:', error)
      setAuditEvents([])
    }
  }, [selectedTimeRange, selectedSeverity])

  const fetchMonitoringData = useCallback(async () => {
    try {
      const response = await fetch('/api/monitoring?endpoint=metrics')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setMonitoringData(data.data)
        }
      } else {
        console.warn('Monitoring service unavailable, data may be limited')
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAuditData()
    fetchMonitoringData()
    let interval: ReturnType<typeof setInterval> | undefined
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchAuditData()
        fetchMonitoringData()
      }, 10000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, fetchAuditData, fetchMonitoringData])

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'policy_evaluation': return 'bg-blue-500 text-white'
      case 'identity-service': return 'bg-green-500 text-white'
      case 'example-agent': return 'bg-purple-500 text-white'
      case 'test-service': return 'bg-yellow-500 text-black'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'policy_evaluation': return Shield
      case 'identity-service': return Users
      case 'example-agent': return Activity
      case 'test-service': return AlertTriangle
      default: return Activity
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <AnimatedIcon icon={Activity} size={24} animate="spin" />
            <span>Loading monitoring data...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold atp-gradient-text">System Monitoring</h1>
          <p className="text-muted-foreground">Real-time audit logs and system metrics</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-1" />
            Auto Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={clearCache}
          >
            <Zap className="h-4 w-4 mr-1" />
            Clear Cache
          </Button>
        </div>
      </div>

      {/* System Metrics */}
      {monitoringData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monitoringData.business.activeAgents.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {monitoringData.business.registeredAgents} total registered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monitoringData.performance.avgResponseTime}ms</div>
              <p className="text-xs text-muted-foreground">
                {monitoringData.performance.requestsPerSecond} req/s
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Events</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{monitoringData.security.trustTransactions}</div>
              <p className="text-xs text-muted-foreground">
                {monitoringData.security.failedAuthentications} failed auths
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Service Health</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {(() => {
                  const onlineServices = monitoringData.services.filter(s => s.status === 'online').length
                  const totalServices = monitoringData.services.length
                  const isHealthy = onlineServices >= totalServices * 0.8 // 80% healthy threshold
                  return (
                    <>
                      <CheckCircle className={`h-5 w-5 ${isHealthy ? 'text-green-500' : 'text-orange-500'}`} />
                      <span className="text-sm font-medium">
                        {onlineServices}/{totalServices} Online
                      </span>
                    </>
                  )
                })()}
              </div>
              <p className="text-xs text-muted-foreground">
                CPU: {monitoringData.performance.cpuUsage.toFixed(1)}%, RAM: {monitoringData.performance.memoryUsage}MB
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Service Status */}
      {monitoringData && monitoringData.services && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AnimatedIcon icon={Server} size={20} animate="pulse" />
              Service Status
            </CardTitle>
            <CardDescription>
              Real-time health monitoring of ATP services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monitoringData.services.map((service) => (
                <div key={service.name} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      service.status === 'online' ? 'bg-green-500' : 
                      service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <div className="font-medium">{service.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {service.url.replace('http://localhost:', ':')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium capitalize">{service.status}</div>
                    <div className="text-xs text-muted-foreground">
                      {service.responseTime}ms • {service.uptime}% uptime
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AnimatedIcon icon={TrendingUp} size={20} animate="bounce" />
            Frontend Performance
          </CardTitle>
          <CardDescription>
            Client-side caching and request metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <Zap className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-lg font-bold">{metrics.cache.hitRate.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Cache Hit Rate</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <Database className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-lg font-bold">{cacheSize}</div>
                <div className="text-xs text-muted-foreground">Cached Entries</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <Clock className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-lg font-bold">
                  {Object.values(metrics.endpoints).length > 0 
                    ? Object.values(metrics.endpoints)
                        .reduce((sum, endpoint) => sum + endpoint.avgResponseTime, 0) / Object.values(metrics.endpoints).length
                    : 0
                  } ms
                </div>
                <div className="text-xs text-muted-foreground">Avg Response Time</div>
              </div>
            </div>
          </div>
          
          {Object.keys(metrics.endpoints).length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Endpoint Performance</h4>
              <div className="space-y-2">
                {Object.entries(metrics.endpoints).map(([endpoint, data]) => (
                  <div key={endpoint} className="flex justify-between items-center text-xs">
                    <span className="truncate max-w-[200px]">{endpoint}</span>
                    <div className="flex gap-4 text-muted-foreground">
                      <span>{data.requestCount} reqs</span>
                      <span>{data.avgResponseTime.toFixed(0)}ms</span>
                      <span className={data.errorRate > 5 ? 'text-red-500' : ''}>
                        {data.errorRate.toFixed(1)}% errors
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AnimatedIcon icon={Activity} size={20} animate="pulse" />
            Recent Audit Events
          </CardTitle>
          <CardDescription>
            Real-time audit trail with IPFS integrity verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditEvents.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No audit events found for the selected filters
            </div>
          ) : (
            <div className="space-y-3">
              {auditEvents.map((event) => {
                const SourceIcon = getSourceIcon(event.source)
                
                return (
                  <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                    <div className="flex-shrink-0 mt-0.5">
                      <SourceIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {event.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <Badge className={`text-xs ${getSourceColor(event.source)}`}>
                          {event.source.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>{formatTimestamp(event.timestamp)}</div>
                        {event.actor && (
                          <div>Actor: <code className="text-xs bg-muted px-1 rounded">{event.actor.length > 25 ? event.actor.substring(0, 25) + '...' : event.actor}</code></div>
                        )}
                        {event.resource && (
                          <div>Resource: <code className="text-xs bg-muted px-1 rounded">{event.resource}</code></div>
                        )}
                        {event.hash && (
                          <div>Hash: <code className="text-xs bg-muted px-1 rounded">{event.hash.substring(0, 12)}...</code></div>
                        )}
                        {event.details && Object.keys(event.details).length > 0 && (
                          <div>Details: <code className="text-xs bg-muted px-1 rounded">{JSON.stringify(event.details).substring(0, 50)}...</code></div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}