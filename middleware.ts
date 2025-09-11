import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication - IP Protection enabled
const protectedRoutes = [
  '/portal',
  '/api/portal',
  '/dashboard/agents',
  '/dashboard/workflows',           // PREMIUM: Workflow system (Startup+)
  '/dashboard/workflows/designer',   // PREMIUM: Visual workflow designer (Startup+) 
  '/dashboard/workflows/executions', // PREMIUM: Workflow executions (Startup+)
  '/dashboard/workflows/health',     // PREMIUM: Workflow monitoring (Professional+)
  '/dashboard/workflows/nodes',      // PREMIUM: Custom workflow nodes (Professional+)
  '/cloud',                          // PREMIUM: SaaS platform (Startup+)
  '/cloud/analytics',                // PREMIUM: Advanced analytics (Professional+)
  '/cloud/services',                 // PREMIUM: Cloud services (Startup+)
  '/cloud/tenants',                  // PREMIUM: Multi-tenancy (Enterprise+)
  '/monitoring',                     // PREMIUM: System monitoring (Professional+)
  '/policies',                       // Advanced policy features premium
  '/policy-editor',                  // PREMIUM: Visual policy editor (Professional+)
  '/policy-testing',                 // PREMIUM: Policy testing framework (Professional+)
  '/api-reference'                   // Protect detailed API documentation
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
  
  console.log('Middleware executing for:', pathname);
  
  // Check if it's a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  console.log('Is protected route:', isProtectedRoute, 'for path:', pathname);
  
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
};