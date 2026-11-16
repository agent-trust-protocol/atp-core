import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { inspectAgentManifest, renderAgentPlan } from '../src/agent-inspection.mjs';
import { respond } from '../src/cli.mjs';

async function fixture(callback) {
  const dir=await mkdtemp(path.join(tmpdir(),'atp-agent-inspect-'));
  try { await callback(dir); } finally { await rm(dir,{recursive:true,force:true}); }
}
test('LangChain manifest is discovered without running scripts or granting authority', async () => {
  await fixture(async cwd => {
    await writeFile(path.join(cwd,'package.json'),JSON.stringify({
      name:'existing-agent',dependencies:{'langchain':'^1.0.0'},
      scripts:{start:'node never-execute.js'}
    }));
    const data=await inspectAgentManifest('.', {cwd});
    assert.deepEqual(data.possibleFrameworks,['LangChain JS']);
    assert.deepEqual(data.scripts,['start']);
    assert.equal(data.identityStatus,'not-verified');
    assert.equal(data.authorizationStatus,'not-granted');
    assert.match(renderAgentPlan(data),/NO code executed/);
    assert.match(renderAgentPlan(data),/Permissions: NOT GRANTED/);
  });
});
test('refuses parent directory and symlinked workspace escape', async()=>{
  await fixture(async cwd=>{
    await writeFile(path.join(cwd,'package.json'),'{}');
    await assert.rejects(inspectAgentManifest('../',{cwd}),/within the current workspace/);
    await symlink(tmpdir(),path.join(cwd,'outside'));
    await assert.rejects(inspectAgentManifest('outside',{cwd}),/Symlink escapes/);
  });
});
test('refuses symlinked manifest and oversized manifests',async()=>{
  await fixture(async cwd=>{
    await mkdir(path.join(cwd,'agent'));
    await writeFile(path.join(cwd,'package.json'),'{}');
    await symlink(path.join(cwd,'package.json'),path.join(cwd,'agent/package.json'));
    await assert.rejects(inspectAgentManifest('agent',{cwd}),/Symlinked package.json/);
    await writeFile(path.join(cwd,'package.json'),' '.repeat(100001));
    await assert.rejects(inspectAgentManifest('.',{cwd}),/smaller than 100 KB/);
  });
});
test('invalid manifest fails, and not-discovered is not a verified framework',async()=>{
  await fixture(async cwd=>{
    await writeFile(path.join(cwd,'package.json'),'{bad');
    await assert.rejects(inspectAgentManifest('.',{cwd}),/parse package.json/);
    await writeFile(path.join(cwd,'package.json'),'{"name":"vanilla-agent"}');
    const data=await inspectAgentManifest('.',{cwd});
    assert.deepEqual(data.possibleFrameworks,[]);
    assert.match(renderAgentPlan(data),/not identified/);
  });
});
test('handles untrusted package names without terminal control codes',async()=>{
  await fixture(async cwd=>{
    await writeFile(path.join(cwd,'package.json'),JSON.stringify({name:'safe\u001b[2J'}));
    assert.doesNotMatch(renderAgentPlan(await inspectAgentManifest('.',{cwd})),/\u001b/);
    assert.match(respond('/inspect'),/Usage:/);
  });
});
