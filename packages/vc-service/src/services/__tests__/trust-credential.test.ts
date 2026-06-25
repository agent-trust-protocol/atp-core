/**
 * AtpTrustCredential: issuance, present-side verification, and policy gating.
 *
 * Proves the outbound half of "trust scoring backed by W3C VCs":
 *   - a signed AtpTrustCredential is issued through the existing vc-service;
 *   - a relying party can cryptographically verify a *presented* one; and
 *   - the verified credential drives the existing PolicyEvaluator unchanged
 *     (a `verifiable_credential` rule gates on its type/issuer/trustLevel).
 *
 * Following the repo convention (credential.test.ts), the issuer-signature
 * happy path is exercised with a mocked CredentialService.verifyCredential
 * rather than standing up the identity service for key resolution.
 */
import { randomUUID } from 'crypto';
import { PolicyEvaluator } from '@atp/shared';
import { CredentialService } from '../credential.js';
import {
  TrustCredentialService,
  ATP_TRUST_CREDENTIAL_TYPE,
  ATP_TRUST_CREDENTIAL_SCHEMA,
} from '../trust-credential.js';
import type { VerifiableCredential, CredentialSchema } from '../../models/credential.js';

const ISSUER_DID = 'did:atp:trust-authority';
const SUBJECT_DID = 'did:atp:agent-42';

const makeStorageMock = () => {
  const credentials = new Map<string, VerifiableCredential>();
  const schemas = new Map<string, CredentialSchema>();
  const revoked = new Set<string>();
  return {
    storeCredential: jest.fn(async (c: VerifiableCredential) => { credentials.set(c.id, c); }),
    getCredential: jest.fn(async (id: string) => credentials.get(id) ?? null),
    revokeCredential: jest.fn(async (id: string) => { revoked.add(id); }),
    isCredentialRevoked: jest.fn(async (id: string) => revoked.has(id)),
    storeSchema: jest.fn(async (s: CredentialSchema) => { schemas.set(s.id, s); }),
    getSchema: jest.fn(async (id: string) => schemas.get(id) ?? null),
    getSchemaByName: jest.fn(async (name: string) =>
      Array.from(schemas.values()).find(s => s.name === name) ?? null),
    listSchemas: jest.fn(async () => Array.from(schemas.values())),
  };
};

describe('TrustCredentialService — issuance', () => {
  let storage: ReturnType<typeof makeStorageMock>;
  let trust: TrustCredentialService;

  beforeEach(() => {
    storage = makeStorageMock();
    trust = new TrustCredentialService(new CredentialService(storage as any));
  });

  it('issues a signed AtpTrustCredential carrying the trust claims', async () => {
    const cred = await trust.issueTrustCredential({
      subjectDid: SUBJECT_DID,
      trustLevel: 'verified',
      trustScore: 3.5,
      issuerDid: ISSUER_DID,
      issuerPrivateKey: 'a'.repeat(64),
    });

    expect(cred.type).toContain('VerifiableCredential');
    expect(cred.type).toContain(ATP_TRUST_CREDENTIAL_TYPE);
    expect(cred.issuer).toBe(ISSUER_DID);
    expect(cred.credentialSubject.id).toBe(SUBJECT_DID);
    expect(cred.credentialSubject.trustLevel).toBe('verified');
    expect(cred.credentialSubject.trustScore).toBe(3.5);
    expect(typeof cred.credentialSubject.evaluatedAt).toBe('string');
    expect(cred.proof?.type).toBe('Ed25519Signature2020');
  });

  it('auto-registers the trust-credential schema exactly once', async () => {
    await trust.issueTrustCredential({ subjectDid: SUBJECT_DID, trustLevel: 'basic', issuerDid: ISSUER_DID, issuerPrivateKey: 'a'.repeat(64) });
    await trust.issueTrustCredential({ subjectDid: SUBJECT_DID, trustLevel: 'basic', issuerDid: ISSUER_DID, issuerPrivateKey: 'a'.repeat(64) });
    expect(storage.storeSchema).toHaveBeenCalledTimes(1);
    expect(await storage.getSchema(ATP_TRUST_CREDENTIAL_SCHEMA.id)).not.toBeNull();
  });

  it('sets an expirationDate when a validity window is supplied', async () => {
    const cred = await trust.issueTrustCredential({
      subjectDid: SUBJECT_DID, trustLevel: 'verified', issuerDid: ISSUER_DID,
      issuerPrivateKey: 'a'.repeat(64), expiresInSeconds: 3600,
    });
    expect(cred.expirationDate).toBeDefined();
    expect(new Date(cred.expirationDate!).getTime()).toBeGreaterThan(Date.now());
  });

  it('rejects issuance without a subject or trust level', async () => {
    await expect(trust.issueTrustCredential({ subjectDid: '', trustLevel: 'verified', issuerDid: ISSUER_DID, issuerPrivateKey: 'a'.repeat(64) })).rejects.toThrow();
    await expect(trust.issueTrustCredential({ subjectDid: SUBJECT_DID, trustLevel: '', issuerDid: ISSUER_DID, issuerPrivateKey: 'a'.repeat(64) })).rejects.toThrow();
  });
});

describe('TrustCredentialService — present-side verification', () => {
  const makeCred = (over: Partial<VerifiableCredential> = {}): VerifiableCredential => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: `urn:uuid:${randomUUID()}`,
    type: ['VerifiableCredential', ATP_TRUST_CREDENTIAL_TYPE],
    issuer: ISSUER_DID,
    issuanceDate: new Date().toISOString(),
    credentialSubject: { id: SUBJECT_DID, trustLevel: 'verified', trustScore: 4, evaluatedAt: new Date().toISOString() },
    proof: { type: 'Ed25519Signature2020', created: new Date().toISOString(), verificationMethod: `${ISSUER_DID}#key-1`, proofPurpose: 'assertionMethod', proofValue: 'sig' },
    ...over,
  });

  it('extracts trust level/subject when the credential cryptographically verifies', async () => {
    const verifyCredential = jest.fn(async () => ({ valid: true, checks: {} }));
    const trust = new TrustCredentialService({ verifyCredential } as unknown as CredentialService);

    const res = await trust.verifyPresentedTrustCredential(makeCred());
    expect(res.valid).toBe(true);
    expect(res.trustLevel).toBe('verified');
    expect(res.trustScore).toBe(4);
    expect(res.subject).toBe(SUBJECT_DID);
    expect(res.issuer).toBe(ISSUER_DID);
    expect(verifyCredential).toHaveBeenCalledTimes(1);
  });

  it('rejects a credential that is not an AtpTrustCredential (without calling verify)', async () => {
    const verifyCredential = jest.fn(async () => ({ valid: true, checks: {} }));
    const trust = new TrustCredentialService({ verifyCredential } as unknown as CredentialService);

    const res = await trust.verifyPresentedTrustCredential(makeCred({ type: ['VerifiableCredential', 'EmployeeCredential'] }));
    expect(res.valid).toBe(false);
    expect(verifyCredential).not.toHaveBeenCalled();
  });

  it('fails closed when the underlying verification fails (bad signature/expiry/revocation)', async () => {
    const verifyCredential = jest.fn(async () => ({ valid: false, checks: {}, error: 'signature invalid' }));
    const trust = new TrustCredentialService({ verifyCredential } as unknown as CredentialService);

    const res = await trust.verifyPresentedTrustCredential(makeCred());
    expect(res.valid).toBe(false);
    expect(res.trustLevel).toBeUndefined();
  });
});

describe('AtpTrustCredential drives policy evaluation (presented credential)', () => {
  const trust = new TrustCredentialService({} as unknown as CredentialService);
  const evaluator = new PolicyEvaluator();

  // Policy: allow only when a non-expired AtpTrustCredential from the trusted
  // authority asserts trustLevel === 'verified'; deny otherwise.
  const policy = {
    id: randomUUID(), name: 'Trust-credential gate', version: '1.0.0',
    organizationId: 'org-1', createdBy: 'did:atp:author',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    enabled: true, defaultAction: 'deny', evaluationMode: 'first_match',
    rules: [{
      id: randomUUID(), name: 'verified-trust-credential', enabled: true, priority: 1,
      condition: {
        id: randomUUID(), type: 'verifiable_credential', operator: 'contains',
        value: { credentialType: ATP_TRUST_CREDENTIAL_TYPE, issuer: ISSUER_DID, expirationCheck: true, claims: { trustLevel: 'verified' } },
      },
      action: { id: randomUUID(), type: 'allow' },
      tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'did:atp:author', version: '1.0.0',
    }],
    tags: [], testCases: [], auditLog: [],
  } as any;

  const makeContext = (credentialInfo: any) => ({
    agentDID: SUBJECT_DID, trustLevel: 'VERIFIED', credentials: credentialInfo ? [credentialInfo] : [],
    tool: { id: 'tool-x', type: 'database', sensitivity: 'internal' },
    requestedAction: 'read', organizationId: 'org-1', timestamp: new Date().toISOString(),
  } as any);

  const makeTrustCred = (over: Partial<VerifiableCredential> = {}): VerifiableCredential => ({
    '@context': ['https://www.w3.org/2018/credentials/v1'], id: `urn:uuid:${randomUUID()}`,
    type: ['VerifiableCredential', ATP_TRUST_CREDENTIAL_TYPE], issuer: ISSUER_DID,
    issuanceDate: new Date().toISOString(),
    credentialSubject: { id: SUBJECT_DID, trustLevel: 'verified', evaluatedAt: new Date().toISOString() },
    ...over,
  });

  it('ALLOWS when a verified, non-expired trust credential is presented', async () => {
    const info = trust.toVerifiableCredentialInfo(makeTrustCred());
    const result = await evaluator.evaluatePolicy(policy, makeContext(info));
    expect(result.decision).toBe('allow');
  });

  it('DENIES when no credential is presented', async () => {
    const result = await evaluator.evaluatePolicy(policy, makeContext(null));
    expect(result.decision).toBe('deny');
  });

  it('DENIES an expired trust credential (expirationCheck)', async () => {
    const expired = makeTrustCred({ expirationDate: new Date(Date.now() - 1000).toISOString() });
    const info = trust.toVerifiableCredentialInfo(expired);
    expect(info.isExpired).toBe(true);
    const result = await evaluator.evaluatePolicy(policy, makeContext(info));
    expect(result.decision).toBe('deny');
  });

  it('DENIES when the asserted trust level is below what the policy requires', async () => {
    const info = trust.toVerifiableCredentialInfo(makeTrustCred({ credentialSubject: { id: SUBJECT_DID, trustLevel: 'basic', evaluatedAt: new Date().toISOString() } }));
    const result = await evaluator.evaluatePolicy(policy, makeContext(info));
    expect(result.decision).toBe('deny');
  });
});
