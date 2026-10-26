import test from 'node:test';
import assert from 'node:assert/strict';
import {fixtureKeys, issueFixtureMandate, verifyFixtureMandate} from './signed-mandate.mjs';
const issuer = await fixtureKeys();
const another = await fixtureKeys();
const issuerId='did:atp:operator-fixture';
const trust = new Map([[issuerId, issuer.publicKey]]);
const request = {agentDid:'did:atp:agent-a',audience:'service-a',resource:'fixed-fixture',action:'fixture.read'};
const payload = {id:'grant-1',issuer:issuerId,agentDid:request.agentDid,audience:request.audience,resource:request.resource,actions:[request.action],notBefore:0,expiresAt:120};
async function evaluate(opts={}) {return verifyFixtureMandate({signedMandate:await issueFixtureMandate(payload,issuer.privateKey),expectedIssuer:issuerId,trustedIssuers:trust,request,now:30,status:{available:true,checkedAt:30,revokedIds:new Set()},...opts});}
test('valid signed bounded mandate',async()=>assert.equal((await evaluate()).decision,'ALLOW'));
test('tampered payload invalidates signature',async()=> {const signedMandate=await issueFixtureMandate(payload,issuer.privateKey);signedMandate.payload={...payload,resource:'other'};assert.equal((await evaluate({signedMandate})).reason,'signature_invalid');});
test('signature from untrusted actor is rejected',async()=>assert.equal((await evaluate({signedMandate:await issueFixtureMandate(payload,another.privateKey)})).reason,'signature_invalid'));
test('untrusted issuer is rejected',async()=>assert.equal((await evaluate({trustedIssuers:new Map()})).reason,'issuer_untrusted'));
test('unexpected issuer is rejected',async()=>assert.equal((await evaluate({expectedIssuer:'did:atp:unknown'})).reason,'issuer_not_expected'));
test('expired grant denied',async()=>assert.equal((await evaluate({now:120})).reason,'mandate_expired'));
test('future grant denied',async()=>assert.equal((await evaluate({now:-1})).reason,'mandate_expired'));
test('wrong audience, resource, action or agent denied',async()=> {for(const key of ['agentDid','audience','resource','action'])assert.equal((await evaluate({request:{...request,[key]:'other'}})).reason,'scope_mismatch');});
test('mid-lease revocation denies at 30,60,119',async()=> {for(const now of [30,60,119])assert.equal((await evaluate({now,status:{available:true,checkedAt:now,revokedIds:new Set(['grant-1'])}})).reason,'mandate_revoked');});
test('unavailable or stale revocation status denies',async()=> {assert.equal((await evaluate({status:null})).reason,'status_unavailable'); assert.equal((await evaluate({status:{available:true,checkedAt:0,revokedIds:new Set()}})).reason,'status_unavailable');});

test('missing scope fields on both grant and request fail closed',async()=>{
  for(const key of ['agentDid','audience','resource']){
    const incomplete={...payload};delete incomplete[key];
    const incompleteRequest={...request};delete incompleteRequest[key];
    assert.equal((await evaluate({signedMandate:await issueFixtureMandate(incomplete,issuer.privateKey),request:incompleteRequest})).reason,'scope_mismatch');
  }
});

test('malformed signature encoding fails closed without throwing', async () => {
  const signedMandate = await issueFixtureMandate(payload, issuer.privateKey);
  for (const signature of ['', '!', signedMandate.signature + '!', 'a'.repeat(86)]) {
    assert.equal((await evaluate({ signedMandate: { ...signedMandate, signature } })).reason, 'signature_invalid');
  }
});
