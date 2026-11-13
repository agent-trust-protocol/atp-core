// Deterministic, non-executing router for the ATP developer preview.
// No user input is evaluated as JavaScript, shell commands, or network requests.
const patterns = Object.freeze([
  { id: 'agents', re: /\b(agent|agents|fleet|langchain|crewai|openclaw)\b/i, label: 'Inspect agents' },
  { id: 'guardian', re: /\b(guardian|policy|policies|denied|deny|allowed|allow)\b/i, label: 'Inspect Guardian decisions' },
  { id: 'mandates', re: /\b(mandate|mandates|delegation|delegate|permission|authorization|authorize|revoke)\b/i, label: 'Inspect mandates' },
  { id: 'audit', re: /\b(audit|receipt|evidence|history|trace)\b/i, label: 'Inspect audit evidence' },
  { id: 'connect', re: /\b(connect|pair|enroll|onboard|integrate|adapter|protocol)\b/i, label: 'Plan agent integration' }
]);
const mutating = /\b(create|update|delete|remove|revoke|approve|grant|execute|deploy|publish|mint|sign|enable|disable|change|register|issue|install|run|connect|pair|enroll|onboard)\b/i;

export function planInput(value) {
  const input = String(value ?? '').trim();
  if (!input) return { type: 'help', matches: [], mutating: false };
  if (input.startsWith('/')) return { type: 'slash', command: input.slice(1).trim().toLowerCase(), matches: [], mutating: false };
  const matches = patterns.filter(({ re }) => re.test(input)).map(({ id, label }) => ({ id, label }));
  return { type: 'natural-language', matches, mutating: mutating.test(input) };
}

export function describePlan(value) {
  const plan = planInput(value);
  if (plan.type !== 'natural-language') return null;
  if (!plan.matches.length) return 'I can help with agent discovery, pairing, Guardian, mandates, and audit. No LLM provider is configured in this preview, and no action was executed.';
  const topics = plan.matches.map(x => x.label).join(', ');
  return [
    'ATP request plan (preview only)',
    'Relevant workflows: ' + topics,
    plan.mutating ? 'Requires explicit human approval AND verified ATP authorization before execution.' : 'Read-only intent. No live ATP connection is configured.',
    'No tools were called, no identities were verified, and no changes were made.'
  ].join('\n');
}
