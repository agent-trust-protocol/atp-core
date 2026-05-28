import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { checkApiAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    // The invite must be redeemed by the user it was issued to. Without an
    // authenticated session we can't bind the consumer to the invite, which
    // is the basis of the IDOR fix.
    const authResult = await checkApiAuth(request);
    if (!authResult.isAuthenticated) {
      return authResult.error!;
    }
    const sessionEmail = (authResult.user?.email ?? '').toLowerCase();
    if (!sessionEmail) {
      return NextResponse.json({ error: 'Session is missing an email' }, { status: 403 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    const invite = await queryOne<{ email: string }>(
      'SELECT email FROM invites WHERE code = $1 AND used_at IS NULL',
      [code]
    );

    if (!invite) {
      return NextResponse.json(
        { error: 'Invite code not found or already used' },
        { status: 404 }
      );
    }

    if (invite.email.toLowerCase() !== sessionEmail) {
      return NextResponse.json(
        { error: 'This invite was issued to a different account' },
        { status: 403 }
      );
    }

    const affected = await execute(
      'UPDATE invites SET used_at = NOW() WHERE code = $1 AND used_at IS NULL AND email = $2',
      [code, invite.email]
    );

    if (affected === 0) {
      // Race: another request consumed it between the SELECT and UPDATE.
      return NextResponse.json(
        { error: 'Invite code not found or already used' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error consuming invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
