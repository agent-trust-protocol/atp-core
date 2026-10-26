import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {serialize} from './proposed-combined-failures/generate.mjs';
import {liveReadBoundary} from './live-read-policy.mjs';
import {protectedBoundary as legacy} from '../fixture-policy.mjs';
import {mapRefusalReason} from './lab-revision3-live.mjs';
const raw=readFileSync(new URL('./proposed-combined-failures/vectors.json',import.meta.url),'utf8');
test('proposed cases regenerate byte-for-byte',()=>assert.equal(serialize(),raw));
function run(scenario,boundary,fold=false){
 let available=true,revokedAt=null;const records=[];
 for(const event of scenario.events){
  if(event.event==='revoke'){revokedAt=event.at_ms;continue;}
  if(event.event==='availability'){available=event.available;continue;}
  const g=scenario.grant;
  const input={operator:{active:true,canGrant:true,id:'o',issuer:'i'},grant:{agentDid:g.subject,issuerVerified:true,proofVerified:true,issuedBy:'o',issuer:'i',resource:g.resource,audience:g.audience,actions:g.operations,notBefore:g.issued_at_ms,expiresAt:g.expires_at_ms},request:{agentDid:g.subject,resource:g.resource,audience:g.audience,action:event.operation},now:event.at_ms};
  let callbacks=0,reads=0;const source=query=>{reads++;assert.deepEqual(query,{grant:g.resource,at_ms:event.at_ms});return {available,checkedAt:event.at_ms,revokedAt};};
  const result=boundary(input,source,()=>callbacks++);
  records.push({at_ms:event.at_ms,decision:result.decision,refusal_reason:mapRefusalReason(result,input,fold?'fold-undetermined-into-revoked':null),callback_count:callbacks,source_attempts:reads,observation_as_of_ms:result.observationAsOf??null});
 }
 return records;
}
for(const scenario of JSON.parse(raw).cases){
 test(`${scenario.id}: four calls use actual source attempts and declared precedence`,()=>{
  const records=run(scenario,liveReadBoundary);
  // Checked from the run itself, not only via the vectors: the valid T=0 read executes once and
  // every later forbidden write executes zero times, each after exactly one source attempt.
  assert.equal(records[0].at_ms,0);assert.equal(records[0].callback_count,1);
  assert.ok(records.length===4&&records.slice(1).every(r=>r.decision==='DENY'&&r.callback_count===0));
  assert.ok(records.every(r=>r.source_attempts===1));
  assert.deepEqual(records,scenario.expected);
 });
 test(`${scenario.id}: scope-first mutant is caught by source attempts and authority reason`,()=>{
  const broken=(i,source,resource)=>legacy({...i,status:{available:true,checkedAt:i.now,revokedAt:null}},resource);
  const records=run(scenario,broken);
  assert.equal(records[1].source_attempts,0);assert.equal(records[1].refusal_reason,'operation_not_permitted');
  assert.notDeepEqual(records,scenario.expected);
 });
}
test('unavailable-to-revoked mutation changes the proposed reason and is detected',()=>{
 const scenario=JSON.parse(raw).cases[1];const bad=run(scenario,liveReadBoundary,true);
 assert.equal(bad[1].refusal_reason,'authority_revoked');assert.notEqual(bad[1].refusal_reason,scenario.expected[1].refusal_reason);
});
