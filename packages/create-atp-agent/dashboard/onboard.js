const STORAGE_KEY = 'atp-onboard-state';

const PROFILES = [
  {
    id: 'safe-default',
    name: 'Safe Default',
    shortDesc: 'Read-only FS, shell approval required, internal network only',
    tagline: 'Most agents start here',
    recommended: true
  },
  {
    id: 'dev-mode',
    name: 'Dev Mode',
    shortDesc: 'Permissive profile for local development',
    tagline: 'Full tool access, no approval gates'
  },
  {
    id: 'enterprise-locked',
    name: 'Enterprise Locked',
    shortDesc: 'Maximum security for production',
    tagline: 'All actions require approval'
  },
  {
    id: 'openclaw-sandbox',
    name: 'OpenClaw Sandbox',
    shortDesc: 'Sandbox profile tuned for OpenClaw / NemoClaw',
    tagline: 'Multi-agent crew ready'
  }
];

const RUNTIMES = [
  { value: 'mcp', label: 'MCP', description: 'Model Context Protocol servers' },
  { value: 'langchain', label: 'LangChain', description: 'LangChain / LangGraph agents' },
  { value: 'openclaw', label: 'OpenClaw / NemoClaw', description: 'Multi-agent crew orchestration' },
  { value: 'custom', label: 'Custom', description: 'Your own agent framework' }
];

const ALL_CAPABILITIES = ['tools', 'messaging', 'filesystem', 'network'];

const state = {
  mode: 'create',
  projectName: '',
  agentName: '',
  profile: 'safe-default',
  did: '',
  capabilities: ['tools', 'messaging'],
  runtime: '',
  submitting: false,
  error: ''
};

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

function humanizeAgentName(name) {
  return (
    String(name)
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '')
      .replace(/^(.)/, (c) => c.toUpperCase()) || 'MyBot'
  );
}

function saveState() {
  try {
    const { submitting, error, ...persist } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persist));
  } catch {
    // non-fatal
  }
}

function restoreState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    Object.assign(state, saved);
  } catch {
    // non-fatal
  }
}

async function loadContext() {
  try {
    const res = await fetch('/api/context');
    if (!res.ok) return;
    const data = await res.json();
    if (data && data.mode) state.mode = data.mode;
    if (data && data.projectName) {
      state.projectName = data.projectName;
      if (!state.agentName) {
        state.agentName = humanizeAgentName(data.projectName);
      }
    }
  } catch {
    // non-fatal
  }
}

function navigate(hash) {
  location.hash = '#' + hash;
}

function renderHeader({ agentLabel, progressText, badge }) {
  const header = document.getElementById('app-header');
  header.innerHTML = `
    <div class="logo-wrap">
      <img src="/atp-logo.svg" width="48" height="48" alt="Agent Trust Protocol logo" />
    </div>
    ${agentLabel ? `<div class="agent-label">${escapeHtml(agentLabel)}</div>` : ''}
    ${badge ? `<span class="badge-new">${escapeHtml(badge)}</span>` : ''}
    ${progressText ? `<div class="progress-indicator">${escapeHtml(progressText)}</div>` : ''}
  `;
}

function setBody(html) {
  document.getElementById('app-body').innerHTML = html;
}

function showError(msg) {
  state.error = msg || '';
  const existing = document.getElementById('error-msg');
  if (existing) {
    existing.textContent = state.error;
    existing.hidden = !state.error;
  }
}

// ==========================================================================
// CREATE FLOW
// ==========================================================================

function renderWelcome() {
  renderHeader({
    agentLabel: state.projectName || 'New ATP Agent',
    progressText: '1/4',
    badge: state.projectName ? 'New agent project detected' : ''
  });
  setBody(`
    <div class="step">
      <h2>Name your agent</h2>
      <p class="lead">We'll mint a DID and quantum-safe keys for this agent.</p>
      <div class="field">
        <label for="agent-name">Agent name</label>
        <input type="text" id="agent-name" placeholder="e.g. TestBot" value="${escapeAttr(state.agentName)}" autocomplete="off" />
      </div>
      <p id="error-msg" class="error" ${state.error ? '' : 'hidden'}>${escapeHtml(state.error)}</p>
      <div class="nav">
        <button type="button" class="btn secondary" id="btn-advanced">Advanced Setup</button>
        <button type="button" class="btn primary" id="btn-create">Create Agent →</button>
      </div>
    </div>
  `);

  const input = document.getElementById('agent-name');
  input.addEventListener('input', () => {
    state.agentName = input.value;
    saveState();
  });

  document.getElementById('btn-create').addEventListener('click', () => {
    if (!state.agentName.trim()) {
      showError('Agent name is required');
      return;
    }
    saveState();
    navigate('profile');
  });

  document.getElementById('btn-advanced').addEventListener('click', () => {
    if (!state.agentName.trim()) {
      showError('Agent name is required');
      return;
    }
    saveState();
    navigate('profile');
  });
}

function renderProfile() {
  renderHeader({
    agentLabel: state.agentName || 'New Agent',
    progressText: '2/4'
  });
  const selected = PROFILES.find((p) => p.id === state.profile) || PROFILES[0];
  setBody(`
    <div class="step">
      <h2>Security profile</h2>
      <p class="lead">Profiles define tools, network, and filesystem policies.</p>
      <div class="grid profile-grid">
        ${PROFILES.map(
          (p) => `
          <button type="button" class="choice ${state.profile === p.id ? 'selected' : ''}" data-profile="${p.id}">
            <strong>${p.name}${p.recommended ? '<span class="badge">Recommended</span>' : ''}</strong>
            <span>${p.tagline}</span>
          </button>`
        ).join('')}
      </div>
      <div class="details-card" id="profile-details">
        <strong>${selected.name}</strong>
        <p>${selected.shortDesc}</p>
      </div>
      <p id="error-msg" class="error" ${state.error ? '' : 'hidden'}>${escapeHtml(state.error)}</p>
      <div class="nav">
        <button type="button" class="btn secondary" id="btn-back">← Back</button>
        <button type="button" class="btn primary" id="btn-next">Next: Generate Identity →</button>
      </div>
    </div>
  `);

  document.querySelectorAll('[data-profile]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.profile = btn.getAttribute('data-profile') || 'safe-default';
      saveState();
      renderProfile();
    });
  });

  document.getElementById('btn-back').addEventListener('click', () => navigate('welcome'));
  document.getElementById('btn-next').addEventListener('click', async () => {
    const nextBtn = document.getElementById('btn-next');
    nextBtn.disabled = true;
    nextBtn.textContent = 'Generating…';
    const ok = await submitOnboard();
    if (ok) {
      saveState();
      navigate('identity');
    } else {
      nextBtn.disabled = false;
      nextBtn.textContent = 'Next: Generate Identity →';
    }
  });
}

function renderIdentity() {
  renderHeader({
    agentLabel: state.agentName,
    progressText: '3/4'
  });
  setBody(`
    <div class="step">
      <h2>Identity generated</h2>
      <ul class="check-list">
        <li class="check-item">✅ DID minted: <code>${escapeHtml(state.did || '—')}</code></li>
        <li class="check-item">✅ Quantum-safe keys: Ed25519 + ML-DSA</li>
        <li class="check-item">✅ <code>.atp.json</code> written to project</li>
        <li class="check-item">✅ Profile: <code>${escapeHtml(state.profile)}</code></li>
      </ul>
      <div class="nav">
        <a class="btn secondary" href="https://agenttrustprotocol.com/docs" target="_blank" rel="noopener">Docs</a>
        <button type="button" class="btn secondary" id="btn-edit">Edit Config</button>
        <button type="button" class="btn primary" id="btn-run">Run Agent →</button>
      </div>
    </div>
  `);

  document.getElementById('btn-edit').addEventListener('click', () => navigate('profile'));
  document.getElementById('btn-run').addEventListener('click', () => navigate('success'));
}

function renderSuccess() {
  renderHeader({
    agentLabel: state.agentName,
    progressText: '4/4'
  });
  const runCmd = state.projectName ? `cd ${state.projectName}\nnpm start` : 'npm start';
  setBody(`
    <div class="step success-screen">
      <div class="success-icon" aria-hidden="true">🎉</div>
      <h2>Your ATP agent is ready</h2>
      <dl class="summary">
        <dt>Agent</dt><dd>${escapeHtml(state.agentName)}</dd>
        <dt>DID</dt><dd>${escapeHtml(state.did || '—')}</dd>
        <dt>Profile</dt><dd>${escapeHtml(state.profile)}</dd>
        <dt>Quantum-safe</dt><dd>✅ Ed25519 + ML-DSA</dd>
      </dl>
      <div class="next-block">
        <h3>Run your agent</h3>
        <pre class="codeblock" id="run-cmd">${escapeHtml(runCmd)}</pre>
        <button type="button" class="btn secondary btn-copy" data-copy-target="run-cmd">Copy Terminal</button>
      </div>
      <div class="next-block">
        <h3>Next steps</h3>
        <ul class="next-steps">
          <li>Customize <code>.atp.json</code> to tune capabilities</li>
          <li>Wire in your tools via the ATP SDK</li>
          <li>Register with the audit service for compliance</li>
        </ul>
      </div>
      <div class="actions">
        <a class="btn primary" href="https://agenttrustprotocol.com/docs" target="_blank" rel="noopener">Explore Docs</a>
        <button type="button" class="btn secondary" id="btn-restart">Start Over</button>
      </div>
    </div>
  `);

  bindCopyButtons();
  document.getElementById('btn-restart').addEventListener('click', () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    state.did = '';
    navigate('welcome');
  });
}

async function submitOnboard() {
  if (state.did) return true;
  if (state.submitting) return false;
  state.submitting = true;
  showError('');
  try {
    const res = await fetch('/api/agents/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: state.agentName.trim(),
        profileId: state.profile,
        capabilities: state.capabilities,
        runtime: state.runtime || 'custom'
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Failed to onboard agent');
    state.did = data.did || '';
    saveState();
    return true;
  } catch (e) {
    showError(e.message || 'Something went wrong');
    return false;
  } finally {
    state.submitting = false;
  }
}

// ==========================================================================
// STAMP FLOW
// ==========================================================================

function renderStampWelcome() {
  renderHeader({
    agentLabel: state.projectName || 'Existing Project',
    progressText: '1/4',
    badge: 'Stamping existing agent'
  });
  setBody(`
    <div class="step">
      <h2>Select runtime</h2>
      <p class="lead">What framework is this agent built on?</p>
      <div class="grid">
        ${RUNTIMES.map(
          (r) => `
          <button type="button" class="choice ${state.runtime === r.value ? 'selected' : ''}" data-runtime="${r.value}">
            <strong>${r.label}</strong>
            <span>${r.description}</span>
          </button>`
        ).join('')}
      </div>
      <p id="error-msg" class="error" ${state.error ? '' : 'hidden'}>${escapeHtml(state.error)}</p>
      <div class="nav nav-single">
        <button type="button" class="btn primary" id="btn-next">Stamp Agent →</button>
      </div>
    </div>
  `);

  document.querySelectorAll('[data-runtime]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.runtime = btn.getAttribute('data-runtime') || '';
      saveState();
      renderStampWelcome();
    });
  });

  document.getElementById('btn-next').addEventListener('click', () => {
    if (!state.runtime) {
      showError('Pick a runtime');
      return;
    }
    saveState();
    navigate('stamp-details');
  });
}

function renderStampDetails() {
  renderHeader({
    agentLabel: state.projectName || 'Existing Project',
    progressText: '2/4'
  });
  setBody(`
    <div class="step">
      <h2>Agent details</h2>
      <p class="lead">Name this agent and pick its capabilities.</p>
      <div class="field">
        <label for="agent-name">Agent name</label>
        <input type="text" id="agent-name" placeholder="e.g. ResearchBot" value="${escapeAttr(state.agentName)}" autocomplete="off" />
      </div>
      <div class="field">
        <label>Capabilities</label>
        <div class="env-row">
          ${ALL_CAPABILITIES.map(
            (c) => `
            <button type="button" class="pill ${state.capabilities.includes(c) ? 'selected' : ''}" data-cap="${c}">${c}</button>`
          ).join('')}
        </div>
      </div>
      <div class="field">
        <label>Security profile</label>
        <div class="grid profile-grid">
          ${PROFILES.map(
            (p) => `
            <button type="button" class="choice ${state.profile === p.id ? 'selected' : ''}" data-profile="${p.id}">
              <strong>${p.name}</strong>
              <span>${p.tagline}</span>
            </button>`
          ).join('')}
        </div>
      </div>
      <p id="error-msg" class="error" ${state.error ? '' : 'hidden'}>${escapeHtml(state.error)}</p>
      <div class="nav">
        <button type="button" class="btn secondary" id="btn-back">← Back</button>
        <button type="button" class="btn primary" id="btn-next">Generate ATP Identity →</button>
      </div>
    </div>
  `);

  const nameInput = document.getElementById('agent-name');
  nameInput.addEventListener('input', () => {
    state.agentName = nameInput.value;
    saveState();
  });

  document.querySelectorAll('[data-cap]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cap = btn.getAttribute('data-cap');
      if (!cap) return;
      const idx = state.capabilities.indexOf(cap);
      if (idx >= 0) state.capabilities.splice(idx, 1);
      else state.capabilities.push(cap);
      saveState();
      renderStampDetails();
    });
  });

  document.querySelectorAll('[data-profile]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.profile = btn.getAttribute('data-profile') || 'safe-default';
      saveState();
      renderStampDetails();
    });
  });

  document.getElementById('btn-back').addEventListener('click', () => navigate('stamp-welcome'));
  document.getElementById('btn-next').addEventListener('click', async () => {
    if (!state.agentName.trim()) {
      showError('Agent name is required');
      return;
    }
    const btn = document.getElementById('btn-next');
    btn.disabled = true;
    btn.textContent = 'Generating…';
    const ok = await submitOnboard();
    if (ok) {
      saveState();
      navigate('stamp-complete');
    } else {
      btn.disabled = false;
      btn.textContent = 'Generate ATP Identity →';
    }
  });
}

function renderStampComplete() {
  renderHeader({
    agentLabel: state.agentName,
    progressText: '3/4'
  });
  setBody(`
    <div class="step">
      <h2>Stamping complete</h2>
      <ul class="check-list">
        <li class="check-item">✅ DID minted: <code>${escapeHtml(state.did || '—')}</code></li>
        <li class="check-item">✅ Quantum-safe keys issued</li>
        <li class="check-item">✅ <code>.atp.json</code> written alongside your project</li>
        <li class="check-item">✅ Runtime: <code>${escapeHtml(state.runtime)}</code></li>
        <li class="check-item">✅ Profile: <code>${escapeHtml(state.profile)}</code></li>
      </ul>
      <div class="nav">
        <button type="button" class="btn secondary" id="btn-back">Edit</button>
        <button type="button" class="btn primary" id="btn-next">Continue →</button>
      </div>
    </div>
  `);
  document.getElementById('btn-back').addEventListener('click', () => navigate('stamp-details'));
  document.getElementById('btn-next').addEventListener('click', () => navigate('stamp-success'));
}

function renderStampSuccess() {
  renderHeader({
    agentLabel: state.agentName,
    progressText: '4/4'
  });
  const runCmd = state.projectName ? `cd ${state.projectName}\nnpm start` : 'npm start';
  setBody(`
    <div class="step success-screen">
      <div class="success-icon" aria-hidden="true">🎉</div>
      <h2>Agent stamped successfully</h2>
      <dl class="summary">
        <dt>Agent</dt><dd>${escapeHtml(state.agentName)}</dd>
        <dt>DID</dt><dd>${escapeHtml(state.did || '—')}</dd>
        <dt>Runtime</dt><dd>${escapeHtml(state.runtime)}</dd>
        <dt>Profile</dt><dd>${escapeHtml(state.profile)}</dd>
        <dt>Capabilities</dt><dd>${escapeHtml(state.capabilities.join(', '))}</dd>
        <dt>Quantum-safe</dt><dd>✅ Ed25519 + ML-DSA</dd>
      </dl>
      <div class="next-block">
        <h3>Run your agent</h3>
        <pre class="codeblock" id="run-cmd">${escapeHtml(runCmd)}</pre>
        <button type="button" class="btn secondary btn-copy" data-copy-target="run-cmd">Copy Terminal</button>
      </div>
      <div class="next-block">
        <h3>Next steps</h3>
        <ul class="next-steps">
          <li>Review the generated <code>.atp.json</code></li>
          <li>Audit the diff before committing</li>
          <li>Upgrade profile once you've tested locally</li>
        </ul>
      </div>
      <div class="actions">
        <a class="btn primary" href="https://agenttrustprotocol.com/docs" target="_blank" rel="noopener">Explore Docs</a>
        <button type="button" class="btn secondary" id="btn-restart">Stamp Another</button>
      </div>
    </div>
  `);

  bindCopyButtons();
  document.getElementById('btn-restart').addEventListener('click', () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    state.did = '';
    state.runtime = '';
    navigate('stamp-welcome');
  });
}

// ==========================================================================
// ROUTER + SETUP
// ==========================================================================

function router(hash) {
  const route = (hash || '').replace('#', '') || (state.mode === 'stamp' ? 'stamp-welcome' : 'welcome');
  const screens = {
    welcome: renderWelcome,
    profile: renderProfile,
    identity: renderIdentity,
    success: renderSuccess,
    'stamp-welcome': renderStampWelcome,
    'stamp-details': renderStampDetails,
    'stamp-complete': renderStampComplete,
    'stamp-success': renderStampSuccess
  };
  if (Object.prototype.hasOwnProperty.call(screens, route)) {
    screens[route]();
  } else {
    navigate(state.mode === 'stamp' ? 'stamp-welcome' : 'welcome');
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
        // clipboard may be blocked
      }
    });
  });
}

window.addEventListener('hashchange', () => router(location.hash));

async function init() {
  restoreState();
  await loadContext();
  if (!location.hash) {
    navigate(state.mode === 'stamp' ? 'stamp-welcome' : 'welcome');
  } else {
    router(location.hash);
  }
}

init();
