// Isolated synthetic policy reference for Issue #169.
// This is NOT a cryptographic mandate verifier or production Guardian.
export function decide(input) {
  const {request, grant, operator, status, now} = input;
  if (!operator?.active || !operator?.canGrant) return {decision:'DENY', reason:'operator_not_authorized'};
  if (!request?.agentDid || !grant?.agentDid || request.agentDid !== grant.agentDid) return {decision:'DENY',reason:'actor_mismatch'};
  if (!grant?.issuerVerified || !grant?.proofVerified) return {decision:'DENY',reason:'mandate_unverified'};
  if (grant.issuedBy !== operator.id || grant.issuer !== operator.issuer) return {decision:'DENY',reason:'issuer_mismatch'};
  if (!grant.actions?.includes(request.action) || grant.resource !== request.resource || grant.audience !== request.audience) return {decision:'DENY',reason:'out_of_scope'};
  if (now < grant.notBefore || now >= grant.expiresAt) return {decision:'DENY',reason:'mandate_expired'};
  // Even when evidence is cacheable, this protected action requires current authority.
  if (!status?.available || status.checkedAt !== now) return {decision:'DENY',reason:'status_not_current'};
  if (status?.revokedAt !== null && status?.revokedAt !== undefined && now >= status.revokedAt) return {decision:'DENY',reason:'mandate_revoked'};
  if (grant.requiresApproval && (!request.approval?.verifiedByTrustedOperator || request.approval.actionDigest !== request.actionDigest || request.approval.used)) return {decision:'REQUIRE_APPROVAL',reason:'approval_required'};
  return {decision:'ALLOW', reason:'authorized'};
}

export function protectedBoundary(input, resource) {
  const result=decide(input);
  if (result.decision==='ALLOW') resource();
  return result;
}
