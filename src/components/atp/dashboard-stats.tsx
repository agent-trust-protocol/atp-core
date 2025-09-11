"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Shield, 
  Users, 
  Activity, 
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Info
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  icon: React.ElementType
  iconColor?: string
  progress?: number
  loading?: boolean
}

export function StatCard({ 
  title, 
  value, 
  description, 
  trend, 
  icon: Icon, 
  iconColor = "text-primary",
  progress,
  loading = false 
}: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-[150px] mb-2" />
          <Skeleton className="h-3 w-[200px]" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("p-2 rounded-full bg-secondary", iconColor)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className={cn(
                    "flex items-center gap-1 text-sm",
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  )}>
                    {trend.isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {Math.abs(trend.value)}%
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Compared to last period</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
        {progress !== undefined && (
          <Progress value={progress} className="mt-3 h-2" />
        )}
      </CardContent>
    </Card>
  )
}

export function DashboardStats() {
  const stats = [
    {
      title: "Total Agents",
      value: "2,847",
      description: "Active agents in network",
      trend: { value: 12.5, isPositive: true },
      icon: Users,
      iconColor: "text-blue-600",
      progress: 75
    },
    {
      title: "Trust Score",
      value: "94.2%",
      description: "Network-wide average",
      trend: { value: 3.2, isPositive: true },
      icon: Shield,
      iconColor: "text-green-600",
      progress: 94.2
    },
    {
      title: "Transactions",
      value: "184.7K",
      description: "Last 24 hours",
      trend: { value: 8.1, isPositive: true },
      icon: Activity,
              iconColor: "text-atp-electric-cyan",
      progress: 68
    },
    {
      title: "Performance",
      value: "99.98%",
      description: "System uptime",
      trend: { value: 0.02, isPositive: false },
      icon: TrendingUp,
      iconColor: "text-orange-600",
      progress: 99.98
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}