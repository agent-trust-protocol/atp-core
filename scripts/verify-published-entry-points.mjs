import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const consumer = mkdtempSync(join(tmpdir(), 'atp-entry-points-'));
const run = (command, args, cwd = consumer) => execFileSync(command, args, {
  cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 180_000,
});
let dashboard;
let dashboardOutput = '';
try {
  writeFileSync(join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  console.log(run('npm', ['install', '--ignore-scripts', 'atp-sdk@4.0.0', '@atpdeveloper/did-atp@0.1.1', 'create-atp-agent@1.4.0', 'atp-profiles@3.0.0']));
  console.log(run('npm', ['ls', '--depth=0']));
  writeFileSync(join(consumer, 'identity.mjs'), `
    import assert from 'node:assert/strict';
    import { Agent } from 'atp-sdk';
    import { atpE1Fingerprint, buildAtpV2Did } from '@atpdeveloper/did-atp';
    import { BUILTIN_PROFILES, evaluateActionWithProfile } from 'atp-profiles';
    const agent = await Agent.quickstart('EntryPointCheck');
    assert.equal(agent.isStandalone(), true);
    assert.match(agent.getDID(), /^did:atp:/);
    const ed = new Uint8Array(32);
    const pq = new Uint8Array(1952);
    assert.match(atpE1Fingerprint(ed), /^e1_/);
    assert.match(buildAtpV2Did('example.com', ['agent'], ed, pq), /^did:atp:example.com:agent:e1_/);
    console.log('PASS published SDK quickstart and scoped DID primitives');
    const profile = BUILTIN_PROFILES['safe-default'];
    const decisions = [
      { actionType: 'filesystem', sessionState: 'executing' },
      { actionType: 'shell', sessionState: 'executing' },
      { actionType: 'filesystem', sessionState: 'completed' }
    ].map(context => evaluateActionWithProfile(profile, { agentDid: agent.getDID(), trustScore: 0.8, ...context }).decision);
    assert.deepEqual(decisions, ['allow', 'require_approval', 'deny']);
    console.log('PASS published Profiles allow, approval-required and deny decisions');
    for (const actionType of ['Shell', 'exec', 'credential'])
      assert.deepEqual(evaluateActionWithProfile(BUILTIN_PROFILES['enterprise-locked'], { actionType, state: 'executing' }), { allowed: false, decision: 'deny', reason: 'unknown_action_type' });
    assert.deepEqual(evaluateActionWithProfile(BUILTIN_PROFILES['dev-mode'], { actionType: 'exec', state: 'executing' }), { allowed: false, decision: 'require_approval', reason: 'unknown_action_type' });
    for (const missing of [undefined, BUILTIN_PROFILES['typo'], BUILTIN_PROFILES['__proto__']])
      assert.deepEqual(evaluateActionWithProfile(missing, { actionType: 'filesystem' }), { allowed: false, decision: 'deny', reason: 'unknown_profile' });
    console.log('PASS published Profiles fail closed on unrecognized actions and missing profiles');
    const sdk = await import('atp-sdk');
    assert.equal(sdk.evaluateActionWithProfile, evaluateActionWithProfile);
    assert.equal(new sdk.ATPClient({ baseUrl: 'http://127.0.0.1:9' }).evaluateActionWithProfile({ profileId: 'typo', actionType: 'filesystem' }), 'deny');
    console.log('PASS published SDK exports the canonical evaluator and denies unknown profiles');
  `);
  console.log(run(process.execPath, ['identity.mjs']));

  const cli = join(consumer, 'node_modules/create-atp-agent/dist/index.js');
  console.log(run(process.execPath, [cli, 'entry-point-agent', '--no-dashboard', '--skip-install']));
  const project = join(consumer, 'entry-point-agent');
  console.log(run('npm', ['install', '--ignore-scripts'], project));
  const starterOutput = run('npm', ['start'], project);
  assert.match(starterOutput, /Standalone:\s*true/);
  console.log(starterOutput);
  console.log('PASS published CLI scaffold and generated agent');

  dashboard = spawn(process.execPath, [cli, '--dashboard-only', '--no-open'], {
    cwd: consumer, env: { ...process.env, CREATE_ATP_AGENT_NO_OPEN: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  dashboard.stdout.on('data', chunk => { dashboardOutput += chunk; });
  dashboard.stderr.on('data', chunk => { dashboardOutput += chunk; });
  let base;
  for (let attempt = 0; attempt < 100; attempt++) {
    base = dashboardOutput.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
    if (base) break;
    if (dashboard.exitCode !== null) throw new Error(`Dashboard exited: ${dashboardOutput}`);
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  assert.ok(base, `Dashboard did not announce its URL: ${dashboardOutput}`);
  const page = await fetch(base);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Onboard Agent/);
  const script = await fetch(`${base}/onboard.js`);
  assert.match(await script.text(), /atp-hat-mark-transparent\.png/);
  const logo = await fetch(`${base}/atp-hat-mark-transparent.png`);
  assert.equal(logo.status, 200);
  assert.equal(logo.headers.get('content-type'), 'image/png');
  const bytes = new Uint8Array(await logo.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(bytes.length > 1000);
  console.log('PASS published CLI onboarding page and repaired PNG asset');
} finally {
  if (dashboard && dashboard.exitCode === null) {
    dashboard.kill('SIGTERM');
    await new Promise(resolve => dashboard.once('exit', resolve));
  }
  rmSync(consumer, { recursive: true, force: true });
}
