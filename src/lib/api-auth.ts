import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * API Authentication utility for protecting sensitive endpoints
 * Prevents IP exposure by requiring authentication for valuable system data
 */

export interface AuthResult {
  isAuthenticated: boolean;
  error?: NextResponse;
}

export async function checkApiAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Check for authentication token in cookies
    const cookieStore = cookies();
    const token = cookieStore.get('atp_token');
    
    if (!token?.value) {
      return {
        isAuthenticated: false,
        error: NextResponse.json(
          { 
            error: 'Authentication required',
            message: 'This endpoint requires authentication. Please log in to access this data.',
            code: 'AUTH_REQUIRED'
          },
          { status: 401 }
        )
      };
    }

    // In production, you would verify the JWT token here
    // For now, we just check if token exists
    return { isAuthenticated: true };
  } catch (error) {
    return {
      isAuthenticated: false,
      error: NextResponse.json(
        {
          error: 'Authentication error',
          message: 'Failed to verify authentication',
          code: 'AUTH_ERROR'
        },
        { status: 500 }
      )
    };
  }
}

export function createUnauthorizedResponse(endpoint: string): NextResponse {
  return NextResponse.json(
    {
      error: 'Access denied',
      message: `Access to ${endpoint} requires premium subscription. Please upgrade to view this data.`,
      code: 'PREMIUM_REQUIRED',
      upgrade: {
        url: '/pricing',
        message: 'Upgrade to access advanced workflow and monitoring features'
      }
    },
    { status: 403 }
  );
}

export function createDemoResponse(endpoint: string): NextResponse {
  return NextResponse.json(
    {
      demo: true,
      message: `This is demo data for ${endpoint}. Upgrade for real-time data.`,
      data: {
        status: 'demo',
        timestamp: new Date().toISOString(),
        note: 'Real implementation requires authentication'
      }
    }
  );
}