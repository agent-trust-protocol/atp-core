import { NextRequest, NextResponse } from 'next/server'

// Simple hardcoded authentication for development/internal use
// In production, this would integrate with a proper auth system
const INTERNAL_ACCESS_KEY = process.env.ATP_CLOUD_ACCESS_KEY || 'atp-internal-dev-key-2024'

export function middleware(request: NextRequest) {
  // Only apply authentication to cloud dashboard routes
  if (!request.nextUrl.pathname.startsWith('/cloud')) {
    return NextResponse.next()
  }

  // Allow access to static assets and API routes for health checks
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api/health') ||
    request.nextUrl.pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Check for authentication
  const accessKey = request.headers.get('x-access-key') || 
                   request.cookies.get('atp-access-key')?.value ||
                   request.nextUrl.searchParams.get('access_key')

  // For development/internal access, allow with proper key
  if (accessKey === INTERNAL_ACCESS_KEY) {
    // Set cookie for subsequent requests
    const response = NextResponse.next()
    response.cookies.set('atp-access-key', INTERNAL_ACCESS_KEY, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })
    return response
  }

  // Block public access with informative message
  return new NextResponse(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <title>ATP Cloud Dashboard - Internal Access Only</title>
        <meta name="robots" content="noindex, nofollow">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a40 100%);
            color: #ffffff;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            text-align: center;
            max-width: 500px;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .logo {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, #00d4ff, #7b61ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          h1 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #ffffff;
          }
          p {
            color: #cccccc;
            line-height: 1.5;
            margin-bottom: 1rem;
          }
          .status {
            display: inline-block;
            background: #ff6b35;
            color: #ffffff;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-weight: 500;
            margin-top: 1rem;
          }
          .info {
            font-size: 0.875rem;
            color: #888888;
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }
          .access-hint {
            margin-top: 1rem;
            font-size: 0.75rem;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">ATP</div>
          <h1>Cloud Dashboard</h1>
          <p>This is an internal development dashboard for the Agent Trust Protocol Cloud Platform.</p>
          <p>Access is restricted to authorized personnel only.</p>
          <div class="status">Internal Access Only</div>
          <div class="access-hint">
            Add ?access_key=atp-internal-dev-key-2024 to the URL for development access
          </div>
          <div class="info">
            ATP v0.1.0-alpha - Internal Testing Phase<br>
            For access, contact the development team
          </div>
        </div>
      </body>
    </html>
    `,
    {
      status: 403,
      headers: {
        'Content-Type': 'text/html',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    }
  )
}

export const config = {
  matcher: [
    /*
     * Match all cloud dashboard routes
     */
    '/cloud/:path*',
  ],
}