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
      algorithm: 'hybrid-ed25519-mldsa65'
    })
  } catch (error: any) {
    console.error('Signature verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify signature', details: error.message },
      { status: 500 }
    )
  }
}

