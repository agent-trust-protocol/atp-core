import test from 'node:test';
import assert from 'node:assert/strict';
import { createBoundary } from './boundary.mjs';

test('blocked calls never reach callbacks and completing a session stops further reads', async () => {
  let reads = 0, shells = 0;
  const boundary = createBoundary({read: {actionType: 'filesystem', run: () => ++reads},
    shell: {actionType: 'shell', run: () => ++shells}});
  assert.equal((await boundary.invoke('read')).value, 1);
  assert.equal((await boundary.invoke('shell')).decision, 'require_approval');
  boundary.complete();
  assert.equal((await boundary.invoke('read')).decision, 'deny');
  assert.equal(reads, 1); assert.equal(shells, 0);
});
test('unregistered, inherited and unknown-category tools fail closed', async () => {
  let calls = 0;
  const tools = Object.assign(Object.create({inherited: {actionType:'filesystem',run:()=>++calls}}),
    {unknownCategory: {actionType:'not-a-category',run:()=>++calls}});
  const boundary = createBoundary(tools);
  for (const name of ['missing', 'inherited', '__proto__', 'unknownCategory'])
    assert.equal((await boundary.invoke(name)).decision,'deny');
  assert.equal(calls,0);
});
test('history cannot be modified to change previous outcomes', async () => {
  const boundary=createBoundary({}); await boundary.invoke('missing');
  boundary.history[0].decision='allow'; assert.equal(boundary.history[0].decision,'deny');
});
