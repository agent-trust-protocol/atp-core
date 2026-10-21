import { recordDiagnostic } from '../../packages/create-atp-agent/template/diagnostics.mjs';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createBoundary } from './boundary.mjs';

let shellCallbackRuns = 0;
const boundary = createBoundary({
  // Fixed resource: no untrusted path or mode is accepted by this tool.
  readFixture: { actionType: 'filesystem', run: () => readFile(new URL('./fixture.txt', import.meta.url), 'utf8') },
  // A harmless sentinel proves the gate holds. No shell command is executed.
  shellAttempt: { actionType: 'shell', run: () => { shellCallbackRuns++; return 'sentinel'; } }
});
const read = await boundary.invoke('readFixture');
assert.equal(read.callbackRan, true);
const shell = await boundary.invoke('shellAttempt');
assert.equal(shell.decision, 'require_approval');
assert.equal(shell.callbackRan, false);
boundary.complete();
const completed = await boundary.invoke('readFixture');
assert.equal(completed.decision, 'deny');
assert.equal(completed.callbackRan, false);
const unknown = await boundary.invoke('unregisteredTool');
assert.equal(unknown.decision, 'deny');
assert.equal(shellCallbackRuns, 0);
for (const row of boundary.history) console.log(JSON.stringify(row));
console.log('PASS: permitted read ran; shell, completed-session read and unknown tool did not run.');

recordDiagnostic('example_completion');
