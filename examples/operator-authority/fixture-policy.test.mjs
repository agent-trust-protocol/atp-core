import test from 'node:test';
import assert from 'node:assert/strict';
import {decide, protectedBoundary} from './fixture-policy.mjs';

const base=()=>({
  now:0,
  operator:{id:'operator-1',issuer:'issuer-1',active:true,canGrant:true},
  request:{agentDid:'did:atp:alice',action:'fixture.read',resource:'fixed-fixture',audience:'demo',actionDigest:'digest-1'},
  grant:{agentDid:'did:atp:alice',issuedBy:'operator-1',issuer:'issuer-1',issuerVerified:true,proofVerified:true,actions:['fixture.read'],resource:'fixed-fixture',audience:'demo',notBefore:0,expiresAt:120,requiresApproval:false},
  status:{available:true,checkedAt:0,revokedAt:null},
  requireLiveStatus:true
});
test('verified mandate permits exactly one bounded operation',()=>{
  const x=base();let calls=0;
  assert.equal(protectedBoundary(x,()=>calls++).decision,'ALLOW');
  assert.equal(calls,1);
});
test('positive peer trust claim cannot create operator authority',()=>{
  const x=base();x.request.peerTrustScore=1;x.grant=null;
  assert.equal(decide(x).decision,'DENY');
});
test('operator is inactive or unauthorized',()=>{
  for(const k of ['active','canGrant']){const x=base();x.operator[k]=false;assert.equal(decide(x).reason,'operator_not_authorized');}
});
test('stolen credential or substituted actor',()=>{
  const x=base();x.request.agentDid='did:atp:eve';
  assert.equal(decide(x).reason,'actor_mismatch');
});
test('unverified mandate proof and forged issuer',()=>{
  const x=base();x.grant.proofVerified=false;assert.equal(decide(x).reason,'mandate_unverified');
  const y=base();y.grant.issuedBy='operator-eve';assert.equal(decide(y).reason,'issuer_mismatch');
});
test('scope, audience, and expiry constraints',()=>{
  for(const k of ['action','resource','audience']){const x=base();x.request[k]='wrong';assert.equal(decide(x).reason,'out_of_scope');}
  const x=base();x.now=120;x.status.checkedAt=120;assert.equal(decide(x).reason,'mandate_expired');
});
test('approval is nonexecutable until exact action authorized',()=>{
  const x=base();x.grant.requiresApproval=true;let calls=0;
  assert.equal(protectedBoundary(x,()=>calls++).decision,'REQUIRE_APPROVAL');
  x.request.approval={actionDigest:'different',used:false};
  assert.equal(protectedBoundary(x,()=>calls++).decision,'REQUIRE_APPROVAL');
  x.request.approval={actionDigest:'digest-1',used:false};
  assert.equal(protectedBoundary(x,()=>calls++).decision,'REQUIRE_APPROVAL');
  x.request.approval={actionDigest:'digest-1',used:false,verifiedByTrustedOperator:true};
  assert.equal(protectedBoundary(x,()=>calls++).decision,'ALLOW');
  assert.equal(calls,1);
});
test('mid-lease revocation blocks each action-time check',()=>{
  for(const now of [30,60,119]){const x=base();x.now=now;x.status={available:true,checkedAt:now,revokedAt:10};let calls=0;
  assert.equal(protectedBoundary(x,()=>calls++).reason,'mandate_revoked');assert.equal(calls,0);}
});
test('unreachable or stale live status cannot authorize',()=>{
  for(const now of [30,60,119]){const x=base();x.now=now;x.status={available:false,checkedAt:0,revokedAt:null};
  assert.equal(decide(x).reason,'status_not_current');}
});
test('cached evidence cannot itself grant action authority',()=>{
  const x=base();x.now=119;x.status={available:false,checkedAt:0,revokedAt:null};
  assert.equal(decide(x).reason,'status_not_current');
});
