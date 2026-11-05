// Minimal terminal styling. Colours only on a TTY and never when NO_COLOR is set.
const enabled = () => !process.env.NO_COLOR && (process.env.FORCE_COLOR || process.stdout.isTTY);
const wrap = (open, close) => (text) => (enabled() ? `\u001b[${open}m${text}\u001b[${close}m` : String(text));

export const c = {
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  red: wrap(31, 39),
  green: wrap(32, 39),
  yellow: wrap(33, 39),
  cyan: wrap(36, 39),
  magenta: wrap(35, 39),
};

const strip = (text) => String(text).replace(/\u001b\[[0-9;]*m/g, '');

/** A rounded box, like the Claude Code welcome panel. */
export function box(lines, { title = '' } = {}) {
  const width = Math.max(title.length + 2, ...lines.map((l) => strip(l).length)) + 2;
  const top = `╭─${title ? ` ${c.bold(title)} ` : ''}${'─'.repeat(Math.max(0, width - (title ? title.length + 3 : 1)))}╮`;
  const body = lines.map((l) => `│ ${l}${' '.repeat(width - strip(l).length - 1)}│`);
  return [top, ...body, `╰${'─'.repeat(width)}╯`].join('\n');
}

export function decisionBadge(decision) {
  if (decision === 'allow') return c.green('● allow');
  if (decision === 'require_approval') return c.yellow('● ask');
  return c.red('● deny');
}

export function kv(pairs) {
  const width = Math.max(...pairs.map(([k]) => k.length));
  return pairs.map(([k, v]) => `${c.dim(k.padEnd(width))}  ${v}`).join('\n');
}
