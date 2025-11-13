import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// This would integrate with your EnterpriseOnboardingService
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

    // Check if email already exists (in production)
    // const existingUser = await findUserByEmail(email);
    // if (existingUser) {
    //   return NextResponse.json(
    //     { message: 'Email already registered' },
    //     { status: 409 }
    //   );
    // }

    // Create trial account (in production, this calls your EnterpriseOnboardingService)
    const trialData = {
      company,
      contactName: `${firstName} ${lastName}`,
      email,
      phone,
      companySize,
      useCase,
      timeline: 'immediate'
    };

    // Generate API credentials for trial
    const apiKey = `atp_trial_${randomBytes(16).toString('hex')}`;
    const apiSecret = randomBytes(32).toString('base64');
    
    // In production, call your service:
    // const trial = await enterpriseOnboarding.processDemoRequest(trialData);

    // Send welcome email
    const emailData = {
      firstName,
      email,
      company,
      apiKey,
      apiSecret,
      portalUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/portal`,
      trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toDateString()
    };

    // In production:
    // await emailService.sendWelcomeEmail(email, emailData);

    // For demo, simulate successful account creation
    console.log('Trial account created:', {
      email,
      company,
      apiKey: apiKey.slice(0, 20) + '...',
    });

    return NextResponse.json({
      success: true,
      message: 'Trial account created successfully',
      trialId: `trial_${randomBytes(8).toString('hex')}`,
      credentials: {
        apiKey,
        portalUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/portal`
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'Failed to create account' },
      { status: 500 }
    );
  }
}