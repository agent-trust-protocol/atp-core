/**
 * ATP Onboarding Dashboard — Embedded Server
 *
 * A lightweight, self-contained HTTP server that serves the onboarding
 * wizard and handles agent registration. No React/Next.js required.
 * Mirrors the design of src/app/onboard/agent/client-page.tsx.
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { exec } from 'child_process';

const PORT = 3456;

// ---------------------------------------------------------------------------
// Agent registration handler (mirrors src/app/api/agents/onboard/route.ts)
// ---------------------------------------------------------------------------

function handleOnboard(body: string, res: ServerResponse): void {
  try {
    const { runtime, name, environment, profileId } = JSON.parse(body);
    if (!runtime || !name || !profileId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing required fields' }));
      return;
    }
    const agentId = `agent-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
    const did = `did:atp:${agentId}`;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ agentId, did, name, runtime, environment, profileId, createdAt: new Date().toISOString() }));
  } catch {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal error' }));
  }
}

// ---------------------------------------------------------------------------
// Self-contained HTML dashboard
// ---------------------------------------------------------------------------

function dashboardHTML(agentName: string, agentDir: string): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ATP \u2014 Onboard Agent</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0a0a0a;--card:#111;--border:#222;--border-focus:#3b82f6;--text:#e5e5e5;--muted:#888;--blue:#3b82f6;--blue-light:#dbeafe;--blue-dark:#172554;--green:#22c55e;--green-bg:#052e16;--red:#ef4444;--red-bg:#450a0a}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1rem}
.card{background:var(--card);border:1px solid var(--border);border-radius:12px;width:100%;max-width:640px;overflow:hidden}
.card-header{text-align:center;padding:2rem 2rem 1rem}
.card-header svg{margin:0 auto 0.5rem;color:var(--blue)}
.card-header h1{font-size:1.25rem;font-weight:600}
.card-header p{font-size:.875rem;color:var(--muted);margin-top:.25rem}
.card-content{padding:0 2rem 2rem}
.steps{display:flex;align-items:center;justify-content:center;gap:0.5rem;margin-bottom:1.5rem}
.step-dot{width:2rem;height:2rem;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.875rem;font-weight:500;transition:all .2s}
.step-dot.active{background:var(--blue);color:#fff}
.step-dot.done{background:var(--blue-dark);color:var(--blue)}
.step-dot.pending{background:#1a1a1a;color:var(--muted)}
.step-label{font-size:.75rem;display:none}
@media(min-width:480px){.step-label{display:inline}}
.step-label.active{font-weight:600;color:var(--text)}
.step-label.inactive{color:var(--muted)}
.step-line{width:2rem;height:1px;background:var(--border)}
.step-line.done{background:var(--blue)}
h2{font-size:1.125rem;font-weight:600;margin-bottom:.25rem}
.desc{font-size:.875rem;color:var(--muted);margin-bottom:1rem}
.grid{display:grid;gap:.75rem}
.grid-2{grid-template-columns:1fr 1fr}
@media(max-width:480px){.grid-2{grid-template-columns:1fr}}
.option{text-align:left;border:1px solid var(--border);border-radius:8px;padding:1rem;cursor:pointer;background:transparent;color:var(--text);transition:all .15s}
.option:hover{border-color:#444}
.option.selected{border-color:var(--blue);background:var(--blue-dark)}
.option .name{font-weight:500}
.option .sub{font-size:.875rem;color:var(--muted);margin-top:.25rem}
.badge{display:inline-block;font-size:.7rem;padding:2px 8px;border-radius:9999px;border:1px solid var(--border);color:var(--muted);margin:2px}
.badge.rec{background:var(--blue-dark);color:var(--blue);border-color:var(--blue)}
.highlights{display:flex;flex-wrap:wrap;gap:4px;margin-top:.5rem}
label{display:block;font-size:.875rem;font-weight:500;margin-bottom:.375rem}
input[type=text]{width:100%;padding:.625rem .75rem;border:1px solid var(--border);border-radius:8px;background:#1a1a1a;color:var(--text);font-size:.9rem;outline:none;transition:border .15s}
input[type=text]:focus{border-color:var(--blue)}
.env-btns{display:flex;gap:.5rem;margin-top:.25rem}
.env-btn{padding:.5rem 1rem;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--text);font-size:.875rem;font-weight:500;cursor:pointer;transition:all .15s}
.env-btn.selected{border-color:var(--blue);background:var(--blue-dark);color:#93c5fd}
.summary-table{border:1px solid var(--border);border-radius:8px;overflow:hidden}
.summary-row{display:flex;justify-content:space-between;padding:.75rem;font-size:.875rem;border-bottom:1px solid var(--border)}
.summary-row:last-child{border-bottom:none}
.summary-row .key{color:var(--muted)}
.summary-row .val{font-weight:500}
.nav{display:flex;justify-content:space-between;margin-top:1.5rem}
button.btn{padding:.625rem 1.25rem;border-radius:8px;font-size:.875rem;font-weight:500;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:.375rem;border:none}
.btn-primary{background:var(--blue);color:#fff}
.btn-primary:hover{opacity:.9}
.btn-primary:disabled{opacity:.4;cursor:not-allowed}
.btn-outline{background:transparent;border:1px solid var(--border);color:var(--text)}
.btn-outline:hover{border-color:#444}
.btn-outline:disabled{opacity:.4;cursor:not-allowed}
.alert{margin-top:1rem;padding:.75rem;border-radius:8px;background:var(--red-bg);border:1px solid #7f1d1d;font-size:.875rem;color:#fca5a5}
.done-screen{text-align:center;padding:1.5rem 0}
.done-icon{width:3rem;height:3rem;border-radius:50%;background:var(--green-bg);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem}
.done-icon svg{color:var(--green)}
.done-screen h2{font-size:1.25rem;margin-bottom:.5rem}
.done-screen .sub-text{color:var(--muted);margin-bottom:1.5rem}
.done-btns{display:flex;gap:.75rem;justify-content:center;margin-top:1rem}
.code-block{background:#1a1a1a;border:1px solid var(--border);border-radius:8px;padding:1rem;font-family:monospace;font-size:.8rem;text-align:left;margin:1rem auto;max-width:28rem;line-height:1.6;color:#93c5fd;overflow-x:auto}
.hidden{display:none}
</style>
</head>
<body>
<div class="card">
  <div class="card-header">
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 64 64" role="img" aria-label="ATP logo"><defs><linearGradient id="atp-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00D9FF"/><stop offset="100%" stop-color="#0A2463"/></linearGradient></defs><text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="Inter,system-ui,-apple-system,sans-serif" font-size="28" font-weight="800" fill="url(#atp-gradient)" letter-spacing="1">ATP</text></svg>
    <h1>Onboard Agent with ATP</h1>
    <p>Register your agent with Agent Trust Protocol and select a security profile.</p>
  </div>
  <div class="card-content">
    <!-- Steps indicator -->
    <div class="steps" id="steps-bar"></div>

    <!-- Step panels -->
    <div id="step-0"></div>
    <div id="step-1" class="hidden"></div>
    <div id="step-2" class="hidden"></div>
    <div id="step-3" class="hidden"></div>
    <div id="step-done" class="hidden"></div>

    <!-- Error -->
    <div id="error-box" class="alert hidden"></div>

    <!-- Navigation -->
    <div class="nav" id="nav-bar">
      <button class="btn btn-outline" id="btn-back" disabled>&larr; Back</button>
      <button class="btn btn-primary" id="btn-next" disabled>Next &rarr;</button>
    </div>
  </div>
</div>

<script>
const PROFILES = [
  { id:'safe-default', name:'Safe Default', desc:'Conservative profile for most agents: limited tools, strong auditing.', runtimes:['openclaw','mcp','langchain','custom'], highlights:['Read-only filesystem','Shell disabled','Full audit trail'] },
  { id:'dev-mode', name:'Dev Mode', desc:'Permissive profile for local development: most tools allowed, minimal restrictions.', runtimes:['openclaw','mcp','langchain','custom'], highlights:['All tools enabled','No approval gates','Action logging on'] },
  { id:'enterprise-locked', name:'Enterprise Locked', desc:'Maximum security for production: strict controls, full audit, approval required.', runtimes:['openclaw','mcp','langchain','custom'], highlights:['Shell fully blocked','Credentials blocked','Sensitive field redaction'] },
  { id:'openclaw-sandbox', name:'OpenClaw Sandbox', desc:'Sandbox profile tuned for OpenClaw/NemoClaw agents with state-based enforcement.', runtimes:['openclaw'], highlights:['OpenClaw-optimized','Sandbox paths only','State-based policies'] }
];
const CONTROLS = {
  'safe-default':{ Shell:'Blocked (approval required)', Filesystem:'Read-only, restricted paths', Network:'Internal only, approval for external', Credentials:'Blocked (approval required)', Messaging:'Allowed, approval for external' },
  'dev-mode':{ Shell:'Allowed, no restrictions', Filesystem:'Read + Write, all paths', Network:'All domains allowed', Credentials:'Allowed', Messaging:'Allowed, no restrictions' },
  'enterprise-locked':{ Shell:'Fully blocked', Filesystem:'Read-only, approved paths only', Network:'Internal corp only', Credentials:'Fully blocked', Messaging:'Allowed, approval for external' },
  'openclaw-sandbox':{ Shell:'Blocked (approval, limited commands)', Filesystem:'Read + Write, sandbox paths', Network:'Internal + OpenClaw domains', Credentials:'Blocked (approval required)', Messaging:'Allowed, approval for external' }
};
const RUNTIMES = [
  { value:'openclaw', label:'OpenClaw / NemoClaw', desc:'Multi-agent crew orchestration' },
  { value:'mcp', label:'MCP', desc:'Model Context Protocol servers' },
  { value:'langchain', label:'LangChain', desc:'LangChain / LangGraph agents' },
  { value:'custom', label:'Custom Runtime', desc:'Your own agent framework' }
];
const ENVS = ['dev','staging','prod'];
const LABELS = ['Runtime','Agent','Profile','Confirm'];

let step=0, runtime='', agentName=${JSON.stringify(agentName)}, environment='dev', profileId='safe-default', result=null;

function $(id){return document.getElementById(id)}
function show(id){$(id).classList.remove('hidden')}
function hide(id){$(id).classList.add('hidden')}

function renderSteps(){
  let h='';
  LABELS.forEach((l,i)=>{
    const cls=i===step?'active':i<step?'done':'pending';
    const lbl=i===step?'active':'inactive';
    h+='<div class="step-dot '+cls+'">'+(i<step?'\\u2713':(i+1))+'</div>';
    h+='<span class="step-label '+lbl+'">'+l+'</span>';
    if(i<LABELS.length-1) h+='<div class="step-line'+(i<step?' done':'')+'"></div>';
  });
  $('steps-bar').innerHTML=h;
}

function renderStep0(){
  let h='<h2>Choose Runtime</h2><p class="desc">Select the agent runtime your agent will run on.</p><div class="grid grid-2">';
  RUNTIMES.forEach(r=>{
    h+='<div class="option'+(runtime===r.value?' selected':'')+'" onclick="runtime=\\''+r.value+'\\';render()">';
    h+='<div class="name">'+r.label+'</div><div class="sub">'+r.desc+'</div></div>';
  });
  h+='</div>';
  $('step-0').innerHTML=h;
}

function renderStep1(){
  let h='<h2>Name Your Agent</h2><p class="desc">Give your agent a human-readable name.</p>';
  h+='<div style="margin-bottom:1rem"><label for="aname">Agent Name</label>';
  h+='<input type="text" id="aname" placeholder="e.g. FinanceBot, CodeReviewer" value="'+agentName.replace(/"/g,'&quot;')+'" oninput="agentName=this.value;updateNav()"/></div>';
  h+='<label>Environment</label><div class="env-btns">';
  ENVS.forEach(e=>{
    h+='<button class="env-btn'+(environment===e?' selected':'')+'" onclick="environment=\\''+e+'\\';render()">'+e+'</button>';
  });
  h+='</div>';
  $('step-1').innerHTML=h;
  setTimeout(()=>{const el=$('aname');if(el)el.focus()},50);
}

function renderStep2(){
  const filtered=runtime?PROFILES.filter(p=>p.runtimes.includes(runtime)):PROFILES;
  let h='<h2>Select Security Profile</h2><p class="desc">Choose an ATP security profile that defines what your agent can and cannot do.</p><div class="grid">';
  filtered.forEach(p=>{
    h+='<div class="option'+(profileId===p.id?' selected':'')+'" onclick="profileId=\\''+p.id+'\\';render()">';
    h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span class="name">'+p.name+'</span>';
    if(p.id==='safe-default') h+='<span class="badge rec">Recommended</span>';
    h+='</div><div class="sub" style="margin-bottom:6px">'+p.desc+'</div>';
    h+='<div class="highlights">'+p.highlights.map(x=>'<span class="badge">'+x+'</span>').join('')+'</div></div>';
  });
  h+='</div>';
  $('step-2').innerHTML=h;
}

function renderStep3(){
  const c=CONTROLS[profileId]||{};
  const rl=RUNTIMES.find(r=>r.value===runtime);
  const pl=PROFILES.find(p=>p.id===profileId);
  let h='<h2>Confirm Controls</h2><p class="desc">Review the key controls for your selected profile before onboarding.</p>';
  h+='<div class="summary-table">';
  h+=row('Runtime',rl?rl.label:runtime);
  h+=row('Agent Name',agentName);
  h+=row('Environment',environment);
  h+=row('Profile',pl?pl.name:profileId);
  h+='</div>';
  h+='<h3 style="font-size:.875rem;font-weight:600;margin-top:1rem;margin-bottom:.5rem">Profile Controls</h3>';
  h+='<div class="summary-table">';
  Object.entries(c).forEach(([k,v])=>{h+=row(k,v)});
  h+='</div>';
  $('step-3').innerHTML=h;
}

function row(k,v){return '<div class="summary-row"><span class="key">'+k+'</span><span class="val">'+v+'</span></div>'}

function renderDone(){
  const dir=${JSON.stringify(agentDir)};
  let h='<div class="done-screen">';
  h+='<div class="done-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>';
  h+='<h2>Agent Onboarded</h2>';
  h+='<p class="sub-text">Your agent has been registered with ATP and is ready to use.</p>';
  h+='<div class="summary-table" style="max-width:28rem;margin:0 auto">';
  h+=row('Agent ID',result.agentId);
  h+=row('DID','<span style="font-family:monospace;font-size:.75rem">'+result.did+'</span>');
  h+=row('Profile',PROFILES.find(p=>p.id===profileId)?.name||profileId);
  h+=row('Runtime',RUNTIMES.find(r=>r.value===runtime)?.label||runtime);
  h+=row('Environment',environment);
  h+='</div>';
  h+='<div class="code-block">cd '+dir+'<br>npm install<br>npm start</div>';
  h+='<div class="done-btns">';
  h+='<button class="btn btn-outline" onclick="step=0;result=null;render()">Onboard Another</button>';
  h+='</div></div>';
  $('step-done').innerHTML=h;
}

function updateNav(){
  const canNext=(step===0&&runtime!=='')||(step===1&&agentName.trim()!=='')||step===2||step===3;
  $('btn-next').disabled=!canNext;
  $('btn-back').disabled=step===0;
  if(step===3){$('btn-next').innerHTML='\\u26A1 Onboard Agent'}
  else{$('btn-next').innerHTML='Next &rarr;'}
}

function render(){
  for(let i=0;i<4;i++){i===step?show('step-'+i):hide('step-'+i)}
  if(result){hide('step-'+step);show('step-done');hide('nav-bar');hide('steps-bar')}
  else{hide('step-done');show('nav-bar');$('steps-bar').style.display='flex'}
  renderSteps();
  if(step===0)renderStep0();
  if(step===1)renderStep1();
  if(step===2)renderStep2();
  if(step===3)renderStep3();
  if(result)renderDone();
  updateNav();
  hide('error-box');
}

async function submit(){
  $('btn-next').disabled=true;
  $('btn-next').innerHTML='Onboarding...';
  try{
    const res=await fetch('/api/agents/onboard',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runtime,name:agentName,environment,profileId})});
    if(!res.ok)throw new Error((await res.json().catch(()=>({}))).error||'Failed');
    result=await res.json();
    render();
  }catch(e){
    $('error-box').textContent=e.message;show('error-box');
    $('btn-next').disabled=false;$('btn-next').innerHTML='\\u26A1 Onboard Agent';
  }
}

$('btn-next').onclick=()=>{if(step===3){submit()}else{step++;render()}};
$('btn-back').onclick=()=>{if(step>0){step--;render()}};

render();
</script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

export function startDashboard(agentName: string, agentDir: string): void {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.method === 'POST' && req.url === '/api/agents/onboard') {
      let body = '';
      req.on('data', (c: Buffer) => { body += c.toString(); });
      req.on('end', () => handleOnboard(body, res));
      return;
    }

    // Serve the dashboard HTML for any other request
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(dashboardHTML(agentName, agentDir));
  });

  server.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log(` \x1b[36m\u26A1\x1b[0m Onboarding dashboard: \x1b[1m${url}\x1b[0m`);
    console.log(`   \x1b[2mPress Ctrl+C to stop\x1b[0m\n`);

    // Auto-open browser
    const platform = process.platform;
    const cmd = platform === 'darwin' ? 'open'
      : platform === 'win32' ? 'start'
      : 'xdg-open';
    exec(`${cmd} ${url}`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    server.close();
    process.exit(0);
  });
}
