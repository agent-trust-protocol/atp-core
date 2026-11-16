import { lstat, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';

const MATCH = Object.freeze([
  { name: 'LangChain JS', keys: ['langchain', '@langchain/core', '@langchain/langgraph'] },
  { name: 'CrewAI JS integration', keys: ['crewai'] },
  { name: 'OpenAI Agents SDK', keys: ['@openai/agents'] }
]);
const clean = (s, max=150) => String(s).replace(/[\x00-\x1f\x7f-\x9f]/g,' ').slice(0,max);
const isObject = v => !!v && typeof v === 'object' && !Array.isArray(v);

export async function inspectAgentManifest(input='.', { cwd=process.cwd() }={}) {
  if (typeof input !== 'string' || !input || input.includes('\0')) throw new Error('Invalid local agent directory.');
  const root = await realpath(cwd);
  const chosen = path.resolve(root, input);
  const relative = path.relative(root, chosen);
  if (relative === '..' || relative.startsWith('..'+path.sep) || path.isAbsolute(relative))
    throw new Error('Agent directory must be within the current workspace.');
  const project = await realpath(chosen);
  if (project !== root && !project.startsWith(root + path.sep)) throw new Error('Symlink escapes the workspace.');
  const manifest = path.join(project,'package.json');
  if ((await lstat(manifest)).isSymbolicLink()) throw new Error('Symlinked package.json is not supported.');
  const stat = await lstat(manifest);
  if (!stat.isFile() || stat.size > 100_000) throw new Error('Expected a regular package.json smaller than 100 KB.');
  let pkg;
  try { pkg=JSON.parse(await readFile(manifest,'utf8')); }
  catch { throw new Error('Could not parse package.json safely.'); }
  if (!isObject(pkg)) throw new Error('package.json must contain an object.');
  const deps = {...(isObject(pkg.dependencies)?pkg.dependencies:{}),...(isObject(pkg.devDependencies)?pkg.devDependencies:{})};
  const declared = Object.keys(deps).filter(x=>/^[\w@/.-]{1,120}$/.test(x)).sort();
  const matches = MATCH.filter(x=>x.keys.some(k=>declared.includes(k))).map(x=>x.name);
  return {
    project: typeof pkg.name==='string' ? clean(pkg.name,100) : 'unnamed',
    directory: relative || '.',
    declaredPackages: declared.slice(0,60),
    possibleFrameworks: matches,
    scripts: isObject(pkg.scripts) ? Object.keys(pkg.scripts).map(x=>clean(x,40)).slice(0,20) : [],
    capabilityStatus: 'unknown',
    identityStatus: 'not-verified',
    pairingStatus: 'not-started',
    authorizationStatus: 'not-granted'
  };
}
export function renderAgentPlan(manifest) {
  return [
    'ATP existing-agent inspection (manifest only; NO code executed)',
    'Project: ' + manifest.project,
    'Path: ' + manifest.directory,
    'Possible framework(s): ' + (manifest.possibleFrameworks.join(', ') || 'not identified'),
    'Declared script names: ' + (manifest.scripts.join(', ') || 'none'),
    'Tool capabilities: UNKNOWN — package dependencies do not establish runtime tools',
    'ATP identity: NOT VERIFIED | Pairing: NOT STARTED | Permissions: NOT GRANTED',
    'Next: inspect runtime tool manifest under operator supervision; establish a pending agent in Studio; obtain signed runtime key-control proof; review the exact requested scopes; require human approval; test Guardian ALLOW/DENY and revocation.',
    'No keys created, pairing tokens issued, network requests sent, files modified, or authorization granted.'
  ].join('\n');
}
