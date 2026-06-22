/**
 * Pillar-2 wiring test for the MCP security wrapper.
 *
 * Proves that an INJECTED CredentialVerifier actually changes the trust outcome:
 *   - a *verified* credential raises the agent's trust enough to clear the
 *     trust gate for `tools/call` (required level 0.4), and
 *   - a *forged / unverified* credential does NOT count, so the same agent is
 *     denied (fail-closed).
 *
 * We disable authentication / audit / rate-limit so the only thing under test is
 * the trust-level gate, which is driven by TrustScoringEngine + the verifier.
 */

import type { CredentialVerifier, CredentialRow } from '@atp/shared';
import { MCPSecurityWrapper, MCPSecurityConfig } from '../security-wrapper';

const CLIENT_DID = 'did:atp:agent-1';

/**
 * Minimal SQL-aware mock DB matching what collectTrustFactors() queries.
 * The agent is identity-verified (0.2) and carries 4 candidate credentials, so
 * if all four are credited the score reaches 0.2 + 4*0.05 = 0.4 (passes
 * tools/call); if none are credited it stays at 0.2 (fails).
 */
const makeMockDb = () => {
  const query = jest.fn(async (text: string) => {
    if (text.includes('FROM identities')) {
      return { rows: [{ verified: true, created_at: new Date() }] };
    }
    if (text.includes('atp_credentials.credentials')) {
      return {
        rows: [
          { type: 'vc-a', issuer: 'did:atp:issuer', credential_id: 'c-a' },
          { type: 'vc-b', issuer: 'did:atp:issuer', credential_id: 'c-b' },
          { type: 'vc-c', issuer: 'did:atp:issuer', credential_id: 'c-c' },
          { type: 'vc-d', issuer: 'did:atp:issuer', credential_id: 'c-d' },
        ],
      };
    }
    if (text.includes('FROM agent_interactions')) {
      return { rows: [{ successful: '0', failed: '0', last_interaction: new Date() }] };
    }
    if (text.includes('FROM agent_reputation')) {
      return { rows: [{ endorsements: '0', violations: '0' }] };
    }
    // storeTrustScore INSERT and any audit writes -> accept.
    return { rows: [] };
  });
  return { query } as any;
};

const baseConfig = (
  _db: any,
  credentialVerifier?: CredentialVerifier
): MCPSecurityConfig => ({
  enforceAuthentication: false,
  requireAuditLogging: false,
  rateLimitEnabled: false,
  quantumSafeSignatures: false,
  trustedDomains: [],
  maxRequestsPerMinute: 1000,
  credentialVerifier,
});

const toolsCallRequest = () => ({
  id: 1,
  method: 'tools/call',
  params: { name: 'do-thing' },
  atpHeaders: {
    clientDID: CLIENT_DID,
    signature: 'unused',
    trustLevel: 0 as any,
    timestamp: Date.now(),
  },
});

describe('MCPSecurityWrapper — credential verification wiring (pillar 2)', () => {
  it('credits a VERIFIED credential toward trust so tools/call is permitted', async () => {
    const verifier: CredentialVerifier = {
      isVerified: async (_row: CredentialRow) => true, // every candidate verifies
    };
    const db = makeMockDb();
    const wrapper = new MCPSecurityWrapper(baseConfig(db, verifier), db);
    const handler = wrapper.wrapMCPServer(async () => ({ ok: true }));

    const res = await handler(toolsCallRequest());

    expect(res.error).toBeUndefined();
    expect(res.result).toEqual({ ok: true });
    expect(res.atpMetadata?.trustVerified).toBe(true);
  });

  it('does NOT credit a FORGED/unverified credential, so tools/call is denied', async () => {
    const verifier: CredentialVerifier = {
      isVerified: async (_row: CredentialRow) => false, // nothing verifies (forged)
    };
    const db = makeMockDb();
    const wrapper = new MCPSecurityWrapper(baseConfig(db, verifier), db);
    const handler = wrapper.wrapMCPServer(async () => ({ ok: true }));

    const res = await handler(toolsCallRequest());

    expect(res.result).toBeUndefined();
    expect(res.error).toBeDefined();
    expect(res.error?.message).toMatch(/insufficient trust/i);
  });

  it('fails closed with NO verifier injected (credentials cannot count)', async () => {
    const db = makeMockDb();
    const wrapper = new MCPSecurityWrapper(baseConfig(db, undefined), db);
    const handler = wrapper.wrapMCPServer(async () => ({ ok: true }));

    const res = await handler(toolsCallRequest());

    expect(res.result).toBeUndefined();
    expect(res.error?.message).toMatch(/insufficient trust/i);
  });
});
