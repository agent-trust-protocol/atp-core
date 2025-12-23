/**
 * Mandate Controller - AP2 endpoints
 */

import express from 'express';
import { MandateService } from '../services/mandate.service.js';
import { MockPaymentProcessor } from '../services/mock-processor.service.js';
import db from '../utils/database.js';
import { CryptoUtils } from '../utils/crypto.js';

const router = express.Router();
const mandateService = new MandateService();

/**
 * POST /ap2/mandates/intent
 * Create an intent mandate
 */
router.post('/mandates/intent', async (req, res) => {
  try {
    const { userDid, agentDid, purpose, maxAmount, currency, expiresAt, restrictions } = req.body;

    // Validation
    if (!userDid || !agentDid || !purpose) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required fields: userDid, agentDid, purpose'
      });
    }

    // Create intent mandate
    const mandate = await mandateService.createIntentMandate({
      userDid,
      agentDid,
      purpose,
      maxAmount,
      currency,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      restrictions
    });

    res.status(201).json({
      success: true,
      data: mandate
    });
  } catch (error: any) {
    console.error('[Error] Create intent mandate:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * POST /ap2/mandates/cart
 * Create a cart mandate
 */
router.post('/mandates/cart', async (req, res) => {
  try {
    const { intentMandateId, merchant, items, total, currency } = req.body;

    // Validation
    if (!intentMandateId || !merchant || !items || !total || !currency) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required fields: intentMandateId, merchant, items, total, currency'
      });
    }

    // Create cart mandate
    const mandate = await mandateService.createCartMandate({
      intentMandateId,
      merchant,
      items,
      total,
      currency
    });

    res.status(201).json({
      success: true,
      data: mandate
    });
  } catch (error: any) {
    console.error('[Error] Create cart mandate:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      error: error.message.includes('not found') ? 'Not Found' : 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * POST /ap2/payments/execute
 * Execute a payment using cart mandate
 */
router.post('/payments/execute', async (req, res) => {
  try {
    const { cartMandateId, paymentMethod, billingAddress, metadata } = req.body;

    // Validation
    if (!cartMandateId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required field: cartMandateId'
      });
    }

    // Get cart mandate
    const cartMandate = await mandateService.getMandate(cartMandateId);

    if (!cartMandate || cartMandate.type !== 'cart') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Cart mandate not found'
      });
    }

    if (cartMandate.status !== 'active') {
      return res.status(400).json({
        error: 'Invalid Status',
        message: `Cart mandate is ${cartMandate.status}`
      });
    }

    // Get intent mandate
    const intentMandate = await mandateService.getMandate(cartMandate.intentMandateId);
    if (!intentMandate) {
      return res.status(500).json({
        error: 'Internal Error',
        message: 'Intent mandate not found'
      });
    }

    // Execute mock payment
    const paymentResult = await MockPaymentProcessor.executePayment({
      amount: cartMandate.total,
      currency: cartMandate.currency,
      userDid: intentMandate.type === 'intent' ? intentMandate.userDid : '',
      agentDid: intentMandate.type === 'intent' ? intentMandate.agentDid : '',
      merchantId: cartMandate.merchant,
      mandateId: cartMandateId,
      paymentMethodId: paymentMethod?.id
    });

    // Create transaction record
    const transactionId = CryptoUtils.generateId('txn');
    await db.query(`
      INSERT INTO payment_transactions (
        id, protocol_type, status, user_did, agent_did, merchant_id,
        amount, currency, mandate_id, payment_method_id, completed_at,
        failure_reason, mock_processor_response, mock_transaction_id, mock_success, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    `, [
      transactionId,
      'ap2',
      paymentResult.status,
      intentMandate.type === 'intent' ? intentMandate.userDid : '',
      intentMandate.type === 'intent' ? intentMandate.agentDid : '',
      cartMandate.merchant,
      cartMandate.total,
      cartMandate.currency,
      cartMandateId,
      paymentMethod?.id,
      paymentResult.success ? new Date() : null,
      paymentResult.error?.message,
      JSON.stringify(paymentResult.mockProcessorResponse),
      paymentResult.mockTransactionId,
      paymentResult.success,
      JSON.stringify(metadata)
    ]);

    // Mark mandate as used if successful
    if (paymentResult.success) {
      await mandateService.markMandateAsUsed(cartMandateId);
    }

    res.status(paymentResult.success ? 200 : 400).json({
      success: paymentResult.success,
      data: {
        transactionId,
        ...paymentResult,
        billingAddress,
        metadata
      }
    });
  } catch (error: any) {
    console.error('[Error] Execute payment:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * GET /ap2/mandates/:id
 * Get mandate by ID
 */
router.get('/mandates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const mandate = await mandateService.getMandate(id);

    if (!mandate) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Mandate not found'
      });
    }

    res.json({
      success: true,
      data: mandate
    });
  } catch (error: any) {
    console.error('[Error] Get mandate:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

/**
 * POST /ap2/mandates/:id/revoke
 * Revoke a mandate
 */
router.post('/mandates/:id/revoke', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await mandateService.revokeMandate(id);

    if (!success) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Mandate not found or already revoked'
      });
    }

    res.json({
      success: true,
      message: 'Mandate revoked successfully'
    });
  } catch (error: any) {
    console.error('[Error] Revoke mandate:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

export { router as mandateRouter };
