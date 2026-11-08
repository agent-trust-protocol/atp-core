// Split a command line into tokens, honouring single and double quotes.
export function tokenize(line) {
  const tokens = [];
  let current = '';
  let quote = null;
  let started = false;
  for (const ch of String(line)) {
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      started = true;
    } else if (/\s/.test(ch)) {
      if (started || current) tokens.push(current);
      current = '';
      started = false;
    } else {
      current += ch;
      started = true;
    }
  }
  if (quote) throw new Error('unterminated quote');
  if (started || current) tokens.push(current);
  return tokens;
}
