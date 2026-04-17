# create-atp-agent

Scaffold a new [Agent Trust Protocol](https://agenttrustprotocol.com) agent with an **ESM-first** template (`"type": "module"`), including a top-level `await` quickstart that runs on Node 18+.

The CLI is designed as a single zero-friction flow:

1. `npx create-atp-agent my-agent` — scaffold + install
2. The onboarding dashboard launches automatically at `http://127.0.0.1:3456`
3. Pick a runtime, name your agent, and select a security profile in the browser
4. The dashboard writes the chosen profile into the project's `.atp.json`
5. `cd my-agent && npm start`

Use `--no-dashboard` to skip the browser launch, or `--dashboard-only` to run the UI without scaffolding a project.

## Usage

```bash
# Full flow: scaffold + install + dashboard
npx create-atp-agent my-agent

# Dashboard only — pick a profile for an existing project
npx atp-onboard-agent

# Scaffold only — no dashboard, no install
npx create-atp-agent my-agent --no-dashboard --skip-install
```

### Flags (`create-atp-agent`)

| Flag | Purpose |
| --- | --- |
| `--dashboard-only` | Serve only the local onboarding UI (no scaffold). |
| `--no-dashboard` | After scaffold, do not start the onboarding server. |
| `--no-open` | Start the server but do not launch the system browser. |
| `--skip-install` | Skip `npm install` after scaffolding. |

Set `CREATE_ATP_AGENT_NO_OPEN=1` for the same effect as `--no-open` (useful in CI or SSH sessions).

### Flags (`atp-onboard-agent`)

| Flag | Purpose |
| --- | --- |
| `--no-open` | Start the server but do not launch the system browser. |
| `-p, --port <port>` | Port to serve on (default `3456`). |

## Flow

```
Terminal                              Browser
────────                              ───────
npx create-atp-agent my-agent
  ├─ prompt: project name (if omitted)
  ├─ prompt: language (TS/JS)
  ├─ copy template/
  ├─ npm install
  └─ launch dashboard ─────────────►  Welcome → Runtime → Agent → Profile → Review
                                      └─ POST /api/agents/onboard
                                         └─ writes .atp.json into my-agent/
                                      └─ Success: cd my-agent && npm start
```

The browser success screen shows the DID, quantum-safe status, and a copy-paste `cd <project> && npm start` command. For users who launched via `atp-onboard-agent` (no scaffolded project), the success screen shows an SDK starter snippet instead.

## Test before production

From this repo:

```bash
cd packages/create-atp-agent
npm install
npm run build
```

**1. Dashboard only (smoke test, no browser)**

```bash
CREATE_ATP_AGENT_NO_OPEN=1 node dist/onboard.js
# or equivalently
CREATE_ATP_AGENT_NO_OPEN=1 node dist/index.js --dashboard-only
```

In another terminal:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3456/
curl -s http://127.0.0.1:3456/api/context
curl -s -X POST http://127.0.0.1:3456/api/agents/onboard \
  -H "Content-Type: application/json" \
  -d '{"runtime":"mcp","name":"SmokeBot","environment":"dev","profileId":"safe-default"}'
```

Expect `200` for both. Stop the server with Ctrl+C.

**2. End-to-end CLI (interactive)**

```bash
npm link
cd "$(mktemp -d)"
create-atp-agent e2e-test-agent
```

Confirm a project folder is created, dependencies install, and the browser opens to the Welcome screen. After finishing the wizard, `e2e-test-agent/.atp.json` should contain the selected profile, runtime, DID, and agent ID.

**3. Published package (pre-release)**

```bash
npm pack
npm install -g ./create-atp-agent-*.tgz
atp-onboard-agent --no-open
```

Verify the dashboard loads and onboarding completes.

## Development

```bash
cd packages/create-atp-agent
npm install
npm run build
npm link
create-atp-agent test-bot
```

The CLI copies `template/` into the target directory, adjusts `package.json` for TypeScript vs JavaScript, writes a placeholder `.atp.json`, and serves `dashboard/` for the embedded wizard. When the wizard completes, the mock `POST /api/agents/onboard` handler updates `.atp.json` in the scaffolded project with the selected profile.

## Related

- **[atp-sdk](https://www.npmjs.com/package/atp-sdk)** — runtime dependency added to generated projects
- **[Agent Trust Protocol site](https://agenttrustprotocol.com)** — product and docs; production onboarding may use the full Next.js flow (`/onboard/agent`), while this CLI ships a **local** wizard with a mock `POST /api/agents/onboard` for quick demos
