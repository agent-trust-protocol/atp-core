'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  Key, 
  Lock, 
  AlertCircle,
  LogIn,
  UserPlus
} from "lucide-react"
import Link from "next/link"
import { QuantumSafeSignatureDemo } from "./quantum-safe-signature-demo"

interface QuantumSafeSignatureDemoGatedProps {
  showPreview?: boolean
}

export function QuantumSafeSignatureDemoGated({ showPreview = true }: QuantumSafeSignatureDemoGatedProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // Check if user has auth token
  const checkAuth = () => {
    if (typeof document !== 'undefined') {
      const token = document.cookie.split('; ').find(row => row.startsWith('atp_token='))
      if (token) {
        setIsAuthenticated(true)
        return true
      }
    }
    setIsAuthenticated(false)
    return false
  }

  // Check auth on mount and periodically
  useEffect(() => {
    checkAuth()
    const interval = setInterval(checkAuth, 1000)
    return () => clearInterval(interval)
  }, [])

  if (isAuthenticated) {
    return <QuantumSafeSignatureDemo />
  }

  return (
    <Card className="glass atp-trust-indicator">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-500" />
            <CardTitle>Quantum-Safe Signature Demo</CardTitle>
          </div>
          <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">
            <Lock size={12} className="mr-1" />
            Authentication Required
          </Badge>
        </div>
        <CardDescription>
          Experience ATP's hybrid quantum-safe cryptography. Sign in or sign up to access the full interactive demo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                🔒 Protected Intellectual Property
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                This demo uses our proprietary quantum-safe hybrid cryptography implementation (Ed25519 + ML-DSA). 
                Full access requires authentication to protect our intellectual property.
              </p>
            </div>
          </div>
        </div>

        {showPreview && (
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm font-medium mb-2 text-foreground">What you'll see:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Real-time hybrid signature generation (Ed25519 + ML-DSA)</li>
              <li>Signature verification with actual SDK implementation</li>
              <li>Quantum-safe key fingerprinting</li>
              <li>Interactive demonstration of post-quantum security</li>
            </ul>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button asChild size="lg" className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
            <Link href="/signup?returnTo=/demos&feature=quantum-safe-demo">
              <UserPlus className="h-4 w-4 mr-2" />
              Sign Up for Free Trial
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="flex-1 border-2">
            <Link href="/login?returnTo=/demos&feature=quantum-safe-demo">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Link>
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground pt-2">
          Free trial includes access to all demos and documentation. No credit card required.
        </p>
      </CardContent>
    </Card>
  )
}

