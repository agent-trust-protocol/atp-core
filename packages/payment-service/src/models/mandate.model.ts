/**
 * Payment Mandate Models
 */

export interface IntentMandate {
  id: string;
  type: 'intent';
  userDid: string;
  agentDid: string;
  purpose: string;
  maxAmount: number;
  currency: string;
  restrictions?: {
    merchants?: string[];
    categories?: string[];
    dailyLimit?: number;
  };
  status: 'active' | 'revoked' | 'expired' | 'used';
  createdAt: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  verifiableCredential?: any;
}

export interface CartMandate {
  id: string;
  type: 'cart';
  intentMandateId: string;
  merchant: string;
  items: CartItem[];
  total: number;
  currency: string;
  cartHash: string;
  status: 'active' | 'revoked' | 'expired' | 'used';
  createdAt: Date;
  verifiableCredential?: any;
}

export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  currency: string;
  metadata?: Record<string, any>;
}

export type PaymentMandate = IntentMandate | CartMandate;

export interface PaymentTransaction {
  id: string;
  protocolType: 'ap2' | 'acp';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  userDid: string;
  agentDid: string;
  merchantId: string;
  amount: number;
  currency: string;
  mandateId?: string;
  checkoutSessionId?: string;
  paymentMethodId?: string;
  createdAt: Date;
  completedAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
  mockProcessorResponse?: any;
  mockTransactionId?: string;
  mockSuccess?: boolean;
}

export interface PaymentMethod {
  id: string;
  userDid: string;
  type: 'card' | 'bank' | 'crypto' | 'stablecoin';
  details: {
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    walletAddress?: string;
    blockchain?: string;
    tokenSymbol?: string;
    accountLast4?: string;
    routingNumber?: string;
    bankName?: string;
  };
  isDefault: boolean;
  status: 'active' | 'expired' | 'blocked';
  createdAt: Date;
  verifiedAt?: Date;
}

export interface PaymentPolicy {
  id: string;
  name: string;
  agentDid: string;
  maxTransactionAmount: number;
  dailyLimit?: number;
  monthlyLimit?: number;
  allowedMerchants?: string[];
  allowedCategories?: string[];
  blockedMerchants?: string[];
  requiresApproval: boolean;
  notificationThreshold?: number;
  status: 'active' | 'suspended' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface ACPCheckoutSession {
  id: string;
  merchantId: string;
  agentDid: string;
  status: 'created' | 'pending' | 'completed' | 'expired' | 'cancelled';
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
    name?: string;
  }>;
  subtotal: number;
  tax?: number;
  shipping?: number;
  total: number;
  currency: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  customerEmail?: string;
  paymentIntent?: string;
  sharedPaymentToken?: string;
  expiresAt: Date;
  createdAt: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}
