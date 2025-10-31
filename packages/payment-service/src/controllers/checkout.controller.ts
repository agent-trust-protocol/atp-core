/**
 * Checkout Controller - ACP (OpenAI Agentic Commerce Protocol) endpoints
 */

import express from 'express';
import { CryptoUtils } from '../utils/crypto.js';
import { MockPaymentProcessor } from '../services/mock-processor.service.js';
import db from '../utils/database.js';

const router = express.Router();

/**
 * POST /acp/checkout/create
 * Create an ACP checkout session
 */
router.post('/checkout/create', async (req, res) => {
  try {
    const { merchantId, agentDid, items, shippingAddress, customerEmail, metadata } = req.body;

    if (!merchantId || !agentDid || !items || items.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required fields: merchantId, agentDid, items'
      });
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08; // 8% tax for demo
    const shipping = shippingAddress ? 10.00 : 0; // $10 flat shipping
    const total = subtotal + tax + shipping;

    // Create session
    const sessionId = CryptoUtils.generateId('acp_sess');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await db.query(`
      INSERT INTO acp_checkout_sessions (
        id, merchant_id, agent_did, status, items, subtotal, tax, shipping,
        total, currency, shipping_address, customer_email, expires_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      sessionId, merchantId, agentDid, 'created', JSON.stringify(items),
      subtotal, tax, shipping, total, 'USD', JSON.stringify(shippingAddress),
      customerEmail, expiresAt, JSON.stringify(metadata)
    ]);

    res.status(201).json({
      success: true,
      data: {
        id: sessionId,
        merchantId,
        agentDid,
        status: 'created',
        items,
        subtotal,
        tax,
        shipping,
        total,
        currency: 'USD',
        shippingAddress,
        customerEmail,
        expiresAt,
        createdAt: new Date(),
        metadata
      }
    });
  } catch (error: any) {
    console.error('[Error] Create checkout:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

/**
 * POST /acp/checkout/complete
 * Complete an ACP checkout
 */
router.post('/checkout/complete', async (req, res) => {
  try {
    const { sessionId, paymentMethodId, sharedPaymentToken } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required field: sessionId'
      });
    }

    // Get session
    const result = await db.query('SELECT * FROM acp_checkout_sessions WHERE id = $1', [sessionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'Checkout session not found' });
    }

    const session = result.rows[0];

    if (session.status !== 'created') {
      return res.status(400).json({
        error: 'Invalid Status',
        message: `Session is ${session.status}`
      });
    }

    // Execute mock payment
    const paymentResult = await MockPaymentProcessor.executePayment({
      amount: parseFloat(session.total),
      currency: session.currency,
      userDid: 'user-from-session', // Would come from session
      agentDid: session.agent_did,
      merchantId: session.merchant_id,
      paymentMethodId
    });

    // Create transaction
    const transactionId = CryptoUtils.generateId('txn');
    await db.query(`
      INSERT INTO payment_transactions (
        id, protocol_type, status, user_did, agent_did, merchant_id,
        amount, currency, checkout_session_id, payment_method_id,
        completed_at, mock_processor_response, mock_transaction_id, mock_success
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      transactionId, 'acp', paymentResult.status, 'user-from-session', session.agent_did,
      session.merchant_id, session.total, session.currency, sessionId, paymentMethodId,
      paymentResult.success ? new Date() : null, JSON.stringify(paymentResult.mockProcessorResponse),
      paymentResult.mockTransactionId, paymentResult.success
    ]);

    // Update session
    await db.query(`
      UPDATE acp_checkout_sessions
      SET status = $1, completed_at = NOW(), shared_payment_token = $2
      WHERE id = $3
    `, [paymentResult.success ? 'completed' : 'created', sharedPaymentToken, sessionId]);

    res.status(paymentResult.success ? 200 : 400).json({
      success: paymentResult.success,
      data: {
        transactionId,
        ...paymentResult
      }
    });
  } catch (error: any) {
    console.error('[Error] Complete checkout:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

export { router as checkoutRouter };
