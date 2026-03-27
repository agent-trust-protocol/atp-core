import { NextRequest, NextResponse } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/signup',
  '/request-access',
  '/api/request-access',
  '/api/invites/validate',
  '/api/webhooks',
  '/api/auth', // Better Auth endpoints
  '/auth/callback', // Magic link callback
  '/verify-email', // Email verification
  '/reset-password', // Password reset
  '/terms', // Legal pages
  '/privacy', // Legal pages
  '/developers',
  '/docs',
  '/examples',
  '/api-reference',
  '/api/health',
  '/maintenance',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/', // Homepage is public
  '/pricing',
  '/contact',
  '/enterprise',
  '/demos',
  '/policies',
  '/playground', // Public for developer acquisition
  '/integrations', // Integration docs
  '/sales-guide' // Sales materials - publicly accessible
];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route  }/`)
  );
}

// Check if maintenance mode is enabled
function isMaintenanceModeEnabled(): boolean {
  const envMaintenance = process.env.NEXT_PUBLIC_MAINTENANCE_MODE;
  return envMaintenance === 'true';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') ?? '';

  // Domain-based routing: agenttrust.dev → /developers
  if (hostname.includes('agenttrust.dev') && pathname === '/') {
    return NextResponse.redirect(new URL('/developers', request.url));
  }

  // Check maintenance mode first - highest priority
  const maintenanceEnabled = isMaintenanceModeEnabled();

  if (maintenanceEnabled) {
    const allowedRoutes = [
      '/maintenance', '/api/health', '/_next',
      '/favicon.ico', '/robots.txt', '/sitemap.xml',
    ];
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
  if (!isPublicRoute(pathname)) {
    // Check for Better Auth session cookie or demo token
    const sessionCookie = request.cookies.get('better-auth.session_token');
    const demoToken = request.cookies.get('atp_token');

    if (!sessionCookie && !demoToken) {
      // API routes return 401 JSON instead of redirecting
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // Redirect page routes to login with return URL
      const loginUrl = new URL('/login', request.url);
      if (pathname !== '/') {
        loginUrl.searchParams.set('returnTo', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml
     * - files with extensions (images, etc.)
     */
    // eslint-disable-next-line max-len
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'
  ]
};
