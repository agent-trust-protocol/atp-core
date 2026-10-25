// ATP-authored mapping of synthetic policy to lab revision 3; not a production adapter.
// Author-produced (Mode A). The revision-2 mapping in ../lab-revision2.mjs is frozen and untouched;
// this file repeats its timeline translation rather than importing it, because that function gates
// on the revision-2 digest and must keep doing so.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { protectedBoundary } from '../fixture-policy.mjs';

// Lab pin: Agent-Authority-Conformance/aps-conformance-suite, merge of PR #191.
export const LAB_COMMIT = '7774daee77a7766f737c6da71265c9e214b47ff5';
export const LAB_REVISION3_COMMIT = '9a28261967bf0d2f9d08ed48f06026871818e816';
export const CORPUS_SHA256 = '3b7b3fb97682fb967801641b8ed680a9cae608ff57738a594fc6f0314aac1bb6';
export const ORACLE_SHA256 = '08293dbd991fe3f76534e176800e15365545a43a6d94e4d89f79d6d58ec7e830';
export const MODE = 'live_standing_read';
export const BOUNDARY = 'exclusive';

// Declared mapping from ATP synthetic reasons to the revision-3 refusal_reason vocabulary. It is a
// local translation for comparison, not an adoption of either vocabulary by the other side.
// `out_of_scope` is one ATP reason covering resource, audience and operation; the mapping splits it
// by the inputs the evaluator was given, never by the expected record.
export const REASON_MAP = Object.freeze({
  mandate_expired: 'evidence_expired',
  status_not_current: 'authority_not_determined',
  mandate_revoked: 'authority_revoked',
});

export function mapRefusalReason(result, input, mutation = null) {
  if (result.decision === 'ALLOW') return null;
  if (result.reason === 'out_of_scope') {
    return input.grant.resource !== input.request.resource
      ? 'evidence_binding_mismatch'
      : 'operation_not_permitted';
  }
  if (mutation === 'fold-undetermined-into-revoked' && result.reason === 'status_not_current') {
    return 'authority_revoked';
  }
  return REASON_MAP[result.reason] ?? `unmapped:${result.reason}`;
}

// The observation the ATP decision used, derived from the decision's own path. `decide()` consults
// status only after scope and expiry pass, so a scope or expiry refusal used no observation.
function observationUsed(result, input) {
  const consulted = result.decision === 'ALLOW' || ['status_not_current', 'mandate_revoked'].includes(result.reason);
  return consulted && input.status.available ? input.now : null;
}

const canonical = (value) => JSON.stringify(value, Object.keys(value ?? {}).sort());

export function runRevision3(bytes, mutation = null) {
  const digest = createHash('sha256').update(bytes).digest('hex');
  if (digest !== CORPUS_SHA256) throw new Error('Frozen revision-3 corpus digest mismatch');
  const corpus = JSON.parse(bytes);
  if (corpus.version !== 3) throw new Error('Expected revision-3 vectors');
  const records = [];
  for (const scenario of corpus.cases) {
    let available = true;
    const revoked = new Map();
    for (const event of scenario.timeline) {
      if (event.event === 'availability') { available = event.available; continue; }
      if (event.event === 'revoke') { revoked.set(event.grant, event.at_ms); continue; }
      if (event.event !== 'call') throw new Error('Unsupported timeline event');
      const evidence = event.evidence_id
        ? corpus.profile.initial_evidence.find(e => e.id === event.evidence_id)
        : corpus.profile.initial_evidence.find(e => e.grant === event.grant);
      if (!evidence) throw new Error('Missing evidence');
      // No expected output, truth field, case ID or worker label enters the evaluator.
      const input = {
        operator: { id: 'operator', issuer: 'fixture', active: true, canGrant: true },
        grant: {
          agentDid: evidence.subject, issuerVerified: true, proofVerified: true,
          issuedBy: 'operator', issuer: 'fixture', actions: evidence.allowed_operations,
          resource: `grant:${evidence.grant}`, audience: 'fixture-resource',
          notBefore: evidence.issued_at_ms, expiresAt: evidence.expires_at_ms,
        },
        request: { agentDid: evidence.subject, action: event.operation,
          resource: `grant:${event.grant}`, audience: 'fixture-resource' },
        status: { available, checkedAt: event.at_ms,
          revokedAt: revoked.get(evidence.grant) ?? null },
        now: event.at_ms,
      };
      let calls = 0;
      let result = protectedBoundary(input, () => { calls++; });
      if (mutation === 'deny-everything') { result = { decision: 'DENY', reason: 'mutant' }; calls = 0; }
      if (mutation === 'deny-but-dispatch' && result.decision === 'DENY') calls++;
      // Comparison is deliberately after execution; the oracle cannot choose the verdict.
      const expected = event.expected.by_mode[MODE][BOUNDARY];
      const observed = {
        action_decision: result.decision === 'ALLOW' ? 'permit' : 'deny',
        downstream_reached: calls > 0,
        refusal_reason: mapRefusalReason(result, input, mutation),
        grant_ref: {
          grant: mutation === 'name-requested-grant' ? event.grant : evidence.grant,
          evidence_id: evidence.id,
          issued_at_ms: evidence.issued_at_ms,
          expires_at_ms: evidence.expires_at_ms,
          observation_as_of_ms: observationUsed(result, input),
        },
      };
      const projection = {
        action_decision: expected.action_decision,
        downstream_reached: expected.downstream_reached,
        refusal_reason: expected.refusal_reason,
        grant_ref: expected.grant_ref,
      };
      const actionMatch = observed.action_decision === projection.action_decision
        && observed.downstream_reached === projection.downstream_reached;
      const reasonMatch = observed.refusal_reason === projection.refusal_reason;
      const grantRefMatch = canonical(observed.grant_ref) === canonical(projection.grant_ref);
      const differing = Object.keys(projection.grant_ref)
        .filter(k => observed.grant_ref[k] !== projection.grant_ref[k]);
      records.push({
        id: event.id, worker_label: event.worker, atp_reason: result.reason,
        protected_callback_count: calls, expected: projection, observed,
        action_match: actionMatch, reason_match: reasonMatch, grant_ref_match: grantRefMatch,
        grant_ref_differing_fields: differing,
        note: !grantRefMatch && result.reason === 'out_of_scope' && differing.join() === 'observation_as_of_ms'
          ? 'ATP evaluator refuses an out-of-scope operation before consulting status; the lab model reads status first and checks the operation last'
          : null,
      });
    }
  }
  const count = (key) => records.filter(r => r[key]).length;
  return {
    schema: 'atp-synthetic-revision3-mapping-v1',
    lab_commit: LAB_COMMIT, lab_revision3_commit: LAB_REVISION3_COMMIT,
    vectors_sha256: digest, mode: MODE, boundary: BOUNDARY, action_policy: corpus.profile.action_policy,
    provenance: { mode: 'Mode A', relationship: 'author-produced',
      reason: 'ATP-authored synthetic policy evaluator and mapping; no independent recomputation' },
    reason_mapping: { ...REASON_MAP, out_of_scope: 'evidence_binding_mismatch when the resource is bound to another grant, else operation_not_permitted', ALLOW: null },
    claims: { synthetic_action_policy: 'run', synthetic_protected_callback: 'run',
      refusal_reason_comparison: 'run (declared mapping)', grant_ref_comparison: 'run',
      evidence_freshness_axis: 'not_claimed', authority_validity_axis: 'not_claimed',
      composite_verification: 'not_claimed', source_read_audit: 'not_run', diagnostic_reads: 'not_supported',
      lab_defective_variants: 'not_run', authenticated_status: 'not_claimed', guardian_runtime: 'not_claimed',
      separate_processes: 'not_run', cached_lease: 'not_supported', inclusive_endpoint: 'not_supported' },
    cases: corpus.cases.length, calls: records.length,
    action_matched: count('action_match'), reason_matched: count('reason_match'), grant_ref_matched: count('grant_ref_match'),
    all_matched: records.filter(r => r.action_match && r.reason_match && r.grant_ref_match).length,
    mismatches: records.filter(r => !(r.action_match && r.reason_match && r.grant_ref_match))
      .map(r => ({ id: r.id, atp_reason: r.atp_reason, fields: [
        ...(r.action_match ? [] : ['action_decision/downstream_reached']),
        ...(r.reason_match ? [] : ['refusal_reason']),
        ...r.grant_ref_differing_fields.map(f => `grant_ref.${f}`)],
        observed: r.observed, expected: r.expected, note: r.note })),
    records,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = runRevision3(readFileSync(process.argv[2]));
  console.log(JSON.stringify(report, null, 2));
  // Exit 1 on any disagreement with the revision-3 contract, including documented ones.
  if (report.all_matched !== report.calls) process.exitCode = 1;
}
