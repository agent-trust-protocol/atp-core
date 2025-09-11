import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/portal', '/api/portal'];
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
    '/login',
    '/signup',
    '/api/portal/:path*'
  ]
};