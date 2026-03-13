import { CredentialService } from '../credential.js';
import {
  VerifiableCredential,
  CredentialSchema,
  CredentialIssuanceRequest,
  CredentialVerificationRequest,
} from '../../models/credential.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

const ISSUER_DID = 'did:atp:issuer1';
const SUBJECT_DID = 'did:atp:subject1';

const makeSchema = (overrides: Partial<CredentialSchema> = {}): CredentialSchema => ({
  id: 'schema-employee-v1',
  name: 'EmployeeCredential',
  description: 'Employee identity credential',
  version: '1.0.0',
  properties: {
    name: { type: 'string', description: 'Full name', required: true },
    department: { type: 'string', description: 'Department', required: false },
    employeeId: { type: 'string', description: 'Employee ID', required: true },
    yearsOfService: { type: 'number', description: 'Years at company', required: false },
  },
  ...overrides,
});

const makeIssuanceRequest = (
  overrides: Partial<CredentialIssuanceRequest> = {}
): CredentialIssuanceRequest => ({
  schemaId: 'schema-employee-v1',
  subject: SUBJECT_DID,
  issuerDid: ISSUER_DID,
  issuerPrivateKey: 'a'.repeat(64), // fake 32-byte hex key
  claims: {
    name: 'Alice Smith',
    employeeId: 'EMP-001',
    department: 'Engineering',
  },
  ...overrides,
});

const makeStorageMock = () => {
  const credentials = new Map<string, VerifiableCredential>();
  const schemas = new Map<string, CredentialSchema>();
  const revoked = new Set<string>();

  return {
    storeCredential: jest.fn(async (cred: VerifiableCredential) => {
      credentials.set(cred.id, cred);
    }),
    getCredential: jest.fn(async (id: string) => credentials.get(id) ?? null),
    revokeCredential: jest.fn(async (id: string) => { revoked.add(id); }),
    isCredentialRevoked: jest.fn(async (id: string) => revoked.has(id)),
    storeSchema: jest.fn(async (schema: CredentialSchema) => {
      schemas.set(schema.id, schema);
    }),
    getSchema: jest.fn(async (id: string) => schemas.get(id) ?? null),
    getSchemaByName: jest.fn(async (name: string) =>
      Array.from(schemas.values()).find(s => s.name === name) ?? null
    ),
    listSchemas: jest.fn(async () => Array.from(schemas.values())),
    _credentials: credentials,
    _schemas: schemas,
    _revoked: revoked,
  };
};

// ─── tests ────────────────────────────────────────────────────────────────────

describe('CredentialService', () => {
  let service: CredentialService;
  let storage: ReturnType<typeof makeStorageMock>;

  beforeEach(() => {
    storage = makeStorageMock();
    service = new CredentialService(storage as any);
  });

  // ── schema management ──────────────────────────────────────────────────────

  describe('registerSchema / getSchema / listSchemas', () => {
    it('stores and retrieves a schema by id', async () => {
      const schema = makeSchema();
      await service.registerSchema(schema);

      const fetched = await service.getSchema('schema-employee-v1');
      expect(fetched?.id).toBe('schema-employee-v1');
      expect(fetched?.name).toBe('EmployeeCredential');
    });

    it('returns null for an unknown schema id', async () => {
      const result = await service.getSchema('nonexistent');
      expect(result).toBeNull();
    });

    it('lists all registered schemas', async () => {
      await service.registerSchema(makeSchema({ id: 'schema-a', name: 'TypeA' }));
      await service.registerSchema(makeSchema({ id: 'schema-b', name: 'TypeB' }));

      const list = await service.listSchemas();
      expect(list).toHaveLength(2);
      expect(list.map(s => s.id)).toContain('schema-a');
      expect(list.map(s => s.id)).toContain('schema-b');
    });
  });

  // ── issueCredential ────────────────────────────────────────────────────────

  describe('issueCredential', () => {
    beforeEach(async () => {
      await service.registerSchema(makeSchema());
    });

    it('throws when schema does not exist', async () => {
      await expect(
        service.issueCredential(makeIssuanceRequest({ schemaId: 'nonexistent-schema' }))
      ).rejects.toThrow(/schema.*not found/i);
    });

    it('throws when a required claim is missing', async () => {
      await expect(
        service.issueCredential(
          makeIssuanceRequest({ claims: { department: 'HR' } }) // missing name + employeeId
        )
      ).rejects.toThrow(/required property.*missing/i);
    });

    it('throws when a claim has the wrong type', async () => {
      await expect(
        service.issueCredential(
          makeIssuanceRequest({
            claims: { name: 'Alice', employeeId: 123 as any }, // employeeId should be string
          })
        )
      ).rejects.toThrow(/invalid type/i);
    });

    it('returns a credential with a W3C context', async () => {
      const cred = await service.issueCredential(makeIssuanceRequest());
      const contexts = cred['@context'] as string[];
      expect(contexts).toContain('https://www.w3.org/2018/credentials/v1');
    });

    it('includes VerifiableCredential and schema type in type array', async () => {
      const cred = await service.issueCredential(makeIssuanceRequest());
      expect(cred.type).toContain('VerifiableCredential');
      expect(cred.type).toContain('EmployeeCredential');
    });

    it('sets issuer and subject correctly', async () => {
      const cred = await service.issueCredential(makeIssuanceRequest());
      expect(cred.issuer).toBe(ISSUER_DID);
      expect(cred.credentialSubject.id).toBe(SUBJECT_DID);
    });

    it('embeds the supplied claims on the credential subject', async () => {
      const cred = await service.issueCredential(makeIssuanceRequest());
      expect(cred.credentialSubject.name).toBe('Alice Smith');
      expect(cred.credentialSubject.employeeId).toBe('EMP-001');
    });

    it('attaches a proof to the credential', async () => {
      const cred = await service.issueCredential(makeIssuanceRequest());
      expect(cred.proof).toBeDefined();
      expect(cred.proof?.type).toBe('Ed25519Signature2020');
      expect(cred.proof?.proofPurpose).toBe('assertionMethod');
      expect(cred.proof?.verificationMethod).toContain(ISSUER_DID);
    });

    it('stores the credential in storage', async () => {
      await service.issueCredential(makeIssuanceRequest());
      expect(storage.storeCredential).toHaveBeenCalledTimes(1);
    });

    it('respects optional expirationDate', async () => {
      const expiry = new Date(Date.now() + 86400_000).toISOString();
      const cred = await service.issueCredential(makeIssuanceRequest({ expirationDate: expiry }));
      expect(cred.expirationDate).toBe(expiry);
    });

    it('generates unique credential IDs for successive issuances', async () => {
      const c1 = await service.issueCredential(makeIssuanceRequest());
      const c2 = await service.issueCredential(makeIssuanceRequest());
      expect(c1.id).not.toBe(c2.id);
    });
  });

  // ── verifyCredential ───────────────────────────────────────────────────────

  describe('verifyCredential', () => {
    const makeVerifiableCredential = (
      overrides: Partial<VerifiableCredential> = {}
    ): VerifiableCredential => ({
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      id: 'urn:uuid:cred-test-1',
      type: ['VerifiableCredential', 'EmployeeCredential'],
      issuer: ISSUER_DID,
      issuanceDate: new Date().toISOString(),
      credentialSubject: { id: SUBJECT_DID, name: 'Alice', employeeId: 'EMP-001' },
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        verificationMethod: `${ISSUER_DID}#key-1`,
        proofPurpose: 'assertionMethod',
        proofValue: 'fakesig',
      },
      ...overrides,
    });

    it('returns valid: false when proof is missing', async () => {
      const cred = makeVerifiableCredential({ proof: undefined });
      const result = await service.verifyCredential({ credential: cred });
      expect(result.valid).toBe(false);
      expect(result.checks.signature).toBe(false);
    });

    it('returns valid: false for an expired credential', async () => {
      const pastDate = new Date(Date.now() - 86400_000).toISOString();
      const cred = makeVerifiableCredential({ expirationDate: pastDate });
      const result = await service.verifyCredential({ credential: cred });
      expect(result.valid).toBe(false);
      expect(result.checks.expiration).toBe(false);
    });

    it('passes expiration check when no expirationDate is set', async () => {
      const cred = makeVerifiableCredential({ expirationDate: undefined });
      // Even if signature fails, expiration check should pass
      const result = await service.verifyCredential({ credential: cred });
      expect(result.checks.expiration).toBe(true);
    });

    it('passes expiration check for a future expirationDate', async () => {
      const futureDate = new Date(Date.now() + 86400_000).toISOString();
      const cred = makeVerifiableCredential({ expirationDate: futureDate });
      const result = await service.verifyCredential({ credential: cred });
      expect(result.checks.expiration).toBe(true);
    });

    it('returns valid: false for a revoked credential', async () => {
      const cred = makeVerifiableCredential({
        credentialStatus: {
          id: 'https://example.com/status/1',
          type: 'RevocationList2020Status',
        },
      });
      storage.isCredentialRevoked.mockResolvedValueOnce(true);

      const result = await service.verifyCredential({ credential: cred });
      expect(result.valid).toBe(false);
      expect(result.checks.revocation).toBe(false);
    });

    it('passes revocation check when no credentialStatus is set', async () => {
      const cred = makeVerifiableCredential({ credentialStatus: undefined });
      const result = await service.verifyCredential({ credential: cred });
      expect(result.checks.revocation).toBe(true);
    });
  });

  // ── revokeCredential ───────────────────────────────────────────────────────

  describe('revokeCredential', () => {
    it('throws when credential does not exist', async () => {
      await expect(
        service.revokeCredential('nonexistent', ISSUER_DID)
      ).rejects.toThrow(/credential not found/i);
    });

    it('throws when a non-issuer tries to revoke', async () => {
      const cred: VerifiableCredential = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: 'urn:uuid:cred-rev-test',
        type: ['VerifiableCredential'],
        issuer: ISSUER_DID,
        issuanceDate: new Date().toISOString(),
        credentialSubject: { id: SUBJECT_DID },
      };
      storage.getCredential.mockResolvedValueOnce(cred);

      await expect(
        service.revokeCredential('urn:uuid:cred-rev-test', 'did:atp:attacker')
      ).rejects.toThrow(/only the issuer/i);
    });

    it('revokes successfully when called by the issuer', async () => {
      const cred: VerifiableCredential = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: 'urn:uuid:cred-rev-test',
        type: ['VerifiableCredential'],
        issuer: ISSUER_DID,
        issuanceDate: new Date().toISOString(),
        credentialSubject: { id: SUBJECT_DID },
      };
      storage.getCredential.mockResolvedValueOnce(cred);

      await expect(
        service.revokeCredential('urn:uuid:cred-rev-test', ISSUER_DID)
      ).resolves.not.toThrow();

      expect(storage.revokeCredential).toHaveBeenCalledWith('urn:uuid:cred-rev-test');
    });

    it('works when issuer is an object with .id', async () => {
      const cred: VerifiableCredential = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: 'urn:uuid:cred-obj-issuer',
        type: ['VerifiableCredential'],
        issuer: { id: ISSUER_DID, name: 'ATP Issuer' },
        issuanceDate: new Date().toISOString(),
        credentialSubject: { id: SUBJECT_DID },
      };
      storage.getCredential.mockResolvedValueOnce(cred);

      await expect(
        service.revokeCredential('urn:uuid:cred-obj-issuer', ISSUER_DID)
      ).resolves.not.toThrow();
    });
  });

  // ── claim/schema validation ────────────────────────────────────────────────

  describe('claim type validation', () => {
    beforeEach(async () => {
      await service.registerSchema(
        makeSchema({
          properties: {
            label: { type: 'string', description: 'Label', required: true },
            count: { type: 'number', description: 'Count', required: false },
            active: { type: 'boolean', description: 'Active', required: false },
            tags: { type: 'array', description: 'Tags', required: false },
            meta: { type: 'object', description: 'Meta', required: false },
          },
        })
      );
    });

    it('accepts valid string, number, boolean, array, object claims', async () => {
      await expect(
        service.issueCredential(
          makeIssuanceRequest({
            claims: {
              label: 'test',
              count: 42,
              active: true,
              tags: ['a', 'b'],
              meta: { key: 'value' },
            },
          })
        )
      ).resolves.toBeDefined();
    });

    it('rejects array value for string field', async () => {
      await expect(
        service.issueCredential(
          makeIssuanceRequest({ claims: { label: ['wrong'] as any } })
        )
      ).rejects.toThrow(/invalid type/i);
    });

    it('rejects string value for number field', async () => {
      await expect(
        service.issueCredential(
          makeIssuanceRequest({ claims: { label: 'ok', count: 'not-a-number' as any } })
        )
      ).rejects.toThrow(/invalid type/i);
    });
  });
});
