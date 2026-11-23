import { test } from 'node:test';
import assert from 'node:assert/strict';
import { studioConfig, formatDecision, inspectDecision } from '../src/studio-readonly.mjs';
import { respond } from '../src/cli.mjs';

const env = { ATP_STUDIO_READ_ONLY:'1', ATP_STUDIO_SESSION:'0123456789abcdef0123456789abcdef' };
const event = { id:'evt_test123', result:'DENY', action:'tool.read',
  reasonCode:'scope_missing', denyExplanation:'Missing required scope',
  policyId:'policy_1', policyVersion:3, trustScoreAt:52,
  occurredAt:'2026-10-17T20:00:00Z', anchor:{status:'pending'} };

test('Studio inspection fails closed without opt-in or session',async()=>{
  assert.throws(()=>studioConfig({}),/disabled/);
  assert.throws(()=>studioConfig({ATP_STUDIO_READ_ONLY:'1'}),/ATP_STUDIO_SESSION/);
  let calls=0;
  await assert.rejects(inspectDecision('evt_test123',{env:{},fetchImpl:async()=>{calls++;}}),/disabled/);
  assert.equal(calls,0);
});
test('historical DENY formats evidence without asserting current permission',()=>{
  const value=formatDecision(event);
  assert.match(value,/Recorded result: DENY/);
  assert.match(value,/Missing required scope/);
  assert.match(value,/not current authorization/);
  assert.match(value,/verification NOT performed/);
});
test('requires event ID and fails on mismatched response',async()=>{
  await assert.rejects(inspectDecision('../other',{env}),/valid audit event ID/);
  await assert.rejects(inspectDecision('evt_test123',{env,fetchImpl:async()=>({
    ok:true,json:async()=>({...event,id:'evt_other'})
  })}),/mismatch/);
});
test('uses authenticated GET against local Studio only; never writes',async()=>{
  let invoked;
  const result=await inspectDecision('evt_test123',{env,fetchImpl:async(url,opts)=>{
    invoked={url,opts};
    return {ok:true,json:async()=>event};
  }});
  assert.equal(invoked.url,'http://127.0.0.1:3000/v1/audit/events/evt_test123');
  assert.equal(invoked.opts.method,'GET');
  assert.equal(invoked.opts.redirect,'error');
  assert.match(invoked.opts.headers.Cookie,/^atp_session=/);
  assert.match(result,/DENY/);
});
test('denies malformed, unauthenticated and unreachable events',async()=>{
  await assert.rejects(inspectDecision('evt_test123',{env,fetchImpl:async()=>({ok:false,status:401})}),/HTTP 401/);
  await assert.rejects(inspectDecision('evt_test123',{env,fetchImpl:async()=>{throw Error('network');}}),/No remote fallback/);
  assert.throws(()=>formatDecision({...event,result:'ALLOWED'}),/evidence contract/);
  assert.match(respond('/decision'),/Usage:/);
});
test('remote ANSI control sequences are not rendered',()=>{
  assert.doesNotMatch(formatDecision({...event,denyExplanation:'bad\u001b[31m'}),/\u001b/);
});
