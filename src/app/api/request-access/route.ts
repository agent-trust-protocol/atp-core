import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { emailService } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      company,
      companySize,
      role,
      useCase,
      message
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !company || !companySize || !role || !useCase) {
      return NextResponse.json(
        { message: 'Please fill in all required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Check for existing waitlist entry
    const existing = await queryOne<{ status: string }>(
      'SELECT status FROM waitlist WHERE email = $1',
      [email]
    );

    if (existing) {
      if (existing.status === 'approved') {
        return NextResponse.json({
          success: true,
          message: 'Your access has already been approved. Check your email for the invite link.'
        });
      }
      return NextResponse.json({
        success: true,
        message: 'Your request has already been submitted. We\'ll review it shortly.'
      });
    }

    // Insert into waitlist
    const id = crypto.randomUUID();
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    await query(
      `INSERT INTO waitlist (id, email, first_name, last_name, company, company_size, role, use_case, message, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, email, firstName, lastName, company, companySize, role, useCase, message || null, ip]
    );

    // Send confirmation email to user
    await emailService.sendAccessRequestConfirmation({
      firstName,
      lastName,
      email
    });

    // Send notification to admin
    await emailService.sendAccessRequestNotification({
      firstName,
      lastName,
      email,
      company,
      companySize,
      role,
      useCase,
      message
    });

    return NextResponse.json({
      success: true,
      message: 'Access request submitted successfully'
    });

  } catch (error) {
    console.error('Error processing access request:', error);
    return NextResponse.json(
      { message: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
