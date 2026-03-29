import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');

    if (!code) {
      return NextResponse.json({ valid: false });
    }

    const invite = await queryOne<{ email: string }>(
      'SELECT email FROM invites WHERE code = $1 AND used_at IS NULL AND expires_at > NOW()',
      [code]
    );

    if (!invite) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true, email: invite.email });
  } catch (error) {
    console.error('Error validating invite:', error);
    return NextResponse.json({ valid: false });
  }
}
