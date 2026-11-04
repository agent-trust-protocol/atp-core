import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('.', import.meta.url));
const cases = [
  ['fixed fixture read', 'read_file', { path: 'fixture.txt' }, false],
  ['terminal attempt', 'terminal', { command: 'echo sentinel' }, true],
  ['write attempt', 'write_file', { path: 'fixture.txt', content: 'sentinel' }, true],
  ['outside fixture', 'read_file', { path: '../action-boundary/fixture.txt' }, true],
];
console.log('ATP Core / Hermes hook wire-format walkthrough');
console.log('No Hermes runtime or tool execution is involved.');
for (const [name, tool_name, tool_input, blocked] of cases) {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./atp-hook.mjs', import.meta.url))], {
    input: JSON.stringify({ hook_event_name: 'pre_tool_call', tool_name, tool_input, cwd }),
    encoding: 'utf8',
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  const response = JSON.parse(result.stdout);
  if (blocked) assert.equal(response.action, 'block');
  else assert.deepEqual(response, {});
  console.log(`${blocked ? 'BLOCK' : 'PASS '}  ${name}: ${JSON.stringify(response)}`);
}
console.log('PASS: all four hook decisions match their expected outcomes.');
