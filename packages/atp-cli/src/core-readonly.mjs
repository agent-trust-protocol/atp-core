// Minimal read-only HTTP adapter to ATP SDK registry/permission endpoint contracts.
// Registry identity and trust records are NOT cryptographic DID verification.
// A permission grant is NOT a Guardian authorization decision.
const LOOPBACK = '127.0.0.1';
function assertDid(did) {
  if (typeof did !== 'string' || !/^did:[a-z0-9]+:[A-Za-z0-9._:%-]{1,350}$/.test(did)) throw new Error('Specify a valid DID for inspection.');
  return did;
}
export function coreConfig(env = process.env) {
  if (env.ATP_CORE_READ_ONLY !== '1') throw new Error('Local ATP read access disabled; set ATP_CORE_READ_ONLY=1.');
  // Keep this preview loopback-only and refuse arbitrary hostnames or paths.
  const identityPort = env.ATP_CORE_IDENTITY_PORT || '3001';
  const permissionsPort = env.ATP_CORE_PERMISSIONS_PORT || '3003';
  for (const port of [identityPort, permissionsPort]) {
    if (!/^[0-9]{1,5}$/.test(port) || +port < 1 || +port > 65535) throw new Error('Invalid local ATP service port.');
  }
  return {
    identity: `http://${LOOPBACK}:${identityPort}`,
    permissions: `http://${LOOPBACK}:${permissionsPort}`,
    token: env.ATP_CORE_READ_TOKEN || ''
  };
}
async function getJSON(config, service, path, fetchImpl) {
  const headers = { Accept: 'application/json' };
  if (config.token) headers.Authorization = 'Bearer ' + config.token;
  let result;
  try {
    result = await fetchImpl(config[service] + path, {
      method: 'GET', headers, redirect: 'error', signal: AbortSignal.timeout(8000)
    });
  } catch {
    throw new Error('Local ATP ' + service + ' service is unavailable; no remote fallback was attempted.');
  }
  if (!result.ok) throw new Error('ATP ' + service + ' returned HTTP ' + result.status + '. No authorization was inferred.');
  let body;
  try { body = await result.json(); } catch { throw new Error('ATP returned invalid JSON.'); }
  if (body?.success !== true || !body.data) throw new Error('ATP response failed its success/data contract.');
  return body.data;
}
function safe(value, max = 360) {
  return typeof value === 'string' ? value.replace(/[\x00-\x1f\x7f-\x9f]/g, ' ').slice(0, max) : 'not-reported';
}
export async function inspectCore(action, did, { env = process.env, fetchImpl = fetch } = {}) {
  const cfg = coreConfig(env);
  if (action === 'agents') {
    const data = await getJSON(cfg, 'identity', '/identity?limit=20&offset=0', fetchImpl);
    if (!Array.isArray(data.agents) || !Number.isInteger(data.total)) throw new Error('Unexpected ATP agents response shape.');
    return [
      'ATP registry records (NOT verified DID identities)',
      'Reported total: ' + data.total + ' | Displaying up to 20',
      ...data.agents.slice(0,20).map(a => safe(a?.did) + ' | registry status: ' + safe(a?.status)),
      'Registry data does not establish Guardian authorization.'
    ].join('\n');
  }
  const subject = assertDid(did);
  if (action === 'trust') {
    const data = await getJSON(cfg, 'identity', '/identity/' + encodeURIComponent(subject) + '/trust-info', fetchImpl);
    if (!['UNKNOWN','BASIC','VERIFIED','TRUSTED','PRIVILEGED'].includes(data.level) || typeof data.score !== 'number' || !Number.isFinite(data.score)) throw new Error('Unexpected trust-level response shape.');
    return 'ATP registry trust information (unverified): ' + subject + '\nLevel: ' + data.level + ' | Score: ' + data.score + '\nNot a cryptographic identity proof or Guardian decision.';
  }
  if (action === 'grants') {
    const data = await getJSON(cfg, 'permissions', '/permissions/subject/' + encodeURIComponent(subject) + '?limit=20&offset=0', fetchImpl);
    if (!Array.isArray(data.grants) || !Number.isInteger(data.total)) throw new Error('Unexpected ATP grants response shape.');
    return [
      'ATP permission-grant records for ' + subject + ' (not a live authorization)',
      'Reported total: ' + data.total + ' | Displaying up to 20',
      ...data.grants.slice(0,20).map(g => safe(g?.resource,100) + ' / ' + safe(g?.action,100) + ' | status: ' + safe(g?.status,30)),
      'Guardian and mandate revocation must be checked independently before execution.'
    ].join('\n');
  }
  throw new Error('Unsupported read-only ATP action.');
}
