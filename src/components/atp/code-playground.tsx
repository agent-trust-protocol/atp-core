'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Play, Copy, Check, RotateCcw, Terminal } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CodePlaygroundProps {
  initialCode?: string
}

export function CodePlayground({ initialCode = `import { Agent } from 'atp-sdk';

// Create your agent
const agent = await Agent.create('MyBot');
console.log('DID:', agent.getDID());
console.log('Quantum-safe:', agent.isQuantumSafe());` }: CodePlaygroundProps) {
  const [code, setCode] = useState(initialCode)
  const [output, setOutput] = useState<string>('')
  const [isRunning, setIsRunning] = useState(false)
  const [copied, setCopied] = useState(false)

  const runCode = async () => {
    setIsRunning(true)
    setOutput('')
    
    // Simulate code execution
    setTimeout(() => {
      // In a real implementation, this would execute the code
      // For now, we'll simulate output
      setOutput(`✓ Agent created successfully
DID: did:atp:testnet:agent-${Math.random().toString(36).substr(2, 9)}
Quantum-safe: true
Trust Level: BASIC
Status: Ready`)
      setIsRunning(false)
    }, 1000)
  }

  const copyCode = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const resetCode = () => {
    setCode(initialCode)
    setOutput('')
  }

  return (
    <Card className="glass border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-primary" />
          Live Code Playground
        </CardTitle>
        <CardDescription>
          Try ATP SDK code in your browser - no installation needed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="code" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
          </TabsList>
          <TabsContent value="code" className="space-y-3 mt-4">
            <div className="relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-64 bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg border border-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                placeholder="Enter your ATP code here..."
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyCode}
                  className="h-7 w-7 p-0"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetCode}
                  className="h-7 w-7 p-0"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Button
              onClick={runCode}
              disabled={isRunning}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
            >
              <Play className="h-4 w-4 mr-2" />
              {isRunning ? 'Running...' : 'Run Code'}
            </Button>
          </TabsContent>
          <TabsContent value="output" className="mt-4">
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm border border-gray-800 min-h-[200px]">
              {output ? (
                <pre className="text-green-400 whitespace-pre-wrap">{output}</pre>
              ) : (
                <div className="text-muted-foreground text-center py-8">
                  Click "Run Code" to see output here
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        <Alert>
          <AlertDescription className="text-xs">
            <strong>Note:</strong> This is a simulated playground. For real execution, install the SDK locally or use our cloud sandbox.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

