/**
 * W3C-style conformance tests for trust scoring.
 *
 * TABLE-DRIVEN so future W3C trust-registry conformance vectors can drop in as
 * new rows in the `levelVectors` / `monotonicity` tables.
 *
 * Properties under test (for the SDK `TrustScoring` engine):
 *   - Determinism: identical inputs → identical TrustScoreResult.
 *   - Bounds: score ∈ [0, 1]; factor scores ∈ [0, 1]; level is a valid TrustLevel.
 *   - Monotonicity: adding positive verified interactions / credentials never
 *     lowers the score; adding negative (failed) interactions never raises it.
 *   - Thresholds: scoreToLevel boundaries map to the documented TrustLevel.
 *
 * The shared `TrustScoringEngine` (packages/shared) is covered in a sibling
 * conformance suite; this file focuses on the SDK `TrustScoring` class, which is
 * pure and runs without any DB.
 */

import { TrustScoring, TrustLevel, InteractionEvent } from '../../utils/trust';

const NOW = '2024-06-01T00:00:00.000Z';

const positive = (n: number, ts: string = NOW): InteractionEvent[] =>
  Array.from({ length: n }, () => ({ timestamp: ts, action: 'message', success: true }));

const negative = (n: number, ts: string = NOW): InteractionEvent[] =>
  Array.from({ length: n }, () => ({ timestamp: ts, action: 'message', success: false }));

const VALID_LEVELS = new Set(Object.values(TrustLevel));

describe('Trust scoring — W3C conformance', () => {
  let scorer: TrustScoring;

  beforeEach(() => {
    scorer = new TrustScoring();
  });

  // ── determinism ───────────────────────────────────────────────────────────────
  describe('determinism', () => {
    const cases = [
      { name: 'empty history', interactions: [] as InteractionEvent[], creds: 0 },
      { name: 'recent positives', interactions: positive(10), creds: 2 },
      { name: 'mixed outcomes', interactions: [...positive(7), ...negative(3)], creds: 1 },
      { name: 'fixed-timestamp history', interactions: positive(5, '2020-01-01T00:00:00.000Z'), creds: 5 },
    ];

    it.each(cases)('same inputs produce the same score: $name', ({ interactions, creds }) => {
      const a = scorer.calculateTrustScore(interactions, creds);
      const b = scorer.calculateTrustScore(interactions, creds);

      // assessedAt is a wall-clock timestamp; everything else must be identical.
      expect(a.score).toBe(b.score);
      expect(a.level).toBe(b.level);
      expect(a.confidence).toBe(b.confidence);
      expect(a.factors).toEqual(b.factors);
      expect(a.metadata.totalInteractions).toBe(b.metadata.totalInteractions);
      expect(a.metadata.successfulInteractions).toBe(b.metadata.successfulInteractions);
      expect(a.metadata.credentialsVerified).toBe(b.metadata.credentialsVerified);
    });
  });

  // ── bounds ──────────────────────────────────────────────────────────────────────
  describe('bounds', () => {
    const cases = [
      { name: 'empty', interactions: [] as InteractionEvent[], creds: 0 },
      { name: 'all positive + max creds', interactions: positive(1000), creds: 10 },
      { name: 'all negative', interactions: negative(50), creds: 0 },
      { name: 'single positive', interactions: positive(1), creds: 0 },
      { name: 'huge cred count', interactions: positive(3), creds: 9999 },
    ];

    it.each(cases)('score and factors stay within [0,1] and level is valid: $name', ({ interactions, creds }) => {
      const r = scorer.calculateTrustScore(interactions, creds);

      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(1);
      expect(r.confidence).toBeGreaterThanOrEqual(0);
      expect(r.confidence).toBeLessThanOrEqual(1);

      for (const v of Object.values(r.factors)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }

      expect(VALID_LEVELS.has(r.level)).toBe(true);
    });
  });

  // ── monotonicity ──────────────────────────────────────────────────────────────
  describe('monotonicity', () => {
    it('more positive recent interactions never lowers the score', () => {
      let prev = -Infinity;
      for (const n of [0, 1, 3, 5, 10, 25, 50, 100]) {
        const score = scorer.calculateTrustScore(positive(n), 0).score;
        expect(score).toBeGreaterThanOrEqual(prev);
        prev = score;
      }
    });

    it('more verified credentials never lowers the score', () => {
      const base = positive(5);
      let prev = -Infinity;
      for (const c of [0, 1, 2, 3, 4, 5]) {
        const score = scorer.calculateTrustScore(base, c).score;
        expect(score).toBeGreaterThanOrEqual(prev);
        prev = score;
      }
    });

    it('adding failed interactions to a positive history never raises the score', () => {
      // Hold the positive count fixed; layer in increasing failures.
      const pos = positive(10);
      let prev = Infinity;
      for (const f of [0, 2, 5, 10, 20]) {
        const score = scorer.calculateTrustScore([...pos, ...negative(f)], 0).score;
        expect(score).toBeLessThanOrEqual(prev);
        prev = score;
      }
    });

    it('an all-negative history scores no higher than an all-positive history of equal size', () => {
      for (const n of [1, 5, 20, 100]) {
        const pos = scorer.calculateTrustScore(positive(n), 0).score;
        const neg = scorer.calculateTrustScore(negative(n), 0).score;
        expect(neg).toBeLessThanOrEqual(pos);
      }
    });
  });

  // ── thresholds (table-driven; vector-ready) ───────────────────────────────────
  describe('level thresholds', () => {
    // The documented scoreToLevel boundaries:
    //   <=0 UNKNOWN | <0.25 BASIC | <0.5 VERIFIED | <0.75 TRUSTED | >=0.75 PRIVILEGED
    // We drive synthetic inputs and assert the resulting level matches the band
    // its rounded score falls into — keeping the mapping itself under test.
    const levelOf = (score: number): TrustLevel => {
      if (score <= 0) return TrustLevel.UNKNOWN;
      if (score < 0.25) return TrustLevel.BASIC;
      if (score < 0.5) return TrustLevel.VERIFIED;
      if (score < 0.75) return TrustLevel.TRUSTED;
      return TrustLevel.PRIVILEGED;
    };

    const levelVectors = [
      { name: 'no data → BASIC band', interactions: [] as InteractionEvent[], creds: 0 },
      { name: 'single recent success', interactions: positive(1), creds: 0 },
      { name: 'moderate activity + creds', interactions: positive(15), creds: 1 },
      { name: 'high activity + creds', interactions: positive(100), creds: 5 },
      { name: 'all failed', interactions: negative(10), creds: 0 },
    ];

    it.each(levelVectors)('level matches the score band: $name', ({ interactions, creds }) => {
      const r = scorer.calculateTrustScore(interactions, creds);
      expect(r.level).toBe(levelOf(r.score));
    });

    it('maximal trust inputs reach PRIVILEGED', () => {
      const r = scorer.calculateTrustScore(positive(1000), 5);
      expect(r.score).toBeGreaterThanOrEqual(0.75);
      expect(r.level).toBe(TrustLevel.PRIVILEGED);
    });

    it('zero-trust inputs land at the bottom band', () => {
      const r = scorer.calculateTrustScore([], 0);
      // Neutral success (0.5*0.2=0.1) keeps an empty history in BASIC, never above.
      expect([TrustLevel.UNKNOWN, TrustLevel.BASIC]).toContain(r.level);
      expect(r.score).toBeLessThan(0.25);
    });
  });
});
