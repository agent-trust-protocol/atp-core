import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// SECURITY NOTE: Demo users should be disabled in production
// In production, integrate with your identity provider (Auth0, Okta, etc.)
const isDevelopment = process.env.NODE_ENV !== 'production';
const users = isDevelopment ? [
  {
    id: '1',
    email: 'demo@company.com',
    password: 'demo123', // In production: use proper bcrypt hashing
    tenant: {
      id: 'tenant_1',
      name: 'Demo Company',
      plan: 'professional',
      status: 'trial'
    }
  }
] : [];

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Simple password check for demo (use bcrypt in production)
    if (password !== user.password) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create simple token for demo (use JWT in production)
    const token = Buffer.from(JSON.stringify({
      userId: user.id, 
      tenantId: user.tenant.id,
      email: user.email,
      exp: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    })).toString('base64');

    // Set cookie
    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email
      },
      tenant: user.tenant
    });

    response.cookies.set('atp_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}