"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Users, 
  Shield, 
  Crown, 
  Star, 
  Building, 
  Search, 
  Filter, 
  MoreHorizontal,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

interface Agent {
  id: string
  name: string
  did: string
  trustLevel: 'untrusted' | 'basic' | 'verified' | 'premium' | 'enterprise'
  status: 'active' | 'inactive' | 'suspended'
  lastActive: Date
  organization?: string
  signaturesGenerated: number
  credentialsIssued: number
  riskScore: number
}

const MOCK_AGENTS: Agent[] = [
  {
    id: '1',
    name: 'Enterprise Bot Alpha',
    did: 'did:atp:enterprise:abc123',
    trustLevel: 'enterprise',
    status: 'active',
    lastActive: new Date(Date.now() - 1000 * 60 * 5),
    organization: 'TechCorp Industries',
    signaturesGenerated: 15847,
    credentialsIssued: 234,
    riskScore: 2
  },
  {
    id: '2',
    name: 'AI Assistant Pro',
    did: 'did:atp:premium:def456',
    trustLevel: 'premium',
    status: 'active',
    lastActive: new Date(Date.now() - 1000 * 60 * 15),
    organization: 'StartupCo',
    signaturesGenerated: 8923,
    credentialsIssued: 156,
    riskScore: 5
  },
  {
    id: '3',
    name: 'Research Agent',
    did: 'did:atp:verified:ghi789',
    trustLevel: 'verified',
    status: 'active',
    lastActive: new Date(Date.now() - 1000 * 60 * 30),
    signaturesGenerated: 3421,
    credentialsIssued: 67,
    riskScore: 8
  },
  {
    id: '4',
    name: 'Test Bot Beta',
    did: 'did:atp:basic:jkl012',
    trustLevel: 'basic',
    status: 'inactive',
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2),
    signaturesGenerated: 892,
    credentialsIssued: 23,
    riskScore: 15
  },
  {
    id: '5',
    name: 'Unknown Agent',
    did: 'did:atp:untrusted:mno345',
    trustLevel: 'untrusted',
    status: 'suspended',
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24),
    signaturesGenerated: 45,
    credentialsIssued: 0,
    riskScore: 85
  }
]

export function UserManagement() {
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTrustLevel, setFilterTrustLevel] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const getTrustLevelIcon = (level: string) => {
    switch (level) {
      case 'enterprise': return Building
      case 'premium': return Crown
      case 'verified': return Shield
      case 'basic': return Star
      default: return Users
    }
  }

  const getTrustLevelColor = (level: string) => {
    switch (level) {
      case 'enterprise': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'premium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'verified': return 'bg-green-100 text-green-800 border-green-200'
      case 'basic': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle
      case 'inactive': return XCircle
      case 'suspended': return AlertTriangle
      default: return XCircle
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRiskColor = (score: number) => {
    if (score <= 10) return 'text-green-600'
    if (score <= 30) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRiskLevel = (score: number) => {
    if (score <= 10) return 'Low'
    if (score <= 30) return 'Medium'
    return 'High'
  }

  const formatLastActive = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.did.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.organization?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTrustLevel = filterTrustLevel === 'all' || agent.trustLevel === filterTrustLevel
    const matchesStatus = filterStatus === 'all' || agent.status === filterStatus

    return matchesSearch && matchesTrustLevel && matchesStatus
  })

  const trustLevelStats = {
    enterprise: agents.filter(a => a.trustLevel === 'enterprise').length,
    premium: agents.filter(a => a.trustLevel === 'premium').length,
    verified: agents.filter(a => a.trustLevel === 'verified').length,
    basic: agents.filter(a => a.trustLevel === 'basic').length,
    untrusted: agents.filter(a => a.trustLevel === 'untrusted').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agent Management</h2>
          <p className="text-gray-600 mt-1">
            Manage and monitor all registered agents in the network
          </p>
        </div>
        
        <Button asChild className="flex items-center gap-2">
          <Link href="/dashboard/agents/new">
            <UserPlus className="h-4 w-4" />
            Add New Agent
          </Link>
        </Button>
      </div>

      {/* Trust Level Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(trustLevelStats).map(([level, count]) => {
          const IconComponent = getTrustLevelIcon(level)
          return (
            <Card key={level} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-600 capitalize">{level}</p>
                  </div>
                  <IconComponent className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search agents by name, DID, or organization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={filterTrustLevel}
              onChange={(e) => setFilterTrustLevel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Trust Levels</option>
              <option value="enterprise">Enterprise</option>
              <option value="premium">Premium</option>
              <option value="verified">Verified</option>
              <option value="basic">Basic</option>
              <option value="untrusted">Untrusted</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Registered Agents ({filteredAgents.length})
          </CardTitle>
          <CardDescription>
            Detailed view of all agents with their trust levels and activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAgents.map((agent) => {
              const TrustIcon = getTrustLevelIcon(agent.trustLevel)
              const StatusIcon = getStatusIcon(agent.status)
              
              return (
                <div key={agent.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <TrustIcon className="h-5 w-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                        <Badge className={getTrustLevelColor(agent.trustLevel)}>
                          {agent.trustLevel}
                        </Badge>
                        <Badge className={getStatusColor(agent.status)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {agent.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><span className="font-medium">DID:</span> {agent.did}</p>
                        {agent.organization && (
                          <p><span className="font-medium">Organization:</span> {agent.organization}</p>
                        )}
                        <p><span className="font-medium">Last Active:</span> {formatLastActive(agent.lastActive)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-lg font-semibold text-blue-600">
                          {agent.signaturesGenerated.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600">Signatures</p>
                      </div>
                      
                      <div>
                        <p className="text-lg font-semibold text-green-600">
                          {agent.credentialsIssued}
                        </p>
                        <p className="text-xs text-gray-600">Credentials</p>
                      </div>
                      
                      <div>
                        <p className={`text-lg font-semibold ${getRiskColor(agent.riskScore)}`}>
                          {getRiskLevel(agent.riskScore)}
                        </p>
                        <p className="text-xs text-gray-600">Risk Level</p>
                        <Progress value={100 - agent.riskScore} className="h-1 mt-1" />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {filteredAgents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No agents found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}