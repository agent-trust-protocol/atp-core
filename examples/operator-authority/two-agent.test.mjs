import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync, sign, verify} from 'node:crypto';
// Hermetic research fixture. NOT ATP's normative wire format or production Guardian.
const keys=()=>generateKeyPairSync('ed25519');
const bytes=v=>Buffer.from(JSON.stringify(v));
const signed=(payload,key)=>({payload,signature:sign(null,bytes(payload),key).toString('base64url')});
const valid=(proof,key)=>Boolean(proof?.payload&&typeof proof.signature==='string'&&verify(null,bytes(proof.payload),key,Buffer.from(proof.signature,'base64url')));
function fixture(){
  const operator=keys(),agent=keys(),attacker=keys();
  const issuer='did:atp:operator',actor='did:atp:agent-a';
  const mandate={id:'grant-1',issuer,actor,audience:'service-b',resource:'read-demo',action:'fixture.read',notBefore:0,expiresAt:120};
  const signedMandate=signed(mandate,operator.privateKey),seen=new Set(),invoked=[];
  function execute({proof=signedMandate,requestProof,now=0,revokedAt=Infinity,statusAvailable=true,trustAgentKey=agent.publicKey}){
    const deny=reason=>({decision:'DENY',reason,executed:false});
    if(!valid(requestProof,trustAgentKey))return deny('agent_proof_invalid');
    const r=requestProof.payload;
    if(!r||!r.nonce||!r.actor||!r.audience||!r.resource||!r.action||!Number.isFinite(r.issuedAt))return deny('malformed_request');
    if(r.issuedAt!==now)return deny('request_not_current');
    if(!valid(proof,operator.publicKey))return deny('mandate_signature_invalid');
    const m=proof.payload;
    if(m.issuer!==issuer||m.actor!==actor||r.actor!==m.actor||r.audience!==m.audience||r.resource!==m.resource||r.action!==m.action)return deny('authority_mismatch');
    if(!Number.isFinite(now)||now<m.notBefore||now>=m.expiresAt)return deny('mandate_expired');
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
test('separate agent and operator keys authorize one protected execution',()=>{
 const f=fixture(),r=f.execute({requestProof:f.request()});assert.equal(r.decision,'ALLOW');assert.equal(f.invoked.length,1);
});
test('replayed valid signed request cannot execute again',()=>{
 const f=fixture(),requestProof=f.request();assert.equal(f.execute({requestProof}).decision,'ALLOW');
 assert.equal(f.execute({requestProof}).reason,'replay');assert.equal(f.invoked.length,1);
});
test('forged request signature cannot execute',()=>{
 const f=fixture();assert.equal(f.execute({requestProof:f.request('nonce-x',0,{},f.attacker.privateKey)}).reason,'agent_proof_invalid');
 assert.equal(f.invoked.length,0);
});
test('signed peer trust claim does not add authority',()=>{
 const f=fixture();assert.equal(f.execute({requestProof:f.request('nonce-x',0,{peerTrustScore:1,action:'fixture.delete'})}).reason,'authority_mismatch');
 assert.equal(f.invoked.length,0);
});
test('scope and audience mutation denied',()=>{
 for(const key of ['actor','audience','resource','action']){
 const f=fixture();assert.equal(f.execute({requestProof:f.request('nonce-x',0,{[key]:'invalid'})}).reason,'authority_mismatch');assert.equal(f.invoked.length,0);
 }
});
test('revoked authority denies at T=30, T=60, T=119',()=>{
 const f=fixture();for(const now of [30,60,119])assert.equal(f.execute({requestProof:f.request('nonce-'+now,now),now,revokedAt:10}).reason,'mandate_revoked');
 assert.equal(f.invoked.length,0);
});
test('status outage fails closed',()=>{
 const f=fixture();assert.equal(f.execute({requestProof:f.request(),statusAvailable:false}).reason,'status_unavailable');assert.equal(f.invoked.length,0);
});
test('mandate expiration fails closed',()=>{
 const f=fixture();assert.equal(f.execute({requestProof:f.request('nonce-e',120),now:120}).reason,'mandate_expired');assert.equal(f.invoked.length,0);
});
test('request freshness required at action boundary',()=>{
 const f=fixture();assert.equal(f.execute({requestProof:f.request('nonce-e',0),now:5}).reason,'request_not_current');assert.equal(f.invoked.length,0);
});
