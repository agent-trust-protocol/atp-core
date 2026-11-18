import test from 'node:test';
import assert from 'node:assert/strict';
import { createHeliaHTTP } from '@helia/http';
import { json } from '@helia/json';
import { strings } from '@helia/strings';

test('updated Helia stack stores and retrieves JSON and strings locally', async t => {
  // No gateways, routing requests or remote publication in this compatibility test.
  const helia = await createHeliaHTTP({ routers: [], blockBrokers: [] });
  t.after(() => helia.stop());
  const events = json(helia);
  const text = strings(helia);
  const event = { id: 'compatibility-test', action: 'read', timestamp: 123 };
  const eventCid = await events.add(event);
  assert.deepEqual(await events.get(eventCid), event);
  const textCid = await text.add('ATP local audit compatibility');
  assert.equal(await text.get(textCid), 'ATP local audit compatibility');
});
