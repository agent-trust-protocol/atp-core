/**
 * W3C-style conformance tests for the shared TrustScoringEngine.
 *
 * TABLE-DRIVEN so future trust-registry conformance vectors can drop in as new
 * rows. The engine reads its inputs from a DatabaseManager; here we supply a
 * SQL-aware in-memory mock DB (no real Postgres) that returns deterministic rows
 * derived from a fixture object, so we can exercise the pure scoring + level
 * logic (computeScore / determineLevel) end-to-end through the public
 * calculateTrustScore() / evaluateAgent() API.
 *
 * Properties:
 *   - Determinism: identical fixtures → identical score & level.
 *   - Bounds: score ∈ [0, 1]; level ∈ AgentTrustLevel.
 *   - Monotonicity: more successes / endorsements / valid credentials never
 *     lower the score; more failures / violations never raise it.
 *   - Thresholds: documented level bands
 *       >=0.9 PRIVILEGED | >=0.7 TRUSTED | >=0.4 VERIFIED | >=0.2 BASIC | else UNKNOWN.
 */

import { TrustScoringEngine, AgentTrustLevel } from '../trust-scoring';

// ─── fixture + SQL-aware mock DB ────────────────────────────────────────────────

interface AgentFixture {
  identityVerified?: boolean;
  createdAt?: Date;
  credentials?: string[];
  successful?: number;
  failed?: number;
  endorsements?: number;
  violations?: number;
}

/**
 * Build a DatabaseManager-compatible stub. It dispatches on the SQL text used by
 * collectTrustFactors() and storeTrustScore(), returning rows from the fixture.
 */
const makeMockDb = (fx: AgentFixture) => {
  const query = jest.fn(async (text: string) => {
    if (text.includes('FROM identities')) {
      return {
        rows: [{ verified: fx.identityVerified ?? false, created_at: fx.createdAt ?? new Date() }],
      };
    }
    if (text.includes('FROM credentials')) {
      return { rows: (fx.credentials ?? []).map((type) => ({ type, issuer: 'did:atp:issuer' })) };
    }
    if (text.includes('FROM agent_interactions')) {
      return {
        rows: [
          {
            successful: String(fx.successful ?? 0),
            failed: String(fx.failed ?? 0),
            last_interaction: new Date(),
          },
        ],
      };
    }
    if (text.includes('FROM agent_reputation')) {
      return {
        rows: [
          {
            endorsements: String(fx.endorsements ?? 0),
            violations: String(fx.violations ?? 0),
          },
        ],
      };
    }
    // storeTrustScore INSERT — accept and return empty.
    return { rows: [] };
  });

  return { query } as any;
};

const scoreFor = async (fx: AgentFixture): Promise<{ score: number; level: AgentTrustLevel }> => {
  const engine = new TrustScoringEngine(makeMockDb(fx));
  const result = await engine.calculateTrustScore('did:atp:subject');
  return { score: result.score, level: result.level };
};

const VALID_LEVELS = new Set<number>(
  Object.values(AgentTrustLevel).filter((v) => typeof v === 'number') as number[]
);

describe('Shared TrustScoringEngine — W3C conformance', () => {
  // ── determinism ───────────────────────────────────────────────────────────────
  describe('determinism', () => {
    const cases: { name: string; fx: AgentFixture }[] = [
      { name: 'empty agent', fx: {} },
      { name: 'verified + credentials', fx: { identityVerified: true, credentials: ['vc1', 'vc2'] } },
      { name: 'busy agent', fx: { identityVerified: true, successful: 90, failed: 10, endorsements: 5, violations: 1 } },
    ];

    it.each(cases)('same fixture → same score & level: $name', async ({ fx }) => {
      const a = await scoreFor(fx);
      const b = await scoreFor(fx);
      expect(a.score).toBe(b.score);
      expect(a.level).toBe(b.level);
    });
  });

  // ── bounds ──────────────────────────────────────────────────────────────────────
  describe('bounds', () => {
    const cases: { name: string; fx: AgentFixture }[] = [
      { name: 'minimal', fx: {} },
      { name: 'maximal positives', fx: { identityVerified: true, credentials: Array(20).fill('vc'), successful: 10000, failed: 0, endorsements: 1000, violations: 0, createdAt: new Date(0) } },
      { name: 'heavy violations', fx: { successful: 1, failed: 1000, violations: 1000 } },
      { name: 'violations exceed endorsements', fx: { endorsements: 1, violations: 50 } },
    ];

    it.each(cases)('score ∈ [0,1] and level valid: $name', async ({ fx }) => {
      const { score, level } = await scoreFor(fx);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
      expect(VALID_LEVELS.has(level)).toBe(true);
    });
  });

  // ── monotonicity ──────────────────────────────────────────────────────────────
  describe('monotonicity', () => {
    it('more successful interactions never lowers the score', async () => {
      let prev = -Infinity;
      for (const s of [0, 1, 5, 20, 100, 1000]) {
        const { score } = await scoreFor({ identityVerified: true, successful: s, failed: 0 });
        expect(score).toBeGreaterThanOrEqual(prev);
        prev = score;
      }
    });

    it('more valid credentials never lowers the score', async () => {
      let prev = -Infinity;
      for (const c of [0, 1, 2, 4, 10]) {
        const { score } = await scoreFor({ credentials: Array(c).fill('vc') });
        expect(score).toBeGreaterThanOrEqual(prev);
        prev = score;
      }
    });

    it('more endorsements never lowers the score', async () => {
      let prev = -Infinity;
      for (const e of [0, 1, 5, 10, 50]) {
        const { score } = await scoreFor({ endorsements: e, violations: 0 });
        expect(score).toBeGreaterThanOrEqual(prev);
        prev = score;
      }
    });

    it('more failed interactions never raises the score (success count fixed)', async () => {
      let prev = Infinity;
      for (const f of [0, 1, 5, 20, 100]) {
        const { score } = await scoreFor({ identityVerified: true, successful: 50, failed: f });
        expect(score).toBeLessThanOrEqual(prev);
        prev = score;
      }
    });

    it('more violations never raises the score (endorsements fixed, unsaturated)', async () => {
      // Keep endorsements small so the reputation term is below its 0.2 cap and
      // violations actively reduce net reputation (gives the test real teeth).
      let prev = Infinity;
      for (const v of [0, 1, 2, 3, 5]) {
        const { score } = await scoreFor({ endorsements: 5, violations: v });
        expect(score).toBeLessThanOrEqual(prev);
        prev = score;
      }
    });
  });

  // ── thresholds (vector-ready) ─────────────────────────────────────────────────
  describe('level thresholds', () => {
    const levelOf = (score: number): AgentTrustLevel => {
      if (score >= 0.9) return AgentTrustLevel.PRIVILEGED;
      if (score >= 0.7) return AgentTrustLevel.TRUSTED;
      if (score >= 0.4) return AgentTrustLevel.VERIFIED;
      if (score >= 0.2) return AgentTrustLevel.BASIC;
      return AgentTrustLevel.UNKNOWN;
    };

    const vectors: { name: string; fx: AgentFixture }[] = [
      { name: 'empty', fx: {} },
      { name: 'identity only', fx: { identityVerified: true } },
      { name: 'identity + perfect interactions', fx: { identityVerified: true, successful: 100, failed: 0 } },
      { name: 'fully decorated agent', fx: { identityVerified: true, credentials: ['a', 'b', 'c', 'd'], successful: 500, failed: 0, endorsements: 20, violations: 0, createdAt: new Date(0) } },
      { name: 'mostly failing', fx: { identityVerified: true, successful: 1, failed: 99 } },
    ];

    it.each(vectors)('level matches score band: $name', async ({ fx }) => {
      const { score, level } = await scoreFor(fx);
      expect(level).toBe(levelOf(score));
    });
  });
});
