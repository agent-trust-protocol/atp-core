import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'atp-dev-secret-change-in-production-2024';
const dbPath = path.join(process.cwd(), 'dev.db');

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('[LOGIN] Attempt for email:', email);

    // Validate input
    if (!email || !password) {
      console.log('[LOGIN] Missing email or password');
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Open database
    const db = new Database(dbPath);

    // Find user by email
    const user = db.prepare(`
      SELECT u.*, a.password
      FROM user u
      LEFT JOIN account a ON u.id = a.userId AND a.providerId = 'credential'
      WHERE u.email = ?
    `).get(email) as any;

    if (!user || !user.password) {
      db.close();
      console.log('[LOGIN] User not found or no password:', { userFound: !!user, hasPassword: !!user?.password });
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    console.log('[LOGIN] User found, verifying password...');
    console.log('[LOGIN] Password from form length:', password?.length);
    console.log('[LOGIN] Hashed password from DB:', user.password?.substring(0, 20) + '...');

    // Verify password with bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password);

    console.log('[LOGIN] Password verification result:', isValidPassword);

    if (!isValidPassword) {
      db.close();
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    db.close();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        company: user.companyName,
        plan: user.plan
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.companyName,
        plan: user.plan
      }
    });

    // Set HTTP-only cookie
    response.cookies.set('atp_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
