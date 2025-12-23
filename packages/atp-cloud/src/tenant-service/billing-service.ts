/**
 * ATP Cloud Billing Service
 * Handles billing, subscriptions, and usage tracking
 */

import Stripe from 'stripe';
import { db } from '../shared/database.js';
import { config } from '../shared/config.js';
import { createServiceLogger } from '../shared/logger.js';
import { Tenant, TenantPlan, BillingEvent, TenantError } from '../types/index.js';

const logger = createServiceLogger('billing-service');

export interface UsageSummary {
  tenantId: string;
  period: {
    start: Date;
    end: Date;
  };
  requests: {
    total: number;
    byService: Record<string, number>;
    overageRequests: number;
  };
  storage: {
    current: number;
    average: number;
    overageGB: number;
  };
  bandwidth: {
    total: number;
    overageGB: number;
  };
  cost: {
    basePlan: number;
    overageCharges: number;
    total: number;
    currency: string;
  };
}

export class BillingService {
  private stripe: Stripe | null = null;

  constructor() {
    const cloudConfig = config.getConfig();
    if (cloudConfig.billing.stripeSecretKey) {
      this.stripe = new Stripe(cloudConfig.billing.stripeSecretKey, {
        apiVersion: '2023-10-16'
      });
    } else {
      logger.warn('Stripe not configured - billing features disabled');
    }
  }

  /**
   * Get tenant usage summary for billing period
   */
  public async getTenantUsage(tenantId: string, startDate: Date, endDate: Date): Promise<UsageSummary> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    try {
      // Get tenant to know plan limits
      const tenant = await database.collection('tenants').findOne({ id: tenantId });
      if (!tenant) {
        throw new TenantError('Tenant not found', tenantId, 'NOT_FOUND');
      }

      // Aggregate usage data
      const usageAggregation = await database.collection('usage_events').aggregate([
        {
          $match: {
            tenantId,
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            totalBandwidth: { $sum: { $add: ['$requestSize', '$responseSize'] } },
            serviceBreakdown: {
              $push: {
                service: '$service',
                requests: 1
              }
            }
          }
        }
      ]).toArray();

      const usage = usageAggregation[0] || {
        totalRequests: 0,
        totalBandwidth: 0,
        serviceBreakdown: []
      };

      // Calculate service breakdown
      const serviceStats: Record<string, number> = {};
      usage.serviceBreakdown?.forEach((item: any) => {
        serviceStats[item.service] = (serviceStats[item.service] || 0) + 1;
      });

      // Calculate overages
      const planLimits = this.getPlanLimits(tenant.plan);
      const overageRequests = Math.max(0, usage.totalRequests - planLimits.maxRequests);
      const overageBandwidthBytes = Math.max(0, usage.totalBandwidth - (planLimits.maxBandwidth * 1024 * 1024));
      const overageStorageBytes = Math.max(0, tenant.usage.currentStorage - (planLimits.maxStorage * 1024 * 1024));

      // Calculate costs
      const basePlanCost = this.getPlanPrice(tenant.plan);
      const requestOverageCost = overageRequests * 0.001; // $0.001 per extra request
      const bandwidthOverageCost = (overageBandwidthBytes / (1024 * 1024 * 1024)) * 0.10; // $0.10 per GB
      const storageOverageCost = (overageStorageBytes / (1024 * 1024 * 1024)) * 0.05; // $0.05 per GB per month

      const totalOverageCost = requestOverageCost + bandwidthOverageCost + storageOverageCost;

      return {
        tenantId,
        period: { start: startDate, end: endDate },
        requests: {
          total: usage.totalRequests,
          byService: serviceStats,
          overageRequests
        },
        storage: {
          current: tenant.usage.currentStorage,
          average: tenant.usage.currentStorage, // Simplified - would need time-series data
          overageGB: overageStorageBytes / (1024 * 1024 * 1024)
        },
        bandwidth: {
          total: usage.totalBandwidth,
          overageGB: overageBandwidthBytes / (1024 * 1024 * 1024)
        },
        cost: {
          basePlan: basePlanCost,
          overageCharges: totalOverageCost,
          total: basePlanCost + totalOverageCost,
          currency: 'usd'
        }
      };
    } catch (error) {
      logger.error('Failed to get tenant usage', { error, tenantId });
      throw error;
    }
  }

  /**
   * Get billing summary for tenant
   */
  public async getBillingSummary(tenantId: string): Promise<{
    tenant: {
      id: string;
      name: string;
      plan: string;
      status: string;
    };
    currentUsage: UsageSummary;
    billingHistory: Array<{
      period: string;
      amount: number;
      status: string;
      date: Date;
    }>;
    upcomingInvoice: {
      amount: number;
      dueDate: Date;
      items: Array<{
        description: string;
        amount: number;
      }>;
    } | null;
  }> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    const tenant = await database.collection('tenants').findOne({ id: tenantId });
    if (!tenant) {
      throw new TenantError('Tenant not found', tenantId, 'NOT_FOUND');
    }

    // Get current month usage
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentUsage = await this.getTenantUsage(tenantId, startOfMonth, now);

    // Get billing history
    const billingHistory = await database.collection('billing_events')
      .find({ tenantId, eventType: 'invoice_created' })
      .sort({ timestamp: -1 })
      .limit(12)
      .toArray();

    const formattedHistory = billingHistory.map(event => ({
      period: event.metadata?.period || 'Unknown',
      amount: event.amount,
      status: event.metadata?.status || 'paid',
      date: event.timestamp
    }));

    // Calculate upcoming invoice
    const upcomingInvoice = this.calculateUpcomingInvoice(currentUsage);

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        plan: tenant.plan,
        status: tenant.status
      },
      currentUsage,
      billingHistory: formattedHistory,
      upcomingInvoice
    };
  }

  /**
   * Change tenant plan
   */
  public async changePlan(tenantId: string, newPlan: TenantPlan): Promise<{
    success: boolean;
    oldPlan: TenantPlan;
    newPlan: TenantPlan;
    priceChange: number;
    effectiveDate: Date;
  }> {
    const database = db.getDB();
    if (!database) {
      throw new Error('Database not connected');
    }

    const tenant = await database.collection('tenants').findOne({ id: tenantId });
    if (!tenant) {
      throw new TenantError('Tenant not found', tenantId, 'NOT_FOUND');
    }

    const oldPlan = tenant.plan;
    const oldPrice = this.getPlanPrice(oldPlan);
    const newPrice = this.getPlanPrice(newPlan);
    const priceChange = newPrice - oldPrice;

    try {
      // Update tenant plan and limits
      const newLimits = this.getPlanLimits(newPlan);
      
      await database.collection('tenants').updateOne(
        { id: tenantId },
        {
          $set: {
            plan: newPlan,
            'limits.maxAgents': newLimits.maxAgents,
            'limits.maxRequests': newLimits.maxRequests,
            'limits.maxStorage': newLimits.maxStorage,
            'limits.maxBandwidth': newLimits.maxBandwidth,
            'billing.planPrice': newPrice,
            updatedAt: new Date()
          }
        }
      );

      // Record billing event
      const billingEvent: BillingEvent = {
        tenantId,
        eventType: 'plan_changed',
        amount: priceChange,
        currency: 'usd',
        description: `Plan changed from ${oldPlan} to ${newPlan}`,
        metadata: {
          oldPlan,
          newPlan,
          oldPrice,
          newPrice
        },
        timestamp: new Date()
      };

      await database.collection('billing_events').insertOne(billingEvent);

      // Update Stripe subscription if configured
      if (this.stripe && tenant.billing?.subscriptionId) {
        await this.updateStripeSubscription(tenant.billing.subscriptionId, newPlan);
      }

      logger.info('Tenant plan changed', {
        tenantId,
        oldPlan,
        newPlan,
        priceChange
      });

      return {
        success: true,
        oldPlan,
        newPlan,
        priceChange,
        effectiveDate: new Date()
      };
    } catch (error) {
      logger.error('Failed to change tenant plan', { error, tenantId, newPlan });
      throw new TenantError('Failed to change plan', tenantId, 'PLAN_CHANGE_FAILED');
    }
  }

  /**
   * Handle Stripe webhook events
   */
  public async handleStripeWebhook(payload: any, headers: any): Promise<void> {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    const cloudConfig = config.getConfig();
    const sig = headers['stripe-signature'];

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        sig,
        cloudConfig.billing.webhookSecret
      );

      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        default:
          logger.debug('Unhandled Stripe webhook event', { type: event.type });
      }
    } catch (error) {
      logger.error('Stripe webhook processing failed', { error });
      throw error;
    }
  }

  private async handlePaymentSucceeded(invoice: any): Promise<void> {
    const database = db.getDB();
    if (!database) return;

    const customerId = invoice.customer;
    const tenant = await database.collection('tenants').findOne({
      'billing.customerId': customerId
    });

    if (tenant) {
      const billingEvent: BillingEvent = {
        tenantId: tenant.id,
        eventType: 'payment_processed',
        amount: invoice.amount_paid / 100, // Convert from cents
        currency: invoice.currency,
        description: 'Payment processed successfully',
        metadata: {
          invoiceId: invoice.id,
          stripeCustomerId: customerId
        },
        timestamp: new Date()
      };

      await database.collection('billing_events').insertOne(billingEvent);
      
      logger.info('Payment processed', {
        tenantId: tenant.id,
        amount: invoice.amount_paid / 100,
        invoiceId: invoice.id
      });
    }
  }

  private async handlePaymentFailed(invoice: any): Promise<void> {
    const database = db.getDB();
    if (!database) return;

    const customerId = invoice.customer;
    const tenant = await database.collection('tenants').findOne({
      'billing.customerId': customerId
    });

    if (tenant) {
      // Suspend tenant after failed payment
      await database.collection('tenants').updateOne(
        { id: tenant.id },
        {
          $set: {
            status: 'suspended',
            suspendedAt: new Date(),
            suspensionReason: 'Payment failed'
          }
        }
      );

      logger.warn('Tenant suspended due to failed payment', {
        tenantId: tenant.id,
        invoiceId: invoice.id
      });
    }
  }

  private async handleSubscriptionDeleted(subscription: any): Promise<void> {
    const database = db.getDB();
    if (!database) return;

    const customerId = subscription.customer;
    const tenant = await database.collection('tenants').findOne({
      'billing.customerId': customerId
    });

    if (tenant) {
      // Downgrade to free plan
      await database.collection('tenants').updateOne(
        { id: tenant.id },
        {
          $set: {
            plan: 'free',
            'billing.subscriptionId': null,
            'billing.planPrice': 0
          }
        }
      );

      logger.info('Tenant downgraded to free plan', {
        tenantId: tenant.id,
        subscriptionId: subscription.id
      });
    }
  }

  private async updateStripeSubscription(subscriptionId: string, newPlan: TenantPlan): Promise<void> {
    if (!this.stripe) return;

    const planPriceId = this.getStripePriceId(newPlan);
    if (!planPriceId) return;

    try {
      await this.stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscriptionId,
          price: planPriceId
        }]
      });

      logger.info('Stripe subscription updated', { subscriptionId, newPlan });
    } catch (error) {
      logger.error('Failed to update Stripe subscription', { error, subscriptionId, newPlan });
    }
  }

  private getPlanLimits(plan: TenantPlan): {
    maxAgents: number;
    maxRequests: number;
    maxStorage: number;
    maxBandwidth: number;
  } {
    const limits = {
      free: { maxAgents: 10, maxRequests: 5000, maxStorage: 100, maxBandwidth: 1000 },
      starter: { maxAgents: 25, maxRequests: 25000, maxStorage: 5000, maxBandwidth: 25000 },
      professional: { maxAgents: 100, maxRequests: 250000, maxStorage: 50000, maxBandwidth: 250000 },
      enterprise: { maxAgents: 1000, maxRequests: 2500000, maxStorage: 500000, maxBandwidth: 2500000 }
    };
    
    return limits[plan];
  }

  private getPlanPrice(plan: TenantPlan): number {
    const prices = {
      free: 0,
      starter: 250, // $3,000/year
      professional: 1500, // $18,000/year  
      enterprise: 4167 // $50,000/year minimum
    };
    
    return prices[plan];
  }

  private getStripePriceId(plan: TenantPlan): string | null {
    // These would be actual Stripe Price IDs in production
    const priceIds = {
      free: null,
      starter: 'price_starter_monthly',
      professional: 'price_professional_monthly',
      enterprise: 'price_enterprise_monthly'
    };
    
    return priceIds[plan];
  }

  private calculateUpcomingInvoice(usage: UsageSummary): {
    amount: number;
    dueDate: Date;
    items: Array<{ description: string; amount: number }>;
  } | null {
    if (usage.cost.total === 0) {
      return null;
    }

    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 1);
    dueDate.setDate(1); // First of next month

    const items = [];
    
    if (usage.cost.basePlan > 0) {
      items.push({
        description: 'Base plan',
        amount: usage.cost.basePlan
      });
    }

    if (usage.cost.overageCharges > 0) {
      items.push({
        description: 'Usage overages',
        amount: usage.cost.overageCharges
      });
    }

    return {
      amount: usage.cost.total,
      dueDate,
      items
    };
  }
}