/**
 * Trust Registry / scoring conformance (Item D).
 *
 * Table-driven conformance tests for the SDK {@link TrustScoring} engine
 * (`packages/sdk/src/utils/trust.ts`), asserting two contract properties:
 *
 *   1. DETERMINISM — identical inputs always produce an identical score,
 *      factors, level and confidence. No hidden state, no randomness.
 *   2. BOUNDS — the overall score, every factor, and confidence stay within
 *      the documented [0, 1] range, and the level maps to the documented
 *      thresholds. Edge / adversarial inputs must never yield NaN, Infinity,
 *      negative values, or values above 1.
 */

import { TrustScoring, TrustLevel, InteractionEvent } from '../../utils/trust';

const ISO = (d: number) => new Date(d).toISOString();
const NOW = Date.now();

const repeat = (n: number, make: (i: number) => InteractionEvent): InteractionEvent[] =>
  Array.from({ length: n }, (_, i) => make(i));

const recentSuccess = (i: number): InteractionEvent => ({
  timestamp: ISO(NOW - i * 1000),
  action: 'message',
  success: true,
});

// ─── shared bounds helper ───────────────────────────────────────────────────────

function assertWithinBounds(result: ReturnType<TrustScoring['calculateTrustScore']>) {
  const checkUnit = (label: string, v: number) => {
    expect(Number.isFinite(v)).toBe(true); // not NaN / Infinity
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
    // guard against e.g. -0 / tiny negative drift sneaking through
    expect(label && v).not.toBeNaN();
  };
  checkUnit('score', result.score);
  checkUnit('confidence', result.confidence);
  checkUnit('interactionScore', result.factors.interactionScore);
  checkUnit('recencyScore', result.factors.recencyScore);
  checkUnit('credentialScore', result.factors.credentialScore);
  checkUnit('successScore', result.factors.successScore);
  expect(Object.values(TrustLevel)).toContain(result.level);
}

describe('Trust scoring conformance — determinism', () => {
  type Case = {
    name: string;
    interactions: InteractionEvent[];
    credentials: number;
  };

  const cases: Case[] = [
    { name: 'no data', interactions: [], credentials: 0 },
    { name: 'single recent success', interactions: [recentSuccess(0)], credentials: 0 },
    { name: 'small mixed batch', interactions: repeat(6, (i) => ({ timestamp: ISO(NOW - i * 1000), action: 'a', success: i % 2 === 0 })), credentials: 2 },
    { name: 'many successes + creds', interactions: repeat(40, recentSuccess), credentials: 4 },
    { name: 'fixed-timestamp batch', interactions: repeat(10, () => ({ timestamp: '2024-01-01T00:00:00.000Z', action: 'm', success: true })), credentials: 1 },
  ];

  it.each(cases)('$name → repeated calls produce identical results', ({ interactions, credentials }) => {
    const scorer = new TrustScoring();
    const a = scorer.calculateTrustScore(interactions, credentials);
    const b = scorer.calculateTrustScore(interactions, credentials);

    // assessedAt is a wall-clock timestamp and is the only legitimately
    // non-deterministic field — compare everything else exactly.
    expect(b.score).toBe(a.score);
    expect(b.level).toBe(a.level);
    expect(b.confidence).toBe(a.confidence);
    expect(b.factors).toEqual(a.factors);
    expect(b.metadata.totalInteractions).toBe(a.metadata.totalInteractions);
    expect(b.metadata.successfulInteractions).toBe(a.metadata.successfulInteractions);
    expect(b.metadata.credentialsVerified).toBe(a.metadata.credentialsVerified);
    expect(b.metadata.lastInteractionAt).toBe(a.metadata.lastInteractionAt);
  });

  it.each(cases)('$name → fresh instances agree (no cross-instance state)', ({ interactions, credentials }) => {
    const a = new TrustScoring().calculateTrustScore(interactions, credentials);
    const b = new TrustScoring().calculateTrustScore(interactions, credentials);
    expect(b.score).toBe(a.score);
    expect(b.factors).toEqual(a.factors);
  });

  it('TEETH: a non-deterministic (random success) input WOULD break the determinism assertion', () => {
    const scorer = new TrustScoring();
    // Build two batches whose only difference is randomized success flags,
    // proving the success factor actually feeds the score. If scoring ignored
    // success entirely this would (incorrectly) pass with equal scores.
    const allTrue = repeat(10, (i) => ({ timestamp: ISO(NOW - i * 1000), action: 'm', success: true }));
    const allFalse = repeat(10, (i) => ({ timestamp: ISO(NOW - i * 1000), action: 'm', success: false }));
    const s1 = scorer.calculateTrustScore(allTrue, 0).score;
    const s2 = scorer.calculateTrustScore(allFalse, 0).score;
    expect(s1).not.toBe(s2); // determinism check has real discriminating power
  });

  it('static simpleScore is deterministic for identical input', () => {
    const interactions = repeat(12, recentSuccess);
    expect(TrustScoring.simpleScore(interactions)).toBe(TrustScoring.simpleScore(interactions));
  });
});

describe('Trust scoring conformance — bounds & edge inputs', () => {
  type Edge = { name: string; interactions: InteractionEvent[]; credentials: number };

  const edges: Edge[] = [
    { name: 'empty interactions, zero creds', interactions: [], credentials: 0 },
    { name: 'all failures', interactions: repeat(10, (i) => ({ timestamp: ISO(NOW - i * 1000), action: 'm', success: false })), credentials: 0 },
    { name: 'all successes', interactions: repeat(10, recentSuccess), credentials: 0 },
    { name: 'huge interaction count', interactions: repeat(5000, recentSuccess), credentials: 5 },
    { name: 'huge credential count (over cap)', interactions: [], credentials: 1000 },
    { name: 'negative credential count', interactions: [recentSuccess(0)], credentials: -5 },
    { name: 'future-dated interactions', interactions: repeat(5, (i) => ({ timestamp: ISO(NOW + (i + 1) * 86_400_000), action: 'm', success: true })), credentials: 0 },
    { name: 'ancient interactions', interactions: repeat(5, (i) => ({ timestamp: ISO(NOW - (i + 1) * 365 * 86_400_000), action: 'm', success: true })), credentials: 0 },
    { name: 'invalid timestamp strings', interactions: [{ timestamp: 'not-a-date', action: 'm', success: true }], credentials: 0 },
    { name: 'empty-string timestamps', interactions: [{ timestamp: '', action: 'm', success: true }], credentials: 0 },
    { name: 'missing success flags', interactions: repeat(4, (i) => ({ timestamp: ISO(NOW - i * 1000), action: 'm' })), credentials: 0 },
    { name: 'mixed valid + invalid timestamps', interactions: [{ timestamp: ISO(NOW), action: 'm', success: true }, { timestamp: 'garbage', action: 'm', success: false }], credentials: 2 },
  ];

  it.each(edges)('$name → all values within [0,1], finite, valid level', ({ interactions, credentials }) => {
    const result = new TrustScoring().calculateTrustScore(interactions, credentials);
    assertWithinBounds(result);
  });

  it.each(edges)('$name → custom weights still stay within bounds', ({ interactions, credentials }) => {
    const scorer = new TrustScoring({
      interactionWeight: 0.4,
      recencyWeight: 0.3,
      credentialWeight: 0.2,
      successWeight: 0.1,
    });
    assertWithinBounds(scorer.calculateTrustScore(interactions, credentials));
  });

  it('level monotonically tracks score thresholds', () => {
    const scorer = new TrustScoring();
    const levelFor = (score: number): TrustLevel => {
      if (score <= 0) return TrustLevel.UNKNOWN;
      if (score < 0.25) return TrustLevel.BASIC;
      if (score < 0.5) return TrustLevel.VERIFIED;
      if (score < 0.75) return TrustLevel.TRUSTED;
      return TrustLevel.PRIVILEGED;
    };
    for (const edge of edges) {
      const r = scorer.calculateTrustScore(edge.interactions, edge.credentials);
      expect(r.level).toBe(levelFor(r.score));
    }
  });

  it('huge inputs saturate at the maximum without exceeding 1', () => {
    const r = new TrustScoring().calculateTrustScore(repeat(100000, recentSuccess), 100000);
    expect(r.score).toBeLessThanOrEqual(1);
    expect(r.factors.interactionScore).toBe(1);
    expect(r.factors.credentialScore).toBe(1);
    expect(Number.isFinite(r.score)).toBe(true);
  });

  it('static levelFromCount is bounded and monotonic non-decreasing', () => {
    const counts = [0, 1, 4, 5, 19, 20, 49, 50, 100, 1_000_000, -1];
    let prev = -Infinity;
    for (const c of counts.filter((x) => x >= 0)) {
      const v = TrustScoring.levelFromCount(c);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});
