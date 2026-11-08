// Runs the revision-3 comparison and reports its disagreements with the lab contract. Exits 0 only
// when the disagreement set is exactly the disclosed one, record for record and value for value,
// so CI notices any change in either direction. Exit 0 here means "unchanged", never "conformant":
// the comparison itself still disagrees on these records, and lab-revision3.mjs exits 1 for that.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { runRevision3 } from './lab-revision3.mjs';

export const KNOWN_DISAGREEMENTS = Object.freeze([
  { id: 'LRA-09-r1', field: 'grant_ref.observation_as_of_ms', observed: null, expected: 0 },
  { id: 'LRA-09-r2', field: 'grant_ref.observation_as_of_ms', observed: null, expected: 30000 },
]);

const valueAt = (record, field) => field.split('.').reduce((v, k) => (v == null ? v : v[k]), record);

/** One row per disagreeing field, with the observed and expected values. */
export function disagreements(report) {
  return report.mismatches.flatMap(m => m.fields.map(field => ({
    id: m.id, field, observed: valueAt(m.observed, field) ?? null, expected: valueAt(m.expected, field) ?? null,
  })));
}

export function unchanged(report, known = KNOWN_DISAGREEMENTS) {
  return JSON.stringify(disagreements(report)) === JSON.stringify(known);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = runRevision3(readFileSync(process.argv[2]));
  const actual = disagreements(report);
  console.log(`revision-3 comparison: action ${report.action_matched}/${report.calls}, refusal_reason ${report.reason_matched}/${report.calls}, grant_ref ${report.grant_ref_matched}/${report.calls}`);
  console.log(`disagreements with the lab contract: ${actual.length}`);
  for (const d of actual) console.log(`  ${d.id} ${d.field}: observed ${JSON.stringify(d.observed)}, expected ${JSON.stringify(d.expected)}`);
  const same = unchanged(report);
  console.log(same
    ? 'disagreement set is exactly the disclosed one; NOT a conformance pass'
    : 'disagreement set CHANGED from the disclosed one; update the report before relying on it');
  process.exitCode = same ? 0 : 1;
}
