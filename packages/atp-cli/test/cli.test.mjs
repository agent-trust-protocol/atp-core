import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { COMMANDS, respond } from '../src/cli.mjs';

const executable = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/cli.mjs');

test('help advertises only defined preview commands', () => {
  for (const key of Object.keys(COMMANDS)) assert.match(respond('/help'), new RegExp('/' + key));
});
test('status and integration commands do not claim authorization', () => {
  assert.match(respond('status'), /read-only/);
  for (const command of ['agents','connect','guardian','mandates','audit']) {
    assert.match(respond('/' + command), /not connected|not yet implemented/);
  }
});
test('arbitrary natural language cannot execute work in preview', () => {
  assert.match(respond('approve all agents'), /No tools were called, no identities were verified, and no changes were made/);
  assert.equal(respond('/exit'), null);
});
test('help works noninteractively and shell refuses non-TTY', () => {
  const help = spawnSync(process.execPath, [executable,'--help'], { encoding:'utf8' });
  assert.equal(help.status,0);
  assert.match(help.stdout,/interactive preview/);
  const shell = spawnSync(process.execPath, [executable], { encoding:'utf8' });
  assert.equal(shell.status,2);
  assert.match(shell.stdout,/requires a TTY/);
});
