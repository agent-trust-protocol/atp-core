import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planInput, describePlan } from '../src/intent.mjs';
import { respond } from '../src/cli.mjs';

test('understands relevant trust tasks without executing them', () => {
  const p = planInput('Why did Guardian deny this agent?');
  assert.equal(p.type, 'natural-language');
  assert.deepEqual(p.matches.map(x=>x.id), ['agents','guardian']);
  assert.equal(p.mutating, false);
  assert.match(respond('Why did Guardian deny this agent?'), /No tools were called/);
});
test('mutating natural language requires approval and ATP authorization', () => {
  const p = planInput('Revoke all mandates');
  assert.equal(p.mutating, true);
  assert.match(describePlan('Revoke all mandates'), /explicit human approval AND verified ATP authorization/);
});
test('unrecognized input stays non-executing', () => {
  assert.match(respond('calculate pi'), /no action was executed/i);
  assert.match(respond('/unknown'), /Unknown slash command/);
});
test('does not treat slash commands as natural-language operations', () => {
  assert.deepEqual(planInput('/status').type, 'slash');
});
