import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin endpoint to approve user access
 * 
 * Usage: POST /api/approve-access
 * Body: { email: string }
 * 
 * This sets a cookie that allows the user to access the site.
 * In production, you'd want to:
 * 1. Add authentication/authorization to this endpoint
 * 2. Store approval status in a database
 * 3. Send email with login credentials
 * 4. Set expiration dates for access
 */

// Simple admin token validation (use proper auth in production)
function isValidAdminToken(token: string | null): boolean {
  if (!token) return false;
  const adminSecret = process.env.ADMIN_API_SECRET;
  if (!adminSecret) {
    console.error('ADMIN_API_SECRET not configured');
    return false;
  }
  return token.replace('Bearer ', '') === adminSecret;
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require admin authentication
    const authHeader = request.headers.get('authorization');
    if (!isValidAdminToken(authHeader)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // TODO: In production:
    // 1. Store approval in database with email, timestamp, expiration
    // 2. Send email to user with login credentials
    // 3. Log the approval action

    console.log(`Access approved for: ${email}`);

    // Return success - the admin will need to manually set the cookie
    // or use a different mechanism to grant access
    return NextResponse.json({
      success: true,
      message: `Access approved for ${email}. Set cookie 'atp-approved-access=true' for this user.`,
      instructions: [
        '1. Send login credentials to the user via email',
        '2. User can access the site with the credentials',
        '3. Or set cookie manually: atp-approved-access=true'
      ]
    });

  } catch (error) {
    console.error('Error approving access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

