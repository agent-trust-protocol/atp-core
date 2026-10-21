import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
const file = join(process.env.ATP_DIAGNOSTICS_DIR || join(homedir(), '.atp'), 'diagnostics/events.jsonl');
let rows = [];
try { rows = readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const now = new Date();
const start = new Date(now.getTime() - 6 * 86400000).toISOString().slice(0, 10);
const end = now.toISOString().slice(0, 10);
rows = rows.filter(r => r.day >= start && r.day <= end);
const count = event => rows.filter(r => r.event === event).length;
console.log(JSON.stringify({ source: 'local opt-in diagnostics; no hosted or unique-user data', start, end,
  successfulDependencyInstalls: count('install'), firstSuccessfulRunObservations: count('first_run'), successfulRuns: count('run_success'),
  completedExamples: count('example_completion'), errors: count('error'),
  daysWithSuccessfulRuns: new Set(rows.filter(r => r.event === 'run_success').map(r => r.day)).size,
  uniqueDevelopers: 'unobserved', recurringUsers: 'unobserved', topFailurePoints: 'unobserved: error payloads are not collected'
}, null, 2));
