import { NextRequest, NextResponse } from 'next/server'
import { CryptoUtils } from '../../../../../../packages/sdk/dist/utils/crypto.js'

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

    // Generate hybrid quantum-safe key pair (default is quantum-safe = true)
    const keyPair = await CryptoUtils.generateKeyPair(true)
    
    // Sign message with hybrid signature
    const signature = await CryptoUtils.signData(message, keyPair.privateKey, true)
    
    // Create fingerprint from public key
    const keyFingerprint = CryptoUtils.createKeyFingerprint(keyPair.publicKey)
    
    // Hash the signature for display
    const signatureHash = CryptoUtils.hash(signature)

    // Extract Ed25519 and ML-DSA components for display
    // Public key format: [ed25519(32)][ml_dsa(1952)] = 1984 bytes
    // Signature format: [ed25519_len(2)][ml_dsa_len(2)][ed25519_sig(64)][ml_dsa_sig(3293)]
    const publicKeyBuffer = Buffer.from(keyPair.publicKey, 'hex')
    const signatureBuffer = Buffer.from(signature, 'hex')
    
    const ed25519PublicKey = publicKeyBuffer.slice(0, 32).toString('hex')
    const mlDsaPublicKey = publicKeyBuffer.slice(32).toString('hex')
    
    // Extract signatures
    let ed25519Signature = ''
    let mlDsaSignature = ''
    
    if (signatureBuffer.length > 100) {
      // Hybrid signature
      const view = new DataView(signatureBuffer.buffer)
      const ed25519SigLen = view.getUint16(0, true)
      const mlDsaSigLen = view.getUint16(2, true)
      ed25519Signature = signatureBuffer.slice(4, 4 + ed25519SigLen).toString('hex')
      mlDsaSignature = signatureBuffer.slice(4 + ed25519SigLen, 4 + ed25519SigLen + mlDsaSigLen).toString('hex')
    } else {
      // Ed25519-only (fallback)
      ed25519Signature = signature
    }

    return NextResponse.json({
      success: true,
      message,
      publicKey: keyPair.publicKey,
      ed25519PublicKey,
      mlDsaPublicKey,
      signature,
      ed25519Signature,
      mlDsaSignature,
      hybridHash: signatureHash,
      keyFingerprint,
      timestamp: new Date().toISOString(),
      quantumSafe: keyPair.quantumSafe,
      algorithm: 'hybrid-ed25519-mldsa65'
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

