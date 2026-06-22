/**
 * F1 end-to-end: VC-backed trust is now functional.
 *
 * Proves the full chain wired by #92/#96 plus the F1 query fix:
 *   atp_credentials.credentials (credential_data) -> TrustScoringEngine ->
 *   VcServiceCredentialVerifier -> CredentialService.verifyCredential -> score.
 *
 * Only a genuinely verified credential (full payload + valid result) raises the
 * trust score; a forged one, or a row without the payload, credits nothing.
 */
import { TrustScoringEngine } from '@atp/shared';
import { VcServiceCredentialVerifier } from '../credential-verifier.js';
import type { CredentialService } from '../credential.js';

const SUBJECT = 'did:atp:subject-e2e';

const makeVC = (type: string, proofValue = 'sig') => ({
  '@context': ['https://www.w3.org/2018/credentials/v1'],
  id: `urn:uuid:${type}`,
  type: ['VerifiableCredential', type],
  issuer: 'did:atp:issuer',
  issuanceDate: new Date().toISOString(),
  credentialSubject: { id: SUBJECT, role: 'agent' },
  proof: { type: 'Ed25519Signature2020', proofValue },
});

// Mock DB matching the SQL collectTrustFactors() issues, including the F1 query
// against atp_credentials.credentials returning credential_data.
const makeDb = (credentialRows: any[]) =>
  ({
    query: jest.fn(async (text: string) => {
      if (text.includes('FROM identities')) {
        return { rows: [{ verified: true, created_at: new Date() }] };
      }
      if (text.includes('atp_credentials.credentials')) {
        return { rows: credentialRows };
      }
      if (text.includes('FROM agent_interactions')) {
        return { rows: [{ successful: '0', failed: '0', last_interaction: new Date() }] };
      }
      if (text.includes('FROM agent_reputation')) {
        return { rows: [{ endorsements: '0', violations: '0' }] };
      }
      return { rows: [] };
    }),
  }) as any;

describe('F1: VC-backed trust end-to-end (query -> verifier -> score)', () => {
  it('credits only the genuinely verified credential from credential_data', async () => {
    // CredentialService stand-in: valid unless the proof was tampered.
    const verify = jest.fn(async ({ credential }: any) =>
      credential?.proof?.proofValue === 'sig'
        ? { valid: true, checks: {} }
        : { valid: false, checks: {} }
    );
    const verifier = new VcServiceCredentialVerifier(
      { verifyCredential: verify } as unknown as CredentialService
    );

    const db = makeDb([
      { type: 'EmployeeCredential', issuer: 'did:atp:issuer', credential_data: makeVC('EmployeeCredential') },
      { type: 'ForgedCredential', issuer: 'did:atp:issuer', credential_data: makeVC('ForgedCredential', 'forged') },
    ]);

    const engine = new TrustScoringEngine(db, verifier);
    const score = await engine.calculateTrustScore(SUBJECT);

    // The verifier was actually reached for both candidates...
    expect(verify).toHaveBeenCalledTimes(2);
    // ...but only the validly-signed one counts toward trust.
    expect(score.factors.credentialsValidated).toEqual(['EmployeeCredential']);
  });

  it('credits nothing when the row carries no credential_data (fail-closed)', async () => {
    const verify = jest.fn(async () => ({ valid: true, checks: {} }));
    const verifier = new VcServiceCredentialVerifier(
      { verifyCredential: verify } as unknown as CredentialService
    );

    // Pre-F1 shape: type + issuer only, no payload to verify.
    const db = makeDb([{ type: 'EmployeeCredential', issuer: 'did:atp:issuer' }]);

    const engine = new TrustScoringEngine(db, verifier);
    const score = await engine.calculateTrustScore(SUBJECT);

    expect(score.factors.credentialsValidated).toEqual([]);
    expect(verify).not.toHaveBeenCalled();
  });
});
