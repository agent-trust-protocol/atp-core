const RUNTIMES = [
  { value: 'openclaw', label: 'OpenClaw / NemoClaw', description: 'Multi-agent crew orchestration' },
  { value: 'mcp', label: 'MCP', description: 'Model Context Protocol servers' },
  { value: 'langchain', label: 'LangChain', description: 'LangChain / LangGraph agents' },
  { value: 'custom', label: 'Custom Runtime', description: 'Your own agent framework' }
];

const PROFILES = [
  {
    id: 'safe-default',
    name: 'Safe Default',
    description: 'Conservative profile for most agents: limited tools, strong auditing.',
    runtimes: ['openclaw', 'mcp', 'langchain', 'custom'],
    recommended: true
  },
  {
    id: 'dev-mode',
    name: 'Dev Mode',
    description: 'Permissive profile for local development.',
    runtimes: ['openclaw', 'mcp', 'langchain', 'custom']
  },
  {
    id: 'enterprise-locked',
    name: 'Enterprise Locked',
    description: 'Maximum security for production.',
    runtimes: ['openclaw', 'mcp', 'langchain', 'custom']
  },
  {
    id: 'openclaw-sandbox',
    name: 'OpenClaw Sandbox',
    description: 'Sandbox profile tuned for OpenClaw / NemoClaw.',
    runtimes: ['openclaw']
  }
];

const ENVIRONMENTS = ['dev', 'staging', 'prod'];

const state = {
  step: 0,
  runtime: '',
  agentName: '',
  environment: 'dev',
  profileId: 'safe-default',
  submitting: false,
  scaffold: null
};

const el = {
  progress: document.getElementById('progress'),
  stepContent: document.getElementById('step-content'),
  error: document.getElementById('error'),
  btnBack: document.getElementById('btn-back'),
  btnNext: document.getElementById('btn-next'),
  btnStart: document.getElementById('btn-start'),
  btnClose: document.getElementById('btn-close'),
  welcome: document.getElementById('welcome'),
  wizard: document.getElementById('wizard'),
  done: document.getElementById('done'),
  summary: document.getElementById('summary'),
  runCmd: document.getElementById('run-cmd'),
  starterBlock: document.getElementById('starter-block'),
  snippetBlock: document.getElementById('snippet-block'),
  starterSnippet: document.getElementById('starter-snippet'),
  cardTitle: document.getElementById('card-title'),
  cardSubtitle: document.getElementById('card-subtitle')
};

function filteredProfiles() {
  if (!state.runtime) return PROFILES;
  return PROFILES.filter((p) => p.runtimes.includes(state.runtime));
}

function setError(msg) {
  if (!msg) {
    el.error.hidden = true;
    el.error.textContent = '';
    return;
  }
  el.error.hidden = false;
  el.error.textContent = msg;
}

function renderProgress() {
  const labels = ['Runtime', 'Agent', 'Profile', 'Review'];
  el.progress.innerHTML = labels
    .map((label, i) => {
      let cls = 'progress-step';
      if (i === state.step) cls += ' active';
      else if (i < state.step) cls += ' done';
      return `<span class="${cls}">${i + 1}. ${label}</span>`;
    })
    .join('<span class="progress-step" aria-hidden="true">·</span>');
}

function renderStep0() {
  return `
    <div class="step">
      <h2>Choose runtime</h2>
      <p class="lead">Select the framework your agent will run on.</p>
      <div class="grid">
        ${RUNTIMES.map(
          (r) => `
          <button type="button" class="choice ${state.runtime === r.value ? 'selected' : ''}" data-runtime="${r.value}">
            <strong>${r.label}</strong>
            <span>${r.description}</span>
          </button>`
        ).join('')}
      </div>
    </div>`;
}

function renderStep1() {
  return `
    <div class="step">
      <h2>Name your agent</h2>
      <p class="lead">Give your agent a human-readable name.</p>
      <div class="field">
        <label for="agent-name">Agent name</label>
        <input type="text" id="agent-name" placeholder="e.g. FinanceBot" value="${escapeAttr(state.agentName)}" autocomplete="off" />
      </div>
      <div class="field">
        <label>Environment</label>
        <div class="env-row">
          ${ENVIRONMENTS.map(
            (env) => `
            <button type="button" class="pill ${state.environment === env ? 'selected' : ''}" data-env="${env}">${env}</button>`
          ).join('')}
        </div>
      </div>
    </div>`;
}

function renderStep2() {
  const list = filteredProfiles();
  if (!state.profileId || !list.some((p) => p.id === state.profileId)) {
    state.profileId = list[0]?.id || 'safe-default';
  }
  return `
    <div class="step">
      <h2>Select security profile</h2>
      <p class="lead">Profiles define the tools, network, and filesystem policies for your agent.</p>
      <div class="grid">
        ${list
          .map(
            (p) => `
          <button type="button" class="choice ${state.profileId === p.id ? 'selected' : ''}" data-profile="${p.id}">
            <strong>${p.name}${p.recommended ? '<span class="badge">Recommended</span>' : ''}</strong>
            <span>${p.description}</span>
          </button>`
          )
          .join('')}
      </div>
    </div>`;
}

function renderStep3() {
  const rt = RUNTIMES.find((r) => r.value === state.runtime);
  const prof = PROFILES.find((p) => p.id === state.profileId);
  return `
    <div class="step">
      <h2>Review</h2>
      <p class="lead">
        We'll mint a DID and quantum-safe keys for your agent on submit.
        <span class="badge badge-success">Quantum-safe</span>
      </p>
      <div class="grid">
        <div class="choice" style="cursor: default;">
          <strong>Runtime</strong>
          <span>${rt?.label || state.runtime}</span>
        </div>
        <div class="choice" style="cursor: default;">
          <strong>Agent</strong>
          <span>${escapeHtml(state.agentName)} · ${state.environment}</span>
        </div>
        <div class="choice" style="cursor: default;">
          <strong>Profile</strong>
          <span>${prof?.name || state.profileId}</span>
        </div>
      </div>
    </div>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

function render() {
  renderProgress();
  const renderers = [renderStep0, renderStep1, renderStep2, renderStep3];
  el.stepContent.innerHTML = renderers[state.step]();
  el.btnBack.disabled = state.step === 0;
  el.btnNext.textContent = state.step === 3 ? 'Onboard agent' : 'Next';
  el.btnNext.disabled = !canNext();
  bindStepEvents();
}

function canNext() {
  if (state.step === 0) return !!state.runtime;
  if (state.step === 1) return state.agentName.trim().length > 0;
  if (state.step === 2) return !!state.profileId;
  return true;
}

function bindStepEvents() {
  el.stepContent.querySelectorAll('[data-runtime]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.runtime = btn.getAttribute('data-runtime') || '';
      setError('');
      render();
    });
  });

  const nameInput = el.stepContent.querySelector('#agent-name');
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      state.agentName = nameInput.value;
      el.btnNext.disabled = !canNext();
    });
  }

  el.stepContent.querySelectorAll('[data-env]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.environment = btn.getAttribute('data-env') || 'dev';
      render();
    });
  });

  el.stepContent.querySelectorAll('[data-profile]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.profileId = btn.getAttribute('data-profile') || 'safe-default';
      render();
    });
  });
}

async function submit() {
  if (state.submitting) return;
  state.submitting = true;
  el.btnNext.disabled = true;
  setError('');
  try {
    const res = await fetch('/api/agents/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runtime: state.runtime,
        name: state.agentName.trim(),
        environment: state.environment,
        profileId: state.profileId
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to onboard agent');
    }
    showDone(data);
  } catch (e) {
    setError(e.message || 'Something went wrong');
    el.btnNext.disabled = false;
  } finally {
    state.submitting = false;
  }
}

function humanizeAgentName(name) {
  return String(name)
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '')
    .replace(/^(.)/, (c) => c.toUpperCase()) || 'MyBot';
}

function starterSnippet(agentName) {
  const displayName = humanizeAgentName(agentName || state.agentName || 'MyBot');
  return [
    `import { Agent } from 'atp-sdk';`,
    ``,
    `const agent = await Agent.quickstart('${displayName}');`,
    `console.log('DID:', agent.getDID());`,
    `console.log('Quantum-safe:', agent.isQuantumSafe());`
  ].join('\n');
}

function showDone(data) {
  el.welcome.hidden = true;
  el.wizard.hidden = true;
  el.done.hidden = false;
  el.cardTitle.textContent = 'All set';
  el.cardSubtitle.textContent = 'Your agent is registered with ATP.';

  const rows = [
    ['Agent ID', data.agentId || data.id || '—'],
    ['DID', data.did || '—'],
    ['Profile', state.profileId],
    ['Runtime', RUNTIMES.find((r) => r.value === state.runtime)?.label || state.runtime],
    ['Environment', state.environment]
  ];
  el.summary.innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${escapeHtml(String(v))}</dd>`).join('');

  if (state.scaffold && state.scaffold.scaffolded) {
    el.runCmd.textContent = `cd ${state.scaffold.projectName}\nnpm start`;
    el.starterBlock.hidden = false;
    el.snippetBlock.hidden = true;
  } else {
    el.starterBlock.hidden = true;
    el.snippetBlock.hidden = false;
    el.starterSnippet.textContent = starterSnippet(data.name || state.agentName);
  }
}

function startWizard() {
  el.welcome.hidden = true;
  el.wizard.hidden = false;
  render();
}

async function loadContext() {
  try {
    const res = await fetch('/api/context');
    if (!res.ok) return;
    const data = await res.json();
    state.scaffold = data;
    if (data && data.scaffolded && data.projectName && !state.agentName) {
      state.agentName = humanizeAgentName(data.projectName);
    }
  } catch {
    // non-fatal: work in standalone mode
  }
}

function bindCopyButtons() {
  document.querySelectorAll('.btn-copy').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const targetId = btn.getAttribute('data-copy-target');
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (!target) return;
      const text = target.textContent || '';
      try {
        await navigator.clipboard.writeText(text);
        const original = btn.textContent;
        btn.textContent = 'Copied ✓';
        setTimeout(() => {
          btn.textContent = original;
        }, 1500);
      } catch {
        // clipboard may be blocked; leave state unchanged
      }
    });
  });
}

el.btnStart.addEventListener('click', startWizard);

el.btnClose.addEventListener('click', () => {
  window.close();
});

el.btnBack.addEventListener('click', () => {
  if (state.step > 0) {
    state.step -= 1;
    setError('');
    render();
  }
});

el.btnNext.addEventListener('click', () => {
  if (state.step < 3) {
    state.step += 1;
    setError('');
    render();
  } else {
    submit();
  }
});

bindCopyButtons();
loadContext();
