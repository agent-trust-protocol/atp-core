"use client"

import { useState, useEffect, useCallback } from "react"
import { PolicyTestingFramework } from "@/components/atp/policy-testing-framework"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Subnav } from "@/components/ui/subnav"
import { Shield as ShieldIcon, Edit3, Play, BarChart3, CheckCircle } from "lucide-react"
import { FileText, RefreshCw } from "lucide-react"

interface TestScenario {
  id: string
  name: string
  description: string
  context: {
    agentDID: string
    trustLevel: string
    tool: {
      id: string
      type: string
      sensitivity: string
    }
    requestedAction: string
    organizationId: string
  }
  expectedResult: 'allow' | 'deny' | 'throttle' | 'require_approval'
  tags: string[]
}

interface TestResult {
  scenarioId: string
  scenarioName: string
  expectedResult: string
  actualResult: string
  success: boolean
  processingTime: number
  reason: string
  matchedRule?: string
  timestamp: string
}

export default function PolicyTestingPage() {
  const [policies, setPolicies] = useState<any[]>([])
  const [selectedPolicy, setSelectedPolicy] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const policyTabs = [
    {
      id: 'policies',
      label: 'Policy Management',
      href: '/policies',
      icon: <ShieldIcon className="h-4 w-4" />
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
    { label: 'Policy Testing' }
  ]

  const fetchPolicies = useCallback(async () => {
    try {
      setIsLoading(true)
      const baseUrl = process.env.NEXT_PUBLIC_ATP_PERMISSION_URL || 'http://localhost:3003'
      const response = await fetch(`${baseUrl}/policies`)
      const data = await response.json()
      
      if (data.policies) {
        setPolicies(data.policies)
        setSelectedPolicy(prev => prev || (data.policies[0]?.id ?? ""))
      }
    } catch (error) {
      console.error('Failed to fetch policies:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPolicies()
  }, [fetchPolicies])

  const handleTest = async (scenarios: TestScenario[]): Promise<TestResult[]> => {
    const selectedPolicyDoc = policies.find(p => p.id === selectedPolicy)
    if (!selectedPolicyDoc) {
      throw new Error('No policy selected for testing')
    }

    const baseUrl = process.env.NEXT_PUBLIC_ATP_PERMISSION_URL || 'http://localhost:3003'
    
    const results: TestResult[] = []
    
    for (const scenario of scenarios) {
      try {
        const response = await fetch(`${baseUrl}/policies/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            policyDocument: selectedPolicyDoc,
            context: {
              ...scenario.context,
              credentials: [],
              timestamp: new Date().toISOString()
            }
          })
        })

        const result = await response.json()
        
        results.push({
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          expectedResult: scenario.expectedResult,
          actualResult: result.decision,
          success: result.decision === scenario.expectedResult,
          processingTime: result.processingTime,
          reason: result.reason,
          matchedRule: result.matchedRule?.name,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        results.push({
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          expectedResult: scenario.expectedResult,
          actualResult: 'error',
          success: false,
          processingTime: 0,
          reason: `Test execution failed: ${error}`,
          timestamp: new Date().toISOString()
        })
      }
    }
    
    return results
  }

  return (
    <div className="min-h-screen bg-background">
      <Subnav tabs={policyTabs} breadcrumbs={breadcrumbs} variant="both" />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-atp-quantum-blue to-atp-electric-cyan rounded-lg p-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2 text-white">ATP Dashboard</h1>
                <p className="text-white/90">Monitor your quantum-safe AI agent network in real-time</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={fetchPolicies} 
                  disabled={isLoading}
                  className="bg-white/20 hover:bg-white/30 text-white border-0 hover:scale-105 transition-all duration-300"
                >
                  <RefreshCw className={`h-5 w-5 mr-3 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Policy Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Policy to Test</CardTitle>
            <CardDescription>
              Choose a policy from your registry to run comprehensive tests against
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Select value={selectedPolicy} onValueChange={setSelectedPolicy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a policy to test" />
                  </SelectTrigger>
                  <SelectContent>
                    {policies.map((policy) => (
                      <SelectItem key={policy.id} value={policy.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{policy.name}</span>
                          <div className="flex items-center space-x-2 ml-4">
                            <Badge variant={policy.enabled ? "default" : "secondary"}>
                              {policy.enabled ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">
                              {policy.rules.length} rules
                            </Badge>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {selectedPolicy && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                {(() => {
                  const policy = policies.find(p => p.id === selectedPolicy)
                  return policy ? (
                    <div>
                      <h4 className="font-medium mb-2">{policy.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {policy.description || 'No description available'}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>{policy.rules.length} rules configured</span>
                        </div>
                        <Badge variant={policy.enabled ? "default" : "secondary"}>
                          {policy.enabled ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-muted-foreground">
                          Created: {new Date(policy.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ) : null
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Testing Framework */}
        {selectedPolicy ? (
          <PolicyTestingFramework
            policyDocument={policies.find(p => p.id === selectedPolicy)}
            onTest={handleTest}
          />
        ) : (
          <>
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Policy Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select a policy from the dropdown above to start testing
                </p>
                <Button onClick={fetchPolicies} variant="outline" className="glass border-atp-electric-cyan/30 hover:bg-atp-electric-cyan/10 hover:border-atp-electric-cyan/50 hover:scale-105 transition-all duration-300">
                  <RefreshCw className="h-5 w-5 mr-3" />
                  Load Policies
                </Button>
              </CardContent>
            </Card>
            
            {/* Testing Guide */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  How Policy Testing Works
                </CardTitle>
                <CardDescription>
                  Learn how to validate your trust policies with comprehensive testing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Test Scenarios
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Create test cases with different agent DIDs, trust levels, and requested actions
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Validation
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Verify that your policies behave as expected under various conditions
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Results
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Get detailed reports showing test outcomes and policy performance
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Test Types Available:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Access control validation</li>
                    <li>Trust level verification</li>
                    <li>Rate limiting tests</li>
                    <li>Permission boundary checks</li>
                    <li>Edge case scenarios</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}