import { NextRequest, NextResponse } from 'next/server';

// In production, you'd store this in a database
// For now, we'll just log it and return success
// You can integrate with your CRM (HubSpot, Salesforce, etc.) or email service

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

    // TODO: In production, you would:
    // 1. Store the request in a database
    // 2. Send an email notification to your team
    // 3. Send a confirmation email to the requester
    // 4. Integrate with your CRM system
    // 5. Set up automated approval workflow if needed

    // For now, log the request (in production, save to database)
    console.log('Access Request Received:', {
      name: `${firstName} ${lastName}`,
      email,
      company,
      companySize,
      role,
      useCase,
      message,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });

    // TODO: Send email notification to your team
    // Example: await sendEmail({
    //   to: 'team@agenttrustprotocol.com',
    //   subject: `New ATP Access Request from ${firstName} ${lastName}`,
    //   body: `...`
    // });

    // TODO: Send confirmation email to requester
    // Example: await sendEmail({
    //   to: email,
    //   subject: 'ATP Access Request Received',
    //   body: `Thank you for your interest...`
    // });

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

