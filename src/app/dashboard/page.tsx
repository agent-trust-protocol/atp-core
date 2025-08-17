import { LiveAgentDashboard } from "@/components/atp/live-agent-dashboard"
import { LivePolicyDashboard } from "@/components/atp/live-policy-dashboard"
import { EnterpriseDashboard } from "@/components/atp/enterprise-dashboard"
import { EnhancedDashboard } from "@/components/atp/enhanced-dashboard"
import { Subnav } from "@/components/ui/subnav"
import { Activity, Shield, Building2, BarChart3, GitBranch } from "lucide-react"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ATP Dashboard — Agent Trust Protocol',
  description: 'Live status of agents, trust policies, enterprise services, and compliance.'
}

export default function DashboardPage() {
  const dashboardTabs = [
    {
      id: 'overview',
      label: 'Overview',
      href: '/dashboard',
      icon: <Activity className="h-4 w-4" />
    },
    {
      id: 'policies',
      label: 'View Policies',
      href: '/policies',
      icon: <Shield className="h-4 w-4" />
    },
    {
      id: 'policy-editor',
      label: 'Create Policy',
      href: '/policy-editor',
      icon: <Shield className="h-4 w-4" />
    },
    {
      id: 'policy-testing',
      label: 'Test Policies',
      href: '/policy-testing',
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      id: 'workflows',
      label: 'Workflows',
      href: '/dashboard/workflows',
      icon: <GitBranch className="h-4 w-4" />
    },
    {
      id: 'enterprise',
      label: 'Enterprise',
      href: '/enterprise',
      icon: <Building2 className="h-4 w-4" />
    }
  ]

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
        {/* Overview Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">ATP Dashboard</h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Live status of agents, trust policies, enterprise services, and compliance.
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Last updated</div>
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
        <div className="space-y-16">
          <LiveAgentDashboard />
          <LivePolicyDashboard />
          <EnhancedDashboard />
          <EnterpriseDashboard />
        </div>
      </div>
    </div>
  )
}