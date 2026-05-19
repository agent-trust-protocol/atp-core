/**
 * Tests for Agent.mutualAuth safe-failure behavior.
 *
 * The previous implementation returned `theyVerified.verified: true` and
 * `trustEstablished: true` from a placeholder code path. Any caller gating
 * access on that result silently granted trust. These tests pin the new
 * contract: throw by default, and even under the explicit `experimental`
 * opt-in never report verified=true.
 */

import { Agent } from '../simple-agent';
import { ATPClient } from '../client/atp';
import { CryptoUtils } from '../utils/crypto';
import { TrustScoring, TrustLevel } from '../utils/trust';
import { ZKProofType } from '../types';

jest.mock('../client/atp');
jest.mock('../utils/crypto');
jest.mock('../utils/trust');

async function makeAgent(): Promise<Agent> {
  (ATPClient as jest.Mock).mockImplementation(() => ({
    identity: {
      registerDID: jest.fn().mockResolvedValue({ data: { did: 'did:atp:self' } })
    },
    audit: {
      logEvent: jest.fn().mockResolvedValue({ success: true }),
      queryEvents: jest.fn().mockResolvedValue({ data: { events: [] } })
    },
    permissions: { grantPermission: jest.fn().mockResolvedValue({ success: true }) },
    credentials: { issueCredential: jest.fn().mockResolvedValue({ data: { id: 'c' } }) },
    setAuthentication: jest.fn()
  }));
  (CryptoUtils.generateKeyPair as jest.Mock).mockResolvedValue({
    publicKey: 'a'.repeat(3968),
    privateKey: 'b'.repeat(8128),
    quantumSafe: true,
    ed25519PublicKey: 'c'.repeat(64),
    ed25519PrivateKey: 'd'.repeat(64),
    mlDsaPublicKey: 'e'.repeat(3904),
    mlDsaPrivateKey: 'f'.repeat(8064)
  });
  (CryptoUtils.generateX25519KeyPair as jest.Mock).mockReturnValue({
    publicKey: 'x'.repeat(64),
    privateKey: 'y'.repeat(64)
  });
  (CryptoUtils.generateId as jest.Mock).mockReturnValue('id-1');
  (TrustScoring as unknown as jest.Mock).mockImplementation(() => ({
    calculateTrustScore: jest.fn().mockReturnValue({
      score: 0.5,
      level: TrustLevel.BASIC,
      factors: {
        interactionScore: 0,
        recencyScore: 0,
        credentialScore: 0,
        successScore: 0
      },
      confidence: 0.5,
      metadata: {
        totalInteractions: 0,
        successfulInteractions: 0,
        credentialsVerified: 0,
        assessedAt: new Date().toISOString()
      }
    })
  }));
  return Agent.create('MutualAuthTest');
}

describe('Agent.mutualAuth', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws by default to prevent acting on a placeholder result', async () => {
    const agent = await makeAgent();
    await expect(
      agent.mutualAuth(
        'did:atp:peer',
        [{ type: ZKProofType.TRUST_LEVEL, params: { minTrustLevel: 0.5 } }],
        [{ type: ZKProofType.IDENTITY, params: {} }]
      )
    ).rejects.toThrow(/not implemented/i);
  });

  it('with { experimental: true } reports verified=false for BOTH sides', async () => {
    const agent = await makeAgent();
    const result = await agent.mutualAuth(
      'did:atp:peer',
      [{ type: ZKProofType.TRUST_LEVEL, params: { minTrustLevel: 0.5 } }],
      [{ type: ZKProofType.IDENTITY, params: {} }],
      { experimental: true }
    );
    expect(result.iVerified.verified).toBe(false);
    expect(result.iVerified.trustEstablished).toBe(false);
    expect(result.theyVerified.verified).toBe(false);
    expect(result.theyVerified.trustEstablished).toBe(false);
  });
});
