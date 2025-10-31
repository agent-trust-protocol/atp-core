/**
 * Mandate Service - Handles AP2 payment mandates
 */

import db from '../utils/database.js';
import { CryptoUtils } from '../utils/crypto.js';
import type { IntentMandate, CartMandate, CartItem } from '../models/mandate.model.js';

export class MandateService {
  /**
   * Create an intent mandate (user authorization)
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
  }): Promise<IntentMandate> {
    // Generate mandate ID
    const id = CryptoUtils.generateId('mandate_intent');

    // Create mandate object
    const mandate: IntentMandate = {
      id,
      type: 'intent',
      userDid: params.userDid,
      agentDid: params.agentDid,
      purpose: params.purpose,
      maxAmount: params.maxAmount || 1000,
      currency: params.currency || 'USD',
      restrictions: params.restrictions,
      status: 'active',
      createdAt: new Date(),
      expiresAt: params.expiresAt
    };

    // Create verifiable credential
    const vc = this.createMandateCredential(mandate);
    mandate.verifiableCredential = vc;

    // Store in database
    await db.query(`
      INSERT INTO payment_mandates (
        id, type, user_did, agent_did, purpose, max_amount, currency,
        restrictions, status, expires_at, verifiable_credential
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      mandate.id,
      mandate.type,
      mandate.userDid,
      mandate.agentDid,
      mandate.purpose,
      mandate.maxAmount,
      mandate.currency,
      JSON.stringify(mandate.restrictions),
      mandate.status,
      mandate.expiresAt,
      JSON.stringify(vc)
    ]);

    console.log(`✅ Intent mandate created: ${mandate.id}`);
    return mandate;
  }

  /**
   * Create a cart mandate (transaction details)
   */
  async createCartMandate(params: {
    intentMandateId: string;
    merchant: string;
    items: CartItem[];
    total: number;
    currency: string;
  }): Promise<CartMandate> {
    // Verify intent mandate exists and is valid
    const intentMandate = await this.getMandate(params.intentMandateId);

    if (!intentMandate) {
      throw new Error('Intent mandate not found');
    }

    if (intentMandate.status !== 'active') {
      throw new Error(`Intent mandate is ${intentMandate.status}`);
    }

    // Check total doesn't exceed max amount
    if (intentMandate.type === 'intent' && intentMandate.maxAmount) {
      if (params.total > intentMandate.maxAmount) {
        throw new Error(`Cart total ${params.total} exceeds mandate max ${intentMandate.maxAmount}`);
      }
    }

    // Generate cart hash (immutable record)
    const cartHash = CryptoUtils.hash(JSON.stringify({
      items: params.items,
      total: params.total,
      merchant: params.merchant
    }));

    // Create cart mandate
    const id = CryptoUtils.generateId('mandate_cart');
    const mandate: CartMandate = {
      id,
      type: 'cart',
      intentMandateId: params.intentMandateId,
      merchant: params.merchant,
      items: params.items,
      total: params.total,
      currency: params.currency,
      cartHash,
      status: 'active',
      createdAt: new Date()
    };

    // Create verifiable credential
    const vc = this.createMandateCredential(mandate);
    mandate.verifiableCredential = vc;

    // Store in database
    await db.query(`
      INSERT INTO payment_mandates (
        id, type, intent_mandate_id, merchant, items, total, currency,
        cart_hash, status, verifiable_credential
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      mandate.id,
      mandate.type,
      mandate.intentMandateId,
      mandate.merchant,
      JSON.stringify(mandate.items),
      mandate.total,
      mandate.currency,
      mandate.cartHash,
      mandate.status,
      JSON.stringify(vc)
    ]);

    console.log(`✅ Cart mandate created: ${mandate.id}`);
    return mandate;
  }

  /**
   * Get a mandate by ID
   */
  async getMandate(mandateId: string): Promise<IntentMandate | CartMandate | null> {
    const result = await db.query(
      'SELECT * FROM payment_mandates WHERE id = $1',
      [mandateId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToMandate(result.rows[0]);
  }

  /**
   * Revoke a mandate
   */
  async revokeMandate(mandateId: string): Promise<boolean> {
    const result = await db.query(`
      UPDATE payment_mandates
      SET status = 'revoked', revoked_at = NOW()
      WHERE id = $1 AND status = 'active'
    `, [mandateId]);

    console.log(`✅ Mandate revoked: ${mandateId}`);
    return result.rowCount > 0;
  }

  /**
   * Mark mandate as used
   */
  async markMandateAsUsed(mandateId: string): Promise<void> {
    await db.query(`
      UPDATE payment_mandates
      SET status = 'used'
      WHERE id = $1
    `, [mandateId]);
  }

  /**
   * Create a verifiable credential for mandate
   */
  private createMandateCredential(mandate: any): any {
    return {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'PaymentMandateCredential'],
      issuer: 'did:atp:payment-service',
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: mandate.id,
        type: mandate.type,
        mandate: mandate
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:atp:payment-service#key-1',
        proofValue: CryptoUtils.sign(JSON.stringify(mandate))
      }
    };
  }

  /**
   * Map database row to mandate object
   */
  private mapRowToMandate(row: any): IntentMandate | CartMandate {
    if (row.type === 'intent') {
      return {
        id: row.id,
        type: 'intent',
        userDid: row.user_did,
        agentDid: row.agent_did,
        purpose: row.purpose,
        maxAmount: parseFloat(row.max_amount),
        currency: row.currency,
        restrictions: row.restrictions,
        status: row.status,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        revokedAt: row.revoked_at,
        verifiableCredential: row.verifiable_credential
      };
    } else {
      return {
        id: row.id,
        type: 'cart',
        intentMandateId: row.intent_mandate_id,
        merchant: row.merchant,
        items: row.items,
        total: parseFloat(row.total),
        currency: row.currency,
        cartHash: row.cart_hash,
        status: row.status,
        createdAt: row.created_at,
        verifiableCredential: row.verifiable_credential
      };
    }
  }
}
