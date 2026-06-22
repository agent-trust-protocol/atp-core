/**
 * Trust Scoring System for ATP
 * Implements dynamic trust calculation based on agent behavior and credentials
 */

import { DatabaseManager } from '../database/manager.js';
import { Logger } from '../monitoring/logger.js';

const logger = new Logger('trust-scoring');

export enum AgentTrustLevel {
  UNKNOWN = 0,      // No verification
  BASIC = 0.25,     // Identity verified
  VERIFIED = 0.5,   // Credentials validated
  TRUSTED = 0.75,   // Full collaboration
  PRIVILEGED = 1.0  // Administrative access
}

export interface TrustFactors {
  identityVerified: boolean;
  credentialsValidated: string[];
  interactionHistory: {
    successful: number;
    failed: number;
    lastInteraction: Date;
  };
  reputation: {
    endorsements: number;
    violations: number;
  };
  timeFactors: {
    accountAge: number; // days
    activeTime: number; // hours
  };
}

export interface TrustScore {
  score: number; // 0-1 range
  level: AgentTrustLevel;
  factors: TrustFactors;
  calculatedAt: Date;
  recommendations: string[];
}

/**
 * The credential row the engine currently selects — only `type` + `issuer`.
 * A real verifier that performs signature/expiry/revocation checks will need the
 * full VC payload, which requires extending the `credentials` SELECT (and the
 * trust tables) — tracked as follow-up work. The index signature documents that
 * those extra columns are expected to arrive here later, so an implementer sees
 * the data gap at the type level rather than discovering it at runtime.
 */
export interface CredentialRow {
  type: string;
  issuer: string;
  [key: string]: unknown;
}

/**
 * Gate for crediting a credential toward trust. An implementation must return
 * true ONLY for a genuinely verified credential — valid issuer signature, not
 * expired, not revoked (e.g. by delegating to vc-service `verifyCredential`).
 *
 * The engine takes this by dependency injection so `@atp/shared` does not depend
 * on vc-service. When no verifier is supplied the engine FAILS CLOSED: it counts
 * zero credentials rather than trusting an unverifiable `status` column, so a
 * forged/expired/revoked credential can never inflate a trust score.
 */
export interface CredentialVerifier {
  isVerified(credentialRow: CredentialRow): Promise<boolean>;
}

export class TrustScoringEngine {
  private db: DatabaseManager;
  private verifier?: CredentialVerifier;

  constructor(db: DatabaseManager, verifier?: CredentialVerifier) {
    this.db = db;
    this.verifier = verifier;
  }

  /**
   * Calculate trust score for an agent
   */
  async calculateTrustScore(agentDid: string): Promise<TrustScore> {
    try {
      const factors = await this.collectTrustFactors(agentDid);
      const score = this.computeScore(factors);
      const level = this.determineLevel(score);
      const recommendations = this.generateRecommendations(factors, score);

      const trustScore: TrustScore = {
        score,
        level,
        factors,
        calculatedAt: new Date(),
        recommendations
      };

      // Store the calculated score
      await this.storeTrustScore(agentDid, trustScore);

      logger.info('Trust score calculated', { agentDid, score, level });
      return trustScore;
    } catch (error) {
      logger.error('Error calculating trust score', { agentDid, error });
      throw error;
    }
  }

  /**
   * Update trust score based on interaction outcome
   */
  async updateTrustScore(
    agentDid: string,
    interaction: { success: boolean; type: string; details?: any }
  ): Promise<TrustScore> {
    const currentScore = await this.calculateTrustScore(agentDid);

    // Update interaction history
    if (interaction.success) {
      currentScore.factors.interactionHistory.successful++;
    } else {
      currentScore.factors.interactionHistory.failed++;
    }
    currentScore.factors.interactionHistory.lastInteraction = new Date();

    // Recalculate score
    return this.calculateTrustScore(agentDid);
  }

  /**
   * Collect all trust factors for an agent
   */
  private async collectTrustFactors(agentDid: string): Promise<TrustFactors> {
    // Get identity verification status
    const identityResult = await this.db.query(
      'SELECT verified, created_at FROM identities WHERE did = $1',
      [agentDid]
    );

    const identityVerified = identityResult.rows[0]?.verified || false;
    const accountCreated = identityResult.rows[0]?.created_at || new Date();
    // created_at may arrive as a Date, an ISO string, or an invalid value from the
    // DB driver. Coerce and guard against NaN so accountAge never poisons the score.
    const accountCreatedMs = new Date(accountCreated).getTime();
    const accountAge = Number.isFinite(accountCreatedMs)
      ? Math.floor((Date.now() - accountCreatedMs) / (1000 * 60 * 60 * 24))
      : 0;

    // Get candidate credentials from the canonical credential store
    // (atp_credentials.credentials, written by vc-service). A `status = 'active'`
    // row is necessary but NOT sufficient — each candidate must still pass real
    // verification (issuer signature, expiry, revocation) via the injected
    // CredentialVerifier before it can count toward trust. We select
    // credential_data (the full VC) and credential_id so the verifier has what
    // it needs to do that work.
    const credentialsResult = await this.db.query(
      `SELECT credential_type AS type, issuer_did AS issuer, credential_data, credential_id
       FROM atp_credentials.credentials
       WHERE subject_did = $1 AND status = $2`,
      [agentDid, 'active']
    );

    let credentialsValidated: string[];
    if (this.verifier) {
      const verifier = this.verifier;
      const checks = await Promise.all(
        credentialsResult.rows.map((row: any) =>
          verifier.isVerified(row).catch(() => false)
        )
      );
      credentialsValidated = credentialsResult.rows
        .filter((_: any, i: number) => checks[i])
        .map((row: any) => row.type);
    } else {
      // Fail closed: without a verifier we cannot confirm a credential is
      // genuine, so none may inflate trust. Callers that want credentials to
      // count must inject a CredentialVerifier.
      credentialsValidated = [];
      if (credentialsResult.rows.length > 0) {
        logger.warn(
          'No CredentialVerifier injected — credentials not counted toward trust score',
          { agentDid, candidates: credentialsResult.rows.length }
        );
      }
    }

    // Get interaction history
    const interactionResult = await this.db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE success = true) as successful,
        COUNT(*) FILTER (WHERE success = false) as failed,
        MAX(created_at) as last_interaction
      FROM agent_interactions 
      WHERE agent_did = $1
    `, [agentDid]);

    const interactionHistory = {
      successful: parseInt(interactionResult.rows[0]?.successful || '0'),
      failed: parseInt(interactionResult.rows[0]?.failed || '0'),
      lastInteraction: interactionResult.rows[0]?.last_interaction || new Date()
    };

    // Get reputation data
    const reputationResult = await this.db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE type = 'endorsement') as endorsements,
        COUNT(*) FILTER (WHERE type = 'violation') as violations
      FROM agent_reputation 
      WHERE agent_did = $1
    `, [agentDid]);

    const reputation = {
      endorsements: parseInt(reputationResult.rows[0]?.endorsements || '0'),
      violations: parseInt(reputationResult.rows[0]?.violations || '0')
    };

    // Calculate active time (simplified - based on interaction count)
    const activeTime = Math.min(
      (interactionHistory.successful + interactionHistory.failed) * 0.1,
      accountAge * 24
    );

    return {
      identityVerified,
      credentialsValidated,
      interactionHistory,
      reputation,
      timeFactors: {
        accountAge,
        activeTime
      }
    };
  }

  /**
   * Compute numerical trust score from factors
   */
  private computeScore(factors: TrustFactors): number {
    let score = 0;

    // Identity verification (0-0.2)
    if (factors.identityVerified) {
      score += 0.2;
    }

    // Credentials (0-0.2)
    const credentialScore = Math.min(factors.credentialsValidated.length * 0.05, 0.2);
    score += credentialScore;

    // Interaction success rate (0-0.3)
    const totalInteractions = factors.interactionHistory.successful + factors.interactionHistory.failed;
    if (totalInteractions > 0) {
      const successRate = factors.interactionHistory.successful / totalInteractions;
      score += successRate * 0.3;
    }

    // Reputation (0-0.2)
    const netEndorsements = factors.reputation.endorsements - factors.reputation.violations;
    const reputationScore = Math.max(0, Math.min(netEndorsements * 0.02, 0.2));
    score += reputationScore;

    // Time factors (0-0.1)
    const ageScore = Math.min(factors.timeFactors.accountAge / 365, 0.05);
    const activityScore = Math.min(factors.timeFactors.activeTime / 1000, 0.05);
    score += ageScore + activityScore;

    // Ensure score is within 0-1 range. Collapse non-finite values to 0 first —
    // Math.max(0, NaN) is NaN, so the clamp alone would not catch a poisoned score.
    const safe = Number.isFinite(score) ? score : 0;
    return Math.max(0, Math.min(1, safe));
  }

  /**
   * Determine trust level from score
   */
  private determineLevel(score: number): AgentTrustLevel {
    if (score >= 0.9) return AgentTrustLevel.PRIVILEGED;
    if (score >= 0.7) return AgentTrustLevel.TRUSTED;
    if (score >= 0.4) return AgentTrustLevel.VERIFIED;
    if (score >= 0.2) return AgentTrustLevel.BASIC;
    return AgentTrustLevel.UNKNOWN;
  }

  /**
   * Generate recommendations to improve trust score
   */
  private generateRecommendations(factors: TrustFactors, score: number): string[] {
    const recommendations: string[] = [];

    if (!factors.identityVerified) {
      recommendations.push('Verify your identity to increase trust');
    }

    if (factors.credentialsValidated.length < 3) {
      recommendations.push('Add more verifiable credentials');
    }

    if (factors.interactionHistory.failed > factors.interactionHistory.successful * 0.1) {
      recommendations.push('Improve interaction success rate');
    }

    if (factors.reputation.violations > 0) {
      recommendations.push('Address trust violations');
    }

    if (factors.timeFactors.accountAge < 30) {
      recommendations.push('Build history over time');
    }

    if (score < AgentTrustLevel.VERIFIED) {
      recommendations.push('Complete more successful interactions');
    }

    return recommendations;
  }

  /**
   * Store trust score in database
   */
  private async storeTrustScore(agentDid: string, trustScore: TrustScore): Promise<void> {
    await this.db.query(`
      INSERT INTO agent_trust_scores 
      (agent_did, score, level, factors, calculated_at, recommendations)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (agent_did) 
      DO UPDATE SET 
        score = $2,
        level = $3,
        factors = $4,
        calculated_at = $5,
        recommendations = $6
    `, [
      agentDid,
      trustScore.score,
      trustScore.level,
      JSON.stringify(trustScore.factors),
      trustScore.calculatedAt,
      JSON.stringify(trustScore.recommendations)
    ]);
  }

  /**
   * Get trust level required for an action
   */
  static getRequiredTrustLevel(action: string): AgentTrustLevel {
    const trustRequirements: Record<string, AgentTrustLevel> = {
      'read_public': AgentTrustLevel.UNKNOWN,
      'send_message': AgentTrustLevel.BASIC,
      'access_tools': AgentTrustLevel.VERIFIED,
      'delegate_permissions': AgentTrustLevel.TRUSTED,
      'admin_actions': AgentTrustLevel.PRIVILEGED
    };

    return trustRequirements[action] || AgentTrustLevel.VERIFIED;
  }

  /**
   * Check if agent has sufficient trust for an action
   */
  async hassufficientTrust(agentDid: string, action: string): Promise<boolean> {
    const trustScore = await this.calculateTrustScore(agentDid);
    const requiredLevel = TrustScoringEngine.getRequiredTrustLevel(action);

    return trustScore.score >= requiredLevel;
  }

  /**
   * Evaluate agent trust score (alias for calculateTrustScore)
   */
  async evaluateAgent(agentDid: string): Promise<TrustScore> {
    return this.calculateTrustScore(agentDid);
  }
}

// Export convenience functions
export async function calculateTrustScore(
  agentDid: string,
  db: DatabaseManager,
  verifier?: CredentialVerifier
): Promise<TrustScore> {
  const engine = new TrustScoringEngine(db, verifier);
  return engine.calculateTrustScore(agentDid);
}

export async function checkTrustLevel(
  agentDid: string,
  requiredLevel: AgentTrustLevel,
  db: DatabaseManager,
  verifier?: CredentialVerifier
): Promise<boolean> {
  const engine = new TrustScoringEngine(db, verifier);
  const score = await engine.calculateTrustScore(agentDid);
  return score.score >= requiredLevel;
}
