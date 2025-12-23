/**
 * Policy Controller - Payment policy management
 */

import express from 'express';
import { CryptoUtils } from '../utils/crypto.js';
import db from '../utils/database.js';

const router = express.Router();

/**
 * POST /payments/policies
 * Create a payment policy
 */
router.post('/', async (req, res) => {
  try {
    const {
      name, agentDid, maxTransactionAmount, dailyLimit, monthlyLimit,
      allowedMerchants, allowedCategories, requiresApproval, notificationThreshold
    } = req.body;

    if (!name || !agentDid || !maxTransactionAmount) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Missing required fields: name, agentDid, maxTransactionAmount'
      });
    }

    const policyId = CryptoUtils.generateId('policy');

    await db.query(`
      INSERT INTO payment_policies (
        id, name, agent_did, max_transaction_amount, daily_limit, monthly_limit,
        allowed_merchants, allowed_categories, requires_approval, notification_threshold
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      policyId, name, agentDid, maxTransactionAmount, dailyLimit, monthlyLimit,
      allowedMerchants, allowedCategories, requiresApproval !== false, notificationThreshold
    ]);

    res.status(201).json({
      success: true,
      data: {
        id: policyId,
        name,
        agentDid,
        maxTransactionAmount,
        dailyLimit,
        monthlyLimit,
        allowedMerchants,
        allowedCategories,
        requiresApproval: requiresApproval !== false,
        notificationThreshold,
        status: 'active',
        createdAt: new Date()
      }
    });
  } catch (error: any) {
    console.error('[Error] Create policy:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

export { router as policyRouter };
