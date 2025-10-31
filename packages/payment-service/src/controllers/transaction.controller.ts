/**
 * Transaction Controller - Query payment transactions
 */

import express from 'express';
import db from '../utils/database.js';

const router = express.Router();

/**
 * GET /payments/transactions
 * Query transactions
 */
router.get('/', async (req, res) => {
  try {
    const { userDid, agentDid, merchantId, status, limit = 50 } = req.query;

    let query = 'SELECT * FROM payment_transactions WHERE 1=1';
    const params: any[] = [];

    if (userDid) {
      params.push(userDid);
      query += ` AND user_did = $${params.length}`;
    }
    if (agentDid) {
      params.push(agentDid);
      query += ` AND agent_did = $${params.length}`;
    }
    if (merchantId) {
      params.push(merchantId);
      query += ` AND merchant_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    params.push(limit);
    query += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        protocolType: row.protocol_type,
        status: row.status,
        userDid: row.user_did,
        agentDid: row.agent_did,
        merchantId: row.merchant_id,
        amount: parseFloat(row.amount),
        currency: row.currency,
        mandateId: row.mandate_id,
        createdAt: row.created_at,
        completedAt: row.completed_at,
        mockSuccess: row.mock_success
      })),
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('[Error] Query transactions:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

export { router as transactionRouter };
