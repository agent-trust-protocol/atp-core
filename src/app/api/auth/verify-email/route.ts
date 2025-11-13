import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'dev.db');

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

    console.log('[VERIFY] Attempting to verify token:', token.substring(0, 10) + '...');

    const db = new Database(dbPath);
    const now = Date.now();

    // Find verification token
    const verification = db.prepare(`
      SELECT * FROM verification
      WHERE value = ? AND expiresAt > ?
    `).get(token, now) as any;

    if (!verification) {
      db.close();
      console.log('[VERIFY] Token not found or expired');
      return NextResponse.json(
        { success: false, message: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    const email = verification.identifier;
    console.log('[VERIFY] Token valid for email:', email);

    // Update user emailVerified status
    const result = db.prepare(`
      UPDATE user
      SET emailVerified = 1, updatedAt = ?
      WHERE email = ?
    `).run(now, email);

    if (result.changes === 0) {
      db.close();
      console.log('[VERIFY] User not found for email:', email);
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Delete the verification token (single use)
    db.prepare('DELETE FROM verification WHERE id = ?').run(verification.id);

    db.close();

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
