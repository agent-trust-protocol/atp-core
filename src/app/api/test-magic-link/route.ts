import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('\n🧪 TEST: Attempting to send magic link to:', email);

    // Import and use the email service
    const { emailService } = await import('@/lib/email');
    
    // Generate a test token (in real flow, Better Auth does this)
    const testToken = 'test_' + Math.random().toString(36).substring(2, 15);
    const testUrl = `http://localhost:3000/api/auth/callback?token=${testToken}`;

    console.log('🔗 Test URL:', testUrl);

    const result = await emailService.sendMagicLinkEmail(email, testUrl);

    if (result) {
      console.log('✅ TEST PASSED: Magic link email sent successfully');
      return NextResponse.json({
        success: true,
        message: 'Magic link email sent successfully',
        email,
        testUrl
      });
    } else {
      console.log('❌ TEST FAILED: Email service returned false');
      return NextResponse.json(
        { error: 'Failed to send email. Check server logs.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ TEST ERROR:', error);
    return NextResponse.json(
      { error: 'Test failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
