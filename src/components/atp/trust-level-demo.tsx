"use client"

import { useState } from "react"
import { Shield, UserPlus, Award, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getTrustLevelColor, getTrustScore } from "@/lib/utils"

interface Agent {
  name: string
  type: 'basic' | 'verified' | 'enterprise'
  did: string
  trustScore: number
  capabilities: string[]
  registeredAt: string
}

const AGENT_TYPES = [
  { value: 'basic', label: 'Basic Agent', description: 'Standard functionality' },
  { value: 'verified', label: 'Verified Agent', description: 'Enhanced capabilities' },
  { value: 'enterprise', label: 'Enterprise Agent', description: 'Full enterprise features' }
] as const

const CAPABILITIES_MAP = {
  basic: ['chat-support', 'basic-queries', 'data-retrieval'],
  verified: ['data-processing', 'ml-inference', 'api-integration', 'reporting'],
  enterprise: ['advanced-analytics', 'system-integration', 'compliance-monitoring', 'audit-logging']
}

export function TrustLevelDemo() {
  const [agentName, setAgentName] = useState("Enterprise AI Assistant")
  const [agentType, setAgentType] = useState<'basic' | 'verified' | 'enterprise'>('enterprise')
  const [isLoading, setIsLoading] = useState(false)
  const [registeredAgent, setRegisteredAgent] = useState<Agent | null>(null)
  const [error, setError] = useState<string | null>(null)

  const registerAgent = async () => {
    if (!agentName.trim()) {
      setError("Please enter an agent name")
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      // Simulate registration delay
      await new Promise(resolve => setTimeout(resolve, 1200))
      
      const agent: Agent = {
        name: agentName.trim(),
        type: agentType,
        did: `did:atp:${agentType}:${Date.now()}`,
        trustScore: getTrustScore(agentType),
        capabilities: CAPABILITIES_MAP[agentType],
        registeredAt: Date.now().toString()
      }
      
      setRegisteredAgent(agent)
    } catch (err) {
      setError(`Agent registration failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getTrustBadgeVariant = (type: string) => {
    switch (type) {
      case 'enterprise': return 'enterprise'
      case 'verified': return 'verified'
      case 'basic': return 'basic'
      default: return 'secondary'
    }
  }

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg atp-gradient">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          Trust Level System
        </CardTitle>
        <CardDescription>
          Register AI agents with different trust levels and capabilities
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Agent Registration</h4>
          
          <div className="space-y-2">
            <label htmlFor="agent-name" className="text-sm font-medium">
              Agent Name:
            </label>
            <Input
              id="agent-name"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="Enterprise AI Assistant"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Agent Type:</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {AGENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setAgentType(type.value)}
                  className={`p-3 rounded-lg border text-left transition-all duration-200 hover:shadow-md ${
                    agentType === type.value
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{type.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                </button>
              ))}
            </div>
          </div>
          
          <Button 
            onClick={registerAgent}
            disabled={isLoading}
            variant="atp"
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <div className="animate-spin mr-2">
                <Shield className="h-4 w-4" />
              </div>
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            {isLoading ? "Registering..." : "Register Agent"}
          </Button>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium">Current Trust Status</h4>
          
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm dark:bg-red-900/30 dark:border-red-700 dark:text-red-300">
              {error}
            </div>
          )}
          
          {registeredAgent ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 dark:bg-green-900/30 dark:border-green-700">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-green-800 dark:text-green-300">{registeredAgent.name}</h5>
                    <Badge variant={getTrustBadgeVariant(registeredAgent.type)}>
                      {registeredAgent.type.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-green-700 dark:text-green-300/90">
                    <div><strong>DID:</strong> {registeredAgent.did}</div>
                    <div><strong>Registered:</strong> {new Date(parseInt(registeredAgent.registeredAt)).toLocaleString()}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-green-800">Capabilities:</div>
                    <div className="flex flex-wrap gap-1">
                      {registeredAgent.capabilities.map((capability) => (
                        <Badge key={capability} variant="outline" className="text-xs">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gray-50 text-center">
                  <div className="text-2xl font-bold text-blue-600 atp-trust-indicator">
                    {registeredAgent.trustScore}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Trust Score</div>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 text-center">
                  <div className="text-2xl font-bold text-green-600 flex items-center justify-center">
                    <Award className="h-6 w-6" />
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Verified</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-muted/30 border border-border text-muted-foreground text-sm">
              Register an agent to see trust level evaluation...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}