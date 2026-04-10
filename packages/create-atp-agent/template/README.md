# my-atp-agent

Scaffolded with [create-atp-agent](https://www.npmjs.com/package/create-atp-agent) (Agent Trust Protocol).

## Quick start

```bash
npx create-atp-agent my-agent
cd my-agent
npm install
npm start
```

```js
import { Agent } from 'atp-sdk';
const agent = await Agent.quickstart('MyBot');
console.log('Standalone:', agent.isStandalone());
```

> **CommonJS?** This template is **ESM-first** (`"type": "module"`). Top-level `await` needs ESM or a `.mjs` entry file. If you must stay on CommonJS, wrap the quickstart in an async IIFE:
>
> ```js
> (async () => {
>   const { Agent } = await import('atp-sdk');
>   const agent = await Agent.quickstart('MyBot');
> })();
> ```

## Scripts

- `npm start` — run the agent (JavaScript: `agent.mjs`, TypeScript: `tsx agent.ts`)
- `npm run dev` — watch mode
- `npm run build` — TypeScript projects only: compile to `dist/`

## Security profile

Profile selection is stored in `.atp.json` for your reference. Wire it into your runtime using ATP security profiles and `evaluateActionWithProfile` as documented in the ATP SDK.
