// Local instrumentation check, not the external lab runner or authenticated provenance.
// actualReads entries: { grant, at_ms, status, threw? }. A source that threw still counts as the one
// required attempt; the adapter must record it as `error` with no observation.
export function checkSourceReads(input, result, actualReads) {
  const { grant, request, now } = input;
  const eligible = grant.resource === request.resource && grant.audience === request.audience
    && [now, grant.notBefore, grant.expiresAt].every(Number.isFinite)
    && grant.notBefore <= now && now < grant.expiresAt && grant.notBefore < grant.expiresAt;
  // Used by the pinned corpus adapter, whose operator/identity/proof preconditions are valid.
  if (!eligible) return actualReads.length === 0 && result.sourceReads.length === 0 && result.observationAsOf === null;
  if (actualReads.length !== 1 || result.sourceReads.length !== 1) return false;
  const actual = actualReads[0], record = result.sourceReads[0];
  if (actual.grant !== grant.resource || actual.at_ms !== now || record.grant !== actual.grant
      || record.at_ms !== actual.at_ms || record.purpose !== 'verification') return false;
  const status = actual.status;
  const observed = status?.available === true && Number.isFinite(status.checkedAt)
    && (status.revokedAt == null || Number.isFinite(status.revokedAt));
  if (actual.threw === true) {
    return record.outcome === 'error' && record.observation === null && result.observationAsOf === null;
  }
  return observed
    ? record.outcome === 'observed' && record.observation?.as_of_ms === status.checkedAt
      && record.observation.revoked_at_ms === (status.revokedAt ?? null) && result.observationAsOf === status.checkedAt
    : record.outcome === 'unavailable' && record.observation === null && result.observationAsOf === null;
}
