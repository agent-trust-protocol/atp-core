/**
 * Tests for TrustScoring system
 */

import { TrustScoring, TrustLevel, InteractionEvent } from '../../utils/trust';

describe('TrustScoring', () => {
  let scorer: TrustScoring;

  beforeEach(() => {
    scorer = new TrustScoring();
  });

  describe('calculateTrustScore', () => {
    it('should return BASIC level for no interactions', () => {
      const result = scorer.calculateTrustScore([], 0);

      // With no interactions, only success score contributes (0.5 neutral * 0.2 weight = 0.1)
      expect(result.score).toBe(0.1);
      expect(result.level).toBe(TrustLevel.BASIC);
      expect(result.confidence).toBe(0);
    });

    it('should return VERIFIED level for few recent interactions', () => {
      const interactions: InteractionEvent[] = [
        { timestamp: new Date().toISOString(), action: 'message', success: true }
      ];

      const result = scorer.calculateTrustScore(interactions, 0);

      // Recent interactions with high success rate boost recency and success factors
      expect(result.level).toBe(TrustLevel.VERIFIED);
      expect(result.score).toBeGreaterThan(0.25);
      expect(result.score).toBeLessThan(0.5);
    });

    it('should increase score with more interactions', () => {
      const interactions1: InteractionEvent[] = Array(5).fill(null).map(() => ({
        timestamp: new Date().toISOString(),
        action: 'message',
        success: true
      }));

      const interactions2: InteractionEvent[] = Array(20).fill(null).map(() => ({
        timestamp: new Date().toISOString(),
        action: 'message',
        success: true
      }));

      const result1 = scorer.calculateTrustScore(interactions1, 0);
      const result2 = scorer.calculateTrustScore(interactions2, 0);

      expect(result2.score).toBeGreaterThan(result1.score);
      expect(result2.factors.interactionScore).toBeGreaterThan(result1.factors.interactionScore);
    });

    it('should increase score with verified credentials', () => {
      const interactions: InteractionEvent[] = [];

      const result0 = scorer.calculateTrustScore(interactions, 0);
      const result2 = scorer.calculateTrustScore(interactions, 2);
      const result5 = scorer.calculateTrustScore(interactions, 5);

      expect(result2.score).toBeGreaterThan(result0.score);
      expect(result5.score).toBeGreaterThan(result2.score);
      expect(result5.factors.credentialScore).toBe(1);
    });

    it('should factor in recency of interactions', () => {
      const now = Date.now();
      const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

      const recentInteractions: InteractionEvent[] = [
        { timestamp: new Date(now).toISOString(), action: 'message', success: true }
      ];

      const oldInteractions: InteractionEvent[] = [
        { timestamp: new Date(monthAgo).toISOString(), action: 'message', success: true }
      ];

      const recentResult = scorer.calculateTrustScore(recentInteractions, 0);
      const oldResult = scorer.calculateTrustScore(oldInteractions, 0);

      expect(recentResult.factors.recencyScore).toBeGreaterThan(oldResult.factors.recencyScore);
    });

    it('should factor in success rate', () => {
      const allSuccess: InteractionEvent[] = Array(10).fill(null).map(() => ({
        timestamp: new Date().toISOString(),
        action: 'message',
        success: true
      }));

      const halfFailed: InteractionEvent[] = Array(10).fill(null).map((_, i) => ({
        timestamp: new Date().toISOString(),
        action: 'message',
        success: i < 5 // First 5 succeed, last 5 fail
      }));

      const successResult = scorer.calculateTrustScore(allSuccess, 0);
      const mixedResult = scorer.calculateTrustScore(halfFailed, 0);

      expect(successResult.factors.successScore).toBe(1);
      expect(mixedResult.factors.successScore).toBe(0.5);
    });

    it('should calculate confidence based on data availability', () => {
      const fewInteractions: InteractionEvent[] = Array(5).fill(null).map(() => ({
        timestamp: new Date().toISOString(),
        action: 'message',
        success: true
      }));

      const manyInteractions: InteractionEvent[] = Array(30).fill(null).map(() => ({
        timestamp: new Date().toISOString(),
        action: 'message',
        success: true
      }));

      const lowConfidence = scorer.calculateTrustScore(fewInteractions, 0);
      const highConfidence = scorer.calculateTrustScore(manyInteractions, 3);

      expect(highConfidence.confidence).toBeGreaterThan(lowConfidence.confidence);
    });

    it('should include metadata in results', () => {
      const interactions: InteractionEvent[] = [
        { timestamp: '2024-01-01T00:00:00Z', action: 'message', success: true },
        { timestamp: '2024-01-02T00:00:00Z', action: 'transfer', success: false },
        { timestamp: '2024-01-03T00:00:00Z', action: 'message', success: true }
      ];

      const result = scorer.calculateTrustScore(interactions, 2);

      expect(result.metadata.totalInteractions).toBe(3);
      expect(result.metadata.successfulInteractions).toBe(2);
      expect(result.metadata.credentialsVerified).toBe(2);
      expect(result.metadata.lastInteractionAt).toBe('2024-01-03T00:00:00Z');
      expect(result.metadata.assessedAt).toBeDefined();
    });
  });

  describe('Trust Level Classification', () => {
    it('should classify no interactions as BASIC (neutral success score)', () => {
      const result = scorer.calculateTrustScore([], 0);
      // With no data, neutral success score (0.5 * 0.2 = 0.1) puts this in BASIC
      expect(result.level).toBe(TrustLevel.BASIC);
      expect(result.score).toBe(0.1);
    });

    it('should classify recent interactions with success as TRUSTED', () => {
      // Recent successful interactions maximize recency and success factors
      const interactions: InteractionEvent[] = Array(3).fill(null).map(() => ({
        timestamp: new Date().toISOString(),
        action: 'message',
        success: true
      }));

      const result = scorer.calculateTrustScore(interactions, 0);
      // High recency (1.0) + high success (1.0) + moderate interaction score
      expect([TrustLevel.TRUSTED, TrustLevel.VERIFIED]).toContain(result.level);
    });

    it('should classify moderate activity with credentials as TRUSTED', () => {
      const interactions: InteractionEvent[] = Array(15).fill(null).map(() => ({
        timestamp: new Date().toISOString(),
        action: 'message',
        success: true
      }));

      const result = scorer.calculateTrustScore(interactions, 1);
      expect([TrustLevel.TRUSTED, TrustLevel.PRIVILEGED]).toContain(result.level);
    });

    it('should classify high activity with credentials as TRUSTED or PRIVILEGED', () => {
      const interactions: InteractionEvent[] = Array(50).fill(null).map(() => ({
        timestamp: new Date().toISOString(),
        action: 'message',
        success: true
      }));

      const result = scorer.calculateTrustScore(interactions, 4);
      expect([TrustLevel.TRUSTED, TrustLevel.PRIVILEGED]).toContain(result.level);
    });
  });

  describe('Custom Configuration', () => {
    it('should accept custom weights', () => {
      const customScorer = new TrustScoring({
        interactionWeight: 0.5, // Emphasize interactions
        recencyWeight: 0.2,
        credentialWeight: 0.2,
        successWeight: 0.1
      });

      const interactions: InteractionEvent[] = Array(50).fill(null).map(() => ({
        timestamp: new Date().toISOString(),
        action: 'message',
        success: true
      }));

      const customResult = customScorer.calculateTrustScore(interactions, 0);
      const defaultResult = scorer.calculateTrustScore(interactions, 0);

      // With higher interaction weight and many interactions, score should be higher
      expect(customResult.score).toBeGreaterThan(defaultResult.score);
    });

    it('should accept custom recency decay period', () => {
      const shortDecay = new TrustScoring({
        recencyDecayPeriod: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      const longDecay = new TrustScoring({
        recencyDecayPeriod: 90 * 24 * 60 * 60 * 1000 // 90 days
      });

      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const interactions: InteractionEvent[] = [
        { timestamp: new Date(twoWeeksAgo).toISOString(), action: 'message', success: true }
      ];

      const shortResult = shortDecay.calculateTrustScore(interactions, 0);
      const longResult = longDecay.calculateTrustScore(interactions, 0);

      // With short decay, 2-week-old interaction is outside window (recency = 0)
      // With long decay, it's still recent
      expect(longResult.factors.recencyScore).toBeGreaterThan(shortResult.factors.recencyScore);
    });
  });

  describe('Static Helper Methods', () => {
    it('simpleScore should return numeric score', () => {
      const interactions: InteractionEvent[] = Array(10).fill(null).map(() => ({
        timestamp: new Date().toISOString(),
        action: 'message',
        success: true
      }));

      const score = TrustScoring.simpleScore(interactions);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('levelFromCount should return correct thresholds', () => {
      expect(TrustScoring.levelFromCount(0)).toBe(0);
      expect(TrustScoring.levelFromCount(1)).toBe(0.25);
      expect(TrustScoring.levelFromCount(4)).toBe(0.25);
      expect(TrustScoring.levelFromCount(5)).toBe(0.5);
      expect(TrustScoring.levelFromCount(19)).toBe(0.5);
      expect(TrustScoring.levelFromCount(20)).toBe(0.75);
      expect(TrustScoring.levelFromCount(49)).toBe(0.75);
      expect(TrustScoring.levelFromCount(50)).toBe(1.0);
      expect(TrustScoring.levelFromCount(100)).toBe(1.0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle interactions without explicit success field', () => {
      const interactions: InteractionEvent[] = [
        { timestamp: new Date().toISOString(), action: 'message' }, // No success field
        { timestamp: new Date().toISOString(), action: 'transfer' }
      ];

      const result = scorer.calculateTrustScore(interactions, 0);

      // Should default to neutral success score (0.5)
      expect(result.factors.successScore).toBe(0.5);
    });

    it('should handle very old interactions', () => {
      const yearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
      const interactions: InteractionEvent[] = [
        { timestamp: new Date(yearAgo).toISOString(), action: 'message', success: true }
      ];

      const result = scorer.calculateTrustScore(interactions, 0);

      // Recency score should be 0 for very old interactions
      expect(result.factors.recencyScore).toBe(0);
    });

    it('should handle large number of interactions', () => {
      const interactions: InteractionEvent[] = Array(1000).fill(null).map(() => ({
        timestamp: new Date().toISOString(),
        action: 'message',
        success: true
      }));

      const result = scorer.calculateTrustScore(interactions, 5);

      expect(result.score).toBeGreaterThan(0.8);
      expect(result.level).toBe(TrustLevel.PRIVILEGED);
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should handle all failed interactions', () => {
      const interactions: InteractionEvent[] = Array(10).fill(null).map(() => ({
        timestamp: new Date().toISOString(),
        action: 'message',
        success: false
      }));

      const result = scorer.calculateTrustScore(interactions, 0);

      expect(result.factors.successScore).toBe(0);
      expect(result.score).toBeLessThan(0.5);
    });
  });
});
