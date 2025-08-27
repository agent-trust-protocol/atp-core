'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, 
  Users, 
  Activity, 
  BarChart3, 
  Settings, 
  Database,
  Server,
  Zap,
  Globe,
  Building,
  CheckCircle,
  TrendingUp,
  Eye,
  Lock,
  Network,
  Cloud
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Subnav } from "@/components/ui/subnav"
import type { Metadata } from 'next'

interface DashboardStats {
  totalTenants: number
  activeTenants: number
  totalRequests: number
  totalBandwidth: number
}

export default function CloudDashboardPage() {
  // Mock data for development
  const stats: DashboardStats = {
    totalTenants: 12,
    activeTenants: 8,
    totalRequests: 45231,
    totalBandwidth: 2.4 * 1024 * 1024 * 1024 // 2.4 GB
  }

  const formatBytes = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024)
    if (gb >= 1) return `${gb.toFixed(1)} GB`
    const mb = bytes / (1024 * 1024)
    if (mb >= 1) return `${mb.toFixed(1)} MB`
    const kb = bytes / 1024
    return `${kb.toFixed(1)} KB`
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
    { label: 'Cloud Dashboard', href: '/cloud' }
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
                <Cloud className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold atp-gradient-text mb-1">
                  ATP™ Cloud Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Multi-tenant Agent Trust Protocol Cloud Platform Management
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building className="w-6 h-6 text-primary" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Tenants</p>
                    <p className="text-2xl font-bold">{stats.totalTenants}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Active Tenants</p>
                    <p className="text-2xl font-bold">{stats.activeTenants}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                    <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                    <p className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                    <Database className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Bandwidth</p>
                    <p className="text-2xl font-bold">{formatBytes(stats.totalBandwidth)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & System Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="glass border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common cloud management tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start h-auto p-4" asChild>
                  <a href="/cloud/tenants/new">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Create New Tenant</div>
                        <div className="text-sm text-muted-foreground">Set up a new ATP Cloud tenant</div>
                      </div>
                    </div>
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start h-auto p-4" asChild>
                  <a href="/cloud/analytics">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                        <BarChart3 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">View Analytics</div>
                        <div className="text-sm text-muted-foreground">Analyze platform usage and performance</div>
                      </div>
                    </div>
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start h-auto p-4" asChild>
                  <a href="/cloud/services">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                        <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Manage Services</div>
                        <div className="text-sm text-muted-foreground">Configure ATP services and health</div>
                      </div>
                    </div>
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="glass border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  System Status
                </CardTitle>
                <CardDescription>
                  Real-time service health monitoring
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>Cloud Gateway</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                    Healthy
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span>Tenant Service</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                    Healthy
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span>Analytics Service</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                    Healthy
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span>Database</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                    Connected
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="glass border mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest platform events and tenant activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">New tenant "Enterprise Corp" created</p>
                    <p className="text-sm text-muted-foreground">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                    <Network className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">High trust score achieved by Agent #4729</p>
                    <p className="text-sm text-muted-foreground">5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/20">
                    <Lock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Quantum-safe keys rotated for Tenant #12</p>
                    <p className="text-sm text-muted-foreground">12 minutes ago</p>
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