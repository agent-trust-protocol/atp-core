import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    // Configure email service
    // Supports multiple providers: SendGrid, Resend, SMTP, etc.
    const emailProvider = process.env.EMAIL_PROVIDER || 'smtp';
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@agenttrustprotocol.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'Agent Trust Protocol';

    if (emailProvider === 'sendgrid' && process.env.SENDGRID_API_KEY) {
      // SendGrid via SMTP
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 465,
        secure: true,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
    } else if (emailProvider === 'resend' && process.env.RESEND_API_KEY) {
      // Resend API (using nodemailer with custom transport)
      // Note: For production, consider using @resend/node directly
      this.transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY
        }
      });
    } else if (process.env.SMTP_HOST) {
      // Generic SMTP
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        } : undefined
      });
    } else {
      console.warn('⚠️  No email service configured. Emails will be logged to console only.');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        // Log email instead of sending
        console.log('📧 Email (not sent - no transporter):', {
          to: options.to,
          subject: options.subject,
          text: options.text || options.html.substring(0, 100) + '...'
        });
        return true; // Return true so the flow continues
      }

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, '')
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  async sendAccessRequestNotification(request: {
    firstName: string;
    lastName: string;
    email: string;
    company: string;
    companySize: string;
    role: string;
    useCase: string;
    message?: string;
  }): Promise<boolean> {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@agenttrustprotocol.com';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
            .field { margin: 10px 0; }
            .label { font-weight: bold; color: #555; }
            .value { color: #333; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New ATP Access Request</h1>
            </div>
            <div class="content">
              <p>A new access request has been submitted for Agent Trust Protocol.</p>
              
              <div class="field">
                <span class="label">Name:</span>
                <span class="value">${request.firstName} ${request.lastName}</span>
              </div>
              
              <div class="field">
                <span class="label">Email:</span>
                <span class="value">${request.email}</span>
              </div>
              
              <div class="field">
                <span class="label">Company:</span>
                <span class="value">${request.company}</span>
              </div>
              
              <div class="field">
                <span class="label">Company Size:</span>
                <span class="value">${request.companySize}</span>
              </div>
              
              <div class="field">
                <span class="label">Role:</span>
                <span class="value">${request.role}</span>
              </div>
              
              <div class="field">
                <span class="label">Use Case:</span>
                <span class="value">${request.useCase}</span>
              </div>
              
              ${request.message ? `
              <div class="field">
                <span class="label">Message:</span>
                <span class="value">${request.message}</span>
              </div>
              ` : ''}
              
              <p style="margin-top: 30px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/access-requests" class="button">
                  Review Request
                </a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: `New ATP Access Request from ${request.firstName} ${request.lastName}`,
      html
    });
  }

  async sendAccessRequestConfirmation(request: {
    firstName: string;
    lastName: string;
    email: string;
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
            .info-box { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Access Request Received</h1>
            </div>
            <div class="content">
              <p>Hi ${request.firstName},</p>
              
              <p>Thank you for your interest in Agent Trust Protocol!</p>
              
              <p>We've received your access request and our team will review it shortly. You'll receive an email with your demo login credentials once your request is approved (typically within 1-2 business days).</p>
              
              <div class="info-box">
                <strong>What happens next?</strong>
                <ul>
                  <li>Our team reviews your request</li>
                  <li>You'll receive an email with demo login credentials</li>
                  <li>Access will be granted to the ATP platform</li>
                </ul>
              </div>
              
              <p>If you have any questions, please don't hesitate to reach out.</p>
              
              <p>Best regards,<br>The ATP Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: request.email,
      subject: 'ATP Access Request Received',
      html
    });
  }

  async sendMagicLinkEmail(email: string, url: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #00D9FF 0%, #0066FF 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
            .content { padding: 40px 30px; text-align: center; }
            .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #00D9FF 0%, #0066FF 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
            .button:hover { opacity: 0.9; }
            .expiry { color: #666; font-size: 14px; margin-top: 20px; }
            .security { color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
            .logo { font-size: 28px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <div class="logo">🔐</div>
                <h1>Sign in to ATP</h1>
              </div>
              <div class="content">
                <p>Click the button below to securely sign in to your Agent Trust Protocol account.</p>

                <a href="${url}" class="button">Sign In to ATP</a>

                <p class="expiry">This link expires in 15 minutes and can only be used once.</p>

                <p class="security">
                  If you didn't request this email, you can safely ignore it.<br>
                  Someone may have entered your email address by mistake.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Sign in to Agent Trust Protocol',
      html
    });
  }

  async sendAccessApprovedEmail(request: {
    firstName: string;
    lastName: string;
    email: string;
    loginUrl: string;
    credentials?: {
      email: string;
      password: string;
    };
  }): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
            .credentials-box { background: #fff3cd; border: 2px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Access Approved!</h1>
            </div>
            <div class="content">
              <p>Hi ${request.firstName},</p>
              
              <p>Great news! Your access request for Agent Trust Protocol has been approved.</p>
              
              ${request.credentials ? `
              <div class="credentials-box">
                <h3>Your Demo Credentials:</h3>
                <p><strong>Email:</strong> ${request.credentials.email}</p>
                <p><strong>Password:</strong> ${request.credentials.password}</p>
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                  ⚠️ Please keep these credentials secure and don't share them.
                </p>
              </div>
              ` : ''}
              
              <p>
                <a href="${request.loginUrl}" class="button">
                  Access ATP Platform
                </a>
              </p>
              
              <p>If you have any questions or need assistance, please don't hesitate to reach out.</p>
              
              <p>Welcome to ATP!<br>The ATP Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: request.email,
      subject: 'ATP Access Approved - Your Demo Credentials',
      html
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();

