import { Request, Response } from 'express';
import { IdentityController } from '../identity.js';
import { IdentityService } from '../../services/identity.js';
import { ValidationError } from '../../errors.js';

/**
 * Controller-level tests for the registerPairwise handler's HTTP status mapping.
 *
 * Pins the contract that distinguishes a client error from a server fault:
 *   - missing required fields            → 400 (early guard)
 *   - a ValidationError from the service → 400 (bad client input)
 *   - any other thrown error (e.g. a     → 500 (server-side fault; a storage
 *     storeDIDDocument storage outage)         outage must NOT look like a 400,
 *                                              so clients retry and ops alert)
 */

// Minimal Express Response double capturing the status + JSON body.
function makeRes(): Response & { _status: number; _body: any } {
  const res: any = {};
  res._status = 0;
  res._body = undefined;
  res.status = (code: number) => {
    res._status = code;
    return res;
  };
  res.json = (body: any) => {
    res._body = body;
    return res;
  };
  return res;
}

const reqWith = (body: any) => ({ body } as Request);

const VALID = { masterSecret: 'a'.repeat(64), peerId: 'peer-1', domain: 'agents.example.com' };

describe('IdentityController.registerPairwise — HTTP status mapping', () => {
  it('returns 400 when required fields are missing', async () => {
    const controller = new IdentityController({} as unknown as IdentityService);
    const res = makeRes();

    await controller.registerPairwise(reqWith({}), res);

    expect(res._status).toBe(400);
    expect(res._body.success).toBe(false);
  });

  it('returns 400 when the service throws a ValidationError (bad input)', async () => {
    const service = {
      registerPairwiseDID: jest.fn(async () => {
        throw new ValidationError('masterSecret must decode to at least 32 bytes');
      }),
    } as unknown as IdentityService;
    const controller = new IdentityController(service);
    const res = makeRes();

    await controller.registerPairwise(reqWith(VALID), res);

    expect(res._status).toBe(400);
    expect(res._body.error).toMatch(/32 bytes/);
  });

  it('returns 500 when the service throws a non-validation (storage/infra) error', async () => {
    const service = {
      registerPairwiseDID: jest.fn(async () => {
        // Simulates storeDIDDocument failing for infrastructure reasons.
        throw new Error('database connection refused');
      }),
    } as unknown as IdentityService;
    const controller = new IdentityController(service);
    const res = makeRes();

    await controller.registerPairwise(reqWith(VALID), res);

    expect(res._status).toBe(500);
    expect(res._body.success).toBe(false);
    expect(res._body.error).toMatch(/connection refused/);
  });

  it('returns 201 with the result on success', async () => {
    const service = {
      registerPairwiseDID: jest.fn(async () => ({ did: 'did:atp:example', document: {} })),
    } as unknown as IdentityService;
    const controller = new IdentityController(service);
    const res = makeRes();

    await controller.registerPairwise(reqWith(VALID), res);

    expect(res._status).toBe(201);
    expect(res._body.success).toBe(true);
    expect(res._body.data.did).toBe('did:atp:example');
  });
});

describe('IdentityController.resolveDidDocument — { didDocument } resolver envelope', () => {
  // The vc-service issuer-key lookup calls GET /identity/resolve/:did and reads
  // body.didDocument; these pin that contract so the verifier can resolve keys.
  it('returns 200 with { didDocument } for a known DID', async () => {
    const doc = { id: 'did:atp:agent-42', verificationMethod: [{ id: '#k', publicKeyMultibase: 'z123' }] };
    const service = { resolveDID: jest.fn(async () => doc) } as unknown as IdentityService;
    const controller = new IdentityController(service);
    const res = makeRes();

    await controller.resolveDidDocument({ params: { did: 'did:atp:agent-42' } } as unknown as Request, res);

    expect(res._status).toBe(0); // res.json without status() → default 200 path
    expect(res._body.didDocument).toEqual(doc);
    expect(res._body.didDocument.id).toBe('did:atp:agent-42');
  });

  it('returns 404 with { didDocument: null } for an unknown DID', async () => {
    const service = { resolveDID: jest.fn(async () => null) } as unknown as IdentityService;
    const controller = new IdentityController(service);
    const res = makeRes();

    await controller.resolveDidDocument({ params: { did: 'did:atp:nope' } } as unknown as Request, res);

    expect(res._status).toBe(404);
    expect(res._body.didDocument).toBeNull();
  });
});
