import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Load maintenance config
let maintenanceConfig;
try {
  maintenanceConfig = require('./maintenance.config.js');
} catch (e) {
  maintenanceConfig = { enabled: false };
}

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
  '/api-reference',                  // Protect detailed API documentation
  '/api/crypto',                     // 🔒 CRITICAL IP: Quantum-safe crypto implementation
  '/api/policies',                   // 🔒 CRITICAL IP: Proprietary policy algorithms
  '/api/monitoring',                 // 🔒 IP: System architecture insights
  '/api/workflows'                   // 🔒 IP: Workflow system implementation
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('Middleware executing for:', pathname);

  // Check maintenance mode
  const isMaintenancePage = pathname === '/maintenance';

  if (maintenanceConfig.enabled && !isMaintenancePage) {
    console.log('Maintenance mode enabled - redirecting to /maintenance');
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }

  // If maintenance mode is off but user is on maintenance page, redirect to home
  if (!maintenanceConfig.enabled && isMaintenancePage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Skip auth check for Better Auth API routes
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Check if it's a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  console.log('Is protected route:', isProtectedRoute, 'for path:', pathname);

  // Check authentication via JWT token in cookie
  let isAuthenticated = false;
  const token = request.cookies.get('atp_token')?.value;

  if (token) {
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'atp-dev-secret-change-in-production-2024';
      jwt.verify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch (error) {
      console.log('Invalid JWT token:', error);
      isAuthenticated = false;
    }
  }

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    // Add IP protection notice
    if (!request.cookies.get('ip_protection_notice')) {
      loginUrl.searchParams.set('notice', 'ip_protected');
    }
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to portal if accessing auth routes with valid session
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/portal', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ]
};