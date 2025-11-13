"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  FileText,
  PlusCircle,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  Settings
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

interface PolicyTestingFrameworkProps {
  policyDocument: any
  onTest: (scenarios: TestScenario[]) => Promise<TestResult[]>
}

export function PolicyTestingFramework({ policyDocument, onTest }: PolicyTestingFrameworkProps) {
  const [scenarios, setScenarios] = useState<TestScenario[]>([
    {
      id: '1',
      name: 'Trusted Agent Access',
      description: 'Test access for a trusted agent to a standard API',
      context: {
        agentDID: 'did:atp:trusted-agent-001',
        trustLevel: 'TRUSTED',
        tool: { id: 'weather-api', type: 'api', sensitivity: 'public' },
        requestedAction: 'read',
        organizationId: 'org-demo'
      },
      expectedResult: 'allow',
      tags: ['basic', 'trusted']
    },
    {
      id: '2',
      name: 'Untrusted Agent Access',
      description: 'Test access for an untrusted agent to a standard API',
      context: {
        agentDID: 'did:atp:untrusted-agent-001',
        trustLevel: 'UNKNOWN',
        tool: { id: 'weather-api', type: 'api', sensitivity: 'public' },
        requestedAction: 'read',
        organizationId: 'org-demo'
      },
      expectedResult: 'deny',
      tags: ['basic', 'untrusted']
    },
    {
      id: '3',
      name: 'Sensitive Resource Access',
      description: 'Test access to a confidential resource',
      context: {
        agentDID: 'did:atp:verified-agent-001',
        trustLevel: 'VERIFIED',
        tool: { id: 'customer-db', type: 'database', sensitivity: 'confidential' },
        requestedAction: 'write',
        organizationId: 'org-demo'
      },
      expectedResult: 'require_approval',
      tags: ['sensitive', 'database']
    }
  ])

  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([])
  const [newScenario, setNewScenario] = useState<Partial<TestScenario>>({})
  const [showAddDialog, setShowAddDialog] = useState(false)

  const runTests = async (scenarioIds?: string[]) => {
    const testScenarios = scenarioIds 
      ? scenarios.filter(s => scenarioIds.includes(s.id))
      : scenarios

    setIsRunningTests(true)
    try {
      const results = await onTest(testScenarios)
      setTestResults(results)
    } catch (error) {
      console.error('Test execution failed:', error)
    } finally {
      setIsRunningTests(false)
    }
  }

  const addScenario = () => {
    if (!newScenario.name) return

    const scenario: TestScenario = {
      id: Date.now().toString(),
      name: newScenario.name || '',
      description: newScenario.description || '',
      context: newScenario.context || {
        agentDID: 'did:atp:test-agent',
        trustLevel: 'VERIFIED',
        tool: { id: 'test-api', type: 'api', sensitivity: 'public' },
        requestedAction: 'read',
        organizationId: 'org-demo'
      },
      expectedResult: newScenario.expectedResult || 'allow',
      tags: newScenario.tags || []
    }

    setScenarios([...scenarios, scenario])
    setNewScenario({})
    setShowAddDialog(false)
  }

  const removeScenario = (id: string) => {
    setScenarios(scenarios.filter(s => s.id !== id))
    setTestResults(testResults.filter(r => r.scenarioId !== id))
  }

  const exportTests = () => {
    const data = { scenarios, results: testResults }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `policy-tests-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importTests = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.scenarios) {
          setScenarios(data.scenarios)
        }
        if (data.results) {
          setTestResults(data.results)
        }
      } catch (error) {
        console.error('Failed to import test data:', error)
      }
    }
    reader.readAsText(file)
  }

  const getResultIcon = (result: TestResult) => {
    if (result.success) {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    } else {
      return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getResultColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600'
  }

  const successRate = testResults.length > 0 
    ? (testResults.filter(r => r.success).length / testResults.length) * 100 
    : 0

  const avgProcessingTime = testResults.length > 0
    ? testResults.reduce((sum, r) => sum + r.processingTime, 0) / testResults.length
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Policy Testing Framework</h2>
          <p className="text-muted-foreground">
            Comprehensive testing and validation for trust policies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="application/json"
            onChange={importTests}
            className="hidden"
            id="import-tests"
            aria-label="Import policy tests JSON file"
          />
          <Button variant="outline" onClick={() => document.getElementById('import-tests')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={exportTests}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Test
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Test Scenario</DialogTitle>
                <DialogDescription>
                  Create a new test scenario for policy validation
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Test Name</Label>
                  <Input
                    value={newScenario.name || ''}
                    onChange={(e) => setNewScenario({ ...newScenario, name: e.target.value })}
                    placeholder="Enter test name"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newScenario.description || ''}
                    onChange={(e) => setNewScenario({ ...newScenario, description: e.target.value })}
                    placeholder="Describe what this test validates"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Agent DID</Label>
                    <Input
                      value={newScenario.context?.agentDID || ''}
                      onChange={(e) => setNewScenario({
                        ...newScenario,
                        context: { ...newScenario.context!, agentDID: e.target.value }
                      })}
                      placeholder="did:atp:test-agent"
                    />
                  </div>
                  <div>
                    <Label>Trust Level</Label>
                    <Select
                      value={newScenario.context?.trustLevel || 'VERIFIED'}
                      onValueChange={(value) => setNewScenario({
                        ...newScenario,
                        context: { ...newScenario.context!, trustLevel: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNKNOWN">Unknown</SelectItem>
                        <SelectItem value="BASIC">Basic</SelectItem>
                        <SelectItem value="VERIFIED">Verified</SelectItem>
                        <SelectItem value="TRUSTED">Trusted</SelectItem>
                        <SelectItem value="PRIVILEGED">Privileged</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Expected Result</Label>
                  <Select
                    value={newScenario.expectedResult || 'allow'}
                    onValueChange={(value: any) => setNewScenario({ ...newScenario, expectedResult: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allow">Allow</SelectItem>
                      <SelectItem value="deny">Deny</SelectItem>
                      <SelectItem value="throttle">Throttle</SelectItem>
                      <SelectItem value="require_approval">Require Approval</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addScenario} className="w-full">
                  Add Test Scenario
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => runTests()} disabled={isRunningTests}>
            {isRunningTests ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run All Tests
          </Button>
        </div>
      </div>

      {/* Test Results Summary */}
      {testResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${successRate === 100 ? 'text-green-600' : successRate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                {Math.round(successRate)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {testResults.filter(r => r.success).length} of {testResults.length} passed
              </p>
              <Progress value={successRate} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(avgProcessingTime)}ms</div>
              <p className="text-xs text-muted-foreground">
                Policy evaluation speed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{testResults.length}</div>
              <p className="text-xs text-muted-foreground">
                Test scenarios executed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Tests</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${testResults.filter(r => !r.success).length === 0 ? 'text-green-600' : 'text-red-600'}`}>
                {testResults.filter(r => !r.success).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle>Test Scenarios</CardTitle>
            <CardDescription>
              Configure and manage test scenarios for policy validation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scenarios.map((scenario) => (
                <div key={scenario.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{scenario.name}</h4>
                        <Badge variant="outline">{scenario.expectedResult}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{scenario.description}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>Agent: {scenario.context.agentDID.split(':').pop()}</span>
                        <Separator orientation="vertical" className="h-3" />
                        <span>Trust: {scenario.context.trustLevel}</span>
                        <Separator orientation="vertical" className="h-3" />
                        <span>Tool: {scenario.context.tool.id}</span>
                      </div>
                      {scenario.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {scenario.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runTests([scenario.id])}
                        disabled={isRunningTests}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeScenario(scenario.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              View detailed results from policy test execution
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No test results yet</p>
                <p className="text-sm text-muted-foreground">Run tests to see results here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {testResults.map((result) => (
                  <div key={result.scenarioId} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          {getResultIcon(result)}
                          <h4 className="font-medium">{result.scenarioName}</h4>
                          <Badge variant={result.success ? "default" : "destructive"}>
                            {result.success ? 'PASSED' : 'FAILED'}
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Expected: </span>
                          <span className="font-medium">{result.expectedResult}</span>
                          <span className="text-muted-foreground"> | Actual: </span>
                          <span className={`font-medium ${getResultColor(result.success)}`}>
                            {result.actualResult}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{result.reason}</p>
                        {result.matchedRule && (
                          <div className="text-xs text-muted-foreground">
                            Matched Rule: {result.matchedRule}
                          </div>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{result.processingTime}ms</span>
                          </div>
                          <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}