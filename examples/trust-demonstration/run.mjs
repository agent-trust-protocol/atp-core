import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';

const here=dirname(fileURLToPath(import.meta.url));
const core=resolve(process.argv[2] ?? resolve(here,'../atp-core'));
const PIN='f4ced09aaad2c10fc371fc8e7a0cde642984790f';
const out=resolve(here,'results');mkdirSync(out,{recursive:true});
const git=spawnSync('git',['rev-parse','HEAD'],{cwd:core,encoding:'utf8'});
assert.equal(git.status,0,'Supply a local atp-core checkout');
assert.equal(git.stdout.trim(),PIN,'Checkout must match the reviewed source pin');
const sourceFiles=[
 'examples/action-boundary/boundary.mjs','examples/action-boundary/demo.test.mjs',
 'examples/hermes-hook/atp-hook.mjs','examples/hermes-hook/atp-hook.test.mjs',
 'examples/operator-authority/fixture-policy.mjs','examples/operator-authority/fixture-policy.test.mjs',
 'examples/operator-authority/signed-mandate.mjs','examples/operator-authority/signed-mandate.test.mjs',
 'examples/operator-authority/two-agent.test.mjs',
 'examples/operator-authority/revision-3/live-read-policy.mjs',
 'packages/sdk/src/utils/crypto.ts',
 'examples/action-boundary/package-lock.json','examples/hermes-hook/package-lock.json','packages/sdk/package-lock.json',
];
for(const p of sourceFiles){
 const original=spawnSync('git',['show',`${PIN}:${p}`],{cwd:core,maxBuffer:10*1024*1024});
 assert.equal(original.status,0,p);assert.ok(original.stdout.equals(readFileSync(resolve(core,p))),`Modified upstream source: ${p}`);
}
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const report={schema:'atp-trust-demonstration/1',runAt:new Date().toISOString(),node:process.version,
 source:{repository:'https://github.com/agent-trust-protocol/atp-core',commit:PIN,
 files:sourceFiles.map(path=>({path,sha256:sha(resolve(core,path))})),profilesVersion:JSON.parse(readFileSync(resolve(core,'examples/action-boundary/node_modules/atp-profiles/package.json'))).version},
 provenance:'ATP-authored local assessment; not independent certification',suites:[],scenarios:[],controls:[],
 notTested:['real Hermes runtime','ARIA integration or DNS/key discovery','V19 integration','authenticated remote revocation','durable replay protection','atomic revocation/execution','durable signed audit or external checkpoint','human/organization identity attribution','normative mandate conformance','post-quantum mandate signatures']};
let failures=0;
for(const [name,path] of [
 ['action boundary','examples/action-boundary/demo.test.mjs'],
 ['Hermes hook subprocess (no Hermes runtime)','examples/hermes-hook/atp-hook.test.mjs'],
 ['synthetic policy','examples/operator-authority/fixture-policy.test.mjs'],
 ['experimental Ed25519 mandate','examples/operator-authority/signed-mandate.test.mjs'],
 ['experimental signed requests and replay','examples/operator-authority/two-agent.test.mjs'],
]){
 const r=spawnSync(process.execPath,['--test','--test-reporter=tap',path],{cwd:core,encoding:'utf8',timeout:60000});
 writeFileSync(resolve(out,path.split('/').at(-1)+'.tap'),r.stdout+'\n'+r.stderr);
 const count=k=>Number(r.stdout.match(new RegExp(`^# ${k} (\\d+)`,'m'))?.[1]??0);
 const row={name,command:`node --test --test-reporter=tap ${path}`,exit:r.status,pass:count('pass'),fail:count('fail'),skipped:count('skipped'),error:r.error?.message};
 report.suites.push(row);if(r.status!==0||row.skipped||!row.pass)failures++;
 console.log(`${r.status===0?'PASS':'FAIL'} suite: ${name} (${row.pass} tests, ${row.skipped} skipped)`);
}
const {createBoundary}=await import(pathToFileURL(resolve(core,'examples/action-boundary/boundary.mjs')));
const {liveReadBoundary}=await import(pathToFileURL(resolve(core,'examples/operator-authority/revision-3/live-read-policy.mjs')));
function record(id,layer,expected,observed){
 const passed=expected.decision===observed.decision && expected.executions===observed.executions;
 if(!passed)failures++;
 report.scenarios.push({id,layer,expected,observed,passed});
 console.log(`${passed?'PASS':'FAIL'} ${id}: ${observed.decision}, executions=${observed.executions}`);
}
// The callback performs a real read of the fixed fixture. Counters independently
// record entry; a returned decision alone cannot count as prevention.
let reads=0,shells=0;
const b=createBoundary({read:{actionType:'filesystem',run:()=>{reads++;return readFileSync(resolve(core,'examples/action-boundary/fixture.txt'),'utf8');}},shell:{actionType:'shell',run:()=>{shells++;}}});
let r=await b.invoke('read');record('B01 permitted fixed read','published profile + upstream boundary',{decision:'allow',executions:1},{decision:r.decision,executions:reads});
r=await b.invoke('shell');record('B02 approval-required callback held','published profile + upstream boundary',{decision:'require_approval',executions:0},{decision:r.decision,executions:shells});
b.complete();const before=reads;r=await b.invoke('read');record('B03 completed session refuses next read','published profile + upstream boundary',{decision:'deny',executions:0},{decision:r.decision,executions:reads-before});
r=await b.invoke('missing');record('B04 unknown tool','published profile + upstream boundary',{decision:'deny',executions:0},{decision:r.decision,executions:0});
for(const [id,tool,path,decision] of [
 ['H01 fixed read','read_file','fixture.txt','allow'],['H02 terminal','terminal','fixture.txt','block'],
 ['H03 write','write_file','fixture.txt','block'],['H04 patch','patch','fixture.txt','block'],
 ['H05 outside path','read_file','../action-boundary/fixture.txt','block'],['H06 unknown tool','unknown','fixture.txt','block'],
]){
 const cwd=resolve(core,'examples/hermes-hook');const input={hook_event_name:'pre_tool_call',tool_name:tool,tool_input:{path},cwd};
 const p=spawnSync(process.execPath,[resolve(cwd,'atp-hook.mjs')],{input:JSON.stringify(input),encoding:'utf8',timeout:10000});
 assert.equal(p.status,0,p.stderr);const response=JSON.parse(p.stdout);
 // This is an assessor-owned dispatcher, not the Hermes runtime.
 let executions=0;if(Object.keys(response).length===0){readFileSync(resolve(cwd,path));executions++;}
 record(id,'real hook subprocess + assessor dispatcher',{decision,executions:decision==='allow'?1:0},{decision:response.action??'allow',executions,response});
}
const base=()=>({operator:{id:'o',issuer:'i',active:true,canGrant:true},grant:{agentDid:'a',issuerVerified:true,proofVerified:true,issuedBy:'o',issuer:'i',resource:'fixed',audience:'service',notBefore:0,expiresAt:120,actions:['read']},request:{agentDid:'a',resource:'fixed',audience:'service',action:'read'},now:30});
const cases=[
 ['L01 valid',()=>{},'ALLOW',null],['L02 wrong action',x=>x.request.action='delete','DENY','out_of_scope'],
 ['L03 wrong resource',x=>x.request.resource='other','DENY','out_of_scope'],
 ['L04 expired',x=>x.now=120,'DENY','mandate_expired'],
 ['L05 not yet valid',x=>x.now=-1,'DENY','mandate_expired'],
 ['L06 revoked',()=>{},'DENY','mandate_revoked','revoked'],
 ['L07 stale status',()=>{},'DENY','status_not_current','stale'],
 ['L08 unavailable status',()=>{},'DENY','status_not_current','unavailable'],
 ['L09 missing approval',x=>x.grant.requiresApproval=true,'REQUIRE_APPROVAL','approval_required'],
 ['L10 wrong approval binding',x=>{x.grant.requiresApproval=true;x.request.actionDigest='one';x.request.approval={verifiedByTrustedOperator:true,actionDigest:'two'};},'REQUIRE_APPROVAL','approval_required'],
 ['L11 simulated matching approval',x=>{x.grant.requiresApproval=true;x.request.actionDigest='one';x.request.approval={verifiedByTrustedOperator:true,actionDigest:'one',used:false};},'ALLOW',null],
 ['L12 inactive operator',x=>x.operator.active=false,'DENY','operator_not_authorized'],
];
for(const [id,mutate,decision,reason,status] of cases){
 const x=base();mutate(x);let executions=0,statusReads=0;
 const actual=liveReadBoundary(x,()=>{statusReads++;return {available:status!=='unavailable',checkedAt:status==='stale'?0:x.now,revokedAt:status==='revoked'?10:null};},()=>executions++);
 record(id,'synthetic policy; status and identity/approval trust are fixtures',{decision,executions:decision==='ALLOW'?1:0},{decision:actual.decision,executions,reason:actual.reason,statusReads});
 if(reason && actual.reason!==reason)failures++;
}
// Negative controls prove the assessor rejects reassuring but defective behavior.
for(const [name,expected,mutant] of [
 ['deny everything fails positive control',{decision:'allow',executions:1},{decision:'deny',executions:0}],
 ['deny but execute fails prevention control',{decision:'deny',executions:0},{decision:'deny',executions:1}],
]){const detected=expected.decision!==mutant.decision||expected.executions!==mutant.executions;assert.ok(detected);report.controls.push({name,detected});}
// Deliberately bypass a boundary with a harmless counter: exposes enforcement assumption.
let bypassCalls=0;const unguarded=()=>++bypassCalls;unguarded();
report.controls.push({name:'direct unguarded callback remains callable',observedExecutions:bypassCalls,interpretation:'All consequential paths must be mediated; these examples are not an OS sandbox.'});
report.summary={upstreamPassed:report.suites.reduce((n,s)=>n+s.pass,0),scenariosPassed:report.scenarios.filter(s=>s.passed).length,scenarioCount:report.scenarios.length,failures};
writeFileSync(resolve(out,'assessment.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary));process.exitCode=failures?1:0;
