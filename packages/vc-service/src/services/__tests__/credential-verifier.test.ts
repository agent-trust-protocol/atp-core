import { VcServiceCredentialVerifier } from '../credential-verifier.js';
import type { CredentialService } from '../credential.js';
import type { VerifiableCredential } from '../../models/credential.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

const ISSUER_DID = 'did:atp:issuer1';
const SUBJECT_DID = 'did:atp:subject1';

const makeCredential = (
  overrides: Partial<VerifiableCredential> = {}
): VerifiableCredential => ({
  '@context': ['https://www.w3.org/2018/credentials/v1'],
  id: 'urn:uuid:cred-1',
  type: ['VerifiableCredential', 'EmployeeCredential'],
  issuer: ISSUER_DID,
  issuanceDate: new Date().toISOString(),
  credentialSubject: { id: SUBJECT_DID, name: 'Alice' },
  proof: {
    type: 'Ed25519Signature2020',
    created: new Date().toISOString(),
    verificationMethod: `${ISSUER_DID}#key-1`,
    proofPurpose: 'assertionMethod',
    proofValue: 'sig',
  },
  ...overrides,
});

const passingChecks = { signature: true, expiration: true, revocation: true, schema: true };
const failingChecks = { signature: false, expiration: true, revocation: true, schema: true };

const makeServiceMock = (verify: jest.Mock) =>
  ({ verifyCredential: verify } as unknown as CredentialService);

// ─── tests ────────────────────────────────────────────────────────────────────

describe('VcServiceCredentialVerifier', () => {
  it('returns true when verifyCredential reports valid (full payload on the row)', async () => {
    const verify = jest.fn(async () => ({ valid: true, checks: passingChecks }));
    const verifier = new VcServiceCredentialVerifier(makeServiceMock(verify));

    const credential = makeCredential();
    const result = await verifier.isVerified({
      type: 'EmployeeCredential',
      issuer: ISSUER_DID,
      credential_data: credential,
    });

    expect(result).toBe(true);
    expect(verify).toHaveBeenCalledWith({ credential });
  });

  it('returns false (fail-closed) when verifyCredential reports invalid', async () => {
    const verify = jest.fn(async () => ({
      valid: false,
      checks: failingChecks,
      error: 'Credential verification failed',
    }));
    const verifier = new VcServiceCredentialVerifier(makeServiceMock(verify));

    const result = await verifier.isVerified({
      type: 'EmployeeCredential',
      issuer: ISSUER_DID,
      // forged: a proof that won't verify
      credential: makeCredential({ proof: { ...makeCredential().proof!, proofValue: 'forged' } }),
    });

    expect(result).toBe(false);
  });

  it('returns false (fail-closed) when verifyCredential throws', async () => {
    const verify = jest.fn(async () => {
      throw new Error('boom');
    });
    const verifier = new VcServiceCredentialVerifier(makeServiceMock(verify));

    const result = await verifier.isVerified({
      type: 'EmployeeCredential',
      issuer: ISSUER_DID,
      credential: makeCredential(),
    });

    expect(result).toBe(false);
  });

  it('returns false (fail-closed) when the row carries no verifiable payload (type+issuer only)', async () => {
    const verify = jest.fn(async () => ({ valid: true, checks: passingChecks }));
    const verifier = new VcServiceCredentialVerifier(makeServiceMock(verify));

    // This is exactly the current trust-engine SELECT shape — only type + issuer.
    const result = await verifier.isVerified({ type: 'EmployeeCredential', issuer: ISSUER_DID });

    expect(result).toBe(false);
    // Must NOT have even attempted verification on a non-credential.
    expect(verify).not.toHaveBeenCalled();
  });

  it('resolves a credential by id when a resolver is supplied, then verifies it', async () => {
    const credential = makeCredential({ id: 'urn:uuid:resolved-1' });
    const verify = jest.fn(async () => ({ valid: true, checks: passingChecks }));
    const resolve = jest.fn(async (id: string) =>
      id === 'urn:uuid:resolved-1' ? credential : null
    );
    const verifier = new VcServiceCredentialVerifier(makeServiceMock(verify), resolve);

    const result = await verifier.isVerified({
      type: 'EmployeeCredential',
      issuer: ISSUER_DID,
      credential_id: 'urn:uuid:resolved-1',
    });

    expect(result).toBe(true);
    expect(resolve).toHaveBeenCalledWith('urn:uuid:resolved-1');
    expect(verify).toHaveBeenCalledWith({ credential });
  });

  it('returns false when an id is given but no resolver is wired (fail-closed)', async () => {
    const verify = jest.fn(async () => ({ valid: true, checks: passingChecks }));
    const verifier = new VcServiceCredentialVerifier(makeServiceMock(verify));

    const result = await verifier.isVerified({
      type: 'EmployeeCredential',
      issuer: ISSUER_DID,
      credential_id: 'urn:uuid:cannot-resolve',
    });

    expect(result).toBe(false);
    expect(verify).not.toHaveBeenCalled();
  });
});
