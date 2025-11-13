'use client'

import { useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Users, 
  Globe,
  Clock,
  Download,
  Filter,
  Calendar,
  Cloud
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Subnav } from "@/components/ui/subnav"
import Link from "next/link"

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d')
  
  // Mock analytics data
  const analytics = {
    overview: {
      totalRequests: 245680,
      requestGrowth: 12.5,
      avgResponseTime: 145,
      responseTimeChange: -8.2,
      activeTenants: 24,
      tenantGrowth: 15.8,
      uptime: 99.97
    },
    hourlyData: [
      { hour: '00:00', requests: 1200, responseTime: 120 },
      { hour: '06:00', requests: 2400, responseTime: 135 },
      { hour: '12:00', requests: 4800, responseTime: 180 },
      { hour: '18:00', requests: 3600, responseTime: 160 },
      { hour: '24:00', requests: 1800, responseTime: 125 }
    ],
    topTenants: [
      { name: 'Enterprise Corp', requests: 45231, growth: 8.2 },
      { name: 'Tech Solutions Inc', requests: 32140, growth: 15.7 },
      { name: 'Global Systems Ltd', requests: 28960, growth: -2.1 },
      { name: 'Innovation Hub', requests: 19847, growth: 22.4 },
      { name: 'Digital Dynamics', requests: 16503, growth: 5.9 }
    ]
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
      icon: <Activity className="h-4 w-4" />
    }
  ]

  const breadcrumbs = [
    { label: 'Cloud Dashboard', href: '/cloud' },
    { label: 'Analytics', href: '/cloud/analytics' }
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
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold atp-gradient-text mb-1">
                  Analytics Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Platform usage insights and performance metrics
                </p>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <select 
                  value={timeRange} 
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="bg-background border border-border rounded-md px-3 py-1 text-sm"
                >
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                    <p className="text-2xl font-bold">{analytics.overview.totalRequests.toLocaleString()}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-xs text-green-500">+{analytics.overview.requestGrowth}%</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                    <p className="text-2xl font-bold">{analytics.overview.avgResponseTime}ms</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1 rotate-180" />
                      <span className="text-xs text-green-500">{analytics.overview.responseTimeChange}%</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                    <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Tenants</p>
                    <p className="text-2xl font-bold">{analytics.overview.activeTenants}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-xs text-green-500">+{analytics.overview.tenantGrowth}%</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                    <p className="text-2xl font-bold">{analytics.overview.uptime}%</p>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-green-500">Excellent</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                    <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Request Volume Chart */}
            <Card className="glass border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Request Volume
                </CardTitle>
                <CardDescription>
                  Hourly request patterns over the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.hourlyData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground w-16">{data.hour}</span>
                      <div className="flex-1 mx-4">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${(data.requests / 5000) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium w-16 text-right">
                        {data.requests.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Tenants */}
            <Card className="glass border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Top Tenants
                </CardTitle>
                <CardDescription>
                  Highest usage tenants by request volume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topTenants.map((tenant, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{tenant.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {tenant.requests.toLocaleString()} requests
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`flex items-center ${tenant.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          <TrendingUp className={`h-3 w-3 mr-1 ${tenant.growth < 0 ? 'rotate-180' : ''}`} />
                          <span className="text-xs">{Math.abs(tenant.growth)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card className="glass border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Performance Metrics
              </CardTitle>
              <CardDescription>
                Detailed system performance analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Average Response Time</p>
                  <p className="text-xl font-bold">{analytics.overview.avgResponseTime}ms</p>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full w-3/4" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-xl font-bold">99.2%</p>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full w-11/12" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Error Rate</p>
                  <p className="text-xl font-bold">0.8%</p>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full w-1/12" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}