// Interactive session, in the spirit of Claude Code: a welcome panel, slash
// commands with Tab completion, persistent history and a status line after
// every command.
import { createInterface } from 'node:readline';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { COMMANDS, VERSION, runCommand } from './commands.mjs';
import { describeIdentity } from './identity.mjs';
import { readEntries } from './audit.mjs';
import { loadSettings } from './settings.mjs';
import { ensureHome, paths } from './home.mjs';
import { box, c } from './ui.mjs';
import { tokenize } from './tokenize.mjs';
import { LOGO_WIDTH, colorMode, renderLogo } from './logo.mjs';

// Completion entries: each usage line without its [optional] and <required> parts.
const SLASH = [...new Set(COMMANDS.map(([usage]) => `/${usage.replace(/\[[^\]]*\]|<[^>]*>/g, ' ').split(/\s+/).filter((w) => w && !w.includes('|')).join(' ')}`)), '/exit', '/clear'];

export function completer(line) {
  const hits = SLASH.filter((s) => s.startsWith(line));
  return [hits.length ? hits : SLASH, line];
}

function statusLine(cwd) {
  try {
    const settings = loadSettings(cwd);
    const identity = describeIdentity();
    const entries = readEntries().length;
    return c.dim(`  ${settings.profile} · ${identity ? identity.did.split(':').slice(0, 4).join(':') : 'no identity'} · ${entries} audited`);
  } catch (error) {
    return c.red(`  settings error: ${error.message}`);
  }
}

/** Welcome screen: the ATP shield beside session details, or a text panel on narrow or colourless terminals. */
export function welcome(cwd, output = process.stdout, env = process.env) {
  let settings = null;
  try { settings = loadSettings(cwd); } catch { /* shown by the status line */ }
  let identity = null;
  try { identity = describeIdentity(); } catch { /* ignore */ }
  const details = [
    '',
    `${c.bold('Agent Trust Protocol™')}`,
    c.dim(`atp-cli v${VERSION} · the open trust layer for AI agents`),
    '',
    `${c.dim('cwd     ')} ${cwd}`,
    `${c.dim('profile ')} ${settings ? `${settings.profile} · ${settings.state}` : c.red('settings error')}`,
    `${c.dim('identity')} ${identity ? identity.did.split(':').slice(0, 4).join(':') : c.dim('none · /identity create')}`,
    '',
    `${c.dim('try')} /status · /guard install claude-code`,
    `${c.dim('   ')} /profile check Bash · /help`,
  ];
  const columns = output.columns ?? 80;
  const logo = columns >= LOGO_WIDTH + 40 ? renderLogo(colorMode(env, output)) : null;
  if (!logo) return box(details.filter((line, i) => i > 0), { title: 'ATP' });
  const rows = Math.max(logo.length, details.length);
  return Array.from({ length: rows }, (_, i) => `${logo[i] ?? ' '.repeat(LOGO_WIDTH)}   ${details[i] ?? ''}`.trimEnd()).join('\n');
}

function loadHistory() {
  try {
    return existsSync(paths.history()) ? readFileSync(paths.history(), 'utf8').split('\n').filter(Boolean).slice(-500).reverse() : [];
  } catch {
    return [];
  }
}

export async function runShell({ input = process.stdin, output = process.stdout, cwd = process.cwd() } = {}) {
  ensureHome();
  output.write(`${welcome(cwd, output)}\n${statusLine(cwd)}\n\n`);

  const rl = createInterface({ input, output, prompt: `${c.magenta('❯')} `, completer, history: loadHistory(), historySize: 500 });
  rl.prompt();
  for await (const raw of rl) {
    const line = raw.trim();
    if (!line) { rl.prompt(); continue; }
    try { appendFileSync(paths.history(), `${line}\n`, { mode: 0o600 }); } catch { /* history is best effort */ }
    if (line === '/exit' || line === '/quit' || line === 'exit') break;
    if (line === '/clear') { output.write('\u001b[2J\u001b[H'); rl.prompt(); continue; }
    if (!line.startsWith('/')) {
      output.write(`${c.dim('Commands start with /. Type /help to see them.')}\n\n`);
      rl.prompt();
      continue;
    }
    const tokens = tokenize(line.slice(1));
    if (tokens[0] === 'init' || (tokens[0] === 'guard' && tokens[1] === 'hook')) {
      output.write(`${c.dim('Run that one from your terminal: atp ' + tokens.join(' '))}\n\n`);
      rl.prompt();
      continue;
    }
    const result = await runCommand(tokens, { cwd });
    output.write(`${result.text}\n${statusLine(cwd)}\n\n`);
    rl.prompt();
  }
  rl.close();
  output.write(c.dim('bye\n'));
  return 0;
}
