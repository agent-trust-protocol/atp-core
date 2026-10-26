import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { liveReadBoundary } from './live-read-policy.mjs';
import { checkSourceReads } from './source-read-contract.mjs';
import { runLiveRevision3 } from './lab-revision3-live.mjs';

const input = () => ({ operator: {active:true,canGrant:true,id:'o',issuer:'i'}, grant: {agentDid:'a',issuerVerified:true,proofVerified:true,issuedBy:'o',issuer:'i',resource:'g1',audience:'r',notBefore:0,expiresAt:120000,actions:['read']}, request: {agentDid:'a',resource:'g1',audience:'r',action:'write'}, now:30000 });
const path = process.env.ATP_LAB_REVISION3_VECTORS;
test('clarified profile: 44 decisions, reasons, references and local source contracts; tamper and mutants', { skip: !path && process.env.ATP_REQUIRE_LAB_CORPUS !== '1' }, () => {
  assert.ok(path);const bytes=readFileSync(path);const r=runLiveRevision3(bytes);
  assert.deepEqual([r.action_matched,r.reason_matched,r.grant_ref_matched,r.source_read_contract_matched],[44,44,44,44]);
  for (const id of ['LRA-09-r1','LRA-09-r2']) assert.equal(r.records.find(x=>x.id===id).source_reads.length,1);
  assert.throws(()=>runLiveRevision3(Buffer.concat([bytes,Buffer.from(' ')])),/digest mismatch/);
  for (const mutant of ['deny-everything','deny-but-dispatch','fold-undetermined-into-revoked','name-requested-grant']) assert.ok(runLiveRevision3(bytes,mutant).all_matched<44,mutant);
});
test('forbidden operation still reads exactly once; overlap precedence is binding, expiry, status, revocation, operation', () => {
  for(const bound of [true,false])for(const expired of [true,false])for(const state of ['active','revoked','stale','unavailable']) {
    const i=input();if(!bound)i.request.resource='g2';if(expired)i.now=120000;
    let reads=0,calls=0;
    const r=liveReadBoundary(i,q=>{reads++;assert.deepEqual(q,{grant:'g1',at_ms:i.now});return {available:state!=='unavailable',checkedAt:state==='stale'?0:i.now,revokedAt:state==='revoked'?10000:null};},()=>calls++);
    assert.equal(r.reason,!bound?'out_of_scope':expired?'mandate_expired':['stale','unavailable'].includes(state)?'status_not_current':state==='revoked'?'mandate_revoked':'out_of_scope');
    assert.equal(reads,bound&&!expired?1:0);assert.equal(calls,0);
  }
});
test('source error, missing/malformed/stale status fail closed and retain an explicit local attempt', () => {
  for(const value of [undefined,null,{available:true,checkedAt:NaN},{available:true,checkedAt:30000,revokedAt:'bad'},{available:true,checkedAt:0},{available:false}]){
    let calls=0;const r=liveReadBoundary(input(),()=>value,()=>calls++);assert.equal(r.reason,'status_not_current');assert.equal(r.sourceReads.length,1);assert.equal(calls,0);
    if(value?.checkedAt===0)assert.equal(r.observationAsOf,0);
  }
  const r=liveReadBoundary(input(),()=>{throw Error('private source details');},()=>assert.fail('executed'));
  assert.equal(r.reason,'status_not_current');assert.equal(r.sourceReads[0].outcome,'error');assert.ok(!JSON.stringify(r).includes('private source details'));
});
test('local source checker rejects skipped, duplicate, fabricated and wrong-grant records', () => {
  const i=input(),status={available:true,checkedAt:30000,revokedAt:null};
  const r=liveReadBoundary(i,()=>status,()=>assert.fail('executed'));const actual=[{grant:'g1',at_ms:30000,status}];
  assert.equal(checkSourceReads(i,r,actual),true);
  assert.equal(checkSourceReads(i,r,[]),false);
  assert.equal(checkSourceReads(i,r,[...actual,...actual]),false);
  assert.equal(checkSourceReads(i,r,[{...actual[0],grant:'g2'}]),false);
  assert.equal(checkSourceReads(i,{...r,observationAsOf:0},actual),false);
  const fake=structuredClone(r);fake.sourceReads[0].observation.as_of_ms=0;assert.equal(checkSourceReads(i,fake,actual),false);
});
test('approval remains required, exact-action bound and unused; valid request dispatches once', () => {
  for(const approval of [undefined,{verifiedByTrustedOperator:true,actionDigest:'wrong'}, {verifiedByTrustedOperator:true,actionDigest:'d',used:true},{verifiedByTrustedOperator:true,actionDigest:'d',used:false}]){
    const i=input();i.request.action='read';i.grant.requiresApproval=true;i.request.actionDigest='d';i.request.approval=approval;let calls=0;
    const r=liveReadBoundary(i,()=>({available:true,checkedAt:30000,revokedAt:null}),()=>calls++);
    const valid=approval?.actionDigest==='d'&&!approval.used;
    assert.equal(r.decision,valid?'ALLOW':'REQUIRE_APPROVAL');assert.equal(calls,valid?1:0);assert.equal(r.sourceReads.length,1);
  }
});
