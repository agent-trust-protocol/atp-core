'use client'

import { useState } from 'react'
import { 
  Settings, 
  Server, 
  Database, 
  Globe, 
  Activity,
  Play,
  Pause,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  BarChart3,
  Users,
  Cloud
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Subnav } from "@/components/ui/subnav"
import Link from "next/link"

export default function ServicesPage() {
  const [selectedService, setSelectedService] = useState<string | null>(null)
  
  // Mock services data
  const services = [
    {
      id: 'gateway',
      name: 'Cloud Gateway',
      description: 'Main entry point for all ATP Cloud requests',
      status: 'healthy',
      uptime: 99.97,
      version: 'v2.1.4',
      instances: 3,
      lastUpdated: '2024-08-15T10:30:00Z',
      metrics: {
        cpu: 23.5,
        memory: 67.2,
        requests: 15420,
        errors: 12
      },
      icon: Globe
    },
    {
      id: 'tenant-service',
      name: 'Tenant Service',
      description: 'Manages tenant lifecycle and configurations',
      status: 'healthy',
      uptime: 99.95,
      version: 'v1.8.2',
      instances: 2,
      lastUpdated: '2024-08-15T09:15:00Z',
      metrics: {
        cpu: 18.2,
        memory: 45.8,
        requests: 8750,
        errors: 3
      },
      icon: Server
    },
    {
      id: 'analytics',
      name: 'Analytics Service',
      description: 'Processes usage metrics and generates insights',
      status: 'warning',
      uptime: 98.85,
      version: 'v1.5.7',
      instances: 4,
      lastUpdated: '2024-08-15T08:45:00Z',
      metrics: {
        cpu: 45.7,
        memory: 78.3,
        requests: 22300,
        errors: 87
      },
      icon: Activity
    },
    {
      id: 'database',
      name: 'Database Cluster',
      description: 'Primary PostgreSQL cluster for ATP Cloud data',
      status: 'healthy',
      uptime: 99.99,
      version: 'PostgreSQL 15.4',
      instances: 3,
      lastUpdated: '2024-08-15T11:00:00Z',
      metrics: {
        cpu: 34.1,
        memory: 82.5,
        requests: 45200,
        errors: 1
      },
      icon: Database
    },
    {
      id: 'auth-service',
      name: 'Authentication Service',
      description: 'Handles user authentication and authorization',
      status: 'degraded',
      uptime: 97.23,
      version: 'v2.0.1',
      instances: 2,
      lastUpdated: '2024-08-15T07:30:00Z',
      metrics: {
        cpu: 67.4,
        memory: 89.1,
        requests: 12800,
        errors: 156
      },
      icon: CheckCircle
    }
  ]

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'healthy': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
      case 'warning': return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
      case 'degraded': return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
      case 'down': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
      default: return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'healthy': return CheckCircle
      case 'warning': return AlertCircle
      case 'degraded': return Clock
      case 'down': return XCircle
      default: return AlertCircle
    }
  }

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`
  }

  const formatLastUpdated = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`
    }
  }

  const cloudTabs = [
    {
      id: 'overview',
      label: 'Overview',
      href: '/cloud',
      icon: <Cloud className="h-4 w-4" />
    },
    {
      id: 'tenants',
      label: 'Tenants',
      href: '/cloud/tenants',
      icon: <Users className="h-4 w-4" />
    },
    {
      id: 'analytics',
      label: 'Analytics',
      href: '/cloud/analytics',
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      id: 'services',
      label: 'Services',
      href: '/cloud/services',
      icon: <Settings className="h-4 w-4" />
    }
  ]

  const breadcrumbs = [
    { label: 'Cloud Dashboard', href: '/cloud' },
    { label: 'Services', href: '/cloud/services' }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Subnav 
        tabs={cloudTabs} 
        breadcrumbs={breadcrumbs}
        variant="both"
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg glass border">
                <Settings className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold atp-gradient-text mb-1">
                  Service Management
                </h1>
                <p className="text-muted-foreground">
                  Monitor and manage ATP Cloud services and infrastructure
                </p>
              </div>
            </div>
          </div>

          {/* Service Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="glass border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Services</p>
                    <p className="text-2xl font-bold">{services.length}</p>
                  </div>
                  <Server className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Healthy</p>
                    <p className="text-2xl font-bold text-green-600">
                      {services.filter(s => s.status === 'healthy').length}
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Issues</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {services.filter(s => s.status !== 'healthy').length}
                    </p>
                  </div>
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Uptime</p>
                    <p className="text-2xl font-bold">
                      {formatUptime(services.reduce((sum, s) => sum + s.uptime, 0) / services.length)}
                    </p>
                  </div>
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Services List */}
          <Card className="glass border">
            <CardHeader>
              <CardTitle>Services Status</CardTitle>
              <CardDescription>
                Monitor and manage all ATP Cloud services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service) => {
                  const StatusIcon = getStatusIcon(service.status)
                  const ServiceIcon = service.icon
                  
                  return (
                    <div key={service.id} className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <ServiceIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{service.name}</h3>
                              <Badge variant="outline" className={getStatusColor(service.status)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {service.status}
                              </Badge>
                              <Badge variant="outline">
                                v{service.version}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                            <div className="flex items-center gap-6 text-xs text-muted-foreground">
                              <span>Uptime: {formatUptime(service.uptime)}</span>
                              <span>Instances: {service.instances}</span>
                              <span>CPU: {service.metrics.cpu}%</span>
                              <span>Memory: {service.metrics.memory}%</span>
                              <span>Updated: {formatLastUpdated(service.lastUpdated)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Activity className="h-4 w-4 mr-2" />
                            Metrics
                          </Button>
                          <Button variant="outline" size="sm">
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restart
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Service Metrics */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Requests/hour</p>
                            <p className="text-sm font-medium">{service.metrics.requests.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Errors/hour</p>
                            <p className="text-sm font-medium">{service.metrics.errors}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">CPU Usage</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    service.metrics.cpu > 80 ? 'bg-red-500' :
                                    service.metrics.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${service.metrics.cpu}%` }}
                                />
                              </div>
                              <span className="text-xs">{service.metrics.cpu}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Memory Usage</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    service.metrics.memory > 80 ? 'bg-red-500' :
                                    service.metrics.memory > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${service.metrics.memory}%` }}
                                />
                              </div>
                              <span className="text-xs">{service.metrics.memory}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* System Health Summary */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall System Health</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium">Operational</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Response Time</span>
                    <span className="text-sm font-medium">145ms avg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Error Rate</span>
                    <span className="text-sm font-medium">0.12%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Connections</span>
                    <span className="text-sm font-medium">1,247</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Play className="h-4 w-4 mr-2" />
                    Deploy New Version
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restart All Services
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Activity className="h-4 w-4 mr-2" />
                    View System Logs
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Configuration Management
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}