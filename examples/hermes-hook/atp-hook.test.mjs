import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { decide } from './atp-hook.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const event = (tool_name, path = 'fixture.txt') => ({
  hook_event_name: 'pre_tool_call', tool_name, tool_input: { path }, cwd: here,
});

test('Hermes wire format permits only the fixed fixture', () => {
  assert.deepEqual(decide(event('read_file')), {});
  for (const name of ['terminal', 'write_file', 'patch', 'unknown']) {
    assert.equal(decide(event(name)).action, 'block');
  }
  assert.equal(decide(event('read_file', '../action-boundary/fixture.txt')).action, 'block');
  assert.equal(decide(event('read_file', '/etc/passwd')).action, 'block');
  assert.equal(decide({ ...event('read_file'), hook_event_name: 'post_tool_call' }).action, 'block');
});

test('symlink alias and malformed payload fail closed', () => {
  const dir = mkdtempSync(join(tmpdir(), 'atp-hermes-'));
  try {
    symlinkSync(join(here, 'fixture.txt'), join(dir, 'fixture.txt'));
    // Resolving to the same file is acceptable; an alias does not expand the set.
    assert.deepEqual(decide({ ...event('read_file'), cwd: dir }), {});
    assert.equal(decide({ ...event('read_file'), tool_input: null }).action, 'block');
    assert.equal(decide(null).action, 'block');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('subprocess emits Hermes block JSON for invalid input', () => {
  const out = execFileSync(process.execPath, [join(here, 'atp-hook.mjs')], {
    input: '{bad json', encoding: 'utf8',
  });
  assert.equal(JSON.parse(out).action, 'block');
  const allowed = execFileSync(process.execPath, [join(here, 'atp-hook.mjs')], {
    input: JSON.stringify(event('read_file')), encoding: 'utf8',
  });
  assert.deepEqual(JSON.parse(allowed), {});
});
