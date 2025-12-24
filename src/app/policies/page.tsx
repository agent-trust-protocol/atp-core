'use client';

import { RequireAuth } from "@/components/auth/RequireAuth"
import { PolicyManagement } from "@/components/atp/policy-management"
import { Subnav } from "@/components/ui/subnav"
import { Shield, Edit3, Play, BarChart3 } from "lucide-react"

export default function PoliciesPage() {
  const policyTabs = [
    {
      id: 'policies',
      label: 'Policy Management',
      href: '/policies',
      icon: <Shield className="h-4 w-4" />
    },
    {
      id: 'policy-editor',
      label: 'Policy Editor',
      href: '/policy-editor',
      icon: <Edit3 className="h-4 w-4" />
    },
    {
      id: 'policy-testing',
      label: 'Policy Testing',
      href: '/policy-testing',
      icon: <Play className="h-4 w-4" />
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: <BarChart3 className="h-4 w-4" />
    }
  ]

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Policy Management' }
  ]

  return (
    <RequireAuth tier="startup" feature="policy-management">
      <div className="min-h-screen bg-background">
      <Subnav
        tabs={policyTabs}
        breadcrumbs={breadcrumbs}
        variant="both"
      />
      <div className="container mx-auto px-4 py-8">
        <PolicyManagement />
      </div>
    </div>
    </RequireAuth>
  )
}
