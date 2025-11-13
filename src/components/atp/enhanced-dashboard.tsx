"use client"

import { useState } from "react"
import { DashboardStats } from "./dashboard-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  MoreVertical, 
  Download, 
  RefreshCw, 
  Settings,
  Filter,
  Calendar,
  Bell,
  Search
} from "lucide-react"
import { cn } from "@/lib/utils"

export function EnhancedDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h")

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsRefreshing(false)
  }

  const timeRanges = [
    { value: "1h", label: "Last Hour" },
    { value: "24h", label: "Last 24 Hours" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
    { value: "custom", label: "Custom Range" }
  ]

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-atp-quantum-blue to-atp-electric-cyan dark:from-cyan-600 dark:to-blue-600 rounded-lg p-6 text-white shadow-xl dark:shadow-cyan-900/20 border dark:border-cyan-500/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 !text-white drop-shadow-lg" style={{ background: 'none', WebkitTextFillColor: 'white', backgroundClip: 'unset' }}>ATP Dashboard</h1>
            <p className="text-white/95 dark:text-white/90 font-medium drop-shadow-sm">
              Monitor your quantum-safe AI agent network in real-time
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white/20 hover:bg-white/30 dark:bg-white/30 dark:hover:bg-white/40 text-white border-0 backdrop-blur-sm shadow-lg"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 dark:bg-white/30 dark:hover:bg-white/40 text-white border-0 backdrop-blur-sm shadow-lg">
                  <Calendar className="h-4 w-4 mr-2" />
                  {timeRanges.find(t => t.value === selectedTimeRange)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Time Range</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {timeRanges.map((range) => (
                  <DropdownMenuItem
                    key={range.value}
                    onClick={() => setSelectedTimeRange(range.value)}
                  >
                    {range.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search agents, policies, or transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-[300px]"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Alerts
                <Badge variant="destructive" className="ml-2">3</Badge>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>System Alerts</DialogTitle>
                <DialogDescription>
                  Recent alerts and notifications from your ATP network
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-4">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800">High Risk Agent Detected</p>
                  <p className="text-xs text-red-600 mt-1">Agent ID: xyz789 - Risk score exceeded threshold</p>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">Performance Warning</p>
                  <p className="text-xs text-yellow-600 mt-1">Response time increased by 15% in the last hour</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">New Integration Available</p>
                  <p className="text-xs text-blue-600 mt-1">MCP Protocol v2.0 is now supported</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Dashboard Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Reset Dashboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Grid */}
      <DashboardStats />

      {/* Additional Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest events in your ATP network</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">New agent registered</p>
                    <p className="text-xs text-gray-500">Agent ID: abc{i}23 • 2 minutes ago</p>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>Trust Distribution</CardTitle>
            <CardDescription>Agent trust levels across the network</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Enterprise</span>
                <div className="flex items-center gap-2">
                  <Progress value={30} className="w-32" />
                  <span className="text-sm text-gray-600">30%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Verified</span>
                <div className="flex items-center gap-2">
                  <Progress value={45} className="w-32" />
                  <span className="text-sm text-gray-600">45%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Basic</span>
                <div className="flex items-center gap-2">
                  <Progress value={25} className="w-32" />
                  <span className="text-sm text-gray-600">25%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}