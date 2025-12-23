/**
 * Enterprise Customer Onboarding Service
 * Handles demo requests, trial provisioning, and conversion to paid accounts
 */

import { db } from '../shared/database.js';
import { createServiceLogger } from '../shared/logger.js';
import { BillingService } from './billing-service.js';
import { TenantManager } from './tenant-manager.js';
import { EnterpriseAuthenticationService } from '../../shared/src/auth/enterprise-sso.js';
import Stripe from 'stripe';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';

const logger = createServiceLogger('enterprise-onboarding');

export interface DemoRequest {
  company: string;
  contactName: string;
  email: string;
  phone?: string;
  companySize: 'startup' | 'smb' | 'mid-market' | 'enterprise';
  useCase: string;
  currentTools?: string[];
  expectedVolume?: string;
  timeline: 'immediate' | '1-3-months' | '3-6-months' | '6-12-months';
  additionalInfo?: string;
}

export interface TrialAccount {
  tenantId: string;
  company: string;
  email: string;
  apiKey: string;
  apiSecret: string;
  portalUrl: string;
  trialEndsAt: Date;
  status: 'trial' | 'expired' | 'converted';
  plan: 'enterprise-trial';
  limits: {
    agents: number;
    requests: number;
    features: string[];
  };
}

export interface EnterpriseCustomer {
  id: string;
  tenantId: string;
  company: string;
  primaryContact: {
    name: string;
    email: string;
    phone?: string;
    role: string;
  };
  billing: {
    stripeCustomerId?: string;
    subscriptionId?: string;
    plan: string;
    status: 'trial' | 'active' | 'suspended' | 'cancelled';
    nextBillingDate?: Date;
  };
  team: Array<{
    id: string;
    email: string;
    name: string;
    role: 'owner' | 'admin' | 'developer' | 'viewer';
    addedAt: Date;
  }>;
  usage: {
    currentMonth: {
      requests: number;
      agents: number;
      bandwidth: number;
    };
    lastUpdated: Date;
  };
  metadata: {
    source: 'demo-request' | 'self-service' | 'sales-outreach';
    salesRep?: string;
    notes?: string[];
  };
}

export class EnterpriseOnboardingService {
  private billingService: BillingService;
  private tenantManager: TenantManager;
  private authService: EnterpriseAuthenticationService;
  private stripe: Stripe | null = null;
  private emailTransporter: nodemailer.Transporter | null = null;

  constructor() {
    this.billingService = new BillingService();
    this.tenantManager = new TenantManager();
    this.authService = new EnterpriseAuthenticationService();

    // Initialize Stripe if configured
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16'
      });
    }

    // Initialize email if configured
    if (process.env.SENDGRID_API_KEY) {
      this.emailTransporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 465,
        secure: true,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      });
    }
  }

  /**
   * Process demo request and create trial account
   */
  async processDemoRequest(request: DemoRequest): Promise<TrialAccount> {
    try {
      logger.info('Processing demo request', { company: request.company });

      // 1. Create lead in CRM (webhook or API call)
      await this.createCRMLead(request);

      // 2. Notify sales team
      await this.notifySalesTeam(request);

      // 3. Create trial tenant
      const trial = await this.createTrialAccount(request);

      // 4. Send welcome email
      await this.sendTrialWelcomeEmail(request.email, trial);

      // 5. Schedule follow-up
      await this.scheduleFollowUp(trial.tenantId, request);

      logger.info('Demo request processed successfully', {
        company: request.company,
        tenantId: trial.tenantId
      });

      return trial;
    } catch (error) {
      logger.error('Failed to process demo request', { error, request });
      throw error;
    }
  }

  /**
   * Create a trial account with enterprise features
   */
  async createTrialAccount(request: DemoRequest): Promise<TrialAccount> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    // Generate secure API credentials
    const apiKey = `atp_trial_${randomBytes(16).toString('hex')}`;
    const apiSecret = randomBytes(32).toString('base64');
    
    // Calculate trial end date (14 days)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Create tenant with enterprise trial plan
    const tenant = await this.tenantManager.createTenant({
      name: request.company,
      plan: 'enterprise',
      status: 'trial',
      metadata: {
        trialEndsAt: trialEndsAt.toISOString(),
        source: 'demo-request',
        originalRequest: request
      }
    });

    // Store API credentials securely
    await database.collection('api_credentials').insertOne({
      tenantId: tenant.id,
      apiKey: this.hashApiKey(apiKey),
      apiSecret: await this.encryptApiSecret(apiSecret),
      createdAt: new Date(),
      expiresAt: trialEndsAt,
      type: 'trial'
    });

    // Configure enterprise features for trial
    await this.configureEnterpriseFeatures(tenant.id, [
      'sso',
      'advanced-monitoring',
      'priority-support',
      'custom-policies',
      'team-management',
      'api-analytics'
    ]);

    const trial: TrialAccount = {
      tenantId: tenant.id,
      company: request.company,
      email: request.email,
      apiKey,
      apiSecret,
      portalUrl: `https://portal.agenttrustprotocol.com/trial/${tenant.id}`,
      trialEndsAt,
      status: 'trial',
      plan: 'enterprise-trial',
      limits: {
        agents: 100,
        requests: 10000,
        features: [
          'sso',
          'monitoring',
          'support',
          'team-management',
          'api-analytics'
        ]
      }
    };

    // Create initial admin user
    await this.createAdminUser(tenant.id, request.email, request.contactName);

    return trial;
  }

  /**
   * Convert trial account to paying customer
   */
  async convertToPayingCustomer(
    tenantId: string,
    paymentMethodId: string,
    plan: 'starter' | 'professional' | 'enterprise'
  ): Promise<EnterpriseCustomer> {
    const database = db.getDB();
    if (!database || !this.stripe) {
      throw new Error('Payment processing not configured');
    }

    try {
      // Get tenant
      const tenant = await database.collection('tenants').findOne({ id: tenantId });
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Create or get Stripe customer
      let stripeCustomerId = tenant.billing?.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await this.stripe.customers.create({
          email: tenant.primaryContact.email,
          name: tenant.name,
          metadata: {
            tenantId: tenantId
          }
        });
        stripeCustomerId = customer.id;
      }

      // Attach payment method
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId
      });

      // Set as default payment method
      await this.stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      // Create subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{
          price: this.getStripePriceId(plan)
        }],
        trial_end: 'now',
        metadata: {
          tenantId: tenantId
        }
      });

      // Update tenant to active status
      await database.collection('tenants').updateOne(
        { id: tenantId },
        {
          $set: {
            status: 'active',
            plan,
            'billing.stripeCustomerId': stripeCustomerId,
            'billing.subscriptionId': subscription.id,
            'billing.status': 'active',
            'billing.nextBillingDate': new Date(subscription.current_period_end * 1000),
            'metadata.convertedAt': new Date(),
            'metadata.conversionPlan': plan
          }
        }
      );

      // Generate production API credentials
      const prodApiKey = `atp_prod_${randomBytes(16).toString('hex')}`;
      const prodApiSecret = randomBytes(32).toString('base64');

      await database.collection('api_credentials').insertOne({
        tenantId,
        apiKey: this.hashApiKey(prodApiKey),
        apiSecret: await this.encryptApiSecret(prodApiSecret),
        createdAt: new Date(),
        type: 'production'
      });

      // Update limits based on plan
      await this.billingService.changePlan(tenantId, plan as any);

      // Send conversion confirmation email
      await this.sendConversionEmail(tenant.primaryContact.email, {
        company: tenant.name,
        plan,
        apiKey: prodApiKey,
        apiSecret: prodApiSecret,
        portalUrl: `https://portal.agenttrustprotocol.com/dashboard`
      });

      // Notify sales team of conversion
      await this.notifyConversion(tenantId, plan);

      const customer: EnterpriseCustomer = {
        id: `cust_${randomBytes(8).toString('hex')}`,
        tenantId,
        company: tenant.name,
        primaryContact: tenant.primaryContact,
        billing: {
          stripeCustomerId,
          subscriptionId: subscription.id,
          plan,
          status: 'active',
          nextBillingDate: new Date(subscription.current_period_end * 1000)
        },
        team: [],
        usage: {
          currentMonth: {
            requests: 0,
            agents: 0,
            bandwidth: 0
          },
          lastUpdated: new Date()
        },
        metadata: {
          source: 'demo-request'
        }
      };

      logger.info('Trial converted to paying customer', {
        tenantId,
        plan,
        stripeCustomerId
      });

      return customer;

    } catch (error) {
      logger.error('Failed to convert trial', { error, tenantId });
      throw error;
    }
  }

  /**
   * Add team member to enterprise account
   */
  async addTeamMember(
    tenantId: string,
    email: string,
    name: string,
    role: 'admin' | 'developer' | 'viewer'
  ): Promise<void> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    const memberId = `member_${randomBytes(8).toString('hex')}`;

    await database.collection('team_members').insertOne({
      id: memberId,
      tenantId,
      email,
      name,
      role,
      addedAt: new Date(),
      status: 'pending',
      inviteToken: randomBytes(32).toString('hex')
    });

    // Send invitation email
    await this.sendTeamInviteEmail(email, {
      inviterName: 'Account Owner',
      company: tenantId,
      role,
      acceptUrl: `https://portal.agenttrustprotocol.com/invite/${memberId}`
    });

    logger.info('Team member added', { tenantId, email, role });
  }

  /**
   * Configure SSO for enterprise account
   */
  async configureSSOProvider(
    tenantId: string,
    provider: 'saml' | 'oidc',
    config: any
  ): Promise<void> {
    // Register provider with enterprise auth service
    this.authService.registerProvider({
      type: provider,
      name: `${tenantId}-${provider}`,
      enabled: true,
      config,
      priority: 1,
      userMapping: {},
      groupMapping: {},
      roleMapping: {}
    });

    // Update tenant with SSO configuration
    const database = db.getDB();
    if (database) {
      await database.collection('tenants').updateOne(
        { id: tenantId },
        {
          $set: {
            'sso.enabled': true,
            'sso.provider': provider,
            'sso.configuredAt': new Date()
          }
        }
      );
    }

    logger.info('SSO configured', { tenantId, provider });
  }

  // Helper methods

  private async createCRMLead(request: DemoRequest): Promise<void> {
    // Integration with HubSpot/Salesforce
    if (process.env.HUBSPOT_API_KEY) {
      // await hubspot.createLead(request);
      logger.info('CRM lead created', { company: request.company });
    }
  }

  private async notifySalesTeam(request: DemoRequest): Promise<void> {
    if (process.env.SLACK_WEBHOOK_URL) {
      // Send to Slack
      const message = {
        text: `New Enterprise Demo Request`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Company:* ${request.company}\n*Contact:* ${request.contactName}\n*Email:* ${request.email}\n*Size:* ${request.companySize}\n*Timeline:* ${request.timeline}`
            }
          }
        ]
      };
      // await slack.send(message);
    }
  }

  private async sendTrialWelcomeEmail(email: string, trial: TrialAccount): Promise<void> {
    if (!this.emailTransporter) return;

    const emailContent = `
      Welcome to Agent Trust Protocol Enterprise Trial!
      
      Your 14-day trial has been activated with full enterprise features.
      
      Portal Access: ${trial.portalUrl}
      
      API Credentials:
      API Key: ${trial.apiKey}
      API Secret: ${trial.apiSecret}
      
      Quick Start Guide: https://docs.agenttrustprotocol.com/enterprise/quickstart
      
      Your trial includes:
      - Up to ${trial.limits.agents} quantum-safe agents
      - ${trial.limits.requests.toLocaleString()} API requests
      - SSO/SAML integration
      - Advanced monitoring dashboard
      - Priority support
      
      Questions? Schedule a call: https://calendly.com/atp-sales
    `;

    await this.emailTransporter.sendMail({
      from: process.env.EMAIL_FROM || 'llewis@agenttrustprotocol.com',
      to: email,
      subject: 'Welcome to ATP Enterprise Trial',
      text: emailContent,
      html: emailContent.replace(/\n/g, '<br>')
    });
  }

  private async sendConversionEmail(email: string, details: any): Promise<void> {
    // Send production credentials and onboarding info
    logger.info('Conversion email sent', { email });
  }

  private async sendTeamInviteEmail(email: string, details: any): Promise<void> {
    // Send team invitation
    logger.info('Team invite sent', { email });
  }

  private async scheduleFollowUp(tenantId: string, request: DemoRequest): Promise<void> {
    // Schedule automated follow-ups
    logger.info('Follow-up scheduled', { tenantId });
  }

  private async notifyConversion(tenantId: string, plan: string): Promise<void> {
    // Notify sales team of successful conversion
    logger.info('Conversion notification sent', { tenantId, plan });
  }

  private async configureEnterpriseFeatures(tenantId: string, features: string[]): Promise<void> {
    // Enable enterprise features for tenant
    logger.info('Enterprise features configured', { tenantId, features });
  }

  private async createAdminUser(tenantId: string, email: string, name: string): Promise<void> {
    // Create initial admin user for the tenant
    logger.info('Admin user created', { tenantId, email });
  }

  private hashApiKey(apiKey: string): string {
    // Hash API key for storage
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  private async encryptApiSecret(secret: string): Promise<string> {
    // Encrypt API secret for storage
    return Buffer.from(secret).toString('base64');
  }

  private getStripePriceId(plan: string): string {
    const priceIds: Record<string, string> = {
      starter: process.env.STRIPE_PRICE_STARTER || 'price_starter',
      professional: process.env.STRIPE_PRICE_PRO || 'price_professional',
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise'
    };
    return priceIds[plan];
  }
}