// Runs the revision-3 comparison and reports its disagreements with the lab contract. Exits 0 only
// when the disagreement set is exactly the disclosed one, so CI notices any change in either
// direction. Exit 0 here means "unchanged", never "conformant": the comparison itself still
// disagrees on these records, and lab-revision3.mjs exits 1 for that reason.
import { readFileSync } from 'node:fs';
import { runRevision3 } from './lab-revision3.mjs';

export const KNOWN_DISAGREEMENTS = Object.freeze([
  ['LRA-09-r1', 'grant_ref.observation_as_of_ms'],
  ['LRA-09-r2', 'grant_ref.observation_as_of_ms'],
]);

const report = runRevision3(readFileSync(process.argv[2]));
const actual = report.mismatches.map(m => [m.id, m.fields.join()]);
const unchanged = JSON.stringify(actual) === JSON.stringify(KNOWN_DISAGREEMENTS);
console.log(`revision-3 comparison: action ${report.action_matched}/${report.calls}, refusal_reason ${report.reason_matched}/${report.calls}, grant_ref ${report.grant_ref_matched}/${report.calls}`);
console.log(`disagreements with the lab contract: ${actual.length} (${actual.map(a => a.join(' ')).join('; ') || 'none'})`);
console.log(unchanged
  ? 'disagreement set is exactly the disclosed one; NOT a conformance pass'
  : 'disagreement set CHANGED from the disclosed one; update the report before relying on it');
process.exitCode = unchanged ? 0 : 1;
