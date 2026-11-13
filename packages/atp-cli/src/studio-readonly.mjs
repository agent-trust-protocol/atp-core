// ATP Studio audit evidence inspection. Deliberately separate from ATP Core registry.
// An audit receipt describes a historical outcome, not current permission to act.
export function studioConfig(env = process.env) {
  if (env.ATP_STUDIO_READ_ONLY !== '1') throw new Error('ATP Studio read access disabled. Set ATP_STUDIO_READ_ONLY=1.');
  const port = env.ATP_STUDIO_LOCAL_PORT || '3000';
  if (!/^[0-9]{1,5}$/.test(port) || +port < 1 || +port > 65535) throw new Error('Invalid local Studio port.');
  const session = env.ATP_STUDIO_SESSION;
  if (!session || !/^[A-Za-z0-9_-]{16,512}$/.test(session)) {
    throw new Error('Set ATP_STUDIO_SESSION privately to a valid local operator session. Never paste it into chat or logs.');
  }
  return { endpoint: 'http://127.0.0.1:' + port, session };
}

function normalize(value, max = 180) {
  return typeof value === 'string' ? value.replace(/[\x00-\x1f\x7f-\x9f]/g, ' ').slice(0, max) : 'unavailable';
}
export function formatDecision(data) {
  if (!data || typeof data !== 'object' || !['ALLOW','DENY'].includes(data.result) ||
      typeof data.id !== 'string' || !/^evt_[A-Za-z0-9_-]{1,120}$/.test(data.id)) {
    throw new Error('Studio audit response did not meet its evidence contract.');
  }
  return [
    'ATP Studio historical Guardian/audit event (not current authorization)',
    'Event ID: ' + normalize(data.id),
    'Recorded result: ' + data.result,
    'Action: ' + normalize(data.action),
    'Reason code: ' + normalize(data.reasonCode),
    'Explanation: ' + normalize(data.denyExplanation, 360),
    'Policy: ' + normalize(data.policyId) + (Number.isInteger(data.policyVersion) ? ' v' + data.policyVersion : ''),
    'Trust score at action: ' + (typeof data.trustScoreAt === 'number' ? data.trustScoreAt : 'unavailable'),
    'Occurred: ' + normalize(data.occurredAt),
    'Anchor state: ' + normalize(data.anchor?.status),
    'Evidence retrieved from Studio; signature/hash-chain verification NOT performed by this CLI.',
    'Never use this event as authorization for a future action.'
  ].join('\n');
}

export async function inspectDecision(id, { env = process.env, fetchImpl = fetch } = {}) {
  if (typeof id !== 'string' || !/^evt_[A-Za-z0-9_-]{1,120}$/.test(id)) throw new Error('Provide a valid audit event ID (evt_...).');
  const config = studioConfig(env);
  let response;
  try {
    response = await fetchImpl(config.endpoint + '/v1/audit/events/' + encodeURIComponent(id), {
      method: 'GET',
      headers: { Accept: 'application/json', Cookie: 'atp_session=' + config.session },
      redirect: 'error',
      signal: AbortSignal.timeout(8000)
    });
  } catch {
    throw new Error('Local Studio unavailable. No remote fallback attempted.');
  }
  if (!response.ok) throw new Error('Studio returned HTTP ' + response.status + '. No audit finding inferred.');
  let data;
  try { data = await response.json(); } catch { throw new Error('Studio returned invalid JSON.'); }
  if (data.id !== id) throw new Error('Studio response event ID mismatch.');
  return formatDecision(data);
}
