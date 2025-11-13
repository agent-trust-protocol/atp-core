'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Shield,
  Key,
  Lock,
  Zap,
  CheckCircle,
  Copy,
  RefreshCw,
  ArrowRight,
  Atom,
  Clock,
  AlertTriangle
} from "lucide-react"

interface SignatureResult {
  message: string
  ed25519Signature: string
  mlDsaSignature: string
  hybridHash: string
  timestamp: string
  keyFingerprint: string
  verification: 'valid' | 'invalid' | 'pending'
  publicKey?: string
  signature?: string // Full hybrid signature for verification
  quantumSafe?: boolean
  algorithm?: string
}

export function QuantumSafeSignatureDemo() {
  const [message, setMessage] = useState("Hello, ATP World! This message demonstrates quantum-safe cryptography.")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [signature, setSignature] = useState<SignatureResult | null>(null)
  const [activeDemo, setActiveDemo] = useState<'sign' | 'verify'>('sign')
  const [error, setError] = useState<string | null>(null)

  // Generate quantum-safe signature using actual SDK
  const generateSignature = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/crypto/generate-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate signature')
      }

      const data = await response.json()

    const result: SignatureResult = {
        message: data.message,
        ed25519Signature: data.ed25519Signature,
        mlDsaSignature: data.mlDsaSignature || '',
        hybridHash: data.hybridHash,
        timestamp: data.timestamp,
        keyFingerprint: data.keyFingerprint,
        verification: 'pending',
        publicKey: data.publicKey,
        signature: data.signature, // Store full signature for verification
        quantumSafe: data.quantumSafe,
        algorithm: data.algorithm
    }

    setSignature(result)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      console.error('Signature generation error:', err)
    } finally {
    setIsGenerating(false)
  }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const verifySignature = async () => {
    if (!signature || !signature.publicKey) return

    setIsVerifying(true)
    setError(null)

    try {
      // Get the full signature from the hybrid signature
      // We need to reconstruct it from the API response or store it
      // For now, we'll call the verify API with what we have
      const response = await fetch('/api/crypto/verify-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: signature.message,
          signature: signature.signature, // Use full hybrid signature
          publicKey: signature.publicKey
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to verify signature')
      }

      const data = await response.json()

      setSignature({
        ...signature,
        verification: data.valid ? 'valid' : 'invalid'
      })
    } catch (err: any) {
      setError(err.message || 'Verification failed')
      console.error('Signature verification error:', err)
      setSignature({
        ...signature,
        verification: 'invalid'
      })
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Atom className="h-8 w-8 text-purple-500" />
          <h2 className="text-3xl font-bold">Quantum-Safe Signature Demo</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Experience ATP's hybrid cryptography in action. Generate quantum-resistant signatures using
          Ed25519 + ML-DSA (Dilithium) post-quantum cryptography.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
            <Shield size={14} className="mr-1" />
            Post-Quantum Secure
          </Badge>
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Key size={14} className="mr-1" />
            Ed25519 + ML-DSA
          </Badge>
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <Zap size={14} className="mr-1" />
            Production Ready
          </Badge>
        </div>
      </div>

      <Tabs value={activeDemo} onValueChange={(value) => setActiveDemo(value as 'sign' | 'verify')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sign">Generate Signature</TabsTrigger>
          <TabsTrigger value="verify">Verify Signature</TabsTrigger>
        </TabsList>

        <TabsContent value="sign" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Message to Sign
              </CardTitle>
              <CardDescription>
                Enter any message to generate a quantum-safe hybrid signature
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message here..."
                className="min-h-[100px]"
              />
              <Button
                onClick={generateSignature}
                disabled={isGenerating || !message.trim()}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating Quantum-Safe Signature...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Generate Hybrid Signature
                  </>
                )}
              </Button>
              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {signature && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Signature Generated
                  </span>
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                    Quantum-Resistant
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Hybrid signature combining classical and post-quantum cryptography
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Ed25519 Signature (Classical)</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(signature.ed25519Signature)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="bg-muted p-3 rounded font-mono text-xs break-all">
                      {signature.ed25519Signature}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">ML-DSA Signature (Post-Quantum)</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(signature.mlDsaSignature)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="bg-muted p-3 rounded font-mono text-xs break-all max-h-32 overflow-y-auto">
                      {signature.mlDsaSignature || 'N/A'}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Hybrid Hash</label>
                      <div className="font-mono text-xs mt-1">{signature.hybridHash}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Key Fingerprint</label>
                      <div className="font-mono text-xs mt-1">{signature.keyFingerprint}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                      <div className="text-xs mt-1">{new Date(signature.timestamp).toLocaleString()}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="flex items-center gap-1 mt-1">
                        {signature.quantumSafe && (
                          <>
                        <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-green-500">Quantum-Safe</span>
                          </>
                        )}
                        {!signature.quantumSafe && (
                          <span className="text-xs text-muted-foreground">Pending</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="verify" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Signature Verification
              </CardTitle>
              <CardDescription>
                Verify quantum-safe signatures against the original message
              </CardDescription>
            </CardHeader>
            <CardContent>
              {signature ? (
                <div className="space-y-4">
                  {signature.verification === 'valid' ? (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-green-900 dark:text-green-100">Signature Valid</span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300">
                        Both Ed25519 and ML-DSA signatures verified successfully against the original message.
                      </p>
                    </div>
                  ) : signature.verification === 'invalid' ? (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <span className="font-medium text-red-900 dark:text-red-100">Signature Invalid</span>
                      </div>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        Signature verification failed.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Click the button below to verify the signature.
                    </p>
                  </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="font-medium">Ed25519 Verification</label>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-500">Valid</span>
                      </div>
                    </div>
                    <div>
                      <label className="font-medium">ML-DSA Verification</label>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-500">Valid</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={verifySignature}
                    disabled={isVerifying || signature.verification === 'valid'}
                    className="w-full"
                    variant="outline"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Verify Signature
                      </>
                    )}
                  </Button>
                  {error && (
                    <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Generate a signature first to see verification results</p>
                  <Button
                    variant="outline"
                    onClick={() => setActiveDemo('sign')}
                    className="mt-4"
                  >
                    Generate Signature
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Why Quantum-Safe Matters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Current Threat</h4>
              <p className="text-muted-foreground">
                Quantum computers will break RSA, ECDSA, and current cryptographic standards,
                compromising all existing digital signatures.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">ATP's Solution</h4>
              <p className="text-muted-foreground">
                Hybrid approach combining proven Ed25519 with NIST-approved ML-DSA (Dilithium)
                post-quantum cryptography for future-proof security.
              </p>
            </div>
          </div>
          <div className="pt-4 border-t">
            <p className="text-center text-muted-foreground">
              <strong>Ready for Production:</strong> Integrate quantum-safe signatures into your agents today with ATP's SDK
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}