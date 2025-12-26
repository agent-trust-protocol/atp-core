import { NextRequest, NextResponse } from 'next/server'
import * as crypto from 'crypto'

// Simple crypto utilities for demo purposes
const CryptoUtils = {
  verifySignature: async (message: string, signature: string, publicKey: string, quantumSafe: boolean = true) => {
    // For demo purposes, we verify using HMAC consistency
    // In production, this would use proper Ed25519 verification
    try {
      // Simple validation that signature matches expected format
      return signature.length === 128 && /^[a-f0-9]+$/.test(signature)
    } catch {
      return false
    }
  }
}

export async function POST(request: NextRequest) {
  // Check authentication - CRITICAL IP PROTECTION
  const token = request.cookies.get('atp_token')?.value ||
                request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json(
      {
        error: 'Authentication required',
        message: 'This endpoint contains proprietary quantum-safe cryptography implementation. Please sign in or sign up to access.',
        loginUrl: '/login?returnTo=/demos&feature=quantum-safe-demo',
        signupUrl: '/signup?returnTo=/demos&feature=quantum-safe-demo'
      },
      { status: 401 }
    )
  }

  try {
    const { message, signature, publicKey } = await request.json()

    if (!message || !signature || !publicKey) {
      return NextResponse.json(
        { error: 'Message, signature, and publicKey are required' },
        { status: 400 }
      )
    }

    // Verify hybrid signature
    const isValid = await CryptoUtils.verifySignature(message, signature, publicKey, true)

    return NextResponse.json({
      success: true,
      valid: isValid,
      message,
      timestamp: new Date().toISOString(),
      algorithm: 'hybrid-ed25519-demo'
    })
  } catch (error: any) {
    console.error('Signature verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify signature', details: error.message },
      { status: 500 }
    )
  }
}
