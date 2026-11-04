import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { BUILTIN_PROFILES, evaluateActionWithProfile } from 'atp-profiles';

/**
 * Default mapping from Hermes tool names to ATP action categories. Filesystem
 * tools name the argument that carries their target path so the hook can scope it.
 */
export const DEFAULT_TOOLS = Object.freeze({
  read_file: Object.freeze({ category: 'filesystem', mode: 'read', pathArg: 'path' }),
  write_file: Object.freeze({ category: 'filesystem', mode: 'write', pathArg: 'path' }),
  patch: Object.freeze({ category: 'filesystem', mode: 'write', pathArg: 'path' }),
  terminal: Object.freeze({ category: 'shell' }),
});

const STATES = new Set(['planning', 'executing', 'communicating', 'completed']);
const CONFIG_KEYS = new Set(['$schema', 'profile', 'state', 'tools', 'paths', 'onApproval']);

export class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
  }
}

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const block = (message) => ({ action: 'block', message: `ATP: ${message}` });

function normalizeTool(name, spec) {
  if (!isObject(spec)) throw new ConfigError(`tools.${name} must be an object or null`);
  for (const key of Object.keys(spec)) {
    if (!['category', 'mode', 'pathArg'].includes(key)) throw new ConfigError(`tools.${name}: unknown key ${key}`);
  }
  if (typeof spec.category !== 'string' || spec.category === '') {
    throw new ConfigError(`tools.${name}.category must be a non-empty string`);
  }
  if (spec.category === 'filesystem') {
    if (spec.mode !== 'read' && spec.mode !== 'write') {
      throw new ConfigError(`tools.${name}.mode must be "read" or "write" for filesystem tools`);
    }
    if (typeof spec.pathArg !== 'string' || spec.pathArg === '') {
      throw new ConfigError(`tools.${name}.pathArg must name the argument that holds the path`);
    }
    return Object.freeze({ category: 'filesystem', mode: spec.mode, pathArg: spec.pathArg });
  }
  if (spec.mode !== undefined || spec.pathArg !== undefined) {
    throw new ConfigError(`tools.${name}: mode and pathArg apply only to filesystem tools`);
  }
  return Object.freeze({ category: spec.category });
}

function normalizeRoots(list, label, baseDir) {
  if (list === undefined) return Object.freeze([]);
  if (!Array.isArray(list)) throw new ConfigError(`paths.${label} must be an array of directories`);
  return Object.freeze(list.map((entry) => {
    if (typeof entry !== 'string' || entry === '') throw new ConfigError(`paths.${label} entries must be non-empty strings`);
    try {
      return realpathSync(resolve(baseDir, entry));
    } catch {
      throw new ConfigError(`paths.${label}: ${entry} does not exist`);
    }
  }));
}

/**
 * Validate a raw configuration object. Relative paths resolve against baseDir
 * (the configuration file's directory when loaded with loadConfig).
 */
export function normalizeConfig(raw, baseDir = process.cwd()) {
  if (!isObject(raw)) throw new ConfigError('configuration must be a JSON object');
  for (const key of Object.keys(raw)) {
    if (!CONFIG_KEYS.has(key)) throw new ConfigError(`unknown configuration key: ${key}`);
  }
  const profileName = raw.profile ?? 'safe-default';
  if (typeof profileName !== 'string' || !Object.hasOwn(BUILTIN_PROFILES, profileName)) {
    throw new ConfigError(`unknown profile: ${String(profileName)} (built-in: ${Object.keys(BUILTIN_PROFILES).join(', ')})`);
  }
  const state = raw.state ?? 'executing';
  if (!STATES.has(state)) throw new ConfigError(`state must be one of ${[...STATES].join(', ')}`);
  const onApproval = raw.onApproval ?? 'block';
  if (onApproval !== 'block' && onApproval !== 'escalate') {
    throw new ConfigError('onApproval must be "block" or "escalate"');
  }

  const tools = { ...DEFAULT_TOOLS };
  if (raw.tools !== undefined) {
    if (!isObject(raw.tools)) throw new ConfigError('tools must be an object');
    for (const [name, spec] of Object.entries(raw.tools)) {
      if (spec === null) delete tools[name];
      else tools[name] = normalizeTool(name, spec);
    }
  }

  if (raw.paths !== undefined && !isObject(raw.paths)) throw new ConfigError('paths must be an object');
  const paths = raw.paths ?? {};
  for (const key of Object.keys(paths)) {
    if (key !== 'read' && key !== 'write') throw new ConfigError(`paths: unknown key ${key}`);
  }

  return Object.freeze({
    profileName,
    profile: BUILTIN_PROFILES[profileName],
    state,
    onApproval,
    tools: Object.freeze(tools),
    roots: Object.freeze({
      read: normalizeRoots(paths.read, 'read', baseDir),
      write: normalizeRoots(paths.write, 'write', baseDir),
    }),
  });
}

/** Read and validate a JSON configuration file. Throws ConfigError on any problem. */
export function loadConfig(file) {
  if (typeof file !== 'string' || file === '') throw new ConfigError('no configuration file given');
  const path = resolve(file);
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new ConfigError(`cannot read ${path}: ${error.message}`);
  }
  return normalizeConfig(raw, dirname(path));
}

function within(root, target) {
  const rel = relative(root, target);
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

/** Resolve the real target of a path, following symlinks; new files resolve via their parent. */
function resolveTarget(requested, mode) {
  try {
    return realpathSync(requested);
  } catch (error) {
    if (mode !== 'write' || error.code !== 'ENOENT') return null;
  }
  // A write may create a new file, but never through a dangling symlink.
  try {
    lstatSync(requested);
    return null;
  } catch (error) {
    if (error.code !== 'ENOENT') return null;
  }
  try {
    return join(realpathSync(dirname(requested)), basename(requested));
  } catch {
    return null;
  }
}

function checkPath(config, name, spec, payload) {
  const input = payload.tool_input;
  const value = isObject(input) ? input[spec.pathArg] : undefined;
  if (typeof value !== 'string' || value === '') return `${name} has no ${spec.pathArg} argument`;
  if (!isAbsolute(value) && (typeof payload.cwd !== 'string' || !isAbsolute(payload.cwd))) {
    return `${name} has a relative path but no absolute working directory`;
  }
  const target = resolveTarget(resolve(isAbsolute(value) ? '/' : payload.cwd, value), spec.mode);
  if (target === null) return `${name} path cannot be resolved`;
  const roots = spec.mode === 'read' ? [...config.roots.read, ...config.roots.write] : config.roots.write;
  if (!roots.some((root) => within(root, target))) return `${name} path is outside the configured ${spec.mode} scope`;
  return null;
}

/**
 * Decide one Hermes pre_tool_call event. Returns the Hermes stdout directive:
 * {} to proceed, {action:"block", message} to block, or, when onApproval is
 * "escalate", {action:"approve", message, rule_key} for Hermes' approval gate.
 */
export function decide(config, payload) {
  if (!isObject(payload) || payload.hook_event_name !== 'pre_tool_call') return block('unrecognized hook event');
  const name = payload.tool_name;
  if (typeof name !== 'string' || !Object.hasOwn(config.tools, name)) {
    return block(`tool ${typeof name === 'string' ? name : '(missing)'} is not mapped to an ATP action`);
  }
  const spec = config.tools[name];
  const result = evaluateActionWithProfile(config.profile, { actionType: spec.category, state: config.state });
  if (result.decision !== 'allow' && result.decision !== 'require_approval') {
    return block(`${name} is denied by profile ${config.profileName} (${result.reason ?? 'denied'})`);
  }
  if (spec.category === 'filesystem') {
    const modes = config.profile.controls?.filesystem?.modes ?? [];
    if (!modes.includes(spec.mode)) {
      return block(`${name} needs filesystem ${spec.mode} access, which profile ${config.profileName} does not permit`);
    }
    const problem = checkPath(config, name, spec, payload);
    if (problem) return block(problem);
  }
  if (result.decision === 'require_approval') {
    if (config.onApproval === 'escalate') {
      return {
        action: 'approve',
        message: `ATP: ${name} requires approval under profile ${config.profileName} (${result.reason ?? 'approval required'})`,
        rule_key: `atp:${config.profileName}:${name}`,
      };
    }
    return block(`${name} requires approval under profile ${config.profileName}; approval escalation is disabled`);
  }
  if (result.allowed !== true) return block(`${name} was not allowed`);
  return {};
}

/** Convenience: bind a validated configuration to a decision function. */
export function createHook(config) {
  return (payload) => decide(config, payload);
}
