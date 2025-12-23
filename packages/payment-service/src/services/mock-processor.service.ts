/**
 * Mock Payment Processor (MVP Only)
 * Simulates payment processing without moving real money
 */

import { CryptoUtils } from '../utils/crypto.js';

export interface MockPaymentParams {
  amount: number;
  currency: string;
  userDid: string;
  agentDid: string;
  merchantId: string;
  mandateId?: string;
  paymentMethodId?: string;
}

export interface MockPaymentResult {
  success: boolean;
  transactionId: string;
  status: 'completed' | 'failed';
  amount: number;
  currency: string;
  mockProcessorResponse: {
    processor: string;
    authCode: string;
    network: string;
    timestamp: string;
  };
  mockTransactionId: string;
  receipt?: {
    url: string;
    number: string;
  };
  error?: {
    code: string;
    message: string;
    details: string;
  };
}

export class MockPaymentProcessor {
  private static successRate = 0.9; // 90% success rate for realistic testing

  /**
   * Execute a mock payment
   */
  static async executePayment(params: MockPaymentParams): Promise<MockPaymentResult> {
    // Simulate network delay
    await this.delay(300 + Math.random() * 700); // 300-1000ms

    const success = Math.random() < this.successRate;
    const transactionId = CryptoUtils.generateId('mock_txn');

    if (success) {
      return {
        success: true,
        transactionId,
        status: 'completed',
        amount: params.amount,
        currency: params.currency,
        mockProcessorResponse: {
          processor: 'MOCK_PROCESSOR',
          authCode: `AUTH_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
          network: 'MOCK_NETWORK',
          timestamp: new Date().toISOString()
        },
        mockTransactionId: transactionId,
        receipt: {
          url: `https://atp.dev/receipts/${transactionId}`,
          number: `RCPT-${Date.now()}`
        }
      };
    } else {
      // Simulate different failure scenarios
      const failureScenarios = [
        { code: 'INSUFFICIENT_FUNDS', message: 'Insufficient funds in account' },
        { code: 'CARD_DECLINED', message: 'Card declined by issuer' },
        { code: 'EXPIRED_CARD', message: 'Payment method has expired' },
        { code: 'FRAUD_DETECTED', message: 'Transaction flagged as suspicious' },
        { code: 'NETWORK_ERROR', message: 'Payment network timeout' }
      ];

      const failure = failureScenarios[Math.floor(Math.random() * failureScenarios.length)];

      return {
        success: false,
        transactionId,
        status: 'failed',
        amount: params.amount,
        currency: params.currency,
        mockProcessorResponse: {
          processor: 'MOCK_PROCESSOR',
          authCode: 'DECLINED',
          network: 'MOCK_NETWORK',
          timestamp: new Date().toISOString()
        },
        mockTransactionId: transactionId,
        error: {
          code: failure.code,
          message: failure.message,
          details: 'This is a simulated failure for MVP testing purposes'
        }
      };
    }
  }

  /**
   * Simulate processing delay
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get processor statistics
   */
  static getStats() {
    return {
      processor: 'Mock Payment Processor',
      mode: 'MVP',
      successRate: `${this.successRate * 100}%`,
      note: 'No real money is processed. All transactions are simulated.'
    };
  }
}
