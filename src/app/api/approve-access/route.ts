import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { emailService } from '@/lib/email';
import crypto from 'crypto';

function isValidAdminToken(token: string | null): boolean {
  if (!token) return false;
  const adminSecret = process.env.ADMIN_API_SECRET;
  if (!adminSecret) {
    // Do not log the variable name in production to avoid telling an attacker
    // which config knob to target. The startup check in src/lib/auth.ts and
    // the runtime guard below already cover the misconfiguration path.
    return false;
  }
  const provided = token.startsWith('Bearer ') ? token.slice(7) : token;
  // Hash both sides so we can use constant-time comparison on equal-length
  // buffers regardless of input length. This avoids leaking the secret's
  // length through timing-side-channel observation.
  const providedHash = crypto.createHash('sha256').update(provided).digest();
  const expectedHash = crypto.createHash('sha256').update(adminSecret).digest();
  return crypto.timingSafeEqual(providedHash, expectedHash);
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
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

    // Look up waitlist entry
    const waitlistEntry = await queryOne<{
      id: string;
      first_name: string;
      last_name: string;
      status: string;
    }>(
      'SELECT id, first_name, last_name, status FROM waitlist WHERE email = $1',
      [email]
    );

    if (!waitlistEntry) {
      return NextResponse.json(
        { error: 'No waitlist entry found for this email' },
        { status: 404 }
      );
    }

    if (waitlistEntry.status === 'approved') {
      return NextResponse.json(
        { error: 'This user has already been approved' },
        { status: 409 }
      );
    }

    // Generate invite code
    const inviteCode = crypto.randomBytes(32).toString('base64url');
    const inviteId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Insert invite
    await query(
      `INSERT INTO invites (id, email, code, waitlist_id, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [inviteId, email, inviteCode, waitlistEntry.id, expiresAt.toISOString()]
    );

    // Update waitlist status
    await query(
      `UPDATE waitlist SET status = 'approved', reviewed_at = NOW() WHERE id = $1`,
      [waitlistEntry.id]
    );

    // Build signup URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const signupUrl = `${baseUrl}/signup?code=${inviteCode}`;

    // Send invite email
    await emailService.sendInviteEmail({
      firstName: waitlistEntry.first_name,
      lastName: waitlistEntry.last_name,
      email,
      signupUrl
    });

    console.log(`Access approved for: ${email} (invite code: ${inviteCode.slice(0, 8)}...)`);

    return NextResponse.json({
      success: true,
      message: `Access approved for ${email}. Invite email sent.`,
      email,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('Error approving access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
