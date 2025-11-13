import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import path from 'path';
import { randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'atp-dev-secret-change-in-production-2024';
const dbPath = path.join(process.cwd(), 'dev.db');

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      firstName,
      lastName,
      email,
      company,
      companySize,
      phone,
      useCase,
      password
    } = data;

    // Validate required fields
    if (!firstName || !lastName || !email || !company || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Open database
    const db = new Database(dbPath);

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM user WHERE email = ?').get(email);
    if (existingUser) {
      db.close();
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate user ID
    const userId = `user_${randomBytes(16).toString('hex')}`;
    const now = Date.now();

    // Insert user into database
    db.prepare(`
      INSERT INTO user (id, email, emailVerified, name, createdAt, updatedAt, plan, companyName)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      email,
      0, // emailVerified
      `${firstName} ${lastName}`,
      now,
      now,
      'trial',
      company
    );

    // Insert password into account table
    db.prepare(`
      INSERT INTO account (id, userId, accountId, providerId, password, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      `account_${randomBytes(16).toString('hex')}`,
      userId,
      email,
      'credential',
      hashedPassword,
      now,
      now
    );

    // Generate verification token (valid for 24 hours)
    const verificationToken = randomBytes(32).toString('hex');
    const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours from now

    // Store verification token
    db.prepare(`
      INSERT INTO verification (id, identifier, value, expiresAt, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      `verification_${randomBytes(16).toString('hex')}`,
      email,
      verificationToken,
      expiresAt,
      now,
      now
    );

    db.close();

    console.log('[SIGNUP] Verification token generated for:', email);
    console.log('[SIGNUP] Verification link: http://localhost:3030/verify-email?token=' + verificationToken);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId,
        email,
        name: `${firstName} ${lastName}`,
        company,
        plan: 'trial'
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        id: userId,
        email,
        name: `${firstName} ${lastName}`,
        company,
        emailVerified: false
      },
      // TODO: Remove this in production - send via email instead
      verificationLink: `http://localhost:3030/verify-email?token=${verificationToken}`
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
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
