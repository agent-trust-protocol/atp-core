/**
 * Tests for PaymentsClient
 */

import axios from 'axios';
import { PaymentsClient } from '../../client/payments';
import { ATPConfig } from '../../types';
import { CryptoUtils } from '../../utils/crypto';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock CryptoUtils
jest.mock('../../utils/crypto', () => ({
  CryptoUtils: {
    generateId: jest.fn().mockReturnValue('generated-id-123'),
    sign: jest.fn().mockResolvedValue('signature-123'),
    hash: jest.fn().mockResolvedValue('hash-123')
  }
}));

describe('PaymentsClient', () => {
  let client: PaymentsClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAxiosInstance = {
      request: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

    const config: ATPConfig = {
      baseUrl: 'http://localhost',
      services: { payments: 'http://payments-service:3005' },
      auth: {
        did: 'did:atp:user123',
        privateKey: 'test-private-key'
      }
    };

    client = new PaymentsClient(config);
  });

  describe('AP2 Protocol - Intent Mandates', () => {
    describe('createIntentMandate', () => {
      it('should create an intent mandate', async () => {
        const mockMandate = {
          id: 'generated-id-123',
          type: 'intent',
          userDid: 'did:atp:user123',
          agentDid: 'did:atp:agent456',
          purpose: 'Shopping assistance',
          status: 'active'
        };
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: mockMandate }
        });

        const result = await client.createIntentMandate({
          userDid: 'did:atp:user123',
          agentDid: 'did:atp:agent456',
          purpose: 'Shopping assistance'
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/ap2/mandates/intent',
          data: expect.objectContaining({
            mandate: expect.objectContaining({
              userDid: 'did:atp:user123',
              agentDid: 'did:atp:agent456',
              purpose: 'Shopping assistance'
            }),
            signature: 'signature-123'
          })
        });
        expect(result.data).toEqual(mockMandate);
      });

      it('should include optional restrictions', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { id: 'mandate-123' } }
        });

        await client.createIntentMandate({
          userDid: 'did:atp:user123',
          agentDid: 'did:atp:agent456',
          purpose: 'Limited shopping',
          maxAmount: 100,
          currency: 'EUR',
          restrictions: {
            merchants: ['merchant-1'],
            categories: ['electronics'],
            dailyLimit: 50
          }
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              mandate: expect.objectContaining({
                maxAmount: 100,
                currency: 'EUR',
                restrictions: {
                  merchants: ['merchant-1'],
                  categories: ['electronics'],
                  dailyLimit: 50
                }
              })
            })
          })
        );
      });
    });
  });

  describe('AP2 Protocol - Cart Mandates', () => {
    describe('createCartMandate', () => {
      it('should create a cart mandate', async () => {
        // Mock the getMandate call
        mockAxiosInstance.request
          .mockResolvedValueOnce({
            data: { success: true, data: { id: 'intent-123', status: 'active' } }
          })
          .mockResolvedValueOnce({
            data: { success: true, data: { id: 'cart-mandate-123' } }
          });

        const result = await client.createCartMandate({
          intentMandateId: 'intent-123',
          merchant: 'merchant-abc',
          items: [
            { id: 'item-1', name: 'Product A', quantity: 2, price: 25.00, currency: 'USD' }
          ],
          total: 50.00,
          currency: 'USD',
          paymentMethod: { type: 'card', last4: '1234' } as any
        });

        expect(result.data).toEqual({ id: 'cart-mandate-123' });
      });

      it('should throw error if intent mandate is not active', async () => {
        mockAxiosInstance.request.mockResolvedValueOnce({
          data: { success: true, data: { id: 'intent-123', status: 'revoked' } }
        });

        await expect(client.createCartMandate({
          intentMandateId: 'intent-123',
          merchant: 'merchant-abc',
          items: [],
          total: 0,
          currency: 'USD',
          paymentMethod: {} as any
        })).rejects.toThrow('Intent mandate is not active');
      });
    });
  });

  describe('AP2 Protocol - Payment Execution', () => {
    describe('executeAP2Payment', () => {
      it('should execute an AP2 payment', async () => {
        // Mock getMandate and execute calls
        mockAxiosInstance.request
          .mockResolvedValueOnce({
            data: { success: true, data: { id: 'cart-123' } }
          })
          .mockResolvedValueOnce({
            data: {
              success: true,
              data: {
                id: 'tx-123',
                status: 'completed',
                amount: 100.00
              }
            }
          });

        const result = await client.executeAP2Payment({
          cartMandateId: 'cart-123',
          paymentMethod: { type: 'card', last4: '4242' } as any
        });

        expect(result.data).toEqual({
          id: 'tx-123',
          status: 'completed',
          amount: 100.00
        });
      });
    });
  });

  describe('ACP Protocol - Checkout', () => {
    describe('createACPCheckout', () => {
      it('should create an ACP checkout session', async () => {
        const mockSession = {
          id: 'session-123',
          status: 'pending',
          checkoutUrl: 'https://checkout.example.com/session-123'
        };
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: mockSession }
        });

        const result = await client.createACPCheckout({
          merchantId: 'merchant-123',
          agentDid: 'did:atp:agent456',
          items: [{ productId: 'prod-1', quantity: 1 }]
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/acp/checkout/create',
          data: expect.objectContaining({
            merchantId: 'merchant-123',
            agentDid: 'did:atp:agent456',
            items: [{ productId: 'prod-1', quantity: 1 }],
            protocol: 'acp'
          })
        });
        expect(result.data).toEqual(mockSession);
      });

      it('should include optional shipping and customer info', async () => {
        mockAxiosInstance.request.mockResolvedValue({ data: { success: true, data: {} } });

        await client.createACPCheckout({
          merchantId: 'merchant-123',
          agentDid: 'did:atp:agent456',
          items: [{ productId: 'prod-1', quantity: 1 }],
          shippingAddress: { street: '123 Main St', city: 'NYC' },
          customerEmail: 'user@example.com',
          metadata: { orderId: 'order-456' }
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              shippingAddress: { street: '123 Main St', city: 'NYC' },
              customerEmail: 'user@example.com',
              metadata: { orderId: 'order-456' }
            })
          })
        );
      });
    });

    describe('completeACPCheckout', () => {
      it('should complete an ACP checkout', async () => {
        const mockResult = {
          transactionId: 'tx-123',
          status: 'completed',
          amount: 99.99
        };
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: mockResult }
        });

        const result = await client.completeACPCheckout({
          sessionId: 'session-123',
          paymentMethodId: 'pm-456'
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/acp/checkout/complete',
          data: expect.objectContaining({
            sessionId: 'session-123',
            paymentMethodId: 'pm-456'
          })
        });
        expect(result.data).toEqual(mockResult);
      });
    });
  });

  describe('Payment Methods', () => {
    describe('addPaymentMethod', () => {
      it('should add a card payment method', async () => {
        const mockMethod = {
          id: 'pm-123',
          type: 'card',
          details: { last4: '4242', brand: 'visa' }
        };
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: mockMethod }
        });

        const result = await client.addPaymentMethod({
          userDid: 'did:atp:user123',
          type: 'card',
          details: {
            last4: '4242',
            brand: 'visa',
            expiryMonth: 12,
            expiryYear: 2025
          },
          isDefault: true
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/payments/methods',
          data: expect.objectContaining({
            userDid: 'did:atp:user123',
            type: 'card',
            details: {
              last4: '4242',
              brand: 'visa',
              expiryMonth: 12,
              expiryYear: 2025
            },
            isDefault: true
          })
        });
        expect(result.data).toEqual(mockMethod);
      });

      it('should add a crypto payment method', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { id: 'pm-crypto' } }
        });

        await client.addPaymentMethod({
          userDid: 'did:atp:user123',
          type: 'crypto',
          details: {
            walletAddress: '0x1234567890abcdef',
            blockchain: 'ethereum'
          }
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              type: 'crypto',
              details: {
                walletAddress: '0x1234567890abcdef',
                blockchain: 'ethereum'
              }
            })
          })
        );
      });
    });
  });

  describe('Payment Policies', () => {
    describe('createPaymentPolicy', () => {
      it('should create a payment policy', async () => {
        const mockPolicy = {
          id: 'policy-123',
          name: 'Daily Limit Policy',
          status: 'active'
        };
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: mockPolicy }
        });

        const result = await client.createPaymentPolicy({
          name: 'Daily Limit Policy',
          agentDid: 'did:atp:agent456',
          maxTransactionAmount: 100,
          dailyLimit: 500,
          monthlyLimit: 5000
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/payments/policies',
          data: expect.objectContaining({
            name: 'Daily Limit Policy',
            agentDid: 'did:atp:agent456',
            limits: {
              maxTransactionAmount: 100,
              dailyLimit: 500,
              monthlyLimit: 5000
            }
          })
        });
        expect(result.data).toEqual(mockPolicy);
      });

      it('should include merchant and category restrictions', async () => {
        mockAxiosInstance.request.mockResolvedValue({ data: { success: true, data: {} } });

        await client.createPaymentPolicy({
          name: 'Restricted Policy',
          agentDid: 'did:atp:agent456',
          maxTransactionAmount: 50,
          allowedMerchants: ['merchant-1', 'merchant-2'],
          allowedCategories: ['groceries', 'utilities'],
          requiresApproval: true,
          notificationThreshold: 25
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              allowedMerchants: ['merchant-1', 'merchant-2'],
              allowedCategories: ['groceries', 'utilities'],
              requiresApproval: true,
              notificationThreshold: 25
            })
          })
        );
      });
    });
  });

  describe('Transaction Queries', () => {
    describe('queryTransactions', () => {
      it('should query transactions', async () => {
        const mockTransactions = [
          { id: 'tx-1', amount: 50, status: 'completed' },
          { id: 'tx-2', amount: 75, status: 'completed' }
        ];
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: mockTransactions }
        });

        const result = await client.queryTransactions({
          userDid: 'did:atp:user123',
          status: 'completed'
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'GET',
            url: '/payments/transactions',
            params: expect.objectContaining({
              userDid: 'did:atp:user123',
              status: 'completed'
            })
          })
        );
        expect(result.data).toHaveLength(2);
      });

      it('should support date range and amount filters', async () => {
        mockAxiosInstance.request.mockResolvedValue({ data: { success: true, data: [] } });

        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-12-31');

        await client.queryTransactions({
          agentDid: 'did:atp:agent456',
          startDate,
          endDate,
          minAmount: 10,
          maxAmount: 1000
        });

        expect(mockAxiosInstance.request).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({
              agentDid: 'did:atp:agent456',
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              minAmount: 10,
              maxAmount: 1000
            })
          })
        );
      });
    });
  });

  describe('Mandate Management', () => {
    describe('getMandate', () => {
      it('should get a mandate by ID', async () => {
        const mockMandate = {
          id: 'mandate-123',
          type: 'intent',
          status: 'active'
        };
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: mockMandate }
        });

        const result = await client.getMandate('mandate-123');

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'GET',
          url: '/ap2/mandates/mandate-123',
          data: undefined
        });
        expect(result.data).toEqual(mockMandate);
      });
    });

    describe('revokeMandate', () => {
      it('should revoke a mandate', async () => {
        mockAxiosInstance.request.mockResolvedValue({
          data: { success: true, data: { success: true } }
        });

        const result = await client.revokeMandate('mandate-123');

        expect(mockAxiosInstance.request).toHaveBeenCalledWith({
          method: 'POST',
          url: '/ap2/mandates/mandate-123/revoke',
          data: expect.objectContaining({
            revokedAt: expect.any(String)
          })
        });
        expect(result.data.success).toBe(true);
      });
    });
  });

  describe('Crypto and Signing', () => {
    it('should generate unique IDs for mandates', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: { id: 'generated-id-123' } }
      });

      await client.createIntentMandate({
        userDid: 'did:atp:user',
        agentDid: 'did:atp:agent',
        purpose: 'Test'
      });

      expect(CryptoUtils.generateId).toHaveBeenCalled();
    });

    it('should sign mandates', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: {} }
      });

      await client.createIntentMandate({
        userDid: 'did:atp:user',
        agentDid: 'did:atp:agent',
        purpose: 'Test'
      });

      expect(CryptoUtils.sign).toHaveBeenCalledWith(
        expect.any(String),
        'test-private-key'
      );
    });

    it('should hash cart mandates', async () => {
      mockAxiosInstance.request
        .mockResolvedValueOnce({
          data: { success: true, data: { id: 'intent-123', status: 'active' } }
        })
        .mockResolvedValueOnce({
          data: { success: true, data: {} }
        });

      await client.createCartMandate({
        intentMandateId: 'intent-123',
        merchant: 'merchant-abc',
        items: [{ id: 'item-1', name: 'Product', quantity: 1, price: 10, currency: 'USD' }],
        total: 10,
        currency: 'USD',
        paymentMethod: {} as any
      });

      expect(CryptoUtils.hash).toHaveBeenCalled();
    });
  });

  describe('Verifiable Credentials', () => {
    it('should include verifiable credential in mandate creation', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: {} }
      });

      await client.createIntentMandate({
        userDid: 'did:atp:user',
        agentDid: 'did:atp:agent',
        purpose: 'Test'
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            verifiableCredential: expect.objectContaining({
              '@context': ['https://www.w3.org/2018/credentials/v1'],
              type: ['VerifiableCredential', 'PaymentMandateCredential'],
              issuer: 'did:atp:user123'
            })
          })
        })
      );
    });
  });
});
