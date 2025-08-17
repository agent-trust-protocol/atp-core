"use client"

import { useState, useEffect } from "react"
import { 
  FolderOpen, 
  Save, 
  Trash2, 
  Copy, 
  Edit, 
  Eye, 
  Download, 
  Upload,
  Search,
  Filter,
  Calendar,
  User,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Policy {
  id: string
  name: string
  description: string
  version: string
  createdAt: string
  updatedAt: string
  author: string
  status: 'draft' | 'active' | 'archived'
  tags: string[]
  nodes: any[]
  edges: any[]
  usage: {
    evaluations: number
    lastUsed: string
    successRate: number
  }
}

export function PolicyManagement() {
  const [policies, setPolicies] = useState<Policy[]>([
    {
      id: '1',
      name: 'Enterprise Access Control',
      description: 'Controls access to enterprise resources based on trust levels',
      version: '1.2.0',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-20T14:45:00Z',
      author: 'admin@company.com',
      status: 'active',
      tags: ['enterprise', 'access-control', 'trust-levels'],
      nodes: [],
      edges: [],
      usage: {
        evaluations: 15420,
        lastUsed: '2024-01-28T09:15:00Z',
        successRate: 98.5
      }
    },
    {
      id: '2',
      name: 'Financial Data Protection',
      description: 'Protects financial data with strict verification requirements',
      version: '1.0.1',
      createdAt: '2024-01-10T08:00:00Z',
      updatedAt: '2024-01-18T16:20:00Z',
      author: 'security@company.com',
      status: 'active',
      tags: ['financial', 'data-protection', 'compliance'],
      nodes: [],
      edges: [],
      usage: {
        evaluations: 8920,
        lastUsed: '2024-01-28T08:30:00Z',
        successRate: 99.2
      }
    },
    {
      id: '3',
      name: 'Development Environment Access',
      description: 'Manages access to development and staging environments',
      version: '0.9.5',
      createdAt: '2024-01-05T11:15:00Z',
      updatedAt: '2024-01-15T13:10:00Z',
      author: 'devops@company.com',
      status: 'draft',
      tags: ['development', 'staging', 'devops'],
      nodes: [],
      edges: [],
      usage: {
        evaluations: 2340,
        lastUsed: '2024-01-27T17:45:00Z',
        successRate: 95.8
      }
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'active' | 'archived'>('all')
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    version: '1.0.0',
    status: 'draft' as Policy['status'],
    tags: ''
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const resetForm = () => {
    setForm({ name: '', description: '', version: '1.0.0', status: 'draft', tags: '' })
    setFormError(null)
  }

  const openCreate = () => {
    resetForm()
    setSelectedPolicy(null)
    setIsEditorOpen(true)
  }

  const openEdit = (policy: Policy) => {
    setSelectedPolicy(policy)
    setForm({
      name: policy.name,
      description: policy.description,
      version: policy.version,
      status: policy.status,
      tags: (policy.tags || []).join(', ')
    })
    setIsEditorOpen(true)
  }

  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      setFormError('Name is required')
      return false
    }
    if (form.description.trim().length < 10) {
      setFormError('Description should be at least 10 characters')
      return false
    }
    setFormError(null)
    return true
  }

  const savePolicy = () => {
    if (!validateForm()) return
    const now = new Date().toISOString()
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    if (selectedPolicy) {
      setPolicies(prev => prev.map(p => p.id === selectedPolicy.id ? {
        ...p,
        name: form.name,
        description: form.description,
        version: form.version,
        status: form.status,
        tags,
        updatedAt: now
      } : p))
    } else {
      const newPolicy: Policy = {
        id: (globalThis.crypto?.randomUUID?.() ?? Date.now().toString()),
        name: form.name,
        description: form.description,
        version: form.version,
        createdAt: now,
        updatedAt: now,
        author: 'admin@company.com',
        status: form.status,
        tags,
        nodes: [],
        edges: [],
        usage: { evaluations: 0, lastUsed: '', successRate: 0 }
      }
      setPolicies(prev => [newPolicy, ...prev])
      setSelectedPolicy(newPolicy)
    }
    setIsEditorOpen(false)
  }

  // Load policies from Permission Service if available
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        setApiError(null)
        const baseUrl = process.env.NEXT_PUBLIC_ATP_PERMISSION_URL || 'http://localhost:3003'
        const res = await fetch(`${baseUrl}/policies`)
        if (!res.ok) return
        const data = await res.json()
        if (!data || !Array.isArray(data.policies)) return
        const mapped: Policy[] = data.policies.map((p: any) => ({
          id: p.id || p.policyId || String(Date.now()),
          name: p.name || 'Untitled Policy',
          description: p.description || '',
          version: p.version || '1.0.0',
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString(),
          author: p.createdBy || 'system',
          status: p.enabled ? 'active' : 'draft',
          tags: p.tags || [],
          nodes: p.nodes || [],
          edges: p.edges || [],
          usage: {
            evaluations: p.evaluations || 0,
            lastUsed: p.lastUsed || '',
            successRate: typeof p.successRate === 'number' ? p.successRate : 0
          }
        }))
        if (mapped.length > 0) setPolicies(mapped)
      } catch (err) {
        setApiError('Failed to load policies from service')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  // Persist changes to backend (best-effort, non-blocking; shows alert on failure)
  useEffect(() => {
    const sync = async () => {
      if (!selectedPolicy) return
      try {
        const baseUrl = process.env.NEXT_PUBLIC_ATP_PERMISSION_URL || 'http://localhost:3003'
        const body = {
          document: {
            id: selectedPolicy.id,
            name: selectedPolicy.name,
            description: selectedPolicy.description,
            organizationId: 'default',
            nodes: selectedPolicy.nodes || [],
            edges: selectedPolicy.edges || [],
            tags: selectedPolicy.tags || [],
            category: 'operational'
          },
          name: selectedPolicy.name,
          description: selectedPolicy.description,
          createdBy: selectedPolicy.author
        }
        // Try PUT first; if 404, try POST
        const putRes = await fetch(`${baseUrl}/policies/${encodeURIComponent(selectedPolicy.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        if (!putRes.ok) {
          await fetch(`${baseUrl}/policies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          })
        }
      } catch (err) {
        setApiError('Failed to persist policy to service (will remain local)')
      }
    }
    sync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPolicy?.id, selectedPolicy?.name, selectedPolicy?.description, selectedPolicy?.tags, selectedPolicy?.nodes, selectedPolicy?.edges])

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (policy.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || policy.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'draft': return <Edit className="h-4 w-4" />
      case 'archived': return <Clock className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const duplicatePolicy = (policy: Policy) => {
    const newPolicy: Policy = {
      ...policy,
      id: Date.now().toString(),
      name: `${policy.name} (Copy)`,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      usage: {
        evaluations: 0,
        lastUsed: '',
        successRate: 0
      }
    }
    setPolicies(prev => [...prev, newPolicy])
  }

  const deletePolicy = async (policyId: string) => {
    setPolicies(prev => prev.filter(p => p.id !== policyId))
    try {
      const baseUrl = process.env.NEXT_PUBLIC_ATP_PERMISSION_URL || 'http://localhost:3003'
      await fetch(`${baseUrl}/policies/${encodeURIComponent(policyId)}`, { method: 'DELETE' })
    } catch (err) {
      setApiError('Failed to delete policy on service')
    }
  }

  const exportPolicy = (policy: Policy) => {
    const blob = new Blob([JSON.stringify(policy, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${policy.name.replace(/\s+/g, '-').toLowerCase()}-v${policy.version}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Policy Management</h1>
          <p className="text-gray-600 mt-1">
            Manage and organize your trust policies
          </p>
        </div>
        <div className="flex items-center gap-3">
          {apiError && (
            <Alert variant="destructive">
              <AlertTitle>Service Error</AlertTitle>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Policy
          </Button>
          <Button onClick={openCreate} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            Create New Policy
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search policies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border rounded-md px-3 py-2 text-sm"
                aria-label="Filter policies by status"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policy List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPolicies.map((policy) => (
          <Card key={policy.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{policy.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {policy.description}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(policy.status)}>
                  {getStatusIcon(policy.status)}
                  <span className="ml-1 capitalize">{policy.status}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {(policy.tags || []).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Metadata */}
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  <span>{policy.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Updated {formatDate(policy.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  <span>v{policy.version}</span>
                </div>
              </div>

              {/* Usage Stats */}
              <div className="border-t pt-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold">{policy.usage.evaluations.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Evaluations</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">{policy.usage.successRate}%</div>
                    <div className="text-xs text-gray-500">Success Rate</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">
                      {policy.usage.lastUsed ? formatDate(policy.usage.lastUsed).split(',')[0] : 'Never'}
                    </div>
                    <div className="text-xs text-gray-500">Last Used</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(policy)}>
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm" onClick={() => duplicatePolicy(policy)}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportPolicy(policy)}>
                  <Download className="h-3 w-3" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => deletePolicy(policy.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedPolicy ? 'Edit Policy' : 'Create New Policy'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {formError && (
              <Alert variant="destructive">
                <AlertTitle>Validation Error</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Policy name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe the policy" rows={4} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Version</label>
                <Input value={form.version} onChange={e => setForm(prev => ({ ...prev, version: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value as Policy['status'] }))} className="border rounded-md px-3 py-2 text-sm">
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="space-y-2 sm:col-span-1">
                <label className="text-sm font-medium">Tags</label>
                <Input value={form.tags} onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))} placeholder="comma,separated,tags" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
              <Button onClick={savePolicy}>{selectedPolicy ? 'Save Changes' : 'Create Policy'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {filteredPolicies.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No policies found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first trust policy'
              }
            </p>
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Create New Policy
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Policy Statistics</CardTitle>
          <CardDescription>Overview of your policy management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{policies.length}</div>
              <div className="text-sm text-gray-600">Total Policies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {policies.filter(p => p.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Active Policies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {policies.filter(p => p.status === 'draft').length}
              </div>
              <div className="text-sm text-gray-600">Draft Policies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {policies.reduce((sum, p) => sum + p.usage.evaluations, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Evaluations</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 