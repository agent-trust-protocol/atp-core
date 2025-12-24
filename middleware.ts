import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/login(.*)',
  '/signup(.*)',
  '/request-access(.*)',
  '/api/request-access(.*)',
  '/api/webhooks(.*)', // Clerk webhooks
  '/developers(.*)',
  '/docs(.*)',
  '/examples(.*)',
  '/api-reference(.*)',
  '/api/health(.*)',
  '/maintenance(.*)',
  '/_next(.*)',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
]);

// Check if maintenance mode is enabled
function isMaintenanceModeEnabled(): boolean {
  const envMaintenance = process.env.NEXT_PUBLIC_MAINTENANCE_MODE;
  return envMaintenance === 'true';
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Domain-based routing: agenttrust.dev → /developers
  if (hostname.includes('agenttrust.dev') && pathname === '/') {
    return NextResponse.redirect(new URL('/developers', request.url));
  }

  // Check maintenance mode first - highest priority
  const maintenanceEnabled = isMaintenanceModeEnabled();
  
  if (maintenanceEnabled) {
    const allowedRoutes = ['/maintenance', '/api/health', '/_next', '/favicon.ico', '/robots.txt', '/sitemap.xml'];
    const isAllowedRoute = allowedRoutes.some(route => pathname.startsWith(route));
    
    if (isAllowedRoute) {
      return NextResponse.next();
    }

    // Redirect all other traffic to maintenance page
    if (pathname !== '/maintenance') {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
    
    return NextResponse.next();
  }

  // Protect routes that are not public
  if (!isPublicRoute(request)) {
    const { userId } = await auth();
    
    if (!userId) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', request.url);
      if (pathname !== '/') {
        loginUrl.searchParams.set('returnTo', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml
     * - files with extensions (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
