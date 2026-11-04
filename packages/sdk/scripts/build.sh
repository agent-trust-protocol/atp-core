#!/usr/bin/env bash
set -euo pipefail

npm run build
npm test -- --runInBand
node --input-type=module -e "import { Agent } from './dist/index.js'; if (typeof Agent.create !== 'function') process.exit(1)"
node scripts/check-publishable.mjs
npm pack --dry-run
