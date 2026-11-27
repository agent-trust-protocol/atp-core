'use strict';

const states = [
  ['Ready', '—', 'Select a recorded step to inspect it.', 'workspace', 'idle'],
  ['Evaluating read', 'Read sample.txt', 'The agent requests access to the sample file.', 'gate', 'pending'],
  ['Read allowed', 'Read sample.txt', 'The read-only profile permits reads from the demo workspace.', 'target', 'allow'],
  ['Read completed', 'Read sample.txt', 'The simulated runtime recorded a successful read.', 'target', 'allow'],
  ['Evaluating write', 'Write sample.txt', 'The agent requests a write to the same file.', 'gate', 'pending'],
  ['Write denied', 'Write sample.txt', 'The read-only profile denies writes. The simulated runtime did not execute the write.', 'gate', 'deny'],
].map(([title, action, reason, position, status], index) => ({
  id: index ? `DEMO-${String(index).padStart(3, '0')}` : '—',
  title, action, reason, position, status,
}));

const $ = id => document.getElementById(id);
let cursor = 0;
let timer = null;
const steps = states.slice(1).map(({ title }, index) => {
  const li = document.createElement('li');
  const button = document.createElement('button');
  button.textContent = title;
  button.addEventListener('click', () => { select(index + 1); pause(); });
  li.append(button);
  $('events').append(li);
  return button;
});

function select(index) {
  cursor = index;
  const state = states[index];
  $('outcome').textContent = state.title;
  $('outcome').dataset.state = state.status;
  $('action').textContent = state.action;
  $('reason').textContent = state.reason;
  $('eventId').textContent = state.id;
  $('agent').dataset.position = state.position;
  $('route').dataset.position = state.position;
  $('sceneNote').textContent = state.title;
  steps.forEach((button, i) => button.setAttribute('aria-current', String(i + 1 === index)));
  $('step').disabled = cursor === states.length - 1;
}
function pause() {
  clearInterval(timer);
  timer = null;
  $('play').textContent = cursor === states.length - 1 ? 'Replay' : 'Play replay';
}
$('play').addEventListener('click', () => {
  if (timer !== null) { pause(); return; }
  if (cursor === states.length - 1) select(0);
  $('play').textContent = 'Pause';
  timer = setInterval(() => {
    select(cursor + 1);
    if (cursor === states.length - 1) pause();
  }, 1150);
});
$('step').addEventListener('click', () => { select(Math.min(cursor + 1, states.length - 1)); pause(); });
$('reset').addEventListener('click', () => { select(0); pause(); });
$('view').addEventListener('click', () => {
  const list = document.querySelector('.layout').classList.toggle('list');
  $('view').setAttribute('aria-pressed', String(list));
  $('view').textContent = list ? 'Floor view' : 'List view';
});
$('motion').checked = matchMedia('(prefers-reduced-motion: reduce)').matches;
function motion() { document.documentElement.classList.toggle('reduced', $('motion').checked); }
$('motion').addEventListener('change', motion);
motion();
select(0);
