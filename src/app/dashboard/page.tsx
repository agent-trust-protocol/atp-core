'use client'

import { SimpleDemoDashboard } from "@/components/atp/demo-dashboard-simple"
import { Subnav } from "@/components/ui/subnav"
import { Button } from "@/components/ui/button"
import { Activity, Shield, Building2 } from "lucide-react"
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  // Only show basic tabs for demo - hide premium features
  const dashboardTabs = [
    {
      id: 'overview',
      label: 'Overview',
      href: '/dashboard',
      icon: <Activity className="h-4 w-4" />
    },
    {
      id: 'enterprise',
      label: 'Enterprise',
      href: '/enterprise',
      icon: <Building2 className="h-4 w-4" />
    }
  ]

  // Premium features require authentication - hidden from competitors
  // These would be shown only after login:
  // - View Policies (/policies)
  // - Create Policy (/policy-editor)
  // - Test Policies (/policy-testing)
  // - Workflows (/dashboard/workflows)

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Subnav 
        tabs={dashboardTabs} 
        breadcrumbs={breadcrumbs}
        variant="both"
      />
      <div className="container mx-auto px-4 py-8">
        {/* Demo Mode Banner */}
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-900 dark:text-yellow-100">Demo Mode - Synthetic Data</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  You're viewing a demonstration with sample data. Sign in for full access to live features.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push('/login')}>
                Sign In
              </Button>
              <Button size="sm" onClick={() => router.push('/enterprise')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">ATP Dashboard</h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Demo visualization of agent trust metrics and system status.
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Demo updated</div>
              <div className="text-sm font-medium">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-200">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              <span className="font-medium">Compliant</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200">
              <span className="inline-block h-2 w-2 rounded-full bg-yellow-500" />
              <span className="font-medium">Warning</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full border border-red-200">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
              <span className="font-medium">Needs Attention</span>
            </div>
          </div>
        </div>
        {/* Demo Dashboard - replacing live data */}
        <SimpleDemoDashboard />
      </div>
    </div>
  )
}