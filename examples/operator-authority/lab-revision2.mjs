// ATP-authored mapping of synthetic policy only; not a production adapter.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { protectedBoundary } from './fixture-policy.mjs';

export const CORPUS_SHA256 = 'a0a07ea58bcacfd056cbd648e03de4ff14778aa151e8b5d2574e43e31a111ed8';

export function runRevision2(bytes, mutation = null) {
  const digest = createHash('sha256').update(bytes).digest('hex');
  if (digest !== CORPUS_SHA256) throw new Error('Frozen revision-2 corpus digest mismatch');
  const corpus = JSON.parse(bytes);
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
      // Bind the synthetic resource to the grant so one grant cannot stand for another.
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
      const expected = event.expected.by_mode.live_standing_read.exclusive;
      const observed = { action_decision: result.decision === 'ALLOW' ? 'permit' : 'deny', downstream_reached: calls > 0 };
      const expectedProjection = { action_decision: expected.action_decision, downstream_reached: expected.downstream_reached };
      records.push({ id: event.id, worker_label: event.worker,
        grant_reference: { evidence_id: evidence.id, evaluated_grant: evidence.grant, requested_grant: event.grant },
        refusal_reason: result.decision === 'ALLOW' ? null : result.reason,
        protected_callback_count: calls, expected: expectedProjection, observed,
        match: JSON.stringify(expectedProjection) === JSON.stringify(observed) });
    }
  }
  return { schema: 'atp-synthetic-revision2-mapping-v1', corpus_sha256: digest,
    mode: 'live_standing_read', boundary: 'exclusive', action_policy: 'P1-current-observation',
    provenance: { mode: 'Mode A', relationship: 'author-produced',
      reason: 'ATP-authored policy evaluator and mapping; no independent recomputation' },
    claims: { synthetic_action_policy: 'run', synthetic_protected_callback: 'run',
      evidence_freshness_axis: 'not_claimed', authority_validity_axis: 'not_claimed',
      authenticated_status: 'not_claimed', guardian_runtime: 'not_claimed', separate_processes: 'not_run',
      cached_lease: 'not_supported', inclusive_endpoint: 'not_supported' },
    proposed_revision3_fields: 'local metadata only; not a revision-3 conformance claim',
    cases: corpus.cases.length, calls: records.length,
    matched: records.filter(r => r.match).length, records };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = runRevision2(readFileSync(process.argv[2]));
  console.log(JSON.stringify(report, null, 2));
  if (report.matched !== report.calls) process.exitCode = 1;
}
