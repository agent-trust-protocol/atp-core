"use client"

import { WorkflowExecutionHistory } from '@/components/atp/WorkflowExecutionHistory';
import { Subnav } from "@/components/ui/subnav"
import { Activity, Shield, Building2, BarChart3, GitBranch } from "lucide-react"
import type { Metadata } from 'next'

export default function WorkflowExecutionsPage() {
  const dashboardTabs = [
    {
      id: 'overview',
      label: 'Overview',
      href: '/dashboard',
      icon: <Activity className="h-4 w-4" />
    },
    {
      id: 'policies',
      label: 'Policies',
      href: '/policies',
      icon: <Shield className="h-4 w-4" />
    },
    {
      id: 'policy-editor',
      label: 'Policy Editor',
      href: '/policy-editor',
      icon: <Shield className="h-4 w-4" />
    },
    {
      id: 'policy-testing',
      label: 'Policy Testing',
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
    { label: 'Workflows', href: '/dashboard/workflows' },
    { label: 'Execution History', href: '/dashboard/workflows/executions' }
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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            Workflow Execution History
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and analyze workflow execution performance and results
          </p>
        </div>
        
        <WorkflowExecutionHistory />
      </div>
    </div>
  );
}