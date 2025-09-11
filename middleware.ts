import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication - IP Protection enabled
const protectedRoutes = [
  '/portal',
  '/api/portal',
  '/dashboard/agents',
  '/dashboard/workflows',
  '/cloud',
  '/monitoring',
  '/policies',
  '/policy-editor',
  '/policy-testing',
  '/api-reference'
];

// Public demo routes (no auth required)
const publicDemoRoutes = [
  '/dashboard', // Main dashboard shows demo data only
  '/',
  '/pricing',
  '/enterprise',
  '/contact',
  '/docs',
  '/examples',
  '/sales-guide'
];

const authRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if it's a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  // Get token from cookie or Authorization header
  const token = request.cookies.get('atp_token')?.value || 
                request.headers.get('Authorization')?.replace('Bearer ', '');
  
  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    // Add IP protection notice
    if (!request.cookies.get('ip_protection_notice')) {
      loginUrl.searchParams.set('notice', 'ip_protected');
    }
    return NextResponse.redirect(loginUrl);
  }
  
  // Redirect to portal if accessing auth routes with valid token
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/portal', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/portal/:path*',
    '/dashboard/:path*',
    '/cloud/:path*',
    '/monitoring/:path*',
    '/policies/:path*',
    '/policy-editor/:path*',
    '/policy-testing/:path*',
    '/api-reference/:path*',
    '/login',
    '/signup',
    '/api/portal/:path*'
  ]
};