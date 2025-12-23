/**
 * ATP SDK Example 8: Payment Protocols (AP2 & ACP)
 *
 * Demonstrates integration with:
 * - Google's Agent Payments Protocol (AP2)
 * - OpenAI's Agentic Commerce Protocol (ACP)
 *
 * Showcases how AI agents can securely initiate and complete payments
 * with cryptographic verification and full audit trails.
 */

import { ATPClient, createQuickConfig } from '@atp/sdk';

async function main() {
  console.log('='.repeat(80));
  console.log('ATP SDK Example 8: Payment Protocols (AP2 & ACP)');
  console.log('='.repeat(80));
  console.log();

  // Initialize ATP Client
  const config = createQuickConfig(process.env.ATP_BASE_URL || 'http://localhost');
  const client = new ATPClient(config);

  // Simulate user and agent DIDs
  const userDid = 'did:atp:mainnet:user123';
  const agentDid = 'did:atp:mainnet:shopping-agent-456';

  // Set authentication
  client.setAuthentication({
    did: agentDid,
    privateKey: process.env.ATP_AGENT_PRIVATE_KEY || 'demo-key'
  });

  console.log('╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║ PART 1: Google AP2 (Agent Payments Protocol)                          ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝');
  console.log();

  // Step 1: Create Intent Mandate
  console.log('📜 Creating Intent Mandate (User Authorization)...');
  const intentMandate = await client.payments.createIntentMandate({
    userDid: userDid,
    agentDid: agentDid,
    purpose: 'Shopping assistant for holiday gifts',
    maxAmount: 500.00,
    currency: 'USD',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    restrictions: {
      merchants: ['amazon.com', 'etsy.com', 'shopify.com'],
      categories: ['gifts', 'electronics', 'home'],
      dailyLimit: 200.00
    }
  });

  console.log('✅ Intent Mandate Created:');
  console.log(`   - ID: ${intentMandate.data.id}`);
  console.log(`   - Max Amount: $${intentMandate.data.maxAmount}`);
  console.log(`   - Daily Limit: $${intentMandate.data.restrictions.dailyLimit}`);
  console.log(`   - Expires: ${new Date(intentMandate.data.expiresAt).toLocaleDateString()}`);
  console.log();

  // Step 2: Create Cart Mandate
  console.log('🛒 Creating Cart Mandate (Specific Transaction)...');
  const cartMandate = await client.payments.createCartMandate({
    intentMandateId: intentMandate.data.id,
    merchant: 'etsy.com',
    items: [
      {
        id: 'item-123',
        name: 'Handmade Ceramic Mug',
        quantity: 2,
        price: 24.99,
        currency: 'USD'
      },
      {
        id: 'item-456',
        name: 'Artisan Coffee Beans',
        quantity: 1,
        price: 18.50,
        currency: 'USD'
      }
    ],
    total: 68.48,
    currency: 'USD',
    paymentMethod: {
      id: 'pm-card-789',
      type: 'card',
      userDid: userDid,
      details: {
        last4: '4242',
        brand: 'Visa',
        expiryMonth: 12,
        expiryYear: 2026
      },
      isDefault: true,
      status: 'active',
      createdAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString()
    }
  });

  console.log('✅ Cart Mandate Created:');
  console.log(`   - ID: ${cartMandate.data.id}`);
  console.log(`   - Merchant: ${cartMandate.data.merchant}`);
  console.log(`   - Items: ${cartMandate.data.items.length}`);
  console.log(`   - Total: $${cartMandate.data.total}`);
  console.log(`   - Hash: ${cartMandate.data.hash.substring(0, 16)}...`);
  console.log();

  // Step 3: Execute AP2 Payment
  console.log('💳 Executing AP2 Payment...');
  const payment = await client.payments.executeAP2Payment({
    cartMandateId: cartMandate.data.id,
    paymentMethod: cartMandate.data.paymentMethod,
    billingAddress: {
      line1: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'US'
    },
    metadata: {
      orderNote: 'Gift wrap please!',
      deliveryInstructions: 'Leave at door'
    }
  });

  console.log('✅ Payment Completed:');
  console.log(`   - Transaction ID: ${payment.data.id}`);
  console.log(`   - Status: ${payment.data.status}`);
  console.log(`   - Amount: $${payment.data.amount}`);
  console.log(`   - Audit Trail: ${payment.data.auditTrail.length} events`);
  console.log();

  console.log('╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║ PART 2: OpenAI ACP (Agentic Commerce Protocol)                        ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝');
  console.log();

  // Step 1: Create ACP Checkout Session
  console.log('🛍️  Creating ACP Checkout Session...');
  const checkout = await client.payments.createACPCheckout({
    merchantId: 'merchant-etsy-789',
    agentDid: agentDid,
    items: [
      {
        productId: 'prod-vintage-lamp',
        variantId: 'var-brass-finish',
        quantity: 1
      },
      {
        productId: 'prod-art-print',
        quantity: 2
      }
    ],
    shippingAddress: {
      line1: '456 Oak Avenue',
      line2: 'Apt 3B',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US'
    },
    customerEmail: 'user@example.com',
    metadata: {
      source: 'chatgpt',
      conversationId: 'conv-123'
    }
  });

  console.log('✅ Checkout Session Created:');
  console.log(`   - Session ID: ${checkout.data.id}`);
  console.log(`   - Merchant: ${checkout.data.merchantId}`);
  console.log(`   - Items: ${checkout.data.items.length}`);
  console.log(`   - Subtotal: $${checkout.data.subtotal}`);
  console.log(`   - Total: $${checkout.data.total}`);
  console.log(`   - Expires: ${new Date(checkout.data.expiresAt).toLocaleString()}`);
  console.log();

  // Step 2: Complete ACP Checkout
  console.log('✨ Completing ACP Checkout...');
  const acpResult = await client.payments.completeACPCheckout({
    sessionId: checkout.data.id,
    paymentMethodId: 'pm-card-789',
    sharedPaymentToken: 'spt-stripe-abc123' // Stripe Shared Payment Token
  });

  console.log('✅ Checkout Completed:');
  console.log(`   - Transaction ID: ${acpResult.data.transactionId}`);
  console.log(`   - Status: ${acpResult.data.status}`);
  console.log(`   - Amount: $${acpResult.data.amount} ${acpResult.data.currency}`);
  console.log(`   - Receipt: ${acpResult.data.receipt?.url || 'N/A'}`);
  console.log();

  console.log('╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║ PART 3: Payment Policy Management                                     ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝');
  console.log();

  // Create Payment Policy
  console.log('📋 Creating Payment Policy...');
  const policy = await client.payments.createPaymentPolicy({
    name: 'Shopping Assistant Policy',
    agentDid: agentDid,
    maxTransactionAmount: 100.00,
    dailyLimit: 250.00,
    monthlyLimit: 1000.00,
    allowedMerchants: ['etsy.com', 'amazon.com'],
    allowedCategories: ['gifts', 'books', 'home'],
    requiresApproval: true,
    notificationThreshold: 50.00
  });

  console.log('✅ Payment Policy Created:');
  console.log(`   - Policy ID: ${policy.data.id}`);
  console.log(`   - Max Transaction: $${policy.data.limits.maxTransactionAmount}`);
  console.log(`   - Daily Limit: $${policy.data.limits.dailyLimit}`);
  console.log(`   - Monthly Limit: $${policy.data.limits.monthlyLimit}`);
  console.log(`   - Requires Approval: ${policy.data.requiresApproval}`);
  console.log();

  console.log('╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║ PART 4: Payment Method Management                                     ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝');
  console.log();

  // Add payment methods
  console.log('💳 Adding Payment Methods...');

  // Card
  const cardMethod = await client.payments.addPaymentMethod({
    userDid: userDid,
    type: 'card',
    details: {
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2026
    },
    isDefault: true
  });

  // Crypto wallet
  const cryptoMethod = await client.payments.addPaymentMethod({
    userDid: userDid,
    type: 'crypto',
    details: {
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      blockchain: 'ethereum',
      tokenSymbol: 'USDC'
    },
    isDefault: false
  });

  console.log('✅ Payment Methods Added:');
  console.log(`   - Card: ${cardMethod.data.details.brand} ****${cardMethod.data.details.last4}`);
  console.log(`   - Crypto: ${cryptoMethod.data.details.blockchain.toUpperCase()} (${cryptoMethod.data.details.tokenSymbol})`);
  console.log();

  console.log('╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║ PART 5: Transaction History & Audit                                   ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝');
  console.log();

  // Query transactions
  console.log('🔍 Querying Payment Transactions...');
  const transactions = await client.payments.queryTransactions({
    userDid: userDid,
    agentDid: agentDid,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    endDate: new Date(),
    status: 'completed'
  });

  console.log('✅ Transaction History:');
  console.log(`   - Total Transactions: ${transactions.data.length}`);
  transactions.data.slice(0, 3).forEach((tx, i) => {
    console.log(`   ${i + 1}. ${tx.merchantId} - $${tx.amount} (${tx.type.toUpperCase()}) - ${tx.status}`);
  });
  console.log();

  console.log('╔════════════════════════════════════════════════════════════════════════╗');
  console.log('║ PART 6: Mandate Management                                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════╝');
  console.log();

  // Get mandate details
  console.log('📜 Retrieving Mandate Details...');
  const mandateDetails = await client.payments.getMandate(intentMandate.data.id);

  console.log('✅ Mandate Details:');
  console.log(`   - ID: ${mandateDetails.data.id}`);
  console.log(`   - Type: ${mandateDetails.data.type}`);
  console.log(`   - Status: ${mandateDetails.data.status}`);
  console.log();

  // Revoke mandate
  console.log('🚫 Revoking Mandate...');
  const revocation = await client.payments.revokeMandate(intentMandate.data.id);

  console.log('✅ Mandate Revoked:');
  console.log(`   - Success: ${revocation.data.success}`);
  console.log();

  console.log('='.repeat(80));
  console.log('✅ Payment Protocols Example Completed Successfully!');
  console.log('='.repeat(80));
  console.log();
  console.log('Key Features Demonstrated:');
  console.log('  ✓ AP2 Intent & Cart Mandates');
  console.log('  ✓ AP2 Payment Execution with Audit Trail');
  console.log('  ✓ ACP Checkout Session & Completion');
  console.log('  ✓ Payment Policy Creation & Enforcement');
  console.log('  ✓ Multi-payment Method Support (Card, Crypto)');
  console.log('  ✓ Transaction Query & History');
  console.log('  ✓ Mandate Lifecycle Management');
  console.log();
}

// Run the example
main().catch(error => {
  console.error('❌ Example failed:', error.message);
  console.error(error);
  process.exit(1);
});
