# create-atp-agent

Scaffold a new [Agent Trust Protocol](https://agenttrustprotocol.com) agent with an **ESM-first** template (`"type": "module"`), including a top-level `await` quickstart that runs on Node 18+.

After scaffolding, the CLI **starts an embedded onboarding dashboard** on **port 3456** (or the next free port) and tries to open your browser. Use **`--no-dashboard`** to skip that step, or **`--dashboard-only`** to run the UI without creating a project.

## Usage

```bash
npx create-atp-agent my-agent
npx create-atp-agent --dashboard-only
npx create-atp-agent my-agent --no-dashboard
```

### Flags

| Flag | Purpose |
| --- | --- |
| `--dashboard-only` | Serve only the local onboarding UI (no scaffold). |
| `--no-dashboard` | After scaffold, do not start the onboarding server. |
| `--no-open` | Start the server but do not launch the system browser. |

Set `CREATE_ATP_AGENT_NO_OPEN=1` for the same effect as `--no-open` (useful in CI or SSH sessions).

## Test before production

From this repo:

```bash
cd packages/create-atp-agent
npm install
npm run build
```

**1. Dashboard only (smoke test, no browser)**

```bash
CREATE_ATP_AGENT_NO_OPEN=1 node dist/index.js --dashboard-only
```

In another terminal:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3456/
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

Complete the prompts. Confirm a project folder is created, dependencies install (if you chose yes), and the browser opens to the wizard (unless `CREATE_ATP_AGENT_NO_OPEN=1`).

**3. Published package (pre-release)**

```bash
npm pack
npm install -g ./create-atp-agent-*.tgz
create-atp-agent --dashboard-only --no-open
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

The CLI copies `template/` into the target directory, adjusts `package.json` for TypeScript vs JavaScript, writes `.atp.json` with the selected security profile, and serves `dashboard/` for the embedded wizard.
