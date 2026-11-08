#!/usr/bin/env node
// Export the built-in profiles and evaluator decision vectors from the TypeScript
// implementation (the source of truth) for other-language ports.
//
//   node scripts/gen-conformance.mjs          write the files
//   node scripts/gen-conformance.mjs --check  fail if any committed file is stale
//
// Requires a build (npm run build). Only JSON-representable inputs are exported;
// ports keep their own unit tests for NaN, Infinity and other non-JSON values.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUILTIN_PROFILES, evaluateActionWithProfile } from '../dist/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = join(here, '..');
const repo = join(pkg, '..', '..');
const version = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8')).version;

const STATES = [undefined, 'planning', 'executing', 'communicating', 'completed', 'unknown'];
const ACTIONS = ['shell', 'filesystem', 'network', 'credentials', 'messaging', 'logs-read', 'external-messaging', 'unknown'];
const UNRECOGNIZED = ['Shell', 'shell_exec', 'exec', 'credential', 'rm -rf', 'constructor', '__proto__', 'toString'];

const vectors = [];
const add = (name, profileSpec, context) => {
  const profile = 'profileRef' in profileSpec ? BUILTIN_PROFILES[profileSpec.profileRef] : profileSpec.profile;
  vectors.push({ name, ...profileSpec, context, expected: evaluateActionWithProfile(profile, context) });
};
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

for (const id of Object.keys(BUILTIN_PROFILES))
  for (const state of STATES)
    for (const actionType of ACTIONS) {
      add(`builtin ${id} state=${state} action=${actionType}`, { profileRef: id }, clean({ state, actionType }));
      add(`builtin ${id} sessionState=${state} action=${actionType}`, { profileRef: id }, clean({ sessionState: state, actionType }));
    }

for (const id of Object.keys(BUILTIN_PROFILES))
  for (const actionType of UNRECOGNIZED)
    add(`unrecognized ${id} action=${actionType}`, { profileRef: id }, { actionType, state: 'executing' });

add('state takes precedence over sessionState', { profileRef: 'safe-default' }, { actionType: 'filesystem', state: 'planning', sessionState: 'executing' });
add('null state falls back to sessionState', { profileRef: 'safe-default' }, { actionType: 'filesystem', state: null, sessionState: 'planning' });

for (const unknown_action of ['require_approval', 'allow', 'deny', 'ALLOW', true, 1, null])
  add(`unknown_action=${JSON.stringify(unknown_action)}`, { profile: { ...BUILTIN_PROFILES['safe-default'], unknown_action } }, { actionType: 'exec' });

const permissive = { ...BUILTIN_PROFILES['dev-mode'], unknown_action: 'allow' };
for (const actionType of [null, '', 0, ['shell'], { shell: true }]) {
  add(`actionType=${JSON.stringify(actionType)} dev-mode`, { profileRef: 'dev-mode' }, { actionType });
  add(`actionType=${JSON.stringify(actionType)} permissive`, { profile: permissive }, { actionType });
}
add('actionType missing', { profileRef: 'dev-mode' }, {});

const trusted = { ...BUILTIN_PROFILES['dev-mode'], trust_requirements: { min_score: 0.7 } };
for (const trustScore of [undefined, null, '0.9', true, -1, 0, 0.6, 0.7, 1, 1.1])
  add(`trust min_score=0.7 trustScore=${JSON.stringify(trustScore)}`, { profile: trusted }, clean({ actionType: 'network', trustScore }));
for (const min_score of [-1, 0, 1, 2, '0.5', null])
  add(`trust min_score=${JSON.stringify(min_score)} trustScore=1`, { profile: { ...trusted, trust_requirements: { min_score } } }, { actionType: 'network', trustScore: 1 });

const mandated = { ...BUILTIN_PROFILES['dev-mode'], authority_requirements: { require_mandate: true } };
for (const mandateVerified of [undefined, false, 'true', 1, true])
  add(`mandate mandateVerified=${JSON.stringify(mandateVerified)}`, { profile: mandated }, clean({ actionType: 'network', mandateVerified }));
add('mandate not required', { profile: { ...mandated, authority_requirements: { require_mandate: false } } }, { actionType: 'network' });

for (const profile of [null, 0, '', 'safe-default', [], {}, { controls: null }, { controls: 'shell' }, { controls: [] }])
  add(`malformed profile ${JSON.stringify(profile)}`, { profile }, { actionType: 'filesystem', state: 'executing', trustScore: 1, mandateVerified: true });

const output = {
  [join(pkg, 'conformance', 'builtin-profiles.json')]: BUILTIN_PROFILES,
  [join(pkg, 'conformance', 'vectors.json')]: { generatedFrom: `atp-profiles@${version}`, count: vectors.length, vectors },
  [join(repo, 'packages', 'atp-profiles-python', 'src', 'atp_profiles', 'builtin_profiles.json')]: BUILTIN_PROFILES,
};

let stale = 0;
for (const [file, value] of Object.entries(output)) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  if (process.argv.includes('--check')) {
    let current = null;
    try { current = readFileSync(file, 'utf8'); } catch { /* missing */ }
    if (current !== text) { stale += 1; console.error(`stale: ${file}`); }
  } else {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text);
  }
}
if (stale) {
  console.error('Run `npm run build && node scripts/gen-conformance.mjs` in packages/atp-profiles.');
  process.exitCode = 1;
} else {
  console.log(`${process.argv.includes('--check') ? 'Up to date' : 'Wrote'}: ${vectors.length} vectors from atp-profiles@${version}`);
}
