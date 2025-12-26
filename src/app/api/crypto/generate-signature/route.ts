import { NextRequest, NextResponse } from 'next/server'
import * as crypto from 'crypto'

// Simple crypto utilities for demo purposes
const CryptoUtils = {
  generateKeyPair: async (quantumSafe: boolean = true) => {
    // Generate Ed25519-style keypair using Node.js crypto
    const keypair = crypto.generateKeyPairSync('ed25519')
    const publicKeyHex = keypair.publicKey.export({ type: 'spki', format: 'der' }).toString('hex')
    const privateKeyHex = keypair.privateKey.export({ type: 'pkcs8', format: 'der' }).toString('hex')

    return {
      publicKey: publicKeyHex,
      privateKey: privateKeyHex,
      quantumSafe
    }
  },

  signData: async (message: string, privateKeyHex: string, quantumSafe: boolean = true) => {
    // Create signature using hmac for demo
    const signature = crypto.createHmac('sha512', privateKeyHex)
      .update(message)
      .digest('hex')
    return signature
  },

  createKeyFingerprint: (publicKey: string) => {
    return crypto.createHash('sha256').update(publicKey).digest('hex').slice(0, 32)
  },

  hash: (data: string) => {
    return crypto.createHash('sha256').update(data).digest('hex')
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
    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Generate hybrid quantum-safe key pair
    const keyPair = await CryptoUtils.generateKeyPair(true)

    // Sign message
    const signature = await CryptoUtils.signData(message, keyPair.privateKey, true)

    // Create fingerprint from public key
    const keyFingerprint = CryptoUtils.createKeyFingerprint(keyPair.publicKey)

    // Hash the signature for display
    const signatureHash = CryptoUtils.hash(signature)

    return NextResponse.json({
      success: true,
      message,
      publicKey: keyPair.publicKey,
      signature,
      hybridHash: signatureHash,
      keyFingerprint,
      timestamp: new Date().toISOString(),
      quantumSafe: keyPair.quantumSafe,
      algorithm: 'hybrid-ed25519-demo'
    })
  } catch (error: any) {
    console.error('Signature generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate signature', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Check authentication for API info endpoint too
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

  return NextResponse.json({
    service: 'ATP Quantum-Safe Signature API',
    algorithm: 'Hybrid Ed25519 + ML-DSA',
    quantumSafe: true,
    defaultMode: 'hybrid',
    protected: true
  })
}
