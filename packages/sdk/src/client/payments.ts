/**
 * ATP Payment Protocol Integration
 *
 * Supports:
 * - Google's Agent Payments Protocol (AP2)
 * - OpenAI's Agentic Commerce Protocol (ACP)
 *
 * Enables AI agents to securely initiate and complete payments
 * with cryptographic verification and audit trails.
 */

import { BaseClient } from './base';
import { CryptoUtils } from '../utils/crypto';
import type {
  ATPConfig,
  ATPResponse,
  PaymentMandate,
  IntentMandate,
  CartMandate,
  PaymentTransaction,
  PaymentMethod,
  PaymentResult,
  ACPCheckoutSession,
  PaymentPolicy
} from '../types';

export class PaymentsClient extends BaseClient {
  constructor(config: ATPConfig) {
    super(config, 'payments');
  }

  /**
   * Helper to unwrap ATPResponse to { data: T }
   */
  private unwrapResponse<T>(response: ATPResponse<T>): { data: T } {
    if (!response.data) {
      throw new Error(response.error || 'No data in response');
    }
    return { data: response.data };
  }

  /**
   * AP2 (Agent Payments Protocol) Integration
   */

  /**
   * Create an Intent Mandate for user payment authorization
   * @param params Intent mandate parameters
   * @returns Signed intent mandate with verifiable credentials
   */
  async createIntentMandate(params: {
    userDid: string;
    agentDid: string;
    purpose: string;
    maxAmount?: number;
    currency?: string;
    expiresAt?: Date;
    restrictions?: {
      merchants?: string[];
      categories?: string[];
      dailyLimit?: number;
    };
  }): Promise<{ data: IntentMandate }> {
    // Create mandate with user's authorization
    const mandate = {
      id: CryptoUtils.generateId(),
      type: 'intent',
      userDid: params.userDid,
      agentDid: params.agentDid,
      purpose: params.purpose,
      maxAmount: params.maxAmount,
      currency: params.currency || 'USD',
      restrictions: params.restrictions,
      createdAt: new Date().toISOString(),
      expiresAt: params.expiresAt?.toISOString(),
      status: 'active'
    };

    // Sign with verifiable credential
    const signature = await this.signMandate(mandate);

    const response = await this.post<IntentMandate>('/ap2/mandates/intent', {
      mandate,
      signature,
      verifiableCredential: await this.createMandateCredential(mandate)
    });
    return this.unwrapResponse(response);
  }

  /**
   * Create a Cart Mandate for specific transaction
   * @param params Cart mandate parameters
   * @returns Signed cart mandate
   */
  async createCartMandate(params: {
    intentMandateId: string;
    merchant: string;
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      price: number;
      currency: string;
    }>;
    total: number;
    currency: string;
    paymentMethod: PaymentMethod;
  }): Promise<{ data: CartMandate }> {
    // Verify intent mandate is valid
    const intentMandate = await this.getMandate(params.intentMandateId);

    if (intentMandate.data.status !== 'active') {
      throw new Error('Intent mandate is not active');
    }

    // Create immutable cart mandate
    const cartMandate = {
      id: CryptoUtils.generateId(),
      type: 'cart',
      intentMandateId: params.intentMandateId,
      merchant: params.merchant,
      items: params.items,
      total: params.total,
      currency: params.currency,
      paymentMethod: params.paymentMethod,
      createdAt: new Date().toISOString(),
      hash: await this.hashCartMandate(params)
    };

    // Sign with verifiable credential
    const signature = await this.signMandate(cartMandate);

    const response = await this.post<CartMandate>('/ap2/mandates/cart', {
      mandate: cartMandate,
      signature,
      verifiableCredential: await this.createMandateCredential(cartMandate)
    });
    return this.unwrapResponse(response);
  }

  /**
   * Execute a payment using AP2 protocol
   * @param params Payment execution parameters
   * @returns Payment transaction result
   */
  async executeAP2Payment(params: {
    cartMandateId: string;
    paymentMethod: PaymentMethod;
    billingAddress?: any;
    metadata?: Record<string, any>;
  }): Promise<{ data: PaymentTransaction }> {
    // Verify cart mandate exists
    await this.getMandate(params.cartMandateId);

    // Execute payment with full audit trail
    const response = await this.post<PaymentTransaction>('/ap2/payments/execute', {
      cartMandateId: params.cartMandateId,
      paymentMethod: params.paymentMethod,
      billingAddress: params.billingAddress,
      metadata: params.metadata,
      timestamp: new Date().toISOString()
    });
    return this.unwrapResponse(response);
  }

  /**
   * ACP (Agentic Commerce Protocol) Integration
   */

  /**
   * Create an ACP checkout session for OpenAI commerce
   * @param params Checkout session parameters
   * @returns Checkout session with payment token
   */
  async createACPCheckout(params: {
    merchantId: string;
    agentDid: string;
    items: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
    }>;
    shippingAddress?: any;
    customerEmail?: string;
    metadata?: Record<string, any>;
  }): Promise<{ data: ACPCheckoutSession }> {
    const response = await this.post<ACPCheckoutSession>('/acp/checkout/create', {
      merchantId: params.merchantId,
      agentDid: params.agentDid,
      items: params.items,
      shippingAddress: params.shippingAddress,
      customerEmail: params.customerEmail,
      metadata: params.metadata,
      protocol: 'acp',
      timestamp: new Date().toISOString()
    });
    return this.unwrapResponse(response);
  }

  /**
   * Complete ACP checkout with payment authorization
   * @param params Checkout completion parameters
   * @returns Payment result
   */
  async completeACPCheckout(params: {
    sessionId: string;
    paymentMethodId: string;
    sharedPaymentToken?: string;
  }): Promise<{ data: PaymentResult }> {
    const response = await this.post<PaymentResult>('/acp/checkout/complete', {
      sessionId: params.sessionId,
      paymentMethodId: params.paymentMethodId,
      sharedPaymentToken: params.sharedPaymentToken,
      timestamp: new Date().toISOString()
    });
    return this.unwrapResponse(response);
  }

  /**
   * Shared Payment Management
   */

  /**
   * Add a payment method with ATP verification
   * @param params Payment method parameters
   * @returns Payment method record
   */
  async addPaymentMethod(params: {
    userDid: string;
    type: 'card' | 'bank' | 'crypto' | 'stablecoin';
    details: {
      // For cards
      last4?: string;
      brand?: string;
      expiryMonth?: number;
      expiryYear?: number;
      // For crypto
      walletAddress?: string;
      blockchain?: string;
      // For bank
      accountLast4?: string;
      routingNumber?: string;
    };
    isDefault?: boolean;
  }): Promise<{ data: PaymentMethod }> {
    const response = await this.post<PaymentMethod>('/payments/methods', {
      userDid: params.userDid,
      type: params.type,
      details: params.details,
      isDefault: params.isDefault,
      verifiedAt: new Date().toISOString()
    });
    return this.unwrapResponse(response);
  }

  /**
   * Payment Policy Management
   */

  /**
   * Create a payment policy for agent authorization
   * @param params Policy parameters
   * @returns Payment policy
   */
  async createPaymentPolicy(params: {
    name: string;
    agentDid: string;
    maxTransactionAmount: number;
    dailyLimit?: number;
    monthlyLimit?: number;
    allowedMerchants?: string[];
    allowedCategories?: string[];
    requiresApproval?: boolean;
    notificationThreshold?: number;
  }): Promise<{ data: PaymentPolicy }> {
    const response = await this.post<PaymentPolicy>('/payments/policies', {
      name: params.name,
      agentDid: params.agentDid,
      limits: {
        maxTransactionAmount: params.maxTransactionAmount,
        dailyLimit: params.dailyLimit,
        monthlyLimit: params.monthlyLimit
      },
      allowedMerchants: params.allowedMerchants,
      allowedCategories: params.allowedCategories,
      requiresApproval: params.requiresApproval !== false,
      notificationThreshold: params.notificationThreshold,
      createdAt: new Date().toISOString(),
      status: 'active'
    });
    return this.unwrapResponse(response);
  }

  /**
   * Query payment transactions with audit trail
   * @param params Query parameters
   * @returns Payment transactions
   */
  async queryTransactions(params: {
    userDid?: string;
    agentDid?: string;
    merchantId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: 'pending' | 'completed' | 'failed' | 'refunded';
    minAmount?: number;
    maxAmount?: number;
  }): Promise<{ data: PaymentTransaction[] }> {
    const response = await this.get<PaymentTransaction[]>('/payments/transactions', {
      params: {
        userDid: params.userDid,
        agentDid: params.agentDid,
        merchantId: params.merchantId,
        startDate: params.startDate?.toISOString(),
        endDate: params.endDate?.toISOString(),
        status: params.status,
        minAmount: params.minAmount,
        maxAmount: params.maxAmount
      }
    });
    return this.unwrapResponse(response);
  }

  /**
   * Get payment mandate by ID
   * @param mandateId Mandate identifier
   * @returns Payment mandate
   */
  async getMandate(mandateId: string): Promise<{ data: PaymentMandate }> {
    const response = await this.get<PaymentMandate>(`/ap2/mandates/${mandateId}`);
    return this.unwrapResponse(response);
  }

  /**
   * Revoke a payment mandate
   * @param mandateId Mandate identifier
   * @returns Revocation result
   */
  async revokeMandate(mandateId: string): Promise<{ data: { success: boolean } }> {
    const response = await this.post<{ success: boolean }>(`/ap2/mandates/${mandateId}/revoke`, {
      revokedAt: new Date().toISOString()
    });
    return this.unwrapResponse(response);
  }

  /**
   * Helper Methods
   */

  private async signMandate(mandate: any): Promise<string> {
    const payload = JSON.stringify(mandate);
    return CryptoUtils.sign(payload, this.config.auth?.privateKey || '');
  }

  private async hashCartMandate(cart: any): Promise<string> {
    const data = JSON.stringify(cart);
    return CryptoUtils.hash(data);
  }

  private async createMandateCredential(mandate: any): Promise<any> {
    // Create a verifiable credential for the mandate
    return {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'PaymentMandateCredential'],
      issuer: this.config.auth?.did,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: mandate.id,
        type: mandate.type,
        mandate: mandate
      }
    };
  }
}
