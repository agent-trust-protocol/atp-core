// Synthetic, synchronous profile adapter for lab #192. No authenticated network source or Guardian.
// The source callback receives only the presented grant and pinned evaluation instant.
export function liveReadBoundary(input, readStatus, resource) {
  const { operator, grant, request, now } = input;
  const sourceReads = [];
  let observationAsOf = null;
  const finish = (decision, reason) => {
    const result = { decision, reason, observationAsOf, sourceReads };
    if (decision === 'ALLOW') resource();
    return result;
  };
  const deny = reason => finish('DENY', reason);
  if (!operator?.active || !operator?.canGrant) return deny('operator_not_authorized');
  if (!request?.agentDid || !grant?.agentDid || request.agentDid !== grant.agentDid) return deny('actor_mismatch');
  if (!grant.issuerVerified || !grant.proofVerified) return deny('mandate_unverified');
  if (grant.issuedBy !== operator.id || grant.issuer !== operator.issuer) return deny('issuer_mismatch');
  if (grant.resource !== request.resource || grant.audience !== request.audience) return deny('out_of_scope');
  if (![now, grant.notBefore, grant.expiresAt].every(Number.isFinite) || grant.notBefore >= grant.expiresAt || now < grant.notBefore || now >= grant.expiresAt) return deny('mandate_expired');
  const read = { grant: grant.resource, at_ms: now, purpose: 'verification', outcome: 'attempted', observation: null };
  sourceReads.push(read);
  let status;
  try {
    status = readStatus({ grant: grant.resource, at_ms: now });
    // Copy source values once. A Promise is unsupported by this synchronous fixture adapter; absorb
    // its eventual rejection so an unsupported source fails closed without an unhandled rejection.
    const then = status?.then;
    if (typeof then === 'function') {
      try { then.call(status, undefined, () => {}); } catch { /* the denial below still applies */ }
      throw new TypeError('Asynchronous source unsupported');
    }
    status = { available: status?.available === true, checkedAt: status?.checkedAt, revokedAt: status?.revokedAt };
  } catch {
    read.outcome = 'error';
    return deny('status_not_current');
  }
  if (!status.available || !Number.isFinite(status.checkedAt)
      || !(status.revokedAt == null || Number.isFinite(status.revokedAt))) {
    read.outcome = 'unavailable';
    return deny('status_not_current');
  }
  observationAsOf = status.checkedAt;
  read.outcome = 'observed';
  read.observation = { as_of_ms: status.checkedAt, revoked_at_ms: status.revokedAt ?? null };
  if (status.checkedAt !== now) return deny('status_not_current');
  if (status.revokedAt != null && now >= status.revokedAt) return deny('mandate_revoked');
  if (!grant.actions?.includes(request.action)) return deny('out_of_scope');
  if (grant.requiresApproval && (!request.approval?.verifiedByTrustedOperator || typeof request.actionDigest !== 'string' || !request.actionDigest.trim() || typeof request.approval?.actionDigest !== 'string' || !request.approval.actionDigest.trim() || request.approval.actionDigest !== request.actionDigest || request.approval.used)) return finish('REQUIRE_APPROVAL', 'approval_required');
  return finish('ALLOW', 'authorized');
}
