// Voluntary, local-only counters. No network transport or persistent identifier.
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const EVENTS = ['install', 'first_run', 'example_completion', 'error', 'run_success'];
export function recordDiagnostic(event, env = process.env, now = new Date()) {
  if (env.ATP_DIAGNOSTICS !== '1') return false;
  if (!EVENTS.includes(event)) return false;
  try {
    const dir = join(env.ATP_DIAGNOSTICS_DIR || join(homedir(), '.atp'), 'diagnostics');
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    const file = join(dir, 'events.jsonl');
    const cutoff = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
    let rows = [];
    try { rows = readFileSync(file, 'utf8').split('\n').filter(Boolean).map(JSON.parse); } catch {}
    // Keep only the fixed schema, even if the file was manually edited.
    rows = rows.filter(r => EVENTS.includes(r.event) && /^\d{4}-\d{2}-\d{2}$/.test(r.day) && r.day >= cutoff)
      .map(r => ({ day: r.day, event: r.event }));
    writeFileSync(file, rows.map(r => JSON.stringify(r) + '\n').join(''), { mode: 0o600 });
    const day = now.toISOString().slice(0, 10);
    if (event === 'first_run') {
      if (!rows.some(r => r.event === 'first_run')) appendFileSync(file, JSON.stringify({ day, event }) + '\n');
      appendFileSync(file, JSON.stringify({ day, event: 'run_success' }) + '\n');
    } else appendFileSync(file, JSON.stringify({ day, event }) + '\n');
    return true;
  } catch { return false; } // Diagnostics must never break an agent.
}
