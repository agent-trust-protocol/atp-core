import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtureKeys as keys, issueFixtureMandate as signed } from './signed-mandate.mjs';
import { CryptoUtils } from '../../packages/sdk/src/utils/crypto.ts';
// Hermetic research fixture. NOT ATP's normative wire format or production Guardian.
const valid=async(proof,key)=>Boolean(proof?.payload && typeof proof.signature==='string' && /^[A-Za-z0-9_-]{86}$/.test(proof.signature) && await CryptoUtils.verifyEd25519(Buffer.from(JSON.stringify(proof.payload)),Buffer.from(proof.signature,'base64url'),key));
async function fixture(){
  const operator=await keys(),agent=await keys(),attacker=await keys();
  const issuer='did:atp:operator',actor='did:atp:agent-a';
  const mandate={id:'grant-1',issuer,actor,audience:'service-b',resource:'read-demo',action:'fixture.read',notBefore:0,expiresAt:120};
  const signedMandate=await signed(mandate,operator.privateKey),seen=new Set(),invoked=[];
  async function execute({proof=signedMandate,requestProof,now=0,revokedAt=Infinity,statusAvailable=true,trustAgentKey=agent.publicKey}){
    const deny=reason=>({decision:'DENY',reason,executed:false});
    if(!await valid(requestProof,trustAgentKey))return deny('agent_proof_invalid');
    const r=requestProof.payload;
    if(!r||!r.nonce||!r.actor||!r.audience||!r.resource||!r.action||!Number.isFinite(r.issuedAt))return deny('malformed_request');
    if(r.issuedAt!==now)return deny('request_not_current');
    if(!await valid(proof,operator.publicKey))return deny('mandate_signature_invalid');
    const m=proof.payload;
    if(m.issuer!==issuer||m.actor!==actor||r.actor!==m.actor||r.audience!==m.audience||r.resource!==m.resource||r.action!==m.action)return deny('authority_mismatch');
    if(![now,m.notBefore,m.expiresAt].every(Number.isFinite)||m.notBefore>=m.expiresAt||now<m.notBefore||now>=m.expiresAt)return deny('mandate_expired');
    if(!statusAvailable)return deny('status_unavailable');
    if(now>=revokedAt)return deny('mandate_revoked');
    const nonceKey=r.actor+':'+r.nonce;
    if(seen.has(nonceKey))return deny('replay');
    seen.add(nonceKey);
    invoked.push({action:r.action,resource:r.resource});
    return {decision:'ALLOW',reason:'authorized',executed:true};
  }
  const request=(nonce='nonce-1',now=0,changes={},key=agent.privateKey)=>signed({actor,audience:'service-b',resource:'read-demo',action:'fixture.read',nonce,issuedAt:now,...changes},key);
  return {execute,request,operator,agent,attacker,signedMandate,invoked};
}
test('separate agent and operator keys authorize one protected execution',async()=>{
 const f=await fixture(),r=(await f.execute({requestProof:(await f.request())}));assert.equal(r.decision,'ALLOW');assert.equal(f.invoked.length,1);
});
test('replayed valid signed request cannot execute again',async()=>{
 const f=await fixture(),requestProof=await f.request();assert.equal((await f.execute({requestProof})).decision,'ALLOW');
 assert.equal((await f.execute({requestProof})).reason,'replay');assert.equal(f.invoked.length,1);
});
test('forged request signature cannot execute',async()=>{
 const f=await fixture();assert.equal((await f.execute({requestProof:(await f.request('nonce-x',0,{},f.attacker.privateKey))})).reason,'agent_proof_invalid');
 assert.equal(f.invoked.length,0);
});
test('signed peer trust claim does not add authority',async()=>{
 const f=await fixture();assert.equal((await f.execute({requestProof:(await f.request('nonce-x',0,{peerTrustScore:1,action:'fixture.delete'}))})).reason,'authority_mismatch');
 assert.equal(f.invoked.length,0);
});
test('scope and audience mutation denied',async()=>{
 for(const key of ['actor','audience','resource','action']){
 const f=await fixture();assert.equal((await f.execute({requestProof:(await f.request('nonce-x',0,{[key]:'invalid'}))})).reason,'authority_mismatch');assert.equal(f.invoked.length,0);
 }
});
test('revoked authority denies at T=30, T=60, T=119',async()=>{
 const f=await fixture();for(const now of [30,60,119])assert.equal((await f.execute({requestProof:(await f.request('nonce-'+now,now)),now,revokedAt:10})).reason,'mandate_revoked');
 assert.equal(f.invoked.length,0);
});
test('status outage fails closed',async()=>{
 const f=await fixture();assert.equal((await f.execute({requestProof:(await f.request()),statusAvailable:false})).reason,'status_unavailable');assert.equal(f.invoked.length,0);
});
test('mandate expiration fails closed',async()=>{
 const f=await fixture();assert.equal((await f.execute({requestProof:(await f.request('nonce-e',120)),now:120})).reason,'mandate_expired');assert.equal(f.invoked.length,0);
});
test('request freshness required at action boundary',async()=>{
 const f=await fixture();assert.equal((await f.execute({requestProof:(await f.request('nonce-e',0)),now:5})).reason,'request_not_current');assert.equal(f.invoked.length,0);
});

test('signed mandate with missing validity bounds cannot execute', async () => {
  for (const field of ['notBefore', 'expiresAt']) {
    const f = await fixture();
    const payload = { ...f.signedMandate.payload };
    delete payload[field];
    const proof = await signed(payload, f.operator.privateKey);
    const result = await f.execute({ proof, requestProof: await f.request() });
    assert.equal(result.reason, 'mandate_expired');
    assert.equal(f.invoked.length, 0);
  }
});
