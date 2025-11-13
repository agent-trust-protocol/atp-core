"use client"

import { WorkflowDashboard } from '@/components/atp/WorkflowDashboard';
import { Subnav } from "@/components/ui/subnav"
import { Activity, Shield, Building2, BarChart3, GitBranch } from "lucide-react"
import type { Metadata } from 'next'

export default function WorkflowsPage() {
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
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Workflows', href: '/dashboard/workflows' }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Subnav 
        tabs={dashboardTabs} 
        breadcrumbs={breadcrumbs}
        variant="both"
      />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Workflow Automation</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor automated workflows for your ATP system
          </p>
        </div>
        
        <WorkflowDashboard />
      </div>
    </div>
  );
}