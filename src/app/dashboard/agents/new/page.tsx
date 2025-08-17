"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, UserPlus, Shield, Building, Star, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface AgentFormData {
  name: string
  did: string
  organization: string
  trustLevel: 'untrusted' | 'basic' | 'verified' | 'premium' | 'enterprise'
  description: string
}

export default function NewAgentPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    did: '',
    organization: '',
    trustLevel: 'basic',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In a real app, you would make an API call here
    console.log('Creating agent:', formData)
    
    setIsSubmitting(false)
    router.push('/dashboard')
  }

  const handleInputChange = (field: keyof AgentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getTrustLevelIcon = (level: string) => {
    switch (level) {
      case 'enterprise': return Building
      case 'premium': return Star
      case 'verified': return Shield
      case 'basic': return UserPlus
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add New Agent</h1>
            <p className="text-gray-600 mt-1">
              Register a new agent in the trust protocol network
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Agent Information
            </CardTitle>
            <CardDescription>
              Provide the details for the new agent registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Agent Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Enterprise Bot Alpha"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              {/* DID */}
              <div className="space-y-2">
                <Label htmlFor="did">Decentralized Identifier (DID)</Label>
                <Input
                  id="did"
                  type="text"
                  placeholder="e.g., did:atp:enterprise:abc123"
                  value={formData.did}
                  onChange={(e) => handleInputChange('did', e.target.value)}
                  required
                />
              </div>

              {/* Organization */}
              <div className="space-y-2">
                <Label htmlFor="organization">Organization (Optional)</Label>
                <Input
                  id="organization"
                  type="text"
                  placeholder="e.g., TechCorp Industries"
                  value={formData.organization}
                  onChange={(e) => handleInputChange('organization', e.target.value)}
                />
              </div>

              {/* Trust Level */}
              <div className="space-y-2">
                <Label htmlFor="trustLevel">Initial Trust Level</Label>
                <select
                  id="trustLevel"
                  aria-label="Initial Trust Level"
                  value={formData.trustLevel}
                  onChange={(e) => handleInputChange('trustLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="untrusted">Untrusted</option>
                  <option value="basic">Basic</option>
                  <option value="verified">Verified</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
                <div className="flex items-center gap-2 mt-2">
                  {(() => {
                    const IconComponent = getTrustLevelIcon(formData.trustLevel)
                    return (
                      <>
                        <IconComponent className="h-4 w-4" />
                        <Badge className={getTrustLevelColor(formData.trustLevel)}>
                          {formData.trustLevel}
                        </Badge>
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <textarea
                  id="description"
                  placeholder="Brief description of the agent's purpose and capabilities"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-4 pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !formData.name || !formData.did}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  {isSubmitting ? 'Creating Agent...' : 'Create Agent'}
                </Button>
                <Button asChild type="button" variant="outline">
                  <Link href="/dashboard">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}