import { VisualPolicyEditor } from "@/components/atp/visual-policy-editor"
import { Subnav } from "@/components/ui/subnav"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Visual Policy Editor — Agent Trust Protocol',
  description: 'Create and edit trust policies with a visual, no-code editor.'
}
import { Shield, Edit3, Play, BarChart3 } from "lucide-react"

export default function PolicyEditorPage() {
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
    { label: 'Policy Management', href: '/policies' },
    { label: 'Policy Editor' }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Subnav 
        tabs={policyTabs} 
        breadcrumbs={breadcrumbs}
        variant="both"
      />
      {/* Add bottom padding so the footer doesn't overlap the canvas */}
      <div className="pb-40">
        <VisualPolicyEditor />
      </div>
    </div>
  )
} 