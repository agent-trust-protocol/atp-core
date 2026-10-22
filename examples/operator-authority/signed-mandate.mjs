import {createPublicKey, createPrivateKey, generateKeyPairSync, sign, verify} from 'node:crypto';

// Experimental, standalone test-only representation: NOT the ATP mandate wire format.
const encoding = (value) => Buffer.from(JSON.stringify(value));
export function fixtureKeys() {
  const pair = generateKeyPairSync('ed25519');
  return { privateKey: pair.privateKey.export({type:'pkcs8',format:'pem'}), publicKey: pair.publicKey.export({type:'spki',format:'pem'}) };
}
export function issueFixtureMandate(payload, privateKey) {
  const message = encoding(payload);
  const signature = sign(null, message, createPrivateKey(privateKey)).toString('base64url');
  return {payload, signature};
}
export function verifyFixtureMandate({signedMandate, expectedIssuer, trustedIssuers, request, now, status}) {
  const deny = (reason) => ({decision:'DENY', reason});
  const {payload, signature} = signedMandate ?? {};
  if (!payload || typeof signature !== 'string') return deny('missing_proof');
  if (typeof now !== 'number' || !Number.isFinite(now)) return deny('invalid_clock');
  if (!payload.issuer || payload.issuer !== expectedIssuer) return deny('issuer_not_expected');
  const key = trustedIssuers.get(payload.issuer);
  if (!key) return deny('issuer_untrusted');
  if (!verify(null, encoding(payload), createPublicKey(key), Buffer.from(signature, 'base64url'))) return deny('signature_invalid');
  if (!Number.isFinite(payload.notBefore) || !Number.isFinite(payload.expiresAt) || now < payload.notBefore || now >= payload.expiresAt) return deny('mandate_expired');
  if (!status?.available || status.checkedAt !== now || !(status.revokedIds instanceof Set)) return deny('status_unavailable');
  if (!payload.id || status.revokedIds.has(payload.id)) return deny('mandate_revoked');
  if (!request || payload.agentDid !== request.agentDid || payload.audience !== request.audience || payload.resource !== request.resource || !Array.isArray(payload.actions) || !payload.actions.includes(request.action)) return deny('scope_mismatch');
  return {decision:'ALLOW', reason:'fixture_signature_and_scope_valid'};
}
