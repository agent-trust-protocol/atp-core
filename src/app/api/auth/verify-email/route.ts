import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Verification token is required' },
        { status: 400 }
      );
    }

    console.log('[VERIFY] Attempting to verify token:', `${token.substring(0, 10)  }...`);

    const pool = getPool();
    const now = new Date();

    // Find verification token
    const verifyResult = await pool.query(
      'SELECT * FROM verification WHERE value = $1 AND "expiresAt" > $2',
      [token, now]
    );
    const verification = verifyResult.rows[0];

    if (!verification) {
      console.log('[VERIFY] Token not found or expired');
      return NextResponse.json(
        { success: false, message: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    const email = verification.identifier;
    console.log('[VERIFY] Token valid for email:', email);

    // Update user emailVerified status
    const updateResult = await pool.query(
      'UPDATE "user" SET "emailVerified" = true, "updatedAt" = $1 WHERE email = $2',
      [now, email]
    );

    if (updateResult.rowCount === 0) {
      console.log('[VERIFY] User not found for email:', email);
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Delete the verification token (single use)
    await pool.query('DELETE FROM verification WHERE id = $1', [verification.id]);

    console.log('[VERIFY] Email verified successfully for:', email);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      email
    });

  } catch (error) {
    console.error('[VERIFY] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
