import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coreConfig, inspectCore } from '../src/core-readonly.mjs';

const env = { ATP_CORE_READ_ONLY: '1' };
const mock = data => async (_url, options) => {
  assert.equal(options.method, 'GET');
  assert.equal(options.redirect, 'error');
  return { ok: true, json: async () => ({ success: true, data }) };
};

test('read-only local ATP access is off by default', async () => {
  assert.throws(() => coreConfig({}), /disabled/);
  let calls = 0;
  await assert.rejects(inspectCore('agents', null, {
    env: {}, fetchImpl: () => { calls++; }
  }), /disabled/);
  assert.equal(calls, 0);
});

test('ports are validated and requests target loopback only', () => {
  assert.throws(() => coreConfig({ ...env, ATP_CORE_IDENTITY_PORT: '80/evil' }), /Invalid/);
  assert.deepEqual(coreConfig(env).identity, 'http://127.0.0.1:3001');
});

test('agent listing is explicitly registry data, not verified identity', async () => {
  const result = await inspectCore('agents', null, {
    env,
    fetchImpl: mock({ agents: [{ did: 'did:atp:example', status: 'active' }], total: 1 })
  });
  assert.match(result, /NOT verified DID identities/);
  assert.match(result, /did:atp:example/);
  assert.match(result, /does not establish Guardian authorization/);
});

test('trust registry record does not imply verified identity or Guardian decision', async () => {
  const result = await inspectCore('trust', 'did:atp:example', {
    env,
    fetchImpl: mock({ level: 'TRUSTED', score: 81 })
  });
  assert.match(result, /unverified/);
  assert.match(result, /Not a cryptographic identity proof or Guardian decision/);
});

test('grants are read-only and never assert current authorization', async () => {
  const result = await inspectCore('grants', 'did:atp:example', {
    env,
    fetchImpl: mock({ grants: [{ resource: 'orders', action: 'read', status: 'active' }], total: 1 })
  });
  assert.match(result, /not a live authorization/);
  assert.match(result, /Guardian and mandate revocation must be checked independently/);
});

test('missing, failed and malformed responses fail closed', async () => {
  await assert.rejects(inspectCore('trust', '../admin', { env, fetchImpl: mock({}) }), /valid DID/);
  await assert.rejects(inspectCore('agents', null, {
    env, fetchImpl: async () => ({ ok: false, status: 403 })
  }), /HTTP 403/);
  await assert.rejects(inspectCore('agents', null, {
    env, fetchImpl: mock({ agents: 'malformed', total: 1 })
  }), /Unexpected/);
  await assert.rejects(inspectCore('agents', null, {
    env, fetchImpl: async () => { throw new Error('refused'); }
  }), /no remote fallback/);
});

test('untrusted remote status strings are stripped of terminal control characters', async () => {
  const text = await inspectCore('agents', null, {
    env, fetchImpl: mock({ agents: [{ did: 'did:atp:test\u001b[2J', status: 'active\u001b[31m' }], total: 1 })
  });
  assert.doesNotMatch(text, /\u001b/);
});
