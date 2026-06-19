/**
 * Enhanced Trust Scoring System for ATP™ SDK
 *
 * Provides multi-factor trust scoring based on:
 * - Interaction history and recency
 * - Credential verification status
 * - Behavioral patterns
 * - Time-weighted scoring
 */

/**
 * Trust level thresholds and their meanings
 */
export enum TrustLevel {
  UNKNOWN = 'UNKNOWN',       // 0.0 - No history
  BASIC = 'BASIC',           // 0.0-0.25 - Limited interactions
  VERIFIED = 'VERIFIED',     // 0.25-0.5 - Identity verified
  TRUSTED = 'TRUSTED',       // 0.5-0.75 - Established relationship
  PRIVILEGED = 'PRIVILEGED'  // 0.75-1.0 - High trust
}

/**
 * Detailed trust score result
 */
export interface TrustScoreResult {
  /** Overall trust score from 0 to 1 */
  score: number;
  /** Trust level category */
  level: TrustLevel;
  /** Individual factor scores */
  factors: {
    /** Score based on interaction count (0-1) */
    interactionScore: number;
    /** Score based on interaction recency (0-1) */
    recencyScore: number;
    /** Score based on credential verification (0-1) */
    credentialScore: number;
    /** Score based on success rate of interactions (0-1) */
    successScore: number;
  };
  /** Confidence in the score (0-1), higher with more data */
  confidence: number;
  /** Metadata about the trust assessment */
  metadata: {
    totalInteractions: number;
    successfulInteractions: number;
    lastInteractionAt?: string;
    credentialsVerified: number;
    assessedAt: string;
  };
}

/**
 * Interaction event for trust calculation
 */
export interface InteractionEvent {
  timestamp: string;
  action: string;
  success?: boolean;
  severity?: 'low' | 'medium' | 'high';
}

/**
 * Configuration for trust scoring
 */
export interface TrustScoringConfig {
  /** Weight for interaction count factor (default: 0.25) */
  interactionWeight?: number;
  /** Weight for recency factor (default: 0.25) */
  recencyWeight?: number;
  /** Weight for credential verification factor (default: 0.30) */
  credentialWeight?: number;
  /** Weight for success rate factor (default: 0.20) */
  successWeight?: number;
  /** Time in milliseconds for full recency decay (default: 30 days) */
  recencyDecayPeriod?: number;
  /** Minimum interactions for full confidence (default: 20) */
  minInteractionsForConfidence?: number;
}

const DEFAULT_CONFIG: Required<TrustScoringConfig> = {
  interactionWeight: 0.25,
  recencyWeight: 0.25,
  credentialWeight: 0.30,
  successWeight: 0.20,
  recencyDecayPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
  minInteractionsForConfidence: 20
};

/**
 * Parse a timestamp into epoch milliseconds, returning null for any value that
 * cannot be parsed (undefined, null, empty, malformed). Using Number.isFinite
 * guards against `new Date(bad).getTime()` returning NaN, which would otherwise
 * poison the entire weighted trust score.
 */
function parseTimestampMs(timestamp: unknown): number | null {
  // null/undefined are unparseable per the contract. Handle them explicitly:
  // new Date(null) coerces to the Unix epoch (getTime() === 0), which would
  // otherwise pass Number.isFinite and be returned as 0 instead of null.
  if (timestamp == null) return null;
  const ms = new Date(timestamp as string | number | Date).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Round to 2 decimal places, collapsing any non-finite value (NaN/Infinity) to 0
 * so the public TrustScoreResult always exposes finite, in-range numbers.
 */
function round2(n: number): number {
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

export class TrustScoring {
  private config: Required<TrustScoringConfig>;

  constructor(config?: TrustScoringConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Calculate a comprehensive trust score
   */
  calculateTrustScore(
    interactions: InteractionEvent[],
    verifiedCredentials: number = 0
  ): TrustScoreResult {
    const now = new Date();

    // Calculate individual factor scores
    const interactionScore = this.calculateInteractionScore(interactions.length);
    const recencyScore = this.calculateRecencyScore(interactions, now);
    const credentialScore = this.calculateCredentialScore(verifiedCredentials);
    const successScore = this.calculateSuccessScore(interactions);

    // Weighted combination. Collapse any non-finite result to 0 so a bad factor
    // can never leak NaN into the score or misclassify the level (NaN comparisons
    // are always false, which would otherwise fall through scoreToLevel to PRIVILEGED).
    const rawScore =
      interactionScore * this.config.interactionWeight +
      recencyScore * this.config.recencyWeight +
      credentialScore * this.config.credentialWeight +
      successScore * this.config.successWeight;
    const score = Number.isFinite(rawScore) ? rawScore : 0;

    // Calculate confidence based on data availability
    const confidence = this.calculateConfidence(interactions.length, verifiedCredentials);

    // Determine trust level
    const level = this.scoreToLevel(score);

    // Calculate metadata
    const successfulInteractions = interactions.filter(i => i.success !== false).length;
    const lastInteraction = this.getLastInteraction(interactions);

    return {
      score: round2(score), // Round to 2 decimal places; non-finite collapses to 0
      level,
      factors: {
        interactionScore: round2(interactionScore),
        recencyScore: round2(recencyScore),
        credentialScore: round2(credentialScore),
        successScore: round2(successScore)
      },
      confidence: round2(confidence),
      metadata: {
        totalInteractions: interactions.length,
        successfulInteractions,
        lastInteractionAt: lastInteraction?.timestamp,
        credentialsVerified: verifiedCredentials,
        assessedAt: now.toISOString()
      }
    };
  }

  /**
   * Calculate score based on number of interactions
   * Uses logarithmic scaling to handle large interaction counts
   */
  private calculateInteractionScore(count: number): number {
    if (count === 0) return 0;
    if (count >= 100) return 1.0;

    // Logarithmic scaling: log(count+1) / log(101) for smooth curve
    return Math.min(1, Math.log(count + 1) / Math.log(101));
  }

  /**
   * Calculate score based on recency of interactions
   * More recent interactions contribute more to the score
   */
  private calculateRecencyScore(interactions: InteractionEvent[], now: Date): number {
    if (interactions.length === 0) return 0;

    const decayPeriod = this.config.recencyDecayPeriod;
    let totalWeight = 0;
    let recentWeight = 0;

    for (const interaction of interactions) {
      const ms = parseTimestampMs(interaction.timestamp);
      // An unparseable timestamp is treated as "infinitely old": it contributes
      // zero recency weight but still counts as an interaction (stays in the
      // denominator). Clamp to [0,1] so a future timestamp (negative age) can't
      // inflate recency above 1.
      const weight =
        ms === null ? 0 : Math.max(0, Math.min(1, 1 - (now.getTime() - ms) / decayPeriod));
      recentWeight += weight;
      totalWeight += 1;
    }

    if (totalWeight === 0) return 0;
    return recentWeight / totalWeight;
  }

  /**
   * Calculate score based on verified credentials
   */
  private calculateCredentialScore(verifiedCount: number): number {
    // Clamp negative / non-finite inputs to 0 so the factor never goes below 0.
    if (!Number.isFinite(verifiedCount) || verifiedCount <= 0) return 0;
    if (verifiedCount >= 5) return 1.0;

    // Each credential adds 0.2 to the score up to 1.0
    return Math.min(1, verifiedCount * 0.2);
  }

  /**
   * Calculate score based on success rate of interactions
   */
  private calculateSuccessScore(interactions: InteractionEvent[]): number {
    if (interactions.length === 0) return 0.5; // Neutral if no data

    const explicitResults = interactions.filter(i => i.success !== undefined);
    if (explicitResults.length === 0) return 0.5;

    const successCount = explicitResults.filter(i => i.success === true).length;
    return successCount / explicitResults.length;
  }

  /**
   * Calculate confidence in the trust score
   */
  private calculateConfidence(interactionCount: number, credentialCount: number): number {
    // Guard against NaN/non-finite credential counts: Math.max(0, NaN) is NaN,
    // which would propagate into confidence and break the [0,1] contract.
    const safeCredentialCount = Number.isFinite(credentialCount) ? Math.max(0, credentialCount) : 0;
    const interactionConfidence = Math.min(
      1,
      Math.max(0, interactionCount) / this.config.minInteractionsForConfidence
    );
    const credentialConfidence = Math.min(1, safeCredentialCount * 0.25);

    // Weighted average of confidence factors
    return interactionConfidence * 0.7 + credentialConfidence * 0.3;
  }

  /**
   * Convert numerical score to trust level
   */
  private scoreToLevel(score: number): TrustLevel {
    if (score <= 0) return TrustLevel.UNKNOWN;
    if (score < 0.25) return TrustLevel.BASIC;
    if (score < 0.5) return TrustLevel.VERIFIED;
    if (score < 0.75) return TrustLevel.TRUSTED;
    return TrustLevel.PRIVILEGED;
  }

  /**
   * Get the most recent interaction
   */
  private getLastInteraction(interactions: InteractionEvent[]): InteractionEvent | undefined {
    if (interactions.length === 0) return undefined;

    return interactions.reduce((latest, current) => {
      // Treat unparseable timestamps as -Infinity so a corrupt value can never
      // win the "most recent" comparison.
      const latestTime = parseTimestampMs(latest.timestamp) ?? -Infinity;
      const currentTime = parseTimestampMs(current.timestamp) ?? -Infinity;
      return currentTime > latestTime ? current : latest;
    });
  }

  /**
   * Get simple numeric score (for backward compatibility)
   */
  static simpleScore(interactions: InteractionEvent[]): number {
    const scorer = new TrustScoring();
    return scorer.calculateTrustScore(interactions).score;
  }

  /**
   * Get trust level from simple interaction count (backward compatible)
   */
  static levelFromCount(count: number): number {
    if (count === 0) return 0;
    if (count < 5) return 0.25;
    if (count < 20) return 0.5;
    if (count < 50) return 0.75;
    return 1.0;
  }
}

export default TrustScoring;
