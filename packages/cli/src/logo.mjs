// The ATP hat mark (the repaired logo used by create-atp-agent's onboarding:
// navy shield, agent with fedora, sunglasses and trench coat, red "ATP" badge)
// drawn as terminal pixel art. Two pixel rows share one text line using
// half-block characters; the badge's text band prints real letters.
//
// Legend: . transparent  N navy  C cream  R red  T badge text band
export const LOGO = Object.freeze([
  '..........NN..........',
  '........NNNNNN........',
  '.....NNNNCCCCNNNN.....',
  '..NNNNCCCCCCCCCCNNNN..',
  '.NNCCCCCCCNNCCCCCCCNN.',
  '.NCCCCCCCNNNNCCCCCCCN.',
  '.NCCCCCCNNNNNNCCCCCCN.',
  '.NCCCNNNNNNNNNNNNCCCN.',
  '.NCCCCCNCCCCCCNCCCCCN.',
  '.NCCCCCNNNNNNNNCCCCCN.',
  '.NCCCCCNNNCCNNNCCCCCN.',
  '.NCCCCCCNCCCCNCCCCCCN.',
  '.NCCCNNNNNCCNNNNNCCCN.',
  '.NCNNNNNNNCCNNNNNNNCN.',
  '.NNNNNNNNNCCNNNNNNNNN.',
  '.NNNNNNNRRRRRRNNNNNNN.',
  '.NNNNNNNTTTTTTNNNNNNN.',
  '..NNNNNNTTTTTTNNNNNN..',
  '..NNNNNNNRRRRNNNNNNN..',
  '...NNNNNNNRRNNNNNNN...',
  '....NNNNNNNNNNNNNN....',
  '.....NNNNNNNNNNNN.....',
  '.......NNNNNNNN.......',
  '.........NNNN.........',

]);

export const LOGO_WIDTH = LOGO[0].length;
const BADGE_TEXT = 'ATP';

// Colours sampled from atp-hat-mark-transparent.png; navy is lifted slightly so the
// outline stays visible on dark terminals.
const TRUE = { N: [16, 52, 92], C: [248, 240, 224], R: [216, 40, 8] };
const C256 = { N: 24, C: 230, R: 160 };

export function colorMode(env = process.env, stream = process.stdout) {
  if (env.NO_COLOR || !(env.FORCE_COLOR || stream.isTTY)) return null;
  if (/truecolor|24bit/i.test(env.COLORTERM ?? '')) return 'truecolor';
  return '256';
}

const fg = (mode, key) => (mode === 'truecolor' ? `38;2;${TRUE[key].join(';')}` : `38;5;${C256[key]}`);
const bg = (mode, key) => (mode === 'truecolor' ? `48;2;${TRUE[key].join(';')}` : `48;5;${C256[key]}`);
const sgr = (codes, text) => `\u001b[${codes.join(';')}m${text}\u001b[0m`;

/** Render the logo as LOGO.length / 2 lines of LOGO_WIDTH visible columns, or null without colour. */
export function renderLogo(mode = colorMode()) {
  if (!mode) return null;
  const lines = [];
  for (let y = 0; y < LOGO.length; y += 2) {
    const top = LOGO[y];
    const bottom = LOGO[y + 1] ?? '.'.repeat(LOGO_WIDTH);
    let line = '';
    let textIndex = 0;
    const band = [...top].filter((ch, i) => ch === 'T' || bottom[i] === 'T').length;
    const text = BADGE_TEXT.padStart(Math.floor((band + BADGE_TEXT.length) / 2)).padEnd(band);
    for (let x = 0; x < LOGO_WIDTH; x += 1) {
      const t = top[x];
      const b = bottom[x];
      if (t === 'T' || b === 'T') {
        const ch = text[textIndex] ?? ' ';
        textIndex += 1;
        line += sgr(['1', fg(mode, 'C'), bg(mode, 'R')], ch);
      } else if (t === '.' && b === '.') {
        line += ' ';
      } else if (t === '.') {
        line += sgr([fg(mode, b)], '▄');
      } else if (b === '.') {
        line += sgr([fg(mode, t)], '▀');
      } else if (t === b) {
        line += sgr([fg(mode, t)], '█');
      } else {
        line += sgr([fg(mode, t), bg(mode, b)], '▀');
      }
    }
    lines.push(line);
  }
  return lines;
}
