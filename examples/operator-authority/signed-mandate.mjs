import { CryptoUtils } from '../../packages/sdk/src/utils/crypto.ts';

// Experimental, standalone test-only representation: NOT the ATP mandate wire format.
const encoding = (value) => Buffer.from(JSON.stringify(value));
export async function fixtureKeys() {
  const { ed25519 } = await CryptoUtils.generateHybridKeyPair();
  return { privateKey: ed25519.secretKey, publicKey: ed25519.publicKey };
}
export async function issueFixtureMandate(payload, privateKey) {
  const signature = Buffer.from(await CryptoUtils.signEd25519(encoding(payload), privateKey)).toString('base64url');
  return {payload, signature};
}
export async function verifyFixtureMandate({signedMandate, expectedIssuer, trustedIssuers, request, now, status}) {
  const deny = (reason) => ({decision:'DENY', reason});
  const {payload, signature} = signedMandate ?? {};
  if (!payload || typeof signature !== 'string') return deny('missing_proof');
  if (typeof now !== 'number' || !Number.isFinite(now)) return deny('invalid_clock');
  if (!payload.issuer || payload.issuer !== expectedIssuer) return deny('issuer_not_expected');
  const key = trustedIssuers.get(payload.issuer);
  if (!key) return deny('issuer_untrusted');
  if (!/^[A-Za-z0-9_-]{86}$/.test(signature) || !await CryptoUtils.verifyEd25519(encoding(payload), Buffer.from(signature, 'base64url'), key)) return deny('signature_invalid');
  if (!Number.isFinite(payload.notBefore) || !Number.isFinite(payload.expiresAt) || now < payload.notBefore || now >= payload.expiresAt) return deny('mandate_expired');
  if (!status?.available || status.checkedAt !== now || !(status.revokedIds instanceof Set)) return deny('status_unavailable');
  if (!payload.id || status.revokedIds.has(payload.id)) return deny('mandate_revoked');
  if (!request || ![payload.agentDid,payload.audience,payload.resource,request.agentDid,request.audience,request.resource,request.action].every(v => typeof v === 'string' && v.trim().length > 0) || payload.agentDid !== request.agentDid || payload.audience !== request.audience || payload.resource !== request.resource || !Array.isArray(payload.actions) || !payload.actions.includes(request.action)) return deny('scope_mismatch');
  return {decision:'ALLOW', reason:'fixture_signature_and_scope_valid'};
}
