'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Shield, Users, Lock, TrendingUp, AlertCircle, CheckCircle2, Clock, ArrowRight } from "lucide-react"
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

// Synthetic demo data - not real API calls
const generateDemoData = () => {
  const now = Date.now()
  return {
    agents: {
      total: 147,
      active: 134,
      inactive: 13,
      trend: Array.from({ length: 24 }, (_, i) => ({
        time: new Date(now - (23 - i) * 3600000).toLocaleTimeString('en-US', { hour: '2-digit' }),
        count: Math.floor(120 + Math.random() * 30)
      }))
    },
    trust: {
      verified: 89,
      basic: 45,
      none: 13,
      distribution: [
        { name: 'Verified', value: 89, color: '#10b981' },
        { name: 'Basic', value: 45, color: '#3b82f6' },
        { name: 'None', value: 13, color: '#ef4444' }
      ]
    },
    policies: {
      active: 23,
      evaluations: 1847,
      granted: 1698,
      denied: 149,
      recent: [
        { id: 'POL-001', name: 'Data Access Policy', status: 'active', evaluations: 423 },
        { id: 'POL-002', name: 'API Rate Limiting', status: 'active', evaluations: 387 },
        { id: 'POL-003', name: 'Agent Communication', status: 'active', evaluations: 298 }
      ]
    },
    performance: {
      responseTime: 23,
      uptime: 99.97,
      throughput: 4327,
      latency: Array.from({ length: 20 }, (_, i) => ({
        time: `${i * 3}m`,
        value: 20 + Math.random() * 10
      }))
    },
    compliance: {
      score: 94,
      passed: 47,
      failed: 3,
      frameworks: ['SOC 2', 'HIPAA', 'GDPR'],
      lastAudit: '2 hours ago'
    },
    alerts: [
      { type: 'warning', message: 'High API usage detected on Agent-7B3F', time: '5 mins ago' },
      { type: 'info', message: 'Policy POL-004 updated successfully', time: '12 mins ago' },
      { type: 'success', message: 'All systems operational', time: '1 hour ago' }
    ]
  }
}

export function DemoDashboard() {
  const [data, setData] = useState(generateDemoData())
  const [isLive, setIsLive] = useState(true)

  useEffect(() => {
    if (!isLive) return
    
    const interval = setInterval(() => {
      setData(generateDemoData())
    }, 5000)

    return () => clearInterval(interval)
  }, [isLive])

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      <Card className="border-yellow-500/50 bg-yellow-500/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium">Demo Mode Active</p>
                <p className="text-sm text-muted-foreground">
                  Showing synthetic data for demonstration purposes
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/contact">
                Request Live Demo <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.agents.active}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">↑ 12%</span> from last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trust Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((data.trust.verified / data.agents.total) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Verified agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.performance.responseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">✓</span> Below 25ms target
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.compliance.score}%</div>
            <p className="text-xs text-muted-foreground">
              {data.compliance.passed} passed, {data.compliance.failed} failed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Agent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Activity</CardTitle>
            <CardDescription>Active agents over last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.agents.trend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="time" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trust Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Trust Distribution</CardTitle>
            <CardDescription>Agent trust levels</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data.trust.distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.trust.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex justify-center gap-4">
              {data.trust.distribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full`} style={{ backgroundColor: item.color }} />
                  <span className="text-xs">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Latency Trend</CardTitle>
            <CardDescription>Response time (ms)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.performance.latency}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="time" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Policy Activity & Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Policies */}
        <Card>
          <CardHeader>
            <CardTitle>Active Policies</CardTitle>
            <CardDescription>Most evaluated policies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.policies.recent.map((policy) => (
                <div key={policy.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{policy.name}</p>
                      <p className="text-xs text-muted-foreground">{policy.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {policy.evaluations} evals
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>Recent activity and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.alerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-3">
                  {alert.type === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />}
                  {alert.type === 'info' && <Activity className="h-4 w-4 text-blue-500 mt-0.5" />}
                  {alert.type === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
          <CardDescription>Framework compliance and audit status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {data.compliance.frameworks.map((framework) => (
                <div key={framework} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">{framework}</span>
                </div>
              ))}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Last audit</p>
              <p className="text-sm font-medium">{data.compliance.lastAudit}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}