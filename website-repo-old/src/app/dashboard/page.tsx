import { EnterpriseDashboard } from "@/components/atp/enterprise-dashboard"
import { EnhancedDashboard } from "@/components/atp/enhanced-dashboard"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <EnhancedDashboard />
        <div className="mt-8">
          <EnterpriseDashboard />
        </div>
      </div>
    </div>
  )
}