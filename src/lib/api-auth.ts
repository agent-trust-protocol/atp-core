import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth';
import { 
  logApiAuthSuccess, 
  logApiAuthFailure,
  authLogger 
} from './auth-logger';
import { 
  rateLimiter, 
  getClientIp, 
  getUserAgent 
} from './rate-limiter';

/**
 * API Authentication utility for protecting sensitive endpoints
 * Uses Better Auth for secure session validation
 * Includes rate limiting and comprehensive logging
 */

export interface AuthResult {
  isAuthenticated: boolean;
  user?: any;
  session?: any;
  error?: NextResponse;
}

export async function checkApiAuth(request: NextRequest): Promise<AuthResult> {
  const ip = getClientIp(request);
  const userAgent = getUserAgent(request);
  const endpoint = new URL(request.url).pathname;

  try {
    // Check rate limit first
    const rateLimitResult = rateLimiter.check(ip, 'apiAuth', userAgent);
    
    if (!rateLimitResult.allowed) {
      logApiAuthFailure(ip, userAgent, endpoint, 'Rate limit exceeded');
      
      return {
        isAuthenticated: false,
        error: NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: rateLimitResult.retryAfter,
          },
          { 
            status: 429,
            headers: {
              'Retry-After': String(rateLimitResult.retryAfter || 60),
              'X-RateLimit-Limit': '60',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(Date.now() + (rateLimitResult.retryAfter || 60) * 1000),
            }
          }
        )
      };
    }

    // Verify session using Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      logApiAuthFailure(ip, userAgent, endpoint, 'No valid session');
      
      return {
        isAuthenticated: false,
        error: NextResponse.json(
          { 
            error: 'Authentication required',
            message: 'This endpoint requires authentication. Please log in to access this data.',
            code: 'AUTH_REQUIRED',
            loginUrl: '/login'
          },
          { status: 401 }
        )
      };
    }

    // Log successful authentication
    logApiAuthSuccess(session.user.id, ip, userAgent, endpoint);

    // Session is valid
    return { 
      isAuthenticated: true,
      user: session.user,
      session: session.session
    };
  } catch (error) {
    console.error('Authentication error:', error);
    logApiAuthFailure(ip, userAgent, endpoint, 'Internal error');
    
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