import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

interface CloudAccessRequest {
  name: string;
  email: string;
  company: string;
  phone?: string;
  useCase: string;
  agents?: string;
  timeline?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CloudAccessRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.email || !body.company || !body.useCase) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, company, useCase' },
        { status: 400 }
      );
    }

    // Email recipient - hardcoded for now, will be configurable via n8n later
    const recipientEmail = 'llewis@agenttrustprotocol.com';

    // Send notification email to sales team
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #00D9FF 0%, #0066FF 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
            .field { margin: 15px 0; padding: 10px; background: white; border-radius: 4px; }
            .label { font-weight: bold; color: #0066FF; display: block; margin-bottom: 5px; }
            .value { color: #333; }
            .badge { display: inline-block; padding: 4px 12px; background: #00D9FF; color: white; border-radius: 12px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>☁️ New ATP Cloud Platform Request</h1>
              <p>A potential client has requested access to ATP Cloud</p>
            </div>
            <div class="content">
              <div class="field">
                <span class="label">Contact Name</span>
                <span class="value">${body.name}</span>
              </div>

              <div class="field">
                <span class="label">Email Address</span>
                <span class="value"><a href="mailto:${body.email}">${body.email}</a></span>
              </div>

              <div class="field">
                <span class="label">Company</span>
                <span class="value">${body.company}</span>
              </div>

              ${body.phone ? `
              <div class="field">
                <span class="label">Phone</span>
                <span class="value">${body.phone}</span>
              </div>
              ` : ''}

              ${body.agents ? `
              <div class="field">
                <span class="label">Expected Number of Agents</span>
                <span class="value"><span class="badge">${body.agents}</span></span>
              </div>
              ` : ''}

              ${body.timeline ? `
              <div class="field">
                <span class="label">Deployment Timeline</span>
                <span class="value">${body.timeline}</span>
              </div>
              ` : ''}

              <div class="field">
                <span class="label">Primary Use Case</span>
                <span class="value">${body.useCase}</span>
              </div>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />

              <p style="font-size: 14px; color: #666;">
                <strong>Next Steps:</strong><br>
                Please respond to this lead within 24 hours. Reply directly to this email to contact the prospect.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailSent = await emailService.sendEmail({
      to: recipientEmail,
      subject: `🚀 ATP Cloud Request: ${body.company} (${body.agents || 'Size not specified'})`,
      html
    });

    // Also send confirmation to the requester
    const confirmationHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #00D9FF 0%, #0066FF 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }
            .check { color: #00C853; font-size: 48px; }
            .info-box { background: #E3F2FD; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="check">✓</div>
              <h1>Request Received!</h1>
            </div>
            <div class="content">
              <p>Hi ${body.name.split(' ')[0]},</p>

              <p>Thank you for your interest in <strong>ATP Cloud Platform</strong>!</p>

              <p>We've received your access request and our enterprise team will review it within <strong>24 hours</strong>.</p>

              <div class="info-box">
                <strong>What happens next?</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Our team will review your requirements</li>
                  <li>We'll schedule a personalized consultation</li>
                  <li>You'll receive access to a 14-day trial with full features</li>
                </ul>
              </div>

              <p>In the meantime, you can explore our <a href="https://agenttrustprotocol.com/developers">developer documentation</a> or check out our <a href="https://github.com/agent-trust-protocol/core">open source SDK</a>.</p>

              <p>Best regards,<br><strong>The ATP Team</strong></p>
            </div>
          </div>
        </body>
      </html>
    `;

    await emailService.sendEmail({
      to: body.email,
      subject: 'ATP Cloud Platform - Request Received',
      html: confirmationHtml
    });

    return NextResponse.json({
      success: true,
      message: 'Access request submitted successfully'
    });

  } catch (error) {
    console.error('Cloud access request error:', error);
    return NextResponse.json(
      { error: 'Failed to process access request' },
      { status: 500 }
    );
  }
}
