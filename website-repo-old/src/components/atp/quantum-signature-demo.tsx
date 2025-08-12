"use client"

import { useState } from "react"
import { Shield, Key, Atom } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { generateMockSignature } from "@/lib/utils"

interface SignatureResult {
  message: string
  timestamp: string
  signature: {
    ed25519: string
    dilithium: string
    combined: string
  }
  verification: {
    quantum_safe: boolean
    algorithm: string
    security_level: string
  }
}

export function QuantumSignatureDemo() {
  const [message, setMessage] = useState(
    "Hello from Agent Trust Protocol! This message will be signed with quantum-safe cryptography."
  )
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SignatureResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generateSignature = async () => {
    if (!message.trim()) {
      setError("Please enter a message to sign")
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      // Simulate signature generation delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const signature = generateMockSignature(message)
      
      const signatureResult: SignatureResult = {
        message: message.trim(),
        timestamp: Date.now().toString(),
        signature: {
          ed25519: signature.ed25519,
          dilithium: signature.dilithium,
          combined: signature.combined
        },
        verification: {
          quantum_safe: true,
          algorithm: 'Ed25519 + Dilithium',
          security_level: 'Post-Quantum'
        }
      }
      
      setResult(signatureResult)
    } catch (err) {
      setError(`Signature generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-lg atp-gradient">
            <Shield className="h-6 w-6 text-white" />
          </div>
          Quantum-Safe Signatures
        </CardTitle>
        <CardDescription>
          Generate hybrid cryptographic signatures using Ed25519 + Dilithium for quantum resistance
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Generate Hybrid Signature</h4>
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              Message to Sign:
            </label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message here..."
              rows={3}
              className="resize-none"
            />
          </div>
          <Button 
            onClick={generateSignature}
            disabled={isLoading}
            variant="atp"
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <div className="quantum-loading mr-2">
                <Atom className="h-4 w-4" />
              </div>
            ) : (
              <Key className="h-4 w-4 mr-2" />
            )}
            {isLoading ? "Generating..." : "Generate Signature"}
          </Button>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium">Signature Result</h4>
          
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
              {error}
            </div>
          )}
          
          {result ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <pre className="text-xs text-green-800 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="quantum" className="animate-pulse">
                  <Atom className="h-3 w-3 mr-1" />
                  Quantum-Safe: Ed25519 + Dilithium
                </Badge>
                <Badge variant="secondary">
                  Post-Quantum Security
                </Badge>
                <Badge variant="outline">
                  Hybrid Cryptography
                </Badge>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 text-sm">
              Click "Generate Signature" to see quantum-safe cryptographic signature...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}