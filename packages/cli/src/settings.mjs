// Layered settings, like Claude Code: user (~/.atp/settings.json) then project
// (<cwd>/.atp/settings.json). Later layers override earlier ones key by key.
import { join } from 'node:path';
import { BUILTIN_PROFILES } from 'atp-profiles';
import { ensureHome, paths, readJson, writeJson } from './home.mjs';

export const DEFAULTS = Object.freeze({
  profile: 'safe-default',
  state: 'executing',
  tools: {},
});

const STATES = new Set(['planning', 'executing', 'communicating', 'completed']);

export class SettingsError extends Error {}

export function settingsLayers(cwd = process.cwd()) {
  return [
    { scope: 'user', file: paths.settings() },
    { scope: 'project', file: join(cwd, '.atp', 'settings.json') },
  ];
}

export function loadSettings(cwd = process.cwd()) {
  const merged = { ...DEFAULTS, tools: { ...DEFAULTS.tools } };
  const sources = [];
  for (const layer of settingsLayers(cwd)) {
    let value;
    try {
      value = readJson(layer.file);
    } catch (error) {
      throw new SettingsError(`${layer.file}: ${error.message}`);
    }
    if (value === undefined) continue;
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new SettingsError(`${layer.file}: must be a JSON object`);
    sources.push(layer.file);
    if (value.profile !== undefined) merged.profile = value.profile;
    if (value.state !== undefined) merged.state = value.state;
    if (value.tools !== undefined) {
      if (!value.tools || typeof value.tools !== 'object' || Array.isArray(value.tools)) throw new SettingsError(`${layer.file}: tools must be an object`);
      Object.assign(merged.tools, value.tools);
    }
  }
  if (typeof merged.profile !== 'string' || !Object.hasOwn(BUILTIN_PROFILES, merged.profile)) {
    throw new SettingsError(`unknown profile "${merged.profile}" (built-in: ${Object.keys(BUILTIN_PROFILES).join(', ')})`);
  }
  if (!STATES.has(merged.state)) throw new SettingsError(`state must be one of ${[...STATES].join(', ')}`);
  for (const [tool, category] of Object.entries(merged.tools)) {
    if (category !== null && (typeof category !== 'string' || category === '')) {
      throw new SettingsError(`tools.${tool} must be an ATP category string or null`);
    }
  }
  return { ...merged, sources };
}

/** Set the profile in the user settings layer (~/.atp/settings.json), preserving other keys. */
export function setUserProfile(profile) {
  if (typeof profile !== 'string' || !Object.hasOwn(BUILTIN_PROFILES, profile)) {
    throw new SettingsError(`unknown profile "${profile}" (built-in: ${Object.keys(BUILTIN_PROFILES).join(', ')})`);
  }
  ensureHome();
  const current = readJson(paths.settings(), {});
  writeJson(paths.settings(), { ...current, profile });
}
